import { Page, Locator, expect } from "@playwright/test";
import fs from "fs";
import path from "path";

// The created vendor is written back into the same file the inputs are read
// from, so later Vendor Care scenarios can pick up a vendor that really exists.
const VENDOR_DATA_FILE = path.resolve(__dirname, "..", "test-data", "vendorData.json");

export class VendorCarePage {

    page: Page;
    vendorCareMenu: Locator;
    vendorMenuItem: Locator;
    vendorsHeading: Locator;
    vendorsTableHeader: Locator;
    addButton: Locator;
    vendorSearchBox: Locator;
    vendorRows: Locator;

    businessName: Locator;
    businessLocationDropdown: Locator;
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
    createVendorButton: Locator;

    constructor(page: Page) {

        this.page = page;

        this.vendorCareMenu = page.getByRole("link", { name: "Vendor Care" });
        this.vendorMenuItem = page.getByRole("link", { name: "Vendor", exact: true });

        // The heading renders an icon before its text, and that glyph becomes part
        // of the accessible name (" Vendors"), so an exact "Vendors" match finds
        // nothing. The level pins it to the page title rather than the "All your
        // Vendors" heading over the list, which also ends in "Vendors".
        this.vendorsHeading = page.getByRole("heading", { name: /Vendors$/, level: 1 });

        // DataTables rewrites the list's role once its JS runs, so a column header
        // is used instead -- it is there in both states. The name is a regex
        // because DataTables appends "activate to sort column ..." after init.
        this.vendorsTableHeader = page.getByRole("columnheader", { name: /^Supplier ID/ });

        // The anchor renders a Font Awesome plus before the word, and the glyph
        // becomes part of the accessible name (" Add"), so an exact match finds
        // nothing. Anchoring to the end keeps this off the sidebar's "Add Product"
        // and friends.
        this.addButton = page.getByRole("link", { name: /Add$/ });

        // This list uses DataTables' own filter box rather than the bespoke search
        // the other modules have, and that box reacts to fill() on its own.
        this.vendorSearchBox = page.locator("#contact_table_filter input");
        this.vendorRows = page.locator("#contact_table tbody tr");

        this.businessName = page.getByPlaceholder("Business Name");

        // Business Location is a select2 whose generated container id carries a
        // positional suffix (select2-location_id-34-container), so the widget is
        // reached through the stable name of the select it replaces.
        this.businessLocationDropdown = page.locator('select[name="location_id"] + .select2-container');

        this.firstName = page.getByPlaceholder("First Name");
        this.lastName = page.getByPlaceholder("Last Name");
        this.mobile = page.getByPlaceholder("Mobile", { exact: true });
        this.email = page.getByPlaceholder("Email", { exact: true });

        // The shipping block repeats the billing placeholders, so the billing
        // fields are pinned by their field names, which are unique and stable.
        this.addressLine1 = page.locator('input[name="address_line_1"]');
        this.city = page.locator('input[name="city"]');
        this.state = page.locator('input[name="state"]');
        this.country = page.locator('input[name="country"]');
        this.zipCode = page.locator('input[name="zip_code"]');

        // Address suggestions come from Google Places, which renders plain divs
        // with no ARIA roles at all, so getByRole matches nothing here. Two
        // .pac-container nodes exist -- billing and shipping -- but only the
        // active one holds items.
        this.addressSuggestions = page.locator(".pac-container .pac-item");

        // The form is the shared contact form, so its submit reads "Create
        // Contact" rather than "Create Account".
        this.createVendorButton = page.getByRole("button", { name: "Create Contact" });

    }

    async openVendorCareMenu() {

        await this.vendorCareMenu.click();

        // The sub-menu items stay hidden until the group expands.
        await expect(this.vendorMenuItem).toBeVisible();

    }

    async openVendors() {

        await this.vendorMenuItem.click();
        await this.page.waitForURL(/\/contacts\?type=supplier$/);

        await expect(this.vendorsHeading).toBeVisible();
        await expect(this.vendorsTableHeader).toBeVisible();
        await expect(this.addButton).toBeVisible();

    }

    async clickAddVendor() {

        await this.addButton.click();

        // Vendors share the contact form, reached with the supplier type.
        await this.page.waitForURL(/\/contacts\/create\?type=supplier$/);

        await expect(this.businessName).toBeVisible();
        await expect(this.createVendorButton).toBeVisible();

    }

    async enterBusinessName(businessName: string) {

        await this.businessName.fill(businessName);
        await expect(this.businessName).toHaveValue(businessName);

    }

    /**
     * Picks the business location.
     *
     * The option reads "No limit Distro (BL00001)" -- a different spelling and a
     * trailing code -- so the wanted name is matched as a substring rather than
     * exactly, and no option index is assumed.
     */
    async selectBusinessLocation(locationName: string) {

        await this.businessLocationDropdown.click();

        // select2 renders its options with role="treeitem", not role="option".
        const locationOption = this.page
            .locator(".select2-container--open")
            .getByRole("treeitem", { name: locationName });

        await expect(locationOption).toBeVisible();
        await locationOption.click();

        // Matched case-insensitively because the application spells it
        // "No limit Distro" while the test data follows the wording in the manual
        // case; getByRole above already ignores case, but toContainText does not.
        await expect(this.businessLocationDropdown).toContainText(new RegExp(locationName, "i"));

    }

    async enterContactDetails(firstName: string, lastName: string, mobileNumber: string, emailAddress: string) {

        await this.firstName.fill(firstName);
        await this.lastName.fill(lastName);
        await this.mobile.fill(mobileNumber);
        await this.email.fill(emailAddress);

        await expect(this.firstName).toHaveValue(firstName);
        await expect(this.lastName).toHaveValue(lastName);
        await expect(this.mobile).toHaveValue(/^\d{10}$/);
        await expect(this.email).toHaveValue(emailAddress);

    }

    /**
     * Types the billing address and picks a real suggestion.
     *
     * Google Places only offers suggestions in response to actual keystrokes, and
     * the search has to be narrowed to one row before clicking: searching
     * "Dickerman street Rockford" offers both a Street and a Drive, so the wanted
     * one is matched on its own text instead of by position.
     */
    async enterBillingAddress(addressSearch: string, addressMatch: string) {

        await this.addressLine1.pressSequentially(addressSearch);

        const suggestion = this.addressSuggestions.filter({ hasText: addressMatch });

        await expect(suggestion).toHaveCount(1);
        await suggestion.click();

    }

    /**
     * Confirms a suggestion was really taken rather than the text merely typed.
     *
     * Choosing a suggestion rewrites Address line 1 down to the street and fills
     * City, State, Country and Zip -- all of which the form requires. Those four
     * being populated is the evidence, since typing alone leaves them empty.
     */
    async verifyAddressSelected(expectedCity: string) {

        await expect(this.addressLine1).toHaveValue(/\S/);
        await expect(this.city).toHaveValue(expectedCity);
        await expect(this.state).toHaveValue(/\S/);
        await expect(this.country).toHaveValue(/\S/);
        await expect(this.zipCode).toHaveValue(/\S/);

    }

    async createVendor() {

        await this.createVendorButton.click();

        // Saving posts the form and returns to the vendor list.
        await this.page.waitForURL(/\/contacts\?type=supplier$/);

    }

    /**
     * Finds the saved vendor and returns the identifier the application gave it.
     *
     * The list holds 78 records over 25-row pages, so the new vendor is not
     * necessarily on the first page. The search is by mobile rather than business
     * name: the business name comes from fixed test data, so repeated runs produce
     * several vendors sharing it, while the mobile is unique per run and narrows
     * the list to exactly the record just created.
     *
     * No success toast is asserted. One does appear -- "Customer created in both
     * systems ..." -- but it is a toastr that dismisses itself, whereas the
     * redirect above and the row here are durable evidence.
     */
    async verifyVendorCreated(mobileNumber: string, businessName: string): Promise<string> {

        await this.vendorSearchBox.fill(mobileNumber);

        const vendorRow = this.vendorRows.filter({ hasText: mobileNumber });

        await expect(vendorRow).toHaveCount(1);
        await expect(vendorRow).toContainText(businessName);

        // Supplier ID is the second column, after the row's action menu. The cells
        // are gridcells rather than cells because DataTables marks the list as
        // role="grid", and the position is used because the id has no label of its
        // own to match on.
        const supplierId = await vendorRow.getByRole("gridcell").nth(1).textContent();

        return (supplierId ?? "").trim();

    }

    /**
     * Stores the created vendor's details for later Vendor Care scenarios.
     *
     * The application issues no login credentials while a vendor is being created
     * -- the user name and password fields on the form are optional and are left
     * empty -- so there is nothing generated to read back. What is preserved is
     * the vendor's identifying information, including the Supplier ID the
     * application assigned, which is what a later scenario needs to find it.
     *
     * The details are merged into test-data/vendorData.json rather than replacing
     * it, so the inputs at the top of that file survive.
     */
    async captureVendorDetails(supplierId: string, businessName: string, mobileNumber: string, emailAddress: string) {

        const vendorData = JSON.parse(fs.readFileSync(VENDOR_DATA_FILE, "utf-8"));

        vendorData.createdVendor = {
            supplierId,
            businessName,
            mobile: mobileNumber,
            email: emailAddress,
            createdAt: new Date().toISOString()
        };

        fs.writeFileSync(VENDOR_DATA_FILE, `${JSON.stringify(vendorData, null, 4)}\n`, "utf-8");

        const savedData = JSON.parse(fs.readFileSync(VENDOR_DATA_FILE, "utf-8"));

        expect(savedData.createdVendor.supplierId).toBe(supplierId);
        expect(savedData.createdVendor.mobile).toBe(mobileNumber);
        expect(savedData.newVendor.businessName).toBe(businessName);

    }
}
