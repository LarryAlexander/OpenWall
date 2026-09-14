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
  const task = page.locator(".widget-tasks").getByRole("button", { name: /complete feed pepper/i });
  await task.click();
  await expect(page.getByRole("button", { name: /mark incomplete feed pepper/i })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("button", { name: /mark incomplete feed pepper/i })).toBeVisible();
});

test("opens the eight-person testing household and exposes the expanded navigation", async ({
  page,
}) => {
  await page.getByRole("button", { name: /8-person test household/i }).click();
  await expect(page.getByText("The River House · Test Bench")).toBeVisible();
  await expect(page.getByRole("button", { name: "Today", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Calendar", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "People" })).toBeVisible();
  await page.getByRole("button", { name: "Calendar", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Calendar" })).toBeVisible();
  await expect(page.getByText("Sun", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "People" }).click();
  await expect(page.getByRole("heading", { name: "People" })).toBeVisible();
  await expect(page.getByLabel("Name for Zuri")).toBeVisible();
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
  await expect(page.locator(".widget-tasks").getByText("Test the wall", { exact: true })).toBeVisible();
});

test("adds a card ready for direct manipulation", async ({ page }) => {
  await page.getByRole("button", { name: /explore a sample home/i }).click();
  await page.getByRole("button", { name: "Add to board" }).click();
  await page.locator(".widget-picker").getByRole("button", { name: /sticky note/i }).click();
  await expect(page.getByText("Add your note here")).toBeVisible();

  const addedNote = page.getByRole("article").filter({ hasText: "Add your note here" });
  await expect(
    addedNote.getByRole("button", { name: "Move note card", exact: true }),
  ).toBeVisible();
  await expect(
    addedNote.getByRole("button", { name: "Make note card larger", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Arrange", exact: true })).toHaveCount(0);

  await page.reload();
  await expect(page.getByText("Add your note here")).toBeVisible();
});

test("adds and persists a configured local weather card", async ({ page }) => {
  await page.route("https://geocoding-api.open-meteo.com/**", (route) =>
    route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        results: [
          {
            id: 4347778,
            name: "Baltimore",
            latitude: 39.2904,
            longitude: -76.6122,
            timezone: "America/New_York",
            country: "United States",
            admin1: "Maryland",
          },
        ],
      }),
    }),
  );
  await page.route("https://api.open-meteo.com/**", (route) =>
    route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        timezone: "America/New_York",
        current: {
          time: "2026-09-14T12:00",
          temperature_2m: 72,
          apparent_temperature: 71,
          weather_code: 1,
          is_day: 1,
          wind_speed_10m: 4,
        },
        daily: {
          time: ["2026-09-14", "2026-09-15", "2026-09-16", "2026-09-17", "2026-09-18"],
          weather_code: [1, 2, 3, 61, 80],
          temperature_2m_max: [76, 78, 74, 70, 73],
          temperature_2m_min: [61, 63, 60, 58, 59],
          precipitation_probability_max: [10, 20, 35, 70, 45],
        },
      }),
    }),
  );

  await page.getByRole("button", { name: /explore a sample home/i }).click();
  await page.getByRole("button", { name: "Add to board" }).click();
  await page.locator(".widget-picker").getByRole("button", { name: /weather plan around the forecast/i }).click();

  const weather = page.locator('[data-widget-id^="weather-"]');
  await expect(weather.getByRole("button", { name: "Set location" })).toBeVisible();
  await weather.getByRole("button", { name: "Set location" }).click();
  const dialog = page.getByRole("dialog", { name: "Weather location" });
  await dialog.getByLabel("Search for a city or town").fill("Baltimore");
  await dialog.getByRole("button", { name: /search places/i }).click();
  await dialog.getByRole("button", { name: /Baltimore.*Maryland/i }).click();

  await expect(weather.getByRole("heading", { name: "Baltimore" })).toBeVisible();
  await expect(weather.getByText("72°F", { exact: true })).toBeVisible();
  await expect(weather.getByText("Forecast via Open-Meteo", { exact: false })).toBeVisible();
  await expectNoHorizontalOverflow(page);

  await page.reload();
  const savedWeather = page.locator('[data-widget-id^="weather-"]');
  await expect(savedWeather.getByRole("heading", { name: "Baltimore" })).toBeVisible();
  await expect(savedWeather.getByText("72°F", { exact: true })).toBeVisible();
});

test("keeps mobile navigation reachable and remembers offline readiness", async ({ page }) => {
  await page.getByRole("button", { name: /explore a sample home/i }).click();
  await page.evaluate(async () => {
    if (!("serviceWorker" in navigator)) return;
    await Promise.race([
      navigator.serviceWorker.ready,
      new Promise((resolve) => setTimeout(resolve, 2000)),
    ]);
  });
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

test("fills the desktop navigation rail to the viewport", async ({ page }) => {
  await page.getByRole("button", { name: /explore a sample home/i }).click();

  for (const viewport of [
    { width: 1920, height: 1080 },
    { width: 1280, height: 800 },
  ]) {
    await page.setViewportSize(viewport);
    const rail = page.locator(".sidebar");
    const railBox = await rail.boundingBox();
    expect(railBox).not.toBeNull();
    expect(railBox!.height).toBeGreaterThanOrEqual(viewport.height - 1);
    await expect(page.getByRole("button", { name: "Settings", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Guide", exact: true })).toBeVisible();
    await expectNoHorizontalOverflow(page);
  }
});

test("keeps the entire Calendar page readable in portrait and compact layouts", async ({
  page,
}) => {
  await page.getByRole("button", { name: /explore a sample home/i }).click();

  for (const viewport of [
    { width: 990, height: 994 },
    { width: 768, height: 1024 },
    { width: 834, height: 1194 },
    { width: 1024, height: 768 },
    { width: 1280, height: 800 },
    { width: 1920, height: 1080 },
  ]) {
    await page.setViewportSize(viewport);
    await page.getByRole("button", { name: "Calendar", exact: true }).click();

    const metrics = await page.locator(".calendar-card").evaluate((card) => {
      const grid = card.querySelector<HTMLElement>(".calendar-grid");
      const firstDay = card.querySelector<HTMLElement>(".calendar-day");
      const toolbar = card.querySelector<HTMLElement>(".calendar-toolbar");
      if (!grid || !firstDay || !toolbar) return null;
      const cardBox = card.getBoundingClientRect();
      const gridBox = grid.getBoundingClientRect();
      const dayBox = firstDay.getBoundingClientRect();
      const gridStyle = getComputedStyle(grid);
      const cardStyle = getComputedStyle(card);
      return {
        cardWidth: cardBox.width,
        gridWidth: gridBox.width,
        dayWidth: dayBox.width,
        toolbarWidth: toolbar.getBoundingClientRect().width,
        cardColumnCount: cardStyle.gridTemplateColumns.trim().split(/\s+/).length,
        gridColumnCount: gridStyle.gridTemplateColumns.trim().split(/\s+/).length,
      };
    });

    const pageSections = await page.locator(".settings-view").evaluate((view) => {
      const viewBox = view.getBoundingClientRect();
      const sections = [
        ...view.querySelectorAll<HTMLElement>(
          ":scope > .calendar-card, :scope > .selected-day-card, :scope > .upcoming-card",
        ),
      ].map((section) => {
        const box = section.getBoundingClientRect();
        return { width: box.width, top: box.top, bottom: box.bottom };
      });
      return { width: viewBox.width, sections };
    });

    expect(metrics).not.toBeNull();
    expect(pageSections.sections, `${viewport.width}px Calendar sections`).toHaveLength(3);
    const sectionWidth = pageSections.sections[0].width;
    for (const [index, section] of pageSections.sections.entries()) {
      expect(section.width, `${viewport.width}px section ${index + 1} width`).toBeCloseTo(
        sectionWidth,
        1,
      );
      if (index > 0) {
        expect(
          section.top,
          `${viewport.width}px section ${index + 1} separation`,
        ).toBeGreaterThanOrEqual(pageSections.sections[index - 1].bottom);
      }
    }
    expect(sectionWidth, `${viewport.width}px Calendar content width`).toBeGreaterThan(
      pageSections.width * 0.8,
    );
    expect(metrics!.cardColumnCount, `${viewport.width}px card columns`).toBe(1);
    expect(metrics!.gridColumnCount, `${viewport.width}px month columns`).toBe(7);
    expect(metrics!.gridWidth, `${viewport.width}px calendar width`).toBeGreaterThan(
      metrics!.cardWidth * 0.8,
    );
    expect(metrics!.toolbarWidth, `${viewport.width}px toolbar width`).toBeGreaterThan(
      metrics!.cardWidth * 0.8,
    );
    expect(metrics!.dayWidth, `${viewport.width}px day cell width`).toBeGreaterThan(30);
    await expectNoHorizontalOverflow(page);
  }
});

test("keeps the People management page readable on narrow screens", async ({ page }) => {
  await page.getByRole("button", { name: /explore a sample home/i }).click();

  for (const viewport of [
    { width: 990, height: 994 },
    { width: 768, height: 1024 },
    { width: 834, height: 1194 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport);
    await page.getByRole("button", { name: "People", exact: true }).click();

    const metrics = await page.locator(".settings-view").evaluate((view) => {
      const addCard = view.querySelector<HTMLElement>(".add-person-card");
      const addCopy = addCard?.querySelector<HTMLElement>(":scope > div");
      const addInput = addCard?.querySelector<HTMLElement>(":scope > input");
      const addButton = addCard?.querySelector<HTMLElement>(":scope > button");
      const addStyle = addCard ? getComputedStyle(addCard) : null;
      const cards = [
        ...view.querySelectorAll<HTMLElement>(":scope > .settings-grid > .settings-card"),
      ].map((card) => {
        const box = card.getBoundingClientRect();
        return { width: box.width, top: box.top, bottom: box.bottom };
      });
      return {
        addColumns: addStyle?.gridTemplateColumns.trim().split(/\s+/).length ?? 0,
        addCopyWidth: addCopy?.getBoundingClientRect().width ?? 0,
        addInputWidth: addInput?.getBoundingClientRect().width ?? 0,
        addButtonWidth: addButton?.getBoundingClientRect().width ?? 0,
        cards,
      };
    });

    expect(metrics.addColumns, `${viewport.width}px add-member columns`).toBe(
      viewport.width <= 760 ? 1 : 3,
    );
    expect(metrics.addCopyWidth, `${viewport.width}px add-member copy`).toBeGreaterThan(120);
    expect(metrics.addInputWidth, `${viewport.width}px add-member input`).toBeGreaterThan(120);
    expect(metrics.addButtonWidth, `${viewport.width}px add-member button`).toBeGreaterThan(100);
    expect(metrics.cards.length, `${viewport.width}px People cards`).toBeGreaterThan(2);
    await expectNoHorizontalOverflow(page);
  }
});

test("keeps Rewards profile actions visibly separated", async ({ page }) => {
  await page.getByRole("button", { name: /explore a sample home/i }).click();

  for (const viewport of [
    { width: 990, height: 994 },
    { width: 768, height: 1024 },
    { width: 390, height: 844 },
    { width: 1280, height: 800 },
  ]) {
    await page.setViewportSize(viewport);
    await page.getByRole("button", { name: "Rewards", exact: true }).click();
    const row = page.locator(".reward-profile-card .button-row").first();
    await expect(row).toHaveCSS("display", /flex|grid/);
    const buttons = row.getByRole("button");
    const firstBox = await buttons.nth(0).boundingBox();
    const secondBox = await buttons.nth(1).boundingBox();
    expect(firstBox).not.toBeNull();
    expect(secondBox).not.toBeNull();
    expect(
      secondBox!.x - (firstBox!.x + firstBox!.width),
      `${viewport.width}px action gap`,
    ).toBeGreaterThanOrEqual(8);
    await expectNoHorizontalOverflow(page);
  }
});

test("keeps Today widget text readable across appearance modes", async ({ page }) => {
  await page.getByRole("button", { name: /explore a sample home/i }).click();

  const readWidgetContrast = async () =>
    page.evaluate(() => {
      type Rgba = [number, number, number, number];
      const parseColor = (value: string): Rgba | null => {
        const match = value.match(/rgba?\(([^)]+)\)/);
        if (!match) return null;
        const parts = match[1].split(",").map((part) => Number.parseFloat(part.trim()));
        if (parts.length < 3 || parts.some((part) => Number.isNaN(part))) return null;
        return [parts[0], parts[1], parts[2], parts[3] ?? 1];
      };
      const composite = (foreground: Rgba, background: Rgba): Rgba => {
        const alpha = foreground[3] + background[3] * (1 - foreground[3]);
        if (alpha === 0) return [0, 0, 0, 0];
        return [
          (foreground[0] * foreground[3] + background[0] * background[3] * (1 - foreground[3])) /
            alpha,
          (foreground[1] * foreground[3] + background[1] * background[3] * (1 - foreground[3])) /
            alpha,
          (foreground[2] * foreground[3] + background[2] * background[3] * (1 - foreground[3])) /
            alpha,
          alpha,
        ];
      };
      const luminance = (color: Rgba) =>
        color.slice(0, 3).reduce((total, channel, index) => {
          const normalized = channel / 255;
          return (
            total +
            (normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4) *
              [0.2126, 0.7152, 0.0722][index]
          );
        }, 0);
      const contrast = (foreground: Rgba | null, background: Rgba | null) => {
        if (!foreground || !background) return 0;
        const light = luminance(foreground);
        const dark = luminance(background);
        return (Math.max(light, dark) + 0.05) / (Math.min(light, dark) + 0.05);
      };
      const colorOf = (selector: string, property: "color" | "backgroundColor") => {
        const element = document.querySelector(selector);
        return element ? parseColor(getComputedStyle(element)[property]) : null;
      };
      const scheduleBackground = colorOf(".widget-schedule .widget-content", "backgroundColor");
      const tasksBackground = colorOf(".widget-tasks .widget-content", "backgroundColor");
      const taskRow = colorOf(".widget-tasks .cork-task-list button", "backgroundColor");
      const primaryAction = colorOf(".widget-schedule .widget-heading button", "backgroundColor");
      const memberControl = colorOf(".board-people button", "backgroundColor");
      const countdownBackground = colorOf(".widget-countdown .widget-content", "backgroundColor");
      const effectiveTaskRow =
        taskRow && tasksBackground ? composite(taskRow, tasksBackground) : null;
      return {
        scheduleTitle: contrast(
          colorOf(".widget-schedule .mini-timeline strong", "color"),
          scheduleBackground,
        ),
        scheduleTime: contrast(
          colorOf(".widget-schedule .mini-timeline time", "color"),
          scheduleBackground,
        ),
        scheduleKicker: contrast(
          colorOf(".widget-schedule .widget-heading span", "color"),
          scheduleBackground,
        ),
        taskTitle: contrast(
          colorOf(".widget-tasks .cork-task-list button", "color"),
          effectiveTaskRow,
        ),
        taskKicker: contrast(
          colorOf(".widget-tasks .widget-heading span", "color"),
          tasksBackground,
        ),
        primaryAction: contrast(
          colorOf(".widget-schedule .widget-heading button", "color"),
          primaryAction,
        ),
        memberControl: contrast(colorOf(".board-people button", "color"), memberControl),
        countdownMeta: contrast(
          colorOf(".widget-countdown .countdown-target-date", "color"),
          countdownBackground,
        ),
      };
    });

  const assertReadable = async () => {
    const contrast = await readWidgetContrast();
    for (const [label, ratio] of Object.entries(contrast)) {
      expect(ratio, `${label} contrast ratio`).toBeGreaterThanOrEqual(4.5);
    }
  };

  await page.getByRole("button", { name: "Settings" }).click();
  await page.getByRole("radio", { name: /^dark/i }).click();
  await page.getByRole("button", { name: "Today", exact: true }).click();
  await assertReadable();

  await page.getByRole("button", { name: "Settings" }).click();
  await page.getByRole("radio", { name: /^light/i }).click();
  await page.getByRole("button", { name: "Today", exact: true }).click();
  await assertReadable();

  await page.getByRole("button", { name: "Settings" }).click();
  await page.getByRole("radio", { name: /ocean mist/i }).click();
  await page.getByRole("button", { name: "Today", exact: true }).click();
  await assertReadable();

  await page.getByRole("button", { name: "Settings" }).click();
  await page.getByRole("radio", { name: /^dark/i }).click();
  await page.getByRole("button", { name: "Today", exact: true }).click();
  await assertReadable();
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
    await page.getByRole("button", { name: "Today", exact: true }).click();
    await expect(page.getByRole("button", { name: "Settings", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Guide", exact: true })).toBeVisible();
    await expectNoHorizontalOverflow(page);

    await page.getByRole("button", { name: "Guide", exact: true }).click();
    await expectNoHorizontalOverflow(page);

    await page.getByRole("button", { name: "Settings", exact: true }).click();
    await expectNoHorizontalOverflow(page);
  }
});

test("keeps dense dashboard sections separated and unlocks the extra widgets", async ({ page }) => {
  await page.setViewportSize({ width: 990, height: 994 });
  await page.getByRole("button", { name: /explore a sample home/i }).click();

  await page.getByRole("button", { name: "History" }).click();
  const filter = page.locator(".history-card .filter-row");
  const history = page.locator(".history-card .cork-task-list");
  const filterBox = await filter.boundingBox();
  const historyBox = await history.boundingBox();
  expect(filterBox).not.toBeNull();
  expect(historyBox).not.toBeNull();
  expect(historyBox!.y).toBeGreaterThanOrEqual(filterBox!.y + filterBox!.height);
  await expectNoHorizontalOverflow(page);

  await page.getByRole("button", { name: "Rewards" }).click();
  await page.getByRole("button", { name: "View plan" }).first().click();
  await expect(page.getByRole("heading", { name: "Your household, your way." })).toBeVisible();

  await page.getByRole("button", { name: "Add to board" }).click();
  await page.getByRole("button", { name: /clock live time and date/i }).click();
  await expect(page.getByText("Right now")).toBeVisible();
  await page.getByRole("button", { name: "Add to board" }).click();
  await page.getByRole("button", { name: /mini calendar a month on the board/i }).click();
  await expect(page.getByText("This month")).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test("reorders cards by dragging in the responsive board", async ({ page }) => {
  await page.setViewportSize({ width: 834, height: 1194 });
  await page.getByRole("button", { name: /explore a sample home/i }).click();

  const board = page.locator(".open-corkboard");
  const schedule = board.locator('[data-widget-id="schedule"]');
  const tasks = board.locator('[data-widget-id="tasks"]');
  const scheduleGrip = schedule.getByRole("button", {
    name: "Move schedule card",
    exact: true,
  });
  await schedule.hover();
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

test("offers reliable responsive manipulation controls and persists their changes", async ({
  page,
}) => {
  await page.setViewportSize({ width: 834, height: 1194 });
  await page.getByRole("button", { name: /explore a sample home/i }).click();

  const board = page.locator(".open-corkboard");
  const schedule = board.locator('[data-widget-id="schedule"]');
  const initialHeight = await schedule.evaluate((card) => card.getBoundingClientRect().height);
  const grip = schedule.getByRole("button", { name: "Move schedule card", exact: true });

  await page.mouse.move(1, 1);
  await expect(schedule.locator(".widget-controls")).toHaveCSS("opacity", "0");
  await schedule.click({ position: { x: 12, y: 12 } });
  await expect(schedule.locator(".widget-controls")).toHaveCSS("opacity", "1");
  await grip.click();
  await schedule.getByRole("button", { name: "Lock card", exact: true }).click();
  await expect(grip).toBeDisabled();
  expect(await schedule.evaluate((card) => getComputedStyle(card, "::after").content)).not.toBe(
    "none",
  );
  await schedule.getByRole("button", { name: "Unlock card", exact: true }).click();
  await expect(grip).toBeEnabled();

  await schedule.getByRole("button", { name: "Make schedule card smaller", exact: true }).click();

  await expect
    .poll(() => schedule.evaluate((card) => card.getBoundingClientRect().height))
    .toBeLessThan(initialHeight);

  await page.reload();
  const savedSchedule = page.locator('[data-widget-id="schedule"]');
  await expect
    .poll(() => savedSchedule.evaluate((card) => card.getBoundingClientRect().height))
    .toBeLessThan(initialHeight);
  const note = page.locator('[data-widget-id="note"]');
  await note.click();
  const noteEditor = page.getByRole("dialog", { name: /edit sticky note/i });
  if (await noteEditor.isVisible()) {
    await noteEditor.getByRole("button", { name: "Close dialog" }).click();
  }
  await note.getByRole("button", { name: "Remove note card", exact: true }).click();
  await expect(note).toHaveClass(/is-removing/);
  await expect(page.locator('[data-widget-id="note"]')).toHaveCount(0);
  await page.reload();
  await expect(page.locator('[data-widget-id="note"]')).toHaveCount(0);
});

test("can remove a sticky note from its editor", async ({ page }) => {
  await page.getByRole("button", { name: /explore a sample home/i }).click();

  const note = page.locator('[data-widget-id="note"]');
  await note.getByRole("button", { name: "Edit sticky note", exact: true }).click();
  await page.getByRole("button", { name: "Remove note", exact: true }).click();

  await expect(page.getByRole("dialog", { name: /remove sticky note/i })).toBeVisible();
  await page.getByRole("button", { name: "Remove card", exact: true }).click();
  await expect(page.locator('[data-widget-id="note"]')).toHaveCount(0);
});

test("moves and resizes cards on a wall-sized board", async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.getByRole("button", { name: /explore a sample home/i }).click();

  const schedule = page.locator('[data-widget-id="schedule"]');
  const initialBox = await schedule.boundingBox();
  const grip = schedule.getByRole("button", { name: "Move schedule card", exact: true });
  await schedule.hover();
  const gripBox = await grip.boundingBox();
  expect(initialBox).not.toBeNull();
  expect(gripBox).not.toBeNull();

  await page.mouse.move(gripBox!.x + gripBox!.width / 2, gripBox!.y + gripBox!.height / 2);
  await page.mouse.down();
  await page.mouse.move(gripBox!.x + 90, gripBox!.y - 60, { steps: 6 });
  await page.mouse.up();
  await expect
    .poll(() => schedule.boundingBox())
    .toEqual(
      expect.objectContaining({
        x: expect.any(Number),
        y: expect.any(Number),
      }),
    );
  const movedBox = await schedule.boundingBox();
  expect(movedBox!.x).toBeGreaterThan(initialBox!.x + 30);
  expect(movedBox!.y).toBeLessThan(initialBox!.y - 20);

  await schedule.getByRole("button", { name: "Make schedule card larger", exact: true }).click();
  await expect
    .poll(async () => (await schedule.boundingBox())?.width ?? 0)
    .toBeGreaterThan(movedBox!.width + 30);
  await expect
    .poll(async () => (await schedule.boundingBox())?.height ?? 0)
    .toBeGreaterThan(movedBox!.height + 20);
});

test("shows settings and requires confirmation before erase", async ({ page }) => {
  await page.getByRole("button", { name: /explore a sample home/i }).click();
  await page.getByRole("button", { name: "Settings" }).click();
  await page.getByRole("button", { name: /erase household/i }).click();
  await expect(page.getByRole("dialog", { name: /erase this household/i })).toBeVisible();
  await page.getByRole("button", { name: "Cancel" }).click();
  await expect(page.getByText("The River House")).toBeHidden();
});

test("keeps backup, sync, and update actions available in Settings", async ({ page }) => {
  await page.getByRole("button", { name: /explore a sample home/i }).click();
  await page.getByRole("button", { name: "Settings" }).click();

  await expect(page.getByRole("heading", { name: "Back up your household" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Export backup" })).toBeVisible();
  await page.getByRole("button", { name: "Sync local data" }).click();
  await expect(
    page.locator(".notice").filter({ hasText: /local household data is synced/i }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Update app" })).toBeVisible();
  await page.getByRole("button", { name: "Update app" }).click();
  await expect(
    page
      .locator(".notice")
      .filter({ hasText: /up to date|active update service|new version is ready/i }),
  ).toBeVisible();
  await page.context().setOffline(true);
  try {
    await page.waitForFunction(() => !navigator.onLine);
    await page.getByRole("button", { name: "Update app" }).click();
    await expect(
      page.locator(".notice").filter({ hasText: /updates require an internet connection/i }),
    ).toBeVisible();
  } finally {
    await page.context().setOffline(false);
  }
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
  await page.evaluate(async () => {
    if (!("serviceWorker" in navigator)) return;
    await Promise.race([
      navigator.serviceWorker.ready,
      new Promise((resolve) => setTimeout(resolve, 2000)),
    ]);
  });
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
