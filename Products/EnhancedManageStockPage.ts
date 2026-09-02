import { Page, Locator, expect } from "@playwright/test";

export class EnhancedManageStockPage {

    page: Page;
    productsMenu: Locator;
    enhancedManageStockMenuItem: Locator;
    stockHeading: Locator;

    modeDropdown: Locator;
    operationDropdown: Locator;
    operationInfoBanner: Locator;
    remarksBox: Locator;
    openDropdownSearch: Locator;

    singleModeHeading: Locator;
    bulkFilterHeading: Locator;

    productSearchDropdown: Locator;
    productInfoPanel: Locator;
    currentStockValue: Locator;
    quantity: Locator;
    updateButton: Locator;

    constructor(page: Page) {

        this.page = page;

        // Enhanced Manage Stock sits in the same sidebar group as List Products, so
        // the group toggle is matched exactly to keep the click off its siblings.
        this.productsMenu = page.getByRole("link", { name: "Products", exact: true });

        this.enhancedManageStockMenuItem = page.getByRole("link", { name: "Enhanced Manage Stock", exact: true });

        this.stockHeading = page.getByRole("heading", { name: "Enhanced Manage Stock" });

        // Select Mode and Operation are select2 widgets wrapping selects that carry
        // explicit ids, so select2 derives its container id straight from them
        // (select2-stock_mode-container). That is why these need none of the
        // positional-suffix handling the ML Location Tax widget needs on the Add
        // Product form.
        this.modeDropdown = page
            .getByRole("combobox")
            .filter({ has: page.locator("#select2-stock_mode-container") });

        this.operationDropdown = page
            .getByRole("combobox")
            .filter({ has: page.locator("#select2-operation_type-container") });

        // The banner is a bare span inside a Bootstrap .alert, which carries no
        // role, and the Operation change handler rewrites its copy. Its id is the
        // only stable handle.
        this.operationInfoBanner = page.locator("#operation_info_text");

        this.remarksBox = page.getByPlaceholder(/^e\.g\., Damaged goods/);

        // select2 moves its search field into whichever dropdown is currently open,
        // the same way the brand and category widgets behave on the Add Product
        // form.
        this.openDropdownSearch = page.locator(".select2-container--open input.select2-search__field");

        // Both mode sections stay in the DOM and are toggled with show()/hide(), so
        // their box titles are what prove which mode is active.
        this.singleModeHeading = page.getByRole("heading", { name: "Single Product Stock Update" });
        this.bulkFilterHeading = page.getByRole("heading", { name: "Filter Products / Variations" });

        this.productSearchDropdown = page
            .getByRole("combobox")
            .filter({ has: page.locator("#select2-single_product_search-container") });

        this.productInfoPanel = page.locator("#single_product_info");

        // Current Stock is a span beside a <strong> caption with no label
        // relationship to it, so the id is the only handle. The page writes the
        // figure through toFixed(2), so the text always reads like "12.00".
        this.currentStockValue = page.locator("#sp_current_stock");

        // Bulk mode renders a quantity field too, labelled "Quantity to Apply:",
        // and it stays in the DOM while Single mode is showing. Anchoring on
        // "Quantity:" keeps this locator off it.
        this.quantity = page.getByLabel(/^Quantity:/);

        // The button renders a Font Awesome check before its text, so its accessible
        // name is " Update Stock". Anchoring the regex at the end keeps this off bulk
        // mode's "Update Stock for Selected Products".
        this.updateButton = page.getByRole("button", { name: /Update Stock$/ });

    }

    async openEnhancedManageStock() {

        await this.productsMenu.click();

        // The sub-menu items are hidden until the parent group expands.
        await expect(this.enhancedManageStockMenuItem).toBeVisible();

        await this.enhancedManageStockMenuItem.click();
        await this.page.waitForURL(/\/stock-management$/);

        await expect(this.stockHeading).toBeVisible();

    }

    async selectMode(modeName: string) {

        await this.modeDropdown.click();

        await this.selectOpenDropdownOption(modeName);

        await expect(this.modeDropdown).toContainText(modeName);

    }

    async selectOperation(operationName: string) {

        await this.operationDropdown.click();

        await this.selectOpenDropdownOption(operationName);

        await expect(this.operationDropdown).toContainText(operationName);

    }

    async enterRemarks(remarks: string) {

        await this.remarksBox.fill(remarks);
        await expect(this.remarksBox).toHaveValue(remarks);

    }

    /**
     * Checks the banner explains the operation that is selected.
     *
     * The copy is built as "<strong>Addition:</strong> Current Stock + ..." so the
     * expected value is the rendered text, with the colon after the operation name
     * coming from the bold run.
     */
    async verifyOperationBanner(bannerText: string) {

        await expect(this.operationInfoBanner).toHaveText(bannerText);

    }

    async verifySingleModeActive() {

        await expect(this.singleModeHeading).toBeVisible();
        await expect(this.bulkFilterHeading).toBeHidden();

    }

    async verifyBulkModeActive() {

        await expect(this.bulkFilterHeading).toBeVisible();
        await expect(this.singleModeHeading).toBeHidden();

    }

    /**
     * Picks a product by SKU and returns the stock the panel is showing for it.
     *
     * The search is an AJAX select2 that needs two characters before it fires and
     * caps its list at 20 rows, so the SKU is what gets typed: it is unique, which
     * keeps the list to a single row, and it is also how each option ends -- the
     * controller formats every label as "Product Name (SKU)", or
     * "Product Name - Variation (SKU)" for a variant.
     *
     * A product only appears here if stock is enabled for it, it is neither
     * discontinued nor inactive, and it is assigned to the selected location. A SKU
     * that misses any one of those returns an empty list, which reads exactly like
     * a broken locator.
     */
    async selectProductBySku(sku: string): Promise<number> {

        await this.productSearchDropdown.click();

        await this.openDropdownSearch.fill(sku);

        // getByRole matches an accessible name by substring, so the bracketed SKU
        // is enough to pin the row without escaping it into a regex.
        const productOption = this.page
            .locator(".select2-container--open")
            .getByRole("treeitem", { name: `(${sku})` });

        await expect(productOption).toBeVisible();
        await productOption.click();

        await expect(this.productInfoPanel).toBeVisible();

        return await this.readCurrentStock();

    }

    /**
     * Reads Current Stock as a number.
     *
     * The panel starts out showing "-", so waiting for a numeric value is what
     * proves the selected product's figure has landed.
     */
    async readCurrentStock(): Promise<number> {

        await expect(this.currentStockValue).toHaveText(/^-?\d+(\.\d+)?$/);

        const currentStock = await this.currentStockValue.textContent();

        return parseFloat(currentStock ?? "");

    }

    async enterQuantity(quantity: number) {

        // The field drives the live Preview off an "input" event, which fill()
        // dispatches, so no trailing keypress is needed here.
        await this.quantity.fill(String(quantity));
        await expect(this.quantity).toHaveValue(String(quantity));

    }

    /**
     * Saves the change and waits for the application's own confirmation.
     *
     * The update is an AJAX POST, so the click on its own proves nothing has
     * finished. The success message is the only signal the request came back, and
     * waiting on it is what stops a later re-read from racing the write. The
     * controller builds it as "Successfully updated stock for {n} variation(s)
     * using {operation} operation.", so the operation is asserted here too -- that
     * is what separates an Addition run from a Subtraction one.
     */
    async clickUpdateStock(operationType: string) {

        await this.updateButton.click();

        await expect(
            this.page.getByText(`Successfully updated stock for 1 variation(s) using ${operationType} operation.`)
        ).toBeVisible();

    }

    /**
     * Saves a change the application is expected to refuse.
     *
     * The negative-stock guard runs in two places: the page blocks the request up
     * front, and the controller repeats the check per variation before it writes
     * anything. Only the client message is reachable through the UI, so that is
     * what is asserted, and the caller then re-reads the stock to prove nothing
     * moved.
     */
    async clickUpdateStockExpectingNegativeStockError() {

        await this.updateButton.click();

        await expect(this.page.getByText(/Stock cannot be reduced below zero/)).toBeVisible();

    }

    /**
     * Proves the new stock was stored, not just recalculated in the browser.
     *
     * On success the page rewrites Current Stock from its own cached copy of the
     * figure, applying the same arithmetic itself without asking the server. That
     * means reading the panel straight after a save would pass even if nothing had
     * been written. Reloading throws that cached value away and forces the search
     * to fetch the stored stock again.
     */
    async verifyStockAfterOperation(sku: string, expectedStock: number) {

        await this.page.reload();

        await expect(this.stockHeading).toBeVisible();

        const persistedStock = await this.selectProductBySku(sku);

        // toBeCloseTo rather than toBe because the page reports stock to two
        // decimals and a fractional quantity would otherwise fail on float noise.
        expect(persistedStock).toBeCloseTo(expectedStock, 2);

    }

    /**
     * Clicks an option in whichever select2 dropdown is currently open.
     *
     * select2 renders its list items with role="treeitem" rather than
     * role="option", so getByRole("option") would never match -- the same
     * behaviour the Add Product form's widgets show.
     */
    protected async selectOpenDropdownOption(optionName: string) {

        const option = this.page
            .locator(".select2-container--open")
            .getByRole("treeitem", { name: optionName, exact: true });

        await expect(option).toBeVisible();
        await option.click();

    }
}
