import { test, expect } from "@playwright/test";
import { LoginManager } from "../Login/LoginManager";
import { requireEnv } from "../utils/TestUtils";

test("TC-NLD-LOGIN-001 - Verify NLD ERP login with valid credentials", async ({ page }) => {

  //part 1 - Initialize the Login flow Page Object Manager

  const loginManager = new LoginManager(page);

  const LoginPage = loginManager.getLoginPage();
  const DashboardPage = loginManager.getDashboardPage();

  // --------------------------
  // Login Flow
  // --------------------------

  //part 2 - Login into NLD ERP with valid credentials

  await LoginPage.loginToNldErp(
    requireEnv("NLD_USERNAME"),
    requireEnv("NLD_PASSWORD")
  );

  //part 3 - Verify login is successful

  await DashboardPage.verifyLoginSuccessful();

})
