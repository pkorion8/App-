export interface Workspace {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
}

export type WorkspaceRole = "owner" | "member";

export interface WorkspaceMember {
  workspaceId: string;
  userId: string;
  role: WorkspaceRole;
  createdAt: string;
}
