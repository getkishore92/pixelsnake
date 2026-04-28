import type { ContributionCalendarData, ContributionDay, ContributionMonth } from "./types";

const DAY_ROWS = 7;

function createFallbackData(username: string): ContributionCalendarData {
  const weeks = Array.from({ length: 53 }, (_, weekIndex) =>
    Array.from({ length: DAY_ROWS }, (_, dayIndex) => ({
      date: `${new Date().getFullYear()}-${String(((weekIndex % 12) + 1)).padStart(2, "0")}-${String(dayIndex + 1).padStart(2, "0")}`,
      level: 0,
    })),
  );

  const months = [
    { label: "Apr", start: 0, span: 4 },
    { label: "May", start: 4, span: 4 },
    { label: "Jun", start: 8, span: 5 },
    { label: "Jul", start: 13, span: 4 },
    { label: "Aug", start: 17, span: 5 },
    { label: "Sep", start: 22, span: 4 },
    { label: "Oct", start: 26, span: 4 },
    { label: "Nov", start: 30, span: 5 },
    { label: "Dec", start: 35, span: 4 },
    { label: "Jan", start: 39, span: 4 },
    { label: "Feb", start: 43, span: 4 },
    { label: "Mar", start: 47, span: 6 },
  ] satisfies ContributionMonth[];

  return { total: 0, username, weeks, months };
}

export async function getGithubContributions(username: string): Promise<ContributionCalendarData> {
  try {
    const response = await fetch(`https://github.com/users/${username}/contributions`, {
      headers: { "User-Agent": "Mozilla/5.0" },
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch contributions for ${username}`);
    }

    const html = await response.text();

    const totalMatch = html.match(/id="js-contribution-activity-description"[^>]*>\s*([\d,]+)\s+contributions?/i);
    const total = totalMatch ? Number.parseInt(totalMatch[1].replace(/,/g, ""), 10) : 0;

    const months: ContributionMonth[] = [];
    let monthStart = 0;
    const monthRegex =
      /<td class="ContributionCalendar-label" colspan="(\d+)"[^>]*>[\s\S]*?<span aria-hidden="true"[^>]*>([^<]+)<\/span>/g;

    for (const match of html.matchAll(monthRegex)) {
      const span = Number.parseInt(match[1], 10);
      months.push({ label: match[2], start: monthStart, span });
      monthStart += span;
    }

    const tbodyMatch = html.match(/<tbody>([\s\S]*?)<\/tbody>/);
    if (!tbodyMatch) {
      throw new Error("Contribution table body not found");
    }

    const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/g;
    const cellRegex = /data-ix="(\d+)"[\s\S]*?data-date="([^"]+)"[\s\S]*?data-level="(\d+)"/g;

    const rows: { ix: number; date: string; level: number }[][] = [];
    for (const rowMatch of tbodyMatch[1].matchAll(rowRegex)) {
      const entries = Array.from(rowMatch[1].matchAll(cellRegex)).map((cellMatch) => ({
        ix: Number.parseInt(cellMatch[1], 10),
        date: cellMatch[2],
        level: Number.parseInt(cellMatch[3], 10),
      }));

      if (entries.length > 0) {
        rows.push(entries);
      }
    }

    if (rows.length !== DAY_ROWS) {
      throw new Error("Unexpected contribution day row count");
    }

    const weekCount = Math.max(...rows.flat().map((cell) => cell.ix)) + 1;
    const weeks: ContributionDay[][] = Array.from({ length: weekCount }, () =>
      Array.from({ length: DAY_ROWS }, () => ({ date: "", level: 0 })),
    );

    rows.forEach((row, dayIndex) => {
      row.forEach((cell) => {
        weeks[cell.ix][dayIndex] = { date: cell.date, level: cell.level };
      });
    });

    return { total, username, weeks, months };
  } catch {
    return createFallbackData(username);
  }
}
