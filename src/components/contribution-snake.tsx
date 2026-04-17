"use client";

import type { CSSProperties } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ContributionCalendarData } from "@/lib/github-contributions";

// ─── Customization ───────────────────────────────────────────────────────────
// Snake speed in milliseconds per tick. Lower = faster. Default: 120.
const TICK_MS = 120;
// ─────────────────────────────────────────────────────────────────────────────

type Cell = { x: number; y: number };

type ContributionSnakeProps = {
  data: ContributionCalendarData;
};

const DAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""] as const;

function cellKey(cell: Cell) {
  return `${cell.x}-${cell.y}`;
}

function cellsEqual(a: Cell, b: Cell) {
  return a.x === b.x && a.y === b.y;
}

function getWrappedHead(
  head: Cell,
  direction: Cell,
  columns: number,
  rows: number
): Cell {
  return {
    x: (head.x + direction.x + columns) % columns,
    y: (head.y + direction.y + rows) % rows,
  };
}

function getRandomOpenCell(
  columns: number,
  rows: number,
  occupied: Set<string>
) {
  const available: Cell[] = [];
  for (let x = 0; x < columns; x += 1) {
    for (let y = 0; y < rows; y += 1) {
      const candidate = { x, y };
      if (!occupied.has(cellKey(candidate))) available.push(candidate);
    }
  }
  if (available.length === 0) return null;
  return available[Math.floor(Math.random() * available.length)];
}

function GitHubMark() {
  return (
    <svg
      className="contribution-github-mark"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 2C6.477 2 2 6.589 2 12.25c0 4.529 2.865 8.37 6.839 9.727.5.095.683-.223.683-.494 0-.244-.008-.89-.013-1.747-2.782.621-3.369-1.368-3.369-1.368-.455-1.192-1.11-1.51-1.11-1.51-.908-.637.069-.624.069-.624 1.004.072 1.532 1.058 1.532 1.058.893 1.566 2.341 1.114 2.91.852.091-.667.35-1.114.636-1.37-2.22-.259-4.555-1.14-4.555-5.073 0-1.12.389-2.036 1.029-2.753-.103-.259-.446-1.302.098-2.714 0 0 .839-.275 2.75 1.051A9.29 9.29 0 0 1 12 7.077a9.3 9.3 0 0 1 2.505.35c1.909-1.326 2.747-1.051 2.747-1.051.546 1.412.202 2.455.1 2.714.641.717 1.028 1.633 1.028 2.753 0 3.943-2.338 4.811-4.565 5.064.359.319.679.95.679 1.915 0 1.383-.013 2.498-.013 2.837 0 .273.18.593.688.492C19.138 20.617 22 16.777 22 12.25 22 6.589 17.523 2 12 2Z" />
    </svg>
  );
}

export function ContributionSnake({ data }: ContributionSnakeProps) {
  const rows = 7;
  const totalMonthColumns = useMemo(
    () => data.months.reduce((sum, month) => sum + month.span, 0),
    [data.months]
  );
  const columns = Math.max(data.weeks.length, totalMonthColumns, 53);
  const displayWeeks = useMemo(
    () =>
      Array.from({ length: columns }, (_, weekIndex) =>
        data.weeks[weekIndex] ??
        Array.from({ length: rows }, () => ({ date: "", level: 0 }))
      ),
    [columns, data.weeks, rows]
  );

  const [isMobile, setIsMobile] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [snake, setSnake] = useState<Cell[]>([]);
  const [direction, setDirection] = useState<Cell>({ x: 1, y: 0 });
  const [queuedDirection, setQueuedDirection] = useState<Cell>({ x: 1, y: 0 });
  const [food, setFood] = useState<Cell | null>(null);
  const [score, setScore] = useState(0);
  const [topScore, setTopScore] = useState(0);
  const [isFailed, setIsFailed] = useState(false);
  const [failOrigin, setFailOrigin] = useState<Cell | null>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [desktopCellSize, setDesktopCellSize] = useState<number | null>(null);

  const boardRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<HTMLDivElement | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const prevScoreRef = useRef(0);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setPrefersReducedMotion(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!isMobile) return;
    const id = window.setTimeout(() => {
      setIsPlaying(false);
      setIsPaused(false);
      setIsFailed(false);
      setFailOrigin(null);
    }, 0);
    return () => window.clearTimeout(id);
  }, [isMobile]);

  useEffect(() => {
    const element = mapRef.current;
    if (!element || isMobile) return;
    const remSize =
      Number.parseFloat(getComputedStyle(document.documentElement).fontSize) ||
      16;
    const labelWidth = 2.25 * remSize;
    const gapWidth = 0.24 * remSize;
    const minCellSize = 0.72 * remSize;

    const updateCellSize = () => {
      const available =
        element.clientWidth - labelWidth - gapWidth * columns - 2;
      setDesktopCellSize(Math.max(minCellSize, available / columns));
      element.scrollLeft = 0;
    };

    updateCellSize();
    const observer = new ResizeObserver(updateCellSize);
    observer.observe(element);
    return () => observer.disconnect();
  }, [columns, isMobile]);

  useEffect(() => {
    document.body.classList.toggle("snake-focus-mode", isPlaying);
    return () => document.body.classList.remove("snake-focus-mode");
  }, [isPlaying]);

  const snakeSet = useMemo(
    () => new Set(snake.map((cell) => cellKey(cell))),
    [snake]
  );

  useEffect(() => {
    const id = window.setTimeout(() => {
      const stored = window.localStorage.getItem("pixelsnake-top-score");
      if (stored) setTopScore(Number.parseInt(stored, 10) || 0);
    }, 0);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    if (!isPlaying) return;
    const interval = window.setInterval(() => {
      setSnake((currentSnake) => {
        if (currentSnake.length === 0) return currentSnake;
        const nextDir = queuedDirection;
        const head = currentSnake[0];
        const nextHead = getWrappedHead(head, nextDir, columns, rows);
        const bodyWithoutTail = currentSnake.slice(0, -1);
        if (bodyWithoutTail.some((s) => cellsEqual(s, nextHead))) {
          setIsPlaying(false);
          setIsPaused(false);
          setIsFailed(true);
          setFailOrigin(nextHead);
          return currentSnake;
        }
        setDirection(nextDir);
        if (food && cellsEqual(nextHead, food)) {
          const grown = [nextHead, ...currentSnake];
          const occupied = new Set(grown.map((c) => cellKey(c)));
          setScore((s) => {
            const next = s + 1;
            setTopScore((t) => {
              const nextTop = Math.max(t, next);
              window.localStorage.setItem(
                "pixelsnake-top-score",
                String(nextTop)
              );
              return nextTop;
            });
            return next;
          });
          setFood(getRandomOpenCell(columns, rows, occupied));
          return grown;
        }
        return [nextHead, ...currentSnake.slice(0, -1)];
      });
    }, TICK_MS);
    return () => window.clearInterval(interval);
  }, [columns, food, isPlaying, queuedDirection, rows]);

  useEffect(() => {
    if (!isPlaying) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setIsPlaying(false);
        setIsPaused(true);
        return;
      }
      const next =
        e.key === "ArrowUp" || e.key.toLowerCase() === "w"
          ? { x: 0, y: -1 }
          : e.key === "ArrowDown" || e.key.toLowerCase() === "s"
            ? { x: 0, y: 1 }
            : e.key === "ArrowLeft" || e.key.toLowerCase() === "a"
              ? { x: -1, y: 0 }
              : e.key === "ArrowRight" || e.key.toLowerCase() === "d"
                ? { x: 1, y: 0 }
                : null;
      if (!next) return;
      e.preventDefault();
      if (next.x === -direction.x && next.y === -direction.y) return;
      setQueuedDirection(next);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [direction, isPlaying]);

  useEffect(() => {
    if (isPlaying) boardRef.current?.focus();
  }, [isPlaying]);

  useEffect(() => {
    if (!isPlaying) return;
    const handlePointerDown = (e: MouseEvent) => {
      if (!mapRef.current?.contains(e.target as Node)) {
        setIsPlaying(false);
        setIsPaused(true);
      }
    };
    window.addEventListener("pointerdown", handlePointerDown);
    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, [isPlaying]);

  const unlockAudio = () => {
    if (audioCtxRef.current) return;
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      audioCtxRef.current = new AudioCtx();
    } catch {
      // audio not available
    }
  };

  const playEat = () => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    [440, 660].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.07);
      gain.gain.setValueAtTime(0.035, ctx.currentTime + i * 0.07);
      gain.gain.exponentialRampToValueAtTime(
        0.0001,
        ctx.currentTime + i * 0.07 + 0.09
      );
      osc.start(ctx.currentTime + i * 0.07);
      osc.stop(ctx.currentTime + i * 0.07 + 0.12);
    });
  };

  const playGameOver = () => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    [
      { freq: 196, start: 0, dur: 0.38 },
      { freq: 156, start: 0.32, dur: 0.38 },
      { freq: 124, start: 0.62, dur: 0.38 },
      { freq: 87, start: 0.92, dur: 0.55 },
    ].forEach(({ freq, start, dur }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(freq * 1.04, ctx.currentTime + start);
      osc.frequency.exponentialRampToValueAtTime(
        freq * 0.94,
        ctx.currentTime + start + dur
      );
      gain.gain.setValueAtTime(0.0001, ctx.currentTime + start);
      gain.gain.linearRampToValueAtTime(0.055, ctx.currentTime + start + 0.04);
      gain.gain.exponentialRampToValueAtTime(
        0.0001,
        ctx.currentTime + start + dur
      );
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + dur + 0.05);
    });
  };

  useEffect(() => {
    if (score > prevScoreRef.current) playEat();
    prevScoreRef.current = score;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [score]);

  useEffect(() => {
    if (isFailed) playGameOver();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFailed]);

  const startGame = (origin: Cell) => {
    unlockAudio();
    const initialSnake = [
      origin,
      { x: (origin.x - 1 + columns) % columns, y: origin.y },
      { x: (origin.x - 2 + columns) % columns, y: origin.y },
    ];
    const occupied = new Set(initialSnake.map((c) => cellKey(c)));
    setSnake(initialSnake);
    setDirection({ x: 1, y: 0 });
    setQueuedDirection({ x: 1, y: 0 });
    setFood(getRandomOpenCell(columns, rows, occupied));
    setScore(0);
    setIsFailed(false);
    setIsPaused(false);
    setFailOrigin(null);
    setIsPlaying(true);
  };

  const resumeGame = () => {
    if (snake.length === 0 || isFailed) return;
    setIsPaused(false);
    setIsPlaying(true);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!touchStartRef.current || !isPlaying) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    touchStartRef.current = null;
    if (Math.abs(dx) < 20 && Math.abs(dy) < 20) return;
    const next =
      Math.abs(dx) > Math.abs(dy)
        ? dx > 0
          ? { x: 1, y: 0 }
          : { x: -1, y: 0 }
        : dy > 0
          ? { x: 0, y: 1 }
          : { x: 0, y: -1 };
    if (next.x === -direction.x && next.y === -direction.y) return;
    setQueuedDirection(next);
  };

  return (
    <section
      className="contribution-snake-section"
      aria-label="GitHub contribution activity"
    >
      <div className="contribution-snake-header">
        <div className="contribution-snake-title-group">
          <div className="contribution-snake-title">
            <GitHubMark />
            <p>
              {data.total > 0
                ? `${data.total} contributions in the last year`
                : `${data.username}'s contribution map`}
            </p>
          </div>
        </div>
        <div className="contribution-snake-meta">
          {isMobile ? <span>scroll to browse activity</span> : null}
          {!isMobile && (isPlaying || isPaused || isFailed) ? (
            <>
              <span>score {score}</span>
              <span>top {topScore}</span>
            </>
          ) : null}
        </div>
      </div>

      {isPlaying ? (
        <div className="snake-focus-overlay" aria-hidden="true" />
      ) : null}

      <div
        ref={mapRef}
        className={`contribution-map ${isPlaying ? "is-focus" : ""}`}
        style={{
          ["--contribution-columns" as string]: String(columns),
          ...(desktopCellSize
            ? {
                ["--contribution-cell-size" as string]: `${desktopCellSize}px`,
              }
            : {}),
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="contribution-months" aria-hidden="true">
          {data.months.map((month) => (
            <span
              key={`${month.label}-${month.start}`}
              style={{
                gridColumn: `${month.start + 1} / span ${month.span}`,
              }}
            >
              {month.label}
            </span>
          ))}
        </div>

        <div className="contribution-map-body">
          <div className="contribution-day-labels" aria-hidden="true">
            {DAY_LABELS.map((label, index) => (
              <span key={`${label}-${index}`}>{label}</span>
            ))}
          </div>

          <div className="contribution-board-stack">
            <div
              ref={boardRef}
              className={`contribution-snake-board ${isPlaying ? "is-playing" : ""} ${isFailed ? "is-failed" : ""}`}
              tabIndex={isPlaying ? 0 : -1}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              {displayWeeks.map((week, weekIndex) => (
                <div key={`week-${weekIndex}`} className="contribution-week">
                  {week.map((day, dayIndex) => {
                    const cell = { x: weekIndex, y: dayIndex };
                    const isSnakeCell = snakeSet.has(cellKey(cell));
                    const isFoodCell = food ? cellsEqual(cell, food) : false;
                    const failDistance = failOrigin
                      ? Math.abs(cell.x - failOrigin.x) +
                        Math.abs(cell.y - failOrigin.y)
                      : 0;

                    return (
                      <button
                        key={day.date || `${weekIndex}-${dayIndex}`}
                        type="button"
                        className={`contribution-snake-cell level-${day.level} ${isSnakeCell ? "is-snake" : ""} ${isFoodCell ? "is-food" : ""}`}
                        style={
                          isFailed && !prefersReducedMotion
                            ? ({
                                ["--fail-delay" as string]: `${failDistance * 18}ms`,
                              } as CSSProperties)
                            : undefined
                        }
                        disabled={isMobile}
                        onClick={() => {
                          if (isMobile) return;
                          if (!isPlaying) {
                            if (isPaused && !isFailed && snake.length > 0) {
                              resumeGame();
                              return;
                            }
                            startGame(cell);
                          }
                        }}
                        aria-label={
                          isMobile
                            ? day.date || "Contribution cell"
                            : isPlaying
                              ? `Snake cell ${weekIndex + 1}, ${dayIndex + 1}`
                              : day.date || "Contribution cell"
                        }
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {isFailed ? (
          <div className="contribution-game-over">
            <strong>GAME OVER</strong>
            <span>press any square to restart</span>
          </div>
        ) : null}
      </div>
    </section>
  );
}
