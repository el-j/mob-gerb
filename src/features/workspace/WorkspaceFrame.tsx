import { PcbCanvas } from '../../components/Canvas/PcbCanvas'
import { TscircuitPreviewPanel } from './TscircuitPreviewPanel'
import { ZoomGridControls } from './ZoomGridControls'

export const WorkspaceFrame = () => {
  return (
    <section className="workspace-frame" aria-label="Workspace">
      <ZoomGridControls />
      <TscircuitPreviewPanel />
      <PcbCanvas />
    </section>
  )
}
