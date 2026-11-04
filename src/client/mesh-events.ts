import { MeshEventSchema, type MeshEvent, type MeshMutation } from "../mesh/event-contract.js";

type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

function canonicalJson(value: JsonValue): string {
  if (value === null || typeof value === "boolean" || typeof value === "string") {
    return JSON.stringify(value);
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new TypeError("State contains a non-finite number");
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(canonicalJson).join(",")}]`;
  }
  const keys = Object.keys(value).sort();
  return `{${keys.map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
}

async function sha256(value: JsonValue): Promise<string> {
  const bytes = new TextEncoder().encode(canonicalJson(value));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export interface EmitMeshEventInput {
  segment: "home" | "connect" | "learn" | "create" | "trust" | "library";
  module: string;
  actor: string;
  mutation: MeshMutation;
  previousHash: string | null;
  postMutationState: JsonValue;
  endpoint?: string;
}

export async function emitMeshEvent(input: EmitMeshEventInput): Promise<MeshEvent> {
  const now = new Date().toISOString();
  const event = MeshEventSchema.parse({
    specversion: "1.0",
    id: crypto.randomUUID(),
    source: `juscr:${input.segment}:${input.module}`,
    type: "juscr.mesh.state.transition",
    time: now,
    datacontenttype: "application/json",
    data: {
      actor: input.actor,
      segment: input.segment,
      module: input.module,
      mutation: input.mutation,
      prevHash: input.previousHash,
      stateHash: await sha256(input.postMutationState),
      timestamp: now
    }
  });

  const response = await fetch(input.endpoint ?? "/api/v1/mesh/events", {
    method: "POST",
    headers: { "Content-Type": "application/cloudevents+json" },
    body: JSON.stringify(event)
  });

  if (!response.ok) {
    throw new Error(`Mesh event was not accepted (HTTP ${response.status})`);
  }

  return event;
}
