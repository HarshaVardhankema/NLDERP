import { test } from "@playwright/test";
import { LoginManager } from "../Login/LoginManager";
import { ProductsManager } from "../Products/ProductsManager";
import { requireEnv } from "../utils/TestUtils";
import stockData from "../test-data/stockData.json";

// Every case here mutates the stock of stockData.product.sku, and the suite runs
// on one worker against a shared environment, so no test may assume the stock it
// starts with. The operation cases therefore open by resetting to a known
// baseline and assert the change from there.

test("TC-NLD-STOCK-001 - Verify administrator can increase stock using the Addition operation", async ({ page }) => {

  //part 1 - Initialize the flow Page Object Managers

  const loginManager = new LoginManager(page);
  const productsManager = new ProductsManager(page);

  const LoginPage = loginManager.getLoginPage();
  const DashboardPage = loginManager.getDashboardPage();
  const EnhancedManageStockPage = productsManager.getEnhancedManageStockPage();

  //part 2 - Login to NLD ERP as administrator

  await LoginPage.loginToNldErp(
    requireEnv("NLD_USERNAME"),
    requireEnv("NLD_PASSWORD")
  );

  await DashboardPage.verifyLoginSuccessful();

  //part 3 - Open Enhanced Manage Stock from the Products menu

  await EnhancedManageStockPage.openEnhancedManageStock();

  //part 4 - Select Single Product Stock Management mode

  await EnhancedManageStockPage.selectMode(stockData.modes.single);

  //part 5 - Select the Addition operation

  await EnhancedManageStockPage.selectOperation(stockData.operations.addition);

  //part 6 - Search for the product by SKU and read the stock it starts with

  const stockBefore = await EnhancedManageStockPage.selectProductBySku(stockData.product.sku);

  //part 7 - Record why the stock is being changed

  await EnhancedManageStockPage.enterRemarks(stockData.remarks);

  //part 8 - Enter the quantity to add and save

  await EnhancedManageStockPage.enterQuantity(stockData.quantities.addition);

  await EnhancedManageStockPage.clickUpdateStock(stockData.operationTypes.addition);

  //part 9 - Verify the stored stock grew by exactly the entered quantity

  await EnhancedManageStockPage.verifyStockAfterOperation(
    stockData.product.sku,
    stockBefore + stockData.quantities.addition
  );

})

test("TC-NLD-STOCK-002 - Verify administrator can reduce stock using the Subtraction operation", async ({ page }) => {

  //part 1 - Initialize the flow Page Object Managers

  const loginManager = new LoginManager(page);
  const productsManager = new ProductsManager(page);

  const LoginPage = loginManager.getLoginPage();
  const DashboardPage = loginManager.getDashboardPage();
  const EnhancedManageStockPage = productsManager.getEnhancedManageStockPage();

  //part 2 - Login to NLD ERP as administrator

  await LoginPage.loginToNldErp(
    requireEnv("NLD_USERNAME"),
    requireEnv("NLD_PASSWORD")
  );

  await DashboardPage.verifyLoginSuccessful();

  //part 3 - Open Enhanced Manage Stock from the Products menu

  await EnhancedManageStockPage.openEnhancedManageStock();

  //part 4 - Select Single Product Stock Management mode

  await EnhancedManageStockPage.selectMode(stockData.modes.single);

  //part 5 - Reset the product to a known baseline so the deduction has stock to
  //         work against whatever the previous run left behind

  await EnhancedManageStockPage.selectOperation(stockData.operations.reset);

  await EnhancedManageStockPage.selectProductBySku(stockData.product.sku);

  await EnhancedManageStockPage.enterQuantity(stockData.quantities.baseline);

  await EnhancedManageStockPage.clickUpdateStock(stockData.operationTypes.reset);

  //part 6 - Select the Subtraction operation

  await EnhancedManageStockPage.selectOperation(stockData.operations.subtraction);

  //part 7 - Re-read the stock the product now holds

  const stockBefore = await EnhancedManageStockPage.readCurrentStock();

  //part 8 - Enter the quantity to deduct and save

  await EnhancedManageStockPage.enterQuantity(stockData.quantities.subtraction);

  await EnhancedManageStockPage.clickUpdateStock(stockData.operationTypes.subtraction);

  //part 9 - Verify the stored stock fell by exactly the entered quantity

  await EnhancedManageStockPage.verifyStockAfterOperation(
    stockData.product.sku,
    stockBefore - stockData.quantities.subtraction
  );

})

test("TC-NLD-STOCK-003 - Verify administrator can overwrite stock using the Reset operation", async ({ page }) => {

  //part 1 - Initialize the flow Page Object Managers

  const loginManager = new LoginManager(page);
  const productsManager = new ProductsManager(page);

  const LoginPage = loginManager.getLoginPage();
  const DashboardPage = loginManager.getDashboardPage();
  const EnhancedManageStockPage = productsManager.getEnhancedManageStockPage();

  //part 2 - Login to NLD ERP as administrator

  await LoginPage.loginToNldErp(
    requireEnv("NLD_USERNAME"),
    requireEnv("NLD_PASSWORD")
  );

  await DashboardPage.verifyLoginSuccessful();

  //part 3 - Open Enhanced Manage Stock from the Products menu

  await EnhancedManageStockPage.openEnhancedManageStock();

  //part 4 - Select Single Product Stock Management mode

  await EnhancedManageStockPage.selectMode(stockData.modes.single);

  //part 5 - Put the product on a baseline that differs from the reset target, so
  //         the assertion cannot pass by the stock already being correct

  await EnhancedManageStockPage.selectOperation(stockData.operations.reset);

  await EnhancedManageStockPage.selectProductBySku(stockData.product.sku);

  await EnhancedManageStockPage.enterQuantity(stockData.quantities.baseline);

  await EnhancedManageStockPage.clickUpdateStock(stockData.operationTypes.reset);

  //part 6 - Reset the product to the target quantity

  await EnhancedManageStockPage.enterQuantity(stockData.quantities.reset);

  await EnhancedManageStockPage.clickUpdateStock(stockData.operationTypes.reset);

  //part 7 - Verify the stored stock is the entered quantity, not the baseline plus
  //         or minus it

  await EnhancedManageStockPage.verifyStockAfterOperation(
    stockData.product.sku,
    stockData.quantities.reset
  );

})

test("TC-NLD-STOCK-004 - Verify a subtraction beyond available stock is rejected and leaves stock unchanged", async ({ page }) => {

  //part 1 - Initialize the flow Page Object Managers

  const loginManager = new LoginManager(page);
  const productsManager = new ProductsManager(page);

  const LoginPage = loginManager.getLoginPage();
  const DashboardPage = loginManager.getDashboardPage();
  const EnhancedManageStockPage = productsManager.getEnhancedManageStockPage();

  //part 2 - Login to NLD ERP as administrator

  await LoginPage.loginToNldErp(
    requireEnv("NLD_USERNAME"),
    requireEnv("NLD_PASSWORD")
  );

  await DashboardPage.verifyLoginSuccessful();

  //part 3 - Open Enhanced Manage Stock from the Products menu

  await EnhancedManageStockPage.openEnhancedManageStock();

  //part 4 - Select Single Product Stock Management mode

  await EnhancedManageStockPage.selectMode(stockData.modes.single);

  //part 5 - Reset the product to a known baseline to deduct against

  await EnhancedManageStockPage.selectOperation(stockData.operations.reset);

  await EnhancedManageStockPage.selectProductBySku(stockData.product.sku);

  await EnhancedManageStockPage.enterQuantity(stockData.quantities.baseline);

  await EnhancedManageStockPage.clickUpdateStock(stockData.operationTypes.reset);

  //part 6 - Select the Subtraction operation

  await EnhancedManageStockPage.selectOperation(stockData.operations.subtraction);

  //part 7 - Attempt to deduct more than the product holds

  await EnhancedManageStockPage.enterQuantity(stockData.quantities.beyondAvailable);

  await EnhancedManageStockPage.clickUpdateStockExpectingNegativeStockError();

  //part 8 - Verify the rejected deduction left the stored stock on the baseline

  await EnhancedManageStockPage.verifyStockAfterOperation(
    stockData.product.sku,
    stockData.quantities.baseline
  );

})

test("TC-NLD-STOCK-005 - Verify Select Mode switches between the Single Product and Bulk Stock sections", async ({ page }) => {

  //part 1 - Initialize the flow Page Object Managers

  const loginManager = new LoginManager(page);
  const productsManager = new ProductsManager(page);

  const LoginPage = loginManager.getLoginPage();
  const DashboardPage = loginManager.getDashboardPage();
  const EnhancedManageStockPage = productsManager.getEnhancedManageStockPage();

  //part 2 - Login to NLD ERP as administrator

  await LoginPage.loginToNldErp(
    requireEnv("NLD_USERNAME"),
    requireEnv("NLD_PASSWORD")
  );

  await DashboardPage.verifyLoginSuccessful();

  //part 3 - Open Enhanced Manage Stock from the Products menu

  await EnhancedManageStockPage.openEnhancedManageStock();

  //part 4 - Verify the page opens on Single Product Stock Management

  await EnhancedManageStockPage.verifySingleModeActive();

  //part 5 - Switch to Bulk Stock Update and verify the bulk section replaces it

  await EnhancedManageStockPage.selectMode(stockData.modes.bulk);

  await EnhancedManageStockPage.verifyBulkModeActive();

  //part 6 - Switch back and verify the single-product section returns

  await EnhancedManageStockPage.selectMode(stockData.modes.single);

  await EnhancedManageStockPage.verifySingleModeActive();

})

test("TC-NLD-STOCK-006 - Verify the operation banner explains the selected operation", async ({ page }) => {

  //part 1 - Initialize the flow Page Object Managers

  const loginManager = new LoginManager(page);
  const productsManager = new ProductsManager(page);

  const LoginPage = loginManager.getLoginPage();
  const DashboardPage = loginManager.getDashboardPage();
  const EnhancedManageStockPage = productsManager.getEnhancedManageStockPage();

  //part 2 - Login to NLD ERP as administrator

  await LoginPage.loginToNldErp(
    requireEnv("NLD_USERNAME"),
    requireEnv("NLD_PASSWORD")
  );

  await DashboardPage.verifyLoginSuccessful();

  //part 3 - Open Enhanced Manage Stock from the Products menu

  await EnhancedManageStockPage.openEnhancedManageStock();

  //part 4 - Verify the page opens explaining the Addition operation

  await EnhancedManageStockPage.verifyOperationBanner(stockData.operationBanners.addition);

  //part 5 - Verify the banner follows the Subtraction operation

  await EnhancedManageStockPage.selectOperation(stockData.operations.subtraction);

  await EnhancedManageStockPage.verifyOperationBanner(stockData.operationBanners.subtraction);

  //part 6 - Verify the banner follows the Reset operation

  await EnhancedManageStockPage.selectOperation(stockData.operations.reset);

  await EnhancedManageStockPage.verifyOperationBanner(stockData.operationBanners.reset);

})
