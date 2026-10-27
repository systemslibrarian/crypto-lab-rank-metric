import { describe, expect, it } from "vitest";

import {
  FIELD_SIZE,
  add,
  allElements,
  coefficients,
  divide,
  formatElement,
  inverse,
  multiply,
  power,
  square,
} from "./field";

function referenceMultiply(left: number, right: number): number {
  let polynomial = 0;
  for (let bit = 0; bit < 4; bit += 1) {
    if (((right >> bit) & 1) === 1) polynomial ^= left << bit;
  }
  for (let degree = 6; degree >= 4; degree -= 1) {
    if (((polynomial >> degree) & 1) === 1) polynomial ^= 0b1_0011 << (degree - 4);
  }
  return polynomial;
}

describe("GF(16) arithmetic", () => {
  it("matches an independently structured polynomial oracle for every product", () => {
    for (const left of allElements()) {
      for (const right of allElements()) {
        expect(multiply(left, right)).toBe(referenceMultiply(left, right));
        expect(add(left, right)).toBe(left ^ right);
      }
    }
  });

  it("uses x^4 + x + 1 and makes alpha primitive", () => {
    expect(multiply(8, 2)).toBe(3);
    expect(Array.from({ length: 15 }, (_, exponent) => power(2, exponent + 1))).toEqual([
      2, 4, 8, 3, 6, 12, 11, 5, 10, 7, 14, 15, 13, 9, 1,
    ]);
    expect(new Set(Array.from({ length: 15 }, (_, exponent) => power(2, exponent))).size).toBe(15);
  });

  it("computes squares, inverses, division, and field identities exhaustively", () => {
    for (const value of allElements()) {
      expect(square(value)).toBe(referenceMultiply(value, value));
      expect(power(value, 0)).toBe(1);
      if (value !== 0) {
        expect(multiply(value, inverse(value))).toBe(1);
        expect(divide(value, value)).toBe(1);
      }
    }
    for (const a of allElements()) {
      for (const b of allElements()) {
        for (const c of allElements()) {
          expect(multiply(a, add(b, c))).toBe(add(multiply(a, b), multiply(a, c)));
        }
      }
    }
  });

  it("expands and formats elements in the declared polynomial basis", () => {
    expect(coefficients(0)).toEqual([0, 0, 0, 0]);
    expect(coefficients(13)).toEqual([1, 0, 1, 1]);
    expect(formatElement(0)).toBe("0");
    expect(formatElement(1)).toBe("1");
    expect(formatElement(2)).toBe("α");
    expect(formatElement(13)).toBe("α³ + α² + 1");
  });

  it("rejects values outside this field and invalid exponents", () => {
    expect(() => add(-1, 0)).toThrow(RangeError);
    expect(() => multiply(FIELD_SIZE, 1)).toThrow(RangeError);
    expect(() => power(2, -1)).toThrow(RangeError);
    expect(() => power(2, Number.MAX_SAFE_INTEGER + 1)).toThrow(RangeError);
    expect(() => inverse(0)).toThrow(/no multiplicative inverse/);
  });
});
