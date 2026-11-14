# Eternal Vault Attestation and Phoenix Operations

## Existing attestation endpoint

The branch already contains `app/api/attestation/verify/route.ts`. It validates that `baseAddress`, `solanaPatron`, `signature`, `nonce`, and `timefuxSignature` are non-empty strings and calls `verifyAndStoreAttestation`. Keep the on-chain ritual signature mandatory: do not introduce a `manual_attestation` fallback. The verification helper must independently validate the Base signature, nonce ownership/expiry/one-time consumption, Solana patron binding, and TimeFux on-chain evidence, and persist the result transactionally.

Before production exposure, ensure the route/helper also enforce request-size limits, rate limiting, strict address/signature formats, origin/CSRF policy appropriate to the authentication design, generic client-facing errors, and server-side logging that does not leak signatures or secrets. Map known validation failures to 400/401/409 as appropriate; unexpected failures should return 500 rather than being mislabeled as conflicts. Never trust a client-supplied status.

## Wagmi / Coinbase Smart Wallet

`app/providers.tsx` provides Wagmi on Base with Coinbase Smart Wallet and injected connectors plus a stable TanStack QueryClient. Import `Providers` into the actual root layout used by this Next.js app and wrap the application tree. The repository's active layout path must be confirmed before editing it (it may be `src/app/layout.tsx` rather than `app/layout.tsx`). Install compatible versions of `wagmi`, `viem`, `@tanstack/react-query`, and React before building.

For production, configure a trusted Base RPC URL via `NEXT_PUBLIC_BASE_RPC_URL` or use the provider's default. Public RPC URLs are visible to browsers; do not put private API credentials in a client-exposed variable.

## Phoenix heartbeat

`monitor/src/healthcheck.ts` implements best-effort Healthchecks.io and Uptime Kuma Push notifications. Wire it into the monitor's existing heartbeat loop only after a successful `getSlot("confirmed")`; send a failure ping on RPC errors and then invoke the existing reconnect strategy. Prevent overlapping interval executions (for example, with an in-flight guard), clear intervals during shutdown, and ensure a single transient monitoring-endpoint failure never crashes the monitor.

Example integration inside the existing heartbeat callback:

```ts
const startedAt = performance.now();
try {
  if (!this.connection) throw new Error("No active RPC connection");
  const slot = await this.connection.getSlot("confirmed");
  await pingDeadManSwitch({
    ok: true,
    latencyMs: performance.now() - startedAt,
    message: `slot=${slot}`,
  });
} catch (error) {
  await pingDeadManSwitch({
    ok: false,
    message: error instanceof Error ? error.message : "RPC heartbeat failed",
  });
  this.scheduleReconnect();
}
```

## Build and deployment

- Workflow: `.github/workflows/deploy-phoenix.yml`; triggers on monitor changes to `main` and manual dispatch.
- Dockerfile: `monitor/Dockerfile`; multi-stage Node 22 Alpine build, production dependencies only, non-root runtime.
- Compose example: `deploy/phoenix/compose.yaml`; copy to `/opt/phoenix/compose.yaml` on the host.
- Store runtime secrets in the VPS-only `/opt/phoenix/.env` with mode 0600. Never commit that file.
- Configure GitHub Actions secrets: `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`, optional `VPS_PORT`, and `GHCR_READ_TOKEN` (a narrowly scoped token with package read access for the deployment host).
- Ensure the GHCR package grants that token read access and the repository/package names match the generated image path.
- The deployment directory must contain the compose file and runtime `.env`; Docker must be installed and the deploy user authorized to run it.

## Uptime Kuma Docker monitoring

Prefer a Docker socket proxy over mounting the Docker socket directly into an internet-exposed Uptime Kuma instance. A read-only bind mount does not make the Docker API read-only: a process with access to the socket can often issue privileged daemon API requests. If using a socket proxy, keep it on a private internal network, allow only the required read-only container endpoints, and disable POST operations. Restrict Uptime Kuma itself behind VPN, SSO, or an IP allowlist.

## Operational acceptance checklist

- [ ] Install dependencies and run TypeScript checks in `monitor/`.
- [ ] Build the Docker image locally and verify the entrypoint exists.
- [ ] Confirm heartbeat success and failure behavior against a test monitor.
- [ ] Test RPC outage, reconnect, process restart, and graceful shutdown.
- [ ] Verify GHCR image pull and VPS deployment using a read-only package token.
- [ ] Confirm the running container is non-root, read-only, and has dropped capabilities.
- [ ] Validate the real root layout path and complete a production build.
- [ ] Run integration tests for nonce replay, expired nonce, wrong signer, wrong Solana patron, invalid TimeFux signature, duplicate attestation, and concurrent submissions.

This commit adds deployment and integration assets; it does not itself deploy infrastructure, configure secrets, prove runtime behavior, or certify the system as production-ready.
