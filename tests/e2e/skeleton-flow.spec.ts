import { expect, test } from "@playwright/test";

test.describe("Skeleton flow fixtures", () => {
  test("shows skeleton during delayed request and hides after completion", async ({ page }) => {
    await page.goto("/delayed-api/");
    await page.getByRole("button", { name: "Load Data" }).click();

    await expect(page.locator("#content")).toHaveAttribute("data-skeleton-visible", "true");
    const overlay = page.locator('[data-skeleton-node="sknet-skeleton-node"]');
    await expect(overlay).toBeVisible();
    await expect(overlay).toHaveCSS("background-image", /gradient/i);
    await expect(page.locator("#status")).toContainText("Loaded data");
    await expect(page.locator("#content")).toHaveAttribute("data-skeleton-visible", "false");
  });

  test("emits error signal without leaving stale skeleton", async ({ page }) => {
    await page.goto("/delayed-api/");
    await page.getByRole("button", { name: "Load Error" }).click();

    await expect(page.locator("#status")).toContainText("Request failed");
    await expect(page.locator("#content")).toHaveAttribute("data-skeleton-visible", "false");
  });

  test("handles repeated requests and clears skeleton state", async ({ page }) => {
    await page.goto("/delayed-api/");
    await page.getByRole("button", { name: "Load 3x" }).click();

    await expect(page.locator("#status")).toContainText("Loaded x3");
    await expect(page.locator("#content")).toHaveAttribute("data-skeleton-visible", "false");
    await expect(page.locator('[data-skeleton-node="sknet-skeleton-node"]')).toHaveCount(0);
  });
});
