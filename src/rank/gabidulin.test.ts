import { describe, expect, it } from "vitest";

import { add, allElements } from "./field";
import {
  DECODING_RADIUS,
  DIMENSION,
  EVALUATION_VECTOR,
  LENGTH,
  MINIMUM_DISTANCE,
  addWords,
  boundedDecode,
  computeCodeCensus,
  computeRankTwoCensus,
  encode,
  enumerateCodebook,
  enumerateWords,
  evaluateLinearized,
  generatorMatrix,
  rankDistance,
  type Message,
  type Word,
} from "./gabidulin";
import { rankWeight } from "./matrix";

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

function referenceEncode([a0, a1]: Message): Word {
  return EVALUATION_VECTOR.map(
    (point) =>
      referenceMultiply(a0, point) ^ referenceMultiply(a1, referenceMultiply(point, point)),
  ) as unknown as Word;
}

function spanRank(vector: readonly number[]): number {
  let span = new Set([0]);
  for (const value of vector) {
    span = new Set([...span, ...[...span].map((member) => member ^ value)]);
  }
  return Math.log2(span.size);
}

describe("the bounded [4,2,3] Gabidulin code", () => {
  it("pins its declared parameters and real generator rows", () => {
    expect({ n: LENGTH, k: DIMENSION, d: MINIMUM_DISTANCE, t: DECODING_RADIUS }).toEqual({
      n: 4,
      k: 2,
      d: 3,
      t: 1,
    });
    expect(EVALUATION_VECTOR).toEqual([1, 2, 4, 8]);
    expect(generatorMatrix()).toEqual([
      [1, 2, 4, 8],
      [1, 4, 3, 12],
    ]);
  });

  it("evaluates the linearized polynomial and matches an independent encoder", () => {
    for (const a0 of allElements()) {
      for (const a1 of allElements()) {
        const message: Message = [a0, a1];
        expect(encode(message)).toEqual(referenceEncode(message));
        for (const point of EVALUATION_VECTOR) {
          expect(evaluateLinearized(message, point)).toBe(
            referenceMultiply(a0, point) ^ referenceMultiply(a1, referenceMultiply(point, point)),
          );
        }
      }
    }
  });

  it("is linear over GF(16)", () => {
    for (const a0 of allElements()) {
      for (const a1 of allElements()) {
        const left: Message = [a0, a1];
        const right: Message = [a1, a0];
        expect(addWords(encode(left), encode(right))).toEqual(encode([add(a0, a1), add(a1, a0)]));
      }
    }
  });

  it("recomputes the full MRD census and Singleton equality", () => {
    const census = computeCodeCensus();
    expect(census).toEqual({
      codewordCount: 256,
      distinctCodewordCount: 256,
      minimumNonzeroRank: 3,
      rankDistribution: { 0: 1, 3: 225, 4: 30 },
      singletonExponent: 8,
      singletonBound: 256,
      meetsSingletonBound: true,
    });

    const codebook = enumerateCodebook();
    expect(Math.min(...codebook.slice(1).map(({ word }) => spanRank(word)))).toBe(3);
    expect(codebook.every(({ word }) => spanRank(word) === rankWeight(word))).toBe(true);
  });

  it("corrects every rank-zero or rank-one error around every codeword", () => {
    const errors = enumerateWords().filter((word) => spanRank(word) <= DECODING_RADIUS);
    expect(errors).toHaveLength(226);
    for (const record of enumerateCodebook()) {
      for (const error of errors) {
        const decoded = boundedDecode(addWords(record.word, error));
        expect(decoded.status).toBe("decoded");
        if (decoded.status === "decoded") {
          expect(decoded.message).toEqual(record.message);
          expect(decoded.word).toEqual(record.word);
          expect(decoded.distance).toBe(spanRank(error));
        }
      }
    }
  }, 30_000);

  it("recomputes the complete rank-two refusal and miscorrection census", () => {
    expect(computeRankTwoCensus()).toEqual({
      total: 7_350,
      refused: 1_050,
      miscorrected: 6_300,
      correct: 0,
    });
  }, 30_000);

  it("uses rank distance, not extension-symbol Hamming distance", () => {
    const zero = encode([0, 0]);
    const repeated: Word = [3, 3, 3, 3];
    expect(rankDistance(zero, repeated)).toBe(1);
    expect(boundedDecode(repeated)).toMatchObject({
      status: "decoded",
      message: [0, 0],
      distance: 1,
    });
  });

  it("rejects invalid message and word shapes or elements", () => {
    expect(() => encode([1] as unknown as Message)).toThrow(/exactly 2/);
    expect(() => encode([1, 16] as Message)).toThrow(/0 through 15/);
    expect(() => boundedDecode([0, 0, 0] as unknown as Word)).toThrow(/exactly 4/);
    expect(() => boundedDecode([0, 0, 0, -1] as Word)).toThrow(/0 through 15/);
  });
});
