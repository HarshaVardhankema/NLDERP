import { Page, Locator, expect } from "@playwright/test";
import { suppressApplicationTour } from "../utils/TestUtils";

export class LoginPage {

    page: Page;
    username: Locator;
    password: Locator;
    loginButton: Locator;

    constructor(page: Page) {

        this.page = page;
        this.username = page.getByPlaceholder("Admin username or partner email");
        this.password = page.getByPlaceholder("Enter your password");
        this.loginButton = page.getByRole("button", { name: "Login" });

    }

    async loginToNldErp(username: string, password: string) {

        // Must run before the first navigation so the guided tour never starts
        // and its backdrop cannot block the sidebar later in the flow.
        await suppressApplicationTour(this.page);

        await this.page.goto("/login", { waitUntil: "domcontentloaded" });
        await expect(this.username).toBeVisible();
        await this.username.fill(username);
        await this.password.fill(password);
        await this.loginButton.click();

    }
}
