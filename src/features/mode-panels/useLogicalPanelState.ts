import { useEditorStore } from '../../store/editorStore'

export const useLogicalPanelState = () => {
  const isRouting = useEditorStore((state) => state.isRouting)
  const nets = useEditorStore((state) => state.project.nets)
  const triggerAutoroute = useEditorStore((state) => state.triggerAutoroute)

  return { isRouting, nets, triggerAutoroute }
}
