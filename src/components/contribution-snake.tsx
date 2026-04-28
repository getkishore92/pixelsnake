"use client";

// ─── Customization ───────────────────────────────────────────────────────────
// Snake speed in milliseconds per tick. Lower = faster. Default: 120.
const TICK_MS = 120;
// ─────────────────────────────────────────────────────────────────────────────

import type { CSSProperties, MouseEvent as ReactMouseEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ContributionCalendarData } from "@/lib/github-contributions";

type Cell = {
  x: number;
  y: number;
};

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

function getWrappedHead(head: Cell, direction: Cell, columns: number, rows: number): Cell {
  return {
    x: (head.x + direction.x + columns) % columns,
    y: (head.y + direction.y + rows) % rows,
  };
}

function generateScatterPixels(cols: number, rs: number, occupied: Set<string>, count: number): Set<string> {
  const available: Cell[] = [];
  for (let x = 0; x < cols; x++) {
    for (let y = 0; y < rs; y++) {
      if (!occupied.has(cellKey({ x, y }))) available.push({ x, y });
    }
  }
  for (let i = available.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [available[i], available[j]] = [available[j], available[i]];
  }
  const scatter = new Set<string>();
  available.slice(0, Math.min(count, available.length)).forEach((c) => scatter.add(cellKey(c)));
  return scatter;
}

function getRandomOpenCell(columns: number, rows: number, occupied: Set<string>) {
  const available: Cell[] = [];

  for (let x = 0; x < columns; x += 1) {
    for (let y = 0; y < rows; y += 1) {
      const candidate = { x, y };
      if (!occupied.has(cellKey(candidate))) {
        available.push(candidate);
      }
    }
  }

  if (available.length === 0) {
    return null;
  }

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
        Array.from({ length: rows }, () => ({
          date: "",
          level: 0,
        }))
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
  const [isStarting, setIsStarting] = useState(false);
  const [countdownLabel, setCountdownLabel] = useState<"3" | "2" | "1" | "GO" | null>(null);
  const [showControlsHint, setShowControlsHint] = useState(false);
  const [gamePixels, setGamePixels] = useState<Set<string>>(new Set());
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [desktopCellSize, setDesktopCellSize] = useState<number | null>(null);
  const boardRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<HTMLDivElement | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const prevScoreRef = useRef(0);
  const countdownStepTimeoutRef = useRef<number | null>(null);
  const queuedDirectionRef = useRef<Cell>({ x: 1, y: 0 });
  const foodRef = useRef<Cell | null>(null);
  const columnsRef = useRef(columns);
  const intervalRef = useRef<number | null>(null);
  const stepRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotionPreference = () => {
      setPrefersReducedMotion(mediaQuery.matches);
    };

    updateMotionPreference();
    mediaQuery.addEventListener("change", updateMotionPreference);

    return () => mediaQuery.removeEventListener("change", updateMotionPreference);
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 767px)");
    const updateIsMobile = () => {
      setIsMobile(mediaQuery.matches);
    };

    updateIsMobile();
    mediaQuery.addEventListener("change", updateIsMobile);

    return () => mediaQuery.removeEventListener("change", updateIsMobile);
  }, []);

  useEffect(() => {
    if (!isMobile) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setIsPlaying(false);
      setIsPaused(false);
      setIsFailed(false);
      setFailOrigin(null);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [isMobile]);

  useEffect(() => {
    const element = mapRef.current;

    if (!element || isMobile) {
      return;
    }

    const remSize = Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    const labelWidth = 2.25 * remSize;
    const gapWidth = 0.24 * remSize;
    const minCellSize = 0.72 * remSize;
    const safetyPadding = 2;

    const updateCellSize = () => {
      const availableWidth = element.clientWidth - labelWidth - gapWidth * columns - safetyPadding;
      const nextSize = Math.max(minCellSize, availableWidth / columns);
      setDesktopCellSize(nextSize);
      element.scrollLeft = 0;
    };

    updateCellSize();

    const observer = new ResizeObserver(updateCellSize);
    observer.observe(element);

    return () => observer.disconnect();
  }, [columns, isMobile]);

  const snakeSet = useMemo(
    () => new Set(snake.map((cell) => cellKey(cell))),
    [snake]
  );

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const stored = window.localStorage.getItem("pixelsnake-top-score");
      if (stored) {
        setTopScore(Number.parseInt(stored, 10) || 0);
      }
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    return () => {
      if (countdownStepTimeoutRef.current) {
        window.clearTimeout(countdownStepTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => { queuedDirectionRef.current = queuedDirection; }, [queuedDirection]);
  useEffect(() => { foodRef.current = food; }, [food]);
  useEffect(() => { columnsRef.current = columns; }, [columns]);

  useEffect(() => {
    if (!isPlaying) {
      stepRef.current = null;
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      return;
    }

    const step = () => {
      setSnake((currentSnake) => {
        if (currentSnake.length === 0) return currentSnake;
        const nextDir = queuedDirectionRef.current;
        const cols = columnsRef.current;
        const head = currentSnake[0];
        const nextHead = getWrappedHead(head, nextDir, cols, rows);
        const bodyWithoutTail = currentSnake.slice(0, -1);
        if (bodyWithoutTail.some((s) => cellsEqual(s, nextHead))) {
          setIsPlaying(false);
          setIsPaused(false);
          setIsFailed(true);
          setFailOrigin(nextHead);
          return currentSnake;
        }
        setDirection(nextDir);
        if (foodRef.current && cellsEqual(nextHead, foodRef.current)) {
          const grown = [nextHead, ...currentSnake];
          const occupied = new Set(grown.map((c) => cellKey(c)));
          setScore((s) => {
            const next = s + 1;
            setTopScore((t) => {
              const nextTop = Math.max(t, next);
              window.localStorage.setItem("pixelsnake-top-score", String(nextTop));
              return nextTop;
            });
            return next;
          });
          setFood(getRandomOpenCell(cols, rows, occupied));
          return grown;
        }
        return [nextHead, ...currentSnake.slice(0, -1)];
      });
    };

    stepRef.current = step;
    intervalRef.current = window.setInterval(step, TICK_MS);

    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
  }, [isPlaying, rows]);

  useEffect(() => {
    if (!isPlaying) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setIsPlaying(false);
        setIsPaused(true);
        return;
      }

      const nextDirection =
        event.key === "ArrowUp" || event.key.toLowerCase() === "w"
          ? { x: 0, y: -1 }
          : event.key === "ArrowDown" || event.key.toLowerCase() === "s"
            ? { x: 0, y: 1 }
            : event.key === "ArrowLeft" || event.key.toLowerCase() === "a"
              ? { x: -1, y: 0 }
              : event.key === "ArrowRight" || event.key.toLowerCase() === "d"
                ? { x: 1, y: 0 }
                : null;

      if (!nextDirection) {
        return;
      }

      event.preventDefault();

      if (
        nextDirection.x === -direction.x &&
        nextDirection.y === -direction.y
      ) {
        return;
      }

      queuedDirectionRef.current = nextDirection;
      setQueuedDirection(nextDirection);
      stepRef.current?.();
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      if (stepRef.current) intervalRef.current = window.setInterval(stepRef.current, TICK_MS);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [direction, isPlaying]);

  useEffect(() => {
    if (isPlaying) {
      boardRef.current?.focus();
    }
  }, [isPlaying]);

  useEffect(() => {
    if (!isPlaying) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      const map = mapRef.current;
      if (!map) {
        return;
      }

      if (!map.contains(event.target as Node)) {
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
      audioCtxRef.current.resume();
    } catch {
      // audio not available
    }
  };

  const playEat = () => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    const notes = [440, 660];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.07);
      gain.gain.setValueAtTime(0.035, ctx.currentTime + i * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + i * 0.07 + 0.09);
      osc.start(ctx.currentTime + i * 0.07);
      osc.stop(ctx.currentTime + i * 0.07 + 0.12);
    });
  };

  const playGameOver = () => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    [
      { freq: 196, start: 0,    dur: 0.38 },
      { freq: 156, start: 0.32, dur: 0.38 },
      { freq: 124, start: 0.62, dur: 0.38 },
      { freq: 87,  start: 0.92, dur: 0.55 },
    ].forEach(({ freq, start, dur }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(freq * 1.04, ctx.currentTime + start);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.94, ctx.currentTime + start + dur);
      gain.gain.setValueAtTime(0.0001, ctx.currentTime + start);
      gain.gain.linearRampToValueAtTime(0.055, ctx.currentTime + start + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + dur);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + dur + 0.05);
    });
  };

  useEffect(() => {
    if (score > prevScoreRef.current) {
      playEat();
    }
    prevScoreRef.current = score;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [score]);

  useEffect(() => {
    if (isFailed) {
      playGameOver();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFailed]);

  const beginGame = (origin: Cell) => {
    const initialSnake = [
      origin,
      { x: (origin.x - 1 + columns) % columns, y: origin.y },
      { x: (origin.x - 2 + columns) % columns, y: origin.y },
    ];
    const occupied = new Set(initialSnake.map((cell) => cellKey(cell)));
    const foodCell = getRandomOpenCell(columns, rows, occupied);
    const allOccupied = new Set(occupied);
    if (foodCell) allOccupied.add(cellKey(foodCell));
    setGamePixels(generateScatterPixels(columns, rows, allOccupied, Math.floor(columns * rows * 0.06)));
    setSnake(initialSnake);
    setDirection({ x: 1, y: 0 });
    queuedDirectionRef.current = { x: 1, y: 0 };
    setQueuedDirection({ x: 1, y: 0 });
    setFood(foodCell);
    setScore(0);
    setIsFailed(false);
    setIsPaused(false);
    setFailOrigin(null);
    setIsStarting(false);
    setCountdownLabel(null);
    setShowControlsHint(false);
    setIsPlaying(true);
  };

  const startGame = (origin: Cell) => {
    unlockAudio();

    if (countdownStepTimeoutRef.current) {
      window.clearTimeout(countdownStepTimeoutRef.current);
    }

    setShowControlsHint(true);
    setIsStarting(true);
    setCountdownLabel("3");
    setIsPlaying(false);
    setIsPaused(false);
    setIsFailed(false);
    setFailOrigin(null);

    const runCountdown = (label: "3" | "2" | "1" | "GO") => {
      if (label === "GO") {
        countdownStepTimeoutRef.current = window.setTimeout(() => {
          beginGame(origin);
        }, 650);
        return;
      }

      const nextLabel = label === "3" ? "2" : label === "2" ? "1" : "GO";
      countdownStepTimeoutRef.current = window.setTimeout(() => {
        setCountdownLabel(nextLabel);
        runCountdown(nextLabel);
      }, 720);
    };

    runCountdown("3");
  };

  const resumeGame = () => {
    if (snake.length === 0 || isFailed) {
      return;
    }

    setIsPaused(false);
    setIsPlaying(true);
  };

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    const touch = event.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    if (!touchStartRef.current || !isPlaying) {
      return;
    }

    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    touchStartRef.current = null;

    if (Math.abs(deltaX) < 20 && Math.abs(deltaY) < 20) {
      return;
    }

    const nextDirection =
      Math.abs(deltaX) > Math.abs(deltaY)
        ? deltaX > 0
          ? { x: 1, y: 0 }
          : { x: -1, y: 0 }
        : deltaY > 0
          ? { x: 0, y: 1 }
          : { x: 0, y: -1 };

    if (nextDirection.x === -direction.x && nextDirection.y === -direction.y) {
      return;
    }

    queuedDirectionRef.current = nextDirection;
    setQueuedDirection(nextDirection);
    stepRef.current?.();
    if (intervalRef.current) window.clearInterval(intervalRef.current);
    if (stepRef.current) intervalRef.current = window.setInterval(stepRef.current, TICK_MS);
  };

  const handleMapPointerDown = (event: ReactMouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
  };

  return (
    <section className="contribution-snake-section" aria-label="GitHub contribution activity">
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

      {isPlaying ? <div className="snake-focus-overlay" aria-hidden="true" /> : null}

      <div
        ref={mapRef}
        className={`contribution-map ${(isPlaying || isPaused || isFailed) ? "is-focus" : ""}`}
        style={{
          ["--contribution-columns" as string]: String(columns),
          ...(desktopCellSize ? { ["--contribution-cell-size" as string]: `${desktopCellSize}px` } : {}),
        }}
        onMouseDown={handleMapPointerDown}
      >
        <div className="contribution-months" aria-hidden="true">
          {data.months.map((month) => (
            <span
              key={`${month.label}-${month.start}`}
              style={{ gridColumn: `${month.start + 1} / span ${month.span}` }}
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
                    const gameActive = isPlaying || isPaused || isFailed;
                    const isScatterCell = gameActive && gamePixels.has(cellKey(cell));
                    const failDistance = failOrigin
                      ? Math.abs(cell.x - failOrigin.x) + Math.abs(cell.y - failOrigin.y)
                      : 0;

                    return (
                      <button
                        key={day.date || `${weekIndex}-${dayIndex}`}
                        type="button"
                        className={`contribution-snake-cell ${gameActive ? "level-0" : `level-${day.level}`} ${isSnakeCell ? "is-snake" : ""} ${isFoodCell ? "is-food" : ""} ${isScatterCell ? "is-scatter" : ""}`}
                        style={
                          isFailed && !prefersReducedMotion
                            ? ({ ["--fail-delay" as string]: `${failDistance * 18}ms` } as CSSProperties)
                            : undefined
                        }
                        disabled={isMobile}
                        onClick={() => {
                          if (isMobile) {
                            return;
                          }

                          if (!isPlaying && !isStarting) {
                            if (isPaused && !isFailed && snake.length > 0) {
                              resumeGame();
                              return;
                            }

                            startGame(cell);
                          }
                        }}
                        aria-label={
                          isMobile
                            ? `${day.date || "Contribution cell"}`
                            : isPlaying
                            ? `Snake board cell ${weekIndex + 1}, ${dayIndex + 1}`
                            : `${day.date || "Contribution cell"}`
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
          <div className="contribution-game-over contribution-board-callout">
            <strong>GAME OVER</strong>
            <span>press any square to restart</span>
          </div>
        ) : null}

        {(isStarting || isPlaying) && showControlsHint ? (
          <div
            key={isStarting ? `countdown-${countdownLabel ?? "idle"}` : "controls-hint"}
            className={`contribution-board-callout ${isStarting ? "contribution-start-countdown" : "contribution-controls-hint"}`}
            data-countdown-label={isStarting && countdownLabel ? countdownLabel : undefined}
            aria-hidden="true"
          >
            {isStarting && countdownLabel ? (
              <>
                <strong>USE AWSD OR ARROW KEYS TO PLAY</strong>
                <span>{countdownLabel === "GO" ? "GO!!" : `STARTING IN ${countdownLabel}`}</span>
              </>
            ) : (
              <>
                <strong>USE AWSD OR ARROW KEYS TO PLAY</strong>
                <span>COLLECT PIXELS. DON&apos;T CRASH.</span>
              </>
            )}
          </div>
        ) : null}
      </div>
    </section>
  );
}
