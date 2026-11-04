# Lost Legacies Live — Research and Validation Plan

## Purpose

Convert the strategic claims in the investor narrative into diligence-grade evidence. The research work should validate the market, competitive position, technical economics, product demand, and IP position before the claims are used in fundraising.

## Workstream A — Market and competitor evidence

Research local-first and sync infrastructure, including SQLite/WASM client storage, CRDT frameworks, offline-first application platforms, semantic interoperability, and agent tool security.

For each named company or project, capture:
- primary-source announcement and publication date;
- exact transaction or financing event, if any;
- what technology or team actually changed hands;
- relevance to Lost Legacies Live's customer and product thesis;
- limits of the comparison.

Do not state that ElectricSQL joined Databricks, or characterize any Zed Industries or Spacedrive financing, without a current primary source confirming the precise event and wording. Separate acquisitions, partnerships, product integrations, and funding rounds.

## Workstream B — Customer discovery

Interview representative users and buyers from the six portfolio segments. Identify one initial beachhead rather than assuming all six can launch together.

Questions to validate:
- What workflow is painful today and how often does it occur?
- What is the cost of downtime, data loss, fragmented identity, or repeated data entry?
- Is offline operation a must-have or a nice-to-have?
- What data must remain local or under participant control?
- Who approves purchase and what budget already exists?
- What alternative is used today, and what would trigger switching?

Capture interview consent and avoid treating expressions of interest as purchase commitments.

## Workstream C — Technical benchmark

Compare the current server-centric workflow against the local-first prototype using identical operations and representative devices.

Report:
- device and OS, dataset size, network profile, and sample count;
- p50/p95/p99 local write/read latency;
- sync throughput and convergence time;
- duplicate/replay rejection and conflict rates;
- server CPU, database load, storage, bandwidth, and cost per active user/action;
- battery and memory impact;
- recovery behavior after extended offline periods.

The 70–80% client execution, 75% cloud-cost reduction, sub-millisecond writes, and sub-2ms verification figures are hypotheses until measured. Publish raw test conditions and reproducible scripts.

## Workstream D — Security and compliance readiness

Commission a threat-model review covering compromised clients, malicious sync payloads, tenant isolation, consent revocation, audit tampering, MCP tool abuse, and data egress.

Map controls to relevant frameworks only after determining applicability. Distinguish:
- architecture designed to support controls;
- controls implemented and evidenced;
- independent assessment completed;
- formal certification or attestation obtained.

Do not imply SOC 2 or HIPAA compliance based solely on technical design.

## Workstream E — IP and corporate diligence

Create an asset register covering:
- repositories, branches, contributors, and commit history;
- employment/contractor invention assignments;
- open-source dependencies and licenses;
- product names, marks, domains, and third-party content;
- schema and protocol ownership;
- AI-generated or externally supplied material and applicable terms.

Confirm ownership and rights before describing strategic IP as exclusively owned or licensable.

## Workstream F — Fundraising model

Build a 24-month model with:
- headcount and fully loaded compensation;
- infrastructure, security, legal, and support costs;
- product-specific launch costs;
- pricing, conversion, churn, transaction volume, and gross margin assumptions;
- pilot-to-paid conversion assumptions;
- base, upside, and downside scenarios;
- runway and milestone-based capital releases.

The proposed $2.0M allocation is an illustrative planning scenario. Validate each category against hiring and vendor plans.

## Deliverables and gates

| Gate | Evidence required | Decision |
| --- | --- | --- |
| G1 — Thesis | Primary-source market research and 15–25 discovery interviews | Select beachhead |
| G2 — Technical | Two-client offline sync demo, regression tests, benchmark report | Approve pilot architecture |
| G3 — Trust | Threat model, privacy review, control evidence, IP register | Approve controlled pilot |
| G4 — Commercial | Qualified design partners, pricing tests, paid conversion evidence | Approve scale investment |
| G5 — Fundraise | Financial model, diligence room, verified claims, ownership review | External investor release |

A research result should include source, date, methodology, confidence, and implications. Unsupported claims should be removed or explicitly labeled as hypotheses.
