import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Root from './Root.tsx'
import { useEditorStore } from './store/editorStore.ts'
import { saveDraft } from './core/persistence/draftStorage.ts'

// Debounced autosave — fires 500 ms after the last project change
let _autosaveTimer: ReturnType<typeof setTimeout> | null = null
useEditorStore.subscribe((state) => {
  if (_autosaveTimer !== null) clearTimeout(_autosaveTimer)
  _autosaveTimer = setTimeout(() => {
    saveDraft(state.project).catch((err: unknown) => {
      console.error('[autosave] Failed to save draft', err)
    })
  }, 500)
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
