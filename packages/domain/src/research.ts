export type MissionStatus = "queued" | "running" | "complete" | "failed";

export interface ResearchMission {
  id: string;
  ventureId: string;
  workspaceId: string;
  targetUser: string | null;
  geography: string | null;
  status: MissionStatus;
  createdAt: string;
  updatedAt: string;
}

export type FindingState = "SOLID" | "MIXED" | "WEAK" | "UNKNOWN";

export interface Finding {
  id: string;
  missionId: string;
  workspaceId: string;
  normalizedClaim: string;
  userFacingSummary: string;
  state: FindingState;
  /** True until a real, credentialed data source produces this finding. */
  isDemo: boolean;
  limitations: string | null;
  nextTest: string | null;
  createdAt: string;
}

export interface StartResearchInput {
  ventureId: string;
  workspaceId: string;
  targetUser: string;
  geography: string;
}
