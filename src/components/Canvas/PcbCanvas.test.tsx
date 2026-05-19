import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { useEditorStore } from '../../store/editorStore'
import { PcbCanvas } from './PcbCanvas'

describe('PcbCanvas state-driven behavior', () => {
  beforeEach(() => {
    useEditorStore.setState(useEditorStore.getInitialState(), true)
  })

  afterEach(() => {
    cleanup()
  })

  it('renders elements from project state rather than static markup', () => {
    render(<PcbCanvas />)

    // THT connectors appear in every copper layer group (correct PCB behavior: the pad drills through all layers)
    const thtInstances = screen.getAllByTestId('element-copper0.connector0pin')
    expect(thtInstances.length).toBeGreaterThanOrEqual(1)
    expect(screen.getByTestId('element-silkscreen.silk-outline')).toBeInTheDocument()
  })

  it('selects an element in part creator mode', () => {
    useEditorStore.getState().setMode('PART_CREATOR_MODE')
    render(<PcbCanvas />)

    // THT connectors appear in all copper groups; pick the instance inside the copper1 layer group
    const copper1Group = screen.getByTestId('layer-group-copper1')
    const target = copper1Group.querySelector('[data-testid="element-copper0.connector0pin"]') as HTMLElement
    expect(target).not.toBeNull()
    fireEvent.pointerDown(target, { pointerId: 1, clientX: 100, clientY: 100 })

    expect(useEditorStore.getState().selectedElementId).toBe('connector0pin')
    expect(screen.getByTestId('selection-box')).toBeInTheDocument()
  })

  it('adds draft points while free draw tool is active', () => {
    useEditorStore.getState().setMode('PART_CREATOR_MODE')
    useEditorStore.getState().setDrawTool('polyline')
    render(<PcbCanvas />)

    const canvas = screen.getByRole('img', { name: 'Mobile-first PCB workspace' })
    fireEvent.pointerDown(canvas, { pointerId: 2, clientX: 80, clientY: 90 })

    expect(useEditorStore.getState().draftPoints).toHaveLength(1)
    expect(screen.getByTestId('draft-polyline')).toBeInTheDocument()
  })

  it('shows point handles for selected point-based shapes', () => {
    const state = useEditorStore.getState()
    state.setMode('PART_CREATOR_MODE')
    state.setDrawTool('polyline')
    state.addDraftPoint({ x: 10, y: 10 })
    state.addDraftPoint({ x: 12, y: 12 })
    state.finishPolylineDraw()

    render(<PcbCanvas />)

    expect(screen.getByTestId('point-handles')).toBeInTheDocument()
    expect(screen.getByTestId('point-handle-0')).toBeInTheDocument()
    expect(screen.getByTestId('point-handle-1')).toBeInTheDocument()
  })

  it('renders midpoint handles and allows double click removal', () => {
    const state = useEditorStore.getState()
    state.setMode('PART_CREATOR_MODE')
    state.setDrawTool('polyline')
    state.addDraftPoint({ x: 10, y: 10 })
    state.addDraftPoint({ x: 12, y: 12 })
    state.addDraftPoint({ x: 15, y: 10 })
    state.finishPolylineDraw()

    render(<PcbCanvas />)

    expect(screen.getByTestId('point-handles')).toBeInTheDocument()
    expect(screen.getByTestId('point-handle-0')).toBeInTheDocument()
    expect(screen.getByTestId('point-handle-1')).toBeInTheDocument()
    expect(screen.getByTestId('point-handle-2')).toBeInTheDocument()
    expect(screen.getByTestId('midpoint-handle-0')).toBeInTheDocument()
    expect(screen.getByTestId('midpoint-handle-1')).toBeInTheDocument()

    const midpoint = screen.getByTestId('midpoint-handle-0')
    fireEvent.pointerDown(midpoint, { pointerId: 1, clientX: 100, clientY: 100 })
    
    const shape = useEditorStore.getState().project.elements['shape-1']
    expect(shape.geom.points).toHaveLength(4)

    const point = screen.getByTestId('point-handle-1')
    fireEvent.doubleClick(point)

    expect(useEditorStore.getState().project.elements['shape-1'].geom.points).toHaveLength(3)
  })
})