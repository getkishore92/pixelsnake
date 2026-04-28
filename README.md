# pixelsnake

<p align="center">
  <img src="thumbnail.png" alt="pixelsnake screenshot" width="640" />
</p>

A playable snake game built on your GitHub contribution graph. Click any cell to start, steer with arrow keys or WASD, and ship a weirdly delightful footer widget without an iframe.

**[Live demo →](https://kishore.design)** (scroll to the footer)

---

## What this repo is

This repo is structured in two layers:

- `src/widget/` is the reusable part you can copy into your own project.
- `src/app/` is a tiny demo app that consumes the widget like a normal user would.

The goal is not “install a package from npm” yet. The goal is “copy one folder into your site and have it work.”

---

## Quick start for a Next.js app

### 1. Copy the widget folder

Copy the entire `src/widget/` folder into your project.

It contains:

- `ContributionSnake.tsx`
- `ContributionSnake.module.css`
- `github-contributions.ts`
- `types.ts`
- `index.ts`

No global CSS merge is required. No font setup is required. No Tailwind tokens are required.

### 2. Render it in a Server Component

```tsx
import { ContributionSnake, getGithubContributions } from "@/widget";

export default async function Page() {
  const data = await getGithubContributions("yourusername");

  return <ContributionSnake data={data} />;
}
```

If your app does not use the `@/` alias, switch that import to the relative path where you copied the folder.

### 3. Done

The component imports its own CSS Module, so the widget styling comes along with the component automatically.

---

## Public API

### `ContributionSnake`

```tsx
type ContributionSnakeProps = {
  data: ContributionCalendarData;
  className?: string;
  tickMs?: number;
  showHeader?: boolean;
  title?: string;
};
```

Notes:

- `data` is required.
- `tickMs` controls snake speed. Lower is faster. Default is `120`.
- `showHeader={false}` hides the built-in contribution header if you want to wrap it in your own card.
- `title` lets you override the default heading text.

### `getGithubContributions(username)`

This helper fetches GitHub contribution HTML on the server, parses it, and returns the widget data shape.

It is useful for Next.js server rendering, but it is optional. If you already have contribution data, you can skip the helper and pass `data` directly to the component.

---

## How to play

| Control | Action |
|---------|--------|
| `↑ ↓ ← →` or `W A S D` | Steer |
| `ESC` | Pause |
| Click any cell | Start / restart |
| Swipe | Steer on mobile |

---

## Customization

### Speed

```tsx
<ContributionSnake data={data} tickMs={95} />
```

### Hide the built-in header

```tsx
<ContributionSnake data={data} showHeader={false} />
```

### Override the title

```tsx
<ContributionSnake data={data} title="Play my GitHub year" />
```

### Theme

The widget has its own default colors and supports light/dark mode automatically.

You can also force theme from your page shell with:

```html
<html data-theme="dark">
```

or:

```html
<html data-theme="light">
```

### Styling

The widget is intentionally self-contained inside `ContributionSnake.module.css`.

If you want to restyle it:

- tweak the CSS custom properties near the top of `ContributionSnake.module.css`
- or wrap the component with your own container and use `className`

---

## Non-Next usage

The `ContributionSnake` component itself is plain React plus a CSS Module.

The only Next-specific piece is `getGithubContributions`, because it uses Next server `fetch` caching semantics. If you are not using Next.js:

- keep `ContributionSnake.tsx`
- keep `ContributionSnake.module.css`
- keep `types.ts`
- provide your own `ContributionCalendarData`

---

## Caveats

- The default GitHub helper scrapes GitHub’s contribution HTML, so it may need updates if GitHub changes that markup.
- The widget is desktop-first. Mobile is supported, but the interaction is still best on desktop.
- Audio is generated with the Web Audio API and unlocks on first interaction.

---

## Repo structure

```txt
src/
  app/        # demo app
  widget/     # cloneable widget files
```

---

## Tech

React · Next.js · TypeScript · CSS Modules
