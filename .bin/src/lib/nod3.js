// File: src/lib/nod3.js
import * as d3 from "d3";

// Two simple nodes with circles
const nodes = [
  { id: "A", label: "Node A", x: 100, y: 100 },
  { id: "B", label: "Node B", x: 350, y: 100 }
];

const links = [];

const svg = d3.select("#nod3");

// Connection state
let isConnecting = false;
let sourceNode = null;
let tempLine = null;

// Create groups
const linkGroup = svg.append("g").attr("class", "links");
const nodeGroup = svg.append("g").attr("class", "nodes");

function render() {
  // Render links
  const linkSelection = linkGroup.selectAll("line.link")
    .data(links);

  linkSelection.enter()
    .append("line")
    .attr("class", "link")
    .attr("stroke", "#aaa")
    .attr("stroke-width", 2)
    .attr("cursor", "pointer")
    .on("contextmenu", function (event, d) {
      event.preventDefault(); // Prevent browser context menu
      console.log("Deleting connection:", d.source, "->", d.target);

      // Remove this link from the array
      const index = links.indexOf(d);
      if (index > -1) {
        links.splice(index, 1);
        render(); // Re-render to update display
      }
    })
    .on("mouseenter", function (event, d) {
      d3.select(this).attr("stroke", "#ff6b6b").attr("stroke-width", 3);
    })
    .on("mouseleave", function (event, d) {
      d3.select(this).attr("stroke", "#aaa").attr("stroke-width", 2);
    })
    .merge(linkSelection)
    .attr("x1", d => getNode(d.source).x + 50)
    .attr("y1", d => getNode(d.source).y + 20)
    .attr("x2", d => getNode(d.target).x + 50)
    .attr("y2", d => getNode(d.target).y + 20);

  linkSelection.exit().remove();

  // Render nodes
  const nodeSelection = nodeGroup.selectAll("g.node")
    .data(nodes);

  const nodeEnter = nodeSelection.enter()
    .append("g")
    .attr("class", "node");

  // Node background - draggable
  nodeEnter.append("rect")
    .attr("width", 100)
    .attr("height", 40)
    .attr("fill", "#444")
    .attr("rx", 6)
    .call(d3.drag()
      .on("drag", function (event, d) {
        if (!isConnecting) { // Only allow dragging when not connecting
          d.x = event.x;
          d.y = event.y;
          d3.select(this.parentNode).attr("transform", `translate(${d.x},${d.y})`);
          render();
        }
      })
    );

  // Node label
  nodeEnter.append("text")
    .attr("class", "label")
    .attr("x", 10)
    .attr("y", 25)
    .text(d => d.label);

  // Connection circle
  nodeEnter.append("circle")
    .attr("class", "connection-point")
    .attr("cx", 50)
    .attr("cy", 20)
    .attr("r", 12) // Larger radius for easier clicking
    .attr("fill", "#2196F3")
    .attr("stroke", "white")
    .attr("stroke-width", 2)
    .attr("cursor", "crosshair")
    .on("click", function (event, d) {
      event.stopPropagation();
      handleCircleClick(d);
    })
    .on("mouseenter", function (event, d) {
      // Always show crosshair on hover, regardless of connection state
      d3.select(this).attr("cursor", "crosshair");

      // Visual feedback during connection mode
      if (isConnecting && sourceNode && sourceNode.id !== d.id) {
        d3.select(this)
          .attr("stroke", "#4CAF50")  // Green for valid target
          .attr("stroke-width", 4);
      }
    })
    .on("mouseleave", function (event, d) {
      // Reset visual state
      d3.select(this)
        .attr("stroke", "white")
        .attr("stroke-width", 2);
    });

  // Update positions
  nodeSelection.merge(nodeEnter)
    .attr("transform", d => `translate(${d.x},${d.y})`);

  nodeSelection.exit().remove();
}

function handleCircleClick(node) {
  console.log("Circle clicked:", node.id, "isConnecting:", isConnecting);

  if (!isConnecting) {
    // Start connection
    console.log("Starting connection from", node.id);
    startConnection(node);
  } else {
    // End connection
    if (sourceNode && sourceNode.id !== node.id) {
      console.log("Completing connection from", sourceNode.id, "to", node.id);

      // Check if connection already exists
      const exists = links.some(link =>
        (link.source === sourceNode.id && link.target === node.id) ||
        (link.source === node.id && link.target === sourceNode.id)
      );

      if (!exists) {
        links.push({
          source: sourceNode.id,
          target: node.id
        });
        render();
        console.log("Connection created!");
      } else {
        console.log("Connection already exists");
      }
    } else {
      console.log("Cannot connect to same node");
    }
    cleanup();
  }
}

function startConnection(node) {
  isConnecting = true;
  sourceNode = node;

  // Visual feedback for source node
  d3.selectAll('.connection-point')
    .filter(d => d.id === node.id)
    .attr("stroke", "#FF9800") // Orange for source
    .attr("stroke-width", 4);

  // Create temp line
  tempLine = svg.append("line")
    .attr("class", "temp-line")
    .attr("x1", node.x + 50)
    .attr("y1", node.y + 20)
    .attr("x2", node.x + 50)
    .attr("y2", node.y + 20)
    .attr("stroke", "yellow")
    .attr("stroke-width", 2)
    .attr("stroke-dasharray", "5,5")
    .style("pointer-events", "none"); // Don't interfere with mouse events

  // Track mouse movement - but allow events to bubble through
  svg.on("mousemove", function (event) {
    if (tempLine && isConnecting) {
      const [x, y] = d3.pointer(event);
      tempLine.attr("x2", x).attr("y2", y);
    }
  }, { passive: true }); // Passive event to not block other events
}

function cleanup() {
  console.log("Cleaning up connection");
  isConnecting = false;
  sourceNode = null;

  // Reset all circle visual states
  d3.selectAll('.connection-point')
    .attr("stroke", "white")
    .attr("stroke-width", 2)
    .attr("cursor", "crosshair");

  if (tempLine) {
    tempLine.remove();
    tempLine = null;
  }

  svg.on("mousemove", null);
}

// Cancel connection on background click
svg.on("click", function (event) {
  // Only cancel if we didn't click on a circle
  if (isConnecting && !event.target.classList.contains('connection-point')) {
    console.log("Canceling connection - clicked background");
    cleanup();
  }
});

function getNode(id) {
  return nodes.find(n => n.id === id);
}

// Initial render
render();
