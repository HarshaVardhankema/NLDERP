import { Page, Locator, expect } from "@playwright/test";
import { SingleProductPage } from "./SingleProductPage";

/**
 * The Add Product form driven as a Variable product.
 *
 * Everything up to the product type -- the sidebar navigation, the list page, the
 * name, ML and CT values, the ML Location Tax, brand and category widgets, the
 * image upload, Save and the created-product verification -- is identical to the
 * single-product flow, so it is inherited from SingleProductPage rather than
 * repeated here. What this class adds is only what a Variable product changes:
 * the product type, the flavour selection, and the per-variation pricing that
 * replaces the single Exc. tax field.
 *
 * Note that the inherited enterExcTax() does NOT work for a Variable product --
 * selecting "Variable" removes the single-product pricing block from the page
 * altogether. Use enterVariationExcTax() instead.
 */
export class VariantProductPage extends SingleProductPage {

    productTypeDropdown: Locator;
    variationTemplate: Locator;
    flavorSearch: Locator;
    flavorOptions: Locator;
    selectedFlavors: Locator;
    variationValues: Locator;
    variationPurchasePrices: Locator;
    variationSellPrices: Locator;

    constructor(page: Page) {

        super(page);

        this.productTypeDropdown = page
            .getByRole("combobox")
            .filter({ has: page.locator("#select2-type-container") });

        // The "Please Select" dropdown that appears for a Variable product is a
        // plain <select> of variation *templates* (Flavor, Color, Flavours, Size),
        // not the flavour list. Its name is index-based, so the match is on the
        // suffix rather than a hardcoded row number.
        this.variationTemplate = page.locator('select[name$="[variation_template_id]"]');

        // Choosing a template reveals a select2 multi-select holding the flavour
        // values. It has no label and its container id is generated, so it is
        // reached through the name of the select it replaces.
        this.flavorSearch = page.locator(
            'select[name$="[variation_template_values][]"] + .select2-container input.select2-search__field'
        );

        // Options live in the detached panel select2 appends when a dropdown opens.
        // Scoping to the open container keeps this to whichever list is showing.
        this.flavorOptions = page.locator(".select2-container--open").getByRole("treeitem");

        this.selectedFlavors = page.locator(
            'select[name$="[variation_template_values][]"] + .select2-container li.select2-selection__choice'
        );

        // Every chosen flavour becomes its own variation row. These fields carry no
        // label and their placeholders repeat across rows, so the form field names
        // are the only stable handles.
        this.variationValues = page.locator('input[name^="product_variation"][name$="[value]"]');
        this.variationPurchasePrices = page.locator('input[name$="[default_purchase_price]"]');
        this.variationSellPrices = page.locator('input[name$="[default_sell_price]"]');

    }

    async selectProductType(productType: string) {

        await this.productTypeDropdown.click();

        await this.selectOpenDropdownOption(productType);

        await expect(this.productTypeDropdown).toContainText(productType);

    }

    /**
     * Reveals the flavour list for a Variable product.
     *
     * The "Please Select" control is the variation template picker, so picking
     * "Flavor" is what makes the application load the flavour values. It is a
     * plain <select>, which is why selectOption is the real user interaction here
     * rather than a select2 click. The application then leaves the flavour widget
     * already open, so this deliberately does not click it -- clicking an open
     * select2 closes it again.
     */
    async openFlavorDropdown(templateName: string) {

        await this.variationTemplate.selectOption({ label: templateName });

        await expect(this.flavorSearch).toBeVisible();
        await expect(this.flavorOptions).not.toHaveCount(0);

    }

    /**
     * Picks `count` different flavours at random from the ones actually on offer.
     *
     * The options are read from the rendered list rather than from the underlying
     * select, so nothing hidden is touched and no fixed index is assumed. Returns
     * the chosen names so the caller can assert against them.
     */
    async selectRandomFlavors(count: number): Promise<string[]> {

        const rendered = await this.flavorOptions.allTextContents();

        const names = rendered
            .map(name => name.trim())
            .filter(name => name !== "" && name !== "Please Select");

        // A handful of flavour names are duplicated in this data ("BLUE RAZZ" and
        // "BANANA CREAM" each appear twice among 971 options). A repeated name would
        // make the click below match two elements, so only names that occur once are
        // eligible.
        const selectable = names.filter(name => names.indexOf(name) === names.lastIndexOf(name));

        expect(selectable.length).toBeGreaterThanOrEqual(count);

        const chosen: string[] = [];

        while (chosen.length < count) {

            const candidate = selectable[Math.floor(Math.random() * selectable.length)];

            if (!chosen.includes(candidate)) {
                chosen.push(candidate);
            }
        }

        for (const flavor of chosen) {
            await this.selectFlavor(flavor);
        }

        return chosen;

    }

    async verifySelectedFlavors(expectedFlavors: string[]) {

        await expect(this.selectedFlavors).toHaveCount(expectedFlavors.length);

        // Each flavour also becomes a variation row whose value field holds the
        // exact name. Those are compared instead of the widget's own tags because
        // flavour names overlap -- "GOLD" and "GOLD SWEET" are both on the list, so
        // a substring check could pass on the wrong tag.
        await expect(this.variationValues).toHaveCount(expectedFlavors.length);

        const variationRows = await this.variationValues.all();

        for (const [index, flavor] of expectedFlavors.entries()) {
            await expect(variationRows[index]).toHaveValue(flavor);
        }

    }

    /**
     * Enters Exc. tax for every variation row.
     *
     * A Variable product has no single Exc. tax field -- selecting "Variable"
     * removes the single-product pricing block from the page and replaces it with
     * one purchase and one selling price per variation, all of them required. As on
     * the single-product form the selling price is derived when the purchase price
     * loses focus, so each row is filled and blurred, and the derived values are
     * waited for rather than paused on.
     */
    async enterVariationExcTax(excTax: string) {

        for (const purchasePrice of await this.variationPurchasePrices.all()) {

            await purchasePrice.fill(excTax);
            await purchasePrice.blur();

            await expect(purchasePrice).toHaveValue(excTax);
        }

        for (const sellPrice of await this.variationSellPrices.all()) {
            await expect(sellPrice).not.toHaveValue("");
        }

    }

    /**
     * Picks one flavour by name.
     *
     * select2 closes the widget after each pick, so a second flavour cannot be
     * chosen by clicking the widget again -- that would toggle it shut while it is
     * still open on the first pass. Typing into its search field both reopens it
     * and narrows 971 options down to the wanted one.
     */
    private async selectFlavor(flavorName: string) {

        await this.flavorSearch.fill(flavorName);

        await this.selectOpenDropdownOption(flavorName);

    }
}
