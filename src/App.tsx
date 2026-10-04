import { useEffect, useMemo, useState } from 'react'
import { HashRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useThemeStore } from './store/useThemeStore'
import { useLanguageStore } from './store/useLanguageStore'
import { useProgressStore } from './store/useProgressStore'
import { parseLessonsFromJSON, groupLessonsByModule, flattenOrderedLessons } from './lib/parser'
import type { Lesson } from './types'
import Header from './components/layout/Header'
import Sidebar from './components/layout/Sidebar'
import Footer from './components/layout/Footer'
import Dashboard from './pages/Dashboard'
import LessonView from './components/lesson/LessonView'
import AIPanel from './components/organisms/AIPanel'
import APIKeySettings from './components/layout/APIKeySettings'
import { Button, Icon } from './components/atoms'

const lessonFiles = import.meta.glob('./data/modulos/*.json', { eager: true, import: 'default' })
const validFiles: Record<string, any> = {}
for (const [path, content] of Object.entries(lessonFiles)) {
  if (path.includes('profiling_sim') || path.includes('EXTENSI')) continue
  validFiles[path] = content
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
  const [lessons] = useState<Lesson[]>(() => parseLessonsFromJSON(validFiles))
  const [isAIPanelOpen, setIsAIPanelOpen] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isAPIKeyModalOpen, setIsAPIKeyModalOpen] = useState(false)

  const modules = useMemo(() => groupLessonsByModule(lessons), [lessons])
  const orderedLessons = useMemo(() => flattenOrderedLessons(modules), [modules])
  const currentLesson = lessonId ? lessons.find(l => l.id === lessonId) ?? null : null

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  useEffect(() => {
    document.documentElement.setAttribute('lang', lang)
  }, [lang])

  useEffect(() => {
    touchVisit()
  }, [])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  const handleLessonSelect = (lesson: Lesson) => {
    navigate(`/leccion/${lesson.id}`)
    setIsSidebarOpen(false)
  }

  const handleBack = () => navigate('/')

  const handleCompleteLesson = () => {
    if (currentLesson) {
      completeLesson(currentLesson.id)
    }
  }

  const currentIndex = orderedLessons.findIndex(l => l.id === currentLesson?.id)

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] pb-16">
      <Header
        onOpenSettings={() => setIsAPIKeyModalOpen(true)}
        onOpenMenu={() => setIsSidebarOpen(true)}
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
              currentLessonId={currentLesson?.id}
            />
          </div>
        </div>
      )}

      <div className="flex">
        <div className="hidden md:block">
          <Sidebar
            modules={modules}
            onLessonSelect={handleLessonSelect}
            currentLessonId={currentLesson?.id}
          />
        </div>
        <main className="flex-1 p-4 md:p-6">
          <Routes>
            <Route
              path="/"
              element={
                <Dashboard
                  modules={modules}
                  lessons={lessons}
                  onLessonSelect={handleLessonSelect}
                />
              }
            />
            <Route
              path="/modulo/:moduloId"
              element={
                <Dashboard
                  modules={modules}
                  lessons={lessons}
                  onLessonSelect={handleLessonSelect}
                />
              }
            />
            <Route
              path="/leccion/:lessonId"
              element={
                currentLesson ? (
                  <LessonView
                    key={lessonId}
                    lesson={currentLesson}
                    onBack={handleBack}
                    onComplete={handleCompleteLesson}
                    onNavigate={(id) => navigate(`/leccion/${id}`)}
                    position={{ index: currentIndex, total: orderedLessons.length }}
                    prevLesson={currentIndex > 0 ? orderedLessons[currentIndex - 1] : null}
                    nextLesson={
                      currentIndex >= 0 && currentIndex < orderedLessons.length - 1
                        ? orderedLessons[currentIndex + 1]
                        : null
                    }
                  />
                ) : (
                  <Dashboard
                    modules={modules}
                    lessons={lessons}
                    onLessonSelect={handleLessonSelect}
                  />
                )
              }
            />
            <Route
              path="*"
              element={
                <Dashboard
                  modules={modules}
                  lessons={lessons}
                  onLessonSelect={handleLessonSelect}
                />
              }
            />
          </Routes>
        </main>
      </div>

      <Footer />

      {currentLesson && (
        <Button
          onClick={() => setIsAIPanelOpen(true)}
          className="fixed bottom-20 right-6 z-40"
        >
          <Icon name="chat" size={16} />
          {t('nav.aiTutor')}
        </Button>
      )}

      <AIPanel
        lesson={currentLesson}
        isOpen={isAIPanelOpen}
        onClose={() => setIsAIPanelOpen(false)}
      />

      <APIKeySettings
        isOpen={isAPIKeyModalOpen}
        onClose={() => setIsAPIKeyModalOpen(false)}
      />
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
