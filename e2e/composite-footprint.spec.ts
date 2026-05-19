import { expect, test } from '@playwright/test'

test('@headed combines shapes into a composite footprint and adjusts its outline', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: 'PART CREATOR' }).click()
  await page.getByRole('button', { name: 'Add Rectangle' }).click()
  await page.getByRole('button', { name: 'Add Copper Surface' }).click()

  await page.getByTestId('element-shape-1').click({ modifiers: ['Shift'] })

  await expect(page.getByText('Selected: 2 shapes')).toBeVisible()
  await page.getByRole('button', { name: 'Combine Selected' }).click()

  const groupOutline = page.getByTestId('group-outline-group-1')
  await expect(groupOutline).toBeVisible()
  await expect(page.getByText('Selected: group-1')).toBeVisible()

  const initialWidth = Number(await groupOutline.getAttribute('width'))
  const outlinePadding = page.getByRole('spinbutton', { name: 'Outline Padding' })
  await outlinePadding.fill('3')

  const updatedWidth = Number(await groupOutline.getAttribute('width'))
  expect(updatedWidth).toBeGreaterThan(initialWidth)

  const child = page.getByTestId('element-shape-1')
  const beforeX = Number(await child.getAttribute('x'))
  await groupOutline.click()
  const box = await groupOutline.boundingBox()
  if (!box) {
    throw new Error('Expected composite outline to have a bounding box.')
  }

  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width / 2 + 30, box.y + box.height / 2 + 10)
  await page.mouse.up()

  const afterX = Number(await child.getAttribute('x'))
  expect(afterX).toBeGreaterThan(beforeX)
})
