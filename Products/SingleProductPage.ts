import { Page, Locator, expect } from "@playwright/test";
import path from "path";

// The product image is committed under test-data/ so the upload does not depend
// on a developer's Downloads folder or Windows username. __dirname is this
// feature folder, which puts the file one level up.
const PRODUCT_IMAGE_FILE = "thca-crumbleprerolls-mockup3.jpg";
const PRODUCT_IMAGE_PATH = path.resolve(__dirname, "..", "test-data", PRODUCT_IMAGE_FILE);

export class SingleProductPage {

    page: Page;
    productsMenu: Locator;
    listProductsMenuItem: Locator;
    productsHeading: Locator;
    productsTableHeader: Locator;
    addButton: Locator;
    searchBox: Locator;

    addProductHeading: Locator;
    productName: Locator;
    mlValue: Locator;
    ctValue: Locator;
    mlLocationTaxDropdown: Locator;
    brandDropdown: Locator;
    categoryDropdown: Locator;
    openDropdownSearch: Locator;
    uploadImage: Locator;
    excTax: Locator;
    sellingPriceExcTax: Locator;
    saveButton: Locator;

    constructor(page: Page) {

        this.page = page;

        // The sidebar also carries "Product Visibility", "List Products",
        // "Add Product", "Import Products" and "Product Requests", so the group
        // toggle has to be matched exactly or the click lands on a sibling.
        this.productsMenu = page.getByRole("link", { name: "Products", exact: true });

        // The menu item reads "List Products", not "List of Products".
        this.listProductsMenuItem = page.getByRole("link", { name: "List Products", exact: true });

        this.productsHeading = page.getByRole("heading", { name: "Products", exact: true });

        // DataTables swaps the list's role from "table" to "grid" once its JS has
        // initialised, so anchoring on the role races that init. A column header
        // exists in both states. "SKU" is used rather than "Product" because the
        // header row also holds "Product image", "Product Type" and
        // "Product Source". The name is a regex because DataTables appends
        // "activate to sort column ..." to each sortable header after init.
        this.productsTableHeader = page.getByRole("columnheader", { name: /^SKU/ });

        // The toolbar button's accessible name is exactly "Add" -- its icon is an
        // inline SVG that contributes nothing to the name. The match must be exact
        // because the page also offers "Add Product", "Add Purchase Receipt(PR)",
        // "Add Sale Invoice (SI)" and several more in the quick-add menu.
        this.addButton = page.getByRole("link", { name: "Add", exact: true });

        this.searchBox = page.getByPlaceholder("Search products...");

        this.addProductHeading = page.getByRole("heading", { name: "Add new product" });

        // Labels render as "Product Name:*", "ML Value:*" and so on, so each match
        // is anchored to the start of the label text.
        this.productName = page.getByLabel(/^Product Name/);
        this.mlValue = page.getByLabel(/^ML Value/);
        this.ctValue = page.getByLabel(/^CT Value/);

        // ML Location Tax is a select2 widget whose generated container id carries
        // a positional suffix (select2-locationTaxType-7w-container), so the widget
        // is reached through the stable name of the select it replaces -- the same
        // approach the Business Location dropdown needs on the customer form.
        this.mlLocationTaxDropdown = page.locator('select[name="locationTaxType[]"] + .select2-container');

        // Brand and Category are select2 widgets too, but their container ids are
        // stable. There are 14 comboboxes on this form, so each is pinned by its
        // own container.
        this.brandDropdown = page
            .getByRole("combobox")
            .filter({ has: page.locator("#select2-brand_id-container") });

        this.categoryDropdown = page
            .getByRole("combobox")
            .filter({ has: page.locator("#select2-category_id-container") });

        // select2 moves its search field into whichever dropdown is currently open,
        // and only one can be open at a time. Scoping to the open container keeps
        // this clear of the always-visible search box the Web categories
        // multi-select renders inline.
        this.openDropdownSearch = page.locator(".select2-container--open input.select2-search__field");

        // The file input the application exposes for the product image. It carries a
        // stable id and no label, and the visible control is a Bootstrap
        // "Browse.." wrapper with no accessible relationship to the input.
        this.uploadImage = page.locator("#upload_image");

        // Two inputs on this form use the placeholder "Exc. tax" -- the purchase
        // price and the selling price. Only the purchase price carries a label, so
        // the label is what separates them.
        this.excTax = page.getByLabel(/^Exc\. tax/);

        // The selling price has neither a label nor a unique placeholder, so its id
        // is the only stable handle. It is read to prove the form's own price
        // calculation ran; see enterExcTax below.
        this.sellingPriceExcTax = page.locator("#single_dsp");

        // The button renders a Font Awesome check before its text, and that glyph
        // becomes part of the accessible name (" Save"), so an exact "Save" match
        // finds nothing. Anchoring the regex to the end of the name keeps this off
        // the "Save And Add Another" button sitting beside it.
        this.saveButton = page.getByRole("button", { name: /Save$/ });

    }

    async openProductsMenu() {

        await this.productsMenu.click();

        // The sub-menu items are hidden until the parent group expands, so waiting
        // for "List Products" proves the menu actually opened.
        await expect(this.listProductsMenuItem).toBeVisible();

    }

    async openListOfProducts() {

        await this.listProductsMenuItem.click();
        await this.page.waitForURL(/\/products$/);

        await expect(this.productsHeading).toBeVisible();
        await expect(this.productsTableHeader).toBeVisible();
        await expect(this.addButton).toBeVisible();

    }

    async clickAdd() {

        await this.addButton.click();

        // The list lives at /products but the create form is served from
        // /nld/products/create.
        await this.page.waitForURL(/\/nld\/products\/create$/);

        await expect(this.addProductHeading).toBeVisible();

    }

    async enterProductName(productName: string) {

        await this.productName.fill(productName);
        await expect(this.productName).toHaveValue(productName);

    }

    async enterMlValue(mlValue: string) {

        await this.mlValue.fill(mlValue);
        await expect(this.mlValue).toHaveValue(mlValue);

    }

    /**
     * Fills CT Value.
     *
     * The manual test case does not list this field, but the form marks it
     * "CT Value:*" and the browser blocks the submit while it is empty, so the
     * happy path has to supply it.
     */
    async enterCtValue(ctValue: string) {

        await this.ctValue.fill(ctValue);
        await expect(this.ctValue).toHaveValue(ctValue);

    }

    async selectMlLocationTax(taxName: string) {

        await this.mlLocationTaxDropdown.click();

        await this.selectOpenDropdownOption(taxName);

        await expect(this.mlLocationTaxDropdown).toContainText(taxName);

    }

    /**
     * Picks a brand by searching for it.
     *
     * The list holds 168 brands, so the widget is driven the way a user drives it:
     * open it, type into select2's search box, wait for the filtered result and
     * click it. Typing alone does not select anything.
     */
    async selectBrand(brandName: string) {

        await this.brandDropdown.click();

        await this.openDropdownSearch.fill(brandName);

        await this.selectOpenDropdownOption(brandName);

        await expect(this.brandDropdown).toContainText(brandName);

    }

    async selectCategory(categoryName: string) {

        await this.categoryDropdown.click();

        await this.selectOpenDropdownOption(categoryName);

        await expect(this.categoryDropdown).toContainText(categoryName);

    }

    async uploadProductImage() {

        await this.uploadImage.setInputFiles(PRODUCT_IMAGE_PATH);

        // The Bootstrap wrapper renders no preview, so the input's own value is the
        // only on-page evidence that the file attached. Browsers report it as
        // C:\fakepath\<name>, hence the trailing match on the file name.
        await expect(this.uploadImage).toHaveValue(new RegExp(`${PRODUCT_IMAGE_FILE}$`));

    }

    async enterExcTax(excTax: string) {

        await this.excTax.fill(excTax);

        // The form derives Inc. tax and the selling price from this field when it
        // loses focus, and those derived fields are themselves required, so leaving
        // the caret here makes the save fail. Blurring runs the calculation, and
        // waiting for the selling price to appear keeps that deterministic without
        // a fixed pause.
        await this.excTax.blur();

        await expect(this.excTax).toHaveValue(excTax);
        await expect(this.sellingPriceExcTax).not.toHaveValue("");

    }

    async saveProduct() {

        await this.saveButton.click();

    }

    async verifyProductCreated(productName: string, categoryName: string, brandName: string, productType: string) {

        await this.page.waitForURL(/\/products$/);

        // No success toast is asserted. Saving redirects to the list, and that page
        // renders no flash message -- checked against the running application,
        // which behaves the same way as the user-creation flow.

        // The list holds 400+ products over 25-row pages, so a newly created product
        // is not on the first page. Searching by its unique name narrows the grid to
        // the new record. The page wires the box up as
        // $('#product_search').on('keyup', ...) and fill() only dispatches "input",
        // so a key has to follow the fill; End moves the caret without editing the
        // value.
        await this.searchBox.fill(productName);
        await this.searchBox.press("End");

        const productRow = this.page.getByRole("row").filter({ hasText: productName });

        await expect(productRow).toHaveCount(1);
        await expect(productRow).toContainText(categoryName);
        await expect(productRow).toContainText(brandName);

        // The list carries a Product Type column, so this is what distinguishes a
        // Variable product from a Single one once it has been saved.
        await expect(productRow).toContainText(productType);

        // The list falls back to img/default.png for a product with no image, so a
        // src that is not the placeholder is what proves the upload was stored.
        await expect(productRow.getByRole("img")).not.toHaveAttribute("src", /default\.png$/);

    }

    /**
     * Clicks an option in whichever select2 dropdown is currently open.
     *
     * select2 renders its list items with role="treeitem" rather than
     * role="option", so getByRole("option") would never match. The lookup is
     * scoped to the open dropdown because the same label can exist in more than
     * one list on this form -- "THCA" is both an ML Location Tax and a Category.
     *
     * Protected rather than private because VariantProductPage drives the same
     * select2 widgets for Product Type and the flavour list.
     */
    protected async selectOpenDropdownOption(optionName: string) {

        const option = this.page
            .locator(".select2-container--open")
            .getByRole("treeitem", { name: optionName, exact: true });

        await expect(option).toBeVisible();
        await option.click();

    }
}
