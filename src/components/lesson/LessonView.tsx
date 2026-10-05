import { useState } from 'react'
import type { Lesson } from '../../types'
import { useTranslation } from 'react-i18next'
import CodeBlock from './CodeBlock'
import QuizEngine from '../quiz/QuizEngine'
import SimulatorPanel from '../simulator/SimulatorPanel'
import AudioPlayer from '../audio/AudioPlayer'
import CodeTypingVideo from '../video/CodeTypingVideo'
import { useProgressStore } from '../../store/useProgressStore'
import { useLanguageStore } from '../../store/useLanguageStore'
import Markdown from '../molecules/Markdown'


interface LessonViewProps {
  lesson: Lesson
  onBack: () => void
  onComplete: () => void
  onNavigate: (lessonId: string) => void
  position: { index: number; total: number }
  prevLesson: Lesson | null
  nextLesson: Lesson | null
}

export default function LessonView({
  lesson,
  onBack,
  onComplete,
  onNavigate,
  position,
  prevLesson,
  nextLesson
}: LessonViewProps) {
  const { t } = useTranslation()
  const { completedLessons, quizBest, recordQuizScore } = useProgressStore()
  const { lang } = useLanguageStore()
  const [activeTab, setActiveTab] = useState<'content' | 'quiz' | 'simulator'>('content')
  const [showAudio, setShowAudio] = useState(false)
  const [showVideo, setShowVideo] = useState(false)
  const isCompleted = completedLessons.includes(lesson.id)
  const best = quizBest[lesson.id]
  const lessonLanguage: 'python' | 'bash' | 'html' =
    lesson.id.startsWith('M3.7') ? 'bash' : lesson.id.startsWith('F0.1') ? 'html' : 'python'

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={onBack}
          className="p-2 rounded-lg bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">{lesson.competencia}</h1>
          <p className="text-sm text-[var(--text-secondary)]">{lesson.modulo}</p>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            {t('lesson.lessonPosition', { current: position.index + 1, total: position.total })}
          </p>
        </div>
        {isCompleted && (
          <span className="px-3 py-1 bg-[var(--success)]/20 text-[var(--success)] rounded-full text-sm font-medium">
            {t('lesson.completed')}
          </span>
        )}
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-1 md:flex-wrap md:overflow-visible md:pb-0">
        <button
          onClick={() => setActiveTab('content')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
            activeTab === 'content'
              ? 'bg-[var(--accent)] text-white'
              : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'
          }`}
        >
          {t('lesson.title')}
        </button>
        <button
          onClick={() => setActiveTab('quiz')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
            activeTab === 'quiz'
              ? 'bg-[var(--accent)] text-white'
              : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'
          }`}
        >
          {t('lesson.quiz')}
          {best && (
            <span className="ml-2 text-xs opacity-80">
              {t('lesson.quizBest', { score: best.score, total: best.total })}
            </span>
          )}
        </button>
        {lesson.simulador && (
          <button
            onClick={() => setActiveTab('simulator')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
              activeTab === 'simulator'
                ? 'bg-[var(--accent)] text-white'
                : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'
            }`}
          >
            {t('lesson.simulator')}
          </button>
        )}
      </div>

      {activeTab === 'content' && (
        <div className="space-y-6">
          <section className="p-6 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)]">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-3">
              {t('lesson.mentalModel')}
            </h2>
            <Markdown content={lesson.modelo_mental} />
          </section>

          <div className="border border-[var(--border)] rounded-xl overflow-hidden">
            <button
              onClick={() => setShowAudio(!showAudio)}
              className="w-full px-4 py-3 bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors flex items-center justify-between"
            >
              <span className="font-medium text-[var(--text-primary)]">{t('lesson.audio')}</span>
              <span className="text-[var(--text-secondary)]">{showAudio ? t('common.hide') : t('common.show')}</span>
            </button>
            {showAudio && (
              <div className="p-4 border-t border-[var(--border)]">
                <AudioPlayer script={lesson.audio_script} lang={lang} />
              </div>
            )}
          </div>

          <CodeBlock
            code={lesson.codigo_roto}
            language={lessonLanguage}
            title={t('lesson.brokenCode')}
          />

          <section className="p-6 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)]">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-3">
              {t('lesson.diagnosis')}
            </h2>
            <Markdown content={lesson.diagnostico} />
          </section>

          <CodeBlock
            code={lesson.codigo_corregido}
            language={lessonLanguage}
            title={t('lesson.fixedCode')}
          />

          <CodeBlock
            code={lesson.codigo_optimizado}
            language={lessonLanguage}
            title={t('lesson.optimizedCode')}
          />

          <div className="border border-[var(--border)] rounded-xl overflow-hidden">
            <button
              onClick={() => setShowVideo(!showVideo)}
              className="w-full px-4 py-3 bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors flex items-center justify-between"
            >
              <span className="font-medium text-[var(--text-primary)]">{t('lesson.video')}</span>
              <span className="text-[var(--text-secondary)]">{showVideo ? t('common.hide') : t('common.show')}</span>
            </button>
            {showVideo && (
              <div className="p-4 border-t border-[var(--border)]">
                <CodeTypingVideo
                  code={lesson.codigo_corregido}
                  speed={30}
                  ascii3d={{
                    enabled: true,
                    type: 'intro',
                    duration: 3000
                  }}
                />
              </div>
            )}
          </div>

          <section className="p-6 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)]">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-3">
              {t('lesson.expertDebate')}
            </h2>
            <Markdown content={lesson.disenso_experto} />
          </section>

          <section className="p-6 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)]">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-3">
              {t('lesson.transferQuestion')}
            </h2>
            <Markdown content={lesson.pregunta_transferencia} />
          </section>

          {lesson.colab && lesson.colab.celdas?.length > 0 && (
            <section className="p-6 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)]">
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-1">
                Notebook Colab
              </h2>
              {lesson.colab.objetivo && (
                <p className="text-sm text-[var(--text-secondary)] mb-4">{lesson.colab.objetivo}</p>
              )}
              <div className="space-y-3">
                {lesson.colab.celdas.map((cell, i) =>
                  cell.tipo === 'code' ? (
                    <div key={i} className="relative">
                      <span className="absolute top-2 left-2 text-xs text-[var(--text-secondary)] font-mono z-10">
                        [{i}]
                      </span>
                      <pre className="bg-[var(--code-bg)] text-[var(--code-text)] p-4 pl-10 rounded-lg overflow-x-auto text-sm font-mono">
                        {cell.contenido}
                      </pre>
                    </div>
                  ) : (
                    <Markdown key={i} content={cell.contenido} className="pl-1" />
                  )
                )}
              </div>
            </section>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            {prevLesson && (
              <button
                onClick={() => onNavigate(prevLesson.id)}
                className="flex-1 py-3 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-primary)] font-medium hover:bg-[var(--bg-tertiary)] transition-colors"
              >
                ← {t('lesson.previousLesson')}
              </button>
            )}
            {isCompleted ? (
              nextLesson ? (
                <button
                  onClick={() => onNavigate(nextLesson.id)}
                  className="flex-1 py-3 bg-[var(--accent)] text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
                >
                  {t('lesson.goToNextLesson')}
                </button>
              ) : (
                <span className="flex-1 py-3 text-center font-medium text-[var(--success)]">
                  {t('lesson.courseCompleted')}
                </span>
              )
            ) : (
              <p className="flex-1 py-3 text-center text-sm text-[var(--text-secondary)] self-center">
                {t('lesson.quizGatingHint')}
              </p>
            )}
          </div>
        </div>
      )}

      {activeTab === 'quiz' && (
        <QuizEngine
          quiz={lesson.quiz}
          lesson={lesson}
          onComplete={(passed, score, total) => {
            recordQuizScore(lesson.id, score, total)
            if (passed && !isCompleted) {
              onComplete()
            }
          }}
        />
      )}

      {activeTab === 'simulator' && lesson.simulador && (
        <SimulatorPanel
          simulator={lesson.simulador}
          lessonId={lesson.id}
          nextLessonId={nextLesson?.id}
          onNavigate={(id) => onNavigate(id)}
        />
      )}
    </div>
  )
}
