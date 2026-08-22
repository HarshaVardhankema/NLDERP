import { Page } from "@playwright/test";
import { LoginPage } from "./LoginPage";
import { DashboardPage } from "./DashboardPage";

export class LoginManager {

    page: Page;
    LoginPage: LoginPage;
    DashboardPage: DashboardPage;

    constructor(page: Page) {

        this.page = page;
        this.LoginPage = new LoginPage(this.page);
        this.DashboardPage = new DashboardPage(this.page);

    }

    getLoginPage() {
        return this.LoginPage
    }

    getDashboardPage() {
        return this.DashboardPage
    }
}
