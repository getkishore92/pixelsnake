# pixelsnake

A playable GitHub contribution graph widget you can embed on any website. Self-hosted, no autoplay, no GIFs — just a real snake game on real commit history.

## Deploy your own

Each person hosts their own instance. No shared rate limits, no dependency on anyone else's uptime.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/pixelsnake&project-name=pixelsnake&repository-name=pixelsnake&env=DEMO_GITHUB_USER&envDescription=GitHub%20username%20shown%20on%20the%20landing%20page%20demo)

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/yourusername/pixelsnake)

Or run locally:

```bash
git clone https://github.com/yourusername/pixelsnake
cd pixelsnake
npm install
npm run dev
```

## Embed

Once deployed, drop this into any webpage:

```html
<iframe
  src="https://your-deployment.vercel.app/embed?user=yourusername"
  width="100%"
  height="200"
  frameborder="0"
  scrolling="no"
  title="GitHub contribution snake"
></iframe>
```

### Parameters

| Parameter | Values | Description |
|-----------|--------|-------------|
| `user` | any GitHub username | Required — whose contributions to load |
| `theme` | `light` · `dark` | Force a color theme (default: system) |

## How to play

Click any cell on the contribution grid to start. Arrow keys or WASD to steer. ESC to pause.

## Environment variables

| Variable | Description |
|----------|-------------|
| `DEMO_GITHUB_USER` | GitHub username for the landing page demo (default: `torvalds`) |

## Tech

Next.js · React · TypeScript · Tailwind CSS v4
