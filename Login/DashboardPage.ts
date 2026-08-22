import { Page, Locator, expect } from "@playwright/test";

export class DashboardPage {

    page: Page;
    welcomeHeading: Locator;
    homeLink: Locator;

    constructor(page: Page) {

        this.page = page;
        this.welcomeHeading = page.getByRole("heading", { name: /Welcome back/ });
        this.homeLink = page.getByRole("link", { name: "Home", exact: true });

    }

    async verifyLoginSuccessful() {

        await this.page.waitForURL(/\/home/);
        await expect(this.page).toHaveURL(/\/home/);
        await expect(this.welcomeHeading).toBeVisible();
        await expect(this.homeLink).toBeVisible();

    }
}
