import { useState, useMemo } from 'react'
import type { Quiz, Lesson } from '../../types'
import { useTranslation } from 'react-i18next'
import { Button, Card } from '../atoms'
import QuizOption from '../molecules/QuizOption'
import { generateQuestionsFromLesson, generateCodeQuestions } from '../../services/questionGenerator'

interface QuizEngineProps {
  quiz: Quiz
  lesson: Lesson
  onComplete: (passed: boolean, score: number, total: number) => void
}

export default function QuizEngine({ quiz, lesson, onComplete }: QuizEngineProps) {
  const { t } = useTranslation()
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [showExplanation, setShowExplanation] = useState(false)
  const [score, setScore] = useState(0)
  const [isComplete, setIsComplete] = useState(false)

  const allQuestions = useMemo(() => {
    const generated = generateQuestionsFromLesson(lesson)
    const codeQuestions = generateCodeQuestions(lesson)
    const all = [
      {
        pregunta: quiz.pregunta,
        opciones: quiz.opciones,
        correcta: quiz.correcta,
        explicacion: quiz.explicacion,
        tipo: 'concepto' as const
      },
      ...(lesson.quiz_ia ?? []).map(q => ({ ...q })),
      ...generated,
      ...codeQuestions
    ]
    const hashSeed = (s: string) => {
      let seed = 0
      for (const ch of s) seed = (seed * 31 + ch.charCodeAt(0)) % 2147483647
      return seed || 1
    }
    const mulberry = (seed: number) => () => {
      seed = (seed + 0x6d2b79f5) | 0
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
    // barajar opciones de cada pregunta (remapeando la correcta) con seed determinista
    const withShuffledOptions = all.map(q => {
      const rand = mulberry(hashSeed(lesson.id + '|' + q.pregunta))
      const idx = q.opciones.map((_, i) => i)
      for (let i = idx.length - 1; i > 0; i--) {
        const j = Math.floor(rand() * (i + 1))
        ;[idx[i], idx[j]] = [idx[j], idx[i]]
      }
      const origCorrect = q.correcta.charCodeAt(0) - 65
      return {
        ...q,
        opciones: idx.map(i => q.opciones[i]),
        correcta: String.fromCharCode(65 + idx.indexOf(origCorrect))
      }
    })
    // barajar orden de preguntas (Fisher-Yates con seed de la lección)
    const orderRand = mulberry(hashSeed(lesson.id))
    const ordered = [...withShuffledOptions]
    for (let i = ordered.length - 1; i > 0; i--) {
      const j = Math.floor(orderRand() * (i + 1))
      ;[ordered[i], ordered[j]] = [ordered[j], ordered[i]]
    }
    return ordered.slice(0, 8)
  }, [quiz, lesson])

  const currentQuestion = allQuestions[currentQuestionIndex]
  const isCorrect = selected === currentQuestion?.correcta

  const handleSelect = (option: string) => {
    if (showExplanation) return
    setSelected(option)
    setShowExplanation(true)
    if (option === currentQuestion?.correcta) {
      setScore(s => s + 1)
    }
  }

  const passed = score / allQuestions.length >= 0.7

  const handleNext = () => {
    if (currentQuestionIndex < allQuestions.length - 1) {
      setCurrentQuestionIndex(i => i + 1)
      setSelected(null)
      setShowExplanation(false)
    } else {
      setIsComplete(true)
      onComplete(passed, score, allQuestions.length)
    }
  }

  const handleRetry = () => {
    setCurrentQuestionIndex(0)
    setSelected(null)
    setShowExplanation(false)
    setScore(0)
    setIsComplete(false)
  }

  if (isComplete) {
    return (
      <Card title={t('quiz.completed')}>
        <div className="text-center">
          <p className="text-4xl font-bold text-[var(--accent)] mb-2">
            {score}/{allQuestions.length}
          </p>
          <p className="text-[var(--text-secondary)] mb-4">
            {passed ? t('quiz.excellent') : t('quiz.practice')}
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleRetry} className="flex-1">
              {t('quiz.retry')}
            </Button>
            <Button onClick={() => onComplete(passed, score, allQuestions.length)} className="flex-1">
              {t('quiz.finish')}
            </Button>
          </div>
        </div>
      </Card>
    )
  }

  if (!currentQuestion) return null

  return (
    <Card title={`Quiz - Pregunta ${currentQuestionIndex + 1}/${allQuestions.length}`}>
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <span className={`px-2 py-1 rounded text-xs font-medium ${
            currentQuestion.tipo === 'concepto' ? 'bg-blue-500/20 text-blue-500' :
            currentQuestion.tipo === 'codigo' ? 'bg-green-500/20 text-green-500' :
            'bg-red-500/20 text-red-500'
          }`}>
            {currentQuestion.tipo === 'concepto' ? t('quiz.tipoConcepto') : currentQuestion.tipo === 'codigo' ? t('quiz.tipoCodigo') : t('quiz.tipoDebugging')}
          </span>
          <span className="text-sm text-[var(--text-secondary)]">
            {t('quiz.scoreLabel')}: {score}/{allQuestions.length}
          </span>
        </div>

        <p className="text-[var(--text-primary)] font-medium mb-4 whitespace-pre-wrap">{currentQuestion.pregunta}</p>

        <div className="space-y-3">
          {currentQuestion.opciones.map((option, index) => {
            const letter = String.fromCharCode(65 + index)
            return (
              <QuizOption
                key={letter}
                letter={letter}
                text={option}
                isSelected={selected === letter}
                isCorrect={letter === currentQuestion.correcta}
                showResult={showExplanation}
                onClick={() => handleSelect(letter)}
              />
            )
          })}
        </div>
      </div>

      {showExplanation && (
        <div className="space-y-4">
          <div className={`p-4 rounded-lg ${isCorrect ? 'bg-[var(--success)]/20' : 'bg-[var(--error)]/20'}`}>
            <p className={`font-medium ${isCorrect ? 'text-[var(--success)]' : 'text-[var(--error)]'}`}>
              {isCorrect ? t('quiz.correct') : t('quiz.incorrect')}
            </p>
          </div>

          <div className="p-4 rounded-lg bg-[var(--bg-tertiary)]">
            <p className="text-sm font-medium text-[var(--text-primary)] mb-1">
              {t('quiz.explanation')}
            </p>
            <p className="text-sm text-[var(--text-secondary)]">{currentQuestion.explicacion}</p>
          </div>

          <Button onClick={handleNext} className="w-full">
            {currentQuestionIndex < allQuestions.length - 1 ? t('quiz.next') : t('quiz.finish')}
          </Button>
        </div>
      )}
    </Card>
  )
}
