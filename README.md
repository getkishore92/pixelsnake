# pixelsnake

A playable GitHub contribution graph widget. Clone it, deploy it, embed it on any website with a single `<iframe>`. No autoplay, no GIFs — a real snake game on your real commit history.

## Quick start

```bash
git clone https://github.com/yourusername/pixelsnake
cd pixelsnake
npm install
cp .env.example .env.local   # set DEMO_GITHUB_USER
npm run dev
```

Then open `http://localhost:3000/?user=yourusername`.

## Deploy

Each person hosts their own instance — no shared rate limits, no dependency on anyone else's uptime.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/pixelsnake&project-name=pixelsnake&repository-name=pixelsnake&env=DEMO_GITHUB_USER&envDescription=GitHub%20username%20shown%20when%20no%20user%20param%20is%20provided)

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/yourusername/pixelsnake)

## Embed

Once deployed, drop this into any webpage:

```html
<iframe
  src="https://your-deployment.vercel.app/?user=yourusername"
  width="100%"
  height="200"
  frameborder="0"
  scrolling="no"
  title="GitHub contribution snake"
></iframe>
```

### URL parameters

| Parameter | Values | Description |
|-----------|--------|-------------|
| `user` | any GitHub username | Whose contributions to load — falls back to `DEMO_GITHUB_USER` if omitted |
| `theme` | `light` · `dark` | Force a color theme — defaults to the visitor's system preference |

## How to play

Click any cell on the contribution grid to start. Arrow keys or WASD to steer. ESC to pause.

## Customization

Everything is meant to be changed in code.

### Speed

Open [`src/components/contribution-snake.tsx`](src/components/contribution-snake.tsx) and edit the constant at the top:

```ts
const TICK_MS = 120; // lower = faster
```

### Colors

All colors are CSS custom properties in [`src/app/globals.css`](src/app/globals.css). The `:root` block controls the light theme, `[data-theme="dark"]` controls the dark theme.

Key variables:

| Variable | What it controls |
|----------|-----------------|
| `--color-contrib-0` → `--color-contrib-5` | Contribution cell shades (inactive state) |
| `--color-contrib-active-0` → `--color-contrib-active-5` | Contribution cell shades (while playing) |
| `--color-snake` | Snake body color |
| `--color-snake-food` | Food cell color |
| `--color-snake-active` | Snake body color while in active/playing state |
| `--color-snake-food-active` | Food color while in active/playing state |
| `--color-danger-wave` | Cell color during the game-over wave animation |
| `--color-danger-text` | "Game over" text color |

### Cell size

Cell size is calculated automatically to fill the available width. To force a fixed size, override the CSS variable in `globals.css`:

```css
.contribution-map {
  --contribution-cell-size: 12px; /* override auto-sizing */
}
```

### Environment variables

| Variable | Description |
|----------|-------------|
| `DEMO_GITHUB_USER` | GitHub username to show when the widget is visited without a `?user=` param |

## Tech

Next.js · React · TypeScript · Tailwind CSS v4
