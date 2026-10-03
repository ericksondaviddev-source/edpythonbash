import { useEffect, useState } from 'react'
import { useThemeStore } from './store/useThemeStore'
import { useLanguageStore } from './store/useLanguageStore'
import { useProgressStore } from './store/useProgressStore'
import { parseLessonsFromJSON, groupLessonsByModule } from './lib/parser'
import type { Lesson, Module } from './types'
import Header from './components/layout/Header'
import Sidebar from './components/layout/Sidebar'
import Footer from './components/layout/Footer'
import LoadingScreen from './components/layout/LoadingScreen'
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

function App() {
  const { theme } = useThemeStore()
  const { lang } = useLanguageStore()
  const { completeLesson } = useProgressStore()
  const [isLoading, setIsLoading] = useState(true)
  const [lessons] = useState<Lesson[]>(() => parseLessonsFromJSON(validFiles))
  const [modules] = useState<Module[]>(() => groupLessonsByModule(lessons))
  const [currentView, setCurrentView] = useState<'dashboard' | 'lesson'>('dashboard')
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null)
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
    const timer = setTimeout(() => setIsLoading(false), 1500)
    return () => clearTimeout(timer)
  }, [])

  const handleLessonSelect = (lesson: Lesson) => {
    setCurrentLesson(lesson)
    setCurrentView('lesson')
    setIsSidebarOpen(false)
  }

  const handleBack = () => {
    setCurrentView('dashboard')
    setCurrentLesson(null)
  }

  const handleCompleteLesson = () => {
    if (currentLesson) {
      completeLesson(currentLesson.id)
    }
  }

  if (isLoading) {
    return <LoadingScreen />
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] pb-16">
      <Header
        onOpenSettings={() => setIsAPIKeyModalOpen(true)}
        onOpenMenu={() => setIsSidebarOpen(true)}
      />

      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-50 bg-black bg-opacity-50 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        >
          <div
            className="w-72 h-full bg-[var(--bg-secondary)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
              <span className="font-semibold text-[var(--text-primary)]">Módulos</span>
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
          {currentView === 'dashboard' && (
            <Dashboard
              modules={modules}
              lessons={lessons}
              onLessonSelect={handleLessonSelect}
            />
          )}
          {currentView === 'lesson' && currentLesson && (
            <LessonView
              lesson={currentLesson}
              onBack={handleBack}
              onComplete={handleCompleteLesson}
            />
          )}
        </main>
      </div>

      <Footer />

      {currentView === 'lesson' && (
        <Button
          onClick={() => setIsAIPanelOpen(true)}
          className="fixed bottom-20 right-6 z-40"
        >
          <Icon name="play" size={16} />
          Tutor IA
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

export default App
