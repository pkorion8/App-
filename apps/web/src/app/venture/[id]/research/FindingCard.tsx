import { Badge, BarList, Card, Meter, StatTile, type BadgeStatus } from "@venture-sandbox/ui";
import type {
  CompetitorFindingMetadata,
  GithubFindingMetadata,
  MarketFindingMetadata,
} from "@venture-sandbox/research";

export interface FindingRow {
  id: string;
  normalized_claim: string;
  user_facing_summary: string;
  state: string;
  is_demo: boolean;
  limitations: string | null;
  next_test: string | null;
  metadata: Record<string, unknown> | null;
}

const STATE_LABEL: Record<string, string> = {
  SOLID: "Solid",
  MIXED: "Mixed signals",
  WEAK: "Weak",
  UNKNOWN: "Not yet checked",
};

const STATE_BADGE_STATUS: Record<string, BadgeStatus> = {
  SOLID: "success",
  MIXED: "warning",
  WEAK: "neutral",
  UNKNOWN: "neutral",
};

const TRACTION_BADGE_STATUS: Record<string, BadgeStatus> = {
  Strong: "success",
  Moderate: "warning",
  Weak: "neutral",
};

function formatDate(iso: string | null): string {
  if (!iso) return "unknown date";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "unknown date" : d.toISOString().slice(0, 10);
}

function CardHeader({
  title,
  isDemo,
  state,
  extraBadge,
}: {
  title: string;
  isDemo: boolean;
  state: string;
  extraBadge?: { label: string; status: BadgeStatus };
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <p className="font-medium text-vs-fg">{title}</p>
      <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
        {isDemo && <Badge status="danger">Demo</Badge>}
        {extraBadge && <Badge status={extraBadge.status}>{extraBadge.label}</Badge>}
        <Badge status={STATE_BADGE_STATUS[state] ?? "neutral"}>{STATE_LABEL[state] ?? state}</Badge>
      </div>
    </div>
  );
}

function Footer({ limitations, nextTest }: { limitations: string | null; nextTest: string | null }) {
  return (
    <>
      {limitations && (
        <p className="mt-3 text-xs text-vs-fg-muted">
          <span className="font-semibold">Limitation: </span>
          {limitations}
        </p>
      )}
      {nextTest && (
        <p className="mt-1 text-xs text-vs-fg-muted">
          <span className="font-semibold">Next real test: </span>
          {nextTest}
        </p>
      )}
    </>
  );
}

function CompetitorCard({ f, metadata }: { f: FindingRow; metadata: CompetitorFindingMetadata }) {
  const shown = metadata.apps.slice(0, 10);
  return (
    <Card>
      <CardHeader
        title={f.normalized_claim}
        isDemo={f.is_demo}
        state={f.state}
        extraBadge={{ label: `${metadata.traction} traction`, status: TRACTION_BADGE_STATUS[metadata.traction] ?? "neutral" }}
      />

      <div className="mt-3 grid grid-cols-2 gap-3">
        <StatTile label="Apps found" value={metadata.totalFound.toLocaleString()} />
        <StatTile
          label="Weakest traction"
          value={metadata.weakest ? metadata.weakest.name : "—"}
          hint={metadata.weakest ? `${metadata.weakest.ratingCount.toLocaleString()} ratings` : "not enough data"}
        />
      </div>

      {metadata.totalFound > 0 && (
        <Meter
          className="mt-3"
          label="Launched in the last 12 months"
          value={metadata.newcomerCount}
          max={metadata.totalFound}
          valueLabel={`${metadata.newcomerCount} of ${metadata.totalFound}`}
        />
      )}

      {shown.length > 0 && (
        <BarList
          className="mt-4"
          items={shown.map((app) => ({
            label: app.name,
            sublabel: `${app.seller} · ${app.price} · updated ${formatDate(app.lastUpdated)}`,
            value: app.ratingCount,
            valueLabel: `${app.rating !== null ? `${app.rating.toFixed(1)}★ · ` : ""}${app.ratingCount.toLocaleString()}`,
            tag: app.isNew ? "NEW" : undefined,
          }))}
        />
      )}

      {metadata.trends.length > 0 && (
        <div className="mt-4 rounded-vs-md border border-vs-border bg-vs-bg-subtle p-3">
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-vs-fg-muted">
            Since this venture&apos;s last research run
          </p>
          <ul className="space-y-1">
            {metadata.trends.map((t) => (
              <li key={t.name} className="text-sm text-vs-fg">
                <span
                  className={
                    t.direction === "up"
                      ? "text-vs-success"
                      : t.direction === "down"
                        ? "text-vs-danger"
                        : "text-vs-fg-muted"
                  }
                >
                  {t.direction === "up" ? "↑" : t.direction === "down" ? "↓" : "→"}
                </span>{" "}
                {t.name}: {t.previousRatingCount.toLocaleString()} → {t.currentRatingCount.toLocaleString()} ratings
                <span className="text-vs-fg-muted"> ({t.daysSincePrevious}d)</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Footer limitations={f.limitations} nextTest={f.next_test} />
    </Card>
  );
}

function MarketCard({ f, metadata }: { f: FindingRow; metadata: MarketFindingMetadata }) {
  return (
    <Card>
      <CardHeader title={f.normalized_claim} isDemo={f.is_demo} state={f.state} />
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {metadata.indicators.map((ind) => (
          <StatTile key={ind.id} label={ind.label} value={ind.formatted} hint={`as of ${ind.year}`} />
        ))}
      </div>
      {metadata.missingIndicatorLabels.length > 0 && (
        <p className="mt-3 rounded-vs-sm bg-vs-warning/10 px-3 py-2 text-xs text-vs-warning">
          {metadata.missingIndicatorLabels.join(" and ")} didn&apos;t come back from the World Bank this run —
          their API is occasionally flaky, not a bug here. Run Research again and they may come through.
        </p>
      )}
      <Footer limitations={f.limitations} nextTest={f.next_test} />
    </Card>
  );
}

function GithubCard({ f, metadata }: { f: FindingRow; metadata: GithubFindingMetadata }) {
  return (
    <Card>
      <CardHeader title={f.normalized_claim} isDemo={f.is_demo} state={f.state} />
      <div className="mt-3 grid grid-cols-2 gap-3">
        <StatTile label="Repos found" value={metadata.totalFound.toLocaleString()} />
        <StatTile
          label="Actively maintained"
          value={metadata.activeCount.toLocaleString()}
          hint="pushed to in the last 180 days"
        />
      </div>
      {metadata.repos.length > 0 && (
        <BarList
          className="mt-4"
          items={metadata.repos.map((r) => ({
            label: r.fullName,
            sublabel: r.description ?? undefined,
            value: r.stars,
            valueLabel: `${r.stars.toLocaleString()}★`,
            tag: r.isActive ? "ACTIVE" : undefined,
          }))}
        />
      )}
      <Footer limitations={f.limitations} nextTest={f.next_test} />
    </Card>
  );
}

function GenericCard({ f }: { f: FindingRow }) {
  return (
    <Card>
      <CardHeader title={f.normalized_claim} isDemo={f.is_demo} state={f.state} />
      <p className="mt-2 whitespace-pre-line text-sm text-vs-fg-muted">{f.user_facing_summary}</p>
      <Footer limitations={f.limitations} nextTest={f.next_test} />
    </Card>
  );
}

export function FindingCard({ f }: { f: FindingRow }) {
  const kind = f.metadata && typeof f.metadata === "object" ? (f.metadata as { kind?: string }).kind : undefined;

  if (kind === "competitors") {
    return <CompetitorCard f={f} metadata={f.metadata as unknown as CompetitorFindingMetadata} />;
  }
  if (kind === "market") {
    return <MarketCard f={f} metadata={f.metadata as unknown as MarketFindingMetadata} />;
  }
  if (kind === "github") {
    return <GithubCard f={f} metadata={f.metadata as unknown as GithubFindingMetadata} />;
  }
  return <GenericCard f={f} />;
}
