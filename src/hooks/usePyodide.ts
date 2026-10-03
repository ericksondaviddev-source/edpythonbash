import { useState, useCallback } from 'react'
import { PyodideRunner } from '../services/pyodide'

export function usePyodide() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [output, setOutput] = useState('')
  const runner = new PyodideRunner()

  const run = useCallback(async (code: string) => {
    setIsLoading(true)
    setError(null)
    setOutput('')

    try {
      const result = await runner.run(code)
      setOutput(result)
      return result
    } catch (err: any) {
      setError(err.message)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  const installPackage = useCallback(async (packageName: string) => {
    setIsLoading(true)
    setError(null)

    try {
      await runner.installPackage(packageName)
      return true
    } catch (err: any) {
      setError(err.message)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [])

  return { run, installPackage, isLoading, error, output }
}
