import { Page } from "@playwright/test";
import { UserManagementPage } from "./UserManagementPage";

export class UserManagementManager {

    page: Page;
    UserManagementPage: UserManagementPage;

    constructor(page: Page) {

        this.page = page;
        this.UserManagementPage = new UserManagementPage(this.page);

    }

    getUserManagementPage() {
        return this.UserManagementPage
    }
}
