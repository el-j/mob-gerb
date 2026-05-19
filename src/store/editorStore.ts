import { create } from 'zustand'
import AutorouterWorker from '../workers/autorouter.worker?worker'
import type { AutorouterRequest, AutorouterResponse } from '../workers/autorouter.protocol'

import { boundsFromElement, boundsToRect, inflateBounds, unionBounds } from '../core/math/geometry'
import type {
  AppMode,
  Coordinate,
  ElementState,
  ElementType,
  FootprintProject,
  ProjectMetadata,
} from '../core/types/pcb'
import { runDrc as runDrcEngine } from '../core/drc/drcEngine'
import type { DrcViolation } from '../core/drc/drcEngine'

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
  clipboard: ElementState[]
  pendingNetConnection: string | null
  logicalDraftPointer: Coordinate | null
  isRouting: boolean
  editingTraceId: string | null
  drcViolations: DrcViolation[]
  drcClearanceMm: number
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
  importElements: (elements: ElementState[]) => void
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
  addPointToSelectedShape: (index: number, point: Coordinate) => void
  removePointFromSelectedShape: (index: number) => void
  copySelected: () => void
  pasteCopied: () => void
  deleteSelected: () => void
  startLogicalConnection: (elementId: string) => void
  completeLogicalConnection: (elementId: string) => void
  cancelLogicalConnection: () => void
  setLogicalDraftPointer: (point: Coordinate | null) => void
  triggerAutoroute: () => void
  receiveAutorouteResult: (traces: ElementState[]) => void
  enterTraceEdit: (traceId: string) => void
  exitTraceEdit: () => void
  updateTraceVertex: (traceId: string, index: number, point: Coordinate) => void
  runDrc: () => void
  setDrcClearance: (mm: number) => void
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
  clipboard: [],
  pendingNetConnection: null,
  logicalDraftPointer: null,
  isRouting: false,
  editingTraceId: null,
  drcViolations: [],
  drcClearanceMm: 0.2,
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
  importElements: (elements: ElementState[]) =>
    set((state) => {
      const nextElements: Record<string, ElementState> = {}
      for (const el of elements) {
        nextElements[el.id] = el
      }
      return {
        project: withTouchedProject({
          ...state.project,
          elements: nextElements,
        }),
        ...setSelectionState([]),
      }
    }),
  removeElement: (elementId: string) =>
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

      const remainingNets = { ...state.project.nets }
      let netsChanged = false
      for (const [netId, net] of Object.entries(remainingNets)) {
        if (net.padIds.includes(elementId)) {
          const nextPads = net.padIds.filter((id) => id !== elementId)
          if (nextPads.length < 2) {
            delete remainingNets[netId]
          } else {
            remainingNets[netId] = { ...net, padIds: nextPads }
          }
          netsChanged = true
        }
      }

      const nextSelection = state.selectedElementIds.filter((id) => id !== elementId)
      const selectedGroup = element?.type === 'group' ? element.children ?? [] : []

      return {
        project: withTouchedProject({
          ...state.project,
          elements: remainingElements,
          nets: remainingNets,
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
  addPointToSelectedShape: (index, point) =>
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
      points.splice(index, 0, {
        x: point.x - current.geom.x,
        y: point.y - current.geom.y,
      })

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
  removePointFromSelectedShape: (index) =>
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

      if (current.type === 'polygon' && points.length <= 3) {
        return state
      }
      if (current.type === 'polyline' && points.length <= 2) {
        return state
      }

      if (index < 0 || index >= points.length) {
        return state
      }

      points.splice(index, 1)

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
  copySelected: () =>
    set((state) => {
      const copied = state.selectedElementIds
        .map((id) => state.project.elements[id])
        .filter((el): el is ElementState => el !== undefined)
      return { clipboard: copied }
    }),
  pasteCopied: () =>
    set((state) => {
      if (state.clipboard.length === 0) return state

      const nextElements = { ...state.project.elements }
      const newSelectedIds: string[] = []
      const idMap = new Map<string, string>()

      for (const element of state.clipboard) {
        const newId = element.type === 'group' ? nextGroupId(nextElements) : nextShapeId(nextElements)
        idMap.set(element.id, newId)
        
        const clone: ElementState = {
          ...element,
          id: newId,
          geom: {
            ...element.geom,
            x: element.geom.x + state.gridSize,
            y: element.geom.y + state.gridSize,
            points: element.geom.points?.map(p => ({...p})),
          },
        }

        if (element.role === 'connector') {
          const pin = nextConnectorPin(nextElements)
          clone.connector = {
            kind: element.connector!.kind,
            pin,
            connectorId: `connector${pin}`,
            svgId: `connector${pin}pin`,
          }
        }

        nextElements[newId] = clone
        newSelectedIds.push(newId)
      }

      for (const newId of newSelectedIds) {
        const element = nextElements[newId]
        if (element.groupId) {
          element.groupId = idMap.get(element.groupId) ?? null
        }
        if (element.children) {
          element.children = element.children.map(childId => idMap.get(childId) ?? childId)
        }
      }

      const topLevelSelection = newSelectedIds.filter(id => !nextElements[id].groupId)

      return {
        project: withTouchedProject({
          ...state.project,
          elements: nextElements,
        }),
        ...setSelectionState(topLevelSelection),
      }
    }),
  deleteSelected: () =>
    set((state) => {
      if (state.selectedElementIds.length === 0) return state

      const remainingElements = { ...state.project.elements }
      
      for (const elementId of state.selectedElementIds) {
        const element = remainingElements[elementId]
        if (!element) continue
        
        delete remainingElements[elementId]

        if (element.type === 'group') {
          for (const childId of element.children ?? []) {
            delete remainingElements[childId]
          }
        } else if (element.groupId) {
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
      }

      const remainingNets = { ...state.project.nets }
      for (const [netId, net] of Object.entries(remainingNets)) {
        const nextPads = net.padIds.filter((id) => !state.selectedElementIds.includes(id))
        if (nextPads.length !== net.padIds.length) {
          if (nextPads.length < 2) {
            delete remainingNets[netId]
          } else {
            remainingNets[netId] = { ...net, padIds: nextPads }
          }
        }
      }

      return {
        project: withTouchedProject({
          ...state.project,
          elements: remainingElements,
          nets: remainingNets,
        }),
        ...setSelectionState([]),
      }
    }),
  startLogicalConnection: (elementId) =>
    set((state) => {
      const el = state.project.elements[elementId]
      if (!el || el.role !== 'connector') return state
      return { pendingNetConnection: elementId, logicalDraftPointer: null }
    }),
  completeLogicalConnection: (elementId) =>
    set((state) => {
      if (!state.pendingNetConnection || state.pendingNetConnection === elementId) {
        return { pendingNetConnection: null, logicalDraftPointer: null }
      }
      const el1 = state.project.elements[state.pendingNetConnection]
      const el2 = state.project.elements[elementId]
      if (!el1 || !el2 || el1.role !== 'connector' || el2.role !== 'connector') {
        return { pendingNetConnection: null, logicalDraftPointer: null }
      }

      const nets = { ...state.project.nets }
      let net1Id: string | null = null
      let net2Id: string | null = null

      for (const [netId, net] of Object.entries(nets)) {
        if (net.padIds.includes(el1.id)) net1Id = netId
        if (net.padIds.includes(el2.id)) net2Id = netId
      }

      if (net1Id && net2Id) {
        if (net1Id === net2Id) {
          return { pendingNetConnection: null, logicalDraftPointer: null }
        }
        const mergedPadIds = Array.from(new Set([...nets[net1Id].padIds, ...nets[net2Id].padIds]))
        nets[net1Id] = { ...nets[net1Id], padIds: mergedPadIds }
        delete nets[net2Id]
      } else if (net1Id) {
        nets[net1Id] = { ...nets[net1Id], padIds: [...nets[net1Id].padIds, el2.id] }
      } else if (net2Id) {
        nets[net2Id] = { ...nets[net2Id], padIds: [...nets[net2Id].padIds, el1.id] }
      } else {
        const maxNetId = Object.keys(nets)
          .map(id => { const m = id.match(/^net-(\d+)$/); return m ? Number(m[1]) : 0 })
          .reduce((a, b) => Math.max(a, b), 0)
        const newNetId = `net-${maxNetId + 1}`
        nets[newNetId] = { id: newNetId, padIds: [el1.id, el2.id] }
      }

      return {
        project: withTouchedProject({
          ...state.project,
          nets,
        }),
        pendingNetConnection: null,
        logicalDraftPointer: null,
      }
    }),
  cancelLogicalConnection: () =>
    set({ pendingNetConnection: null, logicalDraftPointer: null }),
  setLogicalDraftPointer: (point) =>
    set({ logicalDraftPointer: point }),
  triggerAutoroute: () => {
    set({ isRouting: true, mode: 'ROUTING_MODE' })
    const state = useEditorStore.getState()
    
    // Lazy initialize worker
    const worker = new AutorouterWorker()
    worker.onmessage = (e: MessageEvent<AutorouterResponse>) => {
      if (e.data.type === 'ROUTE_SUCCESS') {
        useEditorStore.getState().receiveAutorouteResult(e.data.traces)
      } else {
        console.error('Autorouting failed', e.data)
        useEditorStore.getState().receiveAutorouteResult([])
      }
      worker.terminate()
    }
    
    worker.postMessage({
      type: 'ROUTE_REQUEST',
      gridSize: state.gridSize,
      elements: state.project.elements,
      nets: state.project.nets
    } as AutorouterRequest)
  },
  receiveAutorouteResult: (traces) =>
    set((state) => {
      if (!state.isRouting) return state // Ignore stale responses
      
      const nextElements = { ...state.project.elements }
      
      // We can clear existing routes first if we want, or just insert the new ones
      for (const [id, el] of Object.entries(nextElements)) {
        if (el.role === 'copper-surface' && el.type === 'polyline' && el.id.startsWith('route-')) {
          delete nextElements[id]
        }
      }
      
      for (const trace of traces) {
        nextElements[trace.id] = trace
      }
      
      return {
        isRouting: false,
        mode: 'VIEW_MODE',
        project: withTouchedProject({
          ...state.project,
          elements: nextElements
        })
      }
    }),
  enterTraceEdit: (traceId) =>
    set({ editingTraceId: traceId, mode: 'EDIT_TRACE_MODE' }),
  exitTraceEdit: () =>
    set({ editingTraceId: null, mode: 'VIEW_MODE' }),
  updateTraceVertex: (traceId, index, point) =>
    set((state) => {
      const el = state.project.elements[traceId]
      if (!el || el.type !== 'polyline') return state
      const nextPoints = [...(el.geom.points ?? [])]
      nextPoints[index] = point
      return {
        project: withTouchedProject({
          ...state.project,
          elements: {
            ...state.project.elements,
            [traceId]: { ...el, geom: { ...el.geom, points: nextPoints } },
          },
        }),
      }
    }),
  runDrc: () =>
    set((state) => ({
      drcViolations: runDrcEngine(state.project.elements, state.drcClearanceMm),
    })),
  setDrcClearance: (mm) =>
    set({ drcClearanceMm: mm }),
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
