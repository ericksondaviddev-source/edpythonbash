export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--bg-primary)]">
      <div className="text-center">
        <div className="mb-4">
          <svg width="80" height="80" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="mx-auto animate-pulse">
            <rect width="32" height="32" rx="6" fill="#1E1E2E"/>
            <rect x="4" y="4" width="24" height="24" rx="3" fill="#FF6B35"/>
            <path d="M10 12L14 16L10 20" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M16 20H22" stroke="white" strokeWidth={2} strokeLinecap="round"/>
          </svg>
        </div>
        <p className="text-[var(--text-secondary)] text-sm animate-pulse">
          Cargando...
        </p>
      </div>
    </div>
  )
}
