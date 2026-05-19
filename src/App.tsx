import { ModeToolbar } from './components/Toolbar/ModeToolbar'
import { AppHeader } from './features/app-shell/AppHeader'
import { ModePanelSwitch } from './features/mode-panels/ModePanelSwitch'
import { WorkspaceFrame } from './features/workspace/WorkspaceFrame'

import './App.css'

function App() {
  return (
    <main className="app-shell">
      <AppHeader />
      <ModeToolbar />
      <ModePanelSwitch />
      <WorkspaceFrame />

      <footer className="app-footer">
        <span>Workflow: local Claude commands in .claude/commands</span>
        <span>Backlog: docs/backlog</span>
      </footer>
    </main>
  )
}

export default App
