import { expect, test } from '@playwright/test'

test('@headed triggers autorouter and creates a copper trace polyline', async ({ page }) => {
  await page.goto('/')

  // Step 1: Enter Part Creator Mode and create two connector pads
  await page.getByRole('button', { name: 'PART CREATOR' }).click()

  // Add Pad 1 — lands on copper1 (default activeLayer), id = shape-1
  await page.getByRole('button', { name: 'Add Pad (Circle)' }).click()
  const pad1BeforeTag = page.getByTestId('element-copper1.shape-1')
  await expect(pad1BeforeTag).toBeVisible()
  await page.getByLabel('Pin').fill('1')
  await page.getByRole('button', { name: 'Tag Through-Hole Pad' }).click()

  // After THT tagging, pad1 moves to copper0; locate it via the copper0 layer group
  const copper0Group = page.locator('[data-testid="layer-group-copper0"]')
  const pad1 = copper0Group.locator('[data-testid="element-copper0.shape-1"]')
  await expect(pad1).toBeVisible()

  // Clear selection and copy-paste to create Pad 2
  await page.getByRole('button', { name: 'Clear Selection' }).click()
  await pad1.click()
  await page.keyboard.press('Meta+c')
  await page.keyboard.press('Meta+v')

  // Pad 2 is a copy of a THT connector, so it also lands on copper0, id = shape-2
  const pad2 = copper0Group.locator('[data-testid="element-copper0.shape-2"]')
  await expect(pad2).toBeVisible()

  // Tag Pad 2 with a different pin
  await page.getByLabel('Pin').fill('2')
  await page.getByRole('button', { name: 'Tag Through-Hole Pad' }).click()

  // Step 2: Switch to Logical Mode and connect the two pads
  await page.getByRole('button', { name: 'LOGICAL' }).click()
  await pad1.click()
  await pad2.click()

  // Verify the airwire is visible
  await expect(page.locator('line[stroke="#10b981"]')).toHaveCount(1)

  // Step 3: Autoroute the net
  const autorouteBtn = page.getByRole('button', { name: /Autoroute Nets/ })
  await expect(autorouteBtn).toBeEnabled()
  await autorouteBtn.click()

  // Step 4: After routing completes, verify a copper polyline exists
  // Route polylines land on copper1 (copper-surface layer), testid format: element-copper1.route-*
  await page.waitForFunction(() => {
    const polylines = document.querySelectorAll('[data-testid^="element-copper1.route-"]')
    return polylines.length > 0
  }, { timeout: 5000 })

  const routePolyline = page.locator('[data-testid^="element-copper1.route-"]')
  await expect(routePolyline).toBeVisible()
})
