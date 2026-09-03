import { test } from "@playwright/test";
import { LoginManager } from "../Login/LoginManager";
import { ProductsManager } from "../Products/ProductsManager";
import { requireEnv } from "../utils/TestUtils";
import inventoryTransferData from "../test-data/inventoryTransferData.json";

// Each case here moves real stock or saves a real draft purchase order against a
// shared environment, so nothing assumes the state a previous run left behind.
// The two transfer cases send stock in opposite directions, which keeps the
// product's split between the two locations roughly where it started.

test("TC-NLD-TRANSFER-001 - Verify stock can be transferred from NLD to GO HUNTER", async ({ page }) => {

  //part 1 - Initialize the flow Page Object Managers

  const loginManager = new LoginManager(page);
  const productsManager = new ProductsManager(page);

  const LoginPage = loginManager.getLoginPage();
  const DashboardPage = loginManager.getDashboardPage();
  const InventoryTransferPage = productsManager.getInventoryTransferPage();

  //part 2 - Login to NLD ERP as administrator

  await LoginPage.loginToNldErp(
    requireEnv("NLD_USERNAME"),
    requireEnv("NLD_PASSWORD")
  );

  await DashboardPage.verifyLoginSuccessful();

  //part 3 - Open the Products menu

  await InventoryTransferPage.openProductsMenu();

  //part 4 - Open the Inventory Transfer page

  await InventoryTransferPage.openInventoryTransfer();

  //part 5 - Open the Transfer Stock dialog

  await InventoryTransferPage.openTransferStock();

  //part 6 - Verify the default direction is NLD to GO HUNTER

  await InventoryTransferPage.verifyTransferDirection(
    inventoryTransferData.locations.nldMark,
    inventoryTransferData.locations.goHunterMark
  );

  //part 7 - Search for the product to transfer

  await InventoryTransferPage.searchTransferProduct(inventoryTransferData.transferProduct.name);

  //part 8 - Add the product to the transfer

  await InventoryTransferPage.addProductToTransfer(inventoryTransferData.transferProduct.name);

  //part 9 - Create the transfer

  await InventoryTransferPage.createTransfer();

  //part 10 - Verify the transfer completed in the NLD to GO HUNTER direction

  await InventoryTransferPage.verifyTransferCompleted(inventoryTransferData.locations.nldToGoHunter);

  //part 11 - Close the confirmation

  await InventoryTransferPage.completeTransfer();

})

test("TC-NLD-TRANSFER-002 - Verify stock can be transferred from GO HUNTER to NLD using the direction switch", async ({ page }) => {

  //part 1 - Initialize the flow Page Object Managers

  const loginManager = new LoginManager(page);
  const productsManager = new ProductsManager(page);

  const LoginPage = loginManager.getLoginPage();
  const DashboardPage = loginManager.getDashboardPage();
  const InventoryTransferPage = productsManager.getInventoryTransferPage();

  //part 2 - Login to NLD ERP as administrator

  await LoginPage.loginToNldErp(
    requireEnv("NLD_USERNAME"),
    requireEnv("NLD_PASSWORD")
  );

  await DashboardPage.verifyLoginSuccessful();

  //part 3 - Open Inventory Transfer from the Products menu

  await InventoryTransferPage.openProductsMenu();

  await InventoryTransferPage.openInventoryTransfer();

  //part 4 - Open the Transfer Stock dialog

  await InventoryTransferPage.openTransferStock();

  //part 5 - Verify the direction starts as NLD to GO HUNTER

  await InventoryTransferPage.verifyTransferDirection(
    inventoryTransferData.locations.nldMark,
    inventoryTransferData.locations.goHunterMark
  );

  //part 6 - Reverse the direction with the arrow

  await InventoryTransferPage.reverseTransferDirection();

  //part 7 - Verify the direction is now GO HUNTER to NLD

  await InventoryTransferPage.verifyTransferDirection(
    inventoryTransferData.locations.goHunterMark,
    inventoryTransferData.locations.nldMark
  );

  //part 8 - Search for the product to transfer

  await InventoryTransferPage.searchTransferProduct(inventoryTransferData.transferProduct.name);

  //part 9 - Add the product to the transfer

  await InventoryTransferPage.addProductToTransfer(inventoryTransferData.transferProduct.name);

  //part 10 - Create the transfer

  await InventoryTransferPage.createTransfer();

  //part 11 - Verify the transfer completed in the GO HUNTER to NLD direction

  await InventoryTransferPage.verifyTransferCompleted(inventoryTransferData.locations.goHunterToNld);

  //part 12 - Close the confirmation

  await InventoryTransferPage.completeTransfer();

})

test("TC-NLD-TRANSFER-003 - Verify a Draft Purchase Order can be created from Inventory Transfer", async ({ page }) => {

  //part 1 - Initialize the flow Page Object Managers

  const loginManager = new LoginManager(page);
  const productsManager = new ProductsManager(page);

  const LoginPage = loginManager.getLoginPage();
  const DashboardPage = loginManager.getDashboardPage();
  const InventoryTransferPage = productsManager.getInventoryTransferPage();

  //part 2 - Login to NLD ERP as administrator

  await LoginPage.loginToNldErp(
    requireEnv("NLD_USERNAME"),
    requireEnv("NLD_PASSWORD")
  );

  await DashboardPage.verifyLoginSuccessful();

  //part 3 - Open Inventory Transfer from the Products menu

  await InventoryTransferPage.openProductsMenu();

  await InventoryTransferPage.openInventoryTransfer();

  //part 4 - Select an available inventory item

  await InventoryTransferPage.selectAvailableInventoryItem();

  //part 5 - Open the Create PO Draft dialog

  await InventoryTransferPage.openCreatePoDraft();

  //part 6 - Search for and select the vendor

  await InventoryTransferPage.selectVendor(
    inventoryTransferData.poDraft.vendorSearch,
    inventoryTransferData.poDraft.vendor
  );

  //part 7 - Enter the order quantity

  await InventoryTransferPage.enterQuantity(inventoryTransferData.poDraft.quantity);

  //part 8 - Create the draft purchase order

  const draftPoReference = await InventoryTransferPage.createDraftPo();

  //part 9 - Verify the draft was created for the chosen vendor

  await InventoryTransferPage.verifyDraftPoCreated(
    draftPoReference,
    inventoryTransferData.poDraft.vendor
  );

  //part 10 - Close the confirmation

  await InventoryTransferPage.completePoDraft();

})

test("TC-NLD-TRANSFER-004 - Verify a Draft Purchase Order can be created, opened and updated", async ({ page }) => {

  //part 1 - Initialize the flow Page Object Managers

  const loginManager = new LoginManager(page);
  const productsManager = new ProductsManager(page);

  const LoginPage = loginManager.getLoginPage();
  const DashboardPage = loginManager.getDashboardPage();
  const InventoryTransferPage = productsManager.getInventoryTransferPage();

  //part 2 - Login to NLD ERP as administrator

  await LoginPage.loginToNldErp(
    requireEnv("NLD_USERNAME"),
    requireEnv("NLD_PASSWORD")
  );

  await DashboardPage.verifyLoginSuccessful();

  //part 3 - Open Inventory Transfer from the Products menu

  await InventoryTransferPage.openProductsMenu();

  await InventoryTransferPage.openInventoryTransfer();

  //part 4 - Select an available inventory item

  await InventoryTransferPage.selectAvailableInventoryItem();

  //part 5 - Open the Create PO Draft dialog

  await InventoryTransferPage.openCreatePoDraft();

  //part 6 - Search for and select the vendor

  await InventoryTransferPage.selectVendor(
    inventoryTransferData.poDraft.vendorSearch,
    inventoryTransferData.poDraft.vendor
  );

  //part 7 - Enter the order quantity

  await InventoryTransferPage.enterQuantity(inventoryTransferData.poDraft.quantity);

  //part 8 - Create the draft purchase order

  const draftPoReference = await InventoryTransferPage.createDraftPo();

  await InventoryTransferPage.verifyDraftPoCreated(
    draftPoReference,
    inventoryTransferData.poDraft.vendor
  );

  //part 9 - Open the draft for editing

  await InventoryTransferPage.openDraftPo();

  //part 10 - Verify the Edit PO screen opened on the new draft

  await InventoryTransferPage.verifyEditPoPageOpened(inventoryTransferData.poDraft.vendor);

  //part 11 - Update the purchase order

  await InventoryTransferPage.updatePo();

  //part 12 - Verify the purchase order is still a draft

  await InventoryTransferPage.verifyPoRemainsDraft(draftPoReference);

})
