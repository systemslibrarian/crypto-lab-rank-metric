import { FIELD_DEGREE, assertElement, coefficients, type GF16 } from "./field";

export type BinaryMatrix = number[][];

export function vectorToBinaryMatrix(vector: readonly GF16[]): BinaryMatrix {
  if (vector.length === 0) throw new RangeError("a vector must contain at least one field element");
  vector.forEach(assertElement);

  return Array.from({ length: FIELD_DEGREE }, (_, basisIndex) =>
    vector.map((value) => coefficients(value)[basisIndex]),
  );
}

export function binaryRank(input: readonly (readonly number[])[]): number {
  if (input.length === 0) return 0;
  const columnCount = input[0]?.length ?? 0;
  if (input.some((row) => row.length !== columnCount)) {
    throw new RangeError("all binary-matrix rows must have the same length");
  }
  if (input.some((row) => row.some((value) => value !== 0 && value !== 1))) {
    throw new RangeError("binary-matrix entries must be 0 or 1");
  }

  const matrix = input.map((row) => [...row]);
  let rank = 0;
  for (let column = 0; column < columnCount && rank < matrix.length; column += 1) {
    const pivot = matrix.findIndex((row, index) => index >= rank && row[column] === 1);
    if (pivot === -1) continue;
    [matrix[rank], matrix[pivot]] = [matrix[pivot], matrix[rank]];
    for (let row = 0; row < matrix.length; row += 1) {
      if (row === rank || matrix[row][column] === 0) continue;
      for (let entry = column; entry < columnCount; entry += 1) {
        matrix[row][entry] ^= matrix[rank][entry];
      }
    }
    rank += 1;
  }
  return rank;
}

export function rankWeight(vector: readonly GF16[]): number {
  return binaryRank(vectorToBinaryMatrix(vector));
}

export function hammingWeight(vector: readonly GF16[]): number {
  vector.forEach(assertElement);
  return vector.filter((value) => value !== 0).length;
}
