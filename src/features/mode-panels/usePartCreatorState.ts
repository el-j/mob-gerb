import { useState } from 'react'

import { useEditorStore } from '../../store/editorStore'

export const usePartCreatorState = () => {
  const selectedElementId = useEditorStore((state) => state.selectedElementId)
  const selectedElementIds = useEditorStore((state) => state.selectedElementIds)
  const selectedElement = useEditorStore((state) =>
    state.selectedElementId ? state.project.elements[state.selectedElementId] : undefined,
  )
  const drawTool = useEditorStore((state) => state.drawTool)
  const draftPoints = useEditorStore((state) => state.draftPoints)

  const addShape = useEditorStore((state) => state.addShape)
  const selectElement = useEditorStore((state) => state.selectElement)
  const combineSelectedElements = useEditorStore((state) => state.combineSelectedElements)
  const splitComposite = useEditorStore((state) => state.splitComposite)
  const setOutlinePadding = useEditorStore((state) => state.setOutlinePadding)
  const setSelectedFill = useEditorStore((state) => state.setSelectedFill)
  const setSelectedStrokeWidth = useEditorStore((state) => state.setSelectedStrokeWidth)
  const updateSelectedPolylinePoint = useEditorStore((state) => state.updateSelectedPolylinePoint)
  const setDrawTool = useEditorStore((state) => state.setDrawTool)
  const finishPolylineDraw = useEditorStore((state) => state.finishPolylineDraw)
  const clearDraftPoints = useEditorStore((state) => state.clearDraftPoints)
  const applyTagToSelected = useEditorStore((state) => state.applyTagToSelected)

  const [pinInput, setPinInput] = useState('1')
  const parsedPin = Number(pinInput)
  const requestedPin = Number.isFinite(parsedPin) && parsedPin > 0 ? parsedPin : undefined

  return {
    selectedElementId,
    selectedElementIds,
    selectedElement,
    drawTool,
    draftPoints,
    pinInput,
    requestedPin,
    setPinInput,
    addShape,
    selectElement,
    combineSelectedElements,
    splitComposite,
    setOutlinePadding,
    setSelectedFill,
    setSelectedStrokeWidth,
    updateSelectedPolylinePoint,
    setDrawTool,
    finishPolylineDraw,
    clearDraftPoints,
    applyTagToSelected,
  }
}
