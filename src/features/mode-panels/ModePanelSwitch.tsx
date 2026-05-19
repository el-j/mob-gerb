import { useEditorStore } from '../../store/editorStore'
import { LogicalModePanel } from './LogicalModePanel'
import { PartCreatorPanel } from './PartCreatorPanel'
import { TraceEditPanel } from './TraceEditPanel'

export const ModePanelSwitch = () => {
  const mode = useEditorStore((state) => state.mode)

  if (mode === 'PART_CREATOR_MODE') {
    return <PartCreatorPanel />
  }

  if (mode === 'LOGICAL_MODE') {
    return <LogicalModePanel />
  }

  if (mode === 'EDIT_TRACE_MODE') {
    return <TraceEditPanel />
  }

  return null
}
