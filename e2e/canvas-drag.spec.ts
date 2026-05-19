import { expect, test } from '@playwright/test'

test('selects and drags an element in part creator mode', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: 'PART CREATOR' }).click()

  const element = page.getByTestId('element-connector0pin')
  await expect(element).toBeVisible()

  await element.click()
  await expect(element).toHaveAttribute('data-selected', 'true')

  const beforeCx = Number(await element.getAttribute('cx'))

  const box = await element.boundingBox()
  if (!box) {
    throw new Error('Expected draggable element to have a bounding box.')
  }

  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width / 2 + 45, box.y + box.height / 2 + 20)
  await page.mouse.up()

  const afterCx = Number(await element.getAttribute('cx'))
  expect(afterCx).toBeGreaterThan(beforeCx)
})