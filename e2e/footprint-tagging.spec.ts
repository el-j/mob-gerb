import { expect, test } from '@playwright/test'

test('adds a new pad and tags it with connector metadata', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: 'PART CREATOR' }).click()
  await page.getByRole('button', { name: 'Add Pad (Circle)' }).click()

  // New shape lands on the active layer (copper1 by default)
  const newPadBeforeTag = page.getByTestId('element-shape-1')
  await expect(newPadBeforeTag).toBeVisible()

  await newPadBeforeTag.click()

  const pinInput = page.getByRole('spinbutton', { name: 'Pin' })
  await pinInput.fill('9')
  await page.getByRole('button', { name: 'Tag Through-Hole Pad' }).click()

  // After THT tagging the element renders in all copper groups (drill-through).
  // Scope to copper0 group for a unique reference.
  const copper0Group = page.locator('[data-testid="layer-group-copper0"]')
  const newPad = copper0Group.locator('[data-testid="element-shape-1"]')

  await expect(newPad).toHaveAttribute('data-role', 'connector')
  await expect(newPad).toHaveAttribute('data-layer', 'copper0')
  await expect(newPad).toHaveAttribute('data-connector-id', 'connector8')
  await expect(page.getByText('Connector: connector8 (through-hole)')).toBeVisible()
})