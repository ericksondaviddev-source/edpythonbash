import { useEffect, useMemo, useState, lazy, Suspense } from 'react'
import { HashRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useThemeStore } from './store/useThemeStore'
import { useLanguageStore } from './store/useLanguageStore'
import { useProgressStore } from './store/useProgressStore'
import { getLessonCatalog, getModulesFromCatalog, fetchLessonById } from './services/lessonService'
import type { Lesson, LessonSummary } from './types'
import Header from './components/layout/Header'
import Sidebar from './components/layout/Sidebar'
import Footer from './components/layout/Footer'
import { Button, Icon } from './components/atoms'

// Code-splitting por vistas y modales pesados
const Dashboard = lazy(() => import('./pages/Dashboard'))
const LessonView = lazy(() => import('./components/lesson/LessonView'))
const AIPanel = lazy(() => import('./components/organisms/AIPanel'))
const APIKeySettings = lazy(() => import('./components/layout/APIKeySettings'))

function PageFallback() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="w-8 h-8 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

function AppShell() {
  const navigate = useNavigate()
  const location = useLocation()
  const lessonId = location.pathname.startsWith('/leccion/')
    ? decodeURIComponent(location.pathname.split('/')[2])
    : null
  const { theme } = useThemeStore()
  const { lang } = useLanguageStore()
  const { t } = useTranslation()
  const { completeLesson, touchVisit } = useProgressStore()

  // Carga ligera del catálogo (~48 KB) para Dashboard y Sidebar
  const modules = useMemo(() => getModulesFromCatalog(), [])
  const catalogLessons = useMemo(() => getLessonCatalog(), [])

  // Carga asíncrona bajo demanda de la lección activa
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null)
  const [isLoadingLesson, setIsLoadingLesson] = useState(false)

  const [isAIPanelOpen, setIsAIPanelOpen] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isAPIKeyModalOpen, setIsAPIKeyModalOpen] = useState(false)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  useEffect(() => {
    document.documentElement.setAttribute('lang', lang)
  }, [lang])

  useEffect(() => {
    touchVisit()
  }, [touchVisit])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  // Carga de lección bajo demanda al cambiar de ruta
  useEffect(() => {
    if (!lessonId) return

    let active = true
    setIsLoadingLesson(true)

    fetchLessonById(lessonId)
      .then((loaded) => {
        if (active) {
          setCurrentLesson(loaded)
          setIsLoadingLesson(false)
        }
      })
      .catch((err) => {
        console.error(`Error loading lesson ${lessonId}:`, err)
        if (active) {
          setCurrentLesson(null)
          setIsLoadingLesson(false)
        }
      })

    return () => {
      active = false
    }
  }, [lessonId])

  const activeLesson = lessonId && currentLesson?.id === lessonId ? currentLesson : null

  const handleLessonSelect = (lesson: Lesson | LessonSummary) => {
    navigate(`/leccion/${lesson.id}`)
    setIsSidebarOpen(false)
  }

  const handleBack = () => navigate('/')

  const handleCompleteLesson = () => {
    if (activeLesson) {
      completeLesson(activeLesson.id)
    }
  }

  const currentIndex = lessonId ? catalogLessons.findIndex((l) => l.id === lessonId) : -1
  const prevLesson = currentIndex > 0 ? catalogLessons[currentIndex - 1] : null
  const nextLesson =
    currentIndex >= 0 && currentIndex < catalogLessons.length - 1
      ? catalogLessons[currentIndex + 1]
      : null

  const moduloId = location.pathname.startsWith('/modulo/')
    ? decodeURIComponent(location.pathname.split('/')[2])
    : null
  const currentSummary = lessonId ? catalogLessons.find((l) => l.id === lessonId) : null
  const currentModule = activeLesson
    ? modules.find((m) => m.lecciones.some((l) => l.id === activeLesson.id)) ?? null
    : null
  const trailModule =
    currentModule ?? (moduloId ? modules.find((m) => m.id === moduloId) ?? null : null)
  const trail: { label: string; to?: string }[] = [{ label: t('nav.home'), to: '/' }]
  if (trailModule) {
    trail.push({ label: trailModule.nombre, to: `/modulo/${encodeURIComponent(trailModule.id)}` })
  }
  if (currentSummary) {
    trail.push({ label: currentSummary.competencia })
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] pb-16">
      <Header
        onOpenSettings={() => setIsAPIKeyModalOpen(true)}
        onOpenMenu={() => setIsSidebarOpen(true)}
        trail={trail}
      />

      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        >
          <div
            className="w-72 h-full bg-[var(--bg-secondary)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
              <span className="font-semibold text-[var(--text-primary)]">{t('nav.modules')}</span>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)]"
              >
                <Icon name="close" size={20} />
              </button>
            </div>
            <Sidebar
              modules={modules}
              onLessonSelect={handleLessonSelect}
              currentLessonId={lessonId ?? undefined}
            />
          </div>
        </div>
      )}

      <div className="flex">
        <div className="hidden md:block">
          <Sidebar
            modules={modules}
            onLessonSelect={handleLessonSelect}
            currentLessonId={lessonId ?? undefined}
          />
        </div>
        <main className="flex-1 p-4 md:p-6">
          <Suspense fallback={<PageFallback />}>
            <Routes>
              <Route
                path="/"
                element={
                  <Dashboard
                    modules={modules}
                    lessons={catalogLessons}
                    onLessonSelect={handleLessonSelect}
                    currentLessonId={lessonId ?? undefined}
                    onOpenSettings={() => setIsAPIKeyModalOpen(true)}
                  />
                }
              />
              <Route
                path="/modulo/:moduloId"
                element={
                  <Dashboard
                    modules={modules}
                    lessons={catalogLessons}
                    onLessonSelect={handleLessonSelect}
                    currentLessonId={lessonId ?? undefined}
                    onOpenSettings={() => setIsAPIKeyModalOpen(true)}
                  />
                }
              />
              <Route
                path="/leccion/:lessonId"
                element={
                  isLoadingLesson ? (
                    <PageFallback />
                  ) : activeLesson ? (
                    <LessonView
                      key={lessonId}
                      lesson={activeLesson}
                      onBack={handleBack}
                      onComplete={handleCompleteLesson}
                      onNavigate={(id) => navigate(`/leccion/${id}`)}
                      position={{ index: currentIndex, total: catalogLessons.length }}
                      prevLesson={prevLesson}
                      nextLesson={nextLesson}
                    />
                  ) : (
                    <Dashboard
                      modules={modules}
                      lessons={catalogLessons}
                      onLessonSelect={handleLessonSelect}
                      onOpenSettings={() => setIsAPIKeyModalOpen(true)}
                    />
                  )
                }
              />
              <Route
                path="*"
                element={
                  <Dashboard
                    modules={modules}
                    lessons={catalogLessons}
                    onLessonSelect={handleLessonSelect}
                    currentLessonId={lessonId ?? undefined}
                  />
                }
              />
            </Routes>
          </Suspense>
        </main>
      </div>

      <Footer />

      {activeLesson && (
        <Button
          onClick={() => setIsAIPanelOpen(true)}
          className="fixed bottom-20 right-6 z-40"
        >
          <Icon name="chat" size={16} />
          {t('nav.aiTutor')}
        </Button>
      )}

      <Suspense fallback={null}>
        {isAIPanelOpen && activeLesson && (
          <AIPanel
            lesson={activeLesson}
            isOpen={isAIPanelOpen}
            onClose={() => setIsAIPanelOpen(false)}
          />
        )}
      </Suspense>

      <Suspense fallback={null}>
        {isAPIKeyModalOpen && (
          <APIKeySettings
            isOpen={isAPIKeyModalOpen}
            onClose={() => setIsAPIKeyModalOpen(false)}
          />
        )}
      </Suspense>
    </div>
  )
}

function App() {
  return (
    <HashRouter>
      <AppShell />
    </HashRouter>
  )
}

export default App
