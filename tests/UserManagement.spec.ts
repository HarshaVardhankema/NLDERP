import { test } from "@playwright/test";
import { LoginManager } from "../Login/LoginManager";
import { UserManagementManager } from "../UserManagement/UserManagementManager";
import { requireEnv, uniqueEmail } from "../utils/TestUtils";
import userData from "../test-data/userData.json";

test("TC-NLD-USER-001 - Verify administrator can create a new user with the Sales agent role", async ({ page }) => {

  //part 1 - Initialize the flow Page Object Managers

  const loginManager = new LoginManager(page);
  const userManagementManager = new UserManagementManager(page);

  const LoginPage = loginManager.getLoginPage();
  const DashboardPage = loginManager.getDashboardPage();
  const UserManagementPage = userManagementManager.getUserManagementPage();

  // --------------------------
  // Create User Flow
  // --------------------------

  //part 2 - Login to NLD ERP as administrator

  await LoginPage.loginToNldErp(
    requireEnv("NLD_USERNAME"),
    requireEnv("NLD_PASSWORD")
  );

  await DashboardPage.verifyLoginSuccessful();

  //part 3 - Open the User Management menu

  await UserManagementPage.openUserManagementMenu();

  //part 4 - Open the Users page

  await UserManagementPage.openUsersPage();

  //part 5 - Click Add to open the Add User form

  await UserManagementPage.clickAdd();

  //part 6 - Enter the new user details

  const newUserEmail = uniqueEmail(
    userData.newUser.emailPrefix,
    userData.newUser.emailDomain
  );

  await UserManagementPage.enterUserDetails(
    userData.newUser.firstName,
    userData.newUser.lastName,
    newUserEmail,
    requireEnv("NLD_NEW_USER_PASSWORD")
  );

  //part 7 - Select the Sales agent role

  await UserManagementPage.selectRole(userData.newUser.role);

  //part 8 - Save the new user

  await UserManagementPage.clickSave();

  //part 9 - Verify the user was created successfully

  await UserManagementPage.verifyUserCreated(
    newUserEmail,
    userData.newUser.role
  );

})
