import { useEffect } from 'react'

import { ModeToolbar } from './components/Toolbar/ModeToolbar'
import { loadDraft } from './core/persistence/draftStorage'
import { AppHeader } from './features/app-shell/AppHeader'
import { ModePanelSwitch } from './features/mode-panels/ModePanelSwitch'
import { WorkspaceFrame } from './features/workspace/WorkspaceFrame'
import { Minimap } from './components/Canvas/Minimap'
import { LayersSidebar } from './features/layers-sidebar/LayersSidebar'
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
        const message = err instanceof Error ? err.message : String(err)
        if (!message.includes('IndexedDB is not available')) {
          console.error('[startup] Failed to restore draft', err)
        }
      })
  })

  return (
    <main className="app-shell">
      <AppHeader />
      <ModeToolbar />
      <ModePanelSwitch />
      <WorkspaceFrame />
      
      <LayersSidebar />
      <Minimap />

      <footer className="app-footer">
       
      </footer>
    </main>
  )
}

export default App
