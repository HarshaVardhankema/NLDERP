import { Page } from "@playwright/test";
import { CustomerCarePage } from "./CustomerCarePage";

export class CustomerCareManager {

    page: Page;
    CustomerCarePage: CustomerCarePage;

    constructor(page: Page) {

        this.page = page;
        this.CustomerCarePage = new CustomerCarePage(this.page);

    }

    getCustomerCarePage() {
        return this.CustomerCarePage
    }
}
