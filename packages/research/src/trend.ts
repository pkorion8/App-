/**
 * Growth trend detection — the one item from the product owner's
 * "revenue/reviews/trend" list that's genuinely free to build, just
 * needed real engineering rather than a data source. A single research
 * run can only ever see one moment in time; a trend needs the *same*
 * competitor checked again later and compared. Rather than build new
 * scheduled infrastructure, this piggybacks on the fact that founders
 * already re-run Research over days/weeks ("Run again") -- each run's
 * live App Store results get stored as a snapshot, and the next run
 * compares against whatever snapshot came before it for the same app
 * (matched by Apple's stable numeric app id, not name -- names can change).
 */

export interface CurrentAppSignal {
  appId: number;
  name: string;
  ratingCount: number;
}

export interface PreviousAppSnapshot {
  appId: number;
  ratingCount: number;
  checkedAt: string;
}

export interface TrendResult {
  appId: number;
  name: string;
  previousRatingCount: number;
  currentRatingCount: number;
  delta: number;
  daysSincePrevious: number;
  direction: "up" | "down" | "flat";
}

export function compareSnapshots(
  current: CurrentAppSignal[],
  previous: PreviousAppSnapshot[],
): TrendResult[] {
  const previousById = new Map(previous.map((p) => [p.appId, p]));
  const results: TrendResult[] = [];

  for (const c of current) {
    const prev = previousById.get(c.appId);
    if (!prev) continue;

    const delta = c.ratingCount - prev.ratingCount;
    const previousMs = new Date(prev.checkedAt).getTime();
    const daysSincePrevious = Number.isNaN(previousMs)
      ? 0
      : Math.max(0, Math.round((Date.now() - previousMs) / (1000 * 60 * 60 * 24)));

    results.push({
      appId: c.appId,
      name: c.name,
      previousRatingCount: prev.ratingCount,
      currentRatingCount: c.ratingCount,
      delta,
      daysSincePrevious,
      direction: delta > 0 ? "up" : delta < 0 ? "down" : "flat",
    });
  }

  return results;
}
