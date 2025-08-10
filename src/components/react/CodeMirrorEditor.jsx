import { useEffect, useRef } from 'react';
import { EditorView, basicSetup } from "codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { html } from "@codemirror/lang-html";
import { oneDark } from "@codemirror/theme-one-dark";
import { linter, lintGutter } from "@codemirror/lint";
import * as acorn from 'acorn';
import { debounce } from 'lodash-es';
import { state } from '../../lib/state';
import { repo } from '../../lib/repo/index';
import { subscribeKey } from 'valtio/utils';

// --- Pluggable, Type-Aware Validator Registry ---
const validatorRegistry = {
  javascript: (code) => {
    try {
      acorn.parse(code, { ecmaVersion: 'latest', sourceType: 'module' });
      return null; // No error
    } catch (error) {
      return error; // Return the error object on failure
    }
  },
  html: (code) => {
    // A basic HTML validator using the browser's own parser.
    // This is not a linter, but it catches fundamental syntax errors.
    if (typeof DOMParser === 'undefined') return null; // SSR safety
    const parser = new DOMParser();
    const doc = parser.parseFromString(code, "text/html");
    if (doc.getElementsByTagName("parsererror").length > 0) {
      // Create a simplified error object that mimics Acorn's structure for consistency.
      const errorNode = doc.getElementsByTagName("parsererror")[0];
      const message = errorNode.innerText.split('\n')[0];
      return new Error(`HTML Parse Error: ${message}`);
    }
    return null;
  },
  // Default for types without a specific validator
  default: () => null,
};

// --- CodeMirror Linting Source ---
// This function uses the validatorRegistry to provide on-the-fly syntax checking.
const modularLinter = (artifactType) => linter(view => {
  const diagnostics = [];
  const code = view.state.doc.toString();
  const validator = validatorRegistry[artifactType] || validatorRegistry.default;
  const error = validator(code);

  if (error) {
    // Try to extract line/col for JS errors
    const match = / \((\d+):(\d+)\)$/.exec(error.message);
    if (match) {
      const line = parseInt(match[1], 10);
      const from = view.state.doc.line(line).from + parseInt(match[2], 10);
      diagnostics.push({
        from,
        to: from + 1,
        severity: "error",
        message: error.message.replace(/ \(\d+:\d+\)$/, ''),
      });
    } else {
      // For general errors (like HTML), just mark the start of the document.
      diagnostics.push({
        from: 0,
        to: 1,
        severity: "error",
        message: error.message,
      });
    }
  }
  return diagnostics;
});

// Heuristic: run JS only when it appears syntactically complete enough to avoid noisy runtime ReferenceErrors
function isLikelyCompleteJavaScript(code) {
  const t = code.trim();
  if (t === '') return false;
  // Don't run if cursor appears at end of an identifier or after a dot (still typing)
  if (/[a-zA-Z_$][\w$]*$/.test(t)) return false;
  if (/\.$/.test(t)) return false;
  // Simple bracket balancing check
  let p = 0, b = 0, c = 0;
  for (let i = 0; i < t.length; i++) {
    const ch = t[i];
    if (ch === '(') p++; else if (ch === ')') p--;
    if (ch === '[') b++; else if (ch === ']') b--;
    if (ch === '{') c++; else if (ch === '}') c--;
    if (p < 0 || b < 0 || c < 0) return false;
  }
  if (p !== 0 || b !== 0 || c !== 0) return false;
  return true;
}

// The CodeMirrorEditor is now a more "controlled" component.
// It receives a debounced callback from its parent and is not responsible for state management itself.
export function CodeMirrorEditor({ artifactId, artifactType, onValidChange }) {
  const editorRef = useRef(null);
  const viewRef = useRef(null);
  const applyingExternalRef = useRef(false);
  const initialCode = state.activeArtifactContent;

  useEffect(() => {
    if (!editorRef.current) return;

    const stateUpdateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        // Ignore programmatic doc updates from external state sync
        if (applyingExternalRef.current) return;
        const code = update.state.doc.toString();
        const validator = validatorRegistry[artifactType] || validatorRegistry.default;
        const error = validator(code);
        
        if (!error) {
          if (artifactType === 'javascript') {
            if (isLikelyCompleteJavaScript(code)) {
              onValidChange(code, artifactId);
            }
          } else {
            onValidChange(code, artifactId);
          }
        }
        // If there's an error, do nothing. The linter shows it.
      }
    });
    
    // Dynamically select the language mode and extensions for CodeMirror
    const extensions = [
      basicSetup,
      oneDark,
      stateUpdateListener,
      EditorView.lineWrapping,
      EditorView.theme({
        "&": { height: "100%" },
        ".cm-scroller": { overflow: "auto" }
      })
    ];

    if (artifactType === 'javascript' || artifactType === 'html') {
      extensions.push(lintGutter());
      extensions.push(modularLinter(artifactType));
    }

    if (artifactType === 'javascript') {
      extensions.push(javascript());
    } else if (artifactType === 'html') {
      extensions.push(html());
    }

    const view = new EditorView({
      parent: editorRef.current,
      doc: initialCode,
      extensions: extensions,
    });
    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, [editorRef, artifactId, artifactType]); // Re-initialize if the artifact or type changes

  // Sync editor content when external state changes (e.g., after refresh or doc switch)
  useEffect(() => {
    const unsubscribe = subscribeKey(state, 'activeArtifactContent', (next) => {
      const view = viewRef.current;
      if (!view) return;
      const current = view.state.doc.toString();
      if (current === next || typeof next !== 'string') return;
      applyingExternalRef.current = true;
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: next }
      });
      applyingExternalRef.current = false;
    });
    return () => unsubscribe();
  }, []);

  return <div ref={editorRef} style={{ height: '100%', overflow: 'hidden' }} />;
} 