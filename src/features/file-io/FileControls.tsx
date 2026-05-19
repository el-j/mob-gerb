import type { ChangeEventHandler } from 'react'
import { FileUp, FileDown, FolderOpen, Save, Archive } from 'lucide-react'

type FileControlsProps = {
  onSvgUpload: ChangeEventHandler<HTMLInputElement>
  onFritzingUpload: ChangeEventHandler<HTMLInputElement>
  onExportFritzing: () => void
  onExportDraft: () => void
  onImportDraft: ChangeEventHandler<HTMLInputElement>
  onExportGerbers: () => void
}

export const FileControls = ({
  onSvgUpload,
  onFritzingUpload,
  onExportFritzing,
  onExportDraft,
  onImportDraft,
  onExportGerbers,
}: FileControlsProps) => {
  return (
    <div className="flex shrink-0 gap-2 justify-center items-center" aria-label="File controls">
      <label className="file-upload-btn ui-btn flex items-center gap-1 cursor-pointer" title="Upload SVG">
        <FileUp size={16} />
        <span className="text-xs font-semibold">SVG</span>
        <input type="file" accept=".svg" onChange={onSvgUpload} style={{ display: 'none' }} />
      </label>
      <label className="file-upload-btn ui-btn flex items-center gap-1 cursor-pointer" title="Import FZPZ Part">
        <FileUp size={16} />
        <span className="text-xs font-semibold">FZPZ</span>
        <input type="file" accept=".fzpz,.fzz" onChange={onFritzingUpload} style={{ display: 'none' }} />
      </label>
      <button className="ui-btn flex items-center gap-1" type="button" onClick={onExportFritzing} data-testid="export-fzpz-btn" title="Export FZPZ">
        <FileDown size={16} />
        <span className="text-xs font-semibold">FZPZ</span>
      </button>
      <label className="file-upload-btn ui-btn flex items-center gap-1 cursor-pointer" title="Import draft (.pcb-draft.json)">
        <FolderOpen size={16} />
        <span className="text-xs font-semibold">Draft</span>
        <input type="file" accept=".json" onChange={onImportDraft} style={{ display: 'none' }} />
      </label>
      <button className="ui-btn flex items-center gap-1" type="button" onClick={onExportDraft} title="Export draft (.pcb-draft.json)" data-testid="export-draft-btn" aria-label="Export Draft">
        <Save size={16} />
      </button>
      <button className="ui-btn flex items-center gap-1" type="button" onClick={onExportGerbers} title="Export Gerbers (.zip)" data-testid="export-gerbers-btn" aria-label="Export Gerbers">
        <Archive size={16} />
        <span className="text-xs font-semibold">Gerbers</span>
      </button>
    </div>
  )
}
