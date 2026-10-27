import { formatElement, type GF16 } from "./field";
import {
  addWords,
  boundedDecode,
  encode,
  rankDistance,
  type DecodeResult,
  type Message,
  type Word,
} from "./gabidulin";
import { hammingWeight, rankWeight } from "./matrix";

export const ERROR_SCENARIOS = {
  within: {
    label: "Rank-one correction",
    error: [3, 3, 3, 3] as Word,
    expectation: "correct",
  },
  refusal: {
    label: "Rank-two refusal",
    error: [10, 1, 0, 0] as Word,
    expectation: "refused",
  },
  miscorrection: {
    label: "Rank-two miscorrection",
    error: [2, 1, 0, 0] as Word,
    expectation: "miscorrected",
  },
} as const;

export type ScenarioName = keyof typeof ERROR_SCENARIOS;

export interface ScenarioRun {
  name: ScenarioName;
  message: Message;
  transmitted: Word;
  error: Word;
  received: Word;
  errorHammingWeight: number;
  errorRankWeight: number;
  decode: DecodeResult;
  independentReencodingMatches: boolean;
  distanceToReportedWord: number | null;
  outcome: "correct" | "refused" | "miscorrected";
}

export function runScenario(name: ScenarioName, message: Message): ScenarioRun {
  const scenario = ERROR_SCENARIOS[name];
  const transmitted = encode(message);
  const received = addWords(transmitted, scenario.error);
  const decode = boundedDecode(received);
  const reportedWord = decode.status === "decoded" ? encode(decode.message) : null;
  const correct =
    decode.status === "decoded" &&
    decode.message[0] === message[0] &&
    decode.message[1] === message[1];
  return {
    name,
    message,
    transmitted,
    error: scenario.error,
    received,
    errorHammingWeight: hammingWeight(scenario.error),
    errorRankWeight: rankWeight(scenario.error),
    decode,
    independentReencodingMatches:
      decode.status === "decoded" &&
      reportedWord !== null &&
      reportedWord.every((value, index) => value === decode.word[index]),
    distanceToReportedWord: reportedWord === null ? null : rankDistance(received, reportedWord),
    outcome: decode.status === "refused" ? "refused" : correct ? "correct" : "miscorrected",
  };
}

export function formatVector(vector: readonly GF16[]): string {
  return `(${vector.map(formatElement).join(", ")})`;
}
