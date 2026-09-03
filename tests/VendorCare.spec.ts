import { test } from "@playwright/test";
import { LoginManager } from "../Login/LoginManager";
import { VendorCareManager } from "../VendorCare/VendorCareManager";
import { requireEnv, uniqueEmail, uniqueMobile } from "../utils/TestUtils";
import vendorData from "../test-data/vendorData.json";

test("TC-NLD-VENDOR-001 - Verify administrator can create a new vendor account with valid business, contact and billing details", async ({ page }) => {

  //part 1 - Initialize the flow Page Object Managers

  const loginManager = new LoginManager(page);
  const vendorCareManager = new VendorCareManager(page);

  const LoginPage = loginManager.getLoginPage();
  const DashboardPage = loginManager.getDashboardPage();
  const VendorCarePage = vendorCareManager.getVendorCarePage();

  // --------------------------
  // Create Vendor Flow
  // --------------------------

  //part 2 - Login to NLD ERP as administrator

  await LoginPage.loginToNldErp(
    requireEnv("NLD_USERNAME"),
    requireEnv("NLD_PASSWORD")
  );

  await DashboardPage.verifyLoginSuccessful();

  //part 3 - Open the Vendor Care menu

  await VendorCarePage.openVendorCareMenu();

  //part 4 - Open the Vendors page

  await VendorCarePage.openVendors();

  //part 5 - Click Add to open the vendor form

  await VendorCarePage.clickAddVendor();

  //part 6 - Enter the business information

  await VendorCarePage.enterBusinessName(vendorData.newVendor.businessName);

  await VendorCarePage.selectBusinessLocation(vendorData.newVendor.businessLocation);

  //part 7 - Enter the vendor contact details
  //         The mobile and email are generated per run because the form rejects
  //         a mobile or email that already belongs to another contact.

  const newVendorMobile = uniqueMobile(vendorData.newVendor.mobileLeadingDigit);

  const newVendorEmail = uniqueEmail(
    vendorData.newVendor.emailPrefix,
    vendorData.newVendor.emailDomain
  );

  await VendorCarePage.enterContactDetails(
    vendorData.newVendor.firstName,
    vendorData.newVendor.lastName,
    newVendorMobile,
    newVendorEmail
  );

  //part 8 - Enter the billing address and select a suggestion

  await VendorCarePage.enterBillingAddress(
    vendorData.newVendor.addressSearch,
    vendorData.newVendor.addressMatch
  );

  //part 9 - Verify the address was taken from the autocomplete

  await VendorCarePage.verifyAddressSelected(vendorData.newVendor.expectedCity);

  //part 10 - Create the vendor

  await VendorCarePage.createVendor();

  //part 11 - Verify the vendor was created and read the id it was given

  const supplierId = await VendorCarePage.verifyVendorCreated(
    newVendorMobile,
    vendorData.newVendor.businessName
  );

  //part 12 - Save the created vendor for later Vendor Care scenarios

  await VendorCarePage.captureVendorDetails(
    supplierId,
    vendorData.newVendor.businessName,
    newVendorMobile,
    newVendorEmail
  );

})
