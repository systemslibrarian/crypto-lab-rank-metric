# Rank Metric Lab

## What It Is

Rank Metric Lab is an executable lesson about distance in extension-field vectors and one bounded
Gabidulin code. It expands `GF(16)^4` vectors into binary matrices so the same input can have
visibly different Hamming and rank weights. It constructs every word of a `[4,2,3]`
maximum-rank-distance code and decodes by an exhaustive radius-one search. It also runs correct,
refusal, and miscorrection cases so behavior beyond the guaranteed radius is not mistaken for
guaranteed detection. The implementation is code mathematics, not an encryption scheme, KEM,
approved parameter set, or deployable decoder.

**Live Demo:** <https://systemslibrarian.github.io/crypto-lab-rank-metric/>

## Executable model

The field is `GF(2)[α]/(α^4 + α + 1)`, represented by four-bit polynomial coefficients in the
ordered basis `(1, α, α², α³)`. The code evaluates

```text
f(x) = a0*x + a1*x²
```

at `g = (1, α, α², α³)` for every `(a0,a1)` in `GF(16)^2`. The implementation recomputes all 256
codewords, their rank weights, the minimum nonzero rank distance, and the rank-metric Singleton
equality. The learner decoder checks all 256 codewords and returns a result only when exactly one is
at rank distance at most one; it is not Gabidulin's efficient algebraic decoder.

The complete toy-space evidence is:

- 256 messages and 256 distinct words;
- minimum rank distance 3;
- 225 nonzero words of rank 3 and 30 of rank 4;
- all 57,856 combinations of one codeword and one rank-zero/rank-one error decode correctly;
- across all 7,350 rank-two errors from the zero word, 1,050 are refused and 6,300 miscorrect to
  another word; none decode to the transmitted word.

Those last counts describe this finite code and this exhaustive radius-one decoder. They are not a
cryptosystem failure probability.

## Security and family boundary

This repository implements no key generation, encryption, encapsulation, authentication, security
reduction, production parameters, constant-time primitive, or side-channel defense. Gabidulin code
mathematics does not by itself establish the security of GPT, Faure–Loidreau, RQC, or another
construction built from rank codes. The learner page separately identifies published structural
attacks and NIST's 2020 RQC selection record rather than projecting the toy code's MRD property into
a deployment claim.

Classic McEliece and HQC are code-based comparisons, not rank-metric instances of this lesson: their
relevant constructions use Hamming distance. See [THREAT-MODEL.md](THREAT-MODEL.md) and
[LIMITATIONS.md](LIMITATIONS.md) for the precise non-claims.

## Sources

- E. M. Gabidulin,
  [“Theory of Codes with Maximum Rank Distance”](https://www.mathnet.ru/eng/ppi967), _Problems of
  Information Transmission_ 21(1), 1985, pp. 1–12. The publisher record describes the rank norm, MRD
  construction, spectrum, and encoding/decoding algorithms.
- P. Gaborit, A. Otmani, and H. Talé Kalachi,
  [“Polynomial-Time Key Recovery Attack on the Faure–Loidreau Scheme based on Gabidulin Codes”](https://arxiv.org/abs/1606.07760),
  arXiv:1606.07760, §§2–3 and 6. Definition 2 and Definition 3/equations (4)–(5) ground the rank
  weight and evaluation/generator forms; the later analysis is construction-specific.
- NIST,
  [NIST IR 8309, _Status Report on the Second Round of the NIST Post-Quantum Cryptography Standardization Process_](https://doi.org/10.6028/NIST.IR.8309),
  2020, §3.16. It records the cryptanalytic and selection status of RQC's Round-2 submission.
- Ernst M. Gabidulin,
  [“Schemes Based on Rank Codes”](https://doi.org/10.1007/978-3-030-71522-9_388), in _Encyclopedia
  of Cryptography, Security and Privacy_, 3rd ed., 2025. This is secondary orientation; the
  construction and security claims above are tied to the primary/authoritative sources.

## Development and verification

Use a Node version accepted by `.nvmrc`/`package.json`, then install the exact lockfile:

```sh
npm ci
npm run ci
npx playwright install chromium
npm run test:e2e
npm run test:mutations
```

`npm run ci` checks formatting, TypeScript, lint, unit tests with coverage thresholds, and the
production build. Playwright claim tests independently implement field multiplication, rank by span
cardinality, encoding, and bounded decoding; accessibility tests cover axe WCAG A/AA, keyboard flow,
result states, 320/380/1280-pixel reflow, forced colors, and reduced motion. The mutation runner
first requires a clean unmodified baseline, applies one named defect at a time, and verifies exact
source restoration plus a clean restored baseline. See [EVIDENCE.md](EVIDENCE.md) for the evidence
map.
