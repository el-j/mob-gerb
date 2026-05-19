import { Link, Outlet } from 'react-router-dom'

const ContentShell = () => {
  return (
    <div className="app-shell" style={{ gridTemplateRows: 'auto minmax(0, 1fr) auto' }}>
      <nav aria-label="App navigation" className="creator-panel shape-row">
        <Link to="/">Editor</Link>
        <Link to="/library">Library</Link>
        <Link to="/import">Import</Link>
        <Link to="/export">Export</Link>
        <Link to="/settings">Settings</Link>
        <Link to="/docs">Docs</Link>
      </nav>
      <main className="creator-panel">
        <Outlet />
      </main>
      <footer className="app-footer">
      </footer>
    </div>
  )
}

export default ContentShell
