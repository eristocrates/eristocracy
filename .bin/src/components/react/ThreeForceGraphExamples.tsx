// Example usage patterns for the refactored ThreeForceGraph component
import SimpleThreeForceGraph from './SimpleThreeForceGraph';
import { useState } from 'react';

// Basic example with default semantic data
export function BasicGraphExample() {
  return (
    <SimpleThreeForceGraph 
      dataUrl="/api/graph-data/rdf.ttl"
      enableStats={true}
      enableControls={true}
    />
  );
}

export function SemanticGraphExample() {
  return (
    <SimpleThreeForceGraph 
      dataUrl="/api/graph-data/semiotic-core.ttl"
      enableStats={true}
      enableControls={true}
    />
  );
}

// Example with small dataset
export function SmallGraphExample() {
  return (
    <SimpleThreeForceGraph 
      dataUrl="/api/graph-data/example.ttl"
      enableStats={true}
      enableControls={true}
    />
  );
}

// Example with error handling (nonexistent file)
export function ErrorHandlingExample() {
  return (
    <SimpleThreeForceGraph 
      dataUrl="/api/graph-data/nonexistent.ttl"
      enableStats={true}
      enableControls={true}
    />
  );
}

// Example with dynamic file selection
export function DynamicSelectionExample() {
  const [selectedFile, setSelectedFile] = useState('arcaea-one.ttl');

  return (
    <div>
      <label htmlFor="file-selector" style={{ display: 'block', marginBottom: '5px' }}>
        Select Ontology File:
      </label>
      <select 
        id="file-selector"
        value={selectedFile} 
        onChange={(e) => setSelectedFile(e.target.value)}
        style={{ marginBottom: '10px' }}
      >
        <option value="arcaea-one.ttl">Arcaea One</option>
        <option value="semiotic-core.ttl">Semiotic Core</option>
        <option value="example.ttl">Example</option>
      </select>
      
      <SimpleThreeForceGraph 
        dataUrl={`/api/graph-data/${selectedFile}`}
        enableStats={true}
        enableControls={true}
      />
    </div>
  );
}
