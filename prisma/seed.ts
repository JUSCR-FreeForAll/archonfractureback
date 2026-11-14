import { PrismaClient } from "@prisma/client";
import { randomBytes, createHash } from "node:crypto";

if (process.env.NODE_ENV === "production") {
  console.error("CRITICAL: Seeding is blocked in production.");
  process.exit(1);
}

const prisma = new PrismaClient();

async function main() {
  console.log("Starting local database seeding...");
  await prisma.$transaction([
    prisma.vaultAuditEvent.deleteMany(),
    prisma.identityAttestation.deleteMany(),
    prisma.attestationNonce.deleteMany(),
    prisma.vaultRecord.deleteMany(),
  ]);

  const baseAddress = "0x40ad9FA81fF51d738132C891fC7F95A555b3dA09";
  const solanaPatron = "PatronTestPubKey11111111111111111111111111111";
  const activeNonceHex = randomBytes(32).toString("hex");

  const record = await prisma.vaultRecord.create({ data: {
    solanaPatron, baseAddress,
    timefuxSignature: "LOCAL_FIXTURE_TIMEFUX_SIGNATURE_001",
    slot: 294810234n, mintAddress: "LOCAL_FIXTURE_MINT",
    tokenAccount: "LOCAL_FIXTURE_TOKEN_ACCOUNT", status: "ATTESTED",
  }});
  const record2 = await prisma.vaultRecord.create({ data: {
    solanaPatron: "PatronTestPubKey2222222222222222222222222222",
    baseAddress: null, timefuxSignature: "LOCAL_FIXTURE_TIMEFUX_SIGNATURE_002",
    slot: 294810512n, mintAddress: "LOCAL_FIXTURE_MINT", status: "VERIFIED",
  }});
  const activeNonce = await prisma.attestationNonce.create({ data: {
    nonce: activeNonceHex, baseAddress,
    expiresAt: new Date(Date.now() + 15 * 60 * 1000),
  }});
  await prisma.attestationNonce.create({ data: {
    nonce: randomBytes(32).toString("hex"),
    baseAddress: "0x1234567890abcdef1234567890abcdef12345678",
    expiresAt: new Date(Date.now() - 10 * 60 * 1000),
    usedAt: new Date(Date.now() - 11 * 60 * 1000),
  }});

  const message = [
    "Lost Legacies Eternal Vault", "Chain: Base (8453)",
    `Address: ${baseAddress.toLowerCase()}`, `Nonce: ${activeNonceHex}`,
  ].join("\n");
  const recordHash = createHash("sha256")
    .update(JSON.stringify({ baseAddress, solanaPatron })).digest("hex");
  await prisma.identityAttestation.create({ data: {
    vaultRecordId: record.id, baseAddress, solanaPatron, message,
    signature: "LOCAL_FIXTURE_NOT_A_VALID_EIP191_SIGNATURE",
    chainId: 8453, nonceId: activeNonce.id, recordHash,
  }});
  await prisma.vaultAuditEvent.create({ data: {
    vaultRecordId: record.id, eventType: "ATTESTED", actor: baseAddress,
    newState: { status: "ATTESTED", baseAddress }, recordHash,
  }});
  console.log("Local fixtures created:", record.id, record2.id);
}
main()
  .catch((error) => { console.error("Seed failed:", error); process.exitCode = 1; })
  .finally(async () => { await prisma.$disconnect(); });
