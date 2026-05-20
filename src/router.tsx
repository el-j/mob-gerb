import { createBrowserRouter } from 'react-router-dom'

import App from './App'
import ContentShell from './layouts/ContentShell'
import EditorShell from './layouts/EditorShell'
import DocsRoute from './routes/DocsRoute'
import ExportRoute from './routes/ExportRoute'
import ImportRoute from './routes/ImportRoute'
import LibraryRoute from './routes/LibraryRoute'
import SettingsRoute from './routes/SettingsRoute'

export const router = createBrowserRouter([
  {
    element: <EditorShell />,
    children: [{ index: true, element: <App /> }],
  },
  {
    element: <ContentShell />,
    children: [
      { path: 'library', element: <LibraryRoute /> },
      { path: 'import', element: <ImportRoute /> },
      { path: 'export', element: <ExportRoute /> },
      { path: 'settings', element: <SettingsRoute /> },
      { path: 'docs', element: <DocsRoute /> },
    ],
  },
], {
  basename: import.meta.env.BASE_URL,
})
