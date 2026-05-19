import React, { useState } from 'react'
import {
  Layers,
  Eye,
  EyeOff,
  Trash2,
  Circle,
  Square,
  Hexagon,
  Minus,
  ChevronLeft,
  Tag,
} from 'lucide-react'
import { useEditorStore } from '../../store/editorStore'
import type { ElementState } from '../../core/types/pcb'
import { getCopperLayers } from '../../core/types/pcb'

export const LayersSidebar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [dragOverLayer, setDragOverLayer] = useState<string | null>(null)

  const [editingElementId, setEditingElementId] = useState<string | null>(null)
  const [editNameValue, setEditNameValue] = useState<string>('')

  const elements = useEditorStore((state) => state.project.elements)
  const selectedElementIds = useEditorStore((state) => state.selectedElementIds)
  const hiddenElementIds = useEditorStore((state) => state.hiddenElementIds)
  const hoveredElementId = useEditorStore((state) => state.hoveredElementId)
  const layerCount = useEditorStore((state) => state.project.layerCount ?? 2)
  const activeLayer = useEditorStore((state) => state.activeLayer)

  const selectElement = useEditorStore((state) => state.selectElement)
  const toggleElementVisibility = useEditorStore((state) => state.toggleElementVisibility)
  const deleteElement = useEditorStore((state) => state.deleteElement)
  const renameElement = useEditorStore((state) => state.renameElement)
  const setHoveredElementId = useEditorStore((state) => state.setHoveredElementId)
  const upsertElement = useEditorStore((state) => state.upsertElement)
  const commitHistory = useEditorStore((state) => state.commitHistory)
  const setLayerCount = useEditorStore((state) => state.setLayerCount)
  const setActiveLayer = useEditorStore((state) => state.setActiveLayer)

  const getNextPin = () => {
    const pins = Object.values(elements)
      .map((e) => e.connector?.pin)
      .filter((p): p is number => p !== undefined)
    return pins.length > 0 ? Math.max(...pins) + 1 : 1
  }

  const handleUpdatePin = (pin: number) => {
    const selectedId = selectedElementIds[0]
    const selectedEl = selectedId ? elements[selectedId] : null
    if (!selectedEl || !selectedEl.connector) return
    const kind = selectedEl.connector.kind
    upsertElement({
      ...selectedEl,
      role: 'connector',
      connector: {
        kind,
        pin,
        connectorId: `connector${pin - 1}`,
        svgId: kind === 'through-hole' ? `connector${pin - 1}pin` : `connector${pin - 1}pad`,
      },
    })
    commitHistory()
  }

  const handleUpdateConnectorKind = (kind: 'through-hole' | 'smd') => {
    const selectedId = selectedElementIds[0]
    const selectedEl = selectedId ? elements[selectedId] : null
    if (!selectedEl) return
    const pin = selectedEl.connector?.pin ?? getNextPin()
    upsertElement({
      ...selectedEl,
      role: 'connector',
      pcbLayer: kind === 'through-hole' ? 'copper0' : (selectedEl.pcbLayer === 'silkscreen' ? 'copper1' : selectedEl.pcbLayer),
      connector: {
        kind,
        pin,
        connectorId: `connector${pin - 1}`,
        svgId: kind === 'through-hole' ? `connector${pin - 1}pin` : `connector${pin - 1}pad`,
      },
    })
    commitHistory()
  }

  const handleRemoveTag = () => {
    const selectedId = selectedElementIds[0]
    const selectedEl = selectedId ? elements[selectedId] : null
    if (!selectedEl) return
    const { connector, ...rest } = selectedEl
    // remove the connector from the element
    if (!connector) return
    upsertElement({
      ...rest,
      role: selectedEl.pcbLayer === 'silkscreen' ? 'silkscreen' : 'unassigned',
    })
    commitHistory()
  }

  const elementList = Object.values(elements)

  const copperLayers = getCopperLayers(layerCount)
  const silkscreen = elementList.filter((el) => el.pcbLayer === 'silkscreen')
  const other = elementList.filter(
    (el) =>
      !copperLayers.includes(el.pcbLayer) &&
      el.pcbLayer !== 'silkscreen'
  )

  const getShapeIcon = (type: string) => {
    switch (type) {
      case 'circle':
        return <Circle className="element-type-icon text-amber-500" size={13} />
      case 'rect':
        return <Square className="element-type-icon text-cyan-400" size={13} />
      case 'polygon':
        return <Hexagon className="element-type-icon text-indigo-400" size={13} />
      default:
        return <Minus className="element-type-icon text-emerald-400" size={13} />
    }
  }

  // HTML5 Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, targetLayer: string) => {
    e.preventDefault()
    const id = e.dataTransfer.getData('text/plain')
    if (!id) return

    const el = elements[id]
    if (el && el.pcbLayer !== targetLayer) {
      upsertElement({
        ...el,
        pcbLayer: targetLayer,
      })
      commitHistory()
    }
  }

  const renderElementRow = (el: ElementState) => {
    const isSelected = selectedElementIds.includes(el.id)
    const isHidden = hiddenElementIds.includes(el.id)
    const isHovered = hoveredElementId === el.id

    const displayName = el.name || (el.connector ? `${el.connector.connectorId} (Pin ${el.connector.pin})` : el.id)

    return (
      <div key={el.id} className="sidebar-element-row-container">
        <div
          className={`sidebar-element-row ${isSelected ? 'selected' : ''} ${isHovered ? 'hovered' : ''}`}
          draggable
          onDragStart={(e) => handleDragStart(e, el.id)}
          onMouseEnter={() => setHoveredElementId(el.id)}
          onMouseLeave={() => setHoveredElementId(null)}
          onClick={(e) => {
            e.stopPropagation()
            selectElement(el.id)
          }}
        >
          <span className="element-info">
            {getShapeIcon(el.type)}
            {editingElementId === el.id ? (
              <input
                type="text"
                className="inline-rename-input"
                value={editNameValue}
                onChange={(e) => setEditNameValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    renameElement(el.id, editNameValue.trim())
                    setEditingElementId(null)
                  } else if (e.key === 'Escape') {
                    setEditingElementId(null)
                  }
                }}
                onBlur={() => {
                  renameElement(el.id, editNameValue.trim())
                  setEditingElementId(null)
                }}
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span
                className="element-name"
                title="Double click to rename"
                onDoubleClick={(e) => {
                  e.stopPropagation()
                  setEditingElementId(el.id)
                  setEditNameValue(el.name || el.id)
                }}
              >
                {displayName}
              </span>
            )}
          </span>

          <div className="element-actions" onClick={(e) => e.stopPropagation()}>
            {!el.connector && el.role !== 'silkscreen' && (
              <button
                className="action-btn tag-btn"
                onClick={() => {
                  selectElement(el.id)
                  const pin = getNextPin()
                  const kind = el.pcbLayer === 'copper0' ? 'through-hole' : 'smd'
                  upsertElement({
                    ...el,
                    role: 'connector',
                    connector: {
                      kind,
                      pin,
                      connectorId: `connector${pin - 1}`,
                      svgId: kind === 'through-hole' ? `connector${pin - 1}pin` : `connector${pin - 1}pad`,
                    },
                  })
                  commitHistory()
                }}
                title="Tag as connector"
                aria-label="Tag as connector"
              >
                <Tag size={13} />
              </button>
            )}
            <button
              className={`action-btn visibility-btn ${isHidden ? 'hidden-item' : ''}`}
              onClick={() => toggleElementVisibility(el.id)}
              title={isHidden ? 'Show item' : 'Hide item'}
              aria-label={isHidden ? 'Show item' : 'Hide item'}
            >
              {isHidden ? <EyeOff size={13} /> : <Eye size={13} />}
            </button>
            <button
              className="action-btn delete-btn"
              onClick={() => deleteElement(el.id)}
              title="Delete item"
              aria-label="Delete item"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`layers-sidebar-wrapper ${isOpen ? 'open' : 'collapsed'}`}>
      {/* Sleek collapse toggle handle */}
      <button
        className="sidebar-toggle-handle"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? 'Collapse Layers Sidebar' : 'Expand Layers Sidebar'}
        title={isOpen ? 'Collapse Sidebar' : 'Expand Sidebar'}
      >
        {isOpen ? <ChevronLeft size={16} /> : <Layers size={16} />}
      </button>

      {isOpen && (
        <div className="layers-sidebar-content">
          <div className="sidebar-header">
            <Layers size={16} className="text-amber-500" />
            <h2 className="sidebar-title">Layers & Items</h2>
          </div>

          {/* Premium Layer Config Dashboard */}
          <div className="px-3 pb-3 border-b border-white/5 flex flex-col gap-2.5 text-[11px] bg-slate-900/40">
            {/* Pair-wise Layer Count Controller */}
            <div className="flex flex-col gap-1">
              <span className="text-slate-400 font-medium flex items-center gap-1">
                <Layers size={10} className="text-amber-500" />
                Board Copper Layers
              </span>
              <div className="grid grid-cols-3 gap-1 bg-slate-950/65 p-0.5 rounded-md border border-white/5">
                {[2, 4, 6].map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => setLayerCount(count)}
                    className={`py-1 rounded text-center font-semibold transition-all flex items-center justify-center gap-1.5 ${
                      layerCount === count
                        ? 'bg-amber-500 text-slate-950 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                    }`}
                  >
                    <Layers size={10} />
                    <span>{count} Layers</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Active Drawing Layer Selector */}
            <div className="flex flex-col gap-1">
              <span className="text-slate-400 font-medium">Active Drawing Layer</span>
              <div className="flex flex-wrap gap-1">
                {copperLayers.map((layerId) => {
                  
                  let btnClass = 'border-white/5 bg-slate-950/20 text-slate-400 hover:border-slate-750'
                  let dotColor = '#da8a3a' // copper1

                  if (layerId === 'copper1') {
                   
                    if (activeLayer === 'copper1') btnClass = 'bg-orange-500/20 border-orange-500 text-orange-400'
                  } else if (layerId === 'copper0') {
                   
                    dotColor = '#8f3d03'
                    if (activeLayer === 'copper0') btnClass = 'bg-amber-800/20 border-amber-700 text-amber-400'
                  } else {
                    const match = layerId.match(/^copper(\d+)$/)
                    const num = match ? parseInt(match[1], 10) : 0
                   
                    
                    const hues = [280, 320, 210, 150, 45, 100, 180, 250, 300, 350]
                    const hue = hues[(num - 2) % hues.length]
                    dotColor = `hsl(${hue}, 85%, 65%)`

                    const isOddInner = num % 2 === 0
                    if (activeLayer === layerId) {
                      btnClass = isOddInner
                        ? 'bg-purple-500/20 border-purple-500 text-purple-400'
                        : 'bg-pink-500/20 border-pink-500 text-pink-400'
                    }
                  }

                  const renderCopperLabel = () => {
                    if (layerId === 'copper1') {
                      return 'Top (copper1)'
                    }
                    if (layerId === 'copper0') {
                      return 'Bottom (copper0)'
                    }
                    const match = layerId.match(/^copper(\d+)$/)
                    const num = match ? parseInt(match[1], 10) : 0
                    return `Inner ${num - 1} (${layerId})`
                  }

                  return (
                    <button
                      key={layerId}
                      type="button"
                      onClick={() => setActiveLayer(layerId)}
                      className={`px-2 py-1 rounded border text-[10px] font-semibold transition-all flex items-center gap-1.5 ${btnClass}`}
                    >
                      <span className="w-2 h-2 rounded-full inline-block border border-white/10" style={{ backgroundColor: dotColor }} />
                      {renderCopperLabel()}
                    </button>
                  )
                })}

                {/* Silkscreen */}
                <button
                  type="button"
                  onClick={() => setActiveLayer('silkscreen')}
                  className={`px-2 py-1 rounded border text-[10px] font-semibold transition-all flex items-center gap-1.5 ${
                    activeLayer === 'silkscreen'
                      ? 'bg-white/20 border-white text-white'
                      : 'border-white/5 bg-slate-950/20 text-slate-400 hover:border-slate-750'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full inline-block bg-white border border-white/10" />
                  Silkscreen
                </button>
              </div>
            </div>
          </div>

          <div className="sidebar-sections-scroller">
            {/* Copper Layers Sections (Dynamic) */}
            {copperLayers.map((layerId) => {
              const layerEls = elementList.filter((el) => el.pcbLayer === layerId)
              
              let label = layerId
              let headerClass = 'copper-header font-semibold text-slate-200 border-b border-white/5 pb-1 mb-1'
              let emptyPlaceholder = `No items on ${layerId}`
              
              if (layerId === 'copper1') {
                label = 'Top Copper (copper1)'
                headerClass = 'copper1-header'
                emptyPlaceholder = 'No top copper items'
              } else if (layerId === 'copper0') {
                label = 'Bottom Copper (copper0)'
                headerClass = 'copper0-header'
                emptyPlaceholder = 'No bottom copper items'
              } else {
                const match = layerId.match(/^copper(\d+)$/)
                const num = match ? parseInt(match[1], 10) : 0
                label = `Inner Copper ${num - 1} (${layerId})`
                
                const isOddInner = num % 2 === 0
                headerClass = isOddInner
                  ? 'copper-inner-odd flex justify-between items-center text-purple-400 font-semibold border-b border-purple-500/20 pb-1 mb-1'
                  : 'copper-inner-even flex justify-between items-center text-pink-400 font-semibold border-b border-pink-500/20 pb-1 mb-1'
                
                emptyPlaceholder = `No inner ${num - 1} copper items`
              }

              const renderLayerSection = () => {
                return (
                  <>
                  <div className={`section-title ${headerClass}`}>
                    <span>{label}</span>
                    <span className="section-count">{layerEls.length}</span>
                  </div>
                  <div className="section-items">
                    {layerEls.length === 0 ? (
                      <div className="empty-section-placeholder">{emptyPlaceholder}</div>
                    ) : (
                      layerEls.map(renderElementRow)
                    )}
                  </div>
                  </>
                )
              }

              return (
                <div
                  key={layerId}
                  className={`sidebar-section ${dragOverLayer === layerId ? 'drag-over' : ''}`}
                  onDragOver={handleDragOver}
                  onDragEnter={() => setDragOverLayer(layerId)}
                  onDragLeave={() => setDragOverLayer(null)}
                  onDrop={(e) => {
                    handleDrop(e, layerId)
                    setDragOverLayer(null)
                  }}
                >
                  {renderLayerSection()}
                </div>
              )
            })}

            {/* Silkscreen Layer Section */}
            <div
              className={`sidebar-section ${dragOverLayer === 'silkscreen' ? 'drag-over' : ''}`}
              onDragOver={handleDragOver}
              onDragEnter={() => setDragOverLayer('silkscreen')}
              onDragLeave={() => setDragOverLayer(null)}
              onDrop={(e) => {
                handleDrop(e, 'silkscreen')
                setDragOverLayer(null)
              }}
            >
              <div className="section-title silkscreen-header">
                <span>Silkscreen (silkscreen)</span>
                <span className="section-count">{silkscreen.length}</span>
              </div>
              <div className="section-items">
                {silkscreen.length === 0 ? (
                  <div className="empty-section-placeholder">No silkscreen items</div>
                ) : (
                  silkscreen.map(renderElementRow)
                )}
              </div>
            </div>

            {/* Other / Unassigned Layer Section */}
            {other.length > 0 && (
              <div className="sidebar-section">
                <div className="section-title other-header">
                  <span>Other Elements</span>
                  <span className="section-count">{other.length}</span>
                </div>
                <div className="section-items">
                  {other.map(renderElementRow)}
                </div>
              </div>
            )}
          </div>

          {/* Selected Item Properties Panel */}
          {(() => {
            const selectedId = selectedElementIds[0]
            const selectedEl = selectedId ? elements[selectedId] : null
            if (!selectedEl) return null

            const isConnector = !!selectedEl.connector
            const pinVal = selectedEl.connector?.pin ?? 1
            const kindVal = selectedEl.connector?.kind ?? 'through-hole'

            return (
              <div className="sidebar-properties-card bg-slate-900/80 border-t border-white/10 p-3 flex flex-col gap-2.5">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-300 pb-1.5 border-b border-white/5">
                  <div className="flex items-center gap-1.5">
                    {getShapeIcon(selectedEl.type)}
                    <span className="uppercase tracking-wider text-[10px] text-slate-400 font-bold">Item Properties</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => selectElement('')}
                    className="text-slate-500 hover:text-slate-300 text-[10px] cursor-pointer"
                  >
                    Clear
                  </button>
                </div>

                {/* Name Editing Row */}
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-slate-400 font-medium">Element Name</span>
                  <input
                    type="text"
                    className="px-2 py-1 text-xs bg-slate-950 border border-white/10 rounded-md text-slate-200 focus:outline-none focus:border-amber-500 transition-colors"
                    value={selectedEl.name || ''}
                    placeholder={selectedEl.id}
                    onChange={(e) => renameElement(selectedEl.id, e.target.value)}
                  />
                </div>

                {/* Layer indicator */}
                <div className="flex justify-between items-center text-[10px] text-slate-400 px-0.5">
                  <span>Layer:</span>
                  <span className="font-semibold text-slate-200 capitalize">{selectedEl.pcbLayer}</span>
                </div>

                {/* Connector/Pin editing */}
                {isConnector ? (
                  <div className="flex flex-col gap-2 bg-slate-950/40 p-2 rounded-lg border border-white/5 mt-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                        <Tag size={10} className="text-amber-500" />
                        CONNECTOR PIN
                      </span>
                      <button
                        type="button"
                        onClick={handleRemoveTag}
                        className="text-red-400/80 hover:text-red-500 text-[10px] font-semibold transition-colors flex items-center gap-0.5 cursor-pointer"
                        title="Remove connector tagging"
                      >
                        <Trash2 size={10} />
                        Untag
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex flex-col gap-0.5 flex-1">
                        <span className="text-[9px] text-slate-500">Pin Number</span>
                        <input
                          type="number"
                          min="1"
                          step="1"
                          className="w-full px-2 py-1 text-xs bg-slate-950 border border-white/10 rounded-md text-slate-200 focus:outline-none focus:border-amber-500"
                          value={pinVal}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10)
                            if (Number.isFinite(val) && val > 0) {
                              handleUpdatePin(val)
                            }
                          }}
                        />
                      </div>

                      <div className="flex flex-col gap-0.5 flex-1">
                        <span className="text-[9px] text-slate-500">Connection Kind</span>
                        <div className="flex bg-slate-950 p-0.5 rounded-md border border-white/10">
                          <button
                            type="button"
                            onClick={() => handleUpdateConnectorKind('through-hole')}
                            className={`flex-1 flex items-center justify-center gap-1 py-1 rounded text-[9px] font-bold transition-all ${
                              kindVal === 'through-hole'
                                ? 'bg-amber-500 text-slate-950 shadow-sm'
                                : 'text-slate-400 hover:text-slate-200'
                            }`}
                            title="Through-Hole: drills through all layers"
                          >
                            <Circle size={8} className={kindVal === 'through-hole' ? 'fill-slate-950' : ''} />
                            THT
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateConnectorKind('smd')}
                            className={`flex-1 flex items-center justify-center gap-1 py-1 rounded text-[9px] font-bold transition-all ${
                              kindVal === 'smd'
                                ? 'bg-cyan-500 text-slate-950 shadow-sm'
                                : 'text-slate-400 hover:text-slate-200'
                            }`}
                            title="Surface Mount: sits on a single layer"
                          >
                            <Square size={8} className={kindVal === 'smd' ? 'fill-slate-950' : ''} />
                            SMD
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  selectedEl.role !== 'silkscreen' && (
                    <button
                      type="button"
                      onClick={() => handleUpdateConnectorKind('through-hole')}
                      className="mt-1 w-full py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <Tag size={12} />
                      Tag as PCB Connector Pin
                    </button>
                  )
                )}
              </div>
            )
          })()}
        </div>
      )}
    </div>
  )
}
