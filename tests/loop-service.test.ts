import { describe, it, expect } from "vitest";
import {
  validateIntention,
  validateConsentToken,
  computeLoopHealth,
  getClarityReport,
  revokeConsentToken,
  issueConsentToken,
  hasMutualConsent
} from "../src/loop-service.js";
import type { LoopState } from "../src/types.js";

describe("JUSCR loop validation", () => {
  it("accepts a valid intention vector", () => {
    const intention = {
      id: "int-1",
      author: "p-1",
      purpose: "stabilize the mesh",
      timestamp: new Date().toISOString(),
      expires: new Date(Date.now() + 60_000).toISOString(),
      signature: "sig-valid"
    };

    expect(validateIntention(intention)).toEqual([]);
  });

  it("rejects expired intention vectors", () => {
    const intention = {
      id: "int-2",
      author: "p-1",
      purpose: "stabilize the mesh",
      timestamp: new Date().toISOString(),
      expires: new Date(Date.now() - 1_000).toISOString(),
      signature: "sig-valid"
    };

    expect(validateIntention(intention)).toContain("intention has expired");
  });

  it("accepts a valid consent token", () => {
    const token = {
      id: "ct-1",
      loop_id: "loop-1",
      from: "p-1",
      to: "p-2",
      scope: "resource-flow",
      issued: new Date().toISOString(),
      expires: new Date(Date.now() + 60_000).toISOString(),
      revoked: false
    };

    expect(validateConsentToken(token)).toEqual([]);
  });

  it("rejects self-consent", () => {
    const token = {
      id: "ct-2",
      loop_id: "loop-1",
      from: "p-1",
      to: "p-1",
      scope: "resource-flow",
      issued: new Date().toISOString(),
      expires: new Date(Date.now() + 60_000).toISOString(),
      revoked: false
    };

    expect(validateConsentToken(token)).toContain("from and to cannot be the same participant");
  });

  it("detects mutual consent", () => {
    const ledger = [
      {
        id: "ct-a",
        loop_id: "loop-1",
        from: "p-1",
        to: "p-2",
        scope: "resource-flow",
        issued: new Date().toISOString(),
        expires: new Date(Date.now() + 60_000).toISOString(),
        revoked: false
      },
      {
        id: "ct-b",
        loop_id: "loop-1",
        from: "p-2",
        to: "p-1",
        scope: "resource-flow",
        issued: new Date().toISOString(),
        expires: new Date(Date.now() + 60_000).toISOString(),
        revoked: false
      }
    ];

    expect(hasMutualConsent(ledger, "p-1", "p-2", "resource-flow")).toBe(true);
  });

  it("marks a loop stalled when consent is missing", () => {
    const consent: any[] = [];
    const intentions = [{
      id: "int-1",
      author: "p-1",
      purpose: "stabilize the mesh",
      timestamp: new Date().toISOString(),
      expires: new Date(Date.now() + 60_000).toISOString(),
      signature: "sig-valid"
    }];

    expect(computeLoopHealth(consent, intentions)).toBe("stalled");
  });

  it("marks a loop healthy when valid consent and valid intentions exist", () => {
    const consent = [{
      id: "ct-1",
      loop_id: "loop-1",
      from: "p-1",
      to: "p-2",
      scope: "resource-flow",
      issued: new Date().toISOString(),
      expires: new Date(Date.now() + 60_000).toISOString(),
      revoked: false
    }];

    const intentions = [{
      id: "int-1",
      author: "p-1",
      purpose: "stabilize the mesh",
      timestamp: new Date().toISOString(),
      expires: new Date(Date.now() + 60_000).toISOString(),
      signature: "sig-valid"
    }];

    expect(computeLoopHealth(consent, intentions)).toBe("healthy");
  });

  it("revokeConsentToken marks a token as revoked", () => {
    const token = {
      id: "ct-1",
      loop_id: "loop-1",
      from: "p-1",
      to: "p-2",
      scope: "resource-flow",
      issued: new Date().toISOString(),
      expires: new Date(Date.now() + 60_000).toISOString(),
      revoked: false
    };

    expect(revokeConsentToken(token).revoked).toBe(true);
  });

  it("issues a consent token with a future expiry", () => {
    const token = issueConsentToken("loop-1", "p-1", "p-2", "resource-flow", 60_000);
    expect(token.revoked).toBe(false);
    expect(new Date(token.expires).getTime()).toBeGreaterThan(Date.now());
  });

  it("builds a clarity report for a healthy loop", () => {
    const loop: LoopState = {
      id: "loop-1",
      health: "healthy",
      purpose: "stabilize scaffolding",
      consent_ledger: [{
        id: "ct-1",
        loop_id: "loop-1",
        from: "p-1",
        to: "p-2",
        scope: "resource-flow",
        issued: new Date().toISOString(),
        expires: new Date(Date.now() + 60_000).toISOString(),
        revoked: false
      }],
      active_intentions: [{
        id: "int-1",
        author: "p-1",
        purpose: "stabilize the mesh",
        timestamp: new Date().toISOString(),
        expires: new Date(Date.now() + 60_000).toISOString(),
        signature: "sig-valid"
      }],
      clarity_report: "Transparent and consent-based"
    };

    const report = getClarityReport(loop);
    expect(report).toContain("Loop ID: loop-1");
    expect(report).toContain("Health: healthy");
  });
});
