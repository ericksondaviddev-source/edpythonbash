import { useState, useEffect } from 'react'
import type { Module, Lesson, LessonSummary } from '../../types'
import { useTranslation } from 'react-i18next'
import { useProgressStore } from '../../store/useProgressStore'
import { Icon } from '../atoms'

interface SidebarProps {
  modules: Module<any>[]
  onLessonSelect: (lesson: Lesson | LessonSummary) => void
  currentLessonId?: string
}

export default function Sidebar({ modules, onLessonSelect, currentLessonId }: SidebarProps) {
  const { t } = useTranslation()
  const { completedLessons } = useProgressStore()
  const [expandedModule, setExpandedModule] = useState<string | null>(modules[0]?.id || null)

  useEffect(() => {
    if (currentLessonId) {
      const mod = modules.find(m => m.lecciones.some(l => l.id === currentLessonId))
      if (mod) setExpandedModule(mod.id)
    }
  }, [currentLessonId, modules])

  return (
    <aside className="w-72 bg-[var(--bg-secondary)]/80 backdrop-blur-[var(--glass-blur)] border-r border-[var(--border)] min-h-[calc(100vh-64px)] overflow-y-auto">
      <div className="p-4">
        <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em] mb-3 text-[var(--text-tertiary)]">
          {t('nav.modules')}
        </h2>
        <div className="space-y-1.5">
          {modules.map((module) => (
            <div key={module.id} className="rounded-[var(--radius-md)] overflow-hidden">
              <button
                onClick={() => setExpandedModule(expandedModule === module.id ? null : module.id)}
                aria-expanded={expandedModule === module.id}
                className="w-full px-3.5 py-2.5 text-left bg-[var(--bg-tertiary)]/80 hover:bg-[var(--accent)]/90 hover:text-[var(--accent-ink)] press rounded-[var(--radius-md)] font-medium text-[var(--text-primary)] border border-[var(--border)]"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[13px] leading-snug">{module.nombre}</span>
                  <Icon
                    name={expandedModule === module.id ? 'chevron-down' : 'chevron-right'}
                    size={15}
                    className="opacity-60 flex-shrink-0"
                  />
                </div>
              </button>
              {expandedModule === module.id && (
                <div className="mt-1 ml-3 pl-2 space-y-0.5 border-l border-[var(--border)]">
                  {module.lecciones.map((lesson) => {
                    const isCompleted = completedLessons.includes(lesson.id)
                    const isCurrent = currentLessonId === lesson.id
                    return (
                      <button
                        key={lesson.id}
                        onClick={() => onLessonSelect(lesson)}
                        className={`w-full px-3 py-2 text-left text-[13px] rounded-[var(--radius-sm)] press flex items-center gap-2 ${
                          isCurrent
                            ? 'bg-[var(--accent)] text-[var(--accent-ink)] font-medium shadow-apple-xs'
                            : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'
                        }`}
                      >
                        {isCompleted ? (
                          <span className="w-4 h-4 rounded-full bg-[var(--success)] flex items-center justify-center flex-shrink-0">
                            <Icon name="check" size={10} className="text-white" />
                          </span>
                        ) : (
                          <span
                            className={`w-4 h-4 rounded-full border flex-shrink-0 ${
                              isCurrent
                                ? 'border-[var(--accent-ink)]/40'
                                : 'border-[var(--border-strong)]'
                            }`}
                          />
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
