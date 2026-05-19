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
} from 'lucide-react'
import { useEditorStore } from '../../store/editorStore'
import type { ElementState } from '../../core/types/pcb'

export const LayersSidebar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [dragOverLayer, setDragOverLayer] = useState<string | null>(null)

  const elements = useEditorStore((state) => state.project.elements)
  const selectedElementIds = useEditorStore((state) => state.selectedElementIds)
  const hiddenElementIds = useEditorStore((state) => state.hiddenElementIds)
  const hoveredElementId = useEditorStore((state) => state.hoveredElementId)

  const selectElement = useEditorStore((state) => state.selectElement)
  const toggleElementVisibility = useEditorStore((state) => state.toggleElementVisibility)
  const deleteElement = useEditorStore((state) => state.deleteElement)
  const setHoveredElementId = useEditorStore((state) => state.setHoveredElementId)
  const upsertElement = useEditorStore((state) => state.upsertElement)
  const commitHistory = useEditorStore((state) => state.commitHistory)

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

    return (
      <div
        key={el.id}
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
          <span className="element-name" title={el.id}>
            {el.connector?.connectorId !== undefined ? `Pin ${el.connector.connectorId}` : el.id}
          </span>
        </span>

        <div className="element-actions" onClick={(e) => e.stopPropagation()}>
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
