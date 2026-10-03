import { useState, useEffect, useMemo } from 'react'
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

interface BlockDef {
  id: string
  type: string
  label: string
  code: string
  description: string
  color: string
}

const PYTHON_BLOCKS: BlockDef[] = [
  { id: 'py-var', type: 'variable', label: 'Variable', code: 'x = 10', description: 'Asigna un valor a una variable', color: 'bg-blue-500' },
  { id: 'py-func', type: 'function', label: 'Función', code: 'def nombre():\n    pass', description: 'Define una función reutilizable', color: 'bg-green-500' },
  { id: 'py-if', type: 'condition', label: 'Si', code: 'if condicion:\n    pass', description: 'Ejecuta código si la condición es verdadera', color: 'bg-yellow-500' },
  { id: 'py-else', type: 'condition', label: 'Sino', code: 'else:\n    pass', description: 'Alternativa cuando la condición falla', color: 'bg-yellow-600' },
  { id: 'py-for', type: 'loop', label: 'Para', code: 'for item in lista:\n    pass', description: 'Itera sobre cada elemento de una lista', color: 'bg-purple-500' },
  { id: 'py-while', type: 'loop', label: 'Mientras', code: 'while condicion:\n    pass', description: 'Repite mientras la condición sea verdadera', color: 'bg-purple-600' },
  { id: 'py-print', type: 'print', label: 'Imprimir', code: 'print()', description: 'Muestra texto en la consola', color: 'bg-red-500' },
  { id: 'py-import', type: 'import', label: 'Importar', code: 'import modulo', description: 'Importa un módulo de la stdlib', color: 'bg-teal-500' },
  { id: 'py-return', type: 'function', label: 'Retornar', code: 'return valor', description: 'Devuelve un valor desde una función', color: 'bg-green-600' },
  { id: 'py-try', type: 'error', label: 'Try/Except', code: 'try:\n    pass\nexcept Exception as e:\n    pass', description: 'Maneja errores sin crashear', color: 'bg-orange-500' },
]

const BASH_BLOCKS: BlockDef[] = [
  { id: 'sh-var', type: 'variable', label: 'Variable', code: 'NAME="valor"', description: 'Asigna texto a una variable (siempre entre comillas)', color: 'bg-blue-500' },
  { id: 'sh-echo', type: 'print', label: 'Echo', code: 'echo "$NAME"', description: 'Imprime texto o variables', color: 'bg-red-500' },
  { id: 'sh-if', type: 'condition', label: 'Si', code: 'if [[ condicion ]]; then\n    pass\nfi', description: 'Condicional con doble corchete (preferido)', color: 'bg-yellow-500' },
  { id: 'sh-for', type: 'loop', label: 'Para', code: 'for item in lista; do\n    pass\ndone', description: 'Itera sobre una lista', color: 'bg-purple-500' },
  { id: 'sh-while', type: 'loop', label: 'Mientras', code: 'while read -r line; do\n    pass\ndone', description: 'Lee entrada línea por línea de forma segura', color: 'bg-purple-600' },
  { id: 'sh-pipe', type: 'pipe', label: 'Pipe', code: 'comando1 | comando2', description: 'Conecta la salida de un comando con otro', color: 'bg-teal-500' },
  { id: 'sh-redirect', type: 'pipe', label: 'Redirect', code: 'comando > archivo.txt', description: 'Guarda la salida en un archivo', color: 'bg-teal-600' },
  { id: 'sh-func', type: 'function', label: 'Función', code: 'nombre() {\n    pass\n}', description: 'Define una función en Bash', color: 'bg-green-500' },
  { id: 'sh-set', type: 'error', label: 'set -euo pipefail', code: 'set -euo pipefail', description: 'Aborta en errores: obligatorio en scripts profesionales', color: 'bg-orange-500' },
  { id: 'sh-trap', type: 'error', label: 'Trap', code: 'trap "rm -f $TMP" EXIT', description: 'Limpieza garantizada al salir', color: 'bg-orange-600' },
]

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

export default function BlockEditor({ language, onCodeChange }: BlockEditorProps) {
  const blocks = language === 'bash' ? BASH_BLOCKS : PYTHON_BLOCKS
  const [placed, setPlaced] = useState<PlacedBlock[]>([])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
    useSensor(KeyboardSensor)
  )

  useEffect(() => {
    const code = placed
      .map(({ def, indent }) => {
        const pad = '    '.repeat(indent)
        return def.code
          .split('\n')
          .map((line, i) => (i === 0 || line.trim() ? pad + line : line))
          .join('\n')
      })
      .join('\n')
    onCodeChange(code)
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

  const codePreview = useMemo(
    () =>
      placed
        .map(({ def, indent }) => '    '.repeat(indent) + def.code.split('\n')[0])
        .join('\n'),
    [placed]
  )

  return (
    <Card title={`Editor de Bloques (${language === 'bash' ? 'Bash' : 'Python'})`}>
      <div className="mb-4">
        <p className="text-sm text-[var(--text-secondary)] mb-2">
          Arrastra los bloques al lienzo o haz clic para agregarlos. Mantén presionado en móvil para arrastrar.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {blocks.map((block) => (
            <PaletteBlock key={block.id} block={block} onAdd={() => addBlock(block)} />
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
              Suelta bloques aquí para construir tu código...
            </p>
          ) : (
            <SortableContext items={placed.map(p => p.uid)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {placed.map(({ uid, def, indent }) => (
                  <PlacedBlockRow
                    key={uid}
                    uid={uid}
                    def={def}
                    indent={indent}
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
          <p className="text-sm font-medium text-[var(--text-primary)] mb-2">
            Código generado (vista previa)
          </p>
          <pre className="p-4 bg-[var(--code-bg)] text-[var(--code-text)] rounded-lg font-mono text-sm overflow-x-auto whitespace-pre-wrap">
            {codePreview}
          </pre>
        </div>
      )}

      <div className="flex gap-2 mt-4">
        <Button variant="secondary" onClick={clearAll} disabled={placed.length === 0}>
          Limpiar
        </Button>
      </div>

      <AIReviewCard code={placed.length > 0 ? codePreview : ''} language={language} />
    </Card>
  )
}

function PaletteBlock({ block, onAdd }: { block: BlockDef; onAdd: () => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${block.id}`,
  })

  return (
    <button
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={onAdd}
      title={block.description}
      className={`min-h-[44px] px-2 py-2 rounded-lg text-white text-xs font-medium text-left ${block.color} ${
        isDragging ? 'opacity-50 scale-95' : 'hover:opacity-80'
      } transition-all touch-manipulation select-none cursor-grab active:cursor-grabbing`}
    >
      <span className="block font-bold">{block.label}</span>
      <span className="block text-[10px] opacity-80 leading-tight">{block.description}</span>
    </button>
  )
}

interface PlacedBlockRowProps {
  uid: string
  def: BlockDef
  indent: number
  onRemove: () => void
  onIndent: () => void
  onOutdent: () => void
}

function PlacedBlockRow({ uid, def, indent, onRemove, onIndent, onOutdent }: PlacedBlockRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: uid })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    marginLeft: `${indent * 24}px`,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 p-2 rounded-lg border ${
        isDragging ? 'border-[var(--accent)] opacity-60 shadow-lg z-10' : 'border-[var(--border)]'
      } bg-[var(--bg-secondary)]`}
    >
      <button
        {...attributes}
        {...listeners}
        className="p-2 rounded text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] cursor-grab active:cursor-grabbing touch-manipulation"
        aria-label="Mover bloque"
      >
        <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2l3 3h-6l3-3zm0 20l3-3h-6l3 3zM2 12l3-3v6l-3-3zm20 0l-3-3v6l3-3z" />
        </svg>
      </button>
      <span className={`px-2 py-1 rounded text-white text-[10px] font-bold flex-shrink-0 ${def.color}`}>
        {def.label}
      </span>
      <code className="flex-1 text-xs font-mono text-[var(--code-text)] truncate">
        {def.code.split('\n')[0]}
      </code>
      <button
        onClick={onOutdent}
        disabled={indent === 0}
        className="p-1.5 rounded text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] disabled:opacity-30"
        aria-label="Reducir indentación"
      >
        <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <button
        onClick={onIndent}
        disabled={indent === 4}
        className="p-1.5 rounded text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] disabled:opacity-30"
        aria-label="Aumentar indentación"
      >
        <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 18l6-6-6-6" />
        </svg>
      </button>
      <button
        onClick={onRemove}
        className="p-1.5 rounded text-[var(--error)] hover:bg-[var(--error)] hover:bg-opacity-20"
        aria-label="Eliminar bloque"
      >
        <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}
