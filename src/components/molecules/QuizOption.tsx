interface QuizOptionProps {
  letter: string
  text: string
  isSelected: boolean
  isCorrect: boolean
  showResult: boolean
  onClick: () => void
}

export default function QuizOption({
  letter,
  text,
  isSelected,
  isCorrect,
  showResult,
  onClick
}: QuizOptionProps) {
  let buttonClass = 'w-full p-4 text-left rounded-lg border transition-all '

  if (showResult) {
    if (isCorrect) {
      buttonClass += 'bg-[var(--success)] bg-opacity-20 border-[var(--success)] text-[var(--success)]'
    } else if (isSelected && !isCorrect) {
      buttonClass += 'bg-[var(--error)] bg-opacity-20 border-[var(--error)] text-[var(--error)]'
    } else {
      buttonClass += 'bg-[var(--bg-tertiary)] border-[var(--border)] text-[var(--text-secondary)]'
    }
  } else {
    buttonClass += 'bg-[var(--bg-tertiary)] border-[var(--border)] text-[var(--text-primary)] hover:border-[var(--accent)] hover:bg-[var(--accent)] hover:bg-opacity-10'
  }

  return (
    <button
      onClick={onClick}
      disabled={showResult}
      className={buttonClass}
    >
      <span className="font-medium mr-2">{letter}.</span>
      {text}
    </button>
  )
}
