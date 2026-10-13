import { useCallback, useMemo, useRef, useState } from 'react'
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  MarkerType,
  addEdge,
  useEdgesState,
  useNodesState,
  type Connection,
  type Edge,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { useTranslation } from 'react-i18next'
import { flowchartNodeTypes, labelFor } from './nodeTypes'
import type { FlowNodeData } from './FlowchartNodes'
import { validateFlowchart, type FlowchartIssue } from '../../../lib/flowchartValidate'
import FlowchartCodePanel from './FlowchartCodePanel'
import { fromReactFlow, toReactFlow } from '../../../lib/flowchartRF'
import type { FlowchartData, FlowchartNodeType } from '../../../types/lesson'

const PALETTE: { type: FlowchartNodeType; swatch: string; key: string }[] = [
  { type: 'start', swatch: 'is-start', key: 'agregar_inicio' },
  { type: 'process', swatch: 'is-process', key: 'agregar_proceso' },
  { type: 'decision', swatch: 'is-decision', key: 'agregar_decision' },
  { type: 'end', swatch: 'is-end', key: 'agregar_fin' },
]

interface FlowchartBuilderProps {
  starter?: FlowchartData
  objetivo?: string
  rules?: string[]
}

const EMPTY: FlowchartData = { nodes: [], edges: [] }

/** Constructor interactivo: paleta → lienzo → conectar → validar → convertir. */
export default function FlowchartBuilder({ starter, objetivo, rules }: FlowchartBuilderProps) {
  const { t } = useTranslation()
  // El padre monta con key={lessonId}, así que el estado arranca una sola vez
  // a partir del lienzo inicial de la lección.
  const init = useMemo(() => toReactFlow(starter ?? EMPTY, { editable: true }), [starter])
  const [nodes, setNodes, onNodesChange] = useNodesState<FlowNodeData>(init.nodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(init.edges)
  const [selNode, setSelNode] = useState<string | null>(null)
  const [selEdge, setSelEdge] = useState<string | null>(null)
  const [showCode, setShowCode] = useState(false)
  const counter = useRef(init.nodes.length)

  const data = useMemo(() => fromReactFlow(nodes, edges), [nodes, edges])
  const issues = useMemo(() => validateFlowchart(data), [data])
  const isValid = issues.length === 0 && data.nodes.length > 0

  const addNode = useCallback(
    (type: FlowchartNodeType) => {
      const n = counter.current++
      const id = `${type}-${n}-${Math.random().toString(36).slice(2, 7)}`
      const position = { x: 70 + (n % 3) * 245, y: 55 + Math.floor(n / 3) * 150 }
      setNodes(prev => [...prev, { id, type, position, data: { label: labelFor(type) } }])
      setSelNode(id)
      setSelEdge(null)
    },
    [setNodes]
  )

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges(prev =>
        addEdge(
          {
            ...connection,
            id: `e-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
            type: 'smoothstep',
            markerEnd: { type: MarkerType.ArrowClosed },
          },
          prev
        )
      )
    },
    [setEdges]
  )

  const deleteSelected = useCallback(() => {
    if (selNode) {
      setNodes(prev => prev.filter(n => n.id !== selNode))
      setEdges(prev => prev.filter(e => e.source !== selNode && e.target !== selNode))
      setSelNode(null)
    } else if (selEdge) {
      setEdges(prev => prev.filter(e => e.id !== selEdge))
      setSelEdge(null)
    }
  }, [selNode, selEdge, setNodes, setEdges])

  const updateNodeLabel = (id: string, label: string) => {
    setNodes(prev => prev.map(n => (n.id === id ? { ...n, data: { ...n.data, label } } : n)))
  }
  const updateEdgeLabel = (id: string, label: string) => {
    setEdges(prev => prev.map(e => (e.id === id ? { ...e, label } : e)))
  }

  const reset = useCallback(() => {
    const init = toReactFlow(starter ?? EMPTY, { editable: true })
    setNodes(init.nodes)
    setEdges(init.edges)
    setSelNode(null)
    setSelEdge(null)
    setShowCode(false)
    counter.current = init.nodes.length
  }, [starter, setNodes, setEdges])

  const selectedNode = nodes.find(n => n.id === selNode)
  const selectedEdge = edges.find(e => e.id === selEdge)

  return (
    <div className="flex flex-col lg:flex-row gap-4">
      {/* Panel principal: paleta + lienzo */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-start gap-4 mb-3">
          <div className="flex-1 min-w-[240px]">
            {objetivo && (
              <p className="text-sm text-[var(--text-secondary)] mb-2">
                <span className="font-semibold text-[var(--text-primary)]">
                  {t('flowchart.objetivo')}:
                </span>{' '}
                {objetivo}
              </p>
            )}
            <p className="text-xs text-[var(--text-secondary)] flex items-center gap-2">
              <span aria-hidden="true">💡</span> {t('flowchart.connectHint')}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
          {PALETTE.map(p => (
            <button
              key={p.type}
              type="button"
              className="fc-palette-item"
              onClick={() => addNode(p.type)}
              aria-label={t(`flowchart.${p.key}`)}
            >
              <span className={`fc-swatch ${p.swatch}`} aria-hidden="true" />
              <span className="truncate">{t(`flowchart.${p.key}`)}</span>
            </button>
          ))}
        </div>

        <div
          style={{
            height: 440,
            borderRadius: 10,
            overflow: 'hidden',
            border: '1px solid var(--border)',
            background: 'var(--bg-secondary)',
          }}
          data-testid="fc-canvas"
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={flowchartNodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={(_, node) => {
              setSelNode(node.id)
              setSelEdge(null)
            }}
            onEdgeClick={(_, edge) => {
              setSelEdge(edge.id)
              setSelNode(null)
            }}
            onPaneClick={() => {
              setSelNode(null)
              setSelEdge(null)
            }}
            onNodesDelete={nds => {
              if (nds.some(n => n.id === selNode)) setSelNode(null)
            }}
            onEdgesDelete={eds => {
              if (eds.some(e => e.id === selEdge)) setSelEdge(null)
            }}
            deleteKeyCode={['Delete']}
            fitView
            fitViewOptions={{ padding: 0.18 }}
            minZoom={0.3}
            maxZoom={2}
            proOptions={{ hideAttribution: false }}
            aria-label={t('flowchart.canvas')}
          >
            <Background variant={BackgroundVariant.Dots} gap={18} size={1} color="var(--border)" />
            <Controls showInteractive={false} />
          </ReactFlow>
        </div>
      </div>

      {/* Lateral: edición, validación, código */}
      <aside className="w-full lg:w-80 flex flex-col gap-3 shrink-0">
        <div className="p-4 rounded-xl glass shadow-lg">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
            {selectedNode
              ? t('flowchart.selectedNode')
              : selectedEdge
                ? t('flowchart.selectedEdge')
                : t('flowchart.instructions')}
          </h3>

          {selectedNode && (
            <div className="space-y-3">
              <label className="block text-xs text-[var(--text-secondary)]" htmlFor="fc-node-label">
                {t('flowchart.nodeLabel')}
              </label>
              <input
                id="fc-node-label"
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-sm"
                value={String(selectedNode.data?.label ?? '')}
                onChange={e => updateNodeLabel(selectedNode.id, e.target.value)}
              />
              <button
                type="button"
                onClick={deleteSelected}
                className="w-full py-2 rounded-lg bg-[var(--danger)]/15 text-[var(--danger)] text-sm font-medium hover:bg-[var(--danger)]/25 transition-colors"
              >
                {t('flowchart.deleteElement')}
              </button>
            </div>
          )}

          {selectedEdge && (
            <div className="space-y-3">
              <label className="block text-xs text-[var(--text-secondary)]" htmlFor="fc-edge-label">
                {t('flowchart.edgeLabel')}
              </label>
              <input
                id="fc-edge-label"
                placeholder={t('flowchart.edgeLabelPlaceholder')}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-sm"
                value={String(selectedEdge.label ?? '')}
                onChange={e => updateEdgeLabel(selectedEdge.id, e.target.value)}
              />
              <button
                type="button"
                onClick={deleteSelected}
                className="w-full py-2 rounded-lg bg-[var(--danger)]/15 text-[var(--danger)] text-sm font-medium hover:bg-[var(--danger)]/25 transition-colors"
              >
                {t('flowchart.deleteElement')}
              </button>
            </div>
          )}

          {!selectedNode && !selectedEdge && (
            <ul className="space-y-2 text-xs text-[var(--text-secondary)] list-disc pl-4">
              <li>{t('flowchart.hintAdd')}</li>
              <li>{t('flowchart.hintConnect')}</li>
              <li>{t('flowchart.hintEdit')}</li>
            </ul>
          )}
        </div>

        {rules && rules.length > 0 && (
          <div className="p-4 rounded-xl glass shadow-lg">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-2">
              {t('flowchart.rules')}
            </h3>
            <ul className="space-y-1.5 text-xs text-[var(--text-secondary)] list-disc pl-4">
              {rules.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="p-4 rounded-xl glass shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
              {t('flowchart.validate')}
            </h3>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                isValid
                  ? 'bg-[var(--success)]/20 text-[var(--success)]'
                  : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]'
              }`}
              data-testid="fc-status"
            >
              {isValid ? t('flowchart.valid') : t('flowchart.invalid')}
            </span>
          </div>

          <div className="space-y-1.5" role="status" aria-live="polite">
            {isValid ? (
              <div className="fc-check is-ok">
                <span className="fc-check-mark" aria-hidden="true">
                  ✓
                </span>
                <span>{t('flowchart.allOk')}</span>
              </div>
            ) : (
              issues.map((issue, i) => <IssueRow key={i} issue={issue} />)
            )}
          </div>

          <button
            type="button"
            onClick={reset}
            className="w-full mt-3 py-2 rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-primary)] text-sm font-medium hover:bg-[var(--border)] transition-colors"
          >
            {t('flowchart.limpiar')}
          </button>

          <div className="mt-3">
            <FlowchartCodePanel
              data={data}
              open={showCode}
              onToggle={() => setShowCode(v => !v)}
              buttonClassName="w-full py-2 rounded-lg bg-[var(--accent)] text-[var(--accent-ink)] text-sm font-semibold hover:opacity-90 transition-opacity"
            />
          </div>
        </div>
      </aside>
    </div>
  )
}

function IssueRow({ issue }: { issue: FlowchartIssue }) {
  const { t } = useTranslation()
  return (
    <div className="fc-check is-bad">
      <span className="fc-check-mark" aria-hidden="true">
        ✗
      </span>
      <span>{String(t(`flowchart.issue.${issue.code}`, issue.params ?? {}))}</span>
    </div>
  )
}
