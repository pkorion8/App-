export interface AuditEvent {
  id: string;
  actorId: string;
  workspaceId: string | null;
  action: string;
  entityType: string;
  entityId: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}
