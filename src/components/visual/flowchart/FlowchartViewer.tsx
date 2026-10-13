import { useMemo, useState } from 'react'
import ReactFlow, { Background, Controls, BackgroundVariant } from 'reactflow'
import 'reactflow/dist/style.css'
import { toReactFlow } from '../../../lib/flowchartRF'
import type { FlowchartData } from '../../../types/lesson'
import FlowchartCodePanel from './FlowchartCodePanel'
import { flowchartNodeTypes } from './nodeTypes'

interface FlowchartViewerProps {
  data?: FlowchartData
  height?: number
  emptyLabel?: string
}

/** Diagrama de flujo en solo lectura (React Flow). */
export default function FlowchartViewer({
  data,
  height = 420,
  emptyLabel = 'Sin diagrama',
}: FlowchartViewerProps) {
  const { nodes, edges } = useMemo(() => (data ? toReactFlow(data) : { nodes: [], edges: [] }), [data])
  const [showCode, setShowCode] = useState(false)

  if (!data || nodes.length === 0) {
    return (
      <div
        className="fc-empty"
        role="status"
        style={{
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px dashed var(--border)',
          borderRadius: 10,
          color: 'var(--text-secondary)',
          fontSize: 14,
        }}
      >
        {emptyLabel}
      </div>
    )
  }

  return (
    <div>
      <div
        data-testid="fc-canvas"
        style={{ height, borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)' }}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={flowchartNodeTypes}
          fitView
          fitViewOptions={{ padding: 0.18 }}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          panOnScroll
          zoomOnPinch
          preventScrolling={false}
          proOptions={{ hideAttribution: false }}
          aria-label="Diagrama de flujo"
        >
          <Background variant={BackgroundVariant.Dots} gap={18} size={1} color="var(--border)" />
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>

      <div className="mt-3">
        <FlowchartCodePanel data={data} open={showCode} onToggle={() => setShowCode(v => !v)} />
      </div>
    </div>
  )
}
