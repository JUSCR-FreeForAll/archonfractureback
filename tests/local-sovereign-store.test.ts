import { describe, expect, it } from "vitest";
import {
  SOVEREIGN_CONTEXT_V1,
  validateSovereignRecord
} from "../src/client/local-sovereign-store.js";

describe("Lost Legacies local sovereign record contract", () => {
  it("validates a namespaced semantic record", () => {
    const record = validateSovereignRecord({
      id: "pf-journey-001",
      project: "phoenixflies",
      type: "Journey",
      data: { title: "The Rising", stage: "ember" },
      jsonld: {
        "@context": SOVEREIGN_CONTEXT_V1,
        "@type": "PhoenixJourney",
        name: "The Rising"
      },
      identityDid: "did:example:participant"
    });

    expect(record.project).toBe("phoenixflies");
    expect(record.jsonld["@type"]).toBe("PhoenixJourney");
    expect(record.data.title).toBe("The Rising");
    expect(record.identityDid).toBe("did:example:participant");
  });

  it("rejects unknown product namespaces", () => {
    expect(() => validateSovereignRecord({
      id: "bad-1",
      project: "unknown-product",
      type: "Journey",
      data: {},
      jsonld: { "@context": SOVEREIGN_CONTEXT_V1, "@type": "Journey" }
    })).toThrow("not a supported Lost Legacies Live segment");
  });

  it("requires a JSON-LD context and type", () => {
    expect(() => validateSovereignRecord({
      id: "bad-2",
      project: "juscr",
      type: "Profile",
      data: {},
      jsonld: { "@type": "Profile" }
    })).toThrow('requires "@context" and a non-empty "@type"');
  });

  it("copies JSON data instead of retaining a mutable caller reference", () => {
    const data = { title: "Before" };
    const record = validateSovereignRecord({
      id: "copy-1",
      project: "timeauction",
      type: "Listing",
      data,
      jsonld: { "@context": SOVEREIGN_CONTEXT_V1, "@type": "AuctionListing" }
    });

    data.title = "After";
    expect(record.data.title).toBe("Before");
  });
});
