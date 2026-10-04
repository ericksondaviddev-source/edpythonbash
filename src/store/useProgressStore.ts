import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ProgressState {
  completedLessons: string[]
  xp: number
  level: number
  streak: number
  lastVisit: string

  completeLesson: (id: string) => void
  addXP: (amount: number) => void
  resetProgress: () => void
  touchVisit: () => void
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set) => ({
      completedLessons: [],
      xp: 0,
      level: 1,
      streak: 0,
      lastVisit: new Date().toISOString(),

      touchVisit: () =>
        set((state) => {
          const today = new Date()
          const todayStr = today.toISOString().slice(0, 10)
          const lastStr = state.lastVisit.slice(0, 10)
          if (lastStr === todayStr) return state
          const diffDays = Math.floor((today.getTime() - new Date(state.lastVisit).getTime()) / 86400000)
          return {
            ...state,
            streak: diffDays === 1 ? state.streak + 1 : 1,
            lastVisit: today.toISOString()
          }
        }),

      completeLesson: (id: string) =>
        set((state) => {
          if (state.completedLessons.includes(id)) return state
          return {
            ...state,
            completedLessons: [...state.completedLessons, id],
            xp: state.xp + 10,
            level: Math.floor((state.xp + 10) / 100) + 1
          }
        }),

      addXP: (amount: number) =>
        set((state) => ({
          ...state,
          xp: state.xp + amount,
          level: Math.floor((state.xp + amount) / 100) + 1
        })),

      resetProgress: () =>
        set({
          completedLessons: [],
          xp: 0,
          level: 1,
          streak: 0,
          lastVisit: new Date().toISOString()
        })
    }),
    {
      name: 'progress-storage'
    }
  )
)
