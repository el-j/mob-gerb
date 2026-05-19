/**
 * Style-regression guards for REFACTOR-002 / REFACTOR-003 and beyond.
 *
 * Checks that critical shell controls, mode panels, and overlay widgets remain
 * visible and interactive after design-token and structural refactors.
 *
 * Viewports tested:
 *   - Mobile  : 390 × 844 (iPhone 14 portrait)
 *   - Desktop : 1280 × 800
 *
 * How to run locally:
 *   npx playwright test e2e/style-regression.spec.ts
 *   npm run test:e2e:feature   (included automatically)
 *   npm run test:ci            (full gate)
 *
 * Before marking any refactor task complete, confirm this file passes.
 */

import { expect, test } from '@playwright/test'

// ─── helpers ──────────────────────────────────────────────────────────────────

async function expectShellVisible(page: import('@playwright/test').Page) {
  await expect(page.getByRole('button', { name: 'VIEW' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'PART CREATOR' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'LOGICAL' })).toBeVisible()
  await expect(page.getByRole('button', { name: '+' })).toBeVisible()
  await expect(page.getByRole('button', { name: '-', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: '1:1' })).toBeVisible()
  await expect(page.getByRole('img', { name: 'Mobile-first PCB workspace' })).toBeVisible()
}

// ─── mobile breakpoint ────────────────────────────────────────────────────────

test.describe('mobile breakpoint (390 × 844)', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('all editor shell controls are visible', async ({ page }) => {
    await page.goto('/')
    await expectShellVisible(page)
  })

  test('part creator panel is visible and interactive', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'PART CREATOR' }).click()

    await expect(page.getByRole('button', { name: 'Add Pad (Circle)' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Add Rectangle' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Start Free Draw' })).toBeVisible()

    // Panel button is interactive — adding a shape must land in the store
    await page.getByRole('button', { name: 'Add Pad (Circle)' }).click()
    await expect(page.getByTestId('element-shape-1')).toBeVisible()
  })

  test('logical mode panel is visible and interactive', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'LOGICAL' }).click()

    await expect(page.getByRole('button', { name: /Autoroute Nets/ })).toBeVisible()
  })

  test('trace edit overlay is visible and interactive', async ({ page }) => {
    await page.goto('/')

    // Minimal setup — two pads, connect, route, enter trace edit
    await page.getByRole('button', { name: 'PART CREATOR' }).click()
    await page.getByRole('button', { name: 'Add Pad (Circle)' }).click()
    const pad1 = page.getByTestId('element-shape-1')
    await expect(pad1).toBeVisible()
    await page.getByLabel('Pin').fill('1')
    await page.getByRole('button', { name: 'Tag Through-Hole Pad' }).click()

    await page.getByRole('button', { name: 'Clear Selection' }).click()
    await pad1.click()
    await page.keyboard.press('Meta+c')
    await page.keyboard.press('Meta+v')
    const pad2 = page.getByTestId('element-shape-2')
    await expect(pad2).toBeVisible()
    await page.getByLabel('Pin').fill('2')
    await page.getByRole('button', { name: 'Tag Through-Hole Pad' }).click()

    await page.getByRole('button', { name: 'LOGICAL' }).click()
    await pad1.click()
    await pad2.click()

    await page.getByRole('button', { name: /Autoroute Nets/ }).click()
    await page.waitForFunction(
      () => document.querySelectorAll('[data-testid^="element-route-"]').length > 0,
      { timeout: 5000 },
    )

    await page.getByRole('button', { name: 'LOGICAL' }).click()
    await page.getByRole('button', { name: 'VIEW' }).click()
    await page.locator('[data-testid^="element-route-"]').first().dispatchEvent('dblclick')

    await expect(page.getByTestId('trace-edit-overlay')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Exit Edit Mode' })).toBeVisible()
    await expect(page.getByRole('button', { name: /Run DRC/ })).toBeVisible()
  })

  test('zoom controls change display value', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: '+' }).click()
    await expect(page.getByText('110%')).toBeVisible()
    await page.getByRole('button', { name: '1:1' }).click()
    await expect(page.getByText('100%')).toBeVisible()
  })
})

// ─── desktop breakpoint ───────────────────────────────────────────────────────

test.describe('desktop breakpoint (1280 × 800)', () => {
  test.use({ viewport: { width: 1280, height: 800 } })

  test('all editor shell controls are visible', async ({ page }) => {
    await page.goto('/')
    await expectShellVisible(page)
  })

  test('mode switching activates the correct panel', async ({ page }) => {
    await page.goto('/')

    // Default: VIEW mode — no creator panel buttons
    await expect(page.getByRole('button', { name: 'Add Pad (Circle)' })).not.toBeVisible()

    // PART CREATOR mode
    await page.getByRole('button', { name: 'PART CREATOR' }).click()
    await expect(page.getByRole('button', { name: 'Add Pad (Circle)' })).toBeVisible()
    await expect(page.getByRole('button', { name: /Autoroute Nets/ })).not.toBeVisible()

    // LOGICAL mode
    await page.getByRole('button', { name: 'LOGICAL' }).click()
    await expect(page.getByRole('button', { name: /Autoroute Nets/ })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Add Pad (Circle)' })).not.toBeVisible()

    // Back to VIEW
    await page.getByRole('button', { name: 'VIEW' }).click()
    await expect(page.getByRole('button', { name: 'Add Pad (Circle)' })).not.toBeVisible()
    await expect(page.getByRole('button', { name: /Autoroute Nets/ })).not.toBeVisible()
  })

  test('active mode button has active class', async ({ page }) => {
    await page.goto('/')

    const viewBtn = page.getByRole('button', { name: 'VIEW' })
    await expect(viewBtn).toHaveClass(/active/)

    await page.getByRole('button', { name: 'PART CREATOR' }).click()
    await expect(page.getByRole('button', { name: 'PART CREATOR' })).toHaveClass(/active/)
    await expect(viewBtn).not.toHaveClass(/active/)
  })

  test('grid size input accepts new value', async ({ page }) => {
    await page.goto('/')
    const gridInput = page.getByRole('spinbutton', { name: /grid/i })
    await gridInput.fill('2.5')
    await gridInput.press('Enter')
    await expect(gridInput).toHaveValue('2.5')
  })
})
