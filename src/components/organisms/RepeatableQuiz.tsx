import { useState, useCallback } from 'react'
import type { Quiz } from '../../types'
import { Button, Card } from '../atoms'
import QuizOption from '../molecules/QuizOption'

interface RepeatableQuizProps {
  quiz: Quiz
  onComplete: (score: number, total: number) => void
}

export default function RepeatableQuiz({ quiz, onComplete }: RepeatableQuizProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [score, setScore] = useState(0)
  const [showExplanation, setShowExplanation] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)
  const [isComplete, setIsComplete] = useState(false)

  const isCorrect = selected === quiz.correcta

  const handleSelect = (option: string) => {
    if (showExplanation) return
    setSelected(option)
    setShowExplanation(true)
    if (option === quiz.correcta) {
      setScore(s => s + 1)
    }
  }

  const handleNext = useCallback(() => {
    if (currentQuestion < 0) {
      setIsComplete(true)
      onComplete(score, 1)
    } else {
      setCurrentQuestion(q => q + 1)
      setSelected(null)
      setShowExplanation(false)
    }
  }, [currentQuestion, score, onComplete])

  const handleRetry = () => {
    setCurrentQuestion(0)
    setScore(0)
    setSelected(null)
    setShowExplanation(false)
    setIsComplete(false)
  }

  if (isComplete) {
    return (
      <Card title="Quiz Completado">
        <div className="text-center">
          <p className="text-2xl font-bold text-[var(--accent)] mb-2">
            {score}/{1}
          </p>
          <p className="text-[var(--text-secondary)] mb-4">
            {score === 1 ? '¡Perfecto!' : 'Sigue practicando'}
          </p>
          <Button onClick={handleRetry}>
            Repetir Quiz
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <Card title={`Quiz - Pregunta ${currentQuestion + 1}`}>
      <div className="mb-6">
        <p className="text-[var(--text-primary)] font-medium mb-4">{quiz.pregunta}</p>

        <div className="space-y-3">
          {quiz.opciones.map((option, index) => {
            const letter = String.fromCharCode(65 + index)
            return (
              <QuizOption
                key={letter}
                letter={letter}
                text={option}
                isSelected={selected === letter}
                isCorrect={letter === quiz.correcta}
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
              {isCorrect ? '¡Correcto!' : 'Incorrecto'}
            </p>
          </div>

          <div className="p-4 rounded-lg bg-[var(--bg-tertiary)]">
            <p className="text-sm font-medium text-[var(--text-primary)] mb-1">
              Explicación
            </p>
            <p className="text-sm text-[var(--text-secondary)]">{quiz.explicacion}</p>
          </div>

          <Button onClick={handleNext} className="w-full">
            Siguiente
          </Button>
        </div>
      )}
    </Card>
  )
}
