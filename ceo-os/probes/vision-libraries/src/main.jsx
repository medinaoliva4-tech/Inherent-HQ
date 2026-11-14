import React from 'react';
import { createRoot } from 'react-dom/client';
import { ReactFlow, Background, Controls, Handle, Position, useNodesState } from '@xyflow/react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import '@xyflow/react/dist/style.css';
import './probe.css';

const seed = [
  { id: 'lead', position: { x: 28, y: 92 }, data: { label: 'Lead nuevo', status: 'En revisión', tone: 'amber' } },
  { id: 'fit', position: { x: 262, y: 92 }, data: { label: 'Encaje confirmado', status: 'Aprobado', tone: 'green' } },
  { id: 'offer', position: { x: 496, y: 92 }, data: { label: 'Oferta enviada', status: 'En curso', tone: 'blue' } },
];
const edges = [
  { id: 'lead-fit', source: 'lead', target: 'fit', type: 'smoothstep', animated: false },
  { id: 'fit-offer', source: 'fit', target: 'offer', type: 'smoothstep', animated: false },
];

function OpportunityNode({ id, data }) {
  return <div className={`opportunity-node ${data.tone}`}><Handle type="target" position={Position.Left} />
    <span className="node-status"><i />{data.status}</span><strong>{data.label}</strong><button type="button" onClick={(event) => { event.stopPropagation(); document.dispatchEvent(new CustomEvent('inherent:vision-node-selected', { detail: { id, label: data.label, status: data.status } })); }}>Enviar selección a OS</button>
    <Handle type="source" position={Position.Right} />
  </div>;
}
const nodeTypes = { opportunity: OpportunityNode };
const chartData = [
  { semana: 'S1', avance: 18 }, { semana: 'S2', avance: 32 }, { semana: 'S3', avance: 47 },
  { semana: 'S4', avance: 61 }, { semana: 'S5', avance: 73 }, { semana: 'S6', avance: 84 },
];

function FlowIsland() {
  const [nodes, setNodes, onNodesChange] = useNodesState(seed.map((node) => ({ ...node, type: 'opportunity' })));
  return <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} onNodesChange={onNodesChange} fitView fitViewOptions={{ padding: 0.12 }} proOptions={{ hideAttribution: true }} nodesDraggable nodesConnectable={false} elementsSelectable>
    <Background color="var(--ui-border, #d9ddd8)" gap={18} size={1} /><Controls showInteractive={false} />
  </ReactFlow>;
}

function ChartIsland() {
  return <ResponsiveContainer width="100%" height="100%"><LineChart data={chartData} margin={{ top: 18, right: 16, bottom: 4, left: -14 }}>
    <CartesianGrid stroke="var(--ui-border, #e1e4df)" vertical={false} />
    <XAxis dataKey="semana" tickLine={false} axisLine={false} tick={{ fill: 'var(--ui-muted, #65706a)', fontSize: 12 }} />
    <YAxis domain={[0, 100]} tickLine={false} axisLine={false} tick={{ fill: 'var(--ui-muted, #65706a)', fontSize: 11 }} />
    <Tooltip contentStyle={{ background: 'var(--ui-surface, #fff)', border: '1px solid var(--ui-border, #d9ddd8)', borderRadius: 10, color: 'var(--ui-ink, #202820)' }} />
    <Line type="monotone" dataKey="avance" name="Avance" stroke="var(--ui-accent, #416b53)" strokeWidth={3} dot={{ r: 3, fill: 'var(--ui-accent, #416b53)' }} activeDot={{ r: 5 }} isAnimationActive={false} />
  </LineChart></ResponsiveContainer>;
}

createRoot(document.querySelector('#react-island')).render(<FlowIsland />);
createRoot(document.querySelector('#chart-island')).render(<ChartIsland />);
