import { useCallback, useMemo, useState, useEffect } from 'react'
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
} from 'reactflow'
import type { Node, Edge } from 'reactflow'
import 'reactflow/dist/style.css'
import type { Module } from '../../types'
import { useProgressStore } from '../../store/useProgressStore'
import { useTranslation } from 'react-i18next'
import { Button, Icon } from '../atoms'

interface MindMapProps {
  modules: Module[]
  onLessonSelect: (lessonId: string) => void
  currentLessonId?: string
}

interface LessonNodeData {
  label: string
  isCompleted: boolean
  isCurrent: boolean
  onClick: () => void
}

function LessonNode({ data }: { data: LessonNodeData }) {
  return (
    <div
      onClick={data.onClick}
      className={`px-4 py-2 rounded-lg border-2 cursor-pointer transition-all min-w-[150px] text-center ${
        data.isCompleted
          ? 'bg-[var(--success)] border-[var(--success)] text-white'
          : data.isCurrent
          ? 'bg-[var(--accent)] border-[var(--accent)] text-white'
          : 'bg-[var(--bg-secondary)] border-[var(--border)] text-[var(--text-primary)] hover:border-[var(--accent)]'
      }`}
    >
      <Handle type="target" position={Position.Left} className="!bg-[var(--accent)]" />
      <Handle type="source" position={Position.Right} className="!bg-[var(--accent)]" />
      <span className="text-sm font-medium">{data.label}</span>
    </div>
  )
}

interface ModuleNodeData {
  label: string
  fase: number
  isExpanded: boolean
}

function ModuleNode({ data }: { data: ModuleNodeData }) {
  const colors = ['#3776AB', '#FFD43B', '#4EAA25', '#FF6B35']
  const color = colors[data.fase] || '#FF6B35'

  return (
    <div
      className="px-6 py-3 rounded-xl border-2 bg-[var(--bg-secondary)] min-w-[200px] text-center cursor-pointer hover:shadow-lg transition-all"
      style={{ borderColor: color }}
    >
      <Handle type="target" position={Position.Left} className="!bg-[var(--accent)]" />
      <Handle type="source" position={Position.Right} className="!bg-[var(--accent)]" />
      <div className="flex items-center justify-between">
        <span className="text-base font-bold text-[var(--text-primary)]">{data.label}</span>
        <Icon name={data.isExpanded ? 'chevron-down' : 'chevron-right'} size={16} />
      </div>
    </div>
  )
}

export default function MindMap({ modules, onLessonSelect, currentLessonId }: MindMapProps) {
  const nodeTypes = useMemo(() => ({
    lesson: LessonNode,
    module: ModuleNode,
  }), [])
  const { completedLessons } = useProgressStore()
  const { t } = useTranslation()
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set())

  const toggleModule = useCallback((moduleId: string) => {
    setExpandedModules(prev => {
      const next = new Set(prev)
      if (next.has(moduleId)) {
        next.delete(moduleId)
      } else {
        next.clear()
        next.add(moduleId)
      }
      return next
    })
  }, [])

  const expandAll = useCallback(() => {
    setExpandedModules(new Set(modules.map(m => m.id)))
  }, [modules])

  const collapseAll = useCallback(() => {
    setExpandedModules(new Set())
  }, [])

  const generateNodes = useCallback(() => {
    const nodes: Node[] = []
    const edges: Edge[] = []

    const faseLabels: Record<number, string> = {
      0: 'F0 - Fundamentos',
      1: 'M1 - Python Básico',
      2: 'M2 - Python Intermedio',
      3: 'M3 - Avanzado + Bash',
    }

    const fases = [...new Set(modules.map(m => m.fase))].sort()

    fases.forEach((fase, fi) => {
      const faseId = `fase-${fase}`
      nodes.push({
        id: faseId,
        type: 'module',
        position: { x: fi * 400, y: 0 },
        data: { label: faseLabels[fase] || `Fase ${fase}`, fase, isExpanded: true },
      })

      const faseModules = modules.filter(m => m.fase === fase)
      faseModules.forEach((module, mi) => {
        const moduleId = `module-${module.id}`
        const isExpanded = expandedModules.has(module.id)

        nodes.push({
          id: moduleId,
          type: 'module',
          position: { x: fi * 400, y: 150 + mi * 120 },
          data: { label: module.nombre, fase, isExpanded },
        })

        edges.push({
          id: `edge-${faseId}-${moduleId}`,
          source: faseId,
          target: moduleId,
          animated: true,
          style: { stroke: '#FF6B35', strokeWidth: 2 },
        })

        if (isExpanded) {
          module.lecciones.forEach((lesson, li) => {
            const lessonId = `lesson-${lesson.id}`
            nodes.push({
              id: lessonId,
              type: 'lesson',
              position: { x: fi * 400 + 300, y: 150 + mi * 120 + li * 60 },
              data: {
                label: lesson.competencia,
                isCompleted: completedLessons.includes(lesson.id),
                isCurrent: lesson.id === currentLessonId,
                onClick: () => onLessonSelect(lesson.id),
              },
            })

            edges.push({
              id: `edge-${moduleId}-${lessonId}`,
              source: moduleId,
              target: lessonId,
              animated: true,
              style: { stroke: '#8B949E', strokeWidth: 1 },
            })
          })
        }
      })
    })

    return { nodes, edges }
  }, [modules, completedLessons, onLessonSelect, expandedModules, currentLessonId])

  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])

  useEffect(() => {
    const { nodes: newNodes, edges: newEdges } = generateNodes()
    setNodes(newNodes)
    setEdges(newEdges)
  }, [generateNodes, setNodes, setEdges])

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    if (node.type === 'lesson') {
      const lessonId = node.id.replace('lesson-', '')
      onLessonSelect(lessonId)
    } else if (node.type === 'module') {
      const moduleId = node.id.replace('module-', '')
      toggleModule(moduleId)
    }
  }, [onLessonSelect, toggleModule])

  return (
    <div className="w-full h-[55vh] max-h-[600px] min-h-[380px] md:h-[600px] bg-[var(--bg-secondary)] rounded-xl border border-[var(--border)]">
      <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">{t('nav.mindmap')}</h2>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={expandAll}>
            {t('mindmap.expandAll')}
          </Button>
          <Button variant="ghost" size="sm" onClick={collapseAll}>
            {t('mindmap.collapseAll')}
          </Button>
        </div>
      </div>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-left"
      >
        <Background color="var(--border)" gap={16} />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            if (node.type === 'lesson') {
              const data = node.data as LessonNodeData
              return data.isCompleted ? '#2ECC71' : '#FF6B35'
            }
            return '#3776AB'
          }}
        />
      </ReactFlow>
    </div>
  )
}
