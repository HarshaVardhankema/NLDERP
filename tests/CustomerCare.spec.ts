import { test } from "@playwright/test";
import { LoginManager } from "../Login/LoginManager";
import { CustomerCareManager } from "../CustomerCare/CustomerCareManager";
import { requireEnv, uniqueEmail } from "../utils/TestUtils";
import customerData from "../test-data/customerData.json";

test("TC-NLD-CUSTOMER-001 - Verify administrator can create a new customer with valid business and contact details", async ({ page }) => {

  //part 1 - Initialize the flow Page Object Managers

  const loginManager = new LoginManager(page);
  const customerCareManager = new CustomerCareManager(page);

  const LoginPage = loginManager.getLoginPage();
  const DashboardPage = loginManager.getDashboardPage();
  const CustomerCarePage = customerCareManager.getCustomerCarePage();

  // --------------------------
  // Create Customer Flow
  // --------------------------

  //part 2 - Login to NLD ERP as administrator

  await LoginPage.loginToNldErp(
    requireEnv("NLD_USERNAME"),
    requireEnv("NLD_PASSWORD")
  );

  await DashboardPage.verifyLoginSuccessful();

  //part 3 - Open the Customer Care menu

  await CustomerCarePage.clickCustomerCare();

  //part 4 - Open the Customers page

  await CustomerCarePage.clickCustomers();

  //part 5 - Click Add to open the Add Customer form

  await CustomerCarePage.clickAdd();

  //part 6 - Enter the Business Name

  await CustomerCarePage.enterBusinessName(customerData.newCustomer.businessName);

  //part 7 - Select a Business Location from the dropdown

  await CustomerCarePage.selectBusinessLocation();

  //part 8 - Enter the customer First Name and Last Name

  await CustomerCarePage.enterCustomerName(
    customerData.newCustomer.firstName,
    customerData.newCustomer.lastName
  );

  //part 9 - Enter the Mobile Number

  await CustomerCarePage.enterMobileNumber(customerData.newCustomer.mobile);

  //part 10 - Enter the Email ID

  const newCustomerEmail = uniqueEmail(
    customerData.newCustomer.emailPrefix,
    customerData.newCustomer.emailDomain
  );

  await CustomerCarePage.enterEmail(newCustomerEmail);

  //part 11 - Type the address and pick it from the autocomplete suggestions

  await CustomerCarePage.enterAddress(customerData.newCustomer.addressSearchText);

  await CustomerCarePage.selectAddressSuggestion(
    customerData.newCustomer.expectedAddressSuggestion
  );

  await CustomerCarePage.verifyAddressSelected(
    customerData.newCustomer.expectedAddressSuggestion
  );

  //part 12 - Select the Payment Term required by the form

  await CustomerCarePage.selectPaymentTerm(customerData.newCustomer.paymentTerm);

  //part 13 - Save the new customer

  await CustomerCarePage.saveCustomer();

  //part 14 - Verify the customer was created successfully

  await CustomerCarePage.verifyCustomerCreated(
    newCustomerEmail,
    customerData.newCustomer.businessName
  );

})
