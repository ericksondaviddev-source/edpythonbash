import { MarkerType, type Edge, type Node } from 'reactflow'
import type { FlowchartData, FlowchartEdge, FlowchartNode } from '../types/lesson'

/** Convierte datos de lección → nodos/aristas de React Flow. */
export function toReactFlow(
  data: FlowchartData,
  opts: { editable?: boolean } = {}
): { nodes: Node[]; edges: Edge[] } {
  const editable = opts.editable === true

  const nodes: Node[] = data.nodes.map(n => ({
    id: n.id,
    type: n.type,
    position: n.position,
    data: n.data,
    draggable: editable,
    selectable: editable,
  }))

  const edges: Edge[] = data.edges.map(e => ({
    id: e.id,
    source: e.source,
    target: e.target,
    label: e.label,
    sourceHandle: e.sourceHandle,
    targetHandle: e.targetHandle,
    type: 'smoothstep',
    markerEnd: { type: MarkerType.ArrowClosed },
    animated: false,
  }))

  return { nodes, edges }
}

/** Convierte estado de React Flow → datos de lección (builder). */
export function fromReactFlow(
  nodes: Node[],
  edges: Edge[]
): FlowchartData {
  const toFCNode = (n: Node): FlowchartNode => ({
    id: n.id,
    type: (n.type ?? 'process') as FlowchartNode['type'],
    position: { x: Math.round(n.position.x), y: Math.round(n.position.y) },
    data: (n.data ?? { label: '' }) as FlowchartNode['data'],
  })

  const toFCEdge = (e: Edge): FlowchartEdge => ({
    id: e.id,
    source: e.source,
    target: e.target,
    label: typeof e.label === 'string' ? e.label : undefined,
    sourceHandle: e.sourceHandle ?? undefined,
    targetHandle: e.targetHandle ?? undefined,
  })

  return { nodes: nodes.map(toFCNode), edges: edges.map(toFCEdge) }
}
