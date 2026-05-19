import { FileControls } from '../file-io/FileControls'
import { useProjectFileActions } from '../file-io/useProjectFileActions'

export const AppHeader = () => {
  const { handleSvgUpload, handleFritzingUpload, handleExportFritzing, handleExportDraft, handleImportDraft, handleExportGerbers } =
    useProjectFileActions()

  return (
    <header className="app-header flex">
      <div className="flex flex-col">
        <h1>MOB-GERB</h1>
        <p>Mobile-first, Fritzing-compatible PCB editor foundation.</p>
      </div>
      <FileControls
        onSvgUpload={handleSvgUpload}
        onFritzingUpload={handleFritzingUpload}
        onExportFritzing={handleExportFritzing}
        onExportDraft={handleExportDraft}
        onImportDraft={handleImportDraft}
        onExportGerbers={handleExportGerbers}
      />
    </header>
  )
}
