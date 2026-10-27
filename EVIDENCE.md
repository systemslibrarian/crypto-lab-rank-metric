# Verification evidence

This map identifies the checks that own each learner-visible claim. Counts are updated only from
completed runs.

| Claim                                                    | Implementation                              | Independent evidence                                                                                                             |
| -------------------------------------------------------- | ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `GF(16)` uses `x^4+x+1` and `α` is primitive             | `src/rank/field.ts`                         | all 256 products compared with a separately structured polynomial oracle; all nonzero powers/inverses checked in `field.test.ts` |
| rank weight is binary-matrix rank                        | `src/rank/matrix.ts`                        | compared with independent base-field span cardinality for every `GF(16)^2` vector in `matrix.test.ts`                            |
| generator rows and all 256 words are genuine evaluations | `src/rank/gabidulin.ts`                     | independent carryless-polynomial encoder checks every message in `gabidulin.test.ts` and `e2e/claims.spec.ts`                    |
| minimum rank distance is 3 and Singleton equality holds  | `computeCodeCensus()`                       | complete codebook census plus independent span-rank census in unit/browser tests                                                 |
| every error of rank at most one is corrected             | `boundedDecode()`                           | all 256 words × 226 rank-zero/rank-one errors in `gabidulin.test.ts`                                                             |
| rank-two controls can refuse or miscorrect               | `runScenario()`                             | pinned controls plus complete 7,350-error census in unit tests and learner-triggered browser census                              |
| changed inputs retire old verdicts                       | `src/main.ts`                               | browser tests change vector, message, and scenario inputs before rerunning                                                       |
| family/security status remains bounded                   | learner boundary table, README, limitations | browser regressions pin non-claims and primary/authoritative source links                                                        |

## Delivered evidence

- Reviewed feature head `6840a8266f78a65a7959d5a34e6bb18f1433d25e` was squash-merged by
  [PR #1](https://github.com/systemslibrarian/crypto-lab-rank-metric/pull/1) as exact main
  `ea94a1dc44859703373a35d089d1569b95373b34`; their trees are identical.
- Exact-main
  [verification and deployment run `40438547444`](https://github.com/systemslibrarian/crypto-lab-rank-metric/actions/runs/40438547444)
  passed formatting, TypeScript, ESLint, the production build and the dependency audit with zero
  vulnerabilities. Its unit gate passed 22/22 tests with 99.48% statements, 95.60% branches, 100%
  functions and 100% lines over `src/rank/**`.
- The same exact-main run passed all 6 learner-visible claim checks and all 5
  accessibility/keyboard/forced-colors/reduced-motion/reflow checks. Its independent job first
  passed the unmodified baseline, caught all 10 named source mutations, verified source restoration
  and passed the restored unit/build baseline.
- Exact-main
  [CodeQL run `40438154639`](https://github.com/systemslibrarian/crypto-lab-rank-metric/actions/runs/40438154639)
  completed successfully.
- Pages artifact `12705945144` is 10,322 bytes with upload SHA-256
  `f550fc23c8550be17ebf728a37996c3d3a2399410678833ba06170713e3871ea`; the deploy job reported
  success for exact merge SHA `ea94a1dc44859703373a35d089d1569b95373b34`.
- A fresh exact-main build and the public site matched byte for byte: `index.html`
  `88fc3f265bf903daa979e811d9e1d3791522dd88fb1a392b2c9f3dec21ec180e`, JavaScript
  `6c5099c3455a737506509511b09e3d99792150615f151733689f9952c9988c3d`, and CSS
  `2d50d09d20f1115b8bd63b418ed157c364b390b648c87e3165cc4751284e4429` (SHA-256).
- Local Playwright launch: unavailable on this Mac because Chromium exits before page creation at
  the operating-system `MachPortRendezvousServer` bootstrap step. This is recorded as an environment
  failure, not a passing browser result; the exact-main hosted Linux results above supply the
  browser authority.
