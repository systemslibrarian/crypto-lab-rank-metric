import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

async function expectNoOverflow(page: Page): Promise<void> {
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    page: document.documentElement.scrollWidth,
  }));
  expect(dimensions.page).toBeLessThanOrEqual(dimensions.viewport);
}

async function expectNoAxeViolations(page: Page): Promise<void> {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  expect(results.violations).toEqual([]);
}

for (const viewport of [
  { name: "desktop", width: 1280, height: 900 },
  { name: "narrow", width: 320, height: 800 },
]) {
  test(`initial lesson passes axe and reflows at ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("./");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expectNoAxeViolations(page);
    await expectNoOverflow(page);
  });
}

test("interactive result, warning, and census states pass axe at 380px", async ({ page }) => {
  test.setTimeout(60_000);
  await page.setViewportSize({ width: 380, height: 820 });
  await page.goto("./");
  await page.locator("#scenario").selectOption("miscorrection");
  await page.getByRole("button", { name: "Run bounded decoder" }).click();
  await page.getByRole("button", { name: "Run all rank-two errors" }).click();
  await expect(page.locator("#census-result")).toHaveAttribute("data-status", "complete", {
    timeout: 45_000,
  });
  await expectNoAxeViolations(page);
  await expectNoOverflow(page);
});

test("keyboard flow reaches the skip link and operates both workbenches", async ({ page }) => {
  await page.goto("./");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to lesson" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#main-content")).toBeFocused();

  // The keyboard owns focus traversal; the value change is driven through the
  // select's own API. A key press on a closed <select> is platform widget
  // behaviour, not the lab's: End and ArrowDown change the value on Linux and
  // open the native popup on macOS, which made this assertion red on macOS and
  // green in CI for a reason that had nothing to do with retirement. "15" is the
  // option End reached on Linux, so the state the rest of the flow sees is the
  // same as before.
  const vector0 = page.locator("#vector-0");
  await vector0.focus();
  await expect(vector0).toBeFocused();
  await vector0.selectOption("15");
  await page.keyboard.press("Tab");
  await expect(page.locator("#vector-1")).toBeFocused();
  await expect(page.locator("#metric-result")).toHaveAttribute("data-status", "stale");

  await page.getByRole("button", { name: "Run bounded decoder" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#decoder-result")).toHaveAttribute("data-status", "current");
});

test("forced colors and reduced motion preserve controls and reflow", async ({ page }) => {
  await page.emulateMedia({ forcedColors: "active", reducedMotion: "reduce" });
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto("./");
  await expect(page.getByRole("button", { name: "Compute both weights" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Run bounded decoder" })).toBeVisible();
  await expectNoAxeViolations(page);
  await expectNoOverflow(page);
});
