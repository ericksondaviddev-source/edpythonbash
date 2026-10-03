import { useState, useMemo } from 'react'
import type { Quiz, Lesson } from '../../types'
import { useTranslation } from 'react-i18next'
import { Button, Card } from '../atoms'
import QuizOption from '../molecules/QuizOption'
import { generateQuestionsFromLesson, generateCodeQuestions } from '../../services/questionGenerator'

interface QuizEngineProps {
  quiz: Quiz
  lesson: Lesson
  onComplete: (correct: boolean) => void
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
      ...generated,
      ...codeQuestions
    ]
    return all.sort(() => Math.random() - 0.5).slice(0, 8)
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

  const handleNext = () => {
    if (currentQuestionIndex < allQuestions.length - 1) {
      setCurrentQuestionIndex(i => i + 1)
      setSelected(null)
      setShowExplanation(false)
    } else {
      setIsComplete(true)
      onComplete(score >= allQuestions.length / 2)
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
      <Card title="Quiz Completado">
        <div className="text-center">
          <p className="text-4xl font-bold text-[var(--accent)] mb-2">
            {score}/{allQuestions.length}
          </p>
          <p className="text-[var(--text-secondary)] mb-4">
            {score >= allQuestions.length / 2 ? '¡Excelente trabajo!' : 'Sigue practicando'}
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleRetry} className="flex-1">
              Repetir Quiz
            </Button>
            <Button onClick={() => onComplete(score >= allQuestions.length / 2)} className="flex-1">
              Finalizar
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
            currentQuestion.tipo === 'concepto' ? 'bg-blue-500 bg-opacity-20 text-blue-500' :
            currentQuestion.tipo === 'codigo' ? 'bg-green-500 bg-opacity-20 text-green-500' :
            'bg-red-500 bg-opacity-20 text-red-500'
          }`}>
            {currentQuestion.tipo === 'concepto' ? 'Concepto' : currentQuestion.tipo === 'codigo' ? 'Código' : 'Debugging'}
          </span>
          <span className="text-sm text-[var(--text-secondary)]">
            Puntuación: {score}/{currentQuestionIndex}
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
          <div className={`p-4 rounded-lg ${isCorrect ? 'bg-[var(--success)] bg-opacity-20' : 'bg-[var(--error)] bg-opacity-20'}`}>
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
            {currentQuestionIndex < allQuestions.length - 1 ? 'Siguiente' : 'Finalizar'}
          </Button>
        </div>
      )}
    </Card>
  )
}
