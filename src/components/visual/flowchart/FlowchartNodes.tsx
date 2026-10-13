import { Handle, Position, type NodeProps } from 'reactflow'

export interface FlowNodeData {
  label: string
  description?: string
  compact?: boolean
  /** Marca el nodo seleccionado en el builder. */
  selected?: boolean
}

const handleStyle = 'fc-handle'

/** Cuerpo base: etiqueta + tooltip con descripción. */
function Label({ data }: { data: FlowNodeData }) {
  return (
    <span
      className="fc-label"
      data-compact={data.compact ? 'true' : undefined}
      title={data.description}
    >
      {data.label}
    </span>
  )
}

export function StartNode({ data }: NodeProps<FlowNodeData>) {
  return (
    <div className="fc-node fc-start" role="figure" aria-label={data.label}>
      <Label data={data} />
      <Handle type="source" position={Position.Bottom} id="bottom" className={handleStyle} />
    </div>
  )
}

export function ProcessNode({ data }: NodeProps<FlowNodeData>) {
  return (
    <div className="fc-node fc-process" role="figure" aria-label={data.label}>
      <Label data={data} />
      <Handle type="target" position={Position.Top} id="top" className={handleStyle} />
      <Handle type="source" position={Position.Bottom} id="bottom" className={handleStyle} />
    </div>
  )
}

export function DecisionNode({ data }: NodeProps<FlowNodeData>) {
  return (
    <div className="fc-node fc-decision" role="figure" aria-label={data.label}>
      <div className="fc-diamond">
        <Label data={data} />
      </div>
      <Handle type="target" position={Position.Top} id="top" className={handleStyle} />
      <Handle type="source" position={Position.Left} id="left" className={handleStyle} />
      <Handle type="source" position={Position.Right} id="right" className={handleStyle} />
      <Handle type="source" position={Position.Bottom} id="bottom" className={handleStyle} />
    </div>
  )
}

export function EndNode({ data }: NodeProps<FlowNodeData>) {
  return (
    <div className="fc-node fc-end" role="figure" aria-label={data.label}>
      <Label data={data} />
      <Handle type="target" position={Position.Top} id="top" className={handleStyle} />
    </div>
  )
}
