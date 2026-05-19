import { expect, test } from '@playwright/test'

test('selects and drags an element in part creator mode', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: 'PART CREATOR' }).click()

  // THT connector0pin lives in copper0; it also appears in copper1 group due to drill-through.
  // Pick the instance inside the copper0 layer group to get a unique, canonical reference.
  const copper0Group = page.locator('[data-testid="layer-group-copper0"]')
  const element = copper0Group.locator('[data-testid="element-copper0.connector0pin"]')
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