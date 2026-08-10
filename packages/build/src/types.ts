export interface BuilderOption {
  name: string;
  speed: string;
  ownership: string;
  costNote: string;
}

export interface BacklogItem {
  title: string;
  description: string;
  category: "setup" | "core" | "auth" | "payments" | "polish" | "launch";
}

export interface CostLineItem {
  name: string;
  monthlyCost: number;
  note: string;
}

export interface RecommendedStack {
  database: string;
  auth: string;
  hosting: string;
  notableApis: string[];
  builderOptions: BuilderOption[];
  rationale: string;
}

export interface CostEstimate {
  items: CostLineItem[];
  totalMonthly: number;
}

export interface BuildPackage {
  recommendedStack: RecommendedStack;
  backlog: BacklogItem[];
  costEstimate: CostEstimate;
}

export interface GenerateBuildPackageInput {
  ventureName: string;
  ideaText: string;
}
