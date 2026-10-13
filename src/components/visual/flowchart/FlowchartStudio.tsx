import FlowchartBuilder from './FlowchartBuilder'
import FlowchartViewer from './FlowchartViewer'
import type { Lesson } from '../../../types/lesson'

interface FlowchartStudioProps {
  lesson: Lesson
  emptyLabel: string
}

/**
 * Decide la vista del tab "Diagrama":
 * - `mode=view` → solo lectura (observar / interpretar).
 * - `mode=build` → constructor interactivo (diseñar).
 */
export default function FlowchartStudio({ lesson, emptyLabel }: FlowchartStudioProps) {
  if (lesson.flowchart_mode === 'build') {
    return (
      <FlowchartBuilder
        key={lesson.id}
        starter={lesson.flowchart_starter}
        objetivo={lesson.flowchart_objetivo}
        rules={lesson.flowchart_rules}
      />
    )
  }

  return <FlowchartViewer data={lesson.flowchart_data} height={520} emptyLabel={emptyLabel} />
}
