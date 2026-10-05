import BashSim from './bashSim'

const bashSessions = new Map<string, BashSim>()

export function sessionKey(lessonId: string, engine: string): string {
  return `${lessonId}:${engine}`
}

export function getBashSession(lessonId: string): BashSim {
  const key = sessionKey(lessonId, 'bash_sim')
  let sim = bashSessions.get(key)
  if (!sim) {
    sim = new BashSim()
    bashSessions.set(key, sim)
  }
  return sim
}

export function resetBashSession(lessonId: string): void {
  bashSessions.delete(sessionKey(lessonId, 'bash_sim'))
}

export function clearAllSessions(): void {
  bashSessions.clear()
}
