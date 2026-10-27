import { describe, expect, it } from "vitest";

import { binaryRank, hammingWeight, rankWeight, vectorToBinaryMatrix } from "./matrix";

function spanRank(vector: readonly number[]): number {
  let span = new Set([0]);
  for (const value of vector) {
    span = new Set([...span, ...[...span].map((member) => member ^ value)]);
  }
  return Math.log2(span.size);
}

describe("rank-metric vector expansion", () => {
  it("places polynomial-basis coordinates in four binary rows", () => {
    expect(vectorToBinaryMatrix([1, 2, 4, 8])).toEqual([
      [1, 0, 0, 0],
      [0, 1, 0, 0],
      [0, 0, 1, 0],
      [0, 0, 0, 1],
    ]);
    expect(vectorToBinaryMatrix([3, 3, 3, 3])).toEqual([
      [1, 1, 1, 1],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]);
  });

  it("computes binary matrix rank by elimination", () => {
    expect(binaryRank([])).toBe(0);
    expect(binaryRank([[]])).toBe(0);
    expect(
      binaryRank([
        [0, 0],
        [0, 0],
      ]),
    ).toBe(0);
    expect(
      binaryRank([
        [1, 0],
        [0, 1],
      ]),
    ).toBe(2);
    expect(
      binaryRank([
        [1, 1, 0],
        [1, 1, 0],
        [0, 1, 1],
      ]),
    ).toBe(2);
    expect(
      binaryRank([
        [1, 0, 0, 0],
        [1, 1, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ]),
    ).toBe(2);
  });

  it("matches an independent span-cardinality oracle for every GF(16)^2 vector", () => {
    for (let left = 0; left < 16; left += 1) {
      for (let right = 0; right < 16; right += 1) {
        expect(rankWeight([left, right])).toBe(spanRank([left, right]));
      }
    }
  });

  it("distinguishes extension-symbol Hamming weight from binary rank weight", () => {
    expect(hammingWeight([3, 3, 3, 3])).toBe(4);
    expect(rankWeight([3, 3, 3, 3])).toBe(1);
    expect(hammingWeight([1, 2, 4, 8])).toBe(4);
    expect(rankWeight([1, 2, 4, 8])).toBe(4);
  });

  it("rejects empty vectors, ragged/non-binary matrices, and invalid elements", () => {
    expect(() => vectorToBinaryMatrix([])).toThrow(/at least one/);
    expect(() => vectorToBinaryMatrix([16])).toThrow(RangeError);
    expect(() => hammingWeight([-1])).toThrow(RangeError);
    expect(() => binaryRank([[1], [1, 0]])).toThrow(/same length/);
    expect(() => binaryRank([[2]])).toThrow(/0 or 1/);
  });
});
