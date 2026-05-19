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
  ChevronRight,
  Sparkles,
  Tag,
} from 'lucide-react'
import { useEditorStore } from '../../store/editorStore'
import type { ElementState } from '../../core/types/pcb'

export const LayersSidebar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [dragOverLayer, setDragOverLayer] = useState<string | null>(null)

  const [editingElementId, setEditingElementId] = useState<string | null>(null)
  const [editNameValue, setEditNameValue] = useState<string>('')

  const [taggingElementId, setTaggingElementId] = useState<string | null>(null)
  const [tagPinInput, setTagPinInput] = useState<string>('1')
  const [tagKind, setTagKind] = useState<'through-hole' | 'smd'>('through-hole')

  const elements = useEditorStore((state) => state.project.elements)
  const selectedElementIds = useEditorStore((state) => state.selectedElementIds)
  const hiddenElementIds = useEditorStore((state) => state.hiddenElementIds)
  const hoveredElementId = useEditorStore((state) => state.hoveredElementId)

  const selectElement = useEditorStore((state) => state.selectElement)
  const toggleElementVisibility = useEditorStore((state) => state.toggleElementVisibility)
  const deleteElement = useEditorStore((state) => state.deleteElement)
  const renameElement = useEditorStore((state) => state.renameElement)
  const setHoveredElementId = useEditorStore((state) => state.setHoveredElementId)
  const upsertElement = useEditorStore((state) => state.upsertElement)
  const commitHistory = useEditorStore((state) => state.commitHistory)

  const getNextPin = () => {
    const pins = Object.values(elements)
      .map((e) => e.connector?.pin)
      .filter((p): p is number => p !== undefined)
    return pins.length > 0 ? Math.max(...pins) + 1 : 1
  }

  const elementList = Object.values(elements)

  // Categorize elements
  const copper1 = elementList.filter((el) => el.pcbLayer === 'copper1')
  const copper0 = elementList.filter((el) => el.pcbLayer === 'copper0')
  const silkscreen = elementList.filter((el) => el.pcbLayer === 'silkscreen')
  const other = elementList.filter(
    (el) => el.pcbLayer !== 'copper1' && el.pcbLayer !== 'copper0' && el.pcbLayer !== 'silkscreen'
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

  const handleDrop = (e: React.DragEvent, targetLayer: 'copper1' | 'copper0' | 'silkscreen') => {
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
                className={`action-btn tag-btn ${taggingElementId === el.id ? 'active-tagging' : ''}`}
                onClick={() => {
                  if (taggingElementId === el.id) {
                    setTaggingElementId(null)
                  } else {
                    setTaggingElementId(el.id)
                    setTagPinInput(String(getNextPin()))
                    setTagKind(el.pcbLayer === 'copper1' ? 'smd' : 'through-hole')
                  }
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

        {taggingElementId === el.id && (
          <div className="sidebar-inline-tagger" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-1.5 p-1.5 bg-[#1b1c21]/90 rounded border border-neutral-700/40 text-xs text-neutral-300">
              <span className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">Pin</span>
              <input
                type="number"
                min="1"
                step="1"
                className="w-10 px-1 text-center bg-neutral-900 border border-neutral-700 rounded text-xs text-neutral-100 focus:outline-none focus:border-amber-500"
                value={tagPinInput}
                onChange={(e) => setTagPinInput(e.target.value)}
              />
              <div className="flex bg-neutral-800 p-0.5 rounded border border-neutral-700/30">
                <button
                  type="button"
                  className={`px-1.5 py-0.5 rounded-sm text-[9px] font-bold transition-all ${
                    tagKind === 'through-hole'
                      ? 'bg-amber-600/90 text-white shadow-sm'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                  onClick={() => setTagKind('through-hole')}
                >
                  THT
                </button>
                <button
                  type="button"
                  className={`px-1.5 py-0.5 rounded-sm text-[9px] font-bold transition-all ${
                    tagKind === 'smd'
                      ? 'bg-cyan-600/90 text-white shadow-sm'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                  onClick={() => setTagKind('smd')}
                >
                  SMD
                </button>
              </div>
              <button
                type="button"
                className="ml-auto bg-emerald-600 hover:bg-emerald-500 text-white px-2 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer"
                onClick={() => {
                  const pin = Number(tagPinInput)
                  if (Number.isFinite(pin) && pin > 0) {
                    upsertElement({
                      ...el,
                      role: 'connector',
                      pcbLayer: tagKind === 'through-hole' ? 'copper0' : 'copper1',
                      connector: {
                        kind: tagKind,
                        pin,
                        connectorId: `connector${pin - 1}`,
                        svgId: tagKind === 'through-hole' ? `connector${pin - 1}pin` : `connector${pin - 1}pad`,
                      },
                    })
                    commitHistory()
                    setTaggingElementId(null)
                  }
                }}
              >
                Apply
              </button>
            </div>
          </div>
        )}
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

          <div className="sidebar-sections-scroller">
            {/* Top Copper Layer Section */}
            <div
              className={`sidebar-section ${dragOverLayer === 'copper1' ? 'drag-over' : ''}`}
              onDragOver={handleDragOver}
              onDragEnter={() => setDragOverLayer('copper1')}
              onDragLeave={() => setDragOverLayer(null)}
              onDrop={(e) => {
                handleDrop(e, 'copper1')
                setDragOverLayer(null)
              }}
            >
              <div className="section-title copper1-header">
                <span>Top Copper (copper1)</span>
                <span className="section-count">{copper1.length}</span>
              </div>
              <div className="section-items">
                {copper1.length === 0 ? (
                  <div className="empty-section-placeholder">No top copper items</div>
                ) : (
                  copper1.map(renderElementRow)
                )}
              </div>
            </div>

            {/* Bottom Copper Layer Section */}
            <div
              className={`sidebar-section ${dragOverLayer === 'copper0' ? 'drag-over' : ''}`}
              onDragOver={handleDragOver}
              onDragEnter={() => setDragOverLayer('copper0')}
              onDragLeave={() => setDragOverLayer(null)}
              onDrop={(e) => {
                handleDrop(e, 'copper0')
                setDragOverLayer(null)
              }}
            >
              <div className="section-title copper0-header">
                <span>Bottom Copper (copper0)</span>
                <span className="section-count">{copper0.length}</span>
              </div>
              <div className="section-items">
                {copper0.length === 0 ? (
                  <div className="empty-section-placeholder">No bottom copper items</div>
                ) : (
                  copper0.map(renderElementRow)
                )}
              </div>
            </div>

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
        </div>
      )}
    </div>
  )
}
