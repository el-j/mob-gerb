import type { ChangeEventHandler } from 'react'

type FileControlsProps = {
  onSvgUpload: ChangeEventHandler<HTMLInputElement>
  onFritzingUpload: ChangeEventHandler<HTMLInputElement>
  onExportFritzing: () => void
}

export const FileControls = ({ onSvgUpload, onFritzingUpload, onExportFritzing }: FileControlsProps) => {
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
      <button className="ui-btn" type="button" onClick={onExportFritzing}>
        FZPZ
      </button>
    </div>
  )
}
