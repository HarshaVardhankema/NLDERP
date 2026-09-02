import { Page, Locator, expect } from "@playwright/test";

export class UserManagementPage {

    page: Page;
    userManagementMenu: Locator;
    usersMenuItem: Locator;
    usersHeading: Locator;
    usersTableHeader: Locator;
    addButton: Locator;
    searchBox: Locator;
    addUserHeading: Locator;
    firstName: Locator;
    lastName: Locator;
    email: Locator;
    password: Locator;
    confirmPassword: Locator;
    roleDropdown: Locator;
    saveButton: Locator;

    constructor(page: Page) {

        this.page = page;

        this.userManagementMenu = page.getByRole("link", { name: "User Management" });
        this.usersMenuItem = page.getByRole("link", { name: "Users", exact: true });

        this.usersHeading = page.getByRole("heading", { name: "Users", exact: true });

        // The users list is a DataTable, which swaps the table's role for "grid"
        // when its JS initialises. Asserting on role="grid" races that init and
        // breaks on a slow load, so this anchors on a column header instead --
        // present both before and after DataTables takes over. The name is a
        // regex because DataTables appends "activate to sort column ..." to each
        // sortable header once initialised.
        this.usersTableHeader = page.getByRole("columnheader", { name: /^Username/ });

        // The anchor renders a Font Awesome icon before the word "Add". The icon
        // glyph becomes part of the accessible name, so an exact "Add" match
        // returns zero elements and a regex is required.
        this.addButton = page.getByRole("link", { name: /Add/i });

        this.searchBox = page.getByPlaceholder("Search users...");

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
        await expect(this.usersTableHeader).toBeVisible();
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

        // Deliberately no success-toast assertion. Saving POSTs to /users and
        // returns a 302 back to the list, and that redirected page carries no
        // flash message at all -- the list HTML before and after a create differs
        // only in a cache-busting timestamp on app.js. Every toastr call on this
        // page is AJAX-driven (delete, location switch), so a "User added
        // successfully" toast is never rendered. The new grid row below is the
        // durable evidence that the user was created.

        // The list pages at 25 rows and every run adds a user, so the newest
        // record sorts onto the last page and is not in the DOM at all. Searching
        // by the unique email narrows the grid to just the new user, which also
        // keeps the count assertion clear of leftovers from earlier runs.
        // The page wires the box up as $('#users_search').on('keyup', ...), and
        // fill() only dispatches "input", so filling alone leaves the grid
        // unfiltered. Pressing a key afterwards raises the keyup the handler
        // needs; End is used because it moves the caret without editing the value.
        await this.searchBox.fill(email);
        await this.searchBox.press("End");

        const newUserRow = this.page.getByRole("row").filter({ hasText: email });

        await expect(newUserRow).toHaveCount(1);
        await expect(newUserRow).toContainText(roleName);

    }
}
