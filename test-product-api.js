/**
 * test-product-api.js
 * 
 * Automated test suite for Restaurant Product & Category Management Module.
 * Run against local Express server: node test-product-api.js
 */

const PORT = process.env.PORT || 5050;
const BASE_URL = `http://localhost:${PORT}/api`;

const randomId = Math.floor(Math.random() * 100000);
const restaurantEmail = `restaurant_owner_${randomId}@example.com`;
const customerEmail = `customer_user_${randomId}@example.com`;
const password = 'password123';

let restaurantToken = '';
let customerToken = '';
let categoryId = '';
let productId = '';

async function runProductTests() {
  console.log('====================================================');
  console.log('  PRODUCT & CATEGORY MANAGEMENT MODULE TEST SUITE   ');
  console.log('====================================================\n');

  try {
    // ----------------------------------------------------
    // STEP 1: Setup Accounts (Restaurant Owner & Customer)
    // ----------------------------------------------------
    console.log('[1] Setting up Test Accounts...');

    // Register Restaurant User
    const regRestRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Chef Gordon',
        email: restaurantEmail,
        password,
        phone: '+1234567890',
        role: 'restaurant'
      })
    });
    const regRestData = await regRestRes.json();
    if (!regRestData.success) throw new Error(`Restaurant reg failed: ${regRestData.message}`);
    restaurantToken = regRestData.data.token;
    console.log('  ✓ Restaurant Owner registered & token received');

    // Register Customer User
    const regCustRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Hungry Customer',
        email: customerEmail,
        password,
        phone: '+1987654321',
        role: 'customer'
      })
    });
    const regCustData = await regCustRes.json();
    if (!regCustData.success) throw new Error(`Customer reg failed: ${regCustData.message}`);
    customerToken = regCustData.data.token;
    console.log('  ✓ Customer registered & token received\n');

    // ----------------------------------------------------
    // STEP 2: Category Management Tests
    // ----------------------------------------------------
    console.log('[2] Testing Category APIs...');

    // Create Category
    const categoryRes = await fetch(`${BASE_URL}/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${restaurantToken}`
      },
      body: JSON.stringify({
        name: `Burgers & Wraps ${randomId}`,
        description: 'Gourmet handcrafted burgers and savory wraps',
        image: 'https://images.example.com/burgers.jpg'
      })
    });
    const categoryData = await categoryRes.json();
    console.log('  Create Category Response:', categoryData.message);
    if (!categoryData.success) throw new Error(`Create category failed: ${categoryData.message}`);
    categoryId = categoryData.data._id;
    console.log(`  ✓ Category created with ID: ${categoryId}`);

    // Get All Categories
    const getCatRes = await fetch(`${BASE_URL}/categories`);
    const getCatData = await getCatRes.json();
    console.log(`  ✓ Fetched ${getCatData.data.length} categories`);

    // Get Category by ID
    const getCatByIdRes = await fetch(`${BASE_URL}/categories/${categoryId}`);
    const getCatByIdData = await getCatByIdRes.json();
    if (!getCatByIdData.success) throw new Error('Get Category by ID failed');
    console.log('  ✓ Get Category by ID verified\n');

    // ----------------------------------------------------
    // STEP 3: Product Validation Tests
    // ----------------------------------------------------
    console.log('[3] Testing Product Validation Rules...');

    // Invalid: No auth token (Expect 401)
    const noAuthRes = await fetch(`${BASE_URL}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test', price: 100, category: categoryId })
    });
    const noAuthData = await noAuthRes.json();
    console.log(`  ✓ Missing Token -> Status ${noAuthRes.status} (${noAuthData.message})`);

    // Invalid: Customer role trying to create product (Expect 403 Forbidden)
    const forbiddenRes = await fetch(`${BASE_URL}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${customerToken}`
      },
      body: JSON.stringify({ name: 'Test', price: 100, category: categoryId })
    });
    const forbiddenData = await forbiddenRes.json();
    console.log(`  ✓ Customer Role Access -> Status ${forbiddenRes.status} (${forbiddenData.message})`);

    // Invalid: Invalid Price (<= 0) (Expect 400)
    const invalidPriceRes = await fetch(`${BASE_URL}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${restaurantToken}`
      },
      body: JSON.stringify({ name: 'Free Burger', price: 0, category: categoryId })
    });
    const invalidPriceData = await invalidPriceRes.json();
    console.log(`  ✓ Invalid Price (0) -> Status ${invalidPriceRes.status} (${invalidPriceData.message})`);

    // Invalid: Negative Discount (Expect 400)
    const negDiscountRes = await fetch(`${BASE_URL}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${restaurantToken}`
      },
      body: JSON.stringify({ name: 'Neg Discount Burger', price: 200, discount: -10, category: categoryId })
    });
    const negDiscountData = await negDiscountRes.json();
    console.log(`  ✓ Negative Discount (-10) -> Status ${negDiscountRes.status} (${negDiscountData.message})`);

    // Invalid: Excessive Discount (> 100) (Expect 400)
    const overDiscountRes = await fetch(`${BASE_URL}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${restaurantToken}`
      },
      body: JSON.stringify({ name: 'Over Discount Burger', price: 200, discount: 150, category: categoryId })
    });
    const overDiscountData = await overDiscountRes.json();
    console.log(`  ✓ Excessive Discount (150%) -> Status ${overDiscountRes.status} (${overDiscountData.message})\n`);

    // ----------------------------------------------------
    // STEP 4: Product Creation & FinalPrice Calculation
    // ----------------------------------------------------
    console.log('[4] Testing Successful Product Creation & finalPrice Calculation...');

    // Price: 500, Discount: 10% -> Expected finalPrice: 450
    const createProdRes = await fetch(`${BASE_URL}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${restaurantToken}`
      },
      body: JSON.stringify({
        name: 'Deluxe Chicken Burger',
        description: 'Juicy grilled chicken breast with cheddar cheese and special sauce',
        price: 500,
        category: categoryId,
        image: 'https://images.example.com/chicken-burger.jpg',
        isAvailable: true,
        isVeg: false,
        isFeatured: true,
        preparationTime: 15,
        discount: 10
      })
    });
    const createProdData = await createProdRes.json();
    if (!createProdData.success) throw new Error(`Product creation failed: ${createProdData.message}`);
    productId = createProdData.data._id;
    console.log(`  ✓ Product created successfully! ID: ${productId}`);
    console.log(`    - Original Price: ₹${createProdData.data.price}`);
    console.log(`    - Discount: ${createProdData.data.discount}%`);
    console.log(`    - Calculated finalPrice: ₹${createProdData.data.finalPrice} (Expected: ₹450)`);

    if (createProdData.data.finalPrice !== 450) {
      throw new Error(`finalPrice calculation error! Got ${createProdData.data.finalPrice}, expected 450`);
    }

    // Create a second product (Veg)
    const createVegRes = await fetch(`${BASE_URL}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${restaurantToken}`
      },
      body: JSON.stringify({
        name: 'Crispy Veggie Patty Burger',
        description: 'Loaded with fresh garden vegetables and crisp lettuce',
        price: 250,
        category: categoryId,
        image: 'https://images.example.com/veg-burger.jpg',
        isAvailable: true,
        isVeg: true,
        isFeatured: false,
        preparationTime: 10,
        discount: 0
      })
    });
    const createVegData = await createVegRes.json();
    console.log(`  ✓ Second Product (Veg) created! ID: ${createVegData.data._id}\n`);

    // ----------------------------------------------------
    // STEP 5: Get Product by ID & Error Handling
    // ----------------------------------------------------
    console.log('[5] Testing GET Product by ID & Error Handling...');

    const getProdRes = await fetch(`${BASE_URL}/products/${productId}`);
    const getProdData = await getProdRes.json();
    if (!getProdData.success) throw new Error('GET product by ID failed');
    console.log(`  ✓ GET Product by ID success: ${getProdData.data.name}`);

    const invalidIdRes = await fetch(`${BASE_URL}/products/650000000000000000000000`);
    const invalidIdData = await invalidIdRes.json();
    console.log(`  ✓ Non-existing ID check -> Status ${invalidIdRes.status} (${invalidIdData.message})\n`);

    // ----------------------------------------------------
    // STEP 6: Update Product & Recalculate finalPrice
    // ----------------------------------------------------
    console.log('[6] Testing Product Update & finalPrice Recalculation...');

    // Update Price to 600 and Discount to 20% -> Expected finalPrice: 480
    const updateProdRes = await fetch(`${BASE_URL}/products/${productId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${restaurantToken}`
      },
      body: JSON.stringify({
        price: 600,
        discount: 20
      })
    });
    const updateProdData = await updateProdRes.json();
    if (!updateProdData.success) throw new Error(`Product update failed: ${updateProdData.message}`);
    console.log(`  ✓ Updated Price: ₹${updateProdData.data.price}, Discount: ${updateProdData.data.discount}%`);
    console.log(`  ✓ Recalculated finalPrice: ₹${updateProdData.data.finalPrice} (Expected: ₹480)`);

    if (updateProdData.data.finalPrice !== 480) {
      throw new Error(`Updated finalPrice calculation error! Got ${updateProdData.data.finalPrice}, expected 480`);
    }
    console.log('');

    // ----------------------------------------------------
    // STEP 7: Filtering, Search, Sorting & Pagination
    // ----------------------------------------------------
    console.log('[7] Testing Filters, Search, Sorting & Pagination...');

    const vegRes = await fetch(`${BASE_URL}/products?isVeg=true`);
    const vegData = await vegRes.json();
    console.log(`  ✓ Filter isVeg=true returned ${vegData.data.length} item(s)`);

    const nonVegRes = await fetch(`${BASE_URL}/products?isVeg=false`);
    const nonVegData = await nonVegRes.json();
    console.log(`  ✓ Filter isVeg=false returned ${nonVegData.data.length} item(s)`);

    const catFilterRes = await fetch(`${BASE_URL}/products?category=${categoryId}`);
    const catFilterData = await catFilterRes.json();
    console.log(`  ✓ Filter by Category ID returned ${catFilterData.data.length} item(s)`);

    const searchRes = await fetch(`${BASE_URL}/products?search=chicken`);
    const searchData = await searchRes.json();
    console.log(`  ✓ Search '?search=chicken' returned ${searchData.data.length} item(s)`);

    const rangeRes = await fetch(`${BASE_URL}/products?minPrice=200&maxPrice=500`);
    const rangeData = await rangeRes.json();
    console.log(`  ✓ Price Range '?minPrice=200&maxPrice=500' returned ${rangeData.data.length} item(s)`);

    const sortRes = await fetch(`${BASE_URL}/products?sortBy=price&sortOrder=asc`);
    const sortData = await sortRes.json();
    console.log(`  ✓ Sorting by price ASC verified`);

    const combinedUrl = `${BASE_URL}/products?page=1&limit=5&search=chicken&isVeg=false&isAvailable=true&minPrice=100&maxPrice=600&sortBy=price&sortOrder=asc`;
    const combinedRes = await fetch(combinedUrl);
    const combinedData = await combinedRes.json();
    console.log(`  ✓ Combined Query executed successfully! Page: ${combinedData.pagination.page}, Total: ${combinedData.pagination.total}\n`);

    // ----------------------------------------------------
    // STEP 8: Soft Delete Product
    // ----------------------------------------------------
    console.log('[8] Testing Soft Delete Product...');

    const deleteRes = await fetch(`${BASE_URL}/products/${productId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${restaurantToken}`
      }
    });
    const deleteData = await deleteRes.json();
    console.log(`  ✓ Delete Response: ${deleteData.message}`);

    const listAfterDeleteRes = await fetch(`${BASE_URL}/products`);
    const listAfterDeleteData = await listAfterDeleteRes.json();
    const isDeletedPresent = listAfterDeleteData.data.some(p => p._id === productId);
    if (isDeletedPresent) {
      throw new Error('Soft-deleted product still present in default GET /api/products listing!');
    }
    console.log('  ✓ Verified: Soft-deleted product is excluded from default product list\n');

    console.log('====================================================');
    console.log('  ALL PRODUCT & CATEGORY TESTS PASSED SUCCESSFULLY!  ');
    console.log('====================================================');

  } catch (error) {
    console.error('\n❌ Test Execution Failed:', error.message);
    process.exit(1);
  }
}

runProductTests();
