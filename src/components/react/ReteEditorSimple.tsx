import React, { useEffect, useRef, useState } from 'react';
import { NodeEditor, ClassicPreset, Scope } from 'rete';
import type { GetSchemes } from 'rete';
import { AreaPlugin, AreaExtensions } from 'rete-area-plugin';
import { ConnectionPlugin, Presets as ConnectionPresets } from 'rete-connection-plugin';
import { ReactPlugin, Presets } from 'rete-react-plugin';
import type { ReactArea2D } from 'rete-react-plugin';
import { createRoot } from 'react-dom/client';

// Define types
type Schemes = GetSchemes<
  ClassicPreset.Node,
  ClassicPreset.Connection<ClassicPreset.Node, ClassicPreset.Node>
>;

type AreaExtra = ReactArea2D<Schemes>;

export default function ReteEditor(): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState('Initializing...');

  useEffect(() => {
    const initializeEditor = async () => {
      if (!containerRef.current) {
        setStatus('Container not found');
        return;
      }

      try {
        setStatus('Creating editor...');
        
        // Clear container
        containerRef.current.innerHTML = '';

        // Initialize editor with proper scope
        const editor = new NodeEditor<Schemes>();
        const area = new AreaPlugin<Schemes, AreaExtra>(containerRef.current);
        const render = new ReactPlugin<Schemes, AreaExtra>({ createRoot });
        const connection = new ConnectionPlugin<Schemes, AreaExtra>();

        setStatus('Setting up plugins...');

        // Set up classic preset
        render.addPreset(Presets.classic.setup());
        connection.addPreset(ConnectionPresets.classic.setup());

        // Use plugins in correct order
        editor.use(area);
        area.use(render);
        area.use(connection);

        setStatus('Creating nodes...');

        // Create socket for connections
        const socket = new ClassicPreset.Socket('socket');

        // Create first node (Node A)
        const nodeA = new ClassicPreset.Node('A');
        nodeA.addControl('a', new ClassicPreset.InputControl('text', { initial: 'Hello' }));
        nodeA.addOutput('a', new ClassicPreset.Output(socket));
        await editor.addNode(nodeA);

        // Create second node (Node B)
        const nodeB = new ClassicPreset.Node('B');
        nodeB.addControl('b', new ClassicPreset.InputControl('text', { initial: 'World' }));
        nodeB.addInput('b', new ClassicPreset.Input(socket));
        await editor.addNode(nodeB);

        setStatus('Positioning nodes...');

        // Position nodes
        await area.translate(nodeA.id, { x: 0, y: 0 });
        await area.translate(nodeB.id, { x: 300, y: 0 });

        setStatus('Creating connection...');

        // Create connection between nodes
        await editor.addConnection(new ClassicPreset.Connection(nodeA, 'a', nodeB, 'b'));

        // Make nodes selectable
        AreaExtensions.selectableNodes(area, AreaExtensions.selector(), {
          accumulating: AreaExtensions.accumulateOnCtrl()
        });

        // Add nodes order extension
        AreaExtensions.simpleNodesOrder(area);

        setStatus('Fitting viewport...');

        // Fit viewport - give DOM time to render
        setTimeout(() => {
          try {
            AreaExtensions.zoomAt(area, editor.getNodes());
            setStatus('Ready!');
          } catch (e) {
            console.warn('Could not fit viewport:', e);
            setStatus('Ready (zoom failed)');
          }
        }, 1000);

        console.log('Rete editor initialized successfully');

      } catch (error) {
        console.error('Failed to initialize Rete editor:', error);
        setStatus(`Error: ${error instanceof Error ? error.message : String(error)}`);
      }
    };

    initializeEditor();
  }, []);

  return (
    <div style={{ width: '100%', height: '600px' }}>
      <div style={{ 
        padding: '10px', 
        background: '#f0f0f0', 
        fontSize: '14px',
        fontFamily: 'monospace',
        borderBottom: '1px solid #ccc'
      }}>
        Status: {status}
      </div>
      <div 
        ref={containerRef}
        style={{ 
          width: '100%', 
          height: 'calc(100% - 50px)', 
          background: '#fafafa',
          border: '2px solid #ddd',
          position: 'relative'
        }}
      />
    </div>
  );
}
