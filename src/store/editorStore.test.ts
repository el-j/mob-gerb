import { beforeEach, describe, expect, it } from 'vitest'

import type { ElementState } from '../core/types/pcb'
import { useEditorStore } from './editorStore'

const SAMPLE_ELEMENT: ElementState = {
  id: 'pad-1',
  type: 'circle',
  role: 'connector',
  pcbLayer: 'copper1',
  geom: { x: 10, y: 10, r: 1.2 },
}

describe('editor store project model', () => {
  beforeEach(() => {
    useEditorStore.setState(useEditorStore.getInitialState(), true)
  })

  it('initializes a serializable project shape', () => {
    const state = useEditorStore.getState()

    expect(state.project.metadata.name).toBe('Untitled Footprint')
    expect(state.project.metadata.author).toBe('')
    expect(Object.keys(state.project.elements)).toEqual(['connector0pin', 'silk-outline'])
    expect(state.project.nets).toEqual({})
    expect(state.selectedElementId).toBeNull()
    expect(state.historyPast).toHaveLength(0)
    expect(state.historyFuture).toHaveLength(0)
  })

  it('keeps grid size in sync with project state', () => {
    const { setGridSize } = useEditorStore.getState()

    setGridSize(1)

    expect(useEditorStore.getState().gridSize).toBe(1)
    expect(useEditorStore.getState().project.gridSize).toBe(1)

    setGridSize(-5)

    expect(useEditorStore.getState().gridSize).toBe(2.54)
    expect(useEditorStore.getState().project.gridSize).toBe(2.54)
  })

  it('supports immutable history snapshots with undo and redo', () => {
    const state = useEditorStore.getState()

    state.upsertElement(SAMPLE_ELEMENT)
    state.selectElement(SAMPLE_ELEMENT.id)
    state.commitHistory()

    state.removeElement(SAMPLE_ELEMENT.id)

    expect(useEditorStore.getState().project.elements[SAMPLE_ELEMENT.id]).toBeUndefined()
    expect(useEditorStore.getState().selectedElementId).toBeNull()

    useEditorStore.getState().undo()

    expect(useEditorStore.getState().project.elements[SAMPLE_ELEMENT.id]).toEqual(SAMPLE_ELEMENT)
    expect(useEditorStore.getState().selectedElementId).toBe(SAMPLE_ELEMENT.id)

    useEditorStore.getState().redo()

    expect(useEditorStore.getState().project.elements[SAMPLE_ELEMENT.id]).toBeUndefined()
    expect(useEditorStore.getState().selectedElementId).toBeNull()
  })

  it('keeps undo and redo safe when no history exists', () => {
    useEditorStore.getState().undo()
    useEditorStore.getState().redo()

    expect(useEditorStore.getState().historyPast).toHaveLength(0)
    expect(useEditorStore.getState().historyFuture).toHaveLength(0)
  })

  it('adds circle, rectangle, and line shapes in part creator flow', () => {
    const state = useEditorStore.getState()

    state.addShape('circle')
    state.addShape('rect')
    state.addShape('line')

    const added = Object.keys(useEditorStore.getState().project.elements).filter((id) => id.startsWith('shape-'))
    expect(added).toEqual(['shape-1', 'shape-2', 'shape-3'])
    expect(useEditorStore.getState().project.elements['shape-1'].type).toBe('circle')
    expect(useEditorStore.getState().project.elements['shape-2'].type).toBe('rect')
    expect(useEditorStore.getState().project.elements['shape-3'].type).toBe('line')
  })

  it('tags selected pad as through-hole connector metadata', () => {
    const state = useEditorStore.getState()

    state.addShape('circle')
    state.applyTagToSelected('through-hole', 1)

    const addedPad = useEditorStore.getState().project.elements['shape-1']
    expect(addedPad.role).toBe('connector')
    expect(addedPad.pcbLayer).toBe('copper0')
    expect(addedPad.connector).toEqual({
      kind: 'through-hole',
      pin: 1,
      connectorId: 'connector1',
      svgId: 'connector1pin',
    })
  })

  it('creates a freeform copper surface without connector metadata', () => {
    const state = useEditorStore.getState()

    state.addShape('polygon')

    const addedSurface = useEditorStore.getState().project.elements['shape-1']
    expect(addedSurface.type).toBe('polygon')
    expect(addedSurface.role).toBe('copper-surface')
    expect(addedSurface.pcbLayer).toBe('copper1')
    expect(addedSurface.connector).toBeUndefined()
    expect(addedSurface.geom.points).toHaveLength(6)
  })

  it('tags a selected element as copper surface without creating a connector', () => {
    const state = useEditorStore.getState()

    state.addShape('rect')
    state.applyTagToSelected('copper-surface')

    const surface = useEditorStore.getState().project.elements['shape-1']
    expect(surface.role).toBe('copper-surface')
    expect(surface.pcbLayer).toBe('copper1')
    expect(surface.connector).toBeUndefined()
  })

  it('uses deterministic next pin when requested pin is already taken', () => {
    const state = useEditorStore.getState()

    state.addShape('circle')
    state.applyTagToSelected('through-hole', 1)
    state.addShape('circle')
    state.applyTagToSelected('smd', 1)

    const secondPad = useEditorStore.getState().project.elements['shape-2']
    expect(secondPad.connector?.pin).toBe(2)
    expect(secondPad.connector?.connectorId).toBe('connector2')
    expect(secondPad.pcbLayer).toBe('copper1')
  })

  it('combines selected shapes into a composite and splits it back out', () => {
    const state = useEditorStore.getState()

    state.addShape('rect')
    state.addShape('circle')
    state.toggleElementSelection('shape-1')
    state.combineSelectedElements()

    const combined = useEditorStore.getState().project.elements['group-1']
    expect(combined.type).toBe('group')
    expect(combined.children).toEqual(expect.arrayContaining(['shape-1', 'shape-2']))
    expect(useEditorStore.getState().selectedElementId).toBe('group-1')

    useEditorStore.getState().splitComposite('group-1')

    expect(useEditorStore.getState().project.elements['group-1']).toBeUndefined()
    expect(useEditorStore.getState().project.elements['shape-1'].groupId).toBeNull()
    expect(useEditorStore.getState().project.elements['shape-2'].groupId).toBeNull()
  })

  it('adjusts the outer outline padding of a composite', () => {
    const state = useEditorStore.getState()

    state.addShape('rect')
    state.addShape('circle')
    state.toggleElementSelection('shape-1')
    state.combineSelectedElements()

    const before = useEditorStore.getState().project.elements['group-1']
    useEditorStore.getState().setOutlinePadding('group-1', 3)
    const after = useEditorStore.getState().project.elements['group-1']

    expect(after.geom.w).toBeGreaterThan(before.geom.w ?? 0)
    expect(after.outlinePaddingMm).toBe(3)
  })

  it('updates fill and stroke style of selected closed shapes', () => {
    const state = useEditorStore.getState()

    state.addShape('rect')
    state.setSelectedFill(true)
    state.setSelectedStrokeWidth(1.4)

    const rect = useEditorStore.getState().project.elements['shape-1']
    expect(rect.geom.filled).toBe(true)
    expect(rect.geom.strokeWidth).toBe(1.4)
  })

  it('creates and edits a free-drawn polyline', () => {
    const state = useEditorStore.getState()

    state.setDrawTool('polyline')
    state.addDraftPoint({ x: 10, y: 10 })
    state.addDraftPoint({ x: 12, y: 13 })
    state.addDraftPoint({ x: 15, y: 13 })
    state.finishPolylineDraw()

    const line = useEditorStore.getState().project.elements['shape-1']
    expect(line.type).toBe('polyline')
    expect(line.geom.points).toHaveLength(3)

    useEditorStore.getState().updateSelectedPolylinePoint(1, { x: 3, y: 5 })
    const updated = useEditorStore.getState().project.elements['shape-1']
    expect(updated.geom.points?.[1]).toEqual({ x: 3, y: 5 })
  })

  it('updates selected polyline points from world-space coordinates', () => {
    const state = useEditorStore.getState()

    state.setDrawTool('polyline')
    state.addDraftPoint({ x: 10, y: 10 })
    state.addDraftPoint({ x: 12, y: 12 })
    state.finishPolylineDraw()

    state.updateSelectedPointFromWorld(1, { x: 20, y: 22 })

    const updated = useEditorStore.getState().project.elements['shape-1']
    expect(updated.geom.points?.[1]).toEqual({ x: 10, y: 12 })
  })
})