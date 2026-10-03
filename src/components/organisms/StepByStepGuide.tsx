import { useState } from 'react'
import { Button, Card } from '../atoms'

interface Step {
  title: string
  description: string
  code?: string
  hint?: string
}

interface StepByStepGuideProps {
  steps: Step[]
  onComplete: () => void
}

export default function StepByStepGuide({ steps, onComplete }: StepByStepGuideProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [showHint, setShowHint] = useState(false)

  const step = steps[currentStep]
  const isLastStep = currentStep === steps.length - 1

  const handleNext = () => {
    if (isLastStep) {
      onComplete()
    } else {
      setCurrentStep(s => s + 1)
      setShowHint(false)
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(s => s - 1)
      setShowHint(false)
    }
  }

  return (
    <Card title={`Guía Paso a Paso - Paso ${currentStep + 1}/${steps.length}`}>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
          {step.title}
        </h3>
        <p className="text-[var(--text-secondary)] mb-4">{step.description}</p>

        {step.code && (
          <pre className="p-4 bg-[var(--code-bg)] text-[var(--code-text)] rounded-lg font-mono text-sm overflow-x-auto">
            {step.code}
          </pre>
        )}

        {step.hint && (
          <div className="mt-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowHint(!showHint)}
            >
              {showHint ? 'Ocultar pista' : 'Mostrar pista'}
            </Button>
            {showHint && (
              <p className="mt-2 text-sm text-[var(--warning)] bg-[var(--warning)] bg-opacity-10 p-3 rounded-lg">
                {step.hint}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Button
          variant="secondary"
          onClick={handlePrev}
          disabled={currentStep === 0}
        >
          Anterior
        </Button>
        <Button onClick={handleNext} className="flex-1">
          {isLastStep ? 'Completar' : 'Siguiente'}
        </Button>
      </div>
    </Card>
  )
}
