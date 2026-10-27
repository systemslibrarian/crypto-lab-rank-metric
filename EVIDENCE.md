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

## Current local evidence

- Unit tests: 22 passed.
- Coverage: 99.43% statements, 96.47% branches, 100% functions, 100% lines for `src/rank/**` in the
  latest recorded local run.
- TypeScript, ESLint, Prettier, production build, and no-source-map artifact verification: passed.
- Local Playwright launch: unavailable on this Mac because Chromium exits before page creation at
  the operating-system `MachPortRendezvousServer` bootstrap step. This is recorded as an environment
  failure, not a passing browser result; hosted Linux results are required before merge.
- Hosted browser/accessibility, mutation, CodeQL, exact-main deployment, and public-byte
  verification: not yet credited.
