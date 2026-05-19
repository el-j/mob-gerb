import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import App from './App'
import { useEditorStore } from './store/editorStore'

describe('App integration', () => {
  beforeEach(() => {
    useEditorStore.setState(useEditorStore.getInitialState(), true)
  })

  afterEach(() => {
    cleanup()
  })

  it('switches modes from the toolbar and updates status text', async () => {
    const user = userEvent.setup()
    render(<App />)

    expect(screen.getByText('Mode: VIEW_MODE')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'LOGICAL' }))

    expect(screen.getByText('Mode: LOGICAL_MODE')).toBeInTheDocument()
  })

  it('adds a pad and tags it as SMD through part creator controls', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'PART CREATOR' }))
    await user.click(screen.getByRole('button', { name: 'Add Pad (Circle)' }))

    const pinInput = screen.getByRole('spinbutton', { name: 'Pin' })
    await user.clear(pinInput)
    await user.type(pinInput, '7')
    await user.click(screen.getByRole('button', { name: 'Tag SMD Pad' }))

    expect(screen.getByText(/Role: connector/)).toBeInTheDocument()
    expect(screen.getByText(/Layer: copper1/)).toBeInTheDocument()
    expect(screen.getAllByText(/Connector: connector7/).length).toBeGreaterThan(0)
  })

  it('creates a copper surface without connector metadata', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'PART CREATOR' }))
    await user.click(screen.getByRole('button', { name: 'Add Copper Surface' }))
    await user.click(screen.getByRole('button', { name: 'Tag Copper Surface' }))

    expect(screen.getByText(/Role: copper-surface/)).toBeInTheDocument()
    expect(screen.getByText(/Layer: copper1/)).toBeInTheDocument()
    expect(screen.getByText(/Connector: none/)).toBeInTheDocument()
  })

  it('supports starting and cancelling free draw mode', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'PART CREATOR' }))
    await user.click(screen.getByRole('button', { name: 'Start Free Draw' }))
    expect(screen.getByRole('button', { name: 'Exit Draw Tool' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Cancel Draw' }))
    expect(screen.getByRole('button', { name: 'Start Free Draw' })).toBeInTheDocument()
  })

  it('zooms and resets the workspace through explicit controls', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Zoom In' }))
    expect(screen.getByText('Zoom: 110%')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Zoom Out' }))
    expect(screen.getByText('Zoom: 100%')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Zoom In' }))
    await user.click(screen.getByRole('button', { name: 'Reset View' }))
    expect(screen.getByText('Zoom: 100%')).toBeInTheDocument()
  })
})