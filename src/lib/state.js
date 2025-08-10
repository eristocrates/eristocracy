import { proxy } from 'valtio';

/**
 * Valtio State Proxy
 * The single source of truth for the entire workspace application state.
 * It does NOT hold document content, but rather pointers and UI settings.
 */
export const state = proxy({
  // -- Document Management State --
  artifacts: [], // A list of all available artifacts, loaded from RxDB.
  activeArtifactId: null, // The ID of the document currently being edited.
  editingArtifactId: null, // The ID of the artifact currently being renamed.
  activeArtifactType: 'javascript', // New: 'javascript' | 'html' etc.

  // ARCHITECTURAL REFACTOR: Decouple editor content from rendered content
  activeArtifactContent: '// Select or create an artifact to begin', // Raw content from editor, source of truth
  renderedContent: '// Select or create an artifact to begin',     // Last known GOOD content for graphical view
  executionError: null, // Holds the latest parse or runtime error string
  executionPending: false, // True while a run is in flight

  // -- UI/Layout State --
  mode: 'both', // 'editor', 'feedback', or 'both'
  feedbackParams: {
    form: 'textual', // 'textual', 'structural', 'graphical'
  },
  contextMenu: {
    visible: false,
    x: 0,
    y: 0,
    artifactId: null,
  },

  // Console buffers
  consoleLive: [],   // Logs from the current (in-flight) run
  consoleStable: [], // Logs from the last successful run
}); 