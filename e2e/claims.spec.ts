import { expect, test, type Page } from "@playwright/test";

function multiply(left: number, right: number): number {
  let polynomial = 0;
  for (let bit = 0; bit < 4; bit += 1) {
    if (((right >> bit) & 1) === 1) polynomial ^= left << bit;
  }
  for (let degree = 6; degree >= 4; degree -= 1) {
    if (((polynomial >> degree) & 1) === 1) polynomial ^= 0b1_0011 << (degree - 4);
  }
  return polynomial;
}

function spanRank(vector: readonly number[]): number {
  let span = new Set([0]);
  for (const value of vector) {
    span = new Set([...span, ...[...span].map((member) => member ^ value)]);
  }
  return Math.log2(span.size);
}

function encode([a0, a1]: readonly [number, number]): number[] {
  return [1, 2, 4, 8].map((point) => multiply(a0, point) ^ multiply(a1, multiply(point, point)));
}

function decode(received: readonly number[]): { message: number[]; distance: number } | null {
  const candidates: { message: number[]; distance: number }[] = [];
  for (let a0 = 0; a0 < 16; a0 += 1) {
    for (let a1 = 0; a1 < 16; a1 += 1) {
      const word = encode([a0, a1]);
      const distance = spanRank(word.map((entry, index) => entry ^ received[index]));
      if (distance <= 1) candidates.push({ message: [a0, a1], distance });
    }
  }
  return candidates.length === 1 ? candidates[0] : null;
}

async function displayedMatrix(page: Page): Promise<string[][]> {
  return page
    .locator("#binary-matrix tr")
    .evaluateAll((rows) =>
      rows.map((row) =>
        [...row.querySelectorAll("th,td")].map((cell) => cell.textContent?.trim() ?? ""),
      ),
    );
}

test.beforeEach(async ({ page }) => {
  await page.goto("./");
});

test("the page labels its exact construction and non-cryptosystem boundary", async ({ page }) => {
  await expect(page).toHaveTitle("Rank Metric Lab · Crypto Lab");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.getByRole("heading", { level: 1, name: "Rank Metric Lab" })).toBeVisible();
  await expect(page.getByText("Not a cryptosystem.", { exact: true })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("data-evaluation-vector", "1,2,4,8");
  await expect(page.getByText("GF(2⁴) = GF(2)[α]/(α⁴ + α + 1)")).toBeVisible();
});

test("the metric panel recomputes the binary matrix and retires stale output", async ({ page }) => {
  expect(spanRank([3, 3, 3, 3])).toBe(1);
  await expect(page.locator("#hamming-weight")).toHaveAttribute("data-value", "4");
  await expect(page.locator("#rank-weight")).toHaveAttribute("data-value", "1");
  expect(await displayedMatrix(page)).toEqual([
    ["1", "1", "1", "1", "1"],
    ["α", "1", "1", "1", "1"],
    ["α²", "0", "0", "0", "0"],
    ["α³", "0", "0", "0", "0"],
  ]);

  for (const [index, value] of [1, 2, 4, 8].entries()) {
    await page.locator(`#vector-${index}`).selectOption(String(value));
  }
  await expect(page.locator("#metric-result")).toHaveAttribute("data-status", "stale");
  await expect(page.getByText(/Vector changed/)).toBeVisible();
  await page.getByRole("button", { name: "Compute both weights" }).click();
  await expect(page.locator("#metric-result")).toHaveAttribute("data-status", "current");
  await expect(page.locator("#hamming-weight")).toHaveAttribute("data-value", "4");
  await expect(page.locator("#rank-weight")).toHaveAttribute("data-value", "4");
  expect(spanRank([1, 2, 4, 8])).toBe(4);
  expect(await displayedMatrix(page)).toEqual([
    ["1", "1", "0", "0", "0"],
    ["α", "0", "1", "0", "0"],
    ["α²", "0", "0", "1", "0"],
    ["α³", "0", "0", "0", "1"],
  ]);
});

test("the full code census and generator matrix agree with an independent encoder", async ({
  page,
}) => {
  const words = new Set<string>();
  const ranks = new Map<number, number>();
  for (let a0 = 0; a0 < 16; a0 += 1) {
    for (let a1 = 0; a1 < 16; a1 += 1) {
      const word = encode([a0, a1]);
      words.add(word.join(","));
      ranks.set(spanRank(word), (ranks.get(spanRank(word)) ?? 0) + 1);
    }
  }
  expect(words.size).toBe(256);
  expect(Object.fromEntries(ranks)).toEqual({ 0: 1, 3: 225, 4: 30 });

  const generator = await page
    .locator("#generator-matrix tr")
    .evaluateAll((rows) =>
      rows.map((row) =>
        [...row.querySelectorAll("td")].map((cell) => Number((cell as HTMLElement).dataset.raw)),
      ),
    );
  expect(generator).toEqual([encode([1, 0]), encode([0, 1])]);
  await expect(page.locator("#codeword-count")).toHaveAttribute("data-total", "256");
  await expect(page.locator("#codeword-count")).toHaveAttribute("data-distinct", "256");
  await expect(page.locator("#rank-distribution")).toHaveAttribute("data-rank3", "225");
  await expect(page.locator("#rank-distribution")).toHaveAttribute("data-rank4", "30");
  await expect(page.locator("#measured-distance")).toHaveAttribute("data-value", "3");
  await expect(page.locator("#singleton-bound")).toHaveAttribute("data-holds", "true");
});

test("the three decoder outcomes come from the selected message and actual errors", async ({
  page,
}) => {
  await page.locator("#message-0").selectOption("5");
  await page.locator("#message-1").selectOption("9");
  await expect(page.locator("#decoder-result")).toHaveAttribute("data-status", "stale");
  await page.getByRole("button", { name: "Run bounded decoder" }).click();
  const transmitted = encode([5, 9]);
  const withinError = [3, 3, 3, 3];
  const withinReceived = transmitted.map((value, index) => value ^ withinError[index]);
  expect(decode(withinReceived)).toEqual({ message: [5, 9], distance: 1 });
  await expect(page.locator("#decoder-result")).toHaveAttribute("data-outcome", "correct");
  await expect(page.locator("#transmitted-word")).toHaveAttribute(
    "data-raw",
    transmitted.join(","),
  );
  await expect(page.locator("#received-word")).toHaveAttribute(
    "data-raw",
    withinReceived.join(","),
  );
  await expect(page.locator("#reported-message")).toHaveAttribute("data-raw", "5,9");

  await page.locator("#scenario").selectOption("refusal");
  await expect(page.locator("#decoder-result")).toHaveAttribute("data-status", "stale");
  await page.getByRole("button", { name: "Run bounded decoder" }).click();
  const refusalReceived = transmitted.map((value, index) => value ^ [10, 1, 0, 0][index]);
  expect(decode(refusalReceived)).toBeNull();
  await expect(page.locator("#decoder-result")).toHaveAttribute("data-outcome", "refused");
  await expect(page.locator("#reported-message")).not.toHaveAttribute("data-raw", /.+/);

  await page.locator("#scenario").selectOption("miscorrection");
  await page.getByRole("button", { name: "Run bounded decoder" }).click();
  const wrongReceived = transmitted.map((value, index) => value ^ [2, 1, 0, 0][index]);
  const independentlyDecoded = decode(wrongReceived);
  expect(independentlyDecoded).not.toBeNull();
  expect(independentlyDecoded?.message).not.toEqual([5, 9]);
  await expect(page.locator("#decoder-result")).toHaveAttribute("data-outcome", "miscorrected");
  await expect(page.locator("#reported-message")).toHaveAttribute(
    "data-raw",
    independentlyDecoded!.message.join(","),
  );
  await expect(page.getByText(/guarantee has not been contradicted/)).toBeVisible();
});

test("the complete rank-two browser census reports the finite result", async ({ page }) => {
  test.setTimeout(60_000);
  await page.getByRole("button", { name: "Run all rank-two errors" }).click();
  const result = page.locator("#census-result");
  await expect(result).toHaveAttribute("data-status", "complete", { timeout: 45_000 });
  await expect(result).toHaveAttribute("data-total", "7350");
  await expect(result).toHaveAttribute("data-refused", "1050");
  await expect(result).toHaveAttribute("data-miscorrected", "6300");
  await expect(result).toHaveAttribute("data-correct", "0");
  await expect(result).toContainText("not a cryptosystem failure rate");
});

test("the family and source boundaries remain explicit", async ({ page }) => {
  const boundary = page.locator("#boundary");
  await expect(boundary).toContainText("No encryption, KEM, security reduction");
  await expect(boundary).toContainText(
    "Published structural attacks must be assessed per construction",
  );
  await expect(boundary).toContainText("did not advance");
  await expect(boundary).toContainText("Hamming-metric constructions");
  await expect(page.getByRole("link", { name: /Theory of Codes/ })).toHaveAttribute(
    "href",
    "https://www.mathnet.ru/eng/ppi967",
  );
  await expect(page.getByRole("link", { name: /arXiv:1606.07760/ })).toHaveAttribute(
    "href",
    "https://arxiv.org/abs/1606.07760",
  );
  await expect(page.getByRole("link", { name: /NIST IR 8309/ })).toHaveAttribute(
    "href",
    "https://doi.org/10.6028/NIST.IR.8309",
  );
});
