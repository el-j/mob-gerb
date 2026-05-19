import { expect, test } from '@playwright/test'

test('zooms and resets the workspace without introducing horizontal overflow', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByText('1:1')).toBeVisible()
  await page.getByRole('button', { name: '+' }).click()
  await expect(page.getByText('110%')).toBeVisible()
  await page.getByRole('button', { name: '+' }).click()
  await expect(page.getByText('120%')).toBeVisible()
  await page.getByRole('button', { name: '-' }).click()
  await expect(page.getByText('110%')).toBeVisible()
  await page.getByRole('button', { name: '1:1' }).click()
  await expect(page.getByText('100%')).toBeVisible()
  
  

  const overflow = await page.evaluate(() => {
    const doc = document.documentElement
    return {
      bodyScrollWidth: doc.scrollWidth,
      bodyClientWidth: doc.clientWidth,
      bodyScrollHeight: doc.scrollHeight,
      bodyClientHeight: doc.clientHeight,
    }
  })

  expect(overflow.bodyScrollWidth).toBeLessThanOrEqual(overflow.bodyClientWidth)
  expect(overflow.bodyScrollHeight).toBeGreaterThan(0)
})

test('creates a freeform copper surface without connector metadata', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: 'PART CREATOR' }).click()
  await page.getByRole('button', { name: 'Add Copper Surface' }).click()
  await page.getByRole('button', { name: 'Tag Copper Surface' }).click()

  const surface = page.getByTestId('element-shape-1')
  await expect(surface).toHaveAttribute('data-role', 'copper-surface')
  await expect(surface).toHaveAttribute('data-layer', 'copper1')
  await expect(surface).toHaveAttribute('data-connector-id', '')
  await expect(page.getByText(/Role: copper-surface/)).toBeVisible()
})