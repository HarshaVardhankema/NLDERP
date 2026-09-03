import { Page, Locator, expect } from "@playwright/test";

export class InventoryTransferPage {

    page: Page;
    productsMenu: Locator;
    inventoryTransferMenuItem: Locator;
    inventoryHeading: Locator;
    inventoryRowCheckboxes: Locator;

    transferStockButton: Locator;
    transferModal: Locator;
    transferFromMark: Locator;
    transferToMark: Locator;
    directionToggle: Locator;
    transferProductSearch: Locator;
    transferProductRows: Locator;
    transferSelectedCount: Locator;
    createTransferButton: Locator;
    transferSuccessView: Locator;
    transferSummaryDirection: Locator;
    transferSummaryUnits: Locator;
    transferDoneButton: Locator;

    createPoDraftButton: Locator;
    poDraftModal: Locator;
    vendorTrigger: Locator;
    vendorSearch: Locator;
    vendorResults: Locator;
    vendorLabel: Locator;
    poQuantityInput: Locator;
    poGrandTotal: Locator;
    createDraftPoButton: Locator;
    createNewPoButton: Locator;
    poDraftReference: Locator;
    poDraftDoneButton: Locator;
    viewDraftPoLink: Locator;

    // The Edit PO screen opens in a second tab, so its page cannot exist when this
    // object is built. openDraftPo stores it here and the steps after it read it.
    editPoPage: Page | null;

    constructor(page: Page) {

        this.page = page;
        this.editPoPage = null;

        // The sidebar carries several entries starting with "Product", so the group
        // toggle is matched exactly.
        this.productsMenu = page.getByRole("link", { name: "Products", exact: true });
        this.inventoryTransferMenuItem = page.getByRole("link", { name: "Inventory Transfer", exact: true });

        // The page is titled "Inventory Transfer" but its heading is just "Inventory".
        this.inventoryHeading = page.getByRole("heading", { name: "Inventory", exact: true });

        // The inventory rows carry checkboxes, not radio buttons -- one per row, all
        // enabled. selectAvailableInventoryItem picks the first usable one rather
        // than a fixed position.
        this.inventoryRowCheckboxes = page.locator("#invTable tbody input.inv-row-cb");

        this.transferStockButton = page.getByRole("button", { name: "Transfer Stock", exact: true });

        // Every dialog on this screen is a .modal-overlay that gains an "open" class.
        this.transferModal = page.locator("#transferModal");

        // The direction is shown twice: as a short mark ("NLD" / "G") and as a long
        // name. The names are inconsistent between the two sides -- NLD reads
        // "No limit Distro" as source but "No Limit Distribution" as destination --
        // so the marks are what get asserted.
        this.transferFromMark = page.locator("#tfFromMark");
        this.transferToMark = page.locator("#tfToMark");

        // The arrow is a div with an onclick handler, so it has no button role. Its
        // title ends with "click to switch direction" and the leading part changes
        // as the direction flips, hence the partial match.
        this.directionToggle = page.getByTitle(/click to switch direction/);

        this.transferProductSearch = page.getByPlaceholder("Search SKU, product, brand, vendor…");

        // Result rows. A product with no stock at the source renders its button as
        // "Not in GH" or "Inactive in GH" instead of "+ Add".
        this.transferProductRows = page.locator("#tfProductList .tf-pitem");

        this.transferSelectedCount = page.locator("#tfSelectedCount");
        this.createTransferButton = page.locator("#tfSubmit");

        // Creating a transfer does not open a separate popup: the modal swaps its
        // main view out for a success view.
        this.transferSuccessView = page.locator("#tfSuccessView");
        this.transferSummaryDirection = page.locator("#tfSummaryDir");
        this.transferSummaryUnits = page.locator("#tfSummaryUnits");
        this.transferDoneButton = this.transferSuccessView.getByRole("button", { name: "Done", exact: true });

        this.createPoDraftButton = page.locator("#poDraftBtn");
        this.poDraftModal = page.locator("#poDraftModal");

        // The vendor picker is a bespoke dropdown rather than a select or select2:
        // a trigger button, a search box and a list of plain divs.
        this.vendorTrigger = page.locator("#poDraftVendorTrigger");
        this.vendorSearch = page.getByPlaceholder("Search vendor…");
        this.vendorResults = page.locator("#poDraftVendorList .po-vd-item");
        this.vendorLabel = page.locator("#poDraftVendorLabel");

        this.poQuantityInput = page.locator("#poDraftItemsBody input.po-qty-input");
        this.poGrandTotal = page.locator("#poDraftGrandTotal");
        this.createDraftPoButton = page.locator("#poDraftSubmitBtn");

        // Shown only when the chosen vendor already has an active draft PO.
        this.createNewPoButton = page.locator("#poCreateNewBtn");

        // The saved reference is a bare span following a "Draft PO #" label, with no
        // id or class of its own, so it is matched on its own text shape.
        this.poDraftReference = this.poDraftModal.getByText(/^PO\d{6,}$/);

        this.poDraftDoneButton = this.poDraftModal.getByRole("button", { name: "Done", exact: true });
        this.viewDraftPoLink = this.poDraftModal.getByRole("link", { name: "View Draft PO" });

    }

    async openProductsMenu() {

        await this.productsMenu.click();

        // The sub-menu items stay hidden until the group expands.
        await expect(this.inventoryTransferMenuItem).toBeVisible();

    }

    async openInventoryTransfer() {

        await this.inventoryTransferMenuItem.click();
        await this.page.waitForURL(/\/inventory-display$/);

        await expect(this.inventoryHeading).toBeVisible();
        await expect(this.transferStockButton).toBeVisible();

        // The inventory rows arrive after the page itself. Both the Transfer Stock
        // dialog and the PO draft work from that loaded data -- opening the dialog
        // beforehand gives an empty product list -- so the rows are waited for here
        // rather than in each caller.
        await expect(this.inventoryRowCheckboxes).not.toHaveCount(0);

    }

    async openTransferStock() {

        await this.transferStockButton.click();

        await expect(this.transferProductSearch).toBeVisible();
        await expect(this.createTransferButton).toBeVisible();

        // The dialog clears its own search box once the product list has loaded, so
        // typing before that happens silently loses the search term and leaves the
        // list unfiltered. Waiting for the list to arrive puts the reset behind us.
        await expect(this.transferProductRows).not.toHaveCount(0);

    }

    async verifyTransferDirection(fromMark: string, toMark: string) {

        await expect(this.transferFromMark).toHaveText(fromMark);
        await expect(this.transferToMark).toHaveText(toMark);

    }

    /**
     * Flips source and destination.
     *
     * The marks are read first so the assertion afterwards proves the arrow really
     * swapped the two sides rather than just re-rendering them.
     */
    async reverseTransferDirection() {

        const beforeFrom = await this.transferFromMark.textContent();
        const beforeTo = await this.transferToMark.textContent();

        await this.directionToggle.click();

        await expect(this.transferFromMark).toHaveText((beforeTo ?? "").trim());
        await expect(this.transferToMark).toHaveText((beforeFrom ?? "").trim());

    }

    async searchTransferProduct(productName: string) {

        await this.transferProductSearch.fill(productName);

        // Asserting the box kept what was typed catches the dialog's own reset
        // wiping the term, which would otherwise show up as an empty result list.
        await expect(this.transferProductSearch).toHaveValue(productName);

        await expect(this.transferProductRows.filter({ hasText: productName })).toHaveCount(1);

    }

    /**
     * Adds the searched product to the transfer.
     *
     * The button only reads "+ Add" when the source location actually holds the
     * product; otherwise the application renders it as "Not in GH" or
     * "Inactive in GH" and the product cannot be transferred in that direction.
     */
    async addProductToTransfer(productName: string) {

        const productRow = this.transferProductRows.filter({ hasText: productName });
        const addButton = productRow.getByRole("button", { name: "+ Add", exact: true });

        await expect(addButton).toBeVisible();
        await addButton.click();

        await expect(this.transferSelectedCount).toHaveText("1");

    }

    async createTransfer() {

        await this.createTransferButton.click();

        await expect(this.transferSuccessView).toBeVisible();

    }

    async verifyTransferCompleted(expectedDirection: string) {

        await expect(this.transferSuccessView).toBeVisible();
        await expect(this.transferSummaryDirection).toHaveText(expectedDirection);

        // The summary reports the units actually moved, so a non-zero figure is what
        // shows stock changed hands rather than an empty confirmation.
        await expect(this.transferSummaryUnits).toHaveText(/^[1-9]\d*$/);

    }

    async completeTransfer() {

        await this.transferDoneButton.click();

        await expect(this.transferModal).toBeHidden();

    }

    /**
     * Ticks the first inventory row that can be selected.
     *
     * The rows are checkboxes rather than the radio buttons the manual case
     * describes. The list is walked until an enabled one is found so nothing
     * depends on a fixed row position.
     */
    async selectAvailableInventoryItem() {

        await expect(this.inventoryRowCheckboxes).not.toHaveCount(0);

        for (const checkbox of await this.inventoryRowCheckboxes.all()) {

            if (await checkbox.isEnabled()) {

                await checkbox.check();
                await expect(checkbox).toBeChecked();

                return;
            }
        }

        throw new Error("No selectable inventory row was available to build a PO draft from.");

    }

    async openCreatePoDraft() {

        await this.createPoDraftButton.click();

        await expect(this.vendorTrigger).toBeVisible();
        await expect(this.createDraftPoButton).toBeVisible();

    }

    async selectVendor(vendorSearchTerm: string, vendorName: string) {

        await this.vendorTrigger.click();

        await expect(this.vendorSearch).toBeVisible();
        await this.vendorSearch.fill(vendorSearchTerm);

        // The results are plain divs with no ARIA roles, so they are matched on text.
        const vendorOption = this.vendorResults.filter({ hasText: vendorName });

        await expect(vendorOption).toHaveCount(1);
        await vendorOption.click();

        await expect(this.vendorLabel).toHaveText(vendorName);

    }

    async enterQuantity(quantity: string) {

        await this.poQuantityInput.fill(quantity);

        await expect(this.poQuantityInput).toHaveValue(quantity);

        // The line and grand totals recalculate from the quantity, so waiting for a
        // money value proves the entry was taken rather than merely typed.
        await expect(this.poGrandTotal).toHaveText(/^\$\d/);

    }

    /**
     * Saves the draft PO and returns its reference.
     *
     * Saving does not always complete in one step: when the chosen vendor already
     * has an active draft the application interrupts with a choice between adding
     * to that draft and starting a new one. Every run of this test creates a draft
     * for the same vendor, so from the second run onwards that prompt always
     * appears. "Create New" is taken so each run owns its own PO and cannot be
     * disturbed by what earlier runs left behind.
     */
    async createDraftPo(): Promise<string> {

        await this.createDraftPoButton.click();

        // Whichever of the two arrives first settles which path this run took.
        await expect(this.createNewPoButton.or(this.poDraftReference)).toBeVisible();

        if (await this.createNewPoButton.isVisible()) {
            await this.createNewPoButton.click();
        }

        await expect(this.poDraftReference).toBeVisible();

        const reference = await this.poDraftReference.textContent();

        return (reference ?? "").trim();

    }

    async verifyDraftPoCreated(reference: string, vendorName: string) {

        await expect(this.poDraftReference).toHaveText(reference);
        await expect(this.poDraftModal).toContainText(vendorName);
        await expect(this.poDraftModal).toContainText("Draft PO Created");

    }

    async completePoDraft() {

        await this.poDraftDoneButton.click();

        await expect(this.poDraftModal).toBeHidden();

    }

    /**
     * Opens the saved draft for editing.
     *
     * "View Draft PO" is a link that targets a new tab, so the page it opens has to
     * be picked up from the context rather than waited for on this one.
     */
    async openDraftPo() {

        const [editPoPage] = await Promise.all([
            this.page.context().waitForEvent("page"),
            this.viewDraftPoLink.click()
        ]);

        await editPoPage.waitForLoadState("domcontentloaded");

        this.editPoPage = editPoPage;

    }

    /**
     * Confirms the Edit PO screen opened on the PO that was just created.
     *
     * Locators here are built in the method because the tab they belong to does not
     * exist while this object is being constructed. The screen does not print the
     * PO reference anywhere, so the vendor carried over from the draft is what ties
     * it back to the right record.
     */
    async verifyEditPoPageOpened(vendorName: string) {

        const editPoPage = this.requireEditPoPage();

        await expect(editPoPage).toHaveURL(/\/purchase-order\/\d+\/edit$/);
        await expect(editPoPage.getByRole("heading", { name: "Edit purchase order" })).toBeVisible();
        await expect(editPoPage.locator("#supplier_id")).toHaveValue(/\d+/);
        await expect(editPoPage.locator("#supplier_id").locator("option:checked")).toHaveText(vendorName);

    }

    async updatePo() {

        const editPoPage = this.requireEditPoPage();

        await editPoPage.locator("#submit_purchase_form").click();

        // Updating leaves the edit screen and lands on the purchase order list.
        await editPoPage.waitForURL(/\/purchase-order$/);

    }

    /**
     * Checks the updated PO is still a draft.
     *
     * The Edit PO screen shows no status at all, so this is read from the purchase
     * order list the update redirects to, which carries a Status column. The list
     * pages at 25 rows, and its search box is wired as
     * $('#po_search').on('keyup', ...), so a key has to follow the fill -- End
     * moves the caret without altering the value.
     */
    async verifyPoRemainsDraft(reference: string) {

        const editPoPage = this.requireEditPoPage();

        const poSearch = editPoPage.getByPlaceholder("Search purchase orders...");

        await poSearch.fill(reference);
        await poSearch.press("End");

        const poRow = editPoPage.getByRole("row").filter({ hasText: reference });

        await expect(poRow).toHaveCount(1);
        await expect(poRow).toContainText("Draft");

    }

    private requireEditPoPage(): Page {

        if (!this.editPoPage) {
            throw new Error("The Edit PO tab has not been opened yet; call openDraftPo first.");
        }

        return this.editPoPage;

    }
}
