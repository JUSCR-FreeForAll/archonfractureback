# Mesh event integration notes

These files add a typed event contract, a Fastify route seam, a client-side state digest helper, and a namespaced localStorage helper.

## What is included

- `library/schemas/mesh-event.jsonld` — JSON-LD context terms for the JUSCR mesh event payload.
- `src/mesh/event-contract.ts` — Zod validation for the CloudEvents 1.0 structured event envelope.
- `src/routes/mesh.ts` — Fastify route registration that delegates security and durable persistence to an injected adapter.
- `src/client/mesh-events.ts` — browser-side deterministic JSON digest and event emitter.
- `src/client/storage.ts` — namespaced localStorage helper.

## Integration

Register the route from the existing `src/index.ts` Fastify instance, not by creating a second Fastify server:

```ts
import { registerMeshRoutes } from "./routes/mesh.js";

await registerMeshRoutes(app, {
  verifyAndPersist: async (event) => {
    // Connect this to the durable adapter only after it implements:
    // authorization, consent-scope validation, idempotency, canonical
    // state-hash verification, and append-only audit persistence.
    throw new Error("Mesh persistence adapter is not configured");
  }
});
```

The adapter intentionally fails closed until those checks and durable storage exist. Do not replace the throwing adapter with a stub that echoes the client-provided hash.

## Important corrections to the supplied draft

1. CloudEvents already uses `type` for the event type. The JSON-LD context is separate and must not add a second conflicting `type: "CloudEvent"` field.
2. CloudEvents `id` is a non-empty string; it is not restricted to UUID format. UUIDs remain a good client-generated choice.
3. The original route created a new Fastify app and a separate Pino logger. This repository already has a configured Fastify instance; register a route plugin on that instance and use `request.log`.
4. A server cannot call a client hash "verified" merely by echoing it. The server must recompute/verify against a trusted canonical state or a verifiable transition, and must enforce authorization and consent before durable audit persistence.
5. The original `JSON.stringify(state, Object.keys(state).sort())` replacer does not recursively canonicalize nested objects. The helper here recursively sorts object keys for JSON-compatible state. For cross-language consensus, adopt a formally specified canonicalization standard such as RFC 8785 and test identical vectors across every client and server implementation.
6. Do not log the full mutation payload by default. It may contain private user state, personal data, or secrets.
7. The storage helper covers localStorage only. IndexedDB databases and object stores need a separately designed migration and namespace strategy; object-store names are not interchangeable with localStorage key prefixes.
8. The event emitter uses a relative endpoint by default. Configure an absolute endpoint only when cross-origin deployment is intentional and CORS, authentication, credentials, and CSRF protections have been reviewed.

## Not yet production-ready

- The route has no durable persistence adapter wired in.
- Authorization, consent checks, replay protection, idempotency, and state-transition verification remain responsibilities of the adapter.
- The client helper does not implement offline queuing or conflict resolution.
- No database migration, integration test, or end-to-end test has been added by these reference files.
- The supplied Buzz iframe snippet was truncated before the component was complete. Do not commit or deploy it as a working component. A secure integration still needs a complete sandbox policy, exact origin checks, message schema validation, lifecycle handling, and a reviewed license boundary.
- The supplied route-governance JSX was malformed placeholders, not compilable router code.

Treat these additions as a safe integration seam, not a claim that the mesh endpoint is live or production verified.
