import React from 'react';
import { createRoot } from 'react-dom/client';
import { ReactFlow, Background, Controls, useNodesState } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
function Island({ nodes: initialNodes, edges, onSelect, onMove }) {
  const [nodes, , onNodesChange] = useNodesState(initialNodes.map((n, i) => ({ id: n.id, position: n.position || { x: i * 230, y: i % 2 * 80 }, data: { label: `${n.label} · ${n.state || 'Sin estado'}` } })));
  return <div style={{ width: '100%', height: '100%' }} onKeyDownCapture={(event) => { const n = event.target.closest?.('.react-flow__node'); if (n && ['Enter', ' '].includes(event.key)) { event.preventDefault(); event.stopPropagation(); onSelect?.(n.dataset.id); } }}><ReactFlow nodes={nodes} edges={edges.map((e, i) => ({ ...e, id: e.id || `edge-${i}` }))} onNodesChange={onNodesChange} onNodeClick={(_event, n) => onSelect?.(n.id)} onNodeDragStop={(_event, n) => onMove?.(n.id, n.position)} nodesConnectable={false} fitView minZoom={0.2} maxZoom={2} ariaLabelConfig={{ 'node.a11yDescription.default': 'Pulsa Enter para seleccionar un nodo. Usa las flechas para moverlo.', 'controls.zoomIn.ariaLabel': 'Acercar', 'controls.zoomOut.ariaLabel': 'Alejar', 'controls.fitView.ariaLabel': 'Ajustar vista' }}>
    <Background gap={20} color="var(--ui-line)" /><Controls showInteractive={false} />
  </ReactFlow></div>;
}
export function mountFlow(host, props) { const root = createRoot(host); root.render(<Island {...props} />); return () => root.unmount(); }
