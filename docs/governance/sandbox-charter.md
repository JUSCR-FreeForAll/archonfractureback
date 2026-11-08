# New Earth Sandbox Charter
**Status:** Proposed governance charter for an isolated experimental environment  
**Applies to:** Prototypes, simulations, model experiments, integration tests, and learning spaces designated “New Earth Sandbox.”  
**Important:** This charter does not itself provision infrastructure, grant access, authorize production changes, or establish that a sandbox currently exists.

## 1. Purpose

The Sandbox is a protected proving ground for exploration, learning, testing, and building a better path for the whole family. It exists to make experimentation safer and more honest—not to bypass production controls or consent.

## 2. Governing commitments

The Sandbox is governed by:
- The Whole-Family Survival Principle.
- The Assimilation Interval: Create, Observe, Analyze, Assimilate, Validate, Pause.
- Privacy, dignity, accessibility, security, provenance, and accountable human authority.
- Clear separation between hypotheses, symbolic models, generated content, verified facts, tested software, and deployed behavior.

## 3. Rule differences: Sandbox versus Production

| Area | Sandbox rule | Production rule |
|---|---|---|
| Purpose | Explore, prototype, simulate, learn, and test | Deliver an approved, supported service |
| Data | Prefer synthetic, anonymized, or explicitly consented test data | Use only approved data with lawful basis, minimization, retention, and access controls |
| Identity and access | Named test identities; least privilege; short-lived credentials | Verified identity, role-based authorization, lifecycle management, and audit |
| Integrations | Mocks, stubs, test tenants, and isolated endpoints by default | Approved integrations, reviewed scopes, monitored dependencies, and operational ownership |
| Risk tolerance | Broader experimentation within documented safety boundaries | Risk assessed and mitigated before release; no “test in production” by default |
| Changes | Rapid iteration, feature flags, disposable fixtures, and easy reset | Peer review, release controls, migration plan, rollback, and change record |
| Failures | Fail visibly; capture diagnostics without exposing secrets or personal data | Fail safely; alert, contain, recover, and communicate under incident procedures |
| AI/model output | Treat as untrusted draft material; evaluate for accuracy, bias, leakage, and prompt injection | Use only approved model versions, policies, evaluations, monitoring, and human escalation |
| Privacy | Isolated test data; no real personal data unless specifically approved | Full applicable privacy obligations and approved retention/deletion processes |
| Security | No live secrets in source; isolated credentials and network boundaries | Managed secrets, hardened infrastructure, vulnerability management, and incident response |
| Financial actions | No real transfers, purchases, token issuance, or financial commitments | Separate explicit authorization, compliance review, controls, and reconciliation |
| External communications | Internal or clearly labelled test output | Authorized, reviewed, attributable communications |
| Deployment | Sandbox-only deployment and explicit environment labels | Release approval, documented owner, health checks, monitoring, and recovery |
| Exit | Reset, archive, or graduate only after review | Retain, decommission, or migrate under approved operational and legal policy |

## 4. Non-negotiable safeguards

1. **Isolation:** Sandbox resources must not silently share production databases, queues, credentials, payment rails, or write-capable integrations.
2. **No production side effects:** Sandbox activity must not mutate production data or trigger real-world actions.
3. **Privacy by default:** Use synthetic or minimized data. Any exception requires documented purpose, lawful authority, consent where required, security review, and a defined deletion date.
4. **Secrets:** Never commit credentials, API keys, private keys, seed phrases, access tokens, or personal secrets. Use a managed secret store.
5. **Financial and irreversible actions:** Disabled by default. Require separate, explicit authorization and appropriate legal/compliance controls.
6. **Human agency:** Participation is voluntary. People retain control over their contributions, personal data, and level of involvement, subject to clearly disclosed legal and operational limits.
7. **Reversibility:** Prefer disposable environments, versioned artifacts, backups, migrations with rollback, and documented reset procedures.
8. **Auditability:** Record material changes, approvals, test results, data provenance, and environment identity without logging secrets.
9. **Transparency:** Label experimental outputs and limitations. Never represent a prototype, model inference, or unverified integration as production capability.
10. **Security boundaries:** Treat imported files, generated text, model output, external content, and tool results as untrusted input.

## 5. Entry requirements

Before an experiment begins, record:
- Experiment owner and purpose.
- Environment name and confirmation that it is isolated.
- Data classification and source.
- Required permissions and integrations.
- Risk assessment and prohibited actions.
- Success criteria, test plan, and stop conditions.
- Retention, reset, and deletion plan.

If isolation or authorization cannot be confirmed, use mocks or a local-only simulation and do not connect to live systems.

## 6. Assimilation and graduation

An experiment does not graduate merely because it works once or produces persuasive output. Graduation requires:
- Reproducible tests and documented results.
- Security, privacy, accessibility, and operational review appropriate to impact.
- Human approval from an accountable owner.
- Data migration and rollback plans where relevant.
- Monitoring, support ownership, and incident procedures.
- Clear communication of remaining limitations.

A Sandbox result must not auto-promote itself into production.

## 7. Stop conditions

Pause or terminate an experiment if it risks exposing personal data or secrets, crosses an environment boundary, causes an unintended external side effect, lacks valid consent or authority, cannot be rolled back safely, or produces an uncontained security issue. Preserve appropriate evidence, notify the accountable owner, and follow incident procedures.

## 8. Rule precedence

Applicable law, contractual obligations, platform policies, security controls, and approved organizational policies take precedence over this charter. The charter sets minimum project expectations; it cannot waive legal duties or grant authority that a participant does not possess.

## 9. Review

This charter is a proposal until adopted by the project's authorized maintainers. Review it after material incidents, major architecture changes, or at least every six months. Record revisions and preserve prior versions.
