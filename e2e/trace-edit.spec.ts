import { expect, test } from '@playwright/test'

test('@headed double-tap a routed trace to enter edit mode and run DRC', async ({ page }) => {
  await page.goto('/')

  // --- Setup: create two pads, connect, and autoroute ---
  await page.getByRole('button', { name: 'PART CREATOR' }).click()

  // Add Pad 1
  await page.getByRole('button', { name: 'Add Pad (Circle)' }).click()
  const pad1 = page.getByTestId('element-shape-1')
  await expect(pad1).toBeVisible()
  await page.getByLabel('Pin').fill('1')
  await page.getByRole('button', { name: 'Tag Through-Hole Pad' }).click()

  // Copy-paste to create Pad 2
  await page.getByRole('button', { name: 'Clear Selection' }).click()
  await pad1.click()
  await page.keyboard.press('Meta+c')
  await page.keyboard.press('Meta+v')
  const pad2 = page.getByTestId('element-shape-2')
  await expect(pad2).toBeVisible()
  await page.getByLabel('Pin').fill('2')
  await page.getByRole('button', { name: 'Tag Through-Hole Pad' }).click()

  // Connect pads in Logical Mode
  await page.getByRole('button', { name: 'LOGICAL' }).click()
  await pad1.click()
  await pad2.click()
  await expect(page.locator('line[stroke="#10b981"]')).toHaveCount(1)

  // Autoroute
  await page.getByRole('button', { name: /Autoroute Nets/ }).click()
  // TODO: this call is doing a reset of the state of the app which auto switches to VIEW mode.
  
  await page.waitForFunction(() => {
    return document.querySelectorAll('[data-testid^="element-route-"]').length > 0
  }, { timeout: 5000 })
  // CURRENTFIX: go back to LOGICAL mode to be able to select the route trace
  await page.getByRole('button', { name: 'LOGICAL' }).click()
  const routeTrace = page.locator('[data-testid^="element-route-"]').first()
  await expect(routeTrace).toBeVisible()
  
  
  
  // --- Double-tap to enter EDIT_TRACE_MODE ---
  // Switch to VIEW_MODE first
  await page.getByRole('button', { name: 'VIEW' }).click()

  await routeTrace.first().dispatchEvent('dblclick')
  
  // The trace edit overlay should appear
  const editOverlay = page.getByTestId('trace-edit-overlay')
  await expect(editOverlay).toBeVisible()

  // Handles should be rendered
  const handle0 = page.getByTestId('trace-handle-0')
  await expect(handle0).toBeVisible()

  // --- Run DRC ---
  await page.getByRole('button', { name: /Run DRC/ }).click()
  await expect(page.locator('.drc-ok, .drc-violations-list')).toBeVisible()

  // --- Exit trace edit via Escape ---
  await page.keyboard.press('Escape')
  await expect(editOverlay).not.toBeVisible()
})
