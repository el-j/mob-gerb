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

    expect(screen.getByRole('button', { name: 'VIEW' })).toHaveClass('active')

    await user.click(screen.getByRole('button', { name: 'LOGICAL' }))

    expect(screen.getByRole('button', { name: 'LOGICAL' })).toHaveClass('active')
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
    expect(screen.getAllByText(/Connector: connector6/).length).toBeGreaterThan(0)
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

    await user.click(screen.getByRole('button', { name: '+' }))
    expect(screen.getByText('110%')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '-' }))
    expect(screen.getByText('100%')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '+' }))
    await user.click(screen.getByRole('button', { name: '1:1' }))
    expect(screen.getByText('100%')).toBeInTheDocument()
  })

  it('opens tscircuit preview panel with live element summary', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Show tscircuit preview' }))

    expect(screen.getByRole('region', { name: 'tscircuit preview panel' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'PCB' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Schematic' })).toBeInTheDocument()
    expect(screen.getByTestId('tscircuit-preview-body')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Import from tscircuit registry' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Download registry publish payload' })).toBeInTheDocument()
  })

  it('allows selecting tscircuit routing strategy in logical mode', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'LOGICAL' }))

    const strategy = screen.getByRole('combobox', { name: 'Routing strategy' })
    expect(strategy).toBeInTheDocument()
    expect(strategy).toHaveValue('mvp-grid')

    await user.selectOptions(strategy, 'tscircuit-prototype')
    expect(strategy).toHaveValue('tscircuit-prototype')
  })
})