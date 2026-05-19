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

  const pointHandle = page.getByTestId('point-handle-1')
  await expect(pointHandle).toBeVisible()
  const handleBox = await pointHandle.boundingBox()
  if (!handleBox) {
    throw new Error('Expected point handle bounding box')
  }

  await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2)
  await page.mouse.down()
  await page.mouse.move(handleBox.x + handleBox.width / 2 + 35, handleBox.y + handleBox.height / 2 - 10)
  await page.mouse.up()

  const midpointHandle = page.getByTestId('midpoint-handle-0')
  await expect(midpointHandle).toBeVisible()
  
  const midBox = await midpointHandle.boundingBox()
  if (!midBox) {
    throw new Error('Expected midpoint handle bounding box')
  }
  await page.mouse.move(midBox.x + midBox.width / 2, midBox.y + midBox.height / 2)
  await page.mouse.down()
  await page.mouse.up()
  
  await expect(page.getByTestId('point-handle-3')).toBeVisible()

  const pointToRemove = page.getByTestId('point-handle-1')
  await pointToRemove.dispatchEvent('dblclick')
  
  await expect(page.getByTestId('point-handle-3')).not.toBeVisible()


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

  // Copy, paste, delete
  await rect.click()
  await page.keyboard.press('Control+c')
  await page.keyboard.press('Meta+c')
  await page.keyboard.press('Control+v')
  await page.keyboard.press('Meta+v')

  
  const pastedRect = page.getByTestId('element-shape-3') // assuming shape-3 is the new shape
  await expect(pastedRect).toBeVisible()
  await expect(pastedRect).toHaveAttribute('data-selected', 'true')
  
  await page.keyboard.press('Delete')
  await expect(pastedRect).not.toBeVisible()
})
