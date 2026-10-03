import { useState, useCallback, useRef, useEffect } from 'react'

export function useAudio() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel()
    }
  }, [])

  const play = useCallback((text: string, lang: 'es' | 'en' = 'es') => {
    if (isPlaying) {
      window.speechSynthesis.pause()
      setIsPlaying(false)
      return
    }

    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume()
      setIsPlaying(true)
      return
    }

    setIsLoading(true)

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = lang === 'es' ? 'es-ES' : 'en-US'
    utterance.rate = 1
    utterance.pitch = 1

    utterance.onend = () => {
      setIsPlaying(false)
      setIsLoading(false)
    }

    utterance.onerror = () => {
      setIsPlaying(false)
      setIsLoading(false)
    }

    utteranceRef.current = utterance
    window.speechSynthesis.speak(utterance)
    setIsPlaying(true)
    setIsLoading(false)
  }, [isPlaying])

  const stop = useCallback(() => {
    window.speechSynthesis.cancel()
    setIsPlaying(false)
  }, [])

  return { play, stop, isPlaying, isLoading }
}
