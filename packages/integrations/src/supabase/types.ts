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
      research_missions: {
        Row: {
          id: string;
          venture_id: string;
          workspace_id: string;
          target_user: string | null;
          geography: string | null;
          status: "queued" | "running" | "complete" | "failed";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          venture_id: string;
          workspace_id: string;
          target_user?: string | null;
          geography?: string | null;
          status?: "queued" | "running" | "complete" | "failed";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          venture_id?: string;
          workspace_id?: string;
          target_user?: string | null;
          geography?: string | null;
          status?: "queued" | "running" | "complete" | "failed";
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      findings: {
        Row: {
          id: string;
          mission_id: string;
          workspace_id: string;
          normalized_claim: string;
          user_facing_summary: string;
          state: "SOLID" | "MIXED" | "WEAK" | "UNKNOWN";
          is_demo: boolean;
          limitations: string | null;
          next_test: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          mission_id: string;
          workspace_id: string;
          normalized_claim: string;
          user_facing_summary: string;
          state?: "SOLID" | "MIXED" | "WEAK" | "UNKNOWN";
          is_demo?: boolean;
          limitations?: string | null;
          next_test?: string | null;
          created_at?: string;
        };
        Update: never;
        Relationships: [];
      };
      youtube_channels: {
        Row: {
          id: string;
          channel_id: string;
          channel_handle: string | null;
          channel_name: string | null;
          added_by: string | null;
          is_active: boolean;
          last_checked_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          channel_id: string;
          channel_handle?: string | null;
          channel_name?: string | null;
          added_by?: string | null;
          is_active?: boolean;
          last_checked_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          channel_id?: string;
          channel_handle?: string | null;
          channel_name?: string | null;
          added_by?: string | null;
          is_active?: boolean;
          last_checked_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      creator_claims: {
        Row: {
          id: string;
          channel_id: string;
          video_id: string;
          video_title: string;
          video_url: string;
          published_at: string | null;
          claim_type:
            | "cost"
            | "revenue"
            | "users"
            | "tooling"
            | "timeline"
            | "problem"
            | "marketing"
            | "other";
          claim_text: string;
          video_timestamp_seconds: number | null;
          extraction_method: "heuristic" | "llm" | "manual";
          confidence: "unverified" | "corroborated";
          created_at: string;
        };
        Insert: {
          id?: string;
          channel_id: string;
          video_id: string;
          video_title: string;
          video_url: string;
          published_at?: string | null;
          claim_type:
            | "cost"
            | "revenue"
            | "users"
            | "tooling"
            | "timeline"
            | "problem"
            | "marketing"
            | "other";
          claim_text: string;
          video_timestamp_seconds?: number | null;
          extraction_method?: "heuristic" | "llm" | "manual";
          confidence?: "unverified" | "corroborated";
          created_at?: string;
        };
        Update: never;
        Relationships: [];
      };
      simulation_runs: {
        Row: {
          id: string;
          venture_id: string;
          workspace_id: string;
          status: "setup" | "running" | "complete" | "abandoned";
          stage:
            | "setup"
            | "resource_planning"
            | "build"
            | "build_event"
            | "mvp_ready"
            | "pre_launch"
            | "launch"
            | "first_users"
            | "user_or_market_event"
            | "adaptation"
            | "month_1"
            | "complete";
          virtual_day: number;
          cash_remaining: number;
          budget_total: number;
          build_progress_pct: number;
          product_quality_pct: number;
          technical_risk: "low" | "medium" | "high";
          launch_readiness_pct: number;
          total_users: number;
          returning_users: number;
          monthly_revenue: number;
          monthly_cost: number;
          market_confidence: "unknown" | "weak" | "mixed" | "strong";
          history: Record<string, unknown>[];
          market_context: Record<string, unknown> | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          venture_id: string;
          workspace_id: string;
          status?: "setup" | "running" | "complete" | "abandoned";
          stage?:
            | "setup"
            | "resource_planning"
            | "build"
            | "build_event"
            | "mvp_ready"
            | "pre_launch"
            | "launch"
            | "first_users"
            | "user_or_market_event"
            | "adaptation"
            | "month_1"
            | "complete";
          virtual_day?: number;
          cash_remaining?: number;
          budget_total?: number;
          build_progress_pct?: number;
          product_quality_pct?: number;
          technical_risk?: "low" | "medium" | "high";
          launch_readiness_pct?: number;
          total_users?: number;
          returning_users?: number;
          monthly_revenue?: number;
          monthly_cost?: number;
          market_confidence?: "unknown" | "weak" | "mixed" | "strong";
          history?: Record<string, unknown>[];
          market_context?: Record<string, unknown> | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          venture_id?: string;
          workspace_id?: string;
          status?: "setup" | "running" | "complete" | "abandoned";
          stage?:
            | "setup"
            | "resource_planning"
            | "build"
            | "build_event"
            | "mvp_ready"
            | "pre_launch"
            | "launch"
            | "first_users"
            | "user_or_market_event"
            | "adaptation"
            | "month_1"
            | "complete";
          virtual_day?: number;
          cash_remaining?: number;
          budget_total?: number;
          build_progress_pct?: number;
          product_quality_pct?: number;
          technical_risk?: "low" | "medium" | "high";
          launch_readiness_pct?: number;
          total_users?: number;
          returning_users?: number;
          monthly_revenue?: number;
          monthly_cost?: number;
          market_confidence?: "unknown" | "weak" | "mixed" | "strong";
          history?: Record<string, unknown>[];
          market_context?: Record<string, unknown> | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      simulation_events: {
        Row: {
          id: string;
          simulation_run_id: string;
          workspace_id: string;
          virtual_day: number;
          event_type: "build" | "technical" | "market" | "user" | "competitor" | "decision_effect";
          description: string;
          effect: Record<string, unknown>;
          created_at: string;
        };
        Insert: {
          id?: string;
          simulation_run_id: string;
          workspace_id: string;
          virtual_day: number;
          event_type: "build" | "technical" | "market" | "user" | "competitor" | "decision_effect";
          description: string;
          effect?: Record<string, unknown>;
          created_at?: string;
        };
        Update: never;
        Relationships: [];
      };
      simulation_decisions: {
        Row: {
          id: string;
          simulation_run_id: string;
          workspace_id: string;
          virtual_day: number;
          decision_type: string;
          choice: string;
          immediate_effect: string | null;
          delayed_effect_note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          simulation_run_id: string;
          workspace_id: string;
          virtual_day: number;
          decision_type: string;
          choice: string;
          immediate_effect?: string | null;
          delayed_effect_note?: string | null;
          created_at?: string;
        };
        Update: never;
        Relationships: [];
      };
      simulation_checkpoints: {
        Row: {
          id: string;
          simulation_run_id: string;
          workspace_id: string;
          virtual_day: number;
          label: string | null;
          state_snapshot: Record<string, unknown>;
          created_at: string;
        };
        Insert: {
          id?: string;
          simulation_run_id: string;
          workspace_id: string;
          virtual_day: number;
          label?: string | null;
          state_snapshot: Record<string, unknown>;
          created_at?: string;
        };
        Update: never;
        Relationships: [];
      };
      venture_comparisons: {
        Row: {
          id: string;
          workspace_id: string;
          venture_id_a: string;
          venture_id_b: string;
          summary: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          venture_id_a: string;
          venture_id_b: string;
          summary?: string | null;
          created_at?: string;
        };
        Update: never;
        Relationships: [];
      };
      build_packages: {
        Row: {
          id: string;
          venture_id: string;
          workspace_id: string;
          recommended_stack: Record<string, unknown>;
          backlog: unknown[];
          cost_estimate: Record<string, unknown>;
          created_at: string;
        };
        Insert: {
          id?: string;
          venture_id: string;
          workspace_id: string;
          recommended_stack?: Record<string, unknown>;
          backlog?: unknown[];
          cost_estimate?: Record<string, unknown>;
          created_at?: string;
        };
        Update: never;
        Relationships: [];
      };
      venture_outcomes: {
        Row: {
          id: string;
          venture_id: string;
          workspace_id: string;
          reported_at: string;
          metric_type: "users" | "revenue" | "cost" | "retention" | "other";
          metric_value: number | null;
          note: string | null;
          source: "manual" | "import";
          created_at: string;
        };
        Insert: {
          id?: string;
          venture_id: string;
          workspace_id: string;
          reported_at?: string;
          metric_type: "users" | "revenue" | "cost" | "retention" | "other";
          metric_value?: number | null;
          note?: string | null;
          source?: "manual" | "import";
          created_at?: string;
        };
        Update: never;
        Relationships: [];
      };
      billing_accounts: {
        Row: {
          id: string;
          workspace_id: string;
          plan: "free" | "pro";
          status: "active" | "past_due" | "canceled";
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          plan?: "free" | "pro";
          status?: "active" | "past_due" | "canceled";
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          plan?: "free" | "pro";
          status?: "active" | "past_due" | "canceled";
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      usage_ledger: {
        Row: {
          id: string;
          workspace_id: string;
          action_type: string;
          quantity: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          action_type: string;
          quantity?: number;
          created_at?: string;
        };
        Update: never;
        Relationships: [];
      };
      venture_shapes: {
        Row: {
          id: string;
          venture_id: string;
          workspace_id: string;
          problem_statement: string | null;
          value_proposition: string | null;
          mvp_scope: string | null;
          differentiation: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          venture_id: string;
          workspace_id: string;
          problem_statement?: string | null;
          value_proposition?: string | null;
          mvp_scope?: string | null;
          differentiation?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          venture_id?: string;
          workspace_id?: string;
          problem_statement?: string | null;
          value_proposition?: string | null;
          mvp_scope?: string | null;
          differentiation?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      research_competitor_snapshots: {
        Row: {
          id: string;
          venture_id: string;
          workspace_id: string;
          app_id: number;
          app_name: string;
          rating_count: number;
          checked_at: string;
        };
        Insert: {
          id?: string;
          venture_id: string;
          workspace_id: string;
          app_id: number;
          app_name: string;
          rating_count: number;
          checked_at?: string;
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
