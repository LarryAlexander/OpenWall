import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("./");
});

async function expectNoHorizontalOverflow(page: import("@playwright/test").Page) {
  const widths = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    document: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
  }));
  expect(
    widths.document,
    `document width ${widths.document}px exceeded the ${widths.viewport}px viewport`,
  ).toBeLessThanOrEqual(widths.viewport);
  expect(
    widths.body,
    `body width ${widths.body}px exceeded the ${widths.viewport}px viewport`,
  ).toBeLessThanOrEqual(widths.viewport);
}

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

  const addedNote = page.getByRole("article").filter({ hasText: "Add your note here" });
  await expect(
    addedNote.getByRole("button", { name: "Move note card", exact: true }),
  ).toBeVisible();
  await expect(page.getByText(/drag cards by their top edge/i)).toBeVisible();

  await page.reload();
  await expect(page.getByText("Add your note here")).toBeVisible();
});

test("keeps mobile navigation reachable and remembers offline readiness", async ({ page }) => {
  await page.getByRole("button", { name: /explore a sample home/i }).click();
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.getByRole("button", { name: "Settings" }).click();

  await expect(page.getByRole("heading", { name: "Install & connectivity" })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Each browser is its own OpenWall" }),
  ).toBeVisible();
  await expect(page.getByText(/phones do not sync with each other/i)).toBeVisible();
  await expect(page.getByText(/clearing site data or removing browser storage/i)).toBeVisible();
  await expect(page.getByText("Offline app files are ready")).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem("openwall-offline-ready-v1")))
    .toBe("true");

  await page.reload();
  await page.getByRole("button", { name: "Settings" }).click();
  await expect(page.getByText("Offline app files are ready")).toBeVisible();
});

test("keeps every primary view within iPad portrait and landscape widths", async ({ page }) => {
  const viewports = [
    { width: 768, height: 1024 },
    { width: 1024, height: 768 },
    { width: 834, height: 1194 },
    { width: 1194, height: 834 },
  ];

  await page.getByRole("button", { name: /explore a sample home/i }).click();

  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await page.getByRole("button", { name: "Today" }).click();
    await expect(page.getByRole("button", { name: "Settings", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Guide", exact: true })).toBeVisible();
    await expectNoHorizontalOverflow(page);

    await page.getByRole("button", { name: "Guide", exact: true }).click();
    await expectNoHorizontalOverflow(page);

    await page.getByRole("button", { name: "Settings", exact: true }).click();
    await expectNoHorizontalOverflow(page);
  }
});

test("reorders cards by dragging in the responsive board", async ({ page }) => {
  await page.setViewportSize({ width: 834, height: 1194 });
  await page.getByRole("button", { name: /explore a sample home/i }).click();
  await page.getByRole("button", { name: "Arrange", exact: true }).click();

  const board = page.locator(".open-corkboard");
  const schedule = board.locator('[data-widget-id="schedule"]');
  const tasks = board.locator('[data-widget-id="tasks"]');
  const scheduleGrip = schedule.getByRole("button", { name: "Move schedule card" });
  const taskBox = await tasks.boundingBox();
  const gripBox = await scheduleGrip.boundingBox();
  expect(taskBox).not.toBeNull();
  expect(gripBox).not.toBeNull();

  await page.mouse.move(gripBox!.x + gripBox!.width / 2, gripBox!.y + gripBox!.height / 2);
  await page.mouse.down();
  await page.mouse.move(taskBox!.x + taskBox!.width / 2, taskBox!.y + taskBox!.height - 10, {
    steps: 8,
  });
  await page.mouse.up();

  await expect
    .poll(() =>
      board
        .locator("[data-widget-id]")
        .evaluateAll((cards) => cards.map((card) => card.getAttribute("data-widget-id"))),
    )
    .toEqual(["welcome", "tasks", "schedule", "note", "meal", "countdown", "photo"]);
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
