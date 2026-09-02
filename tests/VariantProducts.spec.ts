import { test } from "@playwright/test";
import { LoginManager } from "../Login/LoginManager";
import { ProductsManager } from "../Products/ProductsManager";
import { requireEnv, uniqueName } from "../utils/TestUtils";
import productData from "../test-data/productData.json";

test("TC-NLD-PRODUCT-002 - Verify administrator can create a variant product with valid product details and flavors", async ({ page }) => {

  //part 1 - Initialize the flow Page Object Managers

  const loginManager = new LoginManager(page);
  const productsManager = new ProductsManager(page);

  const LoginPage = loginManager.getLoginPage();
  const DashboardPage = loginManager.getDashboardPage();
  const VariantProductPage = productsManager.getVariantProductPage();

  // --------------------------
  // Create Variant Product Flow
  // --------------------------

  //part 2 - Login to NLD ERP as administrator

  await LoginPage.loginToNldErp(
    requireEnv("NLD_USERNAME"),
    requireEnv("NLD_PASSWORD")
  );

  await DashboardPage.verifyLoginSuccessful();

  //part 3 - Open the Products menu

  await VariantProductPage.openProductsMenu();

  //part 4 - Open the List Products page

  await VariantProductPage.openListOfProducts();

  //part 5 - Click Add to open the Add Product form

  await VariantProductPage.clickAdd();

  //part 6 - Enter the product name

  const newProductName = uniqueName(productData.variantProduct.namePrefix);

  await VariantProductPage.enterProductName(newProductName);

  //part 7 - Enter the ML and CT values

  await VariantProductPage.enterMlValue(productData.variantProduct.mlValue);
  await VariantProductPage.enterCtValue(productData.variantProduct.ctValue);

  //part 8 - Select the ML Location Tax

  await VariantProductPage.selectMlLocationTax(productData.variantProduct.mlLocationTax);

  //part 9 - Search for and select the brand

  await VariantProductPage.selectBrand(productData.variantProduct.brand);

  //part 10 - Select the category

  await VariantProductPage.selectCategory(productData.variantProduct.category);

  //part 11 - Upload the product image

  await VariantProductPage.uploadProductImage();

  //part 12 - Select the Variable product type

  await VariantProductPage.selectProductType(productData.variantProduct.productType);

  //part 13 - Open the flavor selection

  await VariantProductPage.openFlavorDropdown(productData.variantProduct.variationTemplate);

  //part 14 - Select two different flavors at random

  const selectedFlavors = await VariantProductPage.selectRandomFlavors(
    productData.variantProduct.flavorCount
  );

  //part 15 - Verify both flavors were selected

  await VariantProductPage.verifySelectedFlavors(selectedFlavors);

  //part 16 - Enter the Exc. tax value for every variation

  await VariantProductPage.enterVariationExcTax(productData.variantProduct.excTax);

  //part 17 - Save the variant product

  await VariantProductPage.saveProduct();

  //part 18 - Verify the variant product was created

  await VariantProductPage.verifyProductCreated(
    newProductName,
    productData.variantProduct.category,
    productData.variantProduct.brand,
    productData.variantProduct.productType
  );

})
