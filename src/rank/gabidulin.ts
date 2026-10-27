import { FIELD_DEGREE, FIELD_SIZE, add, allElements, multiply, square, type GF16 } from "./field";
import { rankWeight } from "./matrix";

export const LENGTH = 4;
export const DIMENSION = 2;
export const MINIMUM_DISTANCE = LENGTH - DIMENSION + 1;
export const DECODING_RADIUS = Math.floor((MINIMUM_DISTANCE - 1) / 2);
export const EVALUATION_VECTOR = [1, 2, 4, 8] as const satisfies readonly GF16[];

export type Message = readonly [GF16, GF16];
export type Word = readonly [GF16, GF16, GF16, GF16];

export interface CodewordRecord {
  message: Message;
  word: Word;
}

export interface DecodedResult {
  status: "decoded";
  message: Message;
  word: Word;
  distance: number;
}

export interface RefusedResult {
  status: "refused";
  candidateCount: number;
}

export type DecodeResult = DecodedResult | RefusedResult;

function assertMessage(message: readonly GF16[]): asserts message is Message {
  if (message.length !== DIMENSION) {
    throw new RangeError(`message must contain exactly ${DIMENSION} field elements`);
  }
  message.forEach((value) => {
    if (!Number.isInteger(value) || value < 0 || value >= FIELD_SIZE) {
      throw new RangeError(`message elements must be integers from 0 through ${FIELD_SIZE - 1}`);
    }
  });
}

export function assertWord(word: readonly GF16[]): asserts word is Word {
  if (word.length !== LENGTH) {
    throw new RangeError(`word must contain exactly ${LENGTH} field elements`);
  }
  word.forEach((value) => {
    if (!Number.isInteger(value) || value < 0 || value >= FIELD_SIZE) {
      throw new RangeError(`word elements must be integers from 0 through ${FIELD_SIZE - 1}`);
    }
  });
}

export function evaluateLinearized(message: Message, point: GF16): GF16 {
  assertMessage(message);
  return add(multiply(message[0], point), multiply(message[1], square(point)));
}

export function encode(message: Message): Word {
  assertMessage(message);
  return EVALUATION_VECTOR.map((point) => evaluateLinearized(message, point)) as unknown as Word;
}

export function generatorMatrix(): readonly [Word, Word] {
  return [encode([1, 0]), encode([0, 1])];
}

export function addWords(left: Word, right: Word): Word {
  assertWord(left);
  assertWord(right);
  return left.map((value, index) => add(value, right[index])) as unknown as Word;
}

export function rankDistance(left: Word, right: Word): number {
  return rankWeight(addWords(left, right));
}

/**
 * Rank a fixed four-symbol word as the dimension of its GF(2) span.
 *
 * This is the same quantity as `rankWeight`, which explicitly expands the
 * word to a 4x4 binary matrix for the learner-facing derivation. The decoder
 * uses this allocation-free basis form because its exhaustive census performs
 * millions of distance checks under coverage instrumentation. The tests
 * compare every codeword and every correctable error with the independently
 * structured span oracle.
 */
function fixedWordRank(word: Word): number {
  const basis = [0, 0, 0, 0];
  let rank = 0;
  for (const value of word) {
    let candidate = value;
    for (let bit = FIELD_DEGREE - 1; bit >= 0; bit -= 1) {
      if ((candidate & (1 << bit)) === 0) continue;
      const pivot = basis[bit] ?? 0;
      if (pivot !== 0) {
        candidate ^= pivot;
      } else {
        basis[bit] = candidate;
        rank += 1;
        break;
      }
    }
  }
  return rank;
}

function decoderDistance(left: Word, right: Word): number {
  return fixedWordRank(left.map((value, index) => value ^ right[index]) as unknown as Word);
}

let cachedCodebook: readonly CodewordRecord[] | undefined;

export function enumerateCodebook(): readonly CodewordRecord[] {
  cachedCodebook ??= allElements().flatMap((a0) =>
    allElements().map((a1) => ({ message: [a0, a1] as Message, word: encode([a0, a1]) })),
  );
  return cachedCodebook;
}

export function boundedDecode(received: Word): DecodeResult {
  assertWord(received);
  const candidates = enumerateCodebook()
    .map((record) => ({ ...record, distance: decoderDistance(received, record.word) }))
    .filter((record) => record.distance <= DECODING_RADIUS);

  if (candidates.length !== 1) return { status: "refused", candidateCount: candidates.length };
  return { status: "decoded", ...candidates[0] };
}

export interface CodeCensus {
  codewordCount: number;
  distinctCodewordCount: number;
  minimumNonzeroRank: number;
  rankDistribution: Readonly<Record<number, number>>;
  singletonExponent: number;
  singletonBound: number;
  meetsSingletonBound: boolean;
}

export function computeCodeCensus(): CodeCensus {
  const codebook = enumerateCodebook();
  const serialized = new Set(codebook.map(({ word }) => word.join(",")));
  const distribution: Record<number, number> = {};
  for (const { word } of codebook) {
    const weight = rankWeight(word);
    distribution[weight] = (distribution[weight] ?? 0) + 1;
  }
  const nonzeroWeights = Object.entries(distribution)
    .filter(([weight]) => Number(weight) > 0)
    .map(([weight]) => Number(weight));
  const singletonExponent = FIELD_DEGREE * (LENGTH - MINIMUM_DISTANCE + 1);
  const singletonBound = 2 ** singletonExponent;
  return {
    codewordCount: codebook.length,
    distinctCodewordCount: serialized.size,
    minimumNonzeroRank: Math.min(...nonzeroWeights),
    rankDistribution: distribution,
    singletonExponent,
    singletonBound,
    meetsSingletonBound: serialized.size === singletonBound,
  };
}

export function enumerateWords(): Word[] {
  const words: Word[] = [];
  for (let a = 0; a < FIELD_SIZE; a += 1) {
    for (let b = 0; b < FIELD_SIZE; b += 1) {
      for (let c = 0; c < FIELD_SIZE; c += 1) {
        for (let d = 0; d < FIELD_SIZE; d += 1) words.push([a, b, c, d]);
      }
    }
  }
  return words;
}

export interface RankTwoCensus {
  total: number;
  refused: number;
  miscorrected: number;
  correct: number;
}

export function computeRankTwoCensus(): RankTwoCensus {
  const zeroMessage: Message = [0, 0];
  const zeroWord = encode(zeroMessage);
  const result: RankTwoCensus = { total: 0, refused: 0, miscorrected: 0, correct: 0 };
  for (const error of enumerateWords()) {
    if (rankWeight(error) !== 2) continue;
    result.total += 1;
    const decoded = boundedDecode(addWords(zeroWord, error));
    if (decoded.status === "refused") result.refused += 1;
    else if (decoded.message[0] === 0 && decoded.message[1] === 0) result.correct += 1;
    else result.miscorrected += 1;
  }
  return result;
}
