import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("./");
});

test("opens the fictional household and completes a task", async ({ page }) => {
  await page.getByRole("button", { name: /explore a sample home/i }).click();
  await expect(page.getByRole("heading", { name: /today’s rhythm/i })).toBeVisible();
  const task = page.getByRole("button", { name: /complete feed pepper/i });
  await task.click();
  await expect(page.getByRole("button", { name: /mark incomplete feed pepper/i })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("button", { name: /mark incomplete feed pepper/i })).toBeVisible();
});

test("creates a blank household and adds a task", async ({ page }) => {
  await page.getByRole("button", { name: /set up my household/i }).click();
  await page.getByLabel("Household name").fill("The Test Home");
  await page.getByPlaceholder("Your name").fill("Alex");
  await page.getByPlaceholder("Another person").fill("Sam");
  await page.getByRole("button", { name: /create our board/i }).click();
  await expect(page.getByText("The Test Home")).toBeVisible();
  await page.getByRole("button", { name: "Add task" }).click();
  await page.getByLabel("What needs doing?").fill("Test the wall");
  await page.getByRole("button", { name: "Save task" }).click();
  await expect(page.getByText("Test the wall")).toBeVisible();
});

test("adds a card and enters safe arrange mode", async ({ page }) => {
  await page.getByRole("button", { name: /explore a sample home/i }).click();
  await page.getByRole("button", { name: "Add to board" }).click();
  await page.getByRole("button", { name: /sticky note/i }).click();
  await expect(page.getByText("Add your note here")).toBeVisible();

  await expect(page.getByRole("button", { name: "Done arranging" })).toBeVisible();
  await expect(page.getByRole("button", { name: /move note card/i })).toBeVisible();
  await expect(page.getByText(/drag cards by their top edge/i)).toBeVisible();
});

test("shows settings and requires confirmation before erase", async ({ page }) => {
  await page.getByRole("button", { name: /explore a sample home/i }).click();
  await page.getByRole("button", { name: "Settings" }).click();
  await page.getByRole("button", { name: /erase household/i }).click();
  await expect(page.getByRole("dialog", { name: /erase this household/i })).toBeVisible();
  await page.getByRole("button", { name: "Cancel" }).click();
  await expect(page.getByText("The River House")).toBeHidden();
});

test("personalizes the board and keeps appearance on this device", async ({ page }) => {
  await page.getByRole("button", { name: /explore a sample home/i }).click();
  await page.getByRole("button", { name: "Settings" }).click();

  await page.getByRole("radio", { name: /ocean mist/i }).click();
  await page.getByRole("radio", { name: /^dark/i }).click();
  await page.getByRole("radio", { name: /^gentle/i }).click();

  await expect(page.locator("html")).toHaveAttribute("data-color-theme", "ocean-mist");
  await expect(page.locator("html")).toHaveAttribute("data-color-mode", "dark");
  await expect(page.locator("html")).toHaveAttribute("data-motion", "gentle");

  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-color-theme", "ocean-mist");
  await expect(page.locator("html")).toHaveAttribute("data-color-mode", "dark");
  await expect(page.locator("html")).toHaveAttribute("data-motion", "gentle");
});

test("reopens the saved household while offline", async ({ page, browserName }) => {
  test.skip(browserName === "webkit", "Playwright WebKit cannot reliably reload an offline page.");
  await page.getByRole("button", { name: /explore a sample home/i }).click();
  await expect(page.getByRole("heading", { name: /today’s rhythm/i })).toBeVisible();
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await expect(page.getByRole("heading", { name: /today’s rhythm/i })).toBeVisible();
  await page.context().setOffline(true);
  try {
    await page.reload();
    await expect(page.getByRole("heading", { name: /today’s rhythm/i })).toBeVisible();
  } finally {
    await page.context().setOffline(false);
  }
});
