import { describe, it, expect, beforeEach } from 'vitest'
import { useProgressStore } from './useProgressStore'

describe('useProgressStore', () => {
  beforeEach(() => {
    useProgressStore.getState().resetProgress()
  })

  it('should complete a lesson', () => {
    const { completeLesson } = useProgressStore.getState()
    completeLesson('LESSON-001')
    const state = useProgressStore.getState()
    expect(state.completedLessons).toContain('LESSON-001')
    expect(state.xp).toBe(10)
  })

  it('should not duplicate completed lessons', () => {
    const { completeLesson } = useProgressStore.getState()
    completeLesson('LESSON-001')
    completeLesson('LESSON-001')
    const state = useProgressStore.getState()
    expect(state.completedLessons).toHaveLength(1)
    expect(state.xp).toBe(10)
  })

  it('should add XP', () => {
    const { addXP } = useProgressStore.getState()
    addXP(50)
    const state = useProgressStore.getState()
    expect(state.xp).toBe(50)
  })

  it('should calculate level correctly', () => {
    const { addXP } = useProgressStore.getState()
    addXP(100)
    const state = useProgressStore.getState()
    expect(state.level).toBe(2)
  })

  it('should reset progress', () => {
    const { completeLesson, resetProgress } = useProgressStore.getState()
    completeLesson('LESSON-001')
    resetProgress()
    const state = useProgressStore.getState()
    expect(state.completedLessons).toHaveLength(0)
    expect(state.xp).toBe(0)
    expect(state.level).toBe(1)
  })
})
