import { useEditorStore } from '../../store/editorStore'

export const useWorkspaceControls = () => {
  const gridSize = useEditorStore((state) => state.gridSize)
  const zoom = useEditorStore((state) => state.zoom)
  const setGridSize = useEditorStore((state) => state.setGridSize)
  const zoomBy = useEditorStore((state) => state.zoomBy)
  const resetView = useEditorStore((state) => state.resetView)

  return { gridSize, zoom, setGridSize, zoomBy, resetView }
}
