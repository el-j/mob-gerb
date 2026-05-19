import { expect, test } from '@playwright/test'

test.describe('File IO and Persistence', () => {
  test('exports draft, gerbers, and fritzing parts', async ({ page }) => {
    await page.goto('/')

    // Wait for the app to be ready
    await expect(page.getByRole('heading', { name: 'MOB-GERB' })).toBeVisible()

    // Setup download listener for Draft export
    const downloadDraftPromise = page.waitForEvent('download')
    await page.getByTestId('export-draft-btn').click()
    const downloadDraft = await downloadDraftPromise
    expect(downloadDraft.suggestedFilename()).toContain('.pcb-draft.json')

    // Setup download listener for Fritzing export
    const downloadFritzingPromise = page.waitForEvent('download')
    await page.getByTestId('export-fzpz-btn').click()
    const downloadFritzing = await downloadFritzingPromise
    expect(downloadFritzing.suggestedFilename()).toContain('.fzpz')

    // Setup download listener for Gerbers export
    const downloadGerbersPromise = page.waitForEvent('download')
    await page.getByTestId('export-gerbers-btn').click()
    const downloadGerbers = await downloadGerbersPromise
    expect(downloadGerbers.suggestedFilename()).toContain('Untitled Footprint.zip')
  })

  test('can trigger file inputs for import', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'MOB-GERB' })).toBeVisible()

    // File inputs are hidden, but we can target them via label text or their actual selectors
    const svgInput = page.locator('input[accept=".svg"]')
    await expect(svgInput).toBeAttached()

    const fzpzInput = page.locator('input[accept=".fzpz,.fzz"]')
    await expect(fzpzInput).toBeAttached()

    const draftInput = page.locator('input[accept=".json"]')
    await expect(draftInput).toBeAttached()
  })
})
