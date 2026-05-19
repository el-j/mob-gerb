import { create } from 'zustand'

import { boundsFromElement, boundsToRect, inflateBounds, unionBounds } from '../core/math/geometry'
import type {
  AppMode,
  Coordinate,
  ElementState,
  ElementType,
  FootprintProject,
  ProjectMetadata,
} from '../core/types/pcb'

const DEFAULT_GRID_SIZE = 2.54
const MIN_ZOOM = 0.2
const MAX_ZOOM = 8
const MAX_HISTORY_SIZE = 30

type DrawTool = 'none' | 'polyline'

type HistorySnapshot = {
  project: FootprintProject
  selectedElementId: string | null
  selectedElementIds: string[]
}

export type EditorState = {
  mode: AppMode
  pan: Coordinate
  zoom: number
  gridSize: number
  project: FootprintProject
  selectedElementId: string | null
  selectedElementIds: string[]
  drawTool: DrawTool
  draftPoints: Coordinate[]
  historyPast: HistorySnapshot[]
  historyFuture: HistorySnapshot[]
  setMode: (mode: AppMode) => void
  panBy: (delta: Coordinate) => void
  setZoom: (zoom: number) => void
  zoomBy: (delta: number) => void
  setGridSize: (gridSize: number) => void
  resetView: () => void
  setProjectMetadata: (metadata: Partial<ProjectMetadata>) => void
  addShape: (type: ElementType) => void
  upsertElement: (element: ElementState) => void
  removeElement: (elementId: string) => void
  setElementPosition: (elementId: string, position: Coordinate) => void
  selectElement: (elementId: string | null) => void
  toggleElementSelection: (elementId: string) => void
  combineSelectedElements: () => void
  splitComposite: (groupId: string) => void
  setOutlinePadding: (elementId: string, padding: number) => void
  setSelectedFill: (filled: boolean) => void
  setSelectedStrokeWidth: (width: number) => void
  updateSelectedPolylinePoint: (index: number, point: Coordinate) => void
  updateSelectedPointFromWorld: (index: number, point: Coordinate) => void
  setDrawTool: (tool: DrawTool) => void
  addDraftPoint: (point: Coordinate) => void
  finishPolylineDraw: () => void
  clearDraftPoints: () => void
  applyTagToSelected: (tag: 'through-hole' | 'smd' | 'silkscreen' | 'copper-surface' | 'unassigned', requestedPin?: number) => void
  commitHistory: () => void
  undo: () => void
  redo: () => void
}

const cloneProject = (project: FootprintProject): FootprintProject => ({
  ...project,
  metadata: { ...project.metadata },
  elements: Object.fromEntries(
    Object.entries(project.elements).map(([id, element]) => [
      id,
      {
        ...element,
        geom: {
          ...element.geom,
          points: element.geom.points?.map((point) => ({ ...point })),
        },
        children: element.children ? [...element.children] : undefined,
      },
    ]),
  ),
  nets: Object.fromEntries(Object.entries(project.nets).map(([id, net]) => [id, { ...net, padIds: [...net.padIds] }])),
})

const createInitialProject = (): FootprintProject => ({
  projectId: 'project-1',
  lastModified: Date.now(),
  metadata: {
    name: 'Untitled Footprint',
    author: '',
  },
  gridSize: DEFAULT_GRID_SIZE,
  elements: {
    connector0pin: {
      id: 'connector0pin',
      type: 'circle',
      role: 'connector',
      pcbLayer: 'copper0',
      geom: { x: 54, y: 42, r: 1.2 },
    },
    'silk-outline': {
      id: 'silk-outline',
      type: 'rect',
      role: 'silkscreen',
      pcbLayer: 'silkscreen',
      geom: { x: 48, y: 36, w: 12, h: 12 },
    },
  },
  nets: {},
})

const createSnapshot = (state: EditorState): HistorySnapshot => ({
  project: cloneProject(state.project),
  selectedElementId: state.selectedElementId,
  selectedElementIds: [...state.selectedElementIds],
})

const withTouchedProject = (project: FootprintProject): FootprintProject => ({
  ...project,
  lastModified: Date.now(),
})

const nextShapeId = (elements: Record<string, ElementState>): string => {
  const maxId = Object.keys(elements)
    .map((id) => {
      const match = id.match(/^shape-(\d+)$/)
      return match ? Number(match[1]) : 0
    })
    .reduce((acc, current) => Math.max(acc, current), 0)

  return `shape-${maxId + 1}`
}

const nextConnectorPin = (elements: Record<string, ElementState>, requestedPin?: number): number => {
  const usedPins = new Set(
    Object.values(elements)
      .map((element) => element.connector?.pin)
      .filter((pin): pin is number => pin !== undefined),
  )

  const desiredPin = requestedPin && requestedPin > 0 ? requestedPin : 1
  if (!usedPins.has(desiredPin)) {
    return desiredPin
  }

  let pin = desiredPin + 1
  while (usedPins.has(pin)) {
    pin += 1
  }

  return pin
}

const nextGroupId = (elements: Record<string, ElementState>): string => {
  const maxId = Object.keys(elements)
    .map((id) => {
      const match = id.match(/^group-(\d+)$/)
      return match ? Number(match[1]) : 0
    })
    .reduce((acc, current) => Math.max(acc, current), 0)

  return `group-${maxId + 1}`
}

const resolveSelectionTarget = (element: ElementState): string => element.groupId ?? element.id

const setSelectionState = (selectedElementIds: string[]): Pick<EditorState, 'selectedElementId' | 'selectedElementIds'> => ({
  selectedElementIds,
  selectedElementId: selectedElementIds[selectedElementIds.length - 1] ?? null,
})

const createGroupElement = (
  groupId: string,
  childIds: string[],
  elements: Record<string, ElementState>,
): ElementState => {
  const childBounds = childIds
    .map((childId) => elements[childId])
    .filter((child): child is ElementState => child !== undefined)
    .map((child) => inflateBounds(boundsFromElement(child), 0.8))

  const bounds = unionBounds(childBounds)

  return {
    id: groupId,
    type: 'group',
    role: 'group',
    pcbLayer: 'silkscreen',
    geom: boundsToRect(bounds),
    children: [...childIds],
    outlinePaddingMm: 0.8,
  }
}

const recomputeGroupGeometry = (
  group: ElementState,
  elements: Record<string, ElementState>,
): ElementState => {
  const childIds = group.children ?? []
  if (childIds.length === 0) {
    return group
  }

  const padding = group.outlinePaddingMm ?? 0.8
  const bounds = unionBounds(
    childIds
      .map((childId) => elements[childId])
      .filter((child): child is ElementState => child !== undefined)
      .map((child) => inflateBounds(boundsFromElement(child), padding)),
  )

  return {
    ...group,
    geom: boundsToRect(bounds),
  }
}

const createShapeElement = (type: ElementType, id: string): ElementState => {
  if (type === 'circle') {
    return {
      id,
      type,
      role: 'unassigned',
      pcbLayer: 'silkscreen',
      groupId: null,
      geom: { x: 60, y: 60, r: 1.5, filled: false, strokeWidth: 0.55 },
    }
  }

  if (type === 'rect') {
    return {
      id,
      type,
      role: 'unassigned',
      pcbLayer: 'silkscreen',
      groupId: null,
      geom: { x: 56, y: 56, w: 8, h: 8, filled: false, strokeWidth: 0.35 },
    }
  }

  if (type === 'polygon') {
    return {
      id,
      type,
      role: 'copper-surface',
      pcbLayer: 'copper1',
      groupId: null,
      geom: {
        x: 48,
        y: 50,
        filled: true,
        strokeWidth: 0.4,
        points: [
          { x: 0, y: 0 },
          { x: 12, y: -3 },
          { x: 16, y: 4 },
          { x: 10, y: 12 },
          { x: 2, y: 10 },
          { x: -2, y: 4 },
        ],
      },
    }
  }

  return {
    id,
    type,
    role: 'unassigned',
    pcbLayer: 'silkscreen',
    groupId: null,
    geom: { x: 54, y: 60, w: 12, h: 0, strokeWidth: 0.5 },
  }
}

const createPolylineElement = (id: string, points: Coordinate[]): ElementState => {
  const origin = points[0]
  const relativePoints = points.map((point) => ({
    x: point.x - origin.x,
    y: point.y - origin.y,
  }))

  return {
    id,
    type: 'polyline',
    role: 'unassigned',
    pcbLayer: 'silkscreen',
    groupId: null,
    geom: {
      x: origin.x,
      y: origin.y,
      points: relativePoints,
      strokeWidth: 0.5,
      filled: false,
    },
  }
}

export const useEditorStore = create<EditorState>((set) => ({
  mode: 'VIEW_MODE',
  pan: { x: 0, y: 0 },
  zoom: 1,
  gridSize: DEFAULT_GRID_SIZE,
  project: createInitialProject(),
  selectedElementId: null,
  selectedElementIds: [],
  drawTool: 'none',
  draftPoints: [],
  historyPast: [],
  historyFuture: [],
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
  zoomBy: (delta) =>
    set((state) => ({
      zoom: Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, state.zoom + delta)),
    })),
  setGridSize: (gridSize) =>
    set((state) => {
      const normalizedGridSize = gridSize > 0 ? gridSize : DEFAULT_GRID_SIZE

      return {
        gridSize: normalizedGridSize,
        project: withTouchedProject({
          ...state.project,
          gridSize: normalizedGridSize,
        }),
      }
    }),
  resetView: () =>
    set({
      pan: { x: 0, y: 0 },
      zoom: 1,
    }),
  setProjectMetadata: (metadata) =>
    set((state) => ({
      project: withTouchedProject({
        ...state.project,
        metadata: {
          ...state.project.metadata,
          ...metadata,
        },
      }),
    })),
  addShape: (type) =>
    set((state) => {
      const id = nextShapeId(state.project.elements)
      const newElement = createShapeElement(type, id)

      return {
        project: withTouchedProject({
          ...state.project,
          elements: {
            ...state.project.elements,
            [id]: newElement,
          },
        }),
        ...setSelectionState([id]),
      }
    }),
  upsertElement: (element) =>
    set((state) => ({
      project: withTouchedProject({
        ...state.project,
        elements: {
          ...state.project.elements,
          [element.id]: {
            ...element,
            geom: {
              ...element.geom,
              points: element.geom.points?.map((point) => ({ ...point })),
            },
            children: element.children ? [...element.children] : undefined,
          },
        },
      }),
    })),
  removeElement: (elementId) =>
    set((state) => {
      const remainingElements = { ...state.project.elements }
      const element = remainingElements[elementId]
      delete remainingElements[elementId]

      if (element?.type === 'group') {
        for (const childId of element.children ?? []) {
          const child = remainingElements[childId]
          if (!child) {
            continue
          }

          remainingElements[childId] = {
            ...child,
            groupId: null,
          }
        }
      } else if (element?.groupId) {
        const parent = remainingElements[element.groupId]
        if (parent?.type === 'group') {
          const nextChildren = (parent.children ?? []).filter((childId) => childId !== elementId)
          if (nextChildren.length === 0) {
            delete remainingElements[parent.id]
          } else {
            remainingElements[parent.id] = recomputeGroupGeometry({
              ...parent,
              children: nextChildren,
            }, remainingElements)
          }
        }
      }

      const nextSelection = state.selectedElementIds.filter((id) => id !== elementId)
      const selectedGroup = element?.type === 'group' ? element.children ?? [] : []

      return {
        project: withTouchedProject({
          ...state.project,
          elements: remainingElements,
        }),
        ...setSelectionState(nextSelection.filter((id) => !selectedGroup.includes(id))),
      }
    }),
  setElementPosition: (elementId, position) =>
    set((state) => {
      const current = state.project.elements[elementId]
      if (!current) {
        return state
      }

      if (current.type === 'group') {
        const delta = {
          x: position.x - current.geom.x,
          y: position.y - current.geom.y,
        }

        const nextElements = { ...state.project.elements }
        for (const childId of current.children ?? []) {
          const child = nextElements[childId]
          if (!child) {
            continue
          }

          nextElements[childId] = {
            ...child,
            geom: {
              ...child.geom,
              x: child.geom.x + delta.x,
              y: child.geom.y + delta.y,
            },
          }
        }

        const movedGroup = recomputeGroupGeometry(
          {
            ...current,
            geom: {
              ...current.geom,
              x: position.x,
              y: position.y,
            },
          },
          nextElements,
        )

        nextElements[elementId] = movedGroup

        return {
          project: withTouchedProject({
            ...state.project,
            elements: nextElements,
          }),
        }
      }

      return {
        project: withTouchedProject({
          ...state.project,
          elements: {
            ...state.project.elements,
            [elementId]: {
              ...current,
              geom: {
                ...current.geom,
                x: position.x,
                y: position.y,
              },
            },
          },
        }),
      }
    }),
  selectElement: (elementId) =>
    set((state) => {
      if (!elementId) {
        return setSelectionState([])
      }

      const element = state.project.elements[elementId]
      const selectionTarget = element ? resolveSelectionTarget(element) : elementId
      return setSelectionState([selectionTarget])
    }),
  toggleElementSelection: (elementId) =>
    set((state) => {
      const element = state.project.elements[elementId]
      const selectionTarget = element ? resolveSelectionTarget(element) : elementId
      const current = new Set(state.selectedElementIds)

      if (current.has(selectionTarget)) {
        current.delete(selectionTarget)
      } else {
        current.add(selectionTarget)
      }

      return setSelectionState([...current])
    }),
  combineSelectedElements: () =>
    set((state) => {
      const childIds = state.selectedElementIds.filter((id) => state.project.elements[id])
      if (childIds.length < 2) {
        return state
      }

      const groupId = nextGroupId(state.project.elements)
      const nextElements = { ...state.project.elements }
      const group = createGroupElement(groupId, childIds, nextElements)

      nextElements[groupId] = group
      for (const childId of childIds) {
        const child = nextElements[childId]
        if (!child) {
          continue
        }

        nextElements[childId] = {
          ...child,
          groupId,
        }
      }

      return {
        project: withTouchedProject({
          ...state.project,
          elements: nextElements,
        }),
        ...setSelectionState([groupId]),
      }
    }),
  splitComposite: (groupId) =>
    set((state) => {
      const group = state.project.elements[groupId]
      if (!group || group.type !== 'group') {
        return state
      }

      const nextElements = { ...state.project.elements }
      const childIds = group.children ?? []
      for (const childId of childIds) {
        const child = nextElements[childId]
        if (!child) {
          continue
        }

        nextElements[childId] = {
          ...child,
          groupId: null,
        }
      }

      delete nextElements[groupId]

      return {
        project: withTouchedProject({
          ...state.project,
          elements: nextElements,
        }),
        ...setSelectionState(childIds),
      }
    }),
  setOutlinePadding: (elementId, padding) =>
    set((state) => {
      const current = state.project.elements[elementId]
      if (!current || current.type !== 'group') {
        return state
      }

      const safePadding = Math.max(0, padding)
      const updatedGroup = recomputeGroupGeometry(
        {
          ...current,
          outlinePaddingMm: safePadding,
        },
        state.project.elements,
      )

      return {
        project: withTouchedProject({
          ...state.project,
          elements: {
            ...state.project.elements,
            [elementId]: updatedGroup,
          },
        }),
      }
    }),
  setSelectedFill: (filled) =>
    set((state) => {
      const selectedId = state.selectedElementId
      if (!selectedId) {
        return state
      }

      const current = state.project.elements[selectedId]
      if (!current || current.type === 'line' || current.type === 'polyline' || current.type === 'group') {
        return state
      }

      return {
        project: withTouchedProject({
          ...state.project,
          elements: {
            ...state.project.elements,
            [selectedId]: {
              ...current,
              geom: {
                ...current.geom,
                filled,
              },
            },
          },
        }),
      }
    }),
  setSelectedStrokeWidth: (width) =>
    set((state) => {
      const selectedId = state.selectedElementId
      if (!selectedId) {
        return state
      }

      const safeWidth = Number.isFinite(width) ? Math.min(4, Math.max(0.1, width)) : 0.5
      const current = state.project.elements[selectedId]
      if (!current || current.type === 'group') {
        return state
      }

      return {
        project: withTouchedProject({
          ...state.project,
          elements: {
            ...state.project.elements,
            [selectedId]: {
              ...current,
              geom: {
                ...current.geom,
                strokeWidth: safeWidth,
              },
            },
          },
        }),
      }
    }),
  updateSelectedPolylinePoint: (index, point) =>
    set((state) => {
      const selectedId = state.selectedElementId
      if (!selectedId) {
        return state
      }

      const current = state.project.elements[selectedId]
      if (!current || current.type !== 'polyline') {
        return state
      }

      const points = [...(current.geom.points ?? [])]
      if (index < 0 || index >= points.length) {
        return state
      }

      points[index] = { ...point }

      return {
        project: withTouchedProject({
          ...state.project,
          elements: {
            ...state.project.elements,
            [selectedId]: {
              ...current,
              geom: {
                ...current.geom,
                points,
              },
            },
          },
        }),
      }
    }),
  updateSelectedPointFromWorld: (index, point) =>
    set((state) => {
      const selectedId = state.selectedElementId
      if (!selectedId) {
        return state
      }

      const current = state.project.elements[selectedId]
      if (!current || (current.type !== 'polyline' && current.type !== 'polygon')) {
        return state
      }

      const points = [...(current.geom.points ?? [])]
      if (index < 0 || index >= points.length) {
        return state
      }

      points[index] = {
        x: point.x - current.geom.x,
        y: point.y - current.geom.y,
      }

      return {
        project: withTouchedProject({
          ...state.project,
          elements: {
            ...state.project.elements,
            [selectedId]: {
              ...current,
              geom: {
                ...current.geom,
                points,
              },
            },
          },
        }),
      }
    }),
  setDrawTool: (tool) =>
    set(() => ({
      drawTool: tool,
      draftPoints: tool === 'none' ? [] : [],
    })),
  addDraftPoint: (point) =>
    set((state) => ({
      draftPoints: [...state.draftPoints, point],
    })),
  finishPolylineDraw: () =>
    set((state) => {
      if (state.drawTool !== 'polyline' || state.draftPoints.length < 2) {
        return state
      }

      const id = nextShapeId(state.project.elements)
      const polyline = createPolylineElement(id, state.draftPoints)

      return {
        project: withTouchedProject({
          ...state.project,
          elements: {
            ...state.project.elements,
            [id]: polyline,
          },
        }),
        ...setSelectionState([id]),
        drawTool: 'none',
        draftPoints: [],
      }
    }),
  clearDraftPoints: () =>
    set(() => ({
      draftPoints: [],
      drawTool: 'none',
    })),
  applyTagToSelected: (tag, requestedPin) =>
    set((state) => {
      const selectedId = state.selectedElementId
      if (!selectedId) {
        return state
      }

      const current = state.project.elements[selectedId]
      if (!current) {
        return state
      }

      const nextElement: ElementState = {
        ...current,
      }

      if (tag === 'through-hole' || tag === 'smd') {
        const pin = nextConnectorPin(state.project.elements, requestedPin)
        nextElement.role = 'connector'
        nextElement.pcbLayer = tag === 'through-hole' ? 'copper0' : 'copper1'
        nextElement.connector = {
          kind: tag,
          pin,
          connectorId: `connector${pin}`,
          svgId: `connector${pin}pin`,
        }
      } else if (tag === 'silkscreen') {
        nextElement.role = 'silkscreen'
        nextElement.pcbLayer = 'silkscreen'
        nextElement.connector = undefined
      } else if (tag === 'copper-surface') {
        nextElement.role = 'copper-surface'
        nextElement.pcbLayer = 'copper1'
        nextElement.connector = undefined
      } else {
        nextElement.role = 'unassigned'
        nextElement.connector = undefined
      }

      return {
        project: withTouchedProject({
          ...state.project,
          elements: {
            ...state.project.elements,
            [selectedId]: nextElement,
          },
        }),
      }
    }),
  commitHistory: () =>
    set((state) => {
      const snapshot = createSnapshot(state)
      const nextPast = [...state.historyPast, snapshot]

      return {
        historyPast: nextPast.slice(-MAX_HISTORY_SIZE),
        historyFuture: [],
      }
    }),
  undo: () =>
    set((state) => {
      if (state.historyPast.length === 0) {
        return state
      }

      const previousSnapshot = state.historyPast[state.historyPast.length - 1]
      const currentSnapshot = createSnapshot(state)

      return {
        project: previousSnapshot.project,
        gridSize: previousSnapshot.project.gridSize,
        selectedElementId: previousSnapshot.selectedElementId,
        selectedElementIds: [...previousSnapshot.selectedElementIds],
        historyPast: state.historyPast.slice(0, -1),
        historyFuture: [currentSnapshot, ...state.historyFuture],
      }
    }),
  redo: () =>
    set((state) => {
      if (state.historyFuture.length === 0) {
        return state
      }

      const [nextSnapshot, ...remainingFuture] = state.historyFuture
      const currentSnapshot = createSnapshot(state)

      return {
        project: nextSnapshot.project,
        gridSize: nextSnapshot.project.gridSize,
        selectedElementId: nextSnapshot.selectedElementId,
        selectedElementIds: [...nextSnapshot.selectedElementIds],
        historyPast: [...state.historyPast, currentSnapshot].slice(-MAX_HISTORY_SIZE),
        historyFuture: remainingFuture,
      }
    }),
}))
