import { useState } from 'react'
import type { Module, Lesson } from '../../types'
import { useTranslation } from 'react-i18next'
import { useProgressStore } from '../../store/useProgressStore'
import { Icon } from '../atoms'

interface SidebarProps {
  modules: Module[]
  onLessonSelect: (lesson: Lesson) => void
  currentLessonId?: string
}

export default function Sidebar({ modules, onLessonSelect, currentLessonId }: SidebarProps) {
  const { t } = useTranslation()
  const { completedLessons } = useProgressStore()
  const [expandedModule, setExpandedModule] = useState<string | null>(modules[0]?.id || null)

  return (
    <aside className="w-72 bg-[var(--bg-secondary)] border-r border-[var(--border)] min-h-[calc(100vh-64px)] overflow-y-auto">
      <div className="p-4">
        <h2 className="text-lg font-semibold mb-4 text-[var(--text-primary)]">
          {t('nav.modules')}
        </h2>
        <div className="space-y-2">
          {modules.map((module) => (
            <div key={module.id} className="rounded-lg overflow-hidden">
              <button
                onClick={() => setExpandedModule(expandedModule === module.id ? null : module.id)}
                className="w-full px-4 py-3 text-left bg-[var(--bg-tertiary)] hover:bg-[var(--accent)] hover:text-white transition-colors rounded-lg font-medium text-[var(--text-primary)]"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm">{module.nombre}</span>
                  <Icon name={expandedModule === module.id ? 'chevron-down' : 'chevron-right'} size={16} />
                </div>
              </button>
              {expandedModule === module.id && (
                <div className="mt-1 ml-4 space-y-1">
                  {module.lecciones.map((lesson) => {
                    const isCompleted = completedLessons.includes(lesson.id)
                    const isCurrent = currentLessonId === lesson.id
                    return (
                      <button
                        key={lesson.id}
                        onClick={() => onLessonSelect(lesson)}
                        className={`w-full px-3 py-2 text-left text-sm rounded transition-colors flex items-center gap-2 ${
                          isCurrent
                            ? 'bg-[var(--accent)] text-white'
                            : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'
                        }`}
                      >
                        {isCompleted && (
                          <span className="w-4 h-4 rounded-full bg-[var(--success)] flex items-center justify-center flex-shrink-0">
                            <Icon name="check" size={10} className="text-white" />
                          </span>
                        )}
                        <span className="truncate">{lesson.competencia}</span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </aside>
  )
}
