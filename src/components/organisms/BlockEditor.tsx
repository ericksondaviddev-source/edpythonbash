import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import Prism from 'prismjs'
import 'prismjs/components/prism-python'
import 'prismjs/components/prism-bash'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button, Card } from '../atoms'
import AIReviewCard from './AIReviewCard'
import {
  PYTHON_BLOCKS,
  BASH_BLOCKS,
  BLOCK_CATEGORIES,
  type BlockDef,
  type BlockCategory,
} from '../../lib/blockDefs'

interface PlacedBlock {
  uid: string
  def: BlockDef
  indent: number
}

let uidCounter = 0
const nextUid = () => `placed-${++uidCounter}`

interface BlockEditorProps {
  language: 'python' | 'bash'
  onCodeChange: (code: string) => void
}

function buildCode(placed: PlacedBlock[]): string {
  return placed
    .map(({ def, indent }) => {
      const pad = '    '.repeat(indent)
      return def.code
        .split('\n')
        .map((line, i) => (i === 0 || line.trim() ? pad + line : line))
        .join('\n')
    })
    .join('\n')
}

function highlight(code: string, language: 'python' | 'bash'): string {
  try {
    return Prism.highlight(code, Prism.languages[language] ?? Prism.languages.plain, language)
  } catch {
    return code
  }
}

export default function BlockEditor({ language, onCodeChange }: BlockEditorProps) {
  const { t } = useTranslation()
  const blocks = language === 'bash' ? BASH_BLOCKS : PYTHON_BLOCKS
  const [placed, setPlaced] = useState<PlacedBlock[]>([])
  const [tab, setTab] = useState<'all' | BlockCategory>('all')

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
    useSensor(KeyboardSensor)
  )

  useEffect(() => {
    onCodeChange(buildCode(placed))
  }, [placed, onCodeChange])

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over) return

    const activeId = String(active.id)
    const overId = String(over.id)

    if (activeId.startsWith('palette-')) {
      const defId = activeId.replace('palette-', '')
      const def = blocks.find(b => b.id === defId)
      if (!def) return

      if (overId === 'canvas-dropzone' || overId.startsWith('placed-')) {
        const newBlock: PlacedBlock = { uid: nextUid(), def, indent: 0 }
        setPlaced(prev => {
          if (overId === 'canvas-dropzone') return [...prev, newBlock]
          const overIndex = prev.findIndex(p => p.uid === overId)
          if (overIndex === -1) return [...prev, newBlock]
          return [...prev.slice(0, overIndex), newBlock, ...prev.slice(overIndex)]
        })
      }
      return
    }

    if (activeId.startsWith('placed-') && overId.startsWith('placed-')) {
      const oldIndex = placed.findIndex(p => p.uid === activeId)
      const newIndex = placed.findIndex(p => p.uid === overId)
      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        setPlaced(prev => arrayMove(prev, oldIndex, newIndex))
      }
    }
  }

  const addBlock = (def: BlockDef) => {
    setPlaced(prev => [...prev, { uid: nextUid(), def, indent: 0 }])
  }

  const removeBlock = (uid: string) => {
    setPlaced(prev => prev.filter(p => p.uid !== uid))
  }

  const changeIndent = (uid: string, delta: number) => {
    setPlaced(prev =>
      prev.map(p => (p.uid === uid ? { ...p, indent: Math.max(0, Math.min(4, p.indent + delta)) } : p))
    )
  }

  const clearAll = () => {
    setPlaced([])
    onCodeChange('')
  }

  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: 'canvas-dropzone' })

  const codePreview = useMemo(() => buildCode(placed), [placed])
  const visibleBlocks = tab === 'all' ? blocks : blocks.filter(b => b.category === tab)

  return (
    <Card title={`${t('blocks.title')} (${language === 'bash' ? 'Bash' : 'Python'})`}>
      <div className="mb-4">
        <p className="text-sm text-[var(--text-secondary)] mb-2">{t('blocks.hint')}</p>
        <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1" role="tablist" aria-label={t('blocks.title')}>
          <button
            role="tab"
            aria-selected={tab === 'all'}
            onClick={() => setTab('all')}
            className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              tab === 'all'
                ? 'bg-[var(--accent)] text-white'
                : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--border)]'
            }`}
          >
            {t('blocks.all')}
          </button>
          {BLOCK_CATEGORIES.map(cat => (
            <button
              key={cat}
              role="tab"
              aria-selected={tab === cat}
              onClick={() => setTab(cat)}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                tab === cat
                  ? 'bg-[var(--accent)] text-white'
                  : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--border)]'
              }`}
            >
              {t(`blocks.cat.${cat}`)}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {visibleBlocks.map(block => (
            <PaletteBlock
              key={block.id}
              block={block}
              language={language}
              onAdd={() => addBlock(block)}
            />
          ))}
        </div>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div
          ref={setDropRef}
          className={`min-h-[140px] p-3 rounded-lg border-2 transition-colors ${
            isOver
              ? 'border-[var(--accent)] bg-[var(--bg-tertiary)]'
              : 'border-[var(--border)] bg-[var(--code-bg)]'
          }`}
        >
          {placed.length === 0 ? (
            <p className="text-sm text-[var(--text-secondary)] text-center py-8">
              {t('blocks.dropEmpty')}
            </p>
          ) : (
            <SortableContext items={placed.map(p => p.uid)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {placed.map(({ uid, def, indent }, index) => (
                  <PlacedBlockRow
                    key={uid}
                    uid={uid}
                    def={def}
                    indent={indent}
                    lineNumber={index + 1}
                    language={language}
                    onRemove={() => removeBlock(uid)}
                    onIndent={() => changeIndent(uid, 1)}
                    onOutdent={() => changeIndent(uid, -1)}
                  />
                ))}
              </div>
            </SortableContext>
          )}
        </div>
      </DndContext>

      {placed.length > 0 && (
        <div className="mt-4">
          <p className="text-sm font-medium text-[var(--text-primary)] mb-2">{t('blocks.preview')}</p>
          <pre
            data-testid="code-preview"
            className="p-4 bg-[var(--code-bg)] rounded-lg font-mono text-sm overflow-x-auto whitespace-pre-wrap"
          >
            <code
              className={`text-[var(--code-text)] language-${language}`}
              dangerouslySetInnerHTML={{ __html: highlight(codePreview, language) }}
            />
          </pre>
        </div>
      )}

      <div className="flex gap-2 mt-4">
        <Button variant="secondary" onClick={clearAll} disabled={placed.length === 0}>
          {t('blocks.clear')}
        </Button>
      </div>

      <AIReviewCard code={placed.length > 0 ? codePreview : ''} language={language} />
    </Card>
  )
}

function PaletteBlock({
  block,
  language,
  onAdd,
}: {
  block: BlockDef
  language: 'python' | 'bash'
  onAdd: () => void
}) {
  const { t } = useTranslation()
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${block.id}`,
  })
  const label = t(`blocks.${block.id}.label`)
  const description = t(`blocks.${block.id}.desc`)

  return (
    <button
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={onAdd}
      title={description}
      className={`text-left rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] overflow-hidden transition-all touch-manipulation select-none cursor-grab active:cursor-grabbing hover:border-[var(--accent)] ${
        isDragging ? 'opacity-50 scale-95' : ''
      }`}
    >
      <span className={`block h-1.5 ${block.color}`} aria-hidden="true" />
      <span className="block px-2.5 pt-1.5 text-xs font-bold text-[var(--text-primary)]">{label}</span>
      <span className="block px-2.5 py-1.5 font-mono text-[11px] leading-snug">
        <code
          className={`text-[var(--code-text)] language-${language} whitespace-pre-wrap break-words`}
          dangerouslySetInnerHTML={{ __html: highlight(block.code, language) }}
        />
      </span>
      <span className="block px-2.5 pb-2 text-[10px] leading-tight text-[var(--text-secondary)]">
        {description}
      </span>
    </button>
  )
}

interface PlacedBlockRowProps {
  uid: string
  def: BlockDef
  indent: number
  lineNumber: number
  language: 'python' | 'bash'
  onRemove: () => void
  onIndent: () => void
  onOutdent: () => void
}

function PlacedBlockRow({
  uid,
  def,
  indent,
  lineNumber,
  language,
  onRemove,
  onIndent,
  onOutdent,
}: PlacedBlockRowProps) {
  const { t } = useTranslation()
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: uid,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-stretch gap-0 rounded-lg border overflow-hidden ${
        isDragging ? 'border-[var(--accent)] opacity-60 shadow-lg z-10' : 'border-[var(--border)]'
      } bg-[var(--bg-secondary)]`}
    >
      <span className={`w-1.5 flex-shrink-0 ${def.color}`} aria-hidden="true" />
      <span className="flex items-center px-2 text-[10px] font-mono text-[var(--text-secondary)] select-none">
        {lineNumber}
      </span>
      <span className="flex items-stretch" aria-hidden="true">
        {Array.from({ length: indent }).map((_, i) => (
          <span key={i} className="w-6 border-l border-dashed border-[var(--border)]" />
        ))}
      </span>
      <code
        className={`flex-1 py-2 pr-1 font-mono text-xs text-[var(--code-text)] language-${language} whitespace-pre-wrap break-words self-center`}
        dangerouslySetInnerHTML={{ __html: highlight(def.code, language) }}
      />
      <span className="flex items-center gap-0.5 pr-1">
        <button
          {...attributes}
          {...listeners}
          className="p-2 rounded text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] cursor-grab active:cursor-grabbing touch-manipulation"
          aria-label={t('blocks.moveBlock')}
        >
          <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l3 3h-6l3-3zm0 20l3-3h-6l3 3zM2 12l3-3v6l-3-3zm20 0l-3-3v6l3-3z" />
          </svg>
        </button>
        <button
          onClick={onOutdent}
          disabled={indent === 0}
          className="p-1.5 rounded text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] disabled:opacity-30"
          aria-label={t('blocks.indentLess')}
        >
          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          onClick={onIndent}
          disabled={indent === 4}
          className="p-1.5 rounded text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] disabled:opacity-30"
          aria-label={t('blocks.indentMore')}
        >
          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 18l6-6-6-6" />
          </svg>
        </button>
        <button
          onClick={onRemove}
          className="p-1.5 rounded text-[var(--error)] hover:bg-[var(--error)]/20"
          aria-label={t('blocks.removeBlock')}
        >
          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </span>
    </div>
  )
}
