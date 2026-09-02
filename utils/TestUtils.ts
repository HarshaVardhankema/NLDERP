import { Page } from "@playwright/test";

export function requireEnv(name: string): string {

    const value = process.env[name];

    if (!value) {
        throw new Error(
            `Missing environment variable "${name}". Add it to your .env file.`
        );
    }

    return value;
}

/**
 * Stops the "Application Tour" from starting.
 *
 * On a fresh browser session the ERP opens a guided tour whose backdrop covers
 * the sidebar, so every navigation click is blocked. Ending the tour through its
 * own "End tour" button is not enough: the tour library detaches the sidebar
 * click handlers, leaving the menus dead for the rest of the session. Setting the
 * app's own "already shown" flag before any page script runs stops the tour from
 * ever starting, which keeps the sidebar fully working.
 */
export async function suppressApplicationTour(page: Page) {

    await page.addInitScript(() => {
        try {
            window.localStorage.setItem("upos_app_tour_shown", "true");
            window.localStorage.setItem("tour_end", "yes");
        } catch (error) {
            // localStorage is unavailable on about:blank before the first real
            // navigation; the script runs again on the real page, so skip it.
        }
    });
}

/**
 * Builds a unique email address.
 *
 * The ERP rejects a duplicate email, so a create-user test needs a fresh address
 * on every run or the second run would fail on a stale record.
 */
export function uniqueEmail(prefix: string, domain: string): string {

    return `${prefix}.${Date.now()}@${domain}`;
}

/**
 * Builds a unique name.
 *
 * The product list runs to 400+ records over 25-row pages, so a create test has
 * to search for the record it just made. That search only narrows to a single
 * row if the name is unique, which a fixed name stops being on the second run.
 */
export function uniqueName(prefix: string): string {

    return `${prefix} ${Date.now()}`;
}
