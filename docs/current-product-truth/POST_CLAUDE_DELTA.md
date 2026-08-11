# Post-Claude Product Delta

Status: accepted into the authoritative product truth on 2026-08-11.

## Traceability

- Baseline before delta: repository commit `6de4a70`.
- Source supplied by product owner: `pasted-text.txt`, attachment ID `47970d3b-aa6a-411d-afcc-97cca30d3ce4`.
- The verbatim UTF-8 text follows. Formatting is preserved as Markdown; no requirements have been added.
- Reconciliation: stable intent is merged into the seven companion documents. Current implementation is still labeled separately from newly required and future behavior.

## Verbatim product-owner delta

POST-CLAUDE PRODUCT DELTA
1. Immediate objective

The highest-priority deliverable is a presentation-ready, web-based working prototype within the next couple of days.

It must feel like a coherent real product, not disconnected feature pages.

Requirements:

all important screens present
all major links/CTAs work
no dead navigation
consistent visual system
responsive desktop/mobile
polished enough to present externally
representative/demo data may be used only when clearly distinguished from live evidence
no fake claims that something is live when it is not

The presentation prototype and production architecture should follow the same product model so the prototype is not throwaway work.

2. Core product principle

Venture Sandbox is an AI Venture Intelligence Platform / Startup Flight Simulator for:

ordinary people with an app idea
vibe/AI coders
no-code builders
creators/designers/freelancers/students
serious founders/professionals

Product principle:

Expert-level intelligence underneath. Beginner-level simplicity on top.

Default language must avoid startup jargon.

Advanced technical detail belongs in System View or evidence detail.

3. Canonical user journey

The product must feel like one connected venture journey:

Idea → Clarify → Understand → Shape → Monetize → Simulate → Build → Learn

Simple navigation should remain calm.

Default venture-stage navigation:

Understand
Shape
Simulate
Build
Learn

Monetization should sit naturally between Shape and Simulate without cluttering top-level navigation.

Multiple journey profiles remain valid:

Quick Launch / Vibe Coder
Guided Builder
Startup / Professional
Learner / Student

Same underlying venture engine, different UX depth.

4. Product continuity rule

Every module must use the same venture context.

Research → Shape → Monetization → Simulator → Build Studio → Learn must not behave like separate mini-products.

Data captured once should be reused downstream:

idea
category
geography
audience
problem
MVP scope
differentiation
pricing model
technical requirements
cost assumptions
research evidence
uncertainty

Do not ask the user to repeatedly re-enter information already known.

5. Research and evidence

Research should eventually synthesize:

App Store / Google Play
YouTube creator/build intelligence
recent videos
transcripts where lawfully/technically obtainable
comments where useful
competitor websites/pricing
reviews
GitHub
Hugging Face / model hubs
official APIs/docs/changelogs
World Bank/government data
academic papers
Product Hunt/startup communities
broader relevant web/community signals

Core evidence principle:

Answer → synthesis → finding → evidence → original source

Evidence must preserve:

source
URL
date
freshness
claim type
contradictions
confidence
state such as LIVE / PARTIAL / DEMO / UNAVAILABLE

Claim types should distinguish:

fact
source claim
observation
inference
assumption
hypothesis

Never fabricate:

revenue
downloads
market share
percentages
conversion
“success probability”
competitor traction numbers

Missing evidence must remain missing.

6. Research UX

Beginner-facing Research should group intelligence into:

People & alternatives
Can it be built?
Market & money
Reasons to be careful

System View can expose:

source-level status
agents
contradictions
evidence weighting
technical internals

Research progress should eventually reflect real work, not cosmetic timers.

7. YouTube / Creator Intelligence

This is a core strategic source, not an unrelated side feature.

Intended behavior:

monitor approximately 50–100+ curated relevant channels
prioritize recent videos, roughly last 5–7 days
extract:
what was built
why
tools/APIs/models
build time
cost
hosting/API cost
users/downloads/revenue claims
distribution/marketing
what worked
what failed
new workflows/capabilities

Founder/creator claims must remain labeled as claims unless independently corroborated.

Official YouTube metadata/comments can be used where available.

Transcript acquisition must use a replaceable router:

authorized/public/licensed transcript
creator/user-supplied transcript
provider later
browser-assisted/experimental route only where appropriate

Do not warehouse unnecessary full copyrighted transcripts.

Creator intelligence should eventually feed:

Research
Compare
Shape
Technology
Simulator
Build Studio
8. Review intelligence

Competitor reviews remain a core requirement.

Review acquisition must support replaceable adapters.

Output should cluster:

complaints
praise
requests
bugs
pricing/paywall issues
onboarding issues
missing features

No cluster percentages unless calculated from an actual retrieved sample.

9. Technology & Ownership Intelligence

For each venture, identify:

required capabilities
hosted APIs
free tiers
open-source/self-hostable alternatives
local/downloadable models
GitHub/Hugging Face options
licenses
commercial restrictions
maturity/activity/docs
vendor lock-in
privacy
recurring cost
replacement difficulty
browser/local/VPS/GPU/cloud implications

Recommend separately:

fastest MVP
lowest recurring cost
best long-term ownership
balanced option

Do not disguise a fixed stack as a researched recommendation.

10. Monetization Lab

Monetization is now a first-class module.

It should be market-aware Monetization Intelligence, not a generic paywall suggestion page.

Inputs may include:

region/country
category
audience
product function
frequency of use
competitor pricing
competitor paywall patterns
pricing-related reviews
similar-app monetization
acquisition channel
AI/API operating cost
infrastructure cost
Shape-selected pricing model
simulation behavior
real outcomes later

It should generate context-aware experiments such as:

monthly vs annual
subscription vs credits
free-result limit
trial vs no trial
first-value moment before paywall
regional pricing
one-time purchase vs recurring
feature gating
usage gating

Every experiment must include:

hypothesis
why it fits this venture
evidence supporting it
assumptions/unknowns
metric that determines the winner

Monetization experiments should feed the Simulator.

After launch, real experiment outcomes should feed Learn and later recalibrate future simulations/recommendations.

Inspiration source:
paywallexperiments.com / Superwall pattern:

historical experiments → AI pattern extraction → suggested experiment → real outcome → learning loop

Venture Sandbox should apply this at a broader market/context level.

11. Simulator

Simulator remains the flagship differentiator.

It is a persistent venture state machine, not a calculator or short wizard.

It must never collapse into a 3-click or 5-second experience.

Conceptual stages:

setup
resource planning
build
build blocker/event
readiness
pre-launch
launch
first users
activation/retention
user/market event
adaptation
week/month progression
outcome
checkpoint
rewind
alternative timeline

Earlier decisions must cause later consequences.

Example:

“You skipped onboarding testing earlier. This may be contributing to weak activation now.”

Simulator state should eventually include:

virtual day/week
cash
time
build progress
quality
technical debt
launch readiness
awareness
reach/impressions
visits
signups
activated
returning
paying
revenue
costs
support load
market/competition
uncertainty

Simulation should use actual venture context:

category
geography
audience
competition
technology cost
monetization model
V1 scope
relevant research evidence
uncertainty

No universal success probability.

Time compression is allowed, but user decisions/events must remain meaningful.

Bounded fast-forward is preferred over instant completion.

12. Compare

Three conceptual comparison modes remain:

Idea vs Idea
Your Idea vs Existing Products
Competitor vs Competitor

No single winner score.

Compare equivalent dimensions using real evidence:

demand
competition
recent entrants
technical difficulty
cost
recurring use
monetization
distribution
differentiation
ownership/lock-in
region/market
uncertainty
simulation results
build cost
real outcomes where available
13. Build Studio

Builder-neutral.

Outputs should eventually include:

product definition
V1 scope
user stories
screens/flows
DB schema
APIs/models
stack options
open-source alternatives
hosting
cost
security
acceptance criteria
implementation order
AI-builder prompt package
developer handoff

Must clearly distinguish:

evidence-backed recommendation
idea-specific heuristic
default/reference assumption
14. Learn / Monitor

Must distinguish:

SIMULATED outcome
REAL outcome

Real outcomes should eventually recalibrate:

future simulations
monetization recommendations
pricing assumptions
retention assumptions
channel assumptions
build priorities

Monitoring should eventually support automatic checks for:

competitors
YouTube/creator signals
technology changes
market changes
15. Temporal decision

Temporal.io was evaluated.

Decision:

Do not integrate Temporal now merely for sophistication.

Current repo does not yet have enough long-running orchestration complexity to justify the infrastructure.

Keep workflow boundaries clean so Temporal or another orchestration layer can be introduced later.

Strong future Temporal candidates:

long-running Research Missions
multi-source retries/resume
specialist-agent fan-out/fan-in
automated Monitoring
potentially simulator orchestration if autonomous progression is added

Simulator persistence itself does not require Temporal because database persistence already solves resume-on-return.

16. Multi-model GPT / Claude / Gemini discussion

A separate product idea was explored around using GPT, Claude and Gemini together.

The important lesson for Venture Sandbox:

Multi-model access alone is not a moat.

Users can already manually copy/paste across models.

Value comes from:

orchestration
model routing
persistent context
evidence
workflow automation
synthesis
reducing manual cross-checking

Venture Sandbox may eventually use different models internally for specialist work, but:

this is not required for launch
the product should not depend on all providers
model-provider choice should remain replaceable

Do not turn Venture Sandbox into a generic “three AI chats in one screen” product.

17. Multi-agent architecture

Long-term specialist roles may include:

User Pain
Competitor
Similar Apps
Creator Signals
Technology
Market
Monetization
Red Team

Fan-in should consider:

source quality
source independence
freshness
directness
corroboration
contradictions
category/geographic relevance

Do not calculate truth by simply counting agent agreement.

This is future architecture unless/until implemented.

18. Free-first infrastructure

The project should remain compatible with a $0/very-low-cost starting strategy.

Prefer free/public sources where practical.

Paid market-intelligence tools are optional enrichment, not mandatory launch dependencies.

Current development workflow:

GitHub = permanent source of truth
Codex = primary implementation engineer
ChatGPT = product/architecture/UX authority
Vercel = web deployment/preview where available
Supabase = database/auth/backend

Codespaces/local development are development environments only, not production hosting.

19. Definition of “implemented”

This is non-negotiable.

A feature is implemented only when:

the user can perform the action
the action changes state
state persists where required
downstream behavior changes where required

Otherwise label it honestly:

UI-only
partial
demo
credential-required
unavailable
future

Never say:

“complete”
“fully connected”
“live”

unless that is actually true.

20. UX quality requirements

Avoid:

enterprise-looking clutter
overly technical default screens
dense sidebars
generic dashboards
arbitrary scores
fake progress
unexplained numbers
decorative complexity

Prefer:

simple hierarchy
strong typography
calm navigation
progressive disclosure
visual evidence summaries
clear states
strong charts only when useful
obvious next action
21. Presentation prototype priority

Before the production system is fully deepened, there must be a complete presentation experience covering:

Home
My Ideas
Explore
Idea entry
clarification
Research progress
Research summary
Competitors
Reviews
Creator/YouTube intelligence
Technology & Ownership
Evidence Explorer
Shape Version 1
Compare
Monetization Lab
Simulation setup
Build stage
Launch stage
First users
retention
market event
Month 1
Build Studio
Learn / Monitor
System View
account/plans/methodology where relevant

Every major link should work.

22. Final instruction

Update all eight files in docs/current-product-truth/ so this delta is incorporated into the authoritative product truth.

Specifically:

place the raw/traceable delta in POST_CLAUDE_DELTA.md
merge stable product intent into MASTER_PRODUCT_TRUTH.md
update journey/screens in USER_JOURNEY_AND_SCREEN_MAP.md
update sources/trust rules in RESEARCH_AND_EVIDENCE.md
update simulation requirements in SIMULATOR.md
fully define the new module in MONETIZATION_LAB.md
reflect Temporal/multi-model/free-first decisions in TECHNICAL_ARCHITECTURE.md
update priorities and presentation deadline in CURRENT_ROADMAP.md

Do not modify app code.

After updating:

show a concise summary of what changed in each document
list any contradictions between current code and current product truth
commit the documentation changes to the current Codex takeover branch
return the commit SHA
