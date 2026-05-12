# pixelsnake

<p align="center">
  <img src="thumbnail.png" alt="pixelsnake screenshot" width="640" />
</p>

A React widget that turns a GitHub contribution graph into a desktop snake game. On mobile, it trims the graph to recent weeks and works as a compact activity widget.

**[Live demo](https://kishore.design/playground/pixelsnake)**

---

## What you get

Pixelsnake ships the reusable widget from `src/widget/`. The demo app in `src/app/` only exists to run and test the widget.

The widget handles:

- GitHub contribution data rendering
- desktop snake controls with WASD and arrow keys
- start, pause, resume, and game-over overlays
- compact mode without month and weekday labels
- mobile recent-activity layout with no game controls
- light and dark theme defaults through CSS custom properties

---

## Install from GitHub

```bash
npm install github:getkishore92/pixelsnake#main
```

If your Next.js app imports packages from source, add Pixelsnake to `transpilePackages`.

```ts
// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["pixelsnake"],
};

export default nextConfig;
```

---

## Render the widget

Fetch contribution data on the server, then pass it to the widget.

```tsx
import { ContributionSnake, getGithubContributions } from "pixelsnake";

export default async function Page() {
  const data = await getGithubContributions("yourusername");

  return <ContributionSnake data={data} />;
}
```

The widget imports its own CSS module. You do not need an iframe or a global CSS merge.

---

## Footer mode

Use `showCalendarLabels={false}` when the widget sits in a tight footer or sidebar.

```tsx
<ContributionSnake
  data={data}
  showCalendarLabels={false}
/>
```

This keeps the pixel grid and removes the month and weekday labels.

---

## Track game state

`onGameStateChange` lets a wrapper react to the game state. In Next.js, put that wrapper in a Client Component because function props cannot cross a Server Component boundary.

```tsx
"use client";

import { useState } from "react";
import { ContributionSnake, type ContributionSnakeGameState } from "pixelsnake";
import type { ContributionCalendarData } from "pixelsnake";

export function PixelsnakeFooter({ data }: { data: ContributionCalendarData }) {
  const [state, setState] = useState<ContributionSnakeGameState>("idle");
  const hasStarted = state === "playing" || state === "paused" || state === "failed";

  return (
    <>
      <ContributionSnake
        data={data}
        showCalendarLabels={false}
        onGameStateChange={setState}
      />
      <p>{hasStarted ? "pixelsnake widget by kishore" : "click any pixel to start the game"}</p>
    </>
  );
}
```

---

## Public API

### `ContributionSnake`

```tsx
type ContributionSnakeProps = {
  data: ContributionCalendarData;
  className?: string;
  tickMs?: number;
  showHeader?: boolean;
  showCalendarLabels?: boolean;
  title?: string;
  scoreStore?: ContributionSnakeScoreStore;
  onGameStateChange?: (state: ContributionSnakeGameState) => void;
};

type ContributionSnakeGameState =
  | "idle"
  | "countdown"
  | "playing"
  | "paused"
  | "failed";

type ContributionSnakeScoreStore = {
  loadTopScore?: () => number | null | undefined | Promise<number | null | undefined>;
  saveTopScore?: (score: number) => number | null | undefined | void | Promise<number | null | undefined | void>;
};
```

| Prop | Default | Notes |
| --- | --- | --- |
| `data` | required | Contribution data for the grid |
| `className` | none | Adds a class to the widget root |
| `tickMs` | `120` | Snake speed in milliseconds per tick |
| `showHeader` | `true` | Hides the built-in contribution title and score row when false |
| `showCalendarLabels` | `true` | Hides month and weekday labels when false |
| `title` | auto | Overrides the built-in heading |
| `scoreStore` | localStorage | Loads and saves top score through your own app |
| `onGameStateChange` | none | Reports `idle`, `countdown`, `playing`, `paused`, and `failed` |

### External top score

By default, Pixelsnake stores the top score in `localStorage`. Pass `scoreStore` when your app owns the score.

```tsx
const scoreStore = {
  async loadTopScore() {
    const response = await fetch("/api/snake-top-score", { cache: "no-store" });
    const payload = (await response.json()) as { topScore?: number };
    return payload.topScore ?? 0;
  },
  async saveTopScore(score: number) {
    const response = await fetch("/api/snake-top-score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ score }),
    });
    const payload = (await response.json()) as { topScore?: number };
    return payload.topScore;
  },
};
```

### `getGithubContributions(username)`

This helper fetches GitHub contribution HTML on the server, parses it, and returns `ContributionCalendarData`.

If you already have contribution data, pass your own data object to `ContributionSnake` and skip the helper.

---

## Controls

Desktop:

| Control | Action |
| --- | --- |
| Click a pixel | Start or restart |
| `W A S D` or arrow keys | Steer |
| `Escape` | Pause |
| Click outside the board | Pause |
| Click the board while paused | Resume |

Mobile:

The widget shows recent activity only. It disables game input and removes horizontal scrolling.

---

## Styling

Pixelsnake uses `ContributionSnake.module.css`. You can wrap the component with your own container through `className`, or edit the CSS custom properties near the top of the module.

The widget follows the page theme when your app sets:

```html
<html data-theme="dark">
```

or:

```html
<html data-theme="light">
```

---

## Repo structure

```txt
src/
  app/        # demo app
  widget/     # reusable widget package
```

---

## Caveats

- The GitHub helper parses GitHub contribution HTML. If GitHub changes that markup, the helper may need an update.
- The game targets desktop. Mobile keeps the graph readable and recent instead of exposing game controls.
- Audio uses the Web Audio API and starts after the first user interaction.

---

## Tech

React, Next.js, TypeScript, CSS Modules
