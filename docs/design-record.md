# S10 rank-metric lesson design record

Date: 2026-10-26 (America/New_York)

Status: Live — independently reviewed, merged, exact-main tested, deployed and public-byte verified

## Selection

Build a standalone companion rather than adding a panel to PQ Families, McEliece Gate, or HQC Vault.
Those three labs were refreshed from GitHub before this decision. They teach family comparison,
binary Goppa/Hamming-metric decoding, and quasi-cyclic Hamming-metric decoding respectively; placing
a Gabidulin construction inside any of them would blur rather than explain the metric boundary.

The bounded construction is the binary-extension Gabidulin code `G_2(g)` over `GF(2^4)` with
primitive polynomial `x^4 + x + 1`, length `n = 4`, dimension `k = 2`, evaluation vector
`g = (1, alpha, alpha^2, alpha^3)`, minimum rank distance `d = n - k + 1 = 3`, and unique-decoding
radius `t = 1`. A message `(a0, a1)` encodes by evaluating the linearized polynomial
`f(x) = a0*x + a1*x^2` at the four base-field-independent evaluation points. The learner decoder
will exhaust all 256 codewords and accept only a unique candidate at rank distance at most one; it
is deliberately not presented as Gabidulin's efficient algebraic decoder.

## Independently enumerated invariants

Before repository creation, a separate Node computation enumerated the complete toy space and
established:

- 256 distinct codewords;
- nonzero rank-weight distribution: 225 codewords of rank 3 and 30 of rank 4;
- exact minimum rank distance 3;
- error `(alpha + 1, alpha + 1, alpha + 1, alpha + 1)` has Hamming weight 4 and rank weight 1 and
  uniquely decodes to the transmitted word;
- among all 7,350 rank-two errors from the zero word, the radius-one decoder refuses 1,050 and
  miscorrects 6,300; it never returns the transmitted word and never has two radius-one candidates;
- `(alpha^3 + alpha, 1, 0, 0)` is a pinned refusal example, while `(alpha, 1, 0, 0)` is a pinned
  miscorrection example.

The implementation and tests must recompute these values. They are not permission to hardcode a
displayed outcome.

## Primary and authoritative sources reviewed

- E. M. Gabidulin, “Theory of Codes with Maximum Rank Distance,” _Problems of Information
  Transmission_ 21(1), 1985, pp. 1–12 (English translation metadata; received 17 September 1984).
  The publisher record states the rank norm, MRD construction, spectrum, and encoding/decoding
  algorithms. The implementation uses the code construction, not a public-key scheme.
- P. Gaborit, A. Otmani, and H. Talé Kalachi, “Polynomial-Time Key Recovery Attack on the
  Faure–Loidreau Scheme based on Gabidulin Codes,” arXiv:1606.07760, §§2–3 and 6. Definition 2 gives
  rank weight as the base-field span dimension; Definition 3 and equations (4)–(5) give the
  linearized-polynomial and generator-matrix forms; the paper states the `floor((n-k)/2)` decoding
  radius and documents structural key recovery against the named encryption scheme.
- NIST IR 8309, §3.16, 2020. NIST describes RQC as a structured rank-metric KEM, records the
  near-complete algebraic break of its Round-2 parameter sets and their reduction below 128 bits,
  and states that RQC did not advance while rank-based cryptography remained a research direction.

Secondary orientation: Ernst M. Gabidulin, “Schemes Based on Rank Codes,” in _Encyclopedia of
Cryptography, Security and Privacy_, 3rd ed. (2025), DOI entry `_388`, original PDF pp. 5355–5363.
The locally supplied split PDF places the title at its page 18, corresponding to original
position 5355. Its vector-to-matrix isometry and MRD overview informed the lesson sequence, but
primary papers govern construction and security claims.

## Required learner evidence

1. Expand every `GF(16)^4` vector into a `4 x 4` binary matrix in the declared polynomial basis and
   compute the matrix rank.
2. Compute Hamming and rank weight from the same selected vector and show examples where they
   differ.
3. Generate all codewords from the actual linearized-polynomial evaluation, verify cardinality,
   minimum distance, and the rank-metric Singleton equality.
4. Add real error vectors, derive received words by field addition, run the bounded decoder, and
   independently re-encode any reported message.
5. Show a within-radius correction, a beyond-radius refusal, and a beyond-radius miscorrection
   without treating the last two as contradictions of the decoding guarantee.
6. Keep “Gabidulin code,” “GPT/Faure–Loidreau cryptosystems,” “RQC,” “Classic McEliece,” and “HQC”
   visibly distinct. The lesson implements no encryption, KEM, security reduction, or deployable
   parameter set.

## Gates planned

- exhaustive field and complete toy-code unit tests with an independently structured arithmetic
  oracle;
- coverage thresholds that cannot be lowered to land the feature;
- browser claim tests that recompute displayed values rather than matching prose alone;
- keyboard, axe WCAG A/AA, forced-colors, reduced-motion, and 320/1280 px reflow checks;
- a clean-baseline mutation gate with named source mutations, exact source restoration, and a
  restored-baseline check;
- immutable production build, dependency audit, CodeQL, exact Pages artifact, and post-merge
  served-asset verification.

## Implementation evidence before merge

The feature branch now computes the field, matrix expansion, weights, complete 256-word census,
bounded decoder, three pinned controls, and complete rank-two census from executable state. The unit
suite has 22 tests and exhausts all 57,856 codeword/rank-at-most-one-error combinations. Its latest
local coverage result is 99.43% statements, 96.47% branches, 100% functions, and 100% lines across
`src/rank/**`; formatting, TypeScript, ESLint, the exact lockfile install, dependency audit, and the
production build also pass locally.

The Mac browser exits before page creation at its operating-system Mach-port registration step, so
no local browser pass is claimed. The Playwright claims/accessibility suite and the clean-baseline
ten-mutation campaign therefore required hosted Linux execution before the candidate could be
considered verified.

## Delivered verification

[PR #1](https://github.com/systemslibrarian/crypto-lab-rank-metric/pull/1) was independently
reviewed at feature head `6840a8266f78a65a7959d5a34e6bb18f1433d25e` and squash-merged as exact main
`ea94a1dc44859703373a35d089d1569b95373b34`; the trees are identical. Exact-main workflow
`40438547444` passed 22 unit tests, 99.48/95.60/100/100 coverage, six independent browser claim
checks, five accessibility/keyboard/forced-colors/reduced-motion/reflow checks, a clean baseline
followed by all ten named mutations and the restored baseline, the production build and a
zero-vulnerability dependency audit. CodeQL run `40438154639` also passed.

Pages artifact `12705945144` deployed successfully for the exact merge SHA. A fresh build from that
revision matched the public HTML, JavaScript and CSS byte for byte; their SHA-256 values are
`88fc3f265bf903daa979e811d9e1d3791522dd88fb1a392b2c9f3dec21ec180e`,
`6c5099c3455a737506509511b09e3d99792150615f151733689f9952c9988c3d`, and
`2d50d09d20f1115b8bd63b418ed157c364b390b648c87e3165cc4751284e4429`. The lesson is Live; Hub
catalog/roadmap integration remains a separate delivery rather than being implied by this lab
record.
