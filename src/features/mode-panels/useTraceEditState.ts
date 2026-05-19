import { useEditorStore } from '../../store/editorStore'

export const useTraceEditState = () => {
  const drcViolations = useEditorStore((state) => state.drcViolations)
  const drcClearanceMm = useEditorStore((state) => state.drcClearanceMm)
  const exitTraceEdit = useEditorStore((state) => state.exitTraceEdit)
  const runDrc = useEditorStore((state) => state.runDrc)
  const setDrcClearance = useEditorStore((state) => state.setDrcClearance)

  return { drcViolations, drcClearanceMm, exitTraceEdit, runDrc, setDrcClearance }
}
