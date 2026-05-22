import { expect, test } from '@playwright/test'

test('creates an airwire between two pads in logical mode', async ({ page }) => {
  await page.goto('/')

  // Step 1: Create two pads in Part Creator Mode
  await page.getByRole('button', { name: 'PART CREATOR' }).click()

  // Add Pad 1
  await page.getByRole('button', { name: 'Add Pad (Circle)' }).click()
  const pad1 = page.getByTestId('element-shape-1')
  await expect(pad1).toBeVisible()

  // Tag Pad 1
  await page.getByLabel('Pin').fill('1')
  await page.getByRole('button', { name: 'Tag Through-Hole Pad' }).click()

  // Clear selection
  await page.getByRole('button', { name: 'Clear Selection' }).click()

  // Copy Pad 1 to Pad 2 — pad1 is THT so it renders in both copper groups; use .last() for the topmost (copper0) instance
  await pad1.last().click()
  await page.keyboard.press('Control+c')
  await page.keyboard.press('Meta+c')
  await page.keyboard.press('Control+v')
  await page.keyboard.press('Meta+v')

  const pad2 = page.getByTestId('element-shape-2').last()
  await expect(pad2).toBeVisible()

  // Tag Pad 2
  await page.getByLabel('Pin').fill('2')
  await page.getByRole('button', { name: 'Tag Through-Hole Pad' }).click()

  // Step 2: Switch to Logical Mode
  await page.getByRole('button', { name: 'LOGICAL' }).click()

  // Step 3: Create the connection
  // Click Pad 1 to start connection (THT pad — appears in multiple groups; use .last() for copper0 instance on top)
  await pad1.last().click()

  // Click Pad 2 to complete connection
  await pad2.click()

  // Step 4: Verify airwire is rendered
  // We can look for the line with stroke="#10b981" (emerald-500)
  const airwires = page.locator('line[stroke="#10b981"]')
  await expect(airwires).toHaveCount(1)
})
