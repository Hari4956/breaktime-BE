require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./model/User');
const Category = require('./model/Category');
const Product = require('./model/Product');
const connectDB = require('./config/db');

// Connect to DB
connectDB();

// Sample Users Data
const users = [
  {
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'password123',
    phone: '+1111111111',
    role: 'admin',
    addresses: [
      {
        street: '100 Admin HQ',
        city: 'Tech City',
        state: 'CA',
        zipCode: '90001',
        isDefault: true
      }
    ]
  },
  {
    name: 'Tasty Bites Restaurant',
    email: 'restaurant@example.com',
    password: 'password123',
    phone: '+2222222222',
    role: 'restaurant',
    addresses: [
      {
        street: '200 Gourmet Street',
        city: 'Foodville',
        state: 'NY',
        zipCode: '10001',
        isDefault: true
      }
    ]
  },
  {
    name: 'John Doe',
    email: 'john@example.com',
    password: 'password123',
    phone: '+3333333333',
    role: 'customer',
    addresses: [
      {
        street: '123 Main Street',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        isDefault: true
      }
    ]
  },
  {
    name: 'Sarah Connor',
    email: 'sarah@example.com',
    password: 'password123',
    phone: '+4444444444',
    role: 'customer',
    addresses: [
      {
        street: '456 Elm Street',
        city: 'Los Angeles',
        state: 'CA',
        zipCode: '90002',
        isDefault: true
      }
    ]
  },
  {
    name: 'Mike Speed',
    email: 'driver@example.com',
    password: 'password123',
    phone: '+5555555555',
    role: 'driver',
    addresses: [
      {
        street: '789 Logistics Way',
        city: 'Foodville',
        state: 'NY',
        zipCode: '10002',
        isDefault: true
      }
    ]
  }
];

// Sample Categories Data
const categories = [
  {
    name: 'Burgers',
    description: 'Juicy, freshly grilled artisanal beef and veggie burgers served with golden fries.',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop',
    status: 'active'
  },
  {
    name: 'Pizza',
    description: 'Wood-fired authentic hand-tossed pizzas topped with fresh ingredients.',
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&auto=format&fit=crop',
    status: 'active'
  },
  {
    name: 'Starters & Snacks',
    description: 'Crispy appetizers, wings, and savory small bites to start your meal.',
    image: 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=500&auto=format&fit=crop',
    status: 'active'
  },
  {
    name: 'Italian & Pasta',
    description: 'Rich creamy Alfredo, traditional Bolognese, and fresh Italian pastas.',
    image: 'https://images.unsplash.com/photo-1621996346565-e3d5d6281293?w=500&auto=format&fit=crop',
    status: 'active'
  },
  {
    name: 'Desserts',
    description: 'Decadent cakes, ice creams, and sweet indulgences.',
    image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=500&auto=format&fit=crop',
    status: 'active'
  },
  {
    name: 'Beverages & Drinks',
    description: 'Refreshing cold drinks, smoothies, fresh juices, and specialty coffees.',
    image: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=500&auto=format&fit=crop',
    status: 'active'
  }
];

// Sample Products Data template (category IDs and createdBy will be linked dynamically)
const getProducts = (categoryMap, restaurantUserId) => [
  // Burgers
  {
    name: 'Classic Cheese Burger',
    description: 'Angus beef patty with cheddar cheese, lettuce, tomato, pickles, and signature house sauce.',
    price: 12.99,
    discount: 10,
    category: categoryMap['Burgers'],
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop',
    isAvailable: true,
    isVeg: false,
    isFeatured: true,
    preparationTime: 15,
    createdBy: restaurantUserId
  },
  {
    name: 'Double Smoky Bacon Burger',
    description: 'Two juicy beef patties, crispy smoked bacon, melted Swiss cheese, and barbecue glaze.',
    price: 16.49,
    discount: 15,
    category: categoryMap['Burgers'],
    image: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=500&auto=format&fit=crop',
    isAvailable: true,
    isVeg: false,
    isFeatured: true,
    preparationTime: 20,
    createdBy: restaurantUserId
  },
  {
    name: 'Veggie Supreme Garden Burger',
    description: 'Plant-based patty with avocado, grilled onions, lettuce, and vegan garlic aioli.',
    price: 11.49,
    discount: 0,
    category: categoryMap['Burgers'],
    image: 'https://images.unsplash.com/photo-1525059696034-4967a8e1dca2?w=500&auto=format&fit=crop',
    isAvailable: true,
    isVeg: true,
    isFeatured: false,
    preparationTime: 12,
    createdBy: restaurantUserId
  },

  // Pizza
  {
    name: 'Margherita Supreme Pizza',
    description: 'Fresh Mozzarella, San Marzano tomato sauce, fresh basil leaves, and extra virgin olive oil.',
    price: 14.99,
    discount: 5,
    category: categoryMap['Pizza'],
    image: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=500&auto=format&fit=crop',
    isAvailable: true,
    isVeg: true,
    isFeatured: true,
    preparationTime: 20,
    createdBy: restaurantUserId
  },
  {
    name: 'Pepperoni Feast Pizza',
    description: 'Loaded with sliced spicy pepperoni, mozzarella, and house-made tomato sauce.',
    price: 17.99,
    discount: 10,
    category: categoryMap['Pizza'],
    image: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=500&auto=format&fit=crop',
    isAvailable: true,
    isVeg: false,
    isFeatured: true,
    preparationTime: 22,
    createdBy: restaurantUserId
  },
  {
    name: 'BBQ Chicken Ranch Pizza',
    description: 'Tender grilled chicken pieces, red onions, bacon bits, cilantro, and tangy BBQ sauce drizzle.',
    price: 18.99,
    discount: 15,
    category: categoryMap['Pizza'],
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500&auto=format&fit=crop',
    isAvailable: true,
    isVeg: false,
    isFeatured: false,
    preparationTime: 25,
    createdBy: restaurantUserId
  },

  // Starters
  {
    name: 'Buffalo Chicken Wings (8 pcs)',
    description: 'Crispy fried wings tossed in spicy buffalo sauce, served with blue cheese dip and celery.',
    price: 10.99,
    discount: 0,
    category: categoryMap['Starters & Snacks'],
    image: 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=500&auto=format&fit=crop',
    isAvailable: true,
    isVeg: false,
    isFeatured: true,
    preparationTime: 15,
    createdBy: restaurantUserId
  },
  {
    name: 'Loaded Garlic Cheese Fries',
    description: 'Golden french fries tossed in garlic butter, topped with melted mozzarella and herbs.',
    price: 7.99,
    discount: 0,
    category: categoryMap['Starters & Snacks'],
    image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=500&auto=format&fit=crop',
    isAvailable: true,
    isVeg: true,
    isFeatured: false,
    preparationTime: 10,
    createdBy: restaurantUserId
  },

  // Italian & Pasta
  {
    name: 'Creamy Fettuccine Alfredo',
    description: 'Rich Parmesan cream sauce tossed with fresh fettuccine pasta and parsley.',
    price: 15.99,
    discount: 10,
    category: categoryMap['Italian & Pasta'],
    image: 'https://images.unsplash.com/photo-1645112411341-6c4fd023714a?w=500&auto=format&fit=crop',
    isAvailable: true,
    isVeg: true,
    isFeatured: false,
    preparationTime: 18,
    createdBy: restaurantUserId
  },
  {
    name: 'Spaghetti Bolognese',
    description: 'Traditional slow-cooked Italian beef ragu over tender spaghetti pasta.',
    price: 16.99,
    discount: 12,
    category: categoryMap['Italian & Pasta'],
    image: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=500&auto=format&fit=crop',
    isAvailable: true,
    isVeg: false,
    isFeatured: true,
    preparationTime: 20,
    createdBy: restaurantUserId
  },

  // Desserts
  {
    name: 'Triple Chocolate Lava Cake',
    description: 'Warm chocolate cake with a molten chocolate center, served with vanilla ice cream.',
    price: 8.99,
    discount: 0,
    category: categoryMap['Desserts'],
    image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=500&auto=format&fit=crop',
    isAvailable: true,
    isVeg: true,
    isFeatured: true,
    preparationTime: 10,
    createdBy: restaurantUserId
  },
  {
    name: 'New York Style Cheesecake',
    description: 'Rich and creamy classic cheesecake with a graham cracker crust and strawberry glaze.',
    price: 7.99,
    discount: 5,
    category: categoryMap['Desserts'],
    image: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=500&auto=format&fit=crop',
    isAvailable: true,
    isVeg: true,
    isFeatured: false,
    preparationTime: 5,
    createdBy: restaurantUserId
  },

  // Beverages
  {
    name: 'Fresh Mango Passionfruit Smoothie',
    description: 'Blended fresh tropical mangoes, passionfruit, and natural honey.',
    price: 5.99,
    discount: 0,
    category: categoryMap['Beverages & Drinks'],
    image: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=500&auto=format&fit=crop',
    isAvailable: true,
    isVeg: true,
    isFeatured: true,
    preparationTime: 5,
    createdBy: restaurantUserId
  },
  {
    name: 'Iced Caramel Macchiato',
    description: 'Espresso combined with milk and vanilla syrup, topped with caramel drizzle over ice.',
    price: 4.99,
    discount: 0,
    category: categoryMap['Beverages & Drinks'],
    image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=500&auto=format&fit=crop',
    isAvailable: true,
    isVeg: true,
    isFeatured: false,
    preparationTime: 5,
    createdBy: restaurantUserId
  }
];

// Import Data to Database
const importData = async () => {
  try {
    console.log('Clearing existing data...');
    await User.deleteMany();
    await Category.deleteMany();
    await Product.deleteMany();

    console.log('Seeding Users (Auth data)...');
    const createdUsers = [];
    for (const userData of users) {
      const user = await User.create(userData);
      createdUsers.push(user);
    }

    const restaurantUser = createdUsers.find(u => u.role === 'restaurant') || createdUsers[0];

    console.log('Seeding Categories...');
    const createdCategories = await Category.insertMany(categories);
    
    // Map category names to their database ObjectIds
    const categoryMap = {};
    createdCategories.forEach(cat => {
      categoryMap[cat.name] = cat._id;
    });

    console.log('Seeding Products...');
    const productsData = getProducts(categoryMap, restaurantUser._id);
    
    // Save products individually to trigger pre-save hook for finalPrice calculation
    for (const prodData of productsData) {
      const product = new Product(prodData);
      await product.save();
    }

    console.log('\n========================================');
    console.log('🎉 DATA SEEDED SUCCESSFULLY!');
    console.log('========================================');
    console.log(`Users Created: ${createdUsers.length}`);
    console.log(`  - Admin: admin@example.com (pass: password123)`);
    console.log(`  - Restaurant: restaurant@example.com (pass: password123)`);
    console.log(`  - Customer: john@example.com (pass: password123)`);
    console.log(`  - Customer: sarah@example.com (pass: password123)`);
    console.log(`  - Driver: driver@example.com (pass: password123)`);
    console.log(`Categories Created: ${createdCategories.length}`);
    console.log(`Products Created: ${productsData.length}`);
    console.log('========================================\n');

    process.exit();
  } catch (error) {
    console.error('Error importing data:', error);
    process.exit(1);
  }
};

// Destroy Data from Database
const destroyData = async () => {
  try {
    await User.deleteMany();
    await Category.deleteMany();
    await Product.deleteMany();

    console.log('💥 DATA DESTROYED SUCCESSFULLY!');
    process.exit();
  } catch (error) {
    console.error('Error destroying data:', error);
    process.exit(1);
  }
};

if (process.argv[2] === '-d') {
  destroyData();
} else {
  importData();
}
