export type MonetizationContext = {
  geography?: string | null;
  audience?: string | null;
  product?: string | null;
  pricingModel?: string | null;
  hasCompetitorPricing: boolean;
};

export type MonetizationExperiment = {
  key: string;
  title: string;
  hypothesis: string;
  fit: string;
  evidence: string[];
  unknowns: string;
  metric: string;
  invalidates?: string;
  pricingModelOverride?: "subscription" | "one_time" | "commission" | "ad_supported";
};

export function createMonetizationExperiments(c: MonetizationContext): MonetizationExperiment[] {
  const audience = c.audience || "the intended audience";
  const geo = c.geography || "the chosen market";
  const product = c.product || "the saved product concept";
  const cost = "Source-backed operating-cost pricing is not connected. Verify current vendor pricing before using cost assumptions.";
  const pricing = c.hasCompetitorPricing ? "Connected competitor pricing evidence is available." : "Competitor price evidence does not exist in connected sources.";

  return [
    {
      key: "monthly-annual", title: "Monthly vs annual", pricingModelOverride: "subscription",
      hypothesis: `An annual option may improve committed revenue from ${audience} without removing a lower-commitment monthly path.`,
      fit: `Useful when ${c.pricingModel === "subscription" ? "a subscription is already selected" : "recurring value is still an open assumption"}.`,
      evidence: [cost, pricing], unknowns: "Willingness to commit, discount sensitivity, and renewal behavior are unknown.", metric: "Paid conversion and 90-day retained revenue", invalidates: "Annual uptake is negligible or discounting reduces retained contribution without improving retention.",
    },
    {
      key: "subscription-credits", title: "Subscription vs credits", pricingModelOverride: "subscription",
      hypothesis: `Credits may fit ${audience} better if value is episodic rather than evenly recurring.`,
      fit: `Stress-tests whether usage of ${product} is continuous enough to justify a subscription.`,
      evidence: [cost, pricing], unknowns: "Usage frequency and repeat-value cadence are not measured.", metric: "Contribution margin and repeat purchase by active user", invalidates: "Credit buyers do not repurchase or subscription users churn before recurring value appears.",
    },
    {
      key: "one-time-recurring", title: "One-time purchase vs recurring", pricingModelOverride: "one_time",
      hypothesis: `A one-time purchase may reduce adoption friction in ${geo}; recurring pricing may better support ongoing costs.`,
      fit: `Tests whether ${audience} perceives continuing or finite value in this product.`,
      evidence: [cost, pricing], unknowns: "No willingness-to-pay interviews or transaction data are connected.", metric: "Contribution margin per acquired user", invalidates: "One-time revenue cannot cover ongoing service cost or recurring value is clearly observed.",
    },
    {
      key: "free-tier-threshold", title: "Free tier threshold",
      hypothesis: "A deliberately limited free tier may create enough product learning without giving away the recurring value users would otherwise pay for.",
      fit: `Relevant when ${product} has a repeatable activation moment that can be experienced before payment.`,
      evidence: [cost, pricing], unknowns: "The activation event, support load, abuse rate, and free-to-paid boundary are unknown.", metric: "Activated free users converting to paid within 30 days", invalidates: "Free users consume meaningful cost without activating, converting, or creating useful learning.",
    },
    {
      key: "trial-paywall", title: "Trial vs no trial",
      hypothesis: "A short, useful trial may make value clear before payment without creating indefinite free usage.",
      fit: `Relevant to the saved use case: ${product}.`,
      evidence: [pricing], unknowns: "Activation moment and time-to-value are not measured yet.", metric: "Trial-to-paid conversion after activation", invalidates: "Trial users fail to reach value or trial access materially increases cost without improving paid conversion.",
    },
    {
      key: "paywall-timing", title: "Paywall timing",
      hypothesis: "Asking for payment after a user experiences one clear unit of value may convert better than an immediate paywall.",
      fit: `Tests where the payment decision should sit inside the journey for ${audience}.`,
      evidence: [pricing], unknowns: "No funnel evidence identifies the strongest activation point.", metric: "Activation-to-paid conversion by paywall position", invalidates: "Later paywalls increase usage cost or abandonment without improving paid conversion.",
    },
    {
      key: "usage-based", title: "Usage-based pricing",
      hypothesis: "Charging in proportion to measurable consumption may align price with cost when usage varies widely between users.",
      fit: `Potentially useful when the operating cost of ${product} rises with requests, processing, storage, or generated output.`,
      evidence: [cost, pricing], unknowns: "Unit cost, usage distribution, predictability preference, and billing complexity are unknown.", metric: "Gross margin per usage unit and paid-user retention", invalidates: "Users strongly prefer predictable pricing or metering complexity outweighs margin benefits.",
    },
    {
      key: "regional", title: "Regional pricing",
      hypothesis: `A locally tested price for ${geo} may convert better than a single global price.`,
      fit: "Geography is venture context, but purchasing-power and tax evidence must be validated before setting a price.",
      evidence: [pricing], unknowns: "Local willingness to pay, taxes, currency fees, and platform rules are unknown.", metric: "Net revenue per eligible visitor by region", invalidates: "Regional variation does not improve net revenue after fees, taxes, or operational complexity.",
    },
    {
      key: "transaction-fee", title: "Transaction fee", pricingModelOverride: "commission",
      hypothesis: "A commission model may align payment with successful transactions if the product directly enables an exchange of value.",
      fit: "Only relevant when the venture meaningfully participates in a transaction; otherwise it should be rejected as a model.",
      evidence: [cost, pricing], unknowns: "Transaction frequency, take-rate tolerance, payment rules, chargebacks, and marketplace dynamics are unknown.", metric: "Net contribution per completed transaction", invalidates: "The product does not control enough transaction value to justify a fee or users bypass the paid flow.",
    },
    {
      key: "ad-supported", title: "Ad-supported free product", pricingModelOverride: "ad_supported",
      hypothesis: "Advertising could remove a consumer paywall only if usage volume and attention are high enough to support the added complexity.",
      fit: `A stress test for ${audience}; not a recommendation without scale and ad-yield evidence.`,
      evidence: [cost, pricing, "No ad-yield evidence is connected."], unknowns: "Impressions, fill rate, geography, ad yield, privacy constraints, and product-quality impact are unknown.", metric: "Net ad revenue per active user versus incremental cost", invalidates: "Usage volume is too low or ads damage activation/retention more than they fund operations.",
    },
  ];
}
