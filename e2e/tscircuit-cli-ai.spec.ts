import { expect, test } from '@playwright/test'

test('generates AI prompt from tscircuit preview controls', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: 'Show tscircuit preview' }).click()

  await page.getByRole('button', { name: 'Download tscircuit CLI script' }).click()
  await expect(page.getByText('CLI publish script downloaded.')).toBeVisible()

  await page.getByRole('textbox', { name: 'AI footprint goal' }).fill('Reduce footprint area while preserving connector spacing')
  await page.getByRole('button', { name: 'Generate AI footprint prompt' }).click()

  const promptBox = page.getByRole('textbox', { name: 'Generated AI footprint prompt' })
  await expect(promptBox).toBeVisible()
  await expect(promptBox).toContainText('Return a valid circuit-json array.')
  await expect(page.getByText('AI footprint prompt generated.')).toBeVisible()
})
