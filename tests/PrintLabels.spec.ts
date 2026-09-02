import { test } from "@playwright/test";
import { LoginManager } from "../Login/LoginManager";
import { ProductsManager } from "../Products/ProductsManager";
import { requireEnv } from "../utils/TestUtils";
import printLabelData from "../test-data/printLabelData.json";

test("TC-NLD-PRODUCT-003 - Verify Print Labels functionality using a valid Product SKU", async ({ page }) => {

  //part 1 - Initialize the flow Page Object Managers

  const loginManager = new LoginManager(page);
  const productsManager = new ProductsManager(page);

  const LoginPage = loginManager.getLoginPage();
  const DashboardPage = loginManager.getDashboardPage();
  const PrintLabelsPage = productsManager.getPrintLabelsPage();

  // --------------------------
  // Print Labels Flow
  // --------------------------

  //part 2 - Login to NLD ERP as administrator

  await LoginPage.loginToNldErp(
    requireEnv("NLD_USERNAME"),
    requireEnv("NLD_PASSWORD")
  );

  await DashboardPage.verifyLoginSuccessful();

  //part 3 - Open the Products menu

  await PrintLabelsPage.openProductsMenu();

  //part 4 - Open the Print Labels page

  await PrintLabelsPage.openPrintLabels();

  //part 5 - Enter the product SKU

  await PrintLabelsPage.enterProductSku(printLabelData.labelProduct.sku);

  //part 6 - Select the matching product from the dropdown

  await PrintLabelsPage.selectProductFromDropdown(
    printLabelData.labelProduct.sku,
    printLabelData.labelProduct.productName,
    printLabelData.labelProduct.variation
  );

  //part 7 - Click Preview

  await PrintLabelsPage.clickPreview();

  //part 8 - Verify the label preview is displayed

  await PrintLabelsPage.verifyLabelPreview();

  //part 9 - Verify the label data matches the selected product

  await PrintLabelsPage.verifyLabelData(
    printLabelData.labelProduct.productName,
    printLabelData.labelProduct.variation,
    printLabelData.labelProduct.businessName
  );

})
