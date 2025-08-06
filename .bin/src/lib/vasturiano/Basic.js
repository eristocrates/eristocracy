import ForceGraph3D from '3d-force-graph';

// State management
let graphInstance = null;
let currentData = null;

// Default fallback data (random tree)
const createFallbackData = () => {
  const N = 50; // Smaller default
  return {
    nodes: [...Array(N).keys()].map(i => ({ id: i, name: `Node ${i}` })),
    links: [...Array(N).keys()]
      .filter(id => id)
      .map(id => ({
        source: id,
        target: Math.round(Math.random() * (id - 1))
      }))
  };
};

// UI Element References
const elements = {
  graph: document.getElementById("three-d-graph"),
  panel: document.getElementById("control-panel"),
  selector: document.getElementById("ttl-select"),
  status: document.getElementById("graph-status"),
  metrics: document.getElementById("graph-metrics"),
  performance: document.getElementById("performance-metrics"),
  minimizeBtn: document.getElementById("minimize-btn"),
  closeBtn: document.getElementById("close-btn")
};

// Panel drag functionality
let isDragging = false;
let dragOffset = { x: 0, y: 0 };

function initializePanelDrag() {
  const panel = elements.panel;
  const header = panel.querySelector('.panel-header');

  if (!header) return;

  header.addEventListener('mousedown', (e) => {
    isDragging = true;
    const rect = panel.getBoundingClientRect();
    dragOffset.x = e.clientX - rect.left;
    dragOffset.y = e.clientY - rect.top;

    document.addEventListener('mousemove', onDrag);
    document.addEventListener('mouseup', onDragEnd);
    e.preventDefault();
  });

  function onDrag(e) {
    if (!isDragging) return;

    const x = e.clientX - dragOffset.x;
    const y = e.clientY - dragOffset.y;

    // Keep panel within viewport bounds
    const maxX = window.innerWidth - panel.offsetWidth;
    const maxY = window.innerHeight - panel.offsetHeight;

    panel.style.left = Math.max(0, Math.min(x, maxX)) + 'px';
    panel.style.top = Math.max(0, Math.min(y, maxY)) + 'px';
  }

  function onDragEnd() {
    isDragging = false;
    document.removeEventListener('mousemove', onDrag);
    document.removeEventListener('mouseup', onDragEnd);
  }
}

// Panel controls
function initializePanelControls() {
  if (elements.minimizeBtn) {
    elements.minimizeBtn.addEventListener('click', () => {
      elements.panel.classList.toggle('minimized');
      elements.minimizeBtn.textContent =
        elements.panel.classList.contains('minimized') ? '+' : '−';
    });
  }

  if (elements.closeBtn) {
    elements.closeBtn.addEventListener('click', () => {
      elements.panel.classList.toggle('hidden');
    });
  }

  // Double-click header to minimize/restore
  const header = elements.panel?.querySelector('.panel-header');
  if (header) {
    header.addEventListener('dblclick', () => {
      elements.panel.classList.toggle('minimized');
      elements.minimizeBtn.textContent =
        elements.panel.classList.contains('minimized') ? '+' : '−';
    });
  }
}

// Status updates
function updateStatus(message, isLoading = false) {
  if (elements.status) {
    elements.status.textContent = message;
    elements.status.style.color = isLoading ? '#ffa500' : '#ccc';
  }
}

function updateMetrics(nodeCount, linkCount) {
  if (elements.metrics) {
    elements.metrics.textContent = `${nodeCount} nodes, ${linkCount} links`;
  }
}

function updatePerformance(message, status = 'ready') {
  if (elements.performance) {
    elements.performance.textContent = message;
    elements.performance.style.color =
      status === 'warning' ? '#ffa500' :
        status === 'error' ? '#ff6b6b' : '#10b981';
  }
}

// Initialize graph
function initializeGraph() {
  if (!elements.graph) {
    console.error("Element with id 'three-d-graph' not found.");
    return null;
  }

  const graph = ForceGraph3D()(elements.graph);

  // Configure graph appearance and behavior
  graph
    .backgroundColor('#0a0a0a')
    .showNavInfo(false)
    .nodeLabel('name')
    .nodeColor(() => '#0078d4')
    .linkColor(() => '#333')
    .nodeRelSize(4)
    .linkWidth(1)
    .onNodeHover((node) => {
      if (node) {
        updatePerformance(`Hovering: ${node.name || node.id}`);
      } else {
        updatePerformance('Ready');
      }
    });

  return graph;
}

// Load ontology files list
async function loadOntologyFiles() {
  updateStatus("Loading ontology files...", true);

  try {
    const response = await fetch('/api/ontologies.json');
    const data = await response.json();

    if (data.files && data.files.length > 0) {
      populateFileSelector(data.files);
      updateStatus("Select an ontology to visualize");
      updatePerformance(`${data.files.length} ontologies available`);
    } else {
      throw new Error('No ontology files found');
    }
  } catch (error) {
    console.error('Failed to load ontology files:', error);
    populateFileSelector([
      { filename: 'example.ttl', name: 'example', apiPath: '/api/graph-data/example.ttl' },
      { filename: 'test.ttl', name: 'test', apiPath: '/api/graph-data/test.ttl' }
    ]);
    updateStatus("Using fallback file list");
    updatePerformance("Fallback mode", 'warning');
  }
}

// Populate file selector dropdown
function populateFileSelector(files) {
  if (!elements.selector) return;

  // Clear existing options
  elements.selector.innerHTML = '<option value="">Choose an ontology...</option>';

  // Add file options with file size indicators
  files.forEach(file => {
    const option = document.createElement('option');
    option.value = file.apiPath;
    option.textContent = `${file.name} (${file.filename})`;
    elements.selector.appendChild(option);
  });
}

// Load graph data from API
async function loadGraphData(apiPath) {
  const startTime = performance.now();
  updateStatus("Loading graph data...", true);
  updateMetrics(0, 0);
  updatePerformance("Loading...", 'warning');

  try {
    const response = await fetch(apiPath);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.nodes && data.links) {
      currentData = data;
      if (graphInstance) {
        graphInstance.graphData(data);

        const loadTime = Math.round(performance.now() - startTime);
        updateMetrics(data.nodes.length, data.links.length);
        updateStatus(`Loaded: ${apiPath.split('/').pop()}`);
        updatePerformance(`Loaded in ${loadTime}ms`);

        // Performance warning for large graphs
        if (data.nodes.length > 1000) {
          updatePerformance(`Large graph: ${loadTime}ms`, 'warning');
        }
      }
    } else {
      throw new Error('Invalid graph data format');
    }
  } catch (error) {
    console.error('Failed to load graph data:', error);
    updateStatus(`Error loading: ${error.message}`);
    updatePerformance('Load failed', 'error');

    // Load fallback data
    const fallbackData = createFallbackData();
    if (graphInstance) {
      graphInstance.graphData(fallbackData);
      updateMetrics(fallbackData.nodes.length, fallbackData.links.length);
      updatePerformance('Using fallback data', 'warning');
    }
  }
}

// Handle file selection
function onFileSelect(event) {
  const selectedPath = event.target.value;
  if (selectedPath) {
    loadGraphData(selectedPath);
  } else {
    // Reset to fallback data
    const fallbackData = createFallbackData();
    if (graphInstance) {
      graphInstance.graphData(fallbackData);
      updateMetrics(fallbackData.nodes.length, fallbackData.links.length);
      updateStatus("Using default data");
      updatePerformance("Default mode");
    }
  }
}

// Initialize everything
async function init() {
  console.log('🎬 Initializing Basic 3D Graph with floating control panel...');

  // Initialize graph
  graphInstance = initializeGraph();
  if (!graphInstance) return;

  // Initialize panel functionality
  initializePanelDrag();
  initializePanelControls();

  // Load fallback data initially
  const fallbackData = createFallbackData();
  graphInstance.graphData(fallbackData);
  updateMetrics(fallbackData.nodes.length, fallbackData.links.length);
  updatePerformance("Ready");

  // Set up file selector
  if (elements.selector) {
    elements.selector.addEventListener('change', onFileSelect);
  }

  // Load available ontology files
  await loadOntologyFiles();

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      elements.panel.classList.remove('hidden');
    }
    if (e.key === 'Tab' && e.ctrlKey) {
      elements.panel.classList.toggle('minimized');
      e.preventDefault();
    }
  });

  console.log('✅ Basic 3D Graph with floating controls initialized');
}

// Start initialization
init().catch(console.error);
