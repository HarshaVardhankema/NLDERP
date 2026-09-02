import { Page, Locator, expect } from "@playwright/test";

export class PrintLabelsPage {

    page: Page;
    productsMenu: Locator;
    printLabelsMenuItem: Locator;
    printLabelsHeading: Locator;
    productSearch: Locator;
    productSuggestions: Locator;
    selectedProductRow: Locator;
    previewButton: Locator;
    labelPreview: Locator;
    labelBarcode: Locator;

    constructor(page: Page) {

        this.page = page;

        // The sidebar also carries "Product Visibility", "List Products" and
        // several other entries beginning with "Product", so the group toggle has
        // to be matched exactly.
        this.productsMenu = page.getByRole("link", { name: "Products", exact: true });
        this.printLabelsMenuItem = page.getByRole("link", { name: "Print Labels", exact: true });

        this.printLabelsHeading = page.getByRole("heading", { name: "Print Labels" });

        this.productSearch = page.getByPlaceholder("Enter products name to print labels");

        // Suggestions come from a jQuery UI autocomplete, which renders plain <li>
        // elements carrying no ARIA roles at all, so getByRole("option") matches
        // nothing here -- the same situation as the Google Places suggestions on
        // the customer form.
        this.productSuggestions = page.locator("ul.ui-autocomplete li.ui-menu-item");

        // Choosing a suggestion fetches a label row over AJAX. The row's first cell
        // holds the product name next to the hidden product id, so filtering on
        // that input pins the cell without relying on its position.
        this.selectedProductRow = page
            .locator("div.pl-row-cell")
            .filter({ has: page.locator('input[name$="[product_id]"]') });

        this.previewButton = page.getByRole("button", { name: /Preview/ });

        // Preview is a full navigation to /labels/preview, which renders the
        // generated labels as a single unclassed table and nothing else, so the
        // table role is both unique and the only stable handle on that page.
        this.labelPreview = page.getByRole("table");

        // The barcode is an inline base64 PNG.
        this.labelBarcode = page.getByRole("img");

    }

    async openProductsMenu() {

        await this.productsMenu.click();

        // The sub-menu items stay hidden until the parent group expands, so waiting
        // for "Print Labels" proves the menu actually opened.
        await expect(this.printLabelsMenuItem).toBeVisible();

    }

    async openPrintLabels() {

        await this.printLabelsMenuItem.click();
        await this.page.waitForURL(/\/labels\/show$/);

        await expect(this.printLabelsHeading).toBeVisible();
        await expect(this.productSearch).toBeVisible();

    }

    /**
     * Types an SKU into the product search.
     *
     * The field is a typeahead bound to key events, so the value is typed rather
     * than filled -- fill() dispatches only "input" and the search never fires.
     *
     * The entered value is deliberately not asserted: when a search matches
     * exactly one product the application selects it immediately and clears the
     * box, so the field can legitimately be empty by the time this returns. What
     * matters is that suggestions came back.
     */
    async enterProductSku(sku: string) {

        await this.productSearch.pressSequentially(sku);

        await expect(this.productSuggestions).not.toHaveCount(0);

    }

    /**
     * Picks the suggestion belonging to the entered SKU.
     *
     * Suggestions read "<SKU> - <Product Name>", with a variation in brackets
     * where the product has them. The product-level entry shares its SKU with
     * every variation entry and selecting it queues a label for all of them, so
     * the full label is matched exactly to queue just the one wanted.
     */
    async selectProductFromDropdown(sku: string, productName: string, variation: string) {

        const suggestion = this.productSuggestions.getByText(
            `${sku} - ${productName} (${variation})`,
            { exact: true }
        );

        await expect(suggestion).toBeVisible();
        await suggestion.click();

        // The row arrives from GET /labels/add-product-row, so it has to be waited
        // for -- clicking Preview before it lands leaves nothing to preview.
        await expect(this.selectedProductRow).toContainText(productName);
        await expect(this.selectedProductRow).toContainText(variation);

    }

    async clickPreview() {

        await this.previewButton.click();

        // Preview is not a modal: it navigates, carrying the queued products and
        // every print option as query parameters.
        await this.page.waitForURL(/\/labels\/preview/);

    }

    async verifyLabelPreview() {

        await expect(this.labelPreview).toBeVisible();
        await expect(this.labelBarcode).not.toHaveCount(0);

    }

    /**
     * Checks the label actually carries the selected product's details.
     *
     * The rendered label shows the business name, product name, the variation as
     * "Flavor:<value>", a price and the barcode number. It does NOT print the SKU,
     * so the SKU cannot be asserted here -- the product name and variation are
     * what tie the label back to the product that was chosen.
     */
    async verifyLabelData(productName: string, variation: string, businessName: string) {

        await expect(this.labelPreview).toContainText(businessName);
        await expect(this.labelPreview).toContainText(productName);
        await expect(this.labelPreview).toContainText(variation);
        await expect(this.labelPreview).toContainText(/Price:\s*\$/);

    }
}
