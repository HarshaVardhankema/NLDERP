import { Page } from "@playwright/test";
import { VendorCarePage } from "./VendorCarePage";
import { PurchaseOrderPage } from "./PurchaseOrderPage";

export class VendorCareManager {

    page: Page;
    VendorCarePage: VendorCarePage;
    PurchaseOrderPage: PurchaseOrderPage;

    constructor(page: Page) {

        this.page = page;
        this.VendorCarePage = new VendorCarePage(this.page);
        this.PurchaseOrderPage = new PurchaseOrderPage(this.page);

    }

    getVendorCarePage() {
        return this.VendorCarePage
    }

    getPurchaseOrderPage() {
        return this.PurchaseOrderPage
    }
}
