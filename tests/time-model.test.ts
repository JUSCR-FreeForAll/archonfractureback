import { describe, expect, it } from "vitest";
import {
  getImaginationStack,
  getTimeCoordinate,
  IMAGINATION_VALUES,
  getRealmLayer
} from "../src/time-model.js";

describe("Lost Legacies Live counted imagination model", () => {
  it("preserves the supplied ten-value sequence exactly", () => {
    expect(IMAGINATION_VALUES).toEqual([0, -0.5, -1, 0.5, 0, 1, 1, 2, 3, 5]);
    expect(getImaginationStack()).toHaveLength(10);
  });

  it("uses radix 3 to the left of and at the -1 pivot", () => {
    expect(getTimeCoordinate(1).radix).toBe(3);
    expect(getTimeCoordinate(2).radix).toBe(3);
    expect(getTimeCoordinate(3).radix).toBe(3);
  });

  it("uses the counted number as radix on the right of the pivot", () => {
    for (const n of [4, 5, 6, 7, 8, 9, 10]) {
      const coordinate = getTimeCoordinate(n);
      expect(coordinate.radix).toBe(n);
      expect(coordinate.countedNumberInRadix).toBe("10");
    }
  });

  it("models imagination counts 7 through 10 without inventing realm mappings", () => {
    const stack = getImaginationStack();
    expect(stack.slice(6).map((item) => item.imaginationValue)).toEqual([1, 2, 3, 5]);
    expect(stack.slice(6).map((item) => item.radix)).toEqual([7, 8, 9, 10]);
    expect(stack[6].realmLayer).toBe("realm-3");
    expect(stack[7].realmLayer).toBe("realm-4");
    expect(stack[8].realmLayer).toBe("higher-order-unmapped");
    expect(stack[9].realmLayer).toBe("higher-order-unmapped");
  });

  it("exposes the ratio as a comparison pair, not a monetary energy value", () => {
    const coordinate = getTimeCoordinate(8, { leftConstant: 2 });
    expect(coordinate.ratio).toEqual({
      leftConstant: 2,
      countedNumber: 8,
      imaginationValue: 2,
      product: 16
    });
  });

  it("retains the three-day phase offset as a configurable parameter", () => {
    expect(getTimeCoordinate(7).temporalPhaseDays).toBe(3);
    expect(getTimeCoordinate(7, { temporalPhaseDays: 4 }).temporalPhaseDays).toBe(4);
  });

  it("rejects counts outside the specified range", () => {
    expect(() => getTimeCoordinate(0)).toThrow(RangeError);
    expect(() => getTimeCoordinate(11)).toThrow(RangeError);
  });

  it("maps negative, positive and unmapped values to symbolic layers", () => {
    expect(getRealmLayer(-1)).toBe("ouroboros-negative");
    expect(getRealmLayer(1)).toBe("realm-3");
    expect(getRealmLayer(2)).toBe("realm-4");
    expect(getRealmLayer(5)).toBe("higher-order-unmapped");
  });
});
