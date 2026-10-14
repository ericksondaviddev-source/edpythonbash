import type { FlowchartNodeType } from '../../../types/lesson'
import { DecisionNode, EndNode, ProcessNode, StartNode } from './FlowchartNodes'

export const flowchartNodeTypes = {
  start: StartNode,
  process: ProcessNode,
  decision: DecisionNode,
  end: EndNode,
} as const

type Translate = (key: string) => string

export function labelFor(type: FlowchartNodeType, t: Translate): string {
  switch (type) {
    case 'start':
      return t('flowchart.label_inicio')
    case 'end':
      return t('flowchart.label_fin')
    case 'decision':
      return t('flowchart.label_decision')
    default:
      return t('flowchart.label_proceso')
  }
}
