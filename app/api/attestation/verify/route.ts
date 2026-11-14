import { NextRequest, NextResponse } from "next/server";
import { verifyAndStoreAttestation } from "@/lib/verify-attestation";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const fields = ["baseAddress", "solanaPatron", "signature", "nonce", "timefuxSignature"] as const;
  for (const field of fields) {
    if (typeof body[field] !== "string" || !body[field]) {
      return NextResponse.json({ error: `Missing or invalid ${field}` }, { status: 400 });
    }
  }

  try {
    const vault = await verifyAndStoreAttestation({
      baseAddress: body.baseAddress as string,
      solanaPatron: body.solanaPatron as string,
      signature: body.signature as string,
      nonce: body.nonce as string,
      timefuxSignature: body.timefuxSignature as string,
    });
    return NextResponse.json({
      ok: true,
      vaultRecordId: vault.id,
      solanaPatron: vault.solanaPatron,
      baseAddress: vault.baseAddress,
      status: vault.status,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Attestation failed";
    const status = /invalid|expired|used|mismatch|different|revoked|missing|already/i.test(message)
      ? 400
      : 409;
    return NextResponse.json({ error: message }, { status });
  }
}
