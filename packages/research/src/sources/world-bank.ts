/**
 * World Bank Open Data API — free, no key, no rate-limit auth required.
 * Empirically flaky though: it sometimes returns an HTML "Request Error"
 * page with a 200 status for an otherwise-valid indicator/country
 * combination (observed live, not hypothetical). There's nothing to fix
 * client-side for that -- so each indicator gets one retry, and a failed
 * indicator is just dropped rather than failing the whole fetch. Partial
 * real data beats an all-or-nothing call that goes down whenever one of
 * three indicators has a bad moment.
 */

export interface WorldBankIndicatorResult {
  indicatorId: string;
  label: string;
  value: number;
  year: string;
}

export const TRACKED_INDICATORS: { id: string; label: string }[] = [
  { id: "SP.POP.TOTL", label: "Population" },
  { id: "NY.GDP.PCAP.CD", label: "GDP per capita (current US$)" },
  { id: "IT.NET.USER.ZS", label: "Internet users (% of population)" },
];

interface WorldBankRow {
  value: number | null;
  date?: string;
}

async function fetchIndicator(
  countryCode: string,
  indicator: { id: string; label: string },
): Promise<WorldBankIndicatorResult | null> {
  const url = `https://api.worldbank.org/v2/country/${countryCode}/indicator/${indicator.id}?format=json&mrnev=1`;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
      if (!res.ok) continue;

      const text = await res.text();
      const parsed: unknown = JSON.parse(text);
      if (!Array.isArray(parsed) || parsed.length < 2 || !Array.isArray(parsed[1])) continue;

      const row = parsed[1][0] as WorldBankRow | undefined;
      if (!row || row.value === null || row.value === undefined) continue;

      return { indicatorId: indicator.id, label: indicator.label, value: row.value, year: row.date ?? "unknown year" };
    } catch {
      continue;
    }
  }
  return null;
}

/** Fetches whichever of the tracked indicators succeed; never throws. */
export async function fetchWorldBankIndicators(countryCode: string): Promise<WorldBankIndicatorResult[]> {
  const results = await Promise.all(TRACKED_INDICATORS.map((indicator) => fetchIndicator(countryCode, indicator)));
  return results.filter((r): r is WorldBankIndicatorResult => r !== null);
}
