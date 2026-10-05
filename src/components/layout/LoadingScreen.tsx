export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--bg-primary)]">
      <div className="text-center">
        <div className="mb-4">
          <img src="/favicon.svg" alt="ED-python/bash" width={80} height={80} className="mx-auto animate-pulse" />
        </div>
        <p className="text-[var(--text-secondary)] text-sm animate-pulse">
          Cargando...
        </p>
      </div>
    </div>
  )
}
