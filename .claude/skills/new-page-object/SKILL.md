---
name: new-page-object
description: Create or extend a Page Object class inside a feature folder for this Playwright POM suite and register it in that feature's Manager. Use when adding a new screen to the automation framework, adding locators for a new UI area, or wiring a new page object into a feature Manager.
---

# Add a Page Object

This repo is a Playwright + TypeScript Page Object Model suite for the NLD ERP app. It is
organised by **feature folder**, not by layer — each feature owns its page objects *and* its
own Manager:

```
Login/
  LoginPage.ts        # one class per screen
  DashboardPage.ts
  LoginManager.ts     # aggregates only this feature's pages
tests/
  Login.spec.ts
```

Page objects are the **only** place locators and assertions belong. Specs orchestrate; page
objects know the UI. `tsconfig.json` includes `**/*.ts`, so a new folder needs no config change.

## Steps

1. Read `Login/LoginPage.ts` and `Login/DashboardPage.ts` first — they are the reference
   implementations. Match their formatting exactly.
2. Decide the feature folder. Add to the existing one if the screen belongs to that flow;
   otherwise create a new PascalCase folder (`Orders/`, `Inventory/`).
3. Create `<Feature>/<Name>Page.ts` from the template below.
4. Register it in `<Feature>/<Feature>Manager.ts` — creating that Manager if the folder is new.
5. Type-check: `npx tsc --noEmit`.

## Template

```ts
import { Page, Locator, expect } from "@playwright/test";

export class ExamplePage {

    page: Page;
    someField: Locator;
    submitButton: Locator;

    constructor(page: Page) {

        this.page = page;
        this.someField = page.getByPlaceholder("Enter something");
        this.submitButton = page.getByRole("button", { name: "Submit" });

    }

    async doSomething(value: string) {

        await expect(this.someField).toBeVisible();
        await this.someField.fill(value);
        await this.submitButton.click();

    }

    async verifySomethingHappened() {

        await expect(this.page).toHaveURL(/\/expected-path/);

    }
}
```

## Manager registration

One Manager per feature, named `<Feature>Manager`, living in the feature folder and importing
its pages with `./` relative paths. Fields are PascalCase mirroring the class name, and getters
have **no semicolon** on the return statement — keep both quirks, consistency beats preference:

```ts
import { Page } from "@playwright/test";
import { ExamplePage } from "./ExamplePage";

export class OrdersManager {

    page: Page;
    ExamplePage: ExamplePage;

    constructor(page: Page) {

        this.page = page;
        this.ExamplePage = new ExamplePage(this.page);

    }

    getExamplePage() {
        return this.ExamplePage
    }
}
```

Do **not** create a single global manager across features — `LoginManager` deliberately
aggregates only the Login flow. A spec builds the manager(s) for the features it touches.

## House style — match it exactly

- **4-space indent** in feature folders (specs in `tests/` use 2).
- **Double quotes** for strings.
- A **blank line** after the class's opening brace, after each `constructor(...) {` and
  method opening brace, and before each method's closing brace. The class's own closing
  brace gets no blank line before it.
- Locator fields are **declared explicitly** (`someField: Locator;`) then assigned in the
  constructor. No inline initializers, no `readonly`, no constructor-parameter properties.

## Locator rules

Semantic, user-facing locators only, in this order:

1. `page.getByRole("button", { name: "Login" })`
2. `page.getByLabel(...)` / `page.getByPlaceholder("Enter your password")`
3. `page.getByText(...)` — use a regex when copy is partly dynamic, as `DashboardPage` does:
   `page.getByRole("heading", { name: /Welcome back/ })`

Do **not** use CSS selectors, XPath, or `nth()` index chains.

**Verify locators against the running app — do not guess.** The `playwright` MCP server is
configured in `.mcp.json`; use it to open the page and read the real accessibility tree before
writing a locator. Guessed placeholder text and role names are the top cause of failures in
this suite. If nothing semantic exists, say so and propose a `data-testid` for the app team
rather than committing a brittle selector.

## Method rules

- **Action methods** (`loginToNldErp`) perform interactions. Await every Playwright call.
- **Verification methods** (`verifyLoginSuccessful`) hold the `expect` assertions — assertions
  live here, not in the spec.
- Guard a flow's entry point with a visibility check before typing:
  `await expect(this.username).toBeVisible();`
- Navigate with a **path, not a full URL** — `baseURL` comes from `.env`:
  `await this.page.goto("/login", { waitUntil: "domcontentloaded" });`
- Prefer web-first assertions and `waitForURL` over sleeps. Never add `waitForTimeout`.
