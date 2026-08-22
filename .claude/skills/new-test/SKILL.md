---
name: new-test
description: Write a new Playwright spec in tests/ for the NLD ERP suite following the TC-NLD-* case naming, feature Manager wiring, //part comment structure, and .env credential handling. Use when adding a test case, automating a new scenario, or extending an existing spec.
---

# Write a Test

Specs live in `tests/*.spec.ts` and are thin orchestrators: they build the feature Manager(s) it needs, call
page-object methods in order, and let the page objects assert. A spec should read like the
manual test case it automates.

## Steps

1. Read `tests/Login.spec.ts` — it is the reference spec.
2. Confirm the page objects and methods you need already exist in the relevant feature folder
   (`Login/`, etc.). If not, add them first (see the `new-page-object` skill) — do not put locators or `expect` calls in a spec.
3. Create or extend `tests/<Area>.spec.ts` from the template below.
4. Type-check with `npx tsc --noEmit`, then run just that spec.

## Template

```ts
import { test, expect } from "@playwright/test";
import { LoginManager } from "../Login/LoginManager";
import { requireEnv } from "../utils/TestUtils";

test("TC-NLD-<AREA>-<NNN> - Verify <expected behaviour>", async ({ page }) => {

  //part 1 - Initialize the <Feature> flow Page Object Manager

  const loginManager = new LoginManager(page);

  const LoginPage = loginManager.getLoginPage();
  const DashboardPage = loginManager.getDashboardPage();

  // --------------------------
  // <Flow Name>
  // --------------------------

  //part 2 - <what this step does>

  await LoginPage.loginToNldErp(
    requireEnv("NLD_USERNAME"),
    requireEnv("NLD_PASSWORD")
  );

  //part 3 - <what this step verifies>

  await DashboardPage.verifyLoginSuccessful();

})
```

## Conventions

- **Title format:** `TC-NLD-<AREA>-<NNN> - Verify <behaviour>`. `<AREA>` is the module in caps
  (`LOGIN`, `ORDERS`, `INVENTORY`); `<NNN>` is zero-padded and unique. Grep existing titles
  before picking a number: `grep -rho "TC-NLD-[A-Z]*-[0-9]*" tests/ | sort -u`
- **`//part N - description`** comments number the steps in order, with a blank line after each.
  Part 1 is always Manager initialization.
- **`// ----` banner comments** separate major flows in longer specs.
- **2-space indent** in `tests/` (page objects use 4). Double quotes. No trailing semicolon
  after the closing `})`.
- Local consts for page objects are named after the class (`const LoginPage = ...`); the manager
  instance is camelCase (`const loginManager = ...`). Matches the existing spec.
- Import the Manager for each feature the test touches, from that feature's folder — there is no
  single global manager.

## Credentials and test data

- **Never hardcode credentials.** Always `requireEnv("NLD_USERNAME")` / `requireEnv("NLD_PASSWORD")`
  from `utils/TestUtils.ts`. It throws a clear error if `.env` is missing the value.
- New secrets: add the key to `.env.example` with an empty value, and to `.env` locally.
  `.env` is gitignored — never commit it or paste real credentials into a spec, a comment, or
  a commit message.
- **Static expected values** go in `test-data/*.json` (`resolveJsonModule` is enabled), e.g.
  `import loginData from "../test-data/loginData.json";`

## Running it

```bash
npx playwright test tests/<Area>.spec.ts          # one file
npx playwright test --grep "TC-NLD-LOGIN-001"     # one case
npx playwright test --ui                          # interactive
```

The suite runs **headed and serial** by design (`headless: false`, `fullyParallel: false`), so
a full run opens a real maximized browser window. Expect it to be slow and don't assume
parallel isolation — tests currently share one worker.
