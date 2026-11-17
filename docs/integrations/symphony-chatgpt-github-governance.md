# Lost Legacies Live — Symphony × ChatGPT × GitHub Integration

**Status:** Implementation specification; connector authorization and runtime verification pending  
**Repository:** `JUSCR-FreeForAll/archonfractureback`  
**Base:** `codex/six-segment-interoperability`  
**Working branch:** `codex/symphony-chatgpt-governance`  
**MCP endpoint supplied for setup:** `https://symphony.wix.com/agent/mcp`

## 1. Purpose and non-goals

Define a controlled operating model in which ChatGPT can coordinate work across an explicitly authorized Symphony MCP connection and the separately authorized GitHub repository.

This document is not evidence that the Symphony connector has been installed, authenticated, or tested. Connector creation and approval must be completed by an account owner in ChatGPT settings. The exact tools, scopes, authentication behavior, and resource visibility exposed by Symphony must be inspected after connection; do not infer them from the endpoint alone.

Initial objective: read-only discovery and development coordination. Write operations are introduced only after access tests, least-privilege review, and explicit human approval.

Non-goals for the initial integration:
- No autonomous production deployment.
- No autonomous financial action, payment, token issuance, or transfer.
- No public publication or third-party messaging from private exercises.
- No unrestricted access to Secret Rooms or their content, metadata, attachments, embeddings, exports, or derived logs.
- No automatic merge to `main`, bypass of branch protections, or bypass of CI.
- No claim that a connector or workflow is active until verified by an actual end-to-end test.

## 2. System responsibilities

| System | Responsibility | Boundary |
|---|---|---|
| ChatGPT | Reasoning, research, planning, code review, task coordination | Acts only through connected tools and authorized context |
| Symphony MCP | Workspace-specific operational tools and workflows | Exact capabilities and scopes are unknown until inspected |
| GitHub | Source control, issues, pull requests, commits, CI evidence | Separate authorization; protected branches and review gates remain authoritative |
| Human operator | Approval, ownership, consent, release decisions | Required for consequential or irreversible actions |

The connector direction is ChatGPT connecting to Symphony using the supplied MCP endpoint. This is not a connector installed inside Symphony to make ChatGPT available there.

## 3. Connection and discovery procedure

1. In ChatGPT settings, open Apps / Connectors (the exact UI label may vary).
2. Enable developer mode if the account requires it for custom MCP connectors.
3. Add the custom connector endpoint: `https://symphony.wix.com/agent/mcp`.
4. Review the authentication flow, requested permissions, data access, and any write capabilities before approving.
5. Do not approve broad permissions merely to make setup succeed. Stop if scopes are unclear or exceed the intended pilot.
6. After connection, enumerate the actual tools/resources/prompts exposed by Symphony and record:
   - exact tool name and description;
   - read/write classification;
   - required arguments and resource scope;
   - authentication/identity model;
   - whether a tool can publish, message, delete, invite, change permissions, or trigger external workflows;
   - error and audit behavior.
7. Test a harmless read-only operation against a non-sensitive test workspace.
8. Test denial against an unauthorized or out-of-scope resource.
9. Do not enable write tools until the permission matrix and approval behavior have been reviewed.

A successful connector authorization is not proof of least privilege, correct resource isolation, or safe behavior. Those require explicit tests.

## 4. Initial permission policy

Use the narrowest available resource and action scopes. If Symphony cannot separate read and write permissions, treat that as a blocker for enabling it in the initial pilot.

| Resource/action | Initial policy |
|---|---|
| Public or explicitly approved project documentation | Read allowed |
| Workspace/project metadata | Read allowed only for named test/project workspaces |
| Workflow catalog and execution status | Read allowed |
| GitHub repository metadata, branches, issues, PRs | Read via separately authorized GitHub connection |
| GitHub feature branch writes | Disabled initially; later PR-based only with approval |
| GitHub default/protected branch writes | Prohibited for agent workflows |
| Secret Room content and derivatives | Deny by default; no indexing, retrieval, export, or summarization |
| Identity, membership, invitation, and permission administration | Human-admin only |
| External messages, publication, webhooks, and public releases | Explicit human approval for each action |
| Payments, credits, tokens, investments, or transfers | Outside agent authority; separate legal, security, and human approval |
| Production deployment and infrastructure changes | Explicit human release approval; never autonomous |

The user’s Time Model / Energy-Economy insertion specification requires the first prototype to remain private and reversible. Sharing, financial activity, and external deployment are separate authorization gates. This integration must preserve those gates.

## 5. GitHub repository and branch policy

Repository: `JUSCR-FreeForAll/archonfractureback`

The repository's currently reported default branch is `workit`. The integration must not assume `main` is the default branch or silently change repository policy.

Known project refs to preserve:
- `integration/phase-0-baseline`: reported working Time Engine baseline.
- `integration/phase-0-1-foundation`: reported foundation work requiring repair/validation.
- `codex/six-segment-interoperability`: existing interoperability work.
- `codex/symphony-chatgpt-governance`: this isolated integration-spec branch.

Before implementation, verify each branch still exists and inspect its head commit. Branch names and historical descriptions are not substitutes for current repository state.

Rules:
1. Never force-push or rewrite shared history as part of routine agent work.
2. Never merge directly to the default branch.
3. Make changes on a dedicated feature branch.
4. Open a pull request with scope, rationale, test evidence, security impact, and rollback notes.
5. Require CI to pass and human review before merge.
6. Preserve the working Time Engine baseline; do not use it as a scratch branch.
7. Treat the Secret Room safety gate (reported as Issue #2 in project history) as a release blocker until its current state and acceptance criteria are verified. Do not assume issue state from prior summaries.

## 6. Standard operating workflows

### Workflow A — Read-only project reconnaissance
1. Operator names the repository/workspace and task.
2. ChatGPT reads only authorized metadata and files.
3. Symphony may provide project/workflow context only within its verified scope.
4. ChatGPT reports observed facts, unknowns, and proposed next steps separately.
5. No writes occur.

### Workflow B — Proposed code change
1. Inspect current branch, base SHA, relevant files, tests, and open PRs/issues.
2. Prepare a change plan and identify security/data implications.
3. Create or use a dedicated feature branch from a verified base.
4. Make the smallest scoped change.
5. Run relevant lint, type, unit, integration, security, and build checks in the repository's supported environment.
6. Report exact commands and results; never claim a check ran if it did not.
7. Open a draft PR for review. Do not merge.

### Workflow C — Symphony operational action
1. Inspect the exact tool schema and target resource.
2. Classify the operation as read-only, reversible write, external side effect, or irreversible/high impact.
3. For writes and external side effects, present target, payload/summary, expected impact, and rollback/compensation plan.
4. Wait for explicit operator approval for that specific action.
5. Execute once, capture the returned result, and verify the resulting state independently where possible.
6. Record a minimal audit event without copying sensitive payloads.

### Workflow D — Secret Room and participant contribution
1. Private by default; no cross-workspace discovery.
2. A participant can create, revise, keep private, export, or request deletion of their own contribution under documented controls.
3. Optional Half-Positive and Half-Negative review lenses are non-diagnostic prompts, not autonomous actors or decision-makers.
4. No AI persona can impersonate a participant or treat inferred agreement, silence, or a relay as consent.
5. Sharing requires item-specific, purpose-specific, informed consent.
6. Private exercises cannot trigger messaging, publication, payment, token issuance, or blockchain transactions.
7. Never send private narrative content to Symphony, ChatGPT, logs, embeddings, or external systems unless a separate, explicit, informed data-sharing decision authorizes that exact flow.

## 7. Tool-to-permission mapping

Populate this table only after the Symphony connector exposes its actual tool inventory. Do not invent Symphony tool names.

| Actual Symphony tool | Resource scope | Read/write | External side effect | Approval | Test evidence |
|---|---|---|---|---|---|
| Pending discovery | Pending | Unknown | Unknown | Not authorized | Not tested |

For GitHub, the separately connected GitHub integration may be used for repository inspection and feature-branch/PR work. Its permissions do not imply Symphony permissions, and vice versa.

## 8. Audit event requirements

For each approved consequential action, record a minimal event:
- `event_id`
- `timestamp`
- `actor_id` / actor type
- `system` (ChatGPT, Symphony, GitHub, CI, human)
- `tool_or_operation`
- `resource_ref`
- `action_class` (read, reversible_write, external_side_effect, irreversible)
- `approval_ref` and approver
- `result` (success, failure, denied, unknown)
- `correlation_id`
- `integrity_digest` where appropriate

Do not store access tokens, credentials, private narrative content, full sensitive payloads, or personal data in audit logs. A SHA-256 digest can support integrity checking but does not prove authorship, authorization, or truth by itself. Keep identity, provenance, consent scope, and integrity as separate concepts.

## 9. Required acceptance tests

### Connector
- [ ] Owner explicitly authorizes the custom connector.
- [ ] Actual MCP tool/resource inventory is captured.
- [ ] Authentication identity and requested scopes are understood.
- [ ] Read-only access to a designated test workspace succeeds.
- [ ] Out-of-scope resource access is denied.
- [ ] Write-capable tools are disabled or blocked during the read-only pilot.
- [ ] Revocation prevents subsequent access.

### GitHub
- [ ] Repository and default branch are verified from live metadata.
- [ ] Target branch heads are verified before use.
- [ ] Agent changes are isolated to a feature branch.
- [ ] Protected/default branch cannot be modified through the workflow.
- [ ] CI failure blocks promotion.
- [ ] Pull request includes test evidence and rollback notes.
- [ ] No automatic merge occurs.

### Privacy and safety
- [ ] Secret Room content and derivatives are inaccessible to both connector paths by default.
- [ ] Unverified speaker labels cannot satisfy authentication or consent checks.
- [ ] Private reflection cannot trigger external messaging, publication, payments, or transfers.
- [ ] Consent is explicit, purpose-specific, and recorded separately from provenance.
- [ ] Revocation and deletion paths are documented and tested, subject to disclosed legal retention requirements.
- [ ] Logs do not contain sensitive narrative content or credentials.

### Operations
- [ ] Each write requires approval specific to the target and action.
- [ ] External and irreversible actions require an additional explicit approval gate.
- [ ] Failure, timeout, duplicate request, and retry behavior are tested.
- [ ] Idempotency is used for operations where duplicate execution could create duplicate records or transfers.
- [ ] An operator can stop the workflow and revoke connector access.

## 10. Rollout gates

**Gate 0 — Setup:** owner installs connector and reviews permissions. No agent writes.

**Gate 1 — Read-only pilot:** inventory tools, test a non-sensitive workspace, verify denial behavior, and document evidence.

**Gate 2 — GitHub development pilot:** read repository state and prepare a feature-branch PR; CI and human review remain mandatory.

**Gate 3 — Limited Symphony writes:** only specific reversible operations with explicit per-action approval, audit, and rollback.

**Gate 4 — Product integration:** only after privacy/security tests pass; begin with synthetic data and private, reversible workflows.

No gate is considered passed based on a plan or configuration screenshot alone; retain test evidence.

## 11. Open dependencies and blockers

- Symphony connector has not yet been installed or authorized in the user's ChatGPT account.
- Symphony's actual MCP tool inventory and scopes are not yet observable.
- Exact resource-level permission controls must be confirmed after connection.
- Repository branch and issue state must be rechecked at implementation time.
- Secret Room isolation requires technical tests, not just policy text.
- CI/test commands and deployment controls must be verified from the repository before claiming operational readiness.

## 12. Operator handoff checklist

- [ ] Add `https://symphony.wix.com/agent/mcp` as a custom connector in ChatGPT.
- [ ] Enable developer mode if required.
- [ ] Review and approve only understood, least-privilege scopes.
- [ ] Confirm the connector shows as connected.
- [ ] Return to this integration task and inspect the exposed tool inventory.
- [ ] Complete Gate 1 before enabling any writes.

**Security principle:** Connect the intelligence, preserve the boundaries, and require authorization for consequential actions.
