import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const baseAddress =
    typeof body === "object" && body !== null && "baseAddress" in body
      ? String((body as { baseAddress: unknown }).baseAddress)
      : "";

  if (!/^0x[a-fA-F0-9]{40}$/.test(baseAddress)) {
    return NextResponse.json({ error: "Invalid Base address" }, { status: 400 });
  }

  const normalizedAddress = baseAddress.toLowerCase();
  const nonce = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  await prisma.attestationNonce.create({
    data: {
      nonce,
      baseAddress: normalizedAddress,
      expiresAt,
    },
  });

  const message = [
    "Lost Legacies Eternal Vault",
    "Chain: Base (8453)",
    `Address: ${normalizedAddress}`,
    `Nonce: ${nonce}`,
    `Expires: ${expiresAt.toISOString()}`,
  ].join("\n");

  return NextResponse.json({ nonce, message, expiresAt });
}
