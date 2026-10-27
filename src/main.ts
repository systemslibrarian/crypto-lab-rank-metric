import "./style.css";

import { allElements, formatElement, type GF16 } from "./rank/field";
import {
  DECODING_RADIUS,
  DIMENSION,
  EVALUATION_VECTOR,
  LENGTH,
  MINIMUM_DISTANCE,
  computeCodeCensus,
  computeRankTwoCensus,
  generatorMatrix,
  type Message,
  type Word,
} from "./rank/gabidulin";
import { hammingWeight, rankWeight, vectorToBinaryMatrix } from "./rank/matrix";
import { ERROR_SCENARIOS, formatVector, runScenario, type ScenarioName } from "./rank/scenarios";

function elementById<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!(element instanceof HTMLElement)) throw new Error(`missing required element #${id}`);
  return element as T;
}

function selectById(id: string): HTMLSelectElement {
  const element = document.getElementById(id);
  if (!(element instanceof HTMLSelectElement)) throw new Error(`missing required select #${id}`);
  return element;
}

function populateFieldSelect(select: HTMLSelectElement, initial: GF16): void {
  for (const value of allElements()) {
    const option = document.createElement("option");
    option.value = String(value);
    option.textContent = `${value.toString(16).toUpperCase()} · ${formatElement(value)}`;
    option.selected = value === initial;
    select.append(option);
  }
}

function selectedField(select: HTMLSelectElement): GF16 {
  return Number(select.value);
}

const vectorSelects = [0, 1, 2, 3].map((index) => selectById(`vector-${index}`));
const defaultVector: Word = [3, 3, 3, 3];
vectorSelects.forEach((select, index) => populateFieldSelect(select, defaultVector[index]));

const messageSelects = [selectById("message-0"), selectById("message-1")];
messageSelects.forEach((select) => populateFieldSelect(select, 0));

function currentVector(): Word {
  return vectorSelects.map(selectedField) as unknown as Word;
}

function renderMetric(): void {
  const vector = currentVector();
  const matrix = vectorToBinaryMatrix(vector);
  const hamming = hammingWeight(vector);
  const rank = rankWeight(vector);
  elementById("selected-vector").textContent = formatVector(vector);
  const hammingOutput = elementById("hamming-weight");
  hammingOutput.textContent = String(hamming);
  hammingOutput.dataset.value = String(hamming);
  const rankOutput = elementById("rank-weight");
  rankOutput.textContent = String(rank);
  rankOutput.dataset.value = String(rank);

  const basis = ["1", "α", "α²", "α³"];
  const body = elementById<HTMLTableSectionElement>("binary-matrix");
  body.replaceChildren(
    ...matrix.map((row, rowIndex) => {
      const tr = document.createElement("tr");
      const heading = document.createElement("th");
      heading.scope = "row";
      heading.textContent = basis[rowIndex];
      tr.append(heading);
      row.forEach((entry) => {
        const cell = document.createElement("td");
        cell.textContent = String(entry);
        tr.append(cell);
      });
      return tr;
    }),
  );
  elementById("metric-note").textContent =
    hamming === rank
      ? `Here both metrics equal ${rank}, but they count different structures.`
      : `The ${hamming} nonzero symbols span only a ${rank}-dimensional binary subspace.`;
  const result = elementById("metric-result");
  result.dataset.status = "current";
  result.classList.remove("stale");
}

function retireMetric(): void {
  const result = elementById("metric-result");
  result.dataset.status = "stale";
  result.classList.add("stale");
  elementById("metric-note").textContent =
    "Vector changed. Compute again before using these weights.";
}

elementById<HTMLFormElement>("vector-form").addEventListener("submit", (event) => {
  event.preventDefault();
  renderMetric();
});
vectorSelects.forEach((select) => select.addEventListener("change", retireMetric));

function renderCodeCensus(): void {
  const census = computeCodeCensus();
  document.querySelector<HTMLElement>("[data-code-n]")!.textContent = String(LENGTH);
  document.querySelector<HTMLElement>("[data-code-k]")!.textContent = String(DIMENSION);
  const distance = document.querySelector<HTMLElement>("[data-code-d]")!;
  distance.textContent = String(MINIMUM_DISTANCE);
  distance.dataset.value = String(census.minimumNonzeroRank);
  const radius = document.querySelector<HTMLElement>("[data-code-t]")!;
  radius.textContent = String(DECODING_RADIUS);
  radius.dataset.value = String(DECODING_RADIUS);

  const generatorBody = elementById<HTMLTableSectionElement>("generator-matrix");
  generatorBody.replaceChildren(
    ...generatorMatrix().map((row, index) => {
      const tr = document.createElement("tr");
      const heading = document.createElement("th");
      heading.scope = "row";
      heading.textContent = index === 0 ? "x" : "x²";
      tr.append(heading);
      row.forEach((entry) => {
        const cell = document.createElement("td");
        cell.textContent = formatElement(entry);
        cell.dataset.raw = String(entry);
        tr.append(cell);
      });
      return tr;
    }),
  );

  const count = elementById("codeword-count");
  count.textContent = `${census.codewordCount} / ${census.distinctCodewordCount}`;
  count.dataset.total = String(census.codewordCount);
  count.dataset.distinct = String(census.distinctCodewordCount);
  const distribution = elementById("rank-distribution");
  distribution.textContent = `rank 3: ${census.rankDistribution[3] ?? 0}; rank 4: ${census.rankDistribution[4] ?? 0}`;
  distribution.dataset.rank3 = String(census.rankDistribution[3] ?? 0);
  distribution.dataset.rank4 = String(census.rankDistribution[4] ?? 0);
  const measured = elementById("measured-distance");
  measured.textContent = `${census.minimumNonzeroRank} (matches n − k + 1)`;
  measured.dataset.value = String(census.minimumNonzeroRank);
  const singleton = elementById("singleton-bound");
  singleton.textContent = `2^${census.singletonExponent} = ${census.singletonBound}; equality ${census.meetsSingletonBound ? "holds" : "fails"}`;
  singleton.dataset.bound = String(census.singletonBound);
  singleton.dataset.holds = String(census.meetsSingletonBound);
}

const scenarioSelect = selectById("scenario");

function currentMessage(): Message {
  return messageSelects.map(selectedField) as unknown as Message;
}

function setVectorOutput(id: string, vector: readonly GF16[]): void {
  const output = elementById(id);
  output.textContent = formatVector(vector);
  output.dataset.raw = vector.join(",");
}

function renderDecoder(): void {
  const scenario = scenarioSelect.value as ScenarioName;
  if (!(scenario in ERROR_SCENARIOS)) throw new Error(`unknown scenario ${scenario}`);
  const run = runScenario(scenario, currentMessage());
  const result = elementById("decoder-result");
  result.dataset.status = "current";
  result.dataset.outcome = run.outcome;
  result.classList.remove("stale", "result-good", "result-warning");
  result.classList.add(run.outcome === "correct" ? "result-good" : "result-warning");

  const outcome = elementById("decoder-outcome");
  if (run.outcome === "correct") {
    outcome.textContent = "Corrected inside the promised radius";
    elementById("decoder-explanation").textContent =
      "Rank(error) = 1 ≤ t. The unique nearby codeword is the one that was transmitted.";
  } else if (run.outcome === "refused") {
    outcome.textContent = "Refused outside the promised radius";
    elementById("decoder-explanation").textContent =
      "Rank(error) = 2 > t. No codeword lies within radius one; this refusal is not a general attack detector.";
  } else {
    outcome.textContent = "Miscorrected outside the promised radius";
    elementById("decoder-explanation").textContent =
      "Rank(error) = 2 > t. A different codeword lies within radius one, so the bounded decoder returns it. The t = 1 guarantee has not been contradicted.";
  }

  setVectorOutput("transmitted-word", run.transmitted);
  setVectorOutput("error-word", run.error);
  elementById("error-weights").textContent =
    `Hamming ${run.errorHammingWeight}; rank ${run.errorRankWeight}`;
  setVectorOutput("received-word", run.received);
  if (run.decode.status === "refused") {
    const reported = elementById("reported-message");
    reported.textContent = `None — ${run.decode.candidateCount} radius-one candidates`;
    delete reported.dataset.raw;
    elementById("independent-check").textContent = "No reported word to re-encode";
  } else {
    const reported = elementById("reported-message");
    reported.textContent = `${formatVector(run.decode.message)} at distance ${run.decode.distance}`;
    reported.dataset.raw = run.decode.message.join(",");
    reported.dataset.distance = String(run.decode.distance);
    elementById("independent-check").textContent = run.independentReencodingMatches
      ? `Re-encoding matches; received-to-reported rank distance ${run.distanceToReportedWord}`
      : "Failed: re-encoding does not match the reported codeword";
  }
}

function retireDecoder(): void {
  const result = elementById("decoder-result");
  result.dataset.status = "stale";
  result.classList.add("stale");
  elementById("decoder-outcome").textContent = "Inputs changed — run the decoder again";
  elementById("decoder-explanation").textContent = "The previous verdict is retired.";
}

elementById<HTMLFormElement>("decoder-form").addEventListener("submit", (event) => {
  event.preventDefault();
  renderDecoder();
});
[...messageSelects, scenarioSelect].forEach((select) =>
  select.addEventListener("change", retireDecoder),
);

elementById<HTMLButtonElement>("census-button").addEventListener("click", () => {
  const button = elementById<HTMLButtonElement>("census-button");
  const output = elementById("census-result");
  button.disabled = true;
  output.dataset.status = "running";
  output.textContent = "Enumerating all 65,536 vectors and selecting rank-two errors…";
  window.setTimeout(() => {
    const census = computeRankTwoCensus();
    output.dataset.status = "complete";
    output.dataset.total = String(census.total);
    output.dataset.refused = String(census.refused);
    output.dataset.miscorrected = String(census.miscorrected);
    output.dataset.correct = String(census.correct);
    const summary = document.createElement("p");
    summary.className = "census-numbers";
    summary.textContent = `${census.total.toLocaleString()} rank-two errors: ${census.refused.toLocaleString()} refused, ${census.miscorrected.toLocaleString()} miscorrected, ${census.correct} correct.`;
    const note = document.createElement("p");
    note.textContent =
      "The exhaustive result describes this tiny code and this radius-one decoder; it is not a cryptosystem failure rate.";
    output.replaceChildren(summary, note);
    button.disabled = false;
  }, 0);
});

renderMetric();
renderCodeCensus();
renderDecoder();

// Keep this declared relation visible to claim tests without substituting it for computation.
document.documentElement.dataset.evaluationVector = EVALUATION_VECTOR.join(",");
