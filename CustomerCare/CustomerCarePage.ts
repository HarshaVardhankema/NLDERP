import { Page, Locator, expect } from "@playwright/test";

export class CustomerCarePage {

    page: Page;

    customerCareMenu: Locator;
    customersMenuItem: Locator;
    customerManagementHeading: Locator;
    customersTable: Locator;
    addButton: Locator;
    searchBox: Locator;
    customerRows: Locator;

    businessName: Locator;
    businessLocationDropdown: Locator;
    businessLocationSelect: Locator;
    dropdownOptions: Locator;
    firstName: Locator;
    lastName: Locator;
    mobile: Locator;
    email: Locator;
    addressLine1: Locator;
    city: Locator;
    state: Locator;
    country: Locator;
    zipCode: Locator;
    addressSuggestions: Locator;
    paymentTerm: Locator;
    createContactButton: Locator;
    successMessage: Locator;

    constructor(page: Page) {

        this.page = page;

        this.customerCareMenu = page.getByRole("link", { name: "Customer Care" });
        this.customersMenuItem = page.getByRole("link", { name: "Customers", exact: true });

        // The visible "Customers" title is a second <h1> that is kept out of the
        // accessibility tree, so getByRole cannot see it. "Customer Management"
        // is the heading that is actually exposed.
        this.customerManagementHeading = page.getByRole("heading", { name: "Customer Management" });

        // DataTables marks the list as role="grid", not role="table".
        this.customersTable = page.getByRole("grid");

        // The icon inside the anchor contributes a glyph to the accessible name,
        // so an exact "Add" match returns nothing.
        this.addButton = page.getByRole("link", { name: /Add/i });

        this.searchBox = page.getByPlaceholder("Search customers...");

        // There are hundreds of customers spread over 25-row pages, so the only
        // reliable way to count a search result is the table body itself.
        this.customerRows = page.locator("#contact_table tbody tr");

        this.businessName = page.getByPlaceholder("Business Name");

        // Business Location is a select2 widget. Its generated container id
        // carries a positional suffix (select2-location_id-x0-container), so the
        // widget is reached through the stable name of the select it replaces.
        this.businessLocationDropdown = page.locator('select[name="location_id"] + .select2-container');
        this.businessLocationSelect = page.locator('select[name="location_id"]');
        this.dropdownOptions = page.locator(".select2-results__option");

        this.firstName = page.getByPlaceholder("First Name");
        this.lastName = page.getByPlaceholder("Last Name");
        this.mobile = page.getByPlaceholder("Mobile", { exact: true });
        this.email = page.getByPlaceholder("Email", { exact: true });

        // The shipping address block reuses every billing placeholder
        // ("Address line 1", "City", "State" ...), so each of those placeholders
        // matches two elements. The field names are unique and stable.
        this.addressLine1 = page.locator('input[name="address_line_1"]');
        this.city = page.locator('input[name="city"]');
        this.state = page.locator('input[name="state"]');
        this.country = page.locator('input[name="country"]');
        this.zipCode = page.locator('input[name="zip_code"]');

        // Address suggestions come from Google Places, which renders plain divs
        // with no ARIA roles at all, so getByRole("option") matches nothing.
        this.addressSuggestions = page.locator(".pac-container .pac-item");

        this.paymentTerm = page.locator('select[name="pay_term_label"]');

        this.createContactButton = page.getByRole("button", { name: "Create Contact" });

        this.successMessage = page.getByText(/Customer created/i);

    }

    async clickCustomerCare() {

        await this.customerCareMenu.click();
        await expect(this.customersMenuItem).toBeVisible();

    }

    async clickCustomers() {

        await this.customersMenuItem.click();
        await this.page.waitForURL(/\/contacts\?type=customer/);

        await expect(this.customerManagementHeading).toBeVisible();
        await expect(this.customersTable).toBeVisible();
        await expect(this.addButton).toBeVisible();

    }

    async clickAdd() {

        await this.addButton.click();
        await this.page.waitForURL(/\/contacts\/create/);

        await expect(this.businessName).toBeVisible();

    }

    async enterBusinessName(businessName: string) {

        await this.businessName.fill(businessName);
        await expect(this.businessName).toHaveValue(businessName);

    }

    /**
     * Opens the Business Location dropdown and picks the first real option.
     *
     * The option list is application data, so nothing is hardcoded here: the
     * placeholder entry is filtered out and whatever the app offers is used.
     */
    async selectBusinessLocation(): Promise<string> {

        await this.businessLocationDropdown.click();

        const location = this.dropdownOptions.filter({ hasNotText: "Please Select" }).first();

        await expect(location).toBeVisible();

        const selectedLocation = ((await location.textContent()) || "").trim();

        await location.click();

        // select2 writes the chosen option back to the real select, so a
        // non-empty value proves the selection was committed.
        await expect(this.businessLocationSelect).not.toHaveValue("");
        await expect(this.businessLocationDropdown).toContainText(selectedLocation);

        return selectedLocation;

    }

    async enterCustomerName(firstName: string, lastName: string) {

        await this.firstName.fill(firstName);
        await this.lastName.fill(lastName);

        await expect(this.firstName).toHaveValue(firstName);
        await expect(this.lastName).toHaveValue(lastName);

    }

    async enterMobileNumber(mobile: string) {

        await this.mobile.fill(mobile);
        await expect(this.mobile).toHaveValue(mobile);

    }

    async enterEmail(email: string) {

        await this.email.fill(email);
        await expect(this.email).toHaveValue(email);

    }

    /**
     * Types the address one key at a time.
     *
     * Google Places listens for real keystrokes. A plain fill() sets the value
     * without firing them, so the suggestion list would never appear.
     */
    async enterAddress(address: string) {

        await this.addressLine1.click();
        await this.addressLine1.pressSequentially(address, { delay: 100 });

    }

    async selectAddressSuggestion(expectedSuggestion: string) {

        const suggestion = this.addressSuggestions.filter({ hasText: expectedSuggestion }).first();

        await expect(suggestion).toBeVisible();
        await suggestion.click();

        // Google resolves the place asynchronously and only then fills city,
        // state, country and zip. Waiting on those values is what makes this
        // step deterministic - reading them straight after the click finds them
        // still empty, and the form then fails its required-field check on save.
        await expect(this.city).not.toHaveValue("");
        await expect(this.state).not.toHaveValue("");
        await expect(this.country).not.toHaveValue("");
        await expect(this.zipCode).not.toHaveValue("");

    }

    async verifyAddressSelected(expectedSuggestion: string) {

        await expect(this.addressLine1).toHaveValue(new RegExp(expectedSuggestion, "i"));

    }

    async selectPaymentTerm(paymentTerm: string) {

        await this.paymentTerm.selectOption({ label: paymentTerm });

    }

    async saveCustomer() {

        await this.createContactButton.click();

    }

    async verifyCustomerCreated(email: string, businessName: string) {

        await this.page.waitForURL(/\/contacts\?type=customer/);

        await expect(this.successMessage).toBeVisible();

        // Searching by the unique email narrows the 700+ customer list down to
        // the record just created, so the assertion cannot accidentally match a
        // leftover customer from an earlier run.
        await this.searchBox.fill(email);

        await expect(this.customerRows).toHaveCount(1);
        await expect(this.customerRows.first()).toContainText(businessName);

    }
}
