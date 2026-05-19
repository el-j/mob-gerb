import { expect, test } from '@playwright/test'

test('adds a new pad and tags it with connector metadata', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: 'PART CREATOR' }).click()
  await page.getByRole('button', { name: 'Add Pad (Circle)' }).click()

  const newPad = page.getByTestId('element-shape-1')
  await expect(newPad).toBeVisible()

  await newPad.click()

  const pinInput = page.getByRole('spinbutton', { name: 'Pin' })
  await pinInput.fill('9')
  await page.getByRole('button', { name: 'Tag Through-Hole Pad' }).click()

  await expect(newPad).toHaveAttribute('data-role', 'connector')
  await expect(newPad).toHaveAttribute('data-layer', 'copper0')
  await expect(newPad).toHaveAttribute('data-connector-id', 'connector9')
  await expect(page.getByText('Connector: connector9 (through-hole)')).toBeVisible()
})