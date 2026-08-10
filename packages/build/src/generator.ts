import type {
  BacklogItem,
  BuildPackage,
  CostLineItem,
  GenerateBuildPackageInput,
} from "./types";

/**
 * Build Studio V1 -- a real, rule-based generator (spec's own "builder
 * neutrality" LOCKED decision: present options, don't pick one builder
 * for the user). Keyword detection on the idea text, not an LLM (none
 * connected yet) -- this is honestly a heuristic pass, same tier as the
 * creator-intelligence claim extractor, not a personalized AI recommendation.
 * Pricing figures are current best-effort estimates, not live-fetched --
 * label them as such in the UI, don't present them as guaranteed.
 */

function detectFeatures(ideaText: string) {
  const text = ideaText.toLowerCase();
  return {
    needsAi: /\b(ai|generate|assistant|chat ?bot|gpt|claude|llm)\b/.test(text),
    needsImageGen: /\b(photo|image|design|art|nail|filter|avatar)\b/.test(text),
    needsPayments: /\b(sell|buy|payment|subscription|marketplace|pay|checkout|price|pricing)\b/.test(text),
    needsRealtime: /\b(chat|message|social|live|realtime|real-time|multiplayer)\b/.test(text),
  };
}

export function generateBuildPackage(input: GenerateBuildPackageInput): BuildPackage {
  const features = detectFeatures(input.ideaText);
  const notableApis: string[] = [];
  if (features.needsAi) notableApis.push("An LLM API (e.g. Claude, GPT) for the AI-facing parts");
  if (features.needsImageGen) notableApis.push("An image-generation API (e.g. Replicate, fal.ai)");
  if (features.needsPayments) notableApis.push("Stripe for payments/subscriptions");
  if (features.needsRealtime) notableApis.push("Supabase Realtime for live updates");

  const backlog: BacklogItem[] = [
    { title: "Set up project + auth", description: "Sign-in, a workspace/account for each user.", category: "setup" },
    { title: `Core ${input.ventureName} data model`, description: "The 1-2 main things users create/manage — keep this narrow for a first version.", category: "core" },
    { title: "Main user flow, end to end", description: `The single flow that proves out "${input.ideaText}" — build only this one path first.`, category: "core" },
    { title: "Basic account/profile", description: "Enough for a user to see who they're signed in as and sign out.", category: "auth" },
  ];
  if (features.needsPayments) {
    backlog.push({ title: "Payments", description: "A single price point via Stripe Checkout to start — skip a full billing portal for v1.", category: "payments" });
  }
  if (features.needsAi) {
    backlog.push({ title: "AI feature", description: "Wire the one AI-powered feature the idea depends on — keep the prompt/logic simple and iterate after real users try it.", category: "core" });
  }
  backlog.push(
    { title: "Empty states + errors", description: "What a brand-new user sees with zero data, and what happens when something fails.", category: "polish" },
    { title: "Mobile check", description: "Confirm the core flow works on a phone screen, not just desktop.", category: "polish" },
    { title: "Deploy + real domain", description: "Production deploy, connect a real domain, smoke-test the live version.", category: "launch" },
  );

  const costItems: CostLineItem[] = [
    { name: "Hosting (Vercel Hobby)", monthlyCost: 0, note: "Free tier covers most early-stage traffic." },
    { name: "Database + Auth (Supabase Free)", monthlyCost: 0, note: "Free tier; upgrade (~$25/mo) once you outgrow its limits." },
    { name: "Domain", monthlyCost: 1, note: "~$12/year, averaged monthly." },
  ];
  if (features.needsAi) {
    costItems.push({ name: "LLM API usage", monthlyCost: 20, note: "Rough estimate at low volume — scales with usage, not fixed." });
  }
  if (features.needsImageGen) {
    costItems.push({ name: "Image generation API", monthlyCost: 15, note: "Rough estimate at low volume — per-image pricing varies by provider." });
  }
  if (features.needsPayments) {
    costItems.push({ name: "Stripe", monthlyCost: 0, note: "No fixed fee — takes a percentage per transaction instead." });
  }

  return {
    recommendedStack: {
      database: "Supabase (Postgres)",
      auth: "Supabase Auth",
      hosting: "Vercel",
      notableApis,
      builderOptions: [
        {
          name: "AI builder (Lovable, Bolt.new, v0, Replit)",
          speed: "Fastest to a clickable first version",
          ownership: "Lower — you're building inside their platform/export model",
          costNote: "Usually a monthly subscription on top of hosting costs above",
        },
        {
          name: "Write the code yourself (Next.js + Supabase)",
          speed: "Slower to start, most control long-term",
          ownership: "Full — the reference stack this whole plan assumes",
          costNote: "Just the hosting/API costs above, no builder subscription",
        },
        {
          name: "Hire a developer/agency",
          speed: "Depends on who you hire",
          ownership: "Full, once delivered",
          costNote: "Highest upfront cost, most predictable outcome",
        },
      ],
      rationale:
        "These are starting points, not a mandate — the product stays builder-neutral by design. " +
        "Pick based on how much you want to learn to code vs. ship fast vs. own everything long-term.",
    },
    backlog,
    costEstimate: {
      items: costItems,
      totalMonthly: costItems.reduce((sum, item) => sum + item.monthlyCost, 0),
    },
  };
}
