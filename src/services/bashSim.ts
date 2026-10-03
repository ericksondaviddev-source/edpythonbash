interface BashResult {
  stdout: string
  stderr: string
  exitCode: number
}

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
      const parts = this.parseCommand(trimmed)
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
          return this.cat(args)
        case 'mkdir':
          return this.mkdir(args)
        case 'rm':
          return this.rm(args)
        case 'cp':
          return this.cp(args)
        case 'mv':
          return this.mv(args)
        case 'grep':
          return this.grep(args)
        case 'wc':
          return this.wc(args)
        case 'find':
          return this.find(args)
        case 'export':
          return this.export(args)
        default:
          return { stdout: '', stderr: `bash: ${cmd}: command not found`, exitCode: 127 }
      }
    } catch (error: any) {
      return { stdout: '', stderr: error.message, exitCode: 1 }
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

  private cat(args: string[]): BashResult {
    const file = args[0]
    if (!file) {
      return { stdout: '', stderr: 'cat: missing operand', exitCode: 1 }
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

  private grep(args: string[]): BashResult {
    if (args.length < 2) {
      return { stdout: '', stderr: 'grep: missing operand', exitCode: 1 }
    }
    const pattern = args[0]
    const file = args[1]
    const content = this.filesystem.get(file)
    if (content === undefined) {
      return { stdout: '', stderr: `grep: ${file}: No such file or directory`, exitCode: 1 }
    }
    const lines = content.split('\n').filter(l => l.includes(pattern))
    return { stdout: lines.join('\n'), stderr: '', exitCode: lines.length > 0 ? 0 : 1 }
  }

  private wc(args: string[]): BashResult {
    const file = args[0]
    const content = this.filesystem.get(file)
    if (content === undefined) {
      return { stdout: '', stderr: `wc: ${file}: No such file or directory`, exitCode: 1 }
    }
    const lines = content.split('\n').length
    const words = content.split(/\s+/).filter(w => w).length
    const chars = content.length
    return { stdout: `${lines} ${words} ${chars} ${file}`, stderr: '', exitCode: 0 }
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
