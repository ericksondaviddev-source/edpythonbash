import { useState } from 'react'

interface Tab {
  id: string
  label: string
  content: React.ReactNode
}

interface TabsProps {
  tabs: Tab[]
  defaultTab?: string
  className?: string
}

export default function Tabs({ tabs, defaultTab, className = '' }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id)

  return (
    <div className={className}>
      <div
        role="tablist"
        className="flex gap-1 mb-4 p-1 rounded-[var(--radius-md)] bg-[var(--bg-tertiary)]/70 border border-[var(--border)] w-fit max-w-full overflow-x-auto"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-1.5 text-sm font-medium rounded-[var(--radius-sm)] press whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'bg-[var(--bg-primary)] text-[var(--text-primary)] shadow-apple-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div role="tabpanel">
        {tabs.find((tab) => tab.id === activeTab)?.content}
      </div>
    </div>
  )
}
