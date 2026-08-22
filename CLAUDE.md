# NLD ERP — Playwright Test Automation

Playwright + TypeScript Page Object Model suite testing the NLD ERP web app against a shared
environment (`BASE_URL`, currently `https://testnld.phantasm.solutions`). There is no
application source here — this repo is tests only, driving a deployed app.

## Architecture: feature folders

Organised by **feature**, not by layer. Each feature folder owns its page objects *and* its own
Manager. There is deliberately **no global page-object manager**.

```
Login/            LoginPage.ts, DashboardPage.ts, LoginManager.ts
CustomerCare/     CustomerCarePage.ts, CustomerCareManager.ts
UserManagement/   UserManagementPage.ts, UserManagementManager.ts
tests/            <Feature>.spec.ts — one spec per feature
test-data/        <feature>Data.json — static expected values and inputs
utils/            TestUtils.ts — shared helpers
specs/            test plans (Playwright planner agent)
```

A spec imports the Manager(s) for the features it touches. `tsconfig.json` includes `**/*.ts`,
so a new feature folder needs no config change.

Layer rules, strictly:
- **Page objects** own locators *and* assertions. Verification methods (`verifyLoginSuccessful`)
  live here.
- **Specs** only orchestrate — no locators, no `expect` calls.

## Code style — hand-maintained, do not auto-format

Formatting is manual on purpose. **Prettier is disabled** in `.vscode/settings.json` because it
cannot reproduce this style: it strips the blank line after opening braces and adds semicolons
to the Manager getter returns. Do not add a Prettier config or reformat existing files.

- **4-space** indent in feature folders and `utils/`; **2-space** in `tests/`.
- **Double quotes**, except `playwright.config.ts` which uses single.
- A **blank line** after each opening brace (class, constructor, method) and before each
  method's closing brace. The class's own closing brace has no blank line before it.
- Locator fields declared explicitly, then assigned in the constructor.
- Manager fields are PascalCase mirroring the class name; getters omit the trailing semicolon.

## Locators

Semantic only: `getByRole` > `getByLabel` / `getByPlaceholder` > `getByText` (regex for partly
dynamic copy). **No CSS, no XPath, no `nth()` chains.**

Verify against the running app rather than guessing — the `playwright` MCP server in
`.mcp.json` can open a page and read the real accessibility tree. Guessed placeholder text is
the top cause of failures here. If nothing semantic exists, propose a `data-testid` to the app
team instead of a brittle selector.

## Test conventions

- Title: `TC-NLD-<AREA>-<NNN> - Verify <behaviour>` — e.g. `TC-NLD-LOGIN-001`,
  `TC-NLD-CUSTOMER-001`, `TC-NLD-USER-001`. Find the next number:
  `grep -rho "TC-NLD-[A-Z]*-[0-9]*" tests/ | sort -u`
- `//part N - description` comments number the steps; part 1 is Manager initialization.
- Credentials **only** via `requireEnv("NLD_USERNAME")` / `requireEnv("NLD_PASSWORD")`. Never
  hardcode, never print values. New keys go in `.env.example` empty; `.env` is gitignored.
- Static data in `test-data/*.json` (`resolveJsonModule` is on).

## Known app behaviours (see utils/TestUtils.ts)

- **Application Tour** blocks the sidebar on a fresh session. Call `suppressApplicationTour(page)`
  *before the first navigation* — ending the tour via its own button leaves the sidebar dead.
- **Duplicate emails are rejected**, so create-user flows need `uniqueEmail()` or a second run
  fails on a stale record.

## Running

```bash
npx playwright test                              # whole suite
npx playwright test tests/Login.spec.ts          # one file
npx playwright test --grep "TC-NLD-LOGIN-001"    # one case
npx playwright test --ui
npm run report                                   # HTML report
npx playwright show-trace test-results/<dir>/trace.zip
```

Runs are **headed and serial by design** (`headless: false`, `fullyParallel: false`), in a
maximized window. One worker means specs share browser state — don't assume isolation. On CI
this needs a headless override or a virtual display.

`playwright.config.ts` sets `viewport: null` with `--start-maximized` and deliberately does
**not** spread `devices['Desktop Chrome']`, which hard-sets `viewport: 1280x720` and silently
shrinks the window. Do not add it back.

Timeouts: test 120s, navigation 30s, action 15s, expect 10s. Artifacts (screenshot, video,
trace) are captured **on failure only**. Fix the wait, never raise a timeout to make a test
pass, and never add `waitForTimeout`.

## Tooling

- `.claude/skills/` — `new-page-object`, `new-test`, `debug-test-failure` (this repo's conventions).
- `.claude/agents/` — Playwright `planner`, `generator`, `healer`.
- `tests/seed.spec.ts` is an empty scaffold the generator agent uses. It appears as a passing
  test in every run; leave it unless the agent workflow is dropped.
