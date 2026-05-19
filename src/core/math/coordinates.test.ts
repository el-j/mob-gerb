import { describe, expect, it } from 'vitest'

import { snapCoordinate, snapToGrid, svgToMillimeters } from './coordinates'

describe('coordinates helpers', () => {
  it('converts svg units to millimeters with 1:1 mapping', () => {
    expect(svgToMillimeters(5.5)).toBe(5.5)
  })

  it('snaps values to the nearest grid step', () => {
    expect(snapToGrid(2.4, 0.5)).toBe(2.5)
    expect(snapToGrid(2.1, 0.5)).toBe(2)
  })

  it('returns the original value when grid size is invalid', () => {
    expect(snapToGrid(3.2, 0)).toBe(3.2)
    expect(snapToGrid(3.2, -1)).toBe(3.2)
  })

  it('snaps x and y coordinates using the same grid', () => {
    expect(snapCoordinate({ x: 1.24, y: 2.76 }, 0.25)).toEqual({ x: 1.25, y: 2.75 })
  })
})