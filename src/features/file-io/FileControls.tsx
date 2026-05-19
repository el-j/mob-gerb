import type { ChangeEventHandler } from 'react'

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
      <label className="file-upload-btn ui-btn">
        SVG
        <input type="file" accept=".svg" onChange={onSvgUpload} style={{ display: 'none' }} />
      </label>
      <label className="file-upload-btn ui-btn">
        FZPZ
        <input type="file" accept=".fzpz,.fzz" onChange={onFritzingUpload} style={{ display: 'none' }} />
      </label>
      <button className="ui-btn" type="button" onClick={onExportFritzing} data-testid="export-fzpz-btn">
        FZPZ
      </button>
      <label className="file-upload-btn ui-btn" title="Import draft (.pcb-draft.json)">
        Draft
        <input type="file" accept=".json" onChange={onImportDraft} style={{ display: 'none' }} />
      </label>
      <button className="ui-btn" type="button" onClick={onExportDraft} title="Export draft (.pcb-draft.json)" data-testid="export-draft-btn">
        💾
      </button>
        <button className="ui-btn" type="button" onClick={onExportGerbers} title="Export Gerbers (.zip)" data-testid="export-gerbers-btn">
          Gerbers
        </button>
    </div>
  )
}
