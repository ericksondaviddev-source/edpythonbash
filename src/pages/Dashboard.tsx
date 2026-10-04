import { useState } from 'react'
import type { Module, Lesson } from '../types'
import { useTranslation } from 'react-i18next'
import { useProgressStore } from '../store/useProgressStore'
import ProgressBar from '../components/progress/ProgressBar'
import MindMap from '../components/organisms/MindMap'

interface DashboardProps {
  modules: Module[]
  lessons: Lesson[]
  onLessonSelect: (lesson: Lesson) => void
  initialView?: 'mindmap' | 'dashboard'
}

export default function Dashboard({ modules, lessons, onLessonSelect, initialView = 'dashboard' }: DashboardProps) {
  const { t } = useTranslation()
  const { completedLessons, xp, level, streak } = useProgressStore()
  const [view, setView] = useState<'mindmap' | 'dashboard'>(initialView)

  const nextLesson = lessons.find(l => !completedLessons.includes(l.id))

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">
            {t('dashboard.title')}
          </h1>
          <p className="text-[var(--text-secondary)]">
            {t('dashboard.welcome')}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setView('dashboard')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              view === 'dashboard'
                ? 'bg-[var(--accent)] text-white'
                : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'
            }`}
          >
            {t('nav.dashboard')}
          </button>
          <button
            onClick={() => setView('mindmap')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              view === 'mindmap'
                ? 'bg-[var(--accent)] text-white'
                : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'
            }`}
          >
            {t('nav.mindmap')}
          </button>
        </div>
      </div>

      {view === 'mindmap' ? (
        <MindMap
          modules={modules}
          onLessonSelect={(lessonId) => {
            const lesson = lessons.find(l => l.id === lessonId)
            if (lesson) onLessonSelect(lesson)
          }}
        />
      ) : (
        <>
          <ProgressBar
            xp={xp}
            level={level}
            streak={streak}
            lessonsCompleted={completedLessons.length}
            totalLessons={lessons.length}
          />

          {nextLesson && (
            <div className="mt-8 p-6 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)]">
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
                {t('dashboard.continue')}
              </h2>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[var(--text-secondary)] text-sm">{nextLesson.modulo}</p>
                  <p className="text-[var(--text-primary)] font-medium">{nextLesson.competencia}</p>
                </div>
                <button
                  onClick={() => onLessonSelect(nextLesson)}
                  className="px-6 py-2 bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent-hover)] transition-colors font-medium"
                >
                  {t('dashboard.continue')}
                </button>
              </div>
            </div>
          )}

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {modules.map((module) => {
              const moduleCompleted = module.lecciones.filter(l => completedLessons.includes(l.id)).length
              const moduleTotal = module.lecciones.length
              const modulePercent = moduleTotal > 0 ? Math.round((moduleCompleted / moduleTotal) * 100) : 0

              return (
                <button
                  key={module.id}
                  onClick={() => onLessonSelect(module.lecciones[0])}
                  className="text-left p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] hover:border-[var(--accent)] transition-colors"
                >
                  <h3 className="font-semibold text-[var(--text-primary)] mb-2 text-sm">
                    {module.nombre}
                  </h3>
                  <div className="flex items-center justify-between text-sm text-[var(--text-secondary)] mb-2">
                    <span>{moduleCompleted}/{moduleTotal} {t('dashboard.lessonsCompleted')}</span>
                    <span>{modulePercent}%</span>
                  </div>
                  <div className="w-full h-2 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[var(--accent)] transition-all duration-500"
                      style={{ width: `${modulePercent}%` }}
                    />
                  </div>
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
