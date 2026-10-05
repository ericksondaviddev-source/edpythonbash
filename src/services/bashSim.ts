interface BashResult {
  stdout: string
  stderr: string
  exitCode: number
}

type TokenOp = '|' | '>' | '>>' | '<' | ';' | '&&'
type Item = { kind: 'text'; v: string } | { kind: 'op'; v: TokenOp }

class BashSim {
  filesystem: Map<string, string> = new Map()
  env: Map<string, string> = new Map()
  cwd: string = '/home/user'

  constructor() {
    this.env.set('HOME', '/home/user')
    this.env.set('USER', 'user')
    this.env.set('PATH', '/usr/bin:/bin')
    this.filesystem.set('/home/user', '')
  }

  run(command: string): BashResult {
    const trimmed = command.trim()
    if (!trimmed) {
      return { stdout: '', stderr: '', exitCode: 0 }
    }

    try {
      return this.runSequences(this.tokenize(trimmed))
    } catch (error: any) {
      return { stdout: '', stderr: error.message, exitCode: 1 }
    }
  }

  /** Divide la línea en textos y operadores, respetando comillas simples/dobles. */
  private tokenize(s: string): Item[] {
    const items: Item[] = []
    let cur = ''
    let inQuote = false
    let qc = ''
    const flushText = () => {
      if (cur.trim()) items.push({ kind: 'text', v: cur.trim() })
      cur = ''
    }
    for (let i = 0; i < s.length; i++) {
      const c = s[i]
      if ((c === '"' || c === "'") && !inQuote) {
        inQuote = true
        qc = c
        cur += c
        continue
      }
      if (c === qc && inQuote) {
        inQuote = false
        qc = ''
        cur += c
        continue
      }
      if (!inQuote) {
        if (c === '|' ) { flushText(); items.push({ kind: 'op', v: '|' }); continue }
        if (c === ';') { flushText(); items.push({ kind: 'op', v: ';' }); continue }
        if (c === '&' && s[i + 1] === '&') { flushText(); items.push({ kind: 'op', v: '&&' }); i++; continue }
        if (c === '>' && s[i + 1] === '>') { flushText(); items.push({ kind: 'op', v: '>>' }); i++; continue }
        if (c === '>') { flushText(); items.push({ kind: 'op', v: '>' }); continue }
        if (c === '<') { flushText(); items.push({ kind: 'op', v: '<' }); continue }
      }
      cur += c
    }
    flushText()
    return items
  }

  private splitItems(items: Item[], op: TokenOp): Item[][] {
    const groups: Item[][] = [[]]
    for (const it of items) {
      if (it.kind === 'op' && it.v === op) groups.push([])
      else groups[groups.length - 1].push(it)
    }
    return groups
  }

  private syntaxError(near: string): BashResult {
    return { stdout: '', stderr: `bash: syntax error near unexpected token \`${near}'`, exitCode: 2 }
  }

  /** `cmd1; cmd2` — ejecuta todo en secuencia, el exit es el del último. */
  private runSequences(items: Item[]): BashResult {
    const groups = this.splitItems(items, ';')
    let stdout = ''
    let stderr = ''
    let exitCode = 0
    for (const g of groups) {
      if (g.length === 0) return this.syntaxError(';')
      const r = this.runAnds(g)
      if (r.exitCode === 2 && r.stderr.startsWith('bash: syntax error')) return r
      stdout += r.stdout ? (stdout ? '\n' : '') + r.stdout : ''
      stderr += r.stderr ? (stderr ? '\n' : '') + r.stderr : ''
      exitCode = r.exitCode
    }
    return { stdout, stderr, exitCode }
  }

  /** `cmd1 && cmd2` — cortocircuito al primer fallo. */
  private runAnds(items: Item[]): BashResult {
    const groups = this.splitItems(items, '&&')
    let stdout = ''
    let stderr = ''
    let exitCode = 0
    for (const g of groups) {
      if (g.length === 0) return this.syntaxError('&&')
      const r = this.runPipeline(g)
      if (r.exitCode === 2 && r.stderr.startsWith('bash: syntax error')) return r
      stdout += r.stdout ? (stdout ? '\n' : '') + r.stdout : ''
      stderr += r.stderr ? (stderr ? '\n' : '') + r.stderr : ''
      exitCode = r.exitCode
      if (exitCode !== 0) break
    }
    return { stdout, stderr, exitCode }
  }

  /** `cmd1 | cmd2` con `< entrada` en la primera etapa y `> / >> salida` en la última. */
  private runPipeline(items: Item[]): BashResult {
    const stages = this.splitItems(items, '|')
    for (const s of stages) {
      if (s.length === 0) return this.syntaxError('|')
    }
    let stdin = ''
    let stderrAll = ''
    let last: BashResult = { stdout: '', stderr: '', exitCode: 0 }
    for (let si = 0; si < stages.length; si++) {
      const first = si === 0
      const lastStage = si === stages.length - 1
      const parsed = this.parseStage(stages[si], first, lastStage)
      if ('error' in parsed) return parsed.error
      let stageStdin = stdin
      if (parsed.inFile !== null) {
        const content = this.filesystem.get(parsed.inFile)
        if (content === undefined) {
          return { stdout: '', stderr: `bash: ${parsed.inFile}: No such file or directory`, exitCode: 1 }
        }
        stageStdin = content
      }
      last = this.runSingle(parsed.cmdText, stageStdin)
      if (last.stderr) stderrAll += (stderrAll ? '\n' : '') + last.stderr
      stdin = last.stdout
      if (parsed.outFile !== null) {
        const prev = parsed.append ? (this.filesystem.get(parsed.outFile) ?? '') : ''
        this.filesystem.set(parsed.outFile, prev + last.stdout)
        last = { stdout: '', stderr: stderrAll, exitCode: last.exitCode }
      }
    }
    return { stdout: last.stdout, stderr: stderrAll, exitCode: last.exitCode }
  }

  private parseStage(
    items: Item[], first: boolean, lastStage: boolean
  ): { cmdText: string; inFile: string | null; outFile: string | null; append: boolean } | { error: BashResult } {
    const cmdParts: string[] = []
    let inFile: string | null = null
    let outFile: string | null = null
    let append = false
    let seenIn = false
    let seenOut = false
    for (let k = 0; k < items.length; k++) {
      const it = items[k]
      if (it.kind === 'text') {
        cmdParts.push(it.v)
        continue
      }
      const op = it.v
      if (op !== '<' && op !== '>' && op !== '>>') return { error: this.syntaxError(op) }
      const nxt = items[k + 1]
      if (!nxt || nxt.kind !== 'text' || !nxt.v || /\s/.test(nxt.v.replace(/^(['"]).*\1$/, ''))) {
        return { error: this.syntaxError(op) }
      }
      const target = this.stripQuotes(nxt.v)
      if (op === '<') {
        if (!first || seenIn) return { error: this.syntaxError(op) }
        seenIn = true
        inFile = target
      } else {
        if (!lastStage || seenOut) return { error: this.syntaxError(op) }
        seenOut = true
        outFile = target
        append = op === '>>'
      }
      k++ // consumir el target
    }
    if (cmdParts.length === 0) return { error: this.syntaxError('|') }
    return { cmdText: cmdParts.join(' '), inFile, outFile, append }
  }

  private stripQuotes(s: string): string {
    if (s.length >= 2 && ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'")))) {
      return s.slice(1, -1)
    }
    return s
  }

  private runSingle(cmdText: string, stdin: string): BashResult {
    const parts = this.parseCommand(cmdText).map(p => this.stripQuotes(p))
    const cmd = parts[0]
    const args = parts.slice(1)

    switch (cmd) {
      case 'echo':
        return this.echo(args)
      case 'ls':
        return this.ls(args)
      case 'pwd':
        return { stdout: this.cwd, stderr: '', exitCode: 0 }
      case 'cd':
        return this.cd(args)
      case 'cat':
        return this.cat(args, stdin)
      case 'mkdir':
        return this.mkdir(args)
      case 'rm':
        return this.rm(args)
      case 'cp':
        return this.cp(args)
      case 'mv':
        return this.mv(args)
      case 'grep':
        return this.grep(args, stdin)
      case 'wc':
        return this.wc(args, stdin)
      case 'find':
        return this.find(args)
      case 'export':
        return this.export(args)
      default:
        return { stdout: '', stderr: `bash: ${cmd}: command not found`, exitCode: 127 }
    }
  }

  private parseCommand(command: string): string[] {
    const parts: string[] = []
    let current = ''
    let inQuote = false
    let quoteChar = ''

    for (const char of command) {
      if ((char === '"' || char === "'") && !inQuote) {
        inQuote = true
        quoteChar = char
      } else if (char === quoteChar && inQuote) {
        inQuote = false
        quoteChar = ''
      } else if (char === ' ' && !inQuote) {
        if (current) {
          parts.push(current)
          current = ''
        }
      } else {
        current += char
      }
    }

    if (current) {
      parts.push(current)
    }

    return parts
  }

  private echo(args: string[]): BashResult {
    const text = args.join(' ')
    return { stdout: text, stderr: '', exitCode: 0 }
  }

  private ls(args: string[]): BashResult {
    const target = args[0] || this.cwd
    const files = Array.from(this.filesystem.keys()).filter(f => f.startsWith(target))
    return { stdout: files.join('\n'), stderr: '', exitCode: 0 }
  }

  private cd(args: string[]): BashResult {
    const target = args[0] || this.env.get('HOME') || '/'
    if (this.filesystem.has(target)) {
      this.cwd = target
      return { stdout: '', stderr: '', exitCode: 0 }
    }
    return { stdout: '', stderr: `bash: cd: ${target}: No such file or directory`, exitCode: 1 }
  }

  private cat(args: string[], stdin: string): BashResult {
    const file = args[0]
    if (!file) {
      return { stdout: stdin, stderr: '', exitCode: 0 }
    }
    const content = this.filesystem.get(file)
    if (content === undefined) {
      return { stdout: '', stderr: `cat: ${file}: No such file or directory`, exitCode: 1 }
    }
    return { stdout: content, stderr: '', exitCode: 0 }
  }

  private mkdir(args: string[]): BashResult {
    const dir = args[0]
    if (!dir) {
      return { stdout: '', stderr: 'mkdir: missing operand', exitCode: 1 }
    }
    this.filesystem.set(dir, '')
    return { stdout: '', stderr: '', exitCode: 0 }
  }

  private rm(args: string[]): BashResult {
    const file = args[0]
    if (!file) {
      return { stdout: '', stderr: 'rm: missing operand', exitCode: 1 }
    }
    if (!this.filesystem.has(file)) {
      return { stdout: '', stderr: `rm: cannot remove '${file}': No such file or directory`, exitCode: 1 }
    }
    this.filesystem.delete(file)
    return { stdout: '', stderr: '', exitCode: 0 }
  }

  private cp(args: string[]): BashResult {
    if (args.length < 2) {
      return { stdout: '', stderr: 'cp: missing operand', exitCode: 1 }
    }
    const src = args[0]
    const dest = args[1]
    const content = this.filesystem.get(src)
    if (content === undefined) {
      return { stdout: '', stderr: `cp: cannot stat '${src}': No such file or directory`, exitCode: 1 }
    }
    this.filesystem.set(dest, content)
    return { stdout: '', stderr: '', exitCode: 0 }
  }

  private mv(args: string[]): BashResult {
    if (args.length < 2) {
      return { stdout: '', stderr: 'mv: missing operand', exitCode: 1 }
    }
    const src = args[0]
    const dest = args[1]
    const content = this.filesystem.get(src)
    if (content === undefined) {
      return { stdout: '', stderr: `mv: cannot stat '${src}': No such file or directory`, exitCode: 1 }
    }
    this.filesystem.set(dest, content)
    this.filesystem.delete(src)
    return { stdout: '', stderr: '', exitCode: 0 }
  }

  private grep(args: string[], stdin: string): BashResult {
    if (args.length < 1) {
      return { stdout: '', stderr: 'grep: missing operand', exitCode: 1 }
    }
    const pattern = args[0]
    const file = args[1]
    const content = file === undefined ? stdin : this.filesystem.get(file)
    if (content === undefined) {
      return { stdout: '', stderr: `grep: ${file}: No such file or directory`, exitCode: 1 }
    }
    const lines = content.split('\n').filter(l => l.includes(pattern))
    return { stdout: lines.join('\n'), stderr: '', exitCode: lines.length > 0 ? 0 : 1 }
  }

  private wc(args: string[], stdin: string): BashResult {
    const file = args[0]
    const content = file === undefined ? stdin : this.filesystem.get(file)
    if (content === undefined) {
      return { stdout: '', stderr: `wc: ${file}: No such file or directory`, exitCode: 1 }
    }
    const lines = content ? content.split('\n').length : 0
    const words = content.split(/\s+/).filter(w => w).length
    const chars = content.length
    return { stdout: file === undefined ? `${lines} ${words} ${chars}` : `${lines} ${words} ${chars} ${file}`, stderr: '', exitCode: 0 }
  }

  private find(args: string[]): BashResult {
    const dir = args[0] || this.cwd
    const files = Array.from(this.filesystem.keys()).filter(f => f.startsWith(dir))
    return { stdout: files.join('\n'), stderr: '', exitCode: 0 }
  }

  private export(args: string[]): BashResult {
    const assignment = args[0]
    const [key, value] = assignment.split('=')
    if (key && value) {
      this.env.set(key, value)
    }
    return { stdout: '', stderr: '', exitCode: 0 }
  }
}

export default BashSim
