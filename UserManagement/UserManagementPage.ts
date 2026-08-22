import { Page, Locator, expect } from "@playwright/test";

export class UserManagementPage {

    page: Page;
    userManagementMenu: Locator;
    usersMenuItem: Locator;
    usersHeading: Locator;
    usersTable: Locator;
    addButton: Locator;
    addUserHeading: Locator;
    firstName: Locator;
    lastName: Locator;
    email: Locator;
    password: Locator;
    confirmPassword: Locator;
    roleDropdown: Locator;
    saveButton: Locator;
    successMessage: Locator;

    constructor(page: Page) {

        this.page = page;

        this.userManagementMenu = page.getByRole("link", { name: "User Management" });
        this.usersMenuItem = page.getByRole("link", { name: "Users", exact: true });

        this.usersHeading = page.getByRole("heading", { name: "Users", exact: true });

        // The users list is a DataTable, which sets role="grid" rather than
        // role="table", so getByRole("table") finds nothing here.
        this.usersTable = page.getByRole("grid");

        // The anchor renders a Font Awesome icon before the word "Add". The icon
        // glyph becomes part of the accessible name, so an exact "Add" match
        // returns zero elements and a regex is required.
        this.addButton = page.getByRole("link", { name: /Add/i });

        this.addUserHeading = page.getByRole("heading", { name: "Add user" });

        this.firstName = page.getByLabel("First Name");
        this.lastName = page.getByLabel("Last Name");
        this.email = page.getByLabel("Email");

        // The labels read "Password:*" and "Confirm Password:*". A plain
        // "Password" match would hit both fields, so the first regex is anchored
        // to the start of the label text to keep them apart.
        this.password = page.getByLabel(/^Password:/);
        this.confirmPassword = page.getByLabel(/Confirm Password/);

        // Role is a select2 widget: the real <select> is hidden from the user and
        // the visible control is a span with role="combobox". Filtering on the
        // widget's own container keeps this separate from the other comboboxes
        // on the form (Gender and Marital Status).
        this.roleDropdown = page
            .getByRole("combobox")
            .filter({ has: page.locator("#select2-role-container") });

        this.saveButton = page.getByRole("button", { name: "Save" });

        this.successMessage = page.getByText("User added successfully");

    }

    async openUserManagementMenu() {

        await this.userManagementMenu.click();

        // The sub-menu items are hidden until the parent group is expanded, so
        // waiting for "Users" to appear proves the menu actually opened.
        await expect(this.usersMenuItem).toBeVisible();

    }

    async openUsersPage() {

        await this.usersMenuItem.click();
        await this.page.waitForURL(/\/users/);

        await expect(this.usersHeading).toBeVisible();
        await expect(this.usersTable).toBeVisible();
        await expect(this.addButton).toBeVisible();

    }

    async clickAdd() {

        await this.addButton.click();
        await this.page.waitForURL(/\/users\/create/);

        await expect(this.addUserHeading).toBeVisible();

    }

    async enterUserDetails(firstName: string, lastName: string, email: string, password: string) {

        await this.firstName.fill(firstName);
        await this.lastName.fill(lastName);

        // Email, Password and Confirm Password are marked required on the form.
        // Without them the browser blocks the submit, so the happy path has to
        // fill them even though the manual test case only lists the names.
        await this.email.fill(email);
        await this.password.fill(password);
        await this.confirmPassword.fill(password);

        await expect(this.firstName).toHaveValue(firstName);
        await expect(this.lastName).toHaveValue(lastName);

    }

    async selectRole(roleName: string) {

        await this.roleDropdown.click();

        // select2 renders its list items with role="treeitem", not role="option",
        // so getByRole("option") would never match here.
        const roleOption = this.page.getByRole("treeitem", { name: roleName, exact: true });

        await expect(roleOption).toBeVisible();
        await roleOption.click();

        await expect(this.roleDropdown).toContainText(roleName);

    }

    async clickSave() {

        await this.saveButton.click();

    }

    async verifyUserCreated(email: string, roleName: string) {

        await this.page.waitForURL(/\/users$/);

        await expect(this.successMessage).toBeVisible();

        const newUserRow = this.page.getByRole("row").filter({ hasText: email });

        await expect(newUserRow).toHaveCount(1);
        await expect(newUserRow).toContainText(roleName);

    }
}
