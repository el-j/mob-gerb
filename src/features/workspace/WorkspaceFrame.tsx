import { PcbCanvas } from '../../components/Canvas/PcbCanvas'
import { ZoomGridControls } from './ZoomGridControls'

export const WorkspaceFrame = () => {
  return (
    <section className="workspace-frame" aria-label="Workspace">
      <ZoomGridControls />
      <PcbCanvas />
    </section>
  )
}
