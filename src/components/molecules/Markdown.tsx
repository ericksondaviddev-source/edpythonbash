import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface MarkdownProps {
  content: string
  className?: string
}

export default function Markdown({ content, className = '' }: MarkdownProps) {
  return (
    <div className={`prose-lesson ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => (
            <p className="text-[var(--text-secondary)] leading-relaxed mb-3 last:mb-0">{children}</p>
          ),
          strong: ({ children }) => (
            <strong className="text-[var(--text-primary)] font-semibold">{children}</strong>
          ),
          code: ({ children, className }) => {
            const isBlock = className?.includes('language-')
            if (isBlock) {
              return <code className="block font-mono text-sm bg-[var(--code-bg)] text-[var(--code-text)] p-3 rounded-lg overflow-x-auto my-2">{children}</code>
            }
            return (
              <code className="font-mono text-sm bg-[var(--bg-tertiary)] text-[var(--accent)] px-1.5 py-0.5 rounded">
                {children}
              </code>
            )
          },
          ul: ({ children }) => (
            <ul className="list-disc list-inside text-[var(--text-secondary)] leading-relaxed mb-3 space-y-1">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside text-[var(--text-secondary)] leading-relaxed mb-3 space-y-1">{children}</ol>
          ),
          li: ({ children }) => <li className="marker:text-[var(--accent)]">{children}</li>,
          h1: ({ children }) => (
            <h1 className="text-xl font-bold text-[var(--text-primary)] mb-3">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-lg font-bold text-[var(--text-primary)] mb-2 mt-4">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-base font-semibold text-[var(--text-primary)] mb-2 mt-3">{children}</h3>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-[var(--accent)] pl-4 py-1 my-3 bg-[var(--bg-tertiary)]/50 rounded-r-lg">
              {children}
            </blockquote>
          ),
          a: ({ children, href }) => (
            <a href={href} target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] hover:underline">
              {children}
            </a>
          )
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
