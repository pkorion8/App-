/**
 * Structured event logging baseline (spec §16.1 Observability row).
 *
 * This writes OTel-shaped JSON to stdout rather than wiring a full collector —
 * that's out of scope for Slice 1 (Foundation). The field shape (event,
 * actor/workspace/entity ids, metadata) is what a later OTel exporter would
 * consume, so call sites don't need to change when that lands.
 */
export interface DomainEvent {
  event: string;
  actorId: string | null;
  workspaceId: string | null;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}

export function logEvent(input: DomainEvent): void {
  const record = {
    timestamp: new Date().toISOString(),
    ...input,
  };
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(record));
}
