# Phase 2: Mobile-First UI/UX — TODO

## Audit mob-gerb Mobile UI/UX (done)
- [x] Canvas supports pan/zoom with touch and pointer events
- [x] 2-finger pinch/zoom and pan logic in PcbCanvas
- [x] Fat-finger-friendly handles for trace editing (see doc/Mobile UX Strategy.md)
- [x] Floating overlay controls (ZoomGridControls, etc)
- [x] Mobile Playwright e2e coverage (style-regression.spec.ts, part-creator-ux.spec.ts)
- [x] Mobile overlay panels and bottom-sheet controls in part creator mode
- [x] State machine for modes: VIEW, LOGICAL, ROUTING, EDIT_TRACE, PART_CREATOR
- [x] Web worker for autorouting (keeps UI responsive)
- [x] Grid and snapping engine for touch/drag
- [x] Selection box, handles, and overlays are visible and interactive on mobile

## Research Mobile EDA Best Practices (next)
- [ ] Review top mobile EDA tools for layout, controls, gestures
- [ ] Summarize best patterns for toolbars, overlays, and space usage
- [ ] Identify any missing features or pain points in mob-gerb

## Propose and Prototype
- [ ] Propose new mobile-first layouts and interaction patterns
- [ ] Prototype further responsive controls and overlays
- [ ] Test on real devices and emulators

## Integrate tscircuit Viewers
- [ ] Wrap tscircuit React viewers/components with mobile-optimized containers
- [ ] Test tscircuit integration on mobile

## Reporting
- [ ] Document lessons and blockers in LEARNED.md
- [ ] Mark this file and ORCHESTRATOR.md as done when complete
