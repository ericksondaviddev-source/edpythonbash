import { useState, lazy, Suspense } from 'react'
import type { Module, Lesson, LessonSummary } from '../types'
import { useTranslation } from 'react-i18next'
import { useProgressStore } from '../store/useProgressStore'
import { useLanguageStore } from '../store/useLanguageStore'
import { Button } from '../components/atoms'
import ProgressBar from '../components/progress/ProgressBar'
import HeroCard from '../components/dashboard/HeroCard'
import ApiKeyCard from '../components/dashboard/ApiKeyCard'
import VideosCard from '../components/dashboard/VideosCard'

const MindMap = lazy(() => import('../components/organisms/MindMap'))

interface DashboardProps {
  modules: Module<any>[]
  lessons: (Lesson | LessonSummary)[]
  onLessonSelect: (lesson: Lesson | LessonSummary) => void
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
        <div className="flex gap-1 p-1 rounded-[var(--radius-md)] bg-[var(--bg-tertiary)]/70 border border-[var(--border)]">
          <button
            onClick={() => setView('dashboard')}
            className={`px-4 py-1.5 rounded-[var(--radius-sm)] text-sm font-medium press transition-colors ${
              view === 'dashboard' ? accentBtn + ' shadow-apple-xs' : idleBtn
            }`}
          >
            {t('nav.dashboard')}
          </button>
          <button
            onClick={() => setView('mindmap')}
            className={`px-4 py-1.5 rounded-[var(--radius-sm)] text-sm font-medium press transition-colors ${
              view === 'mindmap' ? accentBtn + ' shadow-apple-xs' : idleBtn
            }`}
          >
            {t('nav.mindmap')}
          </button>
        </div>
      </div>

      {view === 'mindmap' ? (
        <Suspense
          fallback={
            <div className="h-96 flex items-center justify-center text-[var(--text-secondary)]">
              {t('common.loading')}
            </div>
          }
        >
          <MindMap
            modules={modules}
            currentLessonId={currentLessonId}
            onLessonSelect={(lessonId) => {
              const lesson = lessons.find(l => l.id === lessonId)
              if (lesson) onLessonSelect(lesson)
            }}
          />
        </Suspense>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="md:col-span-2 reveal reveal-1">
              <HeroCard completedCount={completedLessons.length} total={lessons.length} />
            </div>
            <div className="reveal reveal-2">
              <ApiKeyCard onOpenSettings={onOpenSettings} />
            </div>

            {nextLesson && (
              <div className="md:col-span-2 p-6 rounded-[var(--radius-lg)] glass shadow-apple-md reveal reveal-3">
                <h2 className="text-[17px] font-semibold tracking-[var(--tracking-tight)] text-[var(--text-primary)] mb-4">
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
            <div className="p-6 rounded-[var(--radius-lg)] glass shadow-apple-md flex flex-col justify-center gap-2 reveal reveal-4">
              <h2 className="text-[17px] font-semibold tracking-[var(--tracking-tight)] text-[var(--text-primary)]">
                {t('nav.mindmap')}
              </h2>
              <p className="text-sm text-[var(--text-secondary)]">
                {t('dashboard.mindmapPreview')}
              </p>
              <Button variant="secondary" onClick={() => setView('mindmap')}>
                {t('dashboard.openMindmap')}
              </Button>
            </div>

            <div className="md:col-span-2 lg:col-span-3 reveal reveal-5">
              <ProgressBar
                xp={xp}
                level={level}
                streak={streak}
                lessonsCompleted={completedLessons.length}
                totalLessons={lessons.length}
              />
            </div>

            <div className="md:col-span-2 lg:col-span-3 reveal reveal-5">
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
                  className="text-left p-4 rounded-[var(--radius-lg)] glass shadow-apple-sm press hover:border-[var(--accent)] hover:shadow-apple-md"
                >
                  <h3 className="font-semibold text-[var(--text-primary)] mb-2 text-[14px] tracking-[var(--tracking-tight)]">
                    {module.nombre}
                  </h3>
                  <div className="flex items-center justify-between text-[13px] text-[var(--text-secondary)] mb-2">
                    <span>{moduleCompleted}/{moduleTotal} {t('dashboard.lessonsCompleted')}</span>
                    <span className="font-semibold text-[var(--accent)]">{modulePercent}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
                    <div
                      className="h-full tricolor-bar transition-all duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)]"
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
