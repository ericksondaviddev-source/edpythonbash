import type { FlowchartNodeType } from '../../../types/lesson'
import { DecisionNode, EndNode, ProcessNode, StartNode } from './FlowchartNodes'

export const flowchartNodeTypes = {
  start: StartNode,
  process: ProcessNode,
  decision: DecisionNode,
  end: EndNode,
} as const

export function labelFor(type: FlowchartNodeType): string {
  switch (type) {
    case 'start':
      return 'Inicio'
    case 'end':
      return 'Fin'
    case 'decision':
      return '¿Pregunta?'
    default:
      return 'Acción'
  }
}
