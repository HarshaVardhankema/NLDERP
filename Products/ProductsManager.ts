import { Page } from "@playwright/test";
import { SingleProductPage } from "./SingleProductPage";
import { VariantProductPage } from "./VariantProductPage";
import { EnhancedManageStockPage } from "./EnhancedManageStockPage";
import { PrintLabelsPage } from "./PrintLabelsPage";

export class ProductsManager {

    page: Page;
    SingleProductPage: SingleProductPage;
    VariantProductPage: VariantProductPage;
    EnhancedManageStockPage: EnhancedManageStockPage;
    PrintLabelsPage: PrintLabelsPage;

    constructor(page: Page) {

        this.page = page;
        this.SingleProductPage = new SingleProductPage(this.page);
        this.VariantProductPage = new VariantProductPage(this.page);
        this.EnhancedManageStockPage = new EnhancedManageStockPage(this.page);
        this.PrintLabelsPage = new PrintLabelsPage(this.page);

    }

    getSingleProductPage() {
        return this.SingleProductPage
    }

    getVariantProductPage() {
        return this.VariantProductPage
    }

    getEnhancedManageStockPage() {
        return this.EnhancedManageStockPage
    }

    getPrintLabelsPage() {
        return this.PrintLabelsPage
    }
}
