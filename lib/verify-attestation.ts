import { createHash } from "node:crypto";
import { verifyMessage } from "ethers";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const BASE_CHAIN_ID = 8453;

export async function verifyAndStoreAttestation(params: {
  baseAddress: string;
  solanaPatron: string;
  signature: string;
  nonce: string;
  timefuxSignature: string;
}) {
  const baseAddress = params.baseAddress.toLowerCase();
  if (!/^0x[a-f0-9]{40}$/.test(baseAddress)) {
    throw new Error("Invalid Base address");
  }
  if (!params.solanaPatron || !params.timefuxSignature || !params.signature) {
    throw new Error("Missing attestation fields");
  }

  const nonceRecord = await prisma.attestationNonce.findUnique({
    where: { nonce: params.nonce },
  });
  if (!nonceRecord || nonceRecord.usedAt || nonceRecord.expiresAt <= new Date()) {
    throw new Error("Invalid or expired nonce");
  }
  if (nonceRecord.baseAddress !== baseAddress) {
    throw new Error("Nonce address mismatch");
  }

  const message = [
    "Lost Legacies Eternal Vault",
    "Chain: Base (8453)",
    `Address: ${baseAddress}`,
    `Nonce: ${params.nonce}`,
    `Expires: ${nonceRecord.expiresAt.toISOString()}`,
  ].join("\n");

  const recovered = verifyMessage(message, params.signature).toLowerCase();
  if (recovered !== baseAddress) {
    throw new Error("Invalid signature");
  }

  // The Phoenix verifier must have ingested and verified this Solana event first.
  // Never create a VaultRecord here with a placeholder slot or unverified signature.
  const vault = await prisma.vaultRecord.findUnique({
    where: { solanaPatron: params.solanaPatron },
  });
  if (!vault || vault.timefuxSignature !== params.timefuxSignature) {
    throw new Error("No matching Phoenix-verified TimeFux vault record");
  }
  if (vault.status === "REVOKED") {
    throw new Error("Vault record is revoked");
  }
  if (vault.baseAddress && vault.baseAddress !== baseAddress) {
    throw new Error("Solana patron already bound to a different Base identity");
  }

  const canonicalRecord = JSON.stringify({
    baseAddress,
    solanaPatron: params.solanaPatron,
    timefuxSignature: params.timefuxSignature,
    nonce: params.nonce,
    chainId: BASE_CHAIN_ID,
    message,
  });
  const recordHash = createHash("sha256").update(canonicalRecord).digest("hex");

  return prisma.$transaction(
    async (tx) => {
      // Conditional update makes nonce consumption single-use under concurrent requests.
      const consumed = await tx.attestationNonce.updateMany({
        where: {
          id: nonceRecord.id,
          usedAt: null,
          expiresAt: { gt: new Date() },
          baseAddress,
        },
        data: { usedAt: new Date() },
      });
      if (consumed.count !== 1) {
        throw new Error("Nonce has already been used or expired");
      }

      const currentVault = await tx.vaultRecord.findUnique({
        where: { id: vault.id },
      });
      if (
        !currentVault ||
        currentVault.timefuxSignature !== params.timefuxSignature ||
        (currentVault.baseAddress && currentVault.baseAddress !== baseAddress) ||
        currentVault.status === "REVOKED"
      ) {
        throw new Error("Vault binding changed during attestation");
      }

      const updatedVault = await tx.vaultRecord.update({
        where: { id: vault.id },
        data: { baseAddress, status: "ATTESTED" },
      });

      await tx.identityAttestation.create({
        data: {
          vaultRecordId: updatedVault.id,
          baseAddress,
          solanaPatron: params.solanaPatron,
          message,
          signature: params.signature,
          chainId: BASE_CHAIN_ID,
          nonceId: nonceRecord.id,
          recordHash,
        },
      });

      await tx.vaultAuditEvent.create({
        data: {
          vaultRecordId: updatedVault.id,
          eventType: "ATTESTED",
          actor: baseAddress,
          newState: { baseAddress, solanaPatron: params.solanaPatron, recordHash },
          recordHash,
        },
      });

      return updatedVault;
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
}
