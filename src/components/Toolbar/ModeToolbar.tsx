import type { AppMode } from '../../core/types/pcb'
import { useEditorStore } from '../../store/editorStore'

const modes: AppMode[] = [
  'VIEW_MODE',
  'PLACE_MODE',
  'LOGICAL_MODE',
  'ROUTING_MODE',
  'EDIT_TRACE_MODE',
  'PART_CREATOR_MODE',
]

export const ModeToolbar = () => {
  const mode = useEditorStore((state) => state.mode)
  const setMode = useEditorStore((state) => state.setMode)

  return (
    <nav aria-label="Editor mode toolbar" className="flex flex-row justify-between flex-nowrap gap-4 px-2">
      {modes.map((entry) => (
        <button
          key={entry}
          className={`ui-btn flex ${entry === mode ? 'active ui-btn--active' : ''}`}
          onClick={() => setMode(entry)}
          type="button"
        >
          {entry.replaceAll('_MODE', '').replaceAll('_', ' ')}
        </button>
      ))}
    </nav>
  )
}
