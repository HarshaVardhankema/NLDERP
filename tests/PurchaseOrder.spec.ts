import { test, expect } from "@playwright/test";
import { LoginManager } from "../Login/LoginManager";
import { VendorCareManager } from "../VendorCare/VendorCareManager";
import { requireEnv, uniqueReference } from "../utils/TestUtils";
import purchaseOrderData from "../test-data/purchaseOrderData.json";

// All three cases order from the vendor TC-NLD-VENDOR-001 created, read back out
// of test-data/vendorData.json, and none of them creates another vendor. Each
// supplies its own Reference No so it can find the record it saved in a list
// that already holds hundreds, which keeps the three independent of each other
// and of the order they run in.

test("TC-NLD-PO-001 - Verify administrator can create and save a purchase order", async ({ page }) => {

  //part 1 - Initialize the flow Page Object Managers

  const loginManager = new LoginManager(page);
  const vendorCareManager = new VendorCareManager(page);

  const LoginPage = loginManager.getLoginPage();
  const DashboardPage = loginManager.getDashboardPage();
  const PurchaseOrderPage = vendorCareManager.getPurchaseOrderPage();

  //part 2 - Login to NLD ERP as administrator

  await LoginPage.loginToNldErp(
    requireEnv("NLD_USERNAME"),
    requireEnv("NLD_PASSWORD")
  );

  await DashboardPage.verifyLoginSuccessful();

  //part 3 - Open Purchase Order (PO) from the Vendor Care menu

  await PurchaseOrderPage.openVendorCareMenu();

  await PurchaseOrderPage.openPurchaseOrders();

  //part 4 - Click Add to open the purchase order form

  await PurchaseOrderPage.clickAddPurchaseOrder();

  //part 5 - Give the order a reference this test can find it by

  const purchaseOrderReference = uniqueReference(purchaseOrderData.referencePrefix.purchaseOrder);

  await PurchaseOrderPage.enterReference(purchaseOrderReference);

  //part 6 - Select the vendor created by TC-NLD-VENDOR-001

  const vendorName = PurchaseOrderPage.readStoredVendorName();

  await PurchaseOrderPage.selectVendor(vendorName);

  //part 7 - Search for the product and add the wanted one

  await PurchaseOrderPage.searchAndSelectProduct(
    purchaseOrderData.product.sku,
    purchaseOrderData.product.name
  );

  //part 8 - Enter the order quantity

  await PurchaseOrderPage.enterOrderQuantity(purchaseOrderData.orderQuantity);

  //part 9 - Save the purchase order

  await PurchaseOrderPage.savePurchaseOrder();

  //part 10 - Verify the order was saved against the right vendor

  await PurchaseOrderPage.verifyPurchaseOrderSaved(
    purchaseOrderReference,
    purchaseOrderData.statuses.ordered,
    purchaseOrderData.orderQuantity
  );

  await PurchaseOrderPage.verifyVendorOnPurchaseOrder(purchaseOrderReference, vendorName);

})

test("TC-NLD-PO-002 - Verify administrator can save a purchase order as draft", async ({ page }) => {

  //part 1 - Initialize the flow Page Object Managers

  const loginManager = new LoginManager(page);
  const vendorCareManager = new VendorCareManager(page);

  const LoginPage = loginManager.getLoginPage();
  const DashboardPage = loginManager.getDashboardPage();
  const PurchaseOrderPage = vendorCareManager.getPurchaseOrderPage();

  //part 2 - Login to NLD ERP as administrator

  await LoginPage.loginToNldErp(
    requireEnv("NLD_USERNAME"),
    requireEnv("NLD_PASSWORD")
  );

  await DashboardPage.verifyLoginSuccessful();

  //part 3 - Open Purchase Order (PO) from the Vendor Care menu

  await PurchaseOrderPage.openVendorCareMenu();

  await PurchaseOrderPage.openPurchaseOrders();

  //part 4 - Click Add to open the purchase order form

  await PurchaseOrderPage.clickAddPurchaseOrder();

  //part 5 - Give the order a reference this test can find it by

  const purchaseOrderReference = uniqueReference(purchaseOrderData.referencePrefix.purchaseOrder);

  await PurchaseOrderPage.enterReference(purchaseOrderReference);

  //part 6 - Select the vendor created by TC-NLD-VENDOR-001

  const vendorName = PurchaseOrderPage.readStoredVendorName();

  await PurchaseOrderPage.selectVendor(vendorName);

  //part 7 - Search for the product and add the wanted one

  await PurchaseOrderPage.searchAndSelectProduct(
    purchaseOrderData.product.sku,
    purchaseOrderData.product.name
  );

  //part 8 - Enter the order quantity

  await PurchaseOrderPage.enterOrderQuantity(purchaseOrderData.orderQuantity);

  //part 9 - Save the purchase order as a draft

  await PurchaseOrderPage.savePurchaseOrderAsDraft();

  //part 10 - Verify the order was saved in Draft status

  await PurchaseOrderPage.verifyPurchaseOrderSaved(
    purchaseOrderReference,
    purchaseOrderData.statuses.draft,
    purchaseOrderData.orderQuantity
  );

})

test("TC-NLD-PO-003 - Verify a purchase request created from a purchase order carries the ordered quantity", async ({ page }) => {

  //part 1 - Initialize the flow Page Object Managers

  const loginManager = new LoginManager(page);
  const vendorCareManager = new VendorCareManager(page);

  const LoginPage = loginManager.getLoginPage();
  const DashboardPage = loginManager.getDashboardPage();
  const PurchaseOrderPage = vendorCareManager.getPurchaseOrderPage();

  //part 2 - Login to NLD ERP as administrator

  await LoginPage.loginToNldErp(
    requireEnv("NLD_USERNAME"),
    requireEnv("NLD_PASSWORD")
  );

  await DashboardPage.verifyLoginSuccessful();

  //part 3 - Open Purchase Order (PO) from the Vendor Care menu

  await PurchaseOrderPage.openVendorCareMenu();

  await PurchaseOrderPage.openPurchaseOrders();

  //part 4 - Click Add to open the purchase order form

  await PurchaseOrderPage.clickAddPurchaseOrder();

  //part 5 - Give the order a reference this test can find it by

  const purchaseOrderReference = uniqueReference(purchaseOrderData.referencePrefix.purchaseOrder);

  await PurchaseOrderPage.enterReference(purchaseOrderReference);

  //part 6 - Select the vendor created by TC-NLD-VENDOR-001

  const vendorName = PurchaseOrderPage.readStoredVendorName();

  await PurchaseOrderPage.selectVendor(vendorName);

  //part 7 - Search for the product and add the wanted one

  await PurchaseOrderPage.searchAndSelectProduct(
    purchaseOrderData.product.sku,
    purchaseOrderData.product.name
  );

  //part 8 - Enter the order quantity and remember it for the receipt

  const orderQuantity = purchaseOrderData.orderQuantity;

  await PurchaseOrderPage.enterOrderQuantity(orderQuantity);

  //part 9 - Save the purchase order

  await PurchaseOrderPage.savePurchaseOrder();

  await PurchaseOrderPage.verifyPurchaseOrderSaved(
    purchaseOrderReference,
    purchaseOrderData.statuses.ordered,
    orderQuantity
  );

  //part 10 - Open Create PR from the order's Actions menu

  await PurchaseOrderPage.openCreatePurchaseRequest(purchaseOrderReference);

  //part 11 - Verify the receipt reports the quantity the order actually stored

  const orderedQuantityOnRequest = await PurchaseOrderPage.readOrderedQuantityOnPurchaseRequest();

  expect(orderedQuantityOnRequest).toBe(orderQuantity);

  //part 12 - Give the receipt its own reference

  const purchaseRequestReference = uniqueReference(purchaseOrderData.referencePrefix.purchaseRequest);

  await PurchaseOrderPage.enterReference(purchaseRequestReference);

  //part 13 - Purchase the same quantity the order asked for

  await PurchaseOrderPage.enterPurchaseQuantity(orderedQuantityOnRequest);

  //part 14 - Save the purchase request

  await PurchaseOrderPage.savePurchaseRequest();

  //part 15 - Verify the purchase request was created for the same vendor

  await PurchaseOrderPage.verifyPurchaseRequestSaved(purchaseRequestReference, vendorName);

})
