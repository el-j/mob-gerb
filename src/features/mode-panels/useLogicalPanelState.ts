import { useEditorStore } from '../../store/editorStore'

export const useLogicalPanelState = () => {
  const isRouting = useEditorStore((state) => state.isRouting)
  const nets = useEditorStore((state) => state.project.nets)
  const routingStrategy = useEditorStore((state) => state.routingStrategy)
  const triggerAutoroute = useEditorStore((state) => state.triggerAutoroute)
  const setRoutingStrategy = useEditorStore((state) => state.setRoutingStrategy)

  return { isRouting, nets, routingStrategy, triggerAutoroute, setRoutingStrategy }
}
