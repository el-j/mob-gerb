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

    expect(screen.getByTestId('element-connector0pin')).toBeInTheDocument()
    expect(screen.getByTestId('element-silk-outline')).toBeInTheDocument()
  })

  it('selects an element in part creator mode', () => {
    useEditorStore.getState().setMode('PART_CREATOR_MODE')
    render(<PcbCanvas />)

    const target = screen.getByTestId('element-connector0pin')
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
})