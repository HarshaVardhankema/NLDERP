import { Page, Locator, expect } from "@playwright/test";
import fs from "fs";
import path from "path";

// The vendor these scenarios order from is the one TC-NLD-VENDOR-001 created, so
// it is read back out of the file that test writes rather than restated here.
const VENDOR_DATA_FILE = path.resolve(__dirname, "..", "test-data", "vendorData.json");

export class PurchaseOrderPage {

    page: Page;
    vendorCareMenu: Locator;
    purchaseOrderMenuItem: Locator;
    purchaseOrderHeading: Locator;
    addButton: Locator;
    purchaseOrderSearch: Locator;
    purchaseOrderRows: Locator;

    addPurchaseOrderHeading: Locator;
    referenceNo: Locator;
    vendorDropdown: Locator;
    openDropdownSearch: Locator;
    vendorOptions: Locator;
    productSearch: Locator;
    productSuggestions: Locator;
    productRows: Locator;
    orderQuantity: Locator;
    totalQuantity: Locator;
    saveButton: Locator;
    saveAsDraftButton: Locator;

    orderedQuantityCell: Locator;
    purchaseQuantity: Locator;
    purchaseSearch: Locator;
    purchaseRows: Locator;

    constructor(page: Page) {

        this.page = page;

        this.vendorCareMenu = page.getByRole("link", { name: "Vendor Care" });
        this.purchaseOrderMenuItem = page.getByRole("link", { name: "Purchase Order (PO)" });

        this.purchaseOrderHeading = page.getByRole("heading", { name: "Purchase Order (PO)" });

        // The toolbar anchor renders an icon before its text, and that glyph joins
        // the accessible name (" Add"), so an exact match finds nothing.
        this.addButton = page.getByRole("link", { name: /Add$/ });

        this.purchaseOrderSearch = page.getByPlaceholder("Search purchase orders...");
        this.purchaseOrderRows = page.locator("#purchase_order_table tbody tr");

        this.addPurchaseOrderHeading = page.getByRole("heading", { name: "Add Purchase Order" });

        // Reference No is optional and generated when left blank. These tests fill
        // it so the saved record can be found again by something they own.
        this.referenceNo = page.locator("#ref_no");

        // The vendor picker is an AJAX select2: it holds no options until a search
        // runs. Its container id is stable, unlike the location pickers elsewhere.
        this.vendorDropdown = page
            .getByRole("combobox")
            .filter({ has: page.locator("#select2-supplier_id-container") });

        this.openDropdownSearch = page.locator(".select2-container--open input.select2-search__field");

        // select2 renders results with role="treeitem" rather than role="option".
        this.vendorOptions = page.locator(".select2-container--open").getByRole("treeitem");

        this.productSearch = page.getByPlaceholder("Enter Product name / SKU / Scan bar code");

        // Product results come from a jQuery UI autocomplete, whose items carry no
        // ARIA roles at all, so they are matched on their text.
        this.productSuggestions = page.locator("ul.ui-autocomplete li.ui-menu-item");

        this.productRows = page.locator("#purchase_entry_table tbody tr");
        this.orderQuantity = page.locator("#purchase_entry_table input.purchase_quantity");
        this.totalQuantity = page.locator("#total_quantity");

        this.saveButton = page.locator("#submit_purchase_form");
        this.saveAsDraftButton = page.locator("#submit_purchase_draft");

        // On the purchase receipt screen the same row also reports what the order
        // asked for, as "<ordered> /<remaining>".
        this.orderedQuantityCell = page.locator("#purchase_entry_table tbody tr").getByRole("cell").nth(3);
        this.purchaseQuantity = page.locator("#purchase_entry_table input.purchase_quantity");

        this.purchaseSearch = page.locator("#purchase_table_filter input");
        this.purchaseRows = page.locator("#purchase_table tbody tr");

    }

    /**
     * Returns the business name of the vendor TC-NLD-VENDOR-001 created.
     *
     * The file is read at call time rather than imported, so a vendor created
     * earlier in the same run is picked up instead of a copy cached when the
     * process started.
     *
     * Only the business name is used to find the vendor. The Supplier ID recorded
     * alongside it is deliberately not used: the id belongs to one particular
     * record, and re-running the vendor test replaces that record with a new one,
     * so the stored id goes stale while the business name stays true.
     */
    readStoredVendorName(): string {

        const vendorData = JSON.parse(fs.readFileSync(VENDOR_DATA_FILE, "utf-8"));

        const vendorName = vendorData.createdVendor?.businessName ?? vendorData.newVendor?.businessName;

        if (!vendorName) {
            throw new Error(
                `No vendor found in ${VENDOR_DATA_FILE}. Run TC-NLD-VENDOR-001 first so a vendor exists to order from.`
            );
        }

        return vendorName;

    }

    async openVendorCareMenu() {

        await this.vendorCareMenu.click();

        await expect(this.purchaseOrderMenuItem).toBeVisible();

    }

    async openPurchaseOrders() {

        await this.purchaseOrderMenuItem.click();
        await this.page.waitForURL(/\/purchase-order$/);

        await expect(this.purchaseOrderHeading).toBeVisible();
        await expect(this.addButton).toBeVisible();

    }

    async clickAddPurchaseOrder() {

        await this.addButton.click();
        await this.page.waitForURL(/\/purchase-order\/create$/);

        await expect(this.addPurchaseOrderHeading).toBeVisible();
        await expect(this.vendorDropdown).toBeVisible();

    }

    async enterReference(reference: string) {

        await this.referenceNo.fill(reference);
        await expect(this.referenceNo).toHaveValue(reference);

    }

    /**
     * Picks the stored vendor out of the AJAX vendor picker.
     *
     * When a search finds no vendor the widget offers "Add "<text>" as new
     * supplier" as its first and only row, so taking whatever comes back first
     * would quietly create another vendor instead of reusing the existing one.
     * That row is excluded, and the remaining match is required to be the only
     * one before it is clicked.
     */
    async selectVendor(vendorName: string) {

        await this.vendorDropdown.click();

        await this.openDropdownSearch.fill(vendorName);

        const vendorOption = this.vendorOptions
            .filter({ hasText: vendorName })
            .filter({ hasNotText: "as new supplier" });

        await expect(vendorOption).toHaveCount(1);
        await vendorOption.click();

        await expect(this.vendorDropdown).toContainText(vendorName);

    }

    /**
     * Searches for a product and adds the wanted one from the suggestions.
     *
     * The product name is what gets typed, not the SKU. This box doubles as a
     * barcode scanner field: entering a SKU that matches a product exactly makes
     * the application add that product immediately and clear the box, so no
     * suggestion list ever appears and there is nothing to choose from. Searching
     * by name is what brings the list up.
     *
     * The box also strips spaces as it is typed, so "APEX MUHA" arrives as
     * "APEXMUHA"; the search still matches, and the value is deliberately not
     * asserted for that reason.
     *
     * Suggestions read "<SKU> - <Product Name>" and can be near-identical --
     * "CARAPEXMUHA5CT - APEX MUHA" sits next to
     * "CARAPEXMUHA5CT-FREE - APEX MUHA - FREE" -- so the full label is matched
     * exactly rather than taking whichever row comes first.
     */
    async searchAndSelectProduct(sku: string, productName: string) {

        await this.productSearch.pressSequentially(productName);

        const productOption = this.productSuggestions.getByText(`${sku} - ${productName}`, { exact: true });

        await expect(productOption).toBeVisible();
        await productOption.click();

        // The chosen product becomes a line on the order.
        await expect(this.productRows.filter({ hasText: sku })).toHaveCount(1);

    }

    async enterOrderQuantity(quantity: string) {

        await this.orderQuantity.fill(quantity);

        await expect(this.orderQuantity).toHaveValue(quantity);

        // The order's own running total confirms the figure was taken, not just
        // typed into the box.
        await expect(this.totalQuantity).toHaveText(new RegExp(`^${quantity}(\\.\\d+)?$`));

    }

    async savePurchaseOrder() {

        await this.saveButton.click();

        await this.page.waitForURL(/\/purchase-order$/);

    }

    async savePurchaseOrderAsDraft() {

        await this.saveAsDraftButton.click();

        await this.page.waitForURL(/\/purchase-order$/);

    }

    /**
     * Confirms the order reached the list with the expected status and quantity.
     *
     * The list pages at 25 rows, so the order is searched for by the reference the
     * test supplied. That box is wired as $('#po_search').on('keyup', ...) and
     * fill() raises only "input", so a key has to follow it; End moves the caret
     * without changing the value.
     */
    async verifyPurchaseOrderSaved(reference: string, expectedStatus: string, expectedQuantity: string) {

        await this.purchaseOrderSearch.fill(reference);
        await this.purchaseOrderSearch.press("End");

        const purchaseOrderRow = this.purchaseOrderRows.filter({ hasText: reference });

        await expect(purchaseOrderRow).toHaveCount(1);
        await expect(purchaseOrderRow).toContainText(expectedStatus);
        await expect(purchaseOrderRow).toContainText(new RegExp(`${expectedQuantity}(\\.\\d+)?`));

    }

    async verifyVendorOnPurchaseOrder(reference: string, vendorName: string) {

        const purchaseOrderRow = this.purchaseOrderRows.filter({ hasText: reference });

        await expect(purchaseOrderRow).toContainText(vendorName);

    }

    /**
     * Opens Create PR for the order with the given reference.
     *
     * The row's Actions menu is moved out to the end of the document when it
     * opens, so the item cannot be reached through the row it belongs to. Only one
     * menu is ever open, which makes the visible one unambiguous.
     */
    async openCreatePurchaseRequest(reference: string) {

        const purchaseOrderRow = this.purchaseOrderRows.filter({ hasText: reference });

        await purchaseOrderRow.getByRole("button", { name: "Actions" }).click();

        const createPrItem = this.page.getByRole("menu").getByRole("link", { name: "Create PR" });

        await expect(createPrItem).toBeVisible();
        await createPrItem.click();

        await this.page.waitForURL(/\/purchases\/create\?/);

        await expect(this.purchaseQuantity).toBeVisible();

    }

    /**
     * Reads what the receipt screen says the order asked for.
     *
     * The Ordered Qty cell reads "<ordered> /<remaining>", so only the figure
     * before the slash is the ordered amount. Reading it from the application is
     * what makes the later comparison meaningful -- it checks the quantity the
     * order actually stored, rather than comparing a test value with itself.
     */
    async readOrderedQuantityOnPurchaseRequest(): Promise<string> {

        await expect(this.orderedQuantityCell).toHaveText(/\d/);

        const orderedQuantity = await this.orderedQuantityCell.textContent();

        return (orderedQuantity ?? "").split("/")[0].trim();

    }

    async enterPurchaseQuantity(quantity: string) {

        await this.purchaseQuantity.fill(quantity);

        await expect(this.purchaseQuantity).toHaveValue(quantity);
        await expect(this.totalQuantity).toHaveText(new RegExp(`^${quantity}(\\.\\d+)?$`));

    }

    async savePurchaseRequest() {

        await this.saveButton.click();

        await this.page.waitForURL(/\/purchases$/);

    }

    /**
     * Confirms the receipt reached the purchases list.
     *
     * This list uses DataTables' own filter box, which reacts to fill() on its
     * own, unlike the bespoke search on the purchase order list.
     */
    async verifyPurchaseRequestSaved(reference: string, vendorName: string) {

        await this.purchaseSearch.fill(reference);

        const purchaseRow = this.purchaseRows.filter({ hasText: reference });

        await expect(purchaseRow).toHaveCount(1);
        await expect(purchaseRow).toContainText(vendorName);

    }
}
