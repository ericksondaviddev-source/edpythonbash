import { useState } from 'react'
import type { Module, Lesson } from '../types'
import { useTranslation } from 'react-i18next'
import { useProgressStore } from '../store/useProgressStore'
import { useLanguageStore } from '../store/useLanguageStore'
import { Button } from '../components/atoms'
import ProgressBar from '../components/progress/ProgressBar'
import MindMap from '../components/organisms/MindMap'
import HeroCard from '../components/dashboard/HeroCard'
import ApiKeyCard from '../components/dashboard/ApiKeyCard'
import VideosCard from '../components/dashboard/VideosCard'

interface DashboardProps {
  modules: Module[]
  lessons: Lesson[]
  onLessonSelect: (lesson: Lesson) => void
  initialView?: 'mindmap' | 'dashboard'
  currentLessonId?: string
  onOpenSettings?: () => void
}

export default function Dashboard({ modules, lessons, onLessonSelect, initialView = 'dashboard', currentLessonId, onOpenSettings }: DashboardProps) {
  const { t } = useTranslation()
  const { completedLessons, xp, level, streak } = useProgressStore()
  const { lang } = useLanguageStore()
  const [view, setView] = useState<'mindmap' | 'dashboard'>(initialView)

  const nextLesson = lessons.find(l => !completedLessons.includes(l.id))
  const accentBtn = 'bg-[var(--accent)] text-[var(--accent-ink)]'
  const idleBtn = 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="w-8" aria-hidden="true" />
        <div className="flex gap-2">
          <button
            onClick={() => setView('dashboard')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              view === 'dashboard' ? accentBtn : idleBtn
            }`}
          >
            {t('nav.dashboard')}
          </button>
          <button
            onClick={() => setView('mindmap')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              view === 'mindmap' ? accentBtn : idleBtn
            }`}
          >
            {t('nav.mindmap')}
          </button>
        </div>
      </div>

      {view === 'mindmap' ? (
        <MindMap
          modules={modules}
          currentLessonId={currentLessonId}
          onLessonSelect={(lessonId) => {
            const lesson = lessons.find(l => l.id === lessonId)
            if (lesson) onLessonSelect(lesson)
          }}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <HeroCard completedCount={completedLessons.length} total={lessons.length} />
            </div>
            <ApiKeyCard onOpenSettings={onOpenSettings} />

            {nextLesson && (
              <div className="md:col-span-2 p-6 rounded-xl glass shadow-lg">
                <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
                  {t('dashboard.continue')}
                </h2>
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <p className="text-[var(--text-secondary)] text-sm">{nextLesson.modulo}</p>
                    <p className="text-[var(--text-primary)] font-medium">{nextLesson.competencia}</p>
                  </div>
                  <Button onClick={() => onLessonSelect(nextLesson)}>
                    {t('dashboard.continue')}
                  </Button>
                </div>
              </div>
            )}
            <div className="p-6 rounded-xl glass shadow-lg flex flex-col justify-center gap-2">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                {t('nav.mindmap')}
              </h2>
              <p className="text-sm text-[var(--text-secondary)]">
                {t('dashboard.mindmapPreview')}
              </p>
              <Button variant="secondary" onClick={() => setView('mindmap')}>
                {t('dashboard.openMindmap')}
              </Button>
            </div>

            <div className="md:col-span-2 lg:col-span-3">
              <ProgressBar
                xp={xp}
                level={level}
                streak={streak}
                lessonsCompleted={completedLessons.length}
                totalLessons={lessons.length}
              />
            </div>

            <div className="md:col-span-2 lg:col-span-3">
              <VideosCard lang={lang} />
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {modules.map((module) => {
              const moduleCompleted = module.lecciones.filter(l => completedLessons.includes(l.id)).length
              const moduleTotal = module.lecciones.length
              const modulePercent = moduleTotal > 0 ? Math.round((moduleCompleted / moduleTotal) * 100) : 0

              return (
                <button
                  key={module.id}
                  onClick={() => onLessonSelect(module.lecciones[0])}
                  className="text-left p-4 rounded-xl glass shadow hover:border-[var(--accent)] transition-colors"
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
                      className="h-full tricolor-bar transition-all duration-500"
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
