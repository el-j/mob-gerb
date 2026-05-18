import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import App from './App'

describe('App integration', () => {
  it('switches modes from the toolbar and updates status text', async () => {
    const user = userEvent.setup()
    render(<App />)

    expect(screen.getByText('Mode: VIEW_MODE')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'LOGICAL' }))

    expect(screen.getByText('Mode: LOGICAL_MODE')).toBeInTheDocument()
  })
})