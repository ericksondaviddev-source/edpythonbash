import { useState, useCallback, useRef } from 'react'

export function useVideo() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const intervalRef = useRef<number | null>(null)

  const play = useCallback((duration: number, onComplete?: () => void) => {
    setIsPlaying(true)
    setIsComplete(false)
    setCurrentTime(0)

    const startTime = Date.now()
    intervalRef.current = window.setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000
      setCurrentTime(elapsed)

      if (elapsed >= duration) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
        }
        setIsPlaying(false)
        setIsComplete(true)
        onComplete?.()
      }
    }, 100)
  }, [])

  const pause = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    setIsPlaying(false)
  }, [])

  const reset = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    setIsPlaying(false)
    setIsComplete(false)
    setCurrentTime(0)
  }, [])

  return { play, pause, reset, isPlaying, isComplete, currentTime }
}
