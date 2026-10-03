import { useState } from 'react'
import type { Quiz } from '../../types'
import { Button, Card } from '../atoms'
import QuizOption from '../molecules/QuizOption'

interface QuizEngineProps {
  quiz: Quiz
  onComplete: (correct: boolean) => void
}

export default function QuizEngine({ quiz, onComplete }: QuizEngineProps) {
  const [selected, setSelected] = useState<string | null>(null)
  const [showExplanation, setShowExplanation] = useState(false)

  const isCorrect = selected === quiz.correcta

  const handleSelect = (option: string) => {
    if (showExplanation) return
    setSelected(option)
    setShowExplanation(true)
  }

  const handleNext = () => {
    onComplete(isCorrect)
  }

  return (
    <Card title="Quiz">
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
            Finalizar
          </Button>
        </div>
      )}
    </Card>
  )
}
