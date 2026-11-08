/**
 * Symbolic Time model primitives.
 *
 * These coordinates are a versioned product model, not a claim about physical
 * dimensions or causal effects outside the application.
 */
export const TIME_MODEL_VERSION = "0.2.0" as const;
export const IMAGINATION_VALUES = [0, -0.5, -1, 0.5, 0, 1, 1, 2, 3, 5] as const;
export const NEGATIVE_PIVOT_COUNT = 3 as const;
export const MAX_IMAGINATION_COUNT = 10 as const;

export type RealmLayer =
  | "earth-realm-2"
  | "ouroboros-negative"
  | "realm-3"
  | "realm-4"
  | "higher-order-unmapped";

export interface TimeCoordinate5D {
  /** One-based count of individual imaginations, 1..10. */
  countedNumber: number;
  /** Value assigned to that count in the supplied sequence. */
  imaginationValue: number;
  /** Base-3 on/left of the -1 pivot; count itself on the right. */
  radix: number;
  /** Symbolic application layer; higher layers remain intentionally unmapped. */
  realmLayer: RealmLayer;
  /** Three-day phase offset retained as a configurable model parameter. */
  temporalPhaseDays: number;
  /** Exact comparison pair: left constant : (count × imagination value). */
  ratio: {
    leftConstant: number;
    countedNumber: number;
    imaginationValue: number;
    product: number;
  };
  /** The count expressed in the selected radix. */
  countedNumberInRadix: string;
  modelVersion: typeof TIME_MODEL_VERSION;
}

function integerToBase(value: number, radix: number): string {
  if (!Number.isInteger(value) || value < 0) {
    throw new RangeError("base conversion requires a non-negative integer");
  }
  return value.toString(radix).toUpperCase();
}

export function getRealmLayer(value: number): RealmLayer {
  if (value === -1 || value === -0.5) return "ouroboros-negative";
  if (value === 1) return "realm-3";
  if (value === 2) return "realm-4";
  if (value === 3 || value === 5) return "higher-order-unmapped";
  return "earth-realm-2";
}

export function getTimeCoordinate(
  countedNumber: number,
  options: { leftConstant?: number; temporalPhaseDays?: number } = {}
): TimeCoordinate5D {
  if (!Number.isInteger(countedNumber) || countedNumber < 1 || countedNumber > MAX_IMAGINATION_COUNT) {
    throw new RangeError(`countedNumber must be an integer from 1 to ${MAX_IMAGINATION_COUNT}`);
  }

  const imaginationValue = IMAGINATION_VALUES[countedNumber - 1];
  const radix = countedNumber <= NEGATIVE_PIVOT_COUNT ? 3 : countedNumber;
  const leftConstant = options.leftConstant ?? 1;
  const temporalPhaseDays = options.temporalPhaseDays ?? 3;

  if (!Number.isFinite(leftConstant)) throw new RangeError("leftConstant must be finite");
  if (!Number.isFinite(temporalPhaseDays)) throw new RangeError("temporalPhaseDays must be finite");

  return {
    countedNumber,
    imaginationValue,
    radix,
    realmLayer: getRealmLayer(imaginationValue),
    temporalPhaseDays,
    ratio: {
      leftConstant,
      countedNumber,
      imaginationValue,
      product: countedNumber * imaginationValue
    },
    countedNumberInRadix: integerToBase(countedNumber, radix),
    modelVersion: TIME_MODEL_VERSION
  };
}

export function getImaginationStack(
  options: { leftConstant?: number; temporalPhaseDays?: number } = {}
): TimeCoordinate5D[] {
  return IMAGINATION_VALUES.map((_, index) =>
    getTimeCoordinate(index + 1, options)
  );
}

/**
 * The user's proposed sequence defines only ten values. Counts above ten are
 * deliberately rejected until a recurrence rule is explicitly agreed.
 */
export function nextImaginationCount(): never {
  throw new RangeError("the current Time model is defined for 1–10 imaginations only");
}
