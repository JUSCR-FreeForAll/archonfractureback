import { z } from "zod";

const sha256Hex = z.string().regex(/^[a-f0-9]{64}$/i, "Expected a 32-byte SHA-256 hex digest");

export const MeshMutationSchema = z.discriminatedUnion("op", [
  z.object({
    path: z.string().min(1).max(512),
    op: z.literal("add"),
    value: z.unknown()
  }).strict(),
  z.object({
    path: z.string().min(1).max(512),
    op: z.literal("replace"),
    value: z.unknown()
  }).strict(),
  z.object({
    path: z.string().min(1).max(512),
    op: z.literal("remove")
  }).strict()
]);

export const MeshEventSchema = z.object({
  specversion: z.literal("1.0"),
  id: z.string().min(1).max(255),
  source: z.string().min(1).max(512),
  type: z.literal("juscr.mesh.state.transition"),
  time: z.string().datetime({ offset: true }),
  datacontenttype: z.literal("application/json"),
  data: z.object({
    actor: z.string().min(1).max(512),
    segment: z.enum(["home", "connect", "learn", "create", "trust", "library"]),
    module: z.string().regex(/^[a-z0-9_-]{1,80}$/),
    mutation: MeshMutationSchema,
    prevHash: sha256Hex.nullable(),
    stateHash: sha256Hex,
    timestamp: z.string().datetime({ offset: true })
  }).strict()
}).strict();

export type MeshEvent = z.infer<typeof MeshEventSchema>;
export type MeshMutation = z.infer<typeof MeshMutationSchema>;
