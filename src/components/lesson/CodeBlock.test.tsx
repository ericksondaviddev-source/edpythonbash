import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import CodeBlock from './CodeBlock'

beforeEach(() => {
  Object.assign(navigator, {
    clipboard: {
      writeText: vi.fn().mockResolvedValue(undefined)
    }
  })
})

describe('CodeBlock', () => {
  it('should render code', () => {
    render(<CodeBlock code="print('hello')" language="python" />)
    const codeElement = document.querySelector('code.language-python')
    expect(codeElement).toBeDefined()
    expect(codeElement?.textContent).toContain("print('hello')")
  })

  it('should render title', () => {
    render(<CodeBlock code="test" language="python" title="Test Title" />)
    expect(screen.getByText('Test Title')).toBeDefined()
  })

  it('should copy code to clipboard', () => {
    render(<CodeBlock code="test code" language="python" title="Test" />)
    const copyButton = screen.getAllByRole('button')[0]
    fireEvent.click(copyButton)
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('test code')
  })

  it('should show run button when runnable', () => {
    const onRun = vi.fn()
    render(<CodeBlock code="test" language="python" title="Test" runnable onRun={onRun} />)
    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBeGreaterThan(0)
  })

  it('should call onRun when run button clicked', () => {
    const onRun = vi.fn()
    render(<CodeBlock code="test" language="python" title="Test" runnable onRun={onRun} />)
    const buttons = screen.getAllByRole('button')
    fireEvent.click(buttons[buttons.length - 1])
    expect(onRun).toHaveBeenCalled()
  })
})
