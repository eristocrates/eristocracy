import { useEffect, useRef, useState, useMemo } from 'react';
import { useSnapshot } from 'valtio';
import { subscribeKey } from 'valtio/utils';
import { state } from '../../lib/state';
import { repo } from '../../lib/repo/index';
import { CodeMirrorEditor } from './CodeMirrorEditor';
import * as acorn from 'acorn';
import { v4 as uuidv4 } from 'uuid';
import { templateModules } from 'virtual:templates';
import { templateMeta } from 'virtual:templates';
import { debounce } from 'lodash';

// --- Dynamic Artifact Templates ---
// We now use a two-stage loading process.
// 1. Discover available templates from virtual:templates keys (bundler source of truth).
// 2. Dynamically create a loader function that can fetch content on demand.

function createTemplateLoader() {
  const templates = {};
  const templatePaths = Object.keys(templateModules);
  for (const path of templatePaths) {
    const filename = path.split('/').pop();
    const extension = filename.split('.').pop();
    const parts = path.split('/');
    const base = filename.replace(`.${extension}`, '');
    const toTitle = (s) => s.split(/[-_./]/g).filter(Boolean).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    const relParts = path.replace(/^\/+/, '').split('/');
    let name;
    if (relParts[0] === 'thirdParty' && relParts[1] === 'repos' && relParts.length >= 4) {
      const repo = relParts[2];
      const parentFolder = relParts[relParts.length - 2] || '';
      name = `${toTitle(repo)} ${parentFolder ? toTitle(parentFolder) + ' ' : ''}${toTitle(base)}`;
    } else {
      const folder = parts.length > 1 ? parts[parts.length - 2] : '';
      name = `${folder ? toTitle(folder) + ' ' : ''}${toTitle(base)}`;
    }
    const type = extension === 'html' ? 'html' : 'javascript';
    
    templates[path] = {
      name,
      type,
      // Return the raw, lazily-loaded string content
      getContent: async () => {
        const importFn = templateModules[path];
        if (typeof importFn === 'function') {
          return await importFn(); // Dynamic import that loads on demand
        }
        return '// Template content not found';
      },
    };
  }
  return templates;
}
const templates = createTemplateLoader();

// --- Sandbox HTML Builder ---
// This utility function constructs the complete HTML document for an iframe sandbox.
// It's used by both the visible graphical sandbox and the hidden execution sandbox.
function buildSandboxHtml(code, type, isExecutionOnly = false, baseHref) {
  // For full HTML artifacts, we honor its content but ensure base and harness
  if (type === 'html') {
    const baseTag = baseHref ? `<base href="${baseHref}/">` : '';

    // Remove any existing importmap blocks from the example
    let cleaned = code.replace(/<script\s+type=["']importmap["'][\s\S]*?<\/script>/gi, '');
    // Normalize three/webgpu imports to three (WebGPU build not supported here)
    cleaned = cleaned.replace(/(["'])three\/webgpu\1/g, `'three'`);

    // Our normalized import map to CDN (production-safe)
    const importMap = {
      imports: {
        "three": "https://cdn.jsdelivr.net/npm/three@0.179.1/build/three.module.js",
        "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.179.1/examples/jsm/",
        "3d-force-graph": "https://cdn.jsdelivr.net/npm/3d-force-graph@1.78.4/dist/3d-force-graph.module.js",
        "pixi.js": "https://cdn.jsdelivr.net/npm/pixi.js@8.12.0/dist/pixi.mjs"
      }
    };
    const importMapTag = `<script type="importmap">\n${JSON.stringify(importMap, null, 2)}\n</script>`;

    const harness = `
      <script>
        window.onerror = (message, source, lineno, colno, error) => {
          window.parent.postMessage({ type: 'error', message: error ? error.stack : message }, '*');
          return true;
        };
        const originalConsoleLog = console.log;
        console.log = (...args) => {
          window.parent.postMessage({ type: 'log', message: args }, '*');
        };
      </script>
    `;

    // Insert base, importmap, and harness into head if present, otherwise wrap
    if (/<\/head>/i.test(cleaned)) {
      cleaned = cleaned.replace(/<head>/i, `<head>${baseTag}${importMapTag}${harness}`);
      return cleaned;
    }
    return `<!DOCTYPE html><html><head>${baseTag}${importMapTag}${harness}</head><body>${cleaned}</body></html>`;
  }

  // For JavaScript, we inject it into a boilerplate HTML structure.
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Sandbox</title>
      <style>
        body { margin: 0; overflow: hidden; background-color: #ffffff; color: #111; font-family: sans-serif; }
        canvas { display: block; width: 100%; height: 100%; }
      </style>
      <script type="importmap">
        ${JSON.stringify({
          imports: {
            "pixi.js": "https://cdn.jsdelivr.net/npm/pixi.js@8.12.0/dist/pixi.mjs",
            "three": "https://cdn.jsdelivr.net/npm/three@0.179.1/build/three.module.js",
            "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.179.1/examples/jsm/"
          }
        }, null, 2)}
      </script>
      <script>
        // This harness script captures logs and errors from the sandbox.
        if (${isExecutionOnly}) {
          window.onerror = (message, source, lineno, colno, error) => {
            window.parent.postMessage({ type: 'error', message: error ? error.stack : message }, '*');
            return true;
          };
          const originalConsoleLog = console.log;
          console.log = (...args) => {
            window.parent.postMessage({ type: 'log', message: args }, '*');
            // Intentionally do not forward to original console to avoid duplicate devtools noise
          };
        }
      </script>
    </head>
    <body>
      <script type="module">
        ${isExecutionOnly ? `
        try {
          console.debug('[sandbox] executing code, len=', ${code.length});
          ${code}
          window.parent.postMessage({ type: 'success' }, '*');
        } catch (e) {
          window.parent.postMessage({ type: 'error', message: e && e.stack ? e.stack : String(e) }, '*');
        }
        ` : `
          ${code}
        `}
      </script>
    </body>
    </html>
  `;
}

// --- Context Menu Component ---
const ContextMenu = () => {
  const snap = useSnapshot(state);
  if (!snap.contextMenu.visible) return null;

  const handleRename = () => {
    state.editingArtifactId = snap.contextMenu.artifactId;
    state.contextMenu.visible = false;
  };

  const handleDelete = async () => {
    if (snap.contextMenu.artifactId && confirm('Are you sure you want to delete this artifact?')) {
      await repo.remove(snap.contextMenu.artifactId);
      if (state.activeArtifactId === snap.contextMenu.artifactId) {
        state.activeArtifactId = null;
      }
    }
    state.contextMenu.visible = false;
  };

  return (
    <div 
      style={{ 
        position: 'absolute', 
        top: snap.contextMenu.y, 
        left: snap.contextMenu.x,
        background: '#3c3c3c',
        border: '1px solid #555',
        borderRadius: '4px',
        padding: '5px',
        zIndex: 1000,
      }}
    >
      <button onClick={handleRename}>Rename</button>
      <button onClick={handleDelete} style={{ marginTop: '5px' }}>Delete</button>
    </div>
  );
};

// --- Feedback Component Definitions ---
// These are the individual "leaf" components that know how to render a specific type of feedback.

const StubFeedback = ({ name }) => (
  <div style={{ padding: '20px', color: '#888' }}>
    <h2>{name} Feedback (Stub)</h2>
    <p>This feedback strategy is not yet implemented.</p>
  </div>
);

// --- The Iframe Sandbox Components ---

// 1. The VISIBLE Sandbox for Graphical Feedback
// This iframe ONLY displays the last known good code (`renderedContent`).
// It does not execute code directly; it just shows the result.
const GraphicalSandbox = () => {
  const snap = useSnapshot(state);
  const baseHref = snap.activeArtifactPath && templateMeta[snap.activeArtifactPath]?.baseHref;
  return (
    <iframe
      key={snap.renderedContent} // Re-renders only on successful code execution
      srcDoc={buildSandboxHtml(snap.renderedContent, snap.activeArtifactType, false, baseHref)} // `isExecutionOnly = false`
      title="Visible Sandboxed Feedback"
      sandbox="allow-scripts"
      style={{ width: '100%', height: '100%', border: 'none' }}
    />
  );
};

// 2. The HIDDEN Sandbox for Code Execution
// This iframe is never visible. It's the "staging" environment.
// It runs the latest code from the editor (`activeArtifactContent`) and reports success or failure.
const ExecutionSandbox = () => {
  const snap = useSnapshot(state);
  const baseHref = snap.activeArtifactPath && templateMeta[snap.activeArtifactPath]?.baseHref;
  return (
    <iframe
      key={snap.activeArtifactContent} // Re-renders and executes on every keystroke (debounced)
      srcDoc={buildSandboxHtml(snap.activeArtifactContent, snap.activeArtifactType, true, baseHref)}
      title="Execution Sandbox"
      sandbox="allow-scripts"
      style={{ display: 'none' }} // Always hidden
    />
  );
};

// --- Updated Feedback Components ---
const ConsoleFeedback = () => {
  const snap = useSnapshot(state);
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '5px 10px', fontSize: '12px', background: '#333' }}>Console Feedback</div>
      {/* Pending indicator */}
      {snap.executionPending && (
        <div style={{ padding: '6px 10px', fontSize: '12px', color: '#aaa', borderBottom: '1px dashed #444' }}>
          Pending...
        </div>
      )}
      {/* Error banner (non-destructive) */}
      {snap.executionError && (
        <pre style={{ padding: '10px', fontFamily: 'monospace', color: '#ff5555', background: '#2a2a2a', margin: 0, borderBottom: '1px solid #444' }}>
          <strong>Execution Error:</strong><br />
          {snap.executionError}
        </pre>
      )}
      {/* Stable logs only */}
      <pre style={{ padding: '10px', flex: 1, fontFamily: 'monospace', whiteSpace: 'pre-wrap', margin: 0, overflowY: 'auto' }}>
        {snap.consoleStable.length > 0
          ? snap.consoleStable.map((line, i) => <div key={i}>{line}</div>)
          : '// Console output will appear here...'
        }
      </pre>
    </div>
  );
};

const AstFeedback = () => {
  const snap = useSnapshot(state);
  let output = '';
  try {
    // AST should reflect the live code from the editor
    const ast = acorn.parse(snap.activeArtifactContent, { ecmaVersion: 'latest', sourceType: 'module' });
    output = JSON.stringify(ast, null, 2);
  } catch (e) {
    output = `AST Parsing Error:\n${e.message}`;
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '5px 10px', fontSize: '12px', background: '#333' }}>Structural Feedback (AST)</div>
      <pre style={{ padding: '10px', flex: 1, fontFamily: 'monospace', whiteSpace: 'pre-wrap', margin: 0 }}>
        {output}
      </pre>
    </div>
  );
};

// --- Main Application Components ---

const ArtifactListItem = ({ doc }) => {
  const snap = useSnapshot(state);
  const isEditing = snap.editingArtifactId === doc.id;
  const isActive = snap.activeArtifactId === doc.id;

  const handleSelect = () => {
    state.activeArtifactId = doc.id;
  };

  const handleDoubleClick = () => {
    state.editingArtifactId = doc.id;
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
    state.contextMenu = {
      visible: true,
      x: e.clientX,
      y: e.clientY,
      artifactId: doc.id,
    };
  };

  const handleRename = async (newName) => {
    if (newName && newName !== doc.name) {
      await repo.updateMeta(doc.id, { name: newName });
    }
    state.editingArtifactId = null; // Exit editing mode
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleRename(e.target.value);
    } else if (e.key === 'Escape') {
      state.editingArtifactId = null;
    }
  };

  return (
    <li
      onClick={handleSelect}
      onDoubleClick={handleDoubleClick}
      onContextMenu={handleContextMenu}
      style={{
        padding: '8px',
        cursor: 'pointer',
        background: isActive ? '#0078d4' : 'transparent',
        borderRadius: '4px',
        marginBottom: '4px',
      }}
    >
      {isEditing ? (
        <input
          type="text"
          defaultValue={doc.name}
          onBlur={(e) => handleRename(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
          style={{ width: '100%', boxSizing: 'border-box' }}
        />
      ) : (
        doc.name
      )}
    </li>
  );
};

const ArtifactsList = () => {
  const snap = useSnapshot(state);
  const [selectedTemplate, setSelectedTemplate] = useState('');

  const handleBlankArtifact = async () => {
    const id = await repo.create({
      name: `Untitled #${state.artifacts.length + 1}`,
      type: 'javascript',
      content: '// Your code here\n'
    });
    state.activeArtifactId = id;
  };

  const handleRandomArtifact = async () => {
    const templatePaths = Object.keys(templates);
    const randomPath = templatePaths[Math.floor(Math.random() * templatePaths.length)];
    const template = templates[randomPath];
    const content = await template.getContent(); // Load the content on demand (string)

    const id = await repo.create({
      name: `${template.name} #${state.artifacts.length + 1}`,
      type: template.type,
      content,
      path: randomPath
    });
    state.activeArtifactId = id;
  };

  const handleLoadRandom = async () => {
    if (!state.activeArtifactId) return;
    const templatePaths = Object.keys(templates);
    const randomPath = templatePaths[Math.floor(Math.random() * templatePaths.length)];
    const template = templates[randomPath];
    const content = await template.getContent();
    await repo.updateMeta(state.activeArtifactId, { type: template.type, path: randomPath });
    await repo.updateContent(state.activeArtifactId, content);
    state.activeArtifactType = template.type;
    state.activeArtifactPath = randomPath;
  };

  const handleSelectTemplate = async () => {
    if (!selectedTemplate) return;
    
    const template = templates[selectedTemplate];
    const content = await template.getContent();

    const id = await repo.create({
      name: `${template.name} #${state.artifacts.length + 1}`,
      type: template.type,
      content,
      path: selectedTemplate
    });
    state.activeArtifactId = id;
    setSelectedTemplate(''); // Reset dropdown
  };

  const handleLoadSelected = async () => {
    if (!selectedTemplate || !state.activeArtifactId) return;
    const template = templates[selectedTemplate];
    const content = await template.getContent();
    // Update meta to reflect the template's type and origin path
    await repo.updateMeta(state.activeArtifactId, { type: template.type, path: selectedTemplate });
    // Update content of the current artifact
    await repo.updateContent(state.activeArtifactId, content);
    // Optimistic local hints
    state.activeArtifactType = template.type;
    state.activeArtifactPath = selectedTemplate;
  };

  const templateOptions = Object.entries(templates).map(([path, template]) => ({
    path,
    name: template.name,
    type: template.type
  })).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div style={{ padding: '10px', borderRight: '1px solid #444', minWidth: '200px', overflowY: 'auto' }}>
      <h3 style={{ marginTop: 0 }}>Artifacts</h3>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {snap.artifacts.map(doc => (
          <ArtifactListItem key={doc.id} doc={doc} />
        ))}
      </ul>
      
      {/* Three distinct creation buttons */}
      <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <button onClick={handleBlankArtifact} style={{ width: '100%', padding: '8px', fontSize: '12px' }}>
          New Blank Artifact
        </button>
        
        {/* Random actions side-by-side */}
        <div style={{ display: 'flex', gap: '6px' }}>
          <button onClick={handleRandomArtifact} style={{ flex: 1, padding: '8px', fontSize: '12px' }}>
            Create Random Artifact
          </button>
          <button onClick={handleLoadRandom} disabled={!state.activeArtifactId} style={{ flex: 1, padding: '8px', fontSize: '12px', opacity: state.activeArtifactId ? 1 : 0.5, cursor: state.activeArtifactId ? 'pointer' : 'not-allowed' }}>
            Load Random (into current)
          </button>
        </div>
        
        {/* Selected template controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <select 
            value={selectedTemplate} 
            onChange={(e) => setSelectedTemplate(e.target.value)}
            style={{ width: '100%', padding: '6px', fontSize: '12px' }}
          >
            <option value="">Choose Example...</option>
            {templateOptions.map(({ path, name, type }) => (
              <option key={path} value={path}>
                {name} ({type})
              </option>
            ))}
          </select>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button 
              onClick={handleSelectTemplate} 
              disabled={!selectedTemplate}
              style={{ 
                flex: 1,
                padding: '6px', 
                fontSize: '12px',
                opacity: selectedTemplate ? 1 : 0.5,
                cursor: selectedTemplate ? 'pointer' : 'not-allowed'
              }}
            >
              Create Selected
            </button>
            <button
              onClick={handleLoadSelected}
              disabled={!selectedTemplate || !state.activeArtifactId}
              style={{
                flex: 1,
                padding: '6px',
                fontSize: '12px',
                opacity: selectedTemplate && state.activeArtifactId ? 1 : 0.5,
                cursor: selectedTemplate && state.activeArtifactId ? 'pointer' : 'not-allowed'
              }}
            >
              Load Selected (into current)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const EditorPanel = ({ onValidChange }) => {
  const snap = useSnapshot(state);
  
  if (!snap.activeArtifactId) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>
        <p>Select an artifact or create a new one to begin.</p>
      </div>
    );
  }
  
  // Pass the active artifact's type to the editor
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
      <CodeMirrorEditor
        key={snap.activeArtifactId}
        artifactId={snap.activeArtifactId}
        artifactType={snap.activeArtifactType}
        onValidChange={onValidChange}
      />
    </div>
  );
};

const FeedbackView = () => {
  const snap = useSnapshot(state);

  // ARCHITECTURAL FIX:
  // Always render the IframeFeedback to ensure code execution happens in the background.
  // The selected feedback 'form' now only controls VISIBILITY.
  const showGraphical = snap.feedbackParams.form === 'graphical';
  const showTextual = snap.feedbackParams.form === 'textual';
  const showStructural = snap.feedbackParams.form === 'structural';

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, borderLeft: '1px solid #444', position: 'relative' }}>
      {/* 1. The hidden execution sandbox is ALWAYS rendered to run the latest code (only when a doc is active). */}
      {snap.activeArtifactId && <ExecutionSandbox />}

      {/* 2. The visible graphical sandbox. */}
      <div style={{ display: showGraphical ? 'block' : 'none', width: '100%', height: '100%' }}>
        <GraphicalSandbox />
      </div>

      {/* 3. The textual console view */}
      {showTextual && (
        <ConsoleFeedback />
      )}

      {/* 4. The structural AST view */}
      {showStructural && (
        <AstFeedback />
      )}
    </div>
  );
};

const ControlsBar = () => {
  const snap = useSnapshot(state);

  const handleModeChange = (mode) => {
    state.mode = mode;
  };

  const handleFormChange = (form) => {
    state.feedbackParams.form = form;
  };

  const feedbackForms = ['textual', 'structural', 'graphical'];

  return (
    <div style={{ height: '40px', background: '#2a2a2a', display: 'flex', alignItems: 'center', padding: '0 10px', borderTop: '1px solid #444' }}>
      <button onClick={() => handleModeChange('editor')} className={snap.mode === 'editor' ? 'active' : ''}>Editor</button>
      <button onClick={() => handleModeChange('feedback')} className={snap.mode === 'feedback' ? 'active' : ''}>Feedback</button>
      <button onClick={() => handleModeChange('both')} className={snap.mode === 'both' ? 'active' : ''}>Both</button>
      <div style={{ margin: '0 10px', borderLeft: '1px solid #444', height: '20px' }}></div>
      <label style={{ marginRight: '5px', fontSize: '12px' }}>Feedback Form:</label>
      <div style={{ display: 'flex', gap: '5px' }}>
        {feedbackForms.map(form => (
          <button 
            key={form} 
            onClick={() => handleFormChange(form)} 
            className={snap.feedbackParams.form === form ? 'active' : ''}
          >
            {form.charAt(0).toUpperCase() + form.slice(1)}
          </button>
        ))}
      </div>
    </div>
  );
};

// Debounced function to update state and persist data.
// This now runs for both valid JS and any HTML changes.
const debouncedStateUpdater = debounce(async (code, artifactId) => {
  // 1. Clear the live console for the new execution run.
  state.consoleOutput = [];
  // 2. Update the active content, which will trigger the hidden execution sandbox.
  state.activeArtifactContent = code;
  // 3. Persist the change to the database.
  await repo.updateContent(artifactId, code);
}, 300);

export default function Workspace() {
  const snap = useSnapshot(state);

  // --- Debounced Handler for Code Changes ---
  const handleCodeChange = useMemo(() => {
    return debounce(async (code, artifactId) => {
      console.log('[Workspace] handleCodeChange (debounced) len=', code.length, 'artifactId=', artifactId);
      // Stable-first: do not clear stable logs; start a new live buffer and mark pending
      state.consoleLive = [];
      state.executionPending = true;
      state.activeArtifactContent = code; // triggers execution sandbox
      await repo.updateContent(artifactId, code);
    }, 300);
  }, []);

  // Debug: log whenever the execution sandbox input changes
  useEffect(() => {
    const unsub = subscribeKey(state, 'activeArtifactContent', (v) => {
      console.log('[Workspace] activeArtifactContent updated, len=', (v || '').length);
    });
    return () => unsub();
  }, []);

  // Effect to load the list of artifacts when the app starts.
  useEffect(() => {
    let subscription;
    const start = async () => {
      await repo.init();
      subscription = repo.watchAll().subscribe((docs) => {
        state.artifacts = docs;
        if (!state.activeArtifactId && docs.length > 0) {
          state.activeArtifactId = docs[0].id;
        }
      });
    };
    start();
    return () => subscription?.unsubscribe();
  }, []);

  // Effect to subscribe to the currently active document and sync its content to the UI state.
  // This is the core of the new reactive data pipeline.
  useEffect(() => {
    let subscription;
    const syncActiveArtifact = async () => {
      if (!snap.activeArtifactId) {
        state.activeArtifactContent = '// No document selected';
        state.renderedContent = '// No document selected';
        state.consoleOutput = [];
        state.stableConsoleOutput = [];
        state.executionError = null;
        return;
      }
      subscription = repo.watchOne(snap.activeArtifactId).subscribe((doc) => {
        if (doc) {
          // When a doc is loaded, sync all content states
          state.activeArtifactContent = doc.content;
          state.renderedContent = doc.content; // Assume it's valid initially
          state.consoleOutput = []; // Clear live logs
          state.stableConsoleOutput = []; // Clear stable logs
          state.executionError = null; // Clear old errors
          state.activeArtifactType = doc.type;
          if (doc.path) state.activeArtifactPath = doc.path;
        }
      });
    };

    syncActiveArtifact();
    return () => subscription?.unsubscribe();
  }, [snap.activeArtifactId]); // Re-subscribe whenever the active artifact changes.

  // Effect to handle clicking outside the context menu to close it.
  useEffect(() => {
    const handleClickOutside = () => {
      if (state.contextMenu.visible) {
        state.contextMenu.visible = false;
      }
    };
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);
  
  // This effect listens for all messages FROM the sandbox.
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data) {
        switch (event.data.type) {
          case 'log': {
            const formattedMessage = Array.isArray(event.data.message)
              ? event.data.message.map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)).join(' ')
              : String(event.data.message);
            // Append to live buffer only
            state.consoleLive = [...state.consoleLive, `[LOG]: ${formattedMessage}`];
            break;
          }
          case 'error': {
            state.executionError = String(event.data.message);
            state.executionPending = false;
            // Keep stable logs; optionally retain consoleLive for a "Live" view
            break;
          }
          case 'success': {
            // Promote live to stable and clear error/pending
            state.consoleStable = [...state.consoleLive];
            state.renderedContent = state.activeArtifactContent;
            state.executionError = null;
            state.executionPending = false;
            break;
          }
        }
      }
    };
    
    // This is now handled correctly by the debounced handler owned by this component.
    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#1e1e1e', color: '#ccc' }}>
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <ArtifactsList />
        {snap.mode !== 'feedback' && <EditorPanel onValidChange={handleCodeChange} />}
        {snap.mode !== 'editor' && <FeedbackView />}
      </div>
      <ControlsBar />
      <ContextMenu />
    </div>
  );
} 