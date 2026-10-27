import { describe, expect, it } from "vitest";

import { ERROR_SCENARIOS, formatVector, runScenario } from "./scenarios";

describe("learner-visible decoder controls", () => {
  it("derives the within-radius correction from the selected message", () => {
    const run = runScenario("within", [5, 9]);
    expect(run.error).toEqual(ERROR_SCENARIOS.within.error);
    expect(run.errorHammingWeight).toBe(4);
    expect(run.errorRankWeight).toBe(1);
    expect(run.outcome).toBe("correct");
    expect(run.decode).toMatchObject({ status: "decoded", message: [5, 9], distance: 1 });
    expect(run.independentReencodingMatches).toBe(true);
    expect(run.distanceToReportedWord).toBe(1);
  });

  it("derives a rank-two refusal without calling it a detected attack", () => {
    const run = runScenario("refusal", [0, 0]);
    expect(run.errorHammingWeight).toBe(2);
    expect(run.errorRankWeight).toBe(2);
    expect(run.outcome).toBe("refused");
    expect(run.decode).toEqual({ status: "refused", candidateCount: 0 });
    expect(run.independentReencodingMatches).toBe(false);
    expect(run.distanceToReportedWord).toBeNull();
  });

  it("derives a reproducible beyond-radius miscorrection", () => {
    const run = runScenario("miscorrection", [0, 0]);
    expect(run.errorHammingWeight).toBe(2);
    expect(run.errorRankWeight).toBe(2);
    expect(run.outcome).toBe("miscorrected");
    expect(run.decode).toMatchObject({ status: "decoded", message: [10, 8], distance: 1 });
    expect(run.independentReencodingMatches).toBe(true);
    expect(run.distanceToReportedWord).toBe(1);
  });

  it("formats extension-field vectors without hiding the basis", () => {
    expect(formatVector([0, 2, 10, 3])).toBe("(0, α, α³ + α, α + 1)");
  });
});
