import { expect, test } from '@playwright/test'

test('supports free draw, selection visibility, style edits, and quick 1:1 reset', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: 'PART CREATOR' }).click()

  await page.getByRole('button', { name: 'Start Free Draw' }).click()

  const canvas = page.getByRole('img', { name: 'Mobile-first PCB workspace' })
  const box = await canvas.boundingBox()
  if (!box) {
    throw new Error('Expected canvas bounding box')
  }

  await page.mouse.click(box.x + 120, box.y + 180)
  await page.mouse.click(box.x + 170, box.y + 170)
  await page.mouse.click(box.x + 230, box.y + 160)

  await page.getByRole('button', { name: 'Finish Polyline' }).click()

  const polyline = page.getByTestId('element-shape-1')
  await expect(polyline).toBeVisible()
  await expect(polyline).toHaveAttribute('data-selected', 'true')
  await expect(page.getByTestId('selection-box')).toBeVisible()

  const strokeInput = page.getByRole('spinbutton', { name: 'Stroke' })
  await strokeInput.fill('1.8')
  await expect(polyline).toHaveAttribute('data-selected', 'true')

  await page.getByRole('button', { name: 'Add Rectangle' }).click()
  const rect = page.getByTestId('element-shape-2')
  await rect.click()
  await page.getByRole('button', { name: 'Set Filled' }).click()

  await page.getByRole('button', { name: 'Zoom In' }).click()
  await expect(page.getByText('Zoom: 110%')).toBeVisible()
  await page.getByRole('button', { name: '1:1' }).click()
  await expect(page.getByText('Zoom: 100%')).toBeVisible()
})
