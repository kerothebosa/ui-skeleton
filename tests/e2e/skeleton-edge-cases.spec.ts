import { expect, test } from "@playwright/test";

test.describe("Skeleton edge cases", () => {
  test("does not show skeleton for fast responses under showDelayMs", async ({ page }) => {
    await page.goto("/delayed-api/");
    await page.getByRole("button", { name: "Load Fast" }).click();

    await expect(page.locator("#status")).toContainText("Loaded fast");
    await expect(page.locator("#content")).toHaveAttribute("data-skeleton-visible", "false");
    await expect(page.locator('[data-skeleton-node="sknet-skeleton-node"]')).toHaveCount(0);
  });

  test("times out long requests and clears skeleton state", async ({ page }) => {
    await page.goto("/delayed-api/");
    await page.getByRole("button", { name: "Load Timeout" }).click();

    await expect(page.locator("#status")).toContainText("Timed out");
    await expect(page.locator("#content")).toHaveAttribute("data-skeleton-visible", "false");
    await expect(page.locator('[data-skeleton-node="sknet-skeleton-node"]')).toHaveCount(0);
  });

  test("handles mixed success and failure requests without stale overlay", async ({ page }) => {
    await page.goto("/delayed-api/");
    await page.getByRole("button", { name: "Load Mixed" }).click();

    await expect(page.locator("#status")).toContainText("Mixed complete");
    await expect(page.locator("#content")).toHaveAttribute("data-skeleton-visible", "false");
    await expect(page.locator('[data-skeleton-node="sknet-skeleton-node"]')).toHaveCount(0);
  });

  test("stop during in-flight request clears skeleton state", async ({ page }) => {
    await page.goto("/delayed-api/");
    await page.getByRole("button", { name: "Stop During Request" }).click();

    await expect(page.locator("#status")).toContainText("Stopped cleanly");
    await expect(page.locator("#content")).toHaveAttribute("data-skeleton-visible", "false");
    await expect(page.locator('[data-skeleton-node="sknet-skeleton-node"]')).toHaveCount(0);
  });
});
