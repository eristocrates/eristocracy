import { useEffect, useRef } from 'react';
import { NodeEditor, ClassicPreset } from 'rete';
import type { GetSchemes } from 'rete';
import { AreaPlugin, AreaExtensions } from 'rete-area-plugin';
import { ConnectionPlugin, Presets as ConnectionPresets } from 'rete-connection-plugin';
import { ReactPlugin, Presets } from 'rete-react-plugin';
import type { ReactArea2D } from 'rete-react-plugin';
import { createRoot } from 'react-dom/client';

// Define types following the official docs
type Schemes = GetSchemes<
  ClassicPreset.Node,
  ClassicPreset.Connection<ClassicPreset.Node, ClassicPreset.Node>
>;

type AreaExtra = ReactArea2D<Schemes>;

export default function ReteEditor() {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<NodeEditor<Schemes> | null>(null);

  useEffect(() => {
    // Suppress Firefox mozInputSource deprecation warnings from Rete
    const originalWarn = console.warn;
    console.warn = (...args) => {
      const message = args.join(' ');
      if (message.includes('mozInputSource is deprecated')) {
        return; // Suppress this specific warning
      }
      originalWarn.apply(console, args);
    };

    const initializeEditor = async () => {
      if (!containerRef.current || editorRef.current) return;

      // Clear container
      containerRef.current.innerHTML = '';

      // Initialize editor with proper typing
      const editor = new NodeEditor<Schemes>();
      editorRef.current = editor;

      // Create area plugin
      const area = new AreaPlugin<Schemes, AreaExtra>(containerRef.current);
      const render = new ReactPlugin<Schemes, AreaExtra>({ createRoot });

      // Set up classic preset
      render.addPreset(Presets.classic.setup());

      // Use plugins
      editor.use(area);
      area.use(render);

      // Create sockets for different data types
      const graphDataSocket = new ClassicPreset.Socket('graphData');

      // Create RDF Loader node with better labeling
      const rdfLoader = new ClassicPreset.Node('RDF Loader');
      
      // For now, we'll use InputControls but we can enhance these later
      // File selector - editable so user can change it
      const fileSelect = new ClassicPreset.InputControl('text', { 
        initial: 'arcaea.ttl'
      });
      rdfLoader.addControl('file', fileSelect);
      
      // Status display - shows loading state
      const statusDisplay = new ClassicPreset.InputControl('text', { 
        initial: 'Ready (select: arcaea.ttl, arcaea-one.ttl, pizza.ttl)',
        readonly: true
      });
      rdfLoader.addControl('status', statusDisplay);
      
      // Graph data output
      rdfLoader.addOutput('graphData', new ClassicPreset.Output(graphDataSocket, 'Graph Data'));
      await editor.addNode(rdfLoader);

      // Create Console Output node with better labeling
      const consoleOutput = new ClassicPreset.Node('Console Output');
      
      // Graph data input
      consoleOutput.addInput('data', new ClassicPreset.Input(graphDataSocket, 'Data In'));
      
      // Data preview - shows first few nodes
      const dataPreview = new ClassicPreset.InputControl('text', { 
        initial: 'Waiting for data...',
        readonly: true
      });
      consoleOutput.addControl('preview', dataPreview);
      
      // Stats display - shows counts
      const statsDisplay = new ClassicPreset.InputControl('text', { 
        initial: 'Stats: 0 nodes, 0 links, 0 triples',
        readonly: true
      });
      consoleOutput.addControl('stats', statsDisplay);
      
      await editor.addNode(consoleOutput);

      // Position nodes
      await area.translate(rdfLoader.id, { x: 50, y: 100 });
      await area.translate(consoleOutput.id, { x: 400, y: 100 });

      // Create connection between nodes
      await editor.addConnection(new ClassicPreset.Connection(rdfLoader, 'graphData', consoleOutput, 'data'));

      // Add connection plugin for interactive connections
      const connection = new ConnectionPlugin<Schemes, AreaExtra>();
      connection.addPreset(ConnectionPresets.classic.setup());
      area.use(connection);

      // Make nodes selectable
      AreaExtensions.selectableNodes(area, AreaExtensions.selector(), {
        accumulating: AreaExtensions.accumulateOnCtrl()
      });

      // Add nodes order extension
      AreaExtensions.simpleNodesOrder(area);

      // Fit viewport to show all nodes
      setTimeout(() => {
        AreaExtensions.zoomAt(area, editor.getNodes());
      }, 100);

      console.log('Rete editor initialized successfully');
    };

    initializeEditor().catch(console.error);

    // Cleanup
    return () => {
      if (editorRef.current) {
        editorRef.current.clear();
        editorRef.current = null;
      }
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      style={{ 
        width: '100%', 
        height: '500px', 
        border: '2px solid #444',
        borderRadius: '8px',
        background: '#1a1a1a',
        overflow: 'hidden'
      }}
    />
  );
}
