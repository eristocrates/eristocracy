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
  const containerRef = useRef(null);
  const editorRef = useRef(null);

  useEffect(() => {
    const initializeEditor = async () => {
      if (!containerRef.current || editorRef.current) return;

      // Clear container
      containerRef.current.innerHTML = '';

      // Initialize editor
      const editor = new NodeEditor();
      editorRef.current = editor;

      // Create area plugin
      const area = new AreaPlugin(containerRef.current);
      const render = new ReactPlugin({ createRoot });

      // Set up classic preset
      render.addPreset(Presets.classic.setup());

      // Use plugins
      editor.use(area);
      area.use(render);

      // Create socket for connections
      const socket = new ClassicPreset.Socket('socket');

      // Create first node (Node A)
      const nodeA = new ClassicPreset.Node('A');
      nodeA.addControl('a', new ClassicPreset.InputControl('text', {}));
      nodeA.addOutput('a', new ClassicPreset.Output(socket));
      await editor.addNode(nodeA);

      // Create second node (Node B)
      const nodeB = new ClassicPreset.Node('B');
      nodeB.addControl('b', new ClassicPreset.InputControl('text', {}));
      nodeB.addInput('b', new ClassicPreset.Input(socket));
      await editor.addNode(nodeB);

      // Position second node
      await area.translate(nodeB.id, { x: 270, y: 0 });

      // Create connection between nodes
      await editor.addConnection(new ClassicPreset.Connection(nodeA, 'a', nodeB, 'b'));

      // Add connection plugin for interactive connections
      const connection = new ConnectionPlugin();
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
        height: '400px', 
        border: '1px solid #ccc',
        borderRadius: '4px',
        background: '#f5f5f5'
      }}
    />
  );
}
