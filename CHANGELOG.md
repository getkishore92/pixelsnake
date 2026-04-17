# Changelog

All notable changes to pixelsnake will be documented here.

---

## v0.1.0 — 2026-04-17

Initial release.

### Features
- Playable snake game overlaid on your GitHub contribution graph
- Click any cell to start — snake spawns at that cell
- Arrow keys / WASD to steer, ESC to pause
- Swipe to steer on mobile
- Retro chip audio: eat sound + sad trombone on game over
- Game-over ripple wave animation (respects `prefers-reduced-motion`)
- Score + top score display (top score persisted in `localStorage`)
- Light / dark mode via CSS custom properties and `data-theme` attribute
- Configurable snake speed via `TICK_MS` constant
- Responsive: auto-fits cell size to available width on desktop, horizontal scroll on mobile
- Instant keyboard response — direction input steps the snake immediately and resets the interval timer
- Server-side GitHub contributions data fetch with 1-hour revalidation
- Drop-in React component for existing Next.js projects
