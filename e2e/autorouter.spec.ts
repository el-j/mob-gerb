import { expect, test } from '@playwright/test'

test('triggers autorouter and creates a copper trace polyline', async ({ page }) => {
  await page.goto('/')

  // Step 1: Enter Part Creator Mode and create two connector pads
  await page.getByRole('button', { name: 'PART CREATOR' }).click()

  // Add Pad 1 and tag it
  await page.getByRole('button', { name: 'Add Pad (Circle)' }).click()
  const pad1 = page.getByTestId('element-shape-1')
  await expect(pad1).toBeVisible()
  await page.getByLabel('Pin').fill('1')
  await page.getByRole('button', { name: 'Tag Through-Hole Pad' }).click()

  // Clear selection and copy-paste to create Pad 2
  await page.getByRole('button', { name: 'Clear Selection' }).click()
  await pad1.click()
  await page.keyboard.press('Meta+c')
  await page.keyboard.press('Meta+v')
  const pad2 = page.getByTestId('element-shape-2')
  await expect(pad2).toBeVisible()

  // Tag Pad 2
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

  // The routing overlay should briefly appear
  // (may be very fast, so we allow it to be gone already)

  // Step 4: After routing completes, verify a copper polyline exists
  // The autorouter returns polylines tagged with role="copper-surface" on copper1
  await page.waitForFunction(() => {
    const polylines = document.querySelectorAll('[data-testid^="element-route-"]')
    return polylines.length > 0
  }, { timeout: 5000 })

  const routePolyline = page.locator('[data-testid^="element-route-"]')
  await expect(routePolyline).toBeVisible()
})
