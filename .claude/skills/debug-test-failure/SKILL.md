---
name: debug-test-failure
description: Triage a failing, hanging, or flaky Playwright test in the NLD ERP suite using the HTML report, trace, video and screenshot artifacts. Use when a spec fails, times out, passes locally but not in CI, or behaves differently headed vs headless.
---

# Debug a Test Failure

Work from artifacts before changing code. This suite captures screenshot, video and trace
**on failure only**, so a failed run already has everything needed.

## 1. Read the artifacts

```bash
npm run report                                        # open the HTML report
npx playwright show-trace test-results/<dir>/trace.zip # step-by-step trace viewer
ls test-results/                                      # screenshots + video per failed test
```

The trace viewer is the fastest path: it shows the DOM snapshot at the moment of failure, so
you can see whether the locator was absent, hidden, or matched multiple elements.

Both `test-results/` and `playwright-report/` are gitignored — never commit them.

## 2. Rule out environment first

- **Missing env var** — `requireEnv` throws `Missing environment variable "X"`. Check `.env`
  exists and has `BASE_URL`, `NLD_USERNAME`, `NLD_PASSWORD`. Compare against `.env.example`.
- **Never print or echo the credential values** when debugging; confirm presence only, e.g.
  `grep -c '^NLD_PASSWORD=.\+' .env`
- **App reachable?** `baseURL` points at the shared test environment
  (`https://testnld.phantasm.solutions`). If login fails for every test, verify the environment
  is up and the account is not locked before touching the suite.

## 3. Match the symptom

| Symptom | Likely cause |
|---|---|
| `locator resolved to N elements` | Locator too loose — narrow with `exact: true` or a scoped role, as `DashboardPage.homeLink` does |
| `waiting for locator ... to be visible`, 15s | `actionTimeout` hit. Element renders late or behind a spinner — assert on a preceding state, don't raise the timeout |
| `Timeout 30000ms exceeded` on navigation | `navigationTimeout`. Slow environment or a redirect that never settles |
| `expect(...).toBeVisible()` fails at 10s | `expect.timeout`. Check the trace snapshot — often the app rendered different copy, not a timing issue |
| Whole test dies at 120s | Test-level `timeout`; usually a wait on something that never happens |
| Window is small / layout-dependent failures | See the viewport note below |
| Passes alone, fails in a full run | Shared state between specs. `fullyParallel: false` means one worker and a shared session — check leftover login state |

## 4. Known config gotchas

- **Viewport:** `playwright.config.ts` deliberately sets `viewport: null` with
  `--start-maximized` and deliberately does **not** spread `devices['Desktop Chrome']`. That
  device preset hard-sets `viewport: 1280x720`, `deviceScaleFactor` and `screen`, which
  silently overrides `viewport: null` and shrinks the window. Do not add it back — the comment
  in the config records this exact regression.
- **Headed by default:** `headless: false` is set for all runs, so `npm run test:headed` is
  redundant. On CI this needs a headless override or a virtual display; a hang with no output
  in CI usually means no display is available.
- **Retries:** 0 locally, 2 on CI. A test that only passes on retry is flaky — fix the wait,
  don't rely on the retry.

## 5. Fix at the right layer

- Locator and assertion problems are fixed in the feature folder (`Login/`, etc.), never
  patched in a spec.
- Replace timing fixes with web-first assertions (`toBeVisible`, `toHaveURL`, `waitForURL`).
  Do not add `waitForTimeout` and do not raise timeouts in `playwright.config.ts` to make a
  test pass — that hides the defect for every other spec.
- Re-run the single case to confirm, then the full file:

```bash
npx playwright test --grep "TC-NLD-LOGIN-001"
npx playwright test tests/Login.spec.ts
```

Report honestly whether the fix addressed the cause or just the symptom.
