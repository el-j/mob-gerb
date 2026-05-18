import { create } from 'zustand'

import type { AppMode, Coordinate } from '../core/types/pcb'

const MIN_ZOOM = 0.2
const MAX_ZOOM = 8

type EditorState = {
  mode: AppMode
  pan: Coordinate
  zoom: number
  gridSize: number
  setMode: (mode: AppMode) => void
  panBy: (delta: Coordinate) => void
  setZoom: (zoom: number) => void
  setGridSize: (gridSize: number) => void
}

export const useEditorStore = create<EditorState>((set) => ({
  mode: 'VIEW_MODE',
  pan: { x: 0, y: 0 },
  zoom: 1,
  gridSize: 2.54,
  setMode: (mode) => set({ mode }),
  panBy: (delta) =>
    set((state) => ({
      pan: {
        x: state.pan.x + delta.x,
        y: state.pan.y + delta.y,
      },
    })),
  setZoom: (zoom) =>
    set({
      zoom: Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom)),
    }),
  setGridSize: (gridSize) =>
    set({
      gridSize: gridSize > 0 ? gridSize : 2.54,
    }),
}))
