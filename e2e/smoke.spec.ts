import { expect, test } from '@playwright/test'

test('@smoke loads editor shell and canvas', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'MOB-GERB' })).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Editor mode toolbar' })).toBeVisible()
  await expect(page.getByRole('img', { name: 'Mobile-first PCB workspace' })).toBeVisible()
})