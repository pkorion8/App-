/**
 * Hand-authored Database type matching supabase/migrations/0001_init.sql.
 *
 * There's no live Supabase project to generate this from yet, so it's
 * maintained by hand for Slice 1. Once a project exists, replace with
 * `supabase gen types typescript` output and keep this file's shape as the
 * contract (Row/Insert/Update per table under public.Tables).
 */
export interface Database {
  public: {
    Tables: {
      workspaces: {
        Row: {
          id: string;
          name: string;
          owner_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          owner_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          owner_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      workspace_members: {
        Row: {
          workspace_id: string;
          user_id: string;
          role: "owner" | "member";
          created_at: string;
        };
        Insert: {
          workspace_id: string;
          user_id: string;
          role?: "owner" | "member";
          created_at?: string;
        };
        Update: {
          workspace_id?: string;
          user_id?: string;
          role?: "owner" | "member";
          created_at?: string;
        };
        Relationships: [];
      };
      ventures: {
        Row: {
          id: string;
          workspace_id: string;
          name: string;
          raw_idea_text: string;
          target_user: string | null;
          geography: string | null;
          status:
            | "draft"
            | "researching"
            | "shaped"
            | "simulating"
            | "built"
            | "launched";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          name: string;
          raw_idea_text: string;
          target_user?: string | null;
          geography?: string | null;
          status?:
            | "draft"
            | "researching"
            | "shaped"
            | "simulating"
            | "built"
            | "launched";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          name?: string;
          raw_idea_text?: string;
          target_user?: string | null;
          geography?: string | null;
          status?:
            | "draft"
            | "researching"
            | "shaped"
            | "simulating"
            | "built"
            | "launched";
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      audit_log: {
        Row: {
          id: string;
          actor_id: string;
          workspace_id: string | null;
          action: string;
          entity_type: string;
          entity_id: string;
          metadata: Record<string, unknown>;
          created_at: string;
        };
        Insert: {
          id?: string;
          actor_id: string;
          workspace_id?: string | null;
          action: string;
          entity_type: string;
          entity_id: string;
          metadata?: Record<string, unknown>;
          created_at?: string;
        };
        Update: never;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
