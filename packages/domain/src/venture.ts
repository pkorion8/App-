/**
 * Venture status progression. Only "draft" is reachable in Slice 1 (Foundation);
 * later values are reserved for Slices 2-7 and are listed here so the column
 * type doesn't need to change shape when those slices land.
 */
export type VentureStatus =
  | "draft"
  | "researching"
  | "shaped"
  | "simulating"
  | "built"
  | "launched";

export interface Venture {
  id: string;
  workspaceId: string;
  name: string;
  rawIdeaText: string;
  targetUser: string | null;
  geography: string | null;
  status: VentureStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateVentureInput {
  workspaceId: string;
  name: string;
  rawIdeaText: string;
}
