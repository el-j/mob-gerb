import { Copy, Clipboard, Trash2, XCircle } from 'lucide-react'
import { useEditorStore } from '../../store/editorStore'

export const PlaceModePanel = () => {
  const selectedElementIds = useEditorStore((state) => state.selectedElementIds)
  const clipboard = useEditorStore((state) => state.clipboard)
  const copySelected = useEditorStore((state) => state.copySelected)
  const pasteCopied = useEditorStore((state) => state.pasteCopied)
  const deleteSelected = useEditorStore((state) => state.deleteSelected)
  const selectElement = useEditorStore((state) => state.selectElement)

  return (
    <section className="creator-panel ui-panel" aria-label="Place mode controls">
      <div className="shape-row flex-wrap items-center">
        <span className="text-sm font-medium mr-2" style={{ opacity: 0.8 }}>
          Place Mode:
        </span>
        <button
          type="button"
          onClick={copySelected}
          disabled={selectedElementIds.length === 0}
          className="flex items-center gap-1"
          title="Copy selected elements"
          aria-label="Copy Selected"
        >
          <Copy size={16} /> Copy
        </button>
        <button
          type="button"
          onClick={pasteCopied}
          disabled={clipboard.length === 0}
          className="flex items-center gap-1"
          title="Paste elements from clipboard"
          aria-label="Paste Copied"
        >
          <Clipboard size={16} /> Paste
        </button>
        <button
          type="button"
          onClick={deleteSelected}
          disabled={selectedElementIds.length === 0}
          className="flex items-center gap-1 text-red-400 border-red-900/30 hover:bg-red-900/20"
          title="Delete selected elements"
          aria-label="Delete Selected"
        >
          <Trash2 size={16} /> Delete
        </button>
        <button
          type="button"
          onClick={() => selectElement(null)}
          disabled={selectedElementIds.length === 0}
          className="flex items-center gap-1"
          title="Clear selection"
          aria-label="Clear Selection"
        >
          <XCircle size={16} /> Deselect
        </button>
      </div>
      <p className="tag-summary">
        {selectedElementIds.length === 0
          ? 'Select elements on the canvas to copy or drag them.'
          : `${selectedElementIds.length} element(s) selected. Drag to place.`}
      </p>
    </section>
  )
}
