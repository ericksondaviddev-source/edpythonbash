import { Icon } from '../atoms'

export default function Footer() {
  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-[var(--bg-secondary)] border-t border-[var(--border)] px-6 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-[var(--text-primary)]">
            ED-python/bash
          </span>
          <span className="text-sm text-[var(--text-secondary)]">
            by ED-Dev
          </span>
        </div>
        <div className="flex items-center gap-4">
            <a
            href="https://linkedin.com/in/ed-dev"
            target="_blank"
            rel="noopener noreferrer"
            className="no-min-touch flex items-center gap-1 text-sm text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors"
          >
            <Icon name="linkedin" size={16} />
            <span className="hidden sm:inline">LinkedIn</span>
          </a>
          <a
            href="https://github.com/ed-dev"
            target="_blank"
            rel="noopener noreferrer"
            className="no-min-touch flex items-center gap-1 text-sm text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors"
          >
            <Icon name="github" size={16} />
            <span className="hidden sm:inline">GitHub</span>
          </a>
        </div>
      </div>
    </footer>
  )
}
