import { useEffect } from 'react'

import { ModeToolbar } from './components/Toolbar/ModeToolbar'
import { loadDraft } from './core/persistence/draftStorage'
import { AppHeader } from './features/app-shell/AppHeader'
import { ModePanelSwitch } from './features/mode-panels/ModePanelSwitch'
import { WorkspaceFrame } from './features/workspace/WorkspaceFrame'
import { useEditorStore } from './store/editorStore'

import './App.css'

function App() {
  const importProject = useEditorStore((state) => state.importProject)

  useEffect(() => {
    loadDraft()
      .then((project) => {
        if (project) importProject(project)
      })
      .catch((err: unknown) => {
        // Silently skip when running in environments without IndexedDB (e.g. jsdom in tests)
        const message = err instanceof Error ? err.message : String(err)
        if (!message.includes('IndexedDB is not available')) {
          console.error('[startup] Failed to restore draft', err)
        }
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <main className="app-shell">
      <AppHeader />
      <ModeToolbar />
      <ModePanelSwitch />
      <WorkspaceFrame />

      <footer className="app-footer">
       
      </footer>
    </main>
  )
}

export default App
