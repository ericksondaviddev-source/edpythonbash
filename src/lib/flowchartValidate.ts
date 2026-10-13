import type { FlowchartData, FlowchartNode } from '../types/lesson'

export type FlowchartIssueCode =
  | 'empty'
  | 'no_start'
  | 'multiple_starts'
  | 'no_end'
  | 'end_outgoing'
  | 'decision_branches'
  | 'dead_end'
  | 'unreachable'

export interface FlowchartIssue {
  code: FlowchartIssueCode
  nodeId?: string
  /** Valores para interpolación i18n (p. ej. count). */
  params?: Record<string, string | number>
}

const YES_LABEL = /^(s[ií]|yes|verdadero|true|1)$/i

function outgoing(data: FlowchartData, nodeId: string) {
  return data.edges.filter(e => e.source === nodeId)
}

/** Devuelve la lista de problemas del diagrama (vacía = válido). */
export function validateFlowchart(data: FlowchartData): FlowchartIssue[] {
  const issues: FlowchartIssue[] = []
  const { nodes, edges } = data

  if (nodes.length === 0) {
    return [{ code: 'empty' }]
  }

  const byId = new Map(nodes.map(n => [n.id, n]))
  const starts = nodes.filter(n => n.type === 'start')
  const ends = nodes.filter(n => n.type === 'end')

  if (starts.length === 0) issues.push({ code: 'no_start' })
  if (starts.length > 1) issues.push({ code: 'multiple_starts', params: { total: starts.length } })
  if (ends.length === 0) issues.push({ code: 'no_end' })

  for (const node of nodes) {
    const out = outgoing(data, node.id)

    if (node.type === 'end' && out.length > 0) {
      issues.push({ code: 'end_outgoing', nodeId: node.id })
    }

    if (node.type === 'decision') {
      const labeled = out.filter(e => (e.label ?? '').trim() !== '')
      if (labeled.length < 2) {
        issues.push({ code: 'decision_branches', nodeId: node.id })
      }
    }

    if (node.type !== 'end' && out.length === 0) {
      issues.push({ code: 'dead_end', nodeId: node.id })
    }
  }

  // Alcanzabilidad desde el primer start.
  if (starts.length >= 1) {
    const reachable = new Set<string>()
    const stack = [starts[0].id]
    while (stack.length) {
      const id = stack.pop() as string
      if (reachable.has(id)) continue
      reachable.add(id)
      for (const e of edges.filter(edge => edge.source === id)) {
        if (byId.has(e.target)) stack.push(e.target)
      }
    }
    for (const node of nodes) {
      if (!reachable.has(node.id)) {
        issues.push({ code: 'unreachable', nodeId: node.id })
      }
    }
  }

  return issues
}

/** Etiqueta "rampa Sí" para pintar y para pseudocódigo. */
export function isYesLabel(label?: string): boolean {
  return YES_LABEL.test((label ?? '').trim())
}

/** Nodo por id. */
export function getNode(data: FlowchartData, id: string): FlowchartNode | undefined {
  return data.nodes.find(n => n.id === id)
}
