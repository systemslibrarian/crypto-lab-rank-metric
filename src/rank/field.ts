export type GF16 = number;

export const FIELD_SIZE = 16;
export const FIELD_DEGREE = 4;
export const PRIMITIVE_POLYNOMIAL = 0b1_0011;

export function assertElement(value: number): asserts value is GF16 {
  if (!Number.isInteger(value) || value < 0 || value >= FIELD_SIZE) {
    throw new RangeError(`GF(16) element must be an integer from 0 through 15; received ${value}`);
  }
}

export function add(left: GF16, right: GF16): GF16 {
  assertElement(left);
  assertElement(right);
  return left ^ right;
}

export function multiply(left: GF16, right: GF16): GF16 {
  assertElement(left);
  assertElement(right);

  let a = left;
  let b = right;
  let product = 0;
  while (b > 0) {
    if ((b & 1) === 1) product ^= a;
    b >>= 1;
    a <<= 1;
    if ((a & FIELD_SIZE) !== 0) a ^= PRIMITIVE_POLYNOMIAL;
  }
  return product;
}

export function power(base: GF16, exponent: number): GF16 {
  assertElement(base);
  if (!Number.isSafeInteger(exponent) || exponent < 0) {
    throw new RangeError(`exponent must be a non-negative safe integer; received ${exponent}`);
  }

  let result: GF16 = 1;
  let factor = base;
  let remaining = exponent;
  while (remaining > 0) {
    if (remaining % 2 === 1) result = multiply(result, factor);
    factor = multiply(factor, factor);
    remaining = Math.floor(remaining / 2);
  }
  return result;
}

export function square(value: GF16): GF16 {
  return multiply(value, value);
}

export function inverse(value: GF16): GF16 {
  assertElement(value);
  if (value === 0) throw new RangeError("zero has no multiplicative inverse in GF(16)");
  return power(value, FIELD_SIZE - 2);
}

export function divide(numerator: GF16, denominator: GF16): GF16 {
  return multiply(numerator, inverse(denominator));
}

export function coefficients(value: GF16): readonly [number, number, number, number] {
  assertElement(value);
  return [value & 1, (value >> 1) & 1, (value >> 2) & 1, (value >> 3) & 1];
}

const SUPERSCRIPTS = ["", "", "²", "³"] as const;

export function formatElement(value: GF16): string {
  const bits = coefficients(value);
  const terms: string[] = [];
  for (let degree = FIELD_DEGREE - 1; degree >= 0; degree -= 1) {
    if (bits[degree] === 0) continue;
    if (degree === 0) terms.push("1");
    else terms.push(`α${SUPERSCRIPTS[degree]}`);
  }
  return terms.length === 0 ? "0" : terms.join(" + ");
}

export function allElements(): GF16[] {
  return Array.from({ length: FIELD_SIZE }, (_, value) => value);
}
