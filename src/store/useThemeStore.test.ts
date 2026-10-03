import { describe, it, expect, beforeEach } from 'vitest'
import { useThemeStore } from './useThemeStore'

describe('useThemeStore', () => {
  beforeEach(() => {
    useThemeStore.setState({ theme: 'dark' })
  })

  it('should toggle theme', () => {
    const { toggleTheme } = useThemeStore.getState()
    toggleTheme()
    expect(useThemeStore.getState().theme).toBe('light')
    toggleTheme()
    expect(useThemeStore.getState().theme).toBe('dark')
  })

  it('should have dark theme by default', () => {
    useThemeStore.setState({ theme: 'dark' })
    expect(useThemeStore.getState().theme).toBe('dark')
  })
})
