import type { FlowchartData, FlowchartEdge } from '../types/lesson'
import { isYesLabel } from './flowchartValidate'

export interface FlowchartCode {
  /** Pseudocódigo en español (palabras INICIO/SI/SINO/FIN). */
  pseudo: string
  /** Esqueleto con sintaxis Python (ilustrativo, no ejecutable). */
  python: string
  /** Esqueleto con sintaxis JavaScript (ilustrativo, no ejecutable). */
  javascript: string
  /** false si el diagrama tiene callejones o ciclos sin resolver. */
  complete: boolean
}

const MAX_DEPTH = 64

function sortedOutgoing(data: FlowchartData, nodeId: string): FlowchartEdge[] {
  const outs = data.edges.filter(e => e.source === nodeId)
  return [...outs].sort((a, b) => Number(isYesLabel(b.label)) - Number(isYesLabel(a.label)))
}

/**
 * Recorre el grafo desde el primer nodo Start y genera pseudocódigo + Python + JavaScript.
 * Detecta el nodo de unión para no repetir la cola común de varias ramas.
 * Puro y determinista; nunca ejecuta código.
 */
export function flowchartToCode(data: FlowchartData): FlowchartCode {
  const byId = new Map(data.nodes.map(n => [n.id, n]))
  const start = data.nodes.find(n => n.type === 'start')
  if (!start) return { pseudo: '', python: '', javascript: '', complete: false }

  const pseudo: string[] = []
  const python: string[] = []
  const js: string[] = []
  const onPath = new Set<string>()
  let complete = true

  const pad = (d: number) => '    '.repeat(d)

  /** Nodos alcanzables desde `from` sin cruzar los bloqueados, con su distancia. */
  const reachable = (from: string, blocked: Set<string>): Map<string, number> => {
    const dist = new Map<string, number>()
    const queue: Array<[string, number]> = [[from, 0]]
    while (queue.length > 0) {
      const [id, d] = queue.shift() as [string, number]
      if (blocked.has(id) || dist.has(id)) continue
      dist.set(id, d)
      for (const e of data.edges) {
        if (e.source === id && byId.has(e.target)) queue.push([e.target, d + 1])
      }
    }
    return dist
  }

  /**
   * Primer nodo por el que pasan todas las ramas de una decisión.
   * Es la «cola común»: se emite una sola vez, después de FIN SI.
   */
  const findJoin = (outs: FlowchartEdge[], stopAt?: Set<string>): string | undefined => {
    const blocked = new Set([...onPath, ...(stopAt ?? [])])
    const targets = outs.map(e => e.target).filter(t => !blocked.has(t))
    if (targets.length < 2) return undefined

    const maps = targets.map(t => reachable(t, blocked))
    let common = [...maps[0].keys()]
    for (let i = 1; i < maps.length && common.length > 0; i++) {
      const m = maps[i]
      common = common.filter(k => m.has(k))
    }
    if (common.length === 0) return undefined

    const cost = (k: string) => Math.max(...maps.map(m => m.get(k) ?? 0))
    common.sort((a, b) => cost(a) - cost(b))
    return common[0]
  }

  const walk = (id: string, depth: number, stopAt?: Set<string>) => {
    if (depth > MAX_DEPTH) {
      complete = false
      return
    }
    const node = byId.get(id)
    if (!node) return
    if (stopAt?.has(id)) return

    if (onPath.has(id)) {
      pseudo.push(`${pad(depth)}⤴ volver a "${node.data.label}"`)
      python.push(`${pad(depth)}# volver a: ${node.data.label}`)
      js.push(`${pad(depth)}// volver a: ${node.data.label}`)
      return
    }
    onPath.add(id)

    if (node.type === 'start') {
      pseudo.push('INICIO')
      python.push('# INICIO')
      js.push('// INICIO')
      const outs = sortedOutgoing(data, id)
      if (outs.length === 0) complete = false
      outs.forEach(e => walk(e.target, depth, stopAt))
    } else if (node.type === 'process') {
      pseudo.push(`${pad(depth)}${node.data.label}`)
      python.push(`${pad(depth)}# ${node.data.label}`)
      js.push(`${pad(depth)}// ${node.data.label}`)
      const outs = sortedOutgoing(data, id)
      if (outs.length === 0) complete = false
      outs.forEach(e => walk(e.target, depth, stopAt))
    } else if (node.type === 'end') {
      // El fin se emite una sola vez al cerrar el flujo (evita FIN por rama).
    } else if (node.type === 'decision') {
      const outs = sortedOutgoing(data, id)
      if (outs.length === 0) complete = false

      const join = findJoin(outs, stopAt)
      const innerStop = join ? new Set([...(stopAt ?? []), join]) : stopAt

      outs.forEach((e, i) => {
        const first = i === 0
        const last = i === outs.length - 1
        const cond = e.label ? `${node.data.label} (${e.label})` : node.data.label
        if (first) {
          pseudo.push(`${pad(depth)}SI ${cond} ENTONCES`)
          python.push(`${pad(depth)}if ${cond}:`)
          js.push(`${pad(depth)}if (${cond}) {`)
        } else if (last) {
          pseudo.push(`${pad(depth)}SINO`)
          python.push(`${pad(depth)}else:`)
          js.push(`${pad(depth)}} else {`)
        } else {
          pseudo.push(`${pad(depth)}SINO SI ${cond} ENTONCES`)
          python.push(`${pad(depth)}elif ${cond}:`)
          js.push(`${pad(depth)}} else if (${cond}) {`)
        }
        walk(e.target, depth + 1, innerStop)
      })

      pseudo.push(`${pad(depth)}FIN SI`)
      python.push('')
      js.push(`${pad(depth)}}`)
      if (join) walk(join, depth, stopAt)
    }

    onPath.delete(id)
  }

  walk(start.id, 0)

  pseudo.push('FIN')
  python.push('# FIN')
  js.push('// FIN')

  return { pseudo: pseudo.join('\n'), python: python.join('\n'), javascript: js.join('\n'), complete }
}
