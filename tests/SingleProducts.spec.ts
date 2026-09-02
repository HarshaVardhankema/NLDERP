import { test } from "@playwright/test";
import { LoginManager } from "../Login/LoginManager";
import { ProductsManager } from "../Products/ProductsManager";
import { requireEnv, uniqueName } from "../utils/TestUtils";
import productData from "../test-data/productData.json";

test("TC-NLD-PRODUCT-001 - Verify administrator can create a single product with valid product details", async ({ page }) => {

  //part 1 - Initialize the flow Page Object Managers

  const loginManager = new LoginManager(page);
  const productsManager = new ProductsManager(page);

  const LoginPage = loginManager.getLoginPage();
  const DashboardPage = loginManager.getDashboardPage();
  const SingleProductPage = productsManager.getSingleProductPage();

  // --------------------------
  // Create Product Flow
  // --------------------------

  //part 2 - Login to NLD ERP as administrator

  await LoginPage.loginToNldErp(
    requireEnv("NLD_USERNAME"),
    requireEnv("NLD_PASSWORD")
  );

  await DashboardPage.verifyLoginSuccessful();

  //part 3 - Open the Products menu

  await SingleProductPage.openProductsMenu();

  //part 4 - Open the List Products page

  await SingleProductPage.openListOfProducts();

  //part 5 - Click Add to open the Add Product form

  await SingleProductPage.clickAdd();

  //part 6 - Enter the product name

  const newProductName = uniqueName(productData.newProduct.namePrefix);

  await SingleProductPage.enterProductName(newProductName);

  //part 7 - Enter the ML and CT values

  await SingleProductPage.enterMlValue(productData.newProduct.mlValue);
  await SingleProductPage.enterCtValue(productData.newProduct.ctValue);

  //part 8 - Select the ML Location Tax

  await SingleProductPage.selectMlLocationTax(productData.newProduct.mlLocationTax);

  //part 9 - Search for and select the brand

  await SingleProductPage.selectBrand(productData.newProduct.brand);

  //part 10 - Select the category

  await SingleProductPage.selectCategory(productData.newProduct.category);

  //part 11 - Upload the product image

  await SingleProductPage.uploadProductImage();

  //part 12 - Enter the Exc. tax value

  await SingleProductPage.enterExcTax(productData.newProduct.excTax);

  //part 13 - Save the product

  await SingleProductPage.saveProduct();

  //part 14 - Verify the product was created

  await SingleProductPage.verifyProductCreated(
    newProductName,
    productData.newProduct.category,
    productData.newProduct.brand,
    productData.newProduct.productType
  );

})
