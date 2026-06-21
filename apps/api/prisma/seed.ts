import { PrismaClient } from '@prisma/client'
import { generateSlug } from '@zepto/utils'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // ─── CATEGORIES ──────────────────────────────────────────

  const categories = await Promise.all([
    // Grocery & Kitchen
    prisma.category.upsert({ where: { slug: 'fruits-vegetables' }, update: {}, create: { name: 'Fruits & Vegetables', slug: 'fruits-vegetables', imageUrl: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=400', sortOrder: 1 } }),
    prisma.category.upsert({ where: { slug: 'dairy-bread-eggs' }, update: {}, create: { name: 'Dairy, Bread & Eggs', slug: 'dairy-bread-eggs', imageUrl: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=400', sortOrder: 2 } }),
    prisma.category.upsert({ where: { slug: 'atta-rice-dal' }, update: {}, create: { name: 'Atta, Rice, Oil & Dals', slug: 'atta-rice-dal', imageUrl: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400', sortOrder: 3 } }),
    prisma.category.upsert({ where: { slug: 'meat-fish-eggs' }, update: {}, create: { name: 'Meat, Fish & Eggs', slug: 'meat-fish-eggs', imageUrl: 'https://images.unsplash.com/photo-1603048297172-c92544798d5e?w=400', sortOrder: 4 } }),
    prisma.category.upsert({ where: { slug: 'masala-dry-fruits' }, update: {}, create: { name: 'Masala & Dry Fruits', slug: 'masala-dry-fruits', imageUrl: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400', sortOrder: 5 } }),
    prisma.category.upsert({ where: { slug: 'breakfast-sauces' }, update: {}, create: { name: 'Breakfast & Sauces', slug: 'breakfast-sauces', imageUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400', sortOrder: 6 } }),
    prisma.category.upsert({ where: { slug: 'packaged-food' }, update: {}, create: { name: 'Packaged Food', slug: 'packaged-food', imageUrl: 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=400', sortOrder: 7 } }),
    
    // Snacks & Drinks
    prisma.category.upsert({ where: { slug: 'tea-coffee' }, update: {}, create: { name: 'Tea, Coffee & More', slug: 'tea-coffee', imageUrl: 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400', sortOrder: 8 } }),
    prisma.category.upsert({ where: { slug: 'ice-creams' }, update: {}, create: { name: 'Ice Creams & More', slug: 'ice-creams', imageUrl: 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=400', sortOrder: 9 } }),
    prisma.category.upsert({ where: { slug: 'frozen-food' }, update: {}, create: { name: 'Frozen Food', slug: 'frozen-food', imageUrl: 'https://images.unsplash.com/photo-1581001479419-700684f5c225?w=400', sortOrder: 10 } }),
    prisma.category.upsert({ where: { slug: 'sweet-cravings' }, update: {}, create: { name: 'Sweet Cravings', slug: 'sweet-cravings', imageUrl: 'https://images.unsplash.com/photo-1511381939415-e1654180e428?w=400', sortOrder: 11 } }),
    prisma.category.upsert({ where: { slug: 'cold-drinks' }, update: {}, create: { name: 'Cold Drinks & Juices', slug: 'cold-drinks', imageUrl: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400', sortOrder: 12 } }),
    prisma.category.upsert({ where: { slug: 'munchies' }, update: {}, create: { name: 'Munchies', slug: 'munchies', imageUrl: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400', sortOrder: 13 } }),
    prisma.category.upsert({ where: { slug: 'biscuits-cookies' }, update: {}, create: { name: 'Biscuits & Cookies', slug: 'biscuits-cookies', imageUrl: 'https://images.unsplash.com/photo-1558961363-a0e4e2cc18bc?w=400', sortOrder: 14 } }),

    // Beauty & Personal Care
    prisma.category.upsert({ where: { slug: 'personal-care' }, update: {}, create: { name: 'Personal Care Studio', slug: 'personal-care', imageUrl: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400', sortOrder: 15 } }),
    prisma.category.upsert({ where: { slug: 'skincare' }, update: {}, create: { name: 'Skincare', slug: 'skincare', imageUrl: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400', sortOrder: 16 } }),
    prisma.category.upsert({ where: { slug: 'makeup-beauty' }, update: {}, create: { name: 'Makeup & Beauty', slug: 'makeup-beauty', imageUrl: 'https://images.unsplash.com/photo-1596462502278-27bf85033e5a?w=400', sortOrder: 17 } }),
    prisma.category.upsert({ where: { slug: 'fragrance' }, update: {}, create: { name: 'Fragrance', slug: 'fragrance', imageUrl: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=400', sortOrder: 18 } }),
    prisma.category.upsert({ where: { slug: 'bath-body' }, update: {}, create: { name: 'Bath & Body', slug: 'bath-body', imageUrl: 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=400', sortOrder: 19 } }),
    prisma.category.upsert({ where: { slug: 'haircare' }, update: {}, create: { name: 'Haircare', slug: 'haircare', imageUrl: 'https://images.unsplash.com/photo-1585652757141-8c1f9e9b9d19?w=400', sortOrder: 20 } }),
    prisma.category.upsert({ where: { slug: 'baby-care' }, update: {}, create: { name: 'Baby Care', slug: 'baby-care', imageUrl: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=400', sortOrder: 21 } }),

    // Fashion & Lifestyle
    prisma.category.upsert({ where: { slug: 'apparel' }, update: {}, create: { name: 'Apparel', slug: 'apparel', imageUrl: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=400', sortOrder: 22 } }),
    prisma.category.upsert({ where: { slug: 'jewellery' }, update: {}, create: { name: 'Jewellery', slug: 'jewellery', imageUrl: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400', sortOrder: 23 } }),
  ])

  const [fruitsVeg, dairy, snacks, personalCare, household, bakery] = categories
  console.log('✅ Categories seeded:', categories.length)

  // ─── PRODUCTS ────────────────────────────────────────────

  const productsData = [
    // Fruits & Vegetables
    {
      categoryId: fruitsVeg.id,
      name: 'Organic Bananas',
      slug: 'organic-bananas',
      description: 'Farm fresh organic bananas, rich in potassium and natural sugars',
      images: ['https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=500'],
      mrp: 60,
      price: 49,
      unit: '6 pcs',
      stock: 150,
      isFeatured: true,
      tags: ['organic', 'fruit', 'fresh'],
    },
    {
      categoryId: fruitsVeg.id,
      name: 'Fresh Tomatoes',
      slug: 'fresh-tomatoes',
      description: 'Juicy red tomatoes, perfect for salads and cooking',
      images: ['https://images.unsplash.com/photo-1546470427-e26264be0b0d?w=500'],
      mrp: 40,
      price: 29,
      unit: '500g',
      stock: 200,
      isFeatured: false,
      tags: ['vegetable', 'fresh'],
    },
    {
      categoryId: fruitsVeg.id,
      name: 'Baby Spinach',
      slug: 'baby-spinach',
      description: 'Tender baby spinach leaves, washed and ready to eat',
      images: ['https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=500'],
      mrp: 35,
      price: 29,
      unit: '200g',
      stock: 80,
      isFeatured: true,
      tags: ['leafy', 'organic', 'salad'],
    },
    {
      categoryId: fruitsVeg.id,
      name: 'Royal Gala Apples',
      slug: 'royal-gala-apples',
      description: 'Sweet and crisp Gala apples imported from Himachal Pradesh',
      images: ['https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=500'],
      mrp: 150,
      price: 119,
      unit: '4 pcs (~800g)',
      stock: 120,
      isFeatured: true,
      tags: ['fruit', 'imported', 'premium'],
    },
    {
      categoryId: fruitsVeg.id,
      name: 'Green Capsicum',
      slug: 'green-capsicum',
      description: 'Crunchy green bell peppers, great for stir-fries',
      images: ['https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=500'],
      mrp: 30,
      price: 25,
      unit: '250g',
      stock: 100,
      isFeatured: false,
      tags: ['vegetable', 'fresh'],
    },
    // Dairy & Eggs
    {
      categoryId: dairy.id,
      name: 'Amul Taaza Milk',
      slug: 'amul-taaza-milk',
      description: 'Fresh toned milk with 3% fat. Pasteurized for safety.',
      images: ['https://images.unsplash.com/photo-1550583724-b2692b85b150?w=500'],
      mrp: 28,
      price: 28,
      unit: '500ml',
      stock: 300,
      isFeatured: true,
      tags: ['milk', 'dairy', 'daily'],
    },
    {
      categoryId: dairy.id,
      name: 'Farm Fresh Eggs',
      slug: 'farm-fresh-eggs',
      description: 'Country eggs from free-range hens. Rich in protein.',
      images: ['https://images.unsplash.com/photo-1518569656558-1f25e69d2221?w=500'],
      mrp: 90,
      price: 79,
      unit: '12 pcs',
      stock: 200,
      isFeatured: true,
      tags: ['eggs', 'protein', 'daily'],
    },
    {
      categoryId: dairy.id,
      name: 'Amul Butter',
      slug: 'amul-butter',
      description: 'Pasteurized butter made from fresh cream. Perfect for bread.',
      images: ['https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=500'],
      mrp: 60,
      price: 57,
      unit: '100g',
      stock: 180,
      isFeatured: false,
      tags: ['butter', 'dairy', 'spread'],
    },
    {
      categoryId: dairy.id,
      name: 'Britannia Paneer',
      slug: 'britannia-paneer',
      description: 'Fresh cottage cheese made from pure cow milk. Soft and creamy.',
      images: ['https://images.unsplash.com/photo-1631452180539-96aca7d48617?w=500'],
      mrp: 99,
      price: 89,
      unit: '200g',
      stock: 100,
      isFeatured: true,
      tags: ['paneer', 'dairy', 'protein'],
    },
    {
      categoryId: dairy.id,
      name: 'Mother Dairy Curd',
      slug: 'mother-dairy-curd',
      description: 'Thick and creamy set curd. Made from double-toned milk.',
      images: ['https://images.unsplash.com/photo-1488477181946-6428a0291777?w=500'],
      mrp: 45,
      price: 42,
      unit: '400g',
      stock: 150,
      isFeatured: false,
      tags: ['curd', 'probiotic', 'daily'],
    },
    // Snacks & Beverages
    {
      categoryId: snacks.id,
      name: "Lay's Classic Salted",
      slug: 'lays-classic-salted',
      description: "America's favorite classic potato chips with a hint of sea salt",
      images: ['https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=500'],
      mrp: 30,
      price: 28,
      unit: '52g',
      stock: 500,
      isFeatured: true,
      tags: ['chips', 'snack', 'popular'],
    },
    {
      categoryId: snacks.id,
      name: 'Tropicana Orange Juice',
      slug: 'tropicana-orange-juice',
      description: '100% pure orange juice with no added sugar or preservatives',
      images: ['https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=500'],
      mrp: 120,
      price: 99,
      unit: '1L',
      stock: 200,
      isFeatured: true,
      tags: ['juice', 'beverage', 'vitamin-c'],
    },
    {
      categoryId: snacks.id,
      name: 'Red Bull Energy Drink',
      slug: 'red-bull-energy-drink',
      description: 'Red Bull Energy Drink gives you wings when you need them most',
      images: ['https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=500'],
      mrp: 125,
      price: 115,
      unit: '250ml',
      stock: 300,
      isFeatured: false,
      tags: ['energy', 'drink', 'caffeine'],
    },
    {
      categoryId: snacks.id,
      name: 'Bournvita',
      slug: 'bournvita',
      description: 'Cadbury Bournvita health drink with vitamins and minerals',
      images: ['https://images.unsplash.com/photo-1542640244-7e672d6cef4e?w=500'],
      mrp: 249,
      price: 219,
      unit: '500g',
      stock: 150,
      isFeatured: false,
      tags: ['health-drink', 'chocolate', 'kids'],
    },
    {
      categoryId: snacks.id,
      name: 'Maggi Noodles',
      slug: 'maggi-noodles',
      description: '2-minute noodles with the iconic Maggi Masala flavor',
      images: ['https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=500'],
      mrp: 14,
      price: 14,
      unit: '70g',
      stock: 1000,
      isFeatured: true,
      tags: ['noodles', 'instant', 'popular'],
    },
    // Personal Care
    {
      categoryId: personalCare.id,
      name: 'Dove Body Wash',
      slug: 'dove-body-wash',
      description: 'Dove moisturizing body wash with 1/4 moisturizing cream',
      images: ['https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=500'],
      mrp: 299,
      price: 249,
      unit: '250ml',
      stock: 120,
      isFeatured: false,
      tags: ['bath', 'skin-care', 'moisturizing'],
    },
    {
      categoryId: personalCare.id,
      name: 'Colgate Strong Teeth',
      slug: 'colgate-strong-teeth',
      description: 'Colgate toothpaste with calcium for stronger teeth',
      images: ['https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=500'],
      mrp: 109,
      price: 99,
      unit: '200g',
      stock: 250,
      isFeatured: false,
      tags: ['dental', 'toothpaste', 'daily'],
    },
    {
      categoryId: personalCare.id,
      name: 'Head & Shoulders Shampoo',
      slug: 'head-shoulders-shampoo',
      description: 'Anti-dandruff shampoo that gives you 100% dandruff-free hair',
      images: ['https://images.unsplash.com/photo-1585652757141-8c1f9e9b9d19?w=500'],
      mrp: 399,
      price: 349,
      unit: '340ml',
      stock: 100,
      isFeatured: true,
      tags: ['shampoo', 'anti-dandruff', 'haircare'],
    },
    // Household
    {
      categoryId: household.id,
      name: 'Vim Dishwash Liquid',
      slug: 'vim-dishwash-liquid',
      description: 'Vim dish soap with lemon that cuts through grease in one rinse',
      images: ['https://images.unsplash.com/photo-1583947581924-860bda6a26df?w=500'],
      mrp: 145,
      price: 129,
      unit: '500ml',
      stock: 200,
      isFeatured: false,
      tags: ['cleaning', 'dishwash', 'kitchen'],
    },
    {
      categoryId: household.id,
      name: 'Harpic Toilet Cleaner',
      slug: 'harpic-toilet-cleaner',
      description: 'Harpic power plus with 10x cleaning power, kills 99.9% germs',
      images: ['https://images.unsplash.com/photo-1563453392212-326f5e854473?w=500'],
      mrp: 119,
      price: 99,
      unit: '500ml',
      stock: 150,
      isFeatured: false,
      tags: ['cleaning', 'toilet', 'disinfectant'],
    },
    {
      categoryId: household.id,
      name: 'Surf Excel Detergent',
      slug: 'surf-excel-detergent',
      description: 'Surf Excel Easy Wash removes tough stains in cold water',
      images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500'],
      mrp: 149,
      price: 135,
      unit: '1kg',
      stock: 180,
      isFeatured: true,
      tags: ['laundry', 'detergent', 'cleaning'],
    },
    // Bakery & Breakfast
    {
      categoryId: bakery.id,
      name: 'Britannia Whole Wheat Bread',
      slug: 'britannia-whole-wheat-bread',
      description: 'Soft whole wheat bread enriched with vitamins. 100% whole grain.',
      images: ['https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500'],
      mrp: 45,
      price: 42,
      unit: '400g (16 slices)',
      stock: 100,
      isFeatured: false,
      tags: ['bread', 'whole-wheat', 'breakfast'],
    },
    {
      categoryId: bakery.id,
      name: 'Kelloggs Corn Flakes',
      slug: 'kelloggs-corn-flakes',
      description: "Kellogg's Corn Flakes - the original breakfast cereal since 1906",
      images: ['https://images.unsplash.com/photo-1531308604581-5dc7add70d3d?w=500'],
      mrp: 219,
      price: 189,
      unit: '575g',
      stock: 120,
      isFeatured: true,
      tags: ['cereal', 'breakfast', 'healthy'],
    },
    {
      categoryId: bakery.id,
      name: 'Quaker Oats',
      slug: 'quaker-oats',
      description: 'Heart-healthy oats with beta-glucan fibre. Quick and easy to cook.',
      images: ['https://images.unsplash.com/photo-1614961233913-a5113a4a34ed?w=500'],
      mrp: 199,
      price: 175,
      unit: '1kg',
      stock: 200,
      isFeatured: true,
      tags: ['oats', 'healthy', 'breakfast'],
    },
    {
      categoryId: bakery.id,
      name: 'Pillsbury Chakki Fresh Atta',
      slug: 'pillsbury-chakki-fresh-atta',
      description: 'Stone-ground whole wheat flour with natural goodness preserved',
      images: ['https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=500'],
      mrp: 299,
      price: 269,
      unit: '5kg',
      stock: 150,
      isFeatured: false,
      tags: ['atta', 'flour', 'staple'],
    },
    {
      categoryId: snacks.id,
      name: 'Coca Cola',
      slug: 'coca-cola',
      description: 'The original Coca-Cola - refreshing taste since 1886',
      images: ['https://images.unsplash.com/photo-1554866585-cd94860890b7?w=500'],
      mrp: 40,
      price: 38,
      unit: '750ml',
      stock: 400,
      isFeatured: true,
      tags: ['soda', 'beverage', 'cold-drink'],
    },
    {
      categoryId: fruitsVeg.id,
      name: 'Fresh Onions',
      slug: 'fresh-onions',
      description: 'Premium red onions from Nashik. Essential kitchen ingredient.',
      images: ['https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=500'],
      mrp: 35,
      price: 29,
      unit: '1kg',
      stock: 300,
      isFeatured: false,
      tags: ['vegetable', 'staple', 'kitchen'],
    },
    {
      categoryId: fruitsVeg.id,
      name: 'Alphonso Mango',
      slug: 'alphonso-mango',
      description: 'The king of mangoes from Ratnagiri. GI-tagged, premium quality.',
      images: ['https://images.unsplash.com/photo-1553279768-865429fa0078?w=500'],
      mrp: 299,
      price: 249,
      unit: '1kg (~6 pcs)',
      stock: 50,
      isFeatured: true,
      tags: ['fruit', 'seasonal', 'premium'],
    },
    {
      categoryId: dairy.id,
      name: 'Amul Cheese Slices',
      slug: 'amul-cheese-slices',
      description: 'Processed cheese slices perfect for burgers and sandwiches',
      images: ['https://images.unsplash.com/photo-1618164436241-4473940d1f5c?w=500'],
      mrp: 115,
      price: 105,
      unit: '200g (10 slices)',
      stock: 120,
      isFeatured: false,
      tags: ['cheese', 'dairy', 'processed'],
    },
    {
      categoryId: snacks.id,
      name: 'Haldirams Aloo Bhujia',
      slug: 'haldirams-aloo-bhujia',
      description: "India's most loved namkeen made with premium potatoes and spices",
      images: ['https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=500'],
      mrp: 60,
      price: 55,
      unit: '200g',
      stock: 300,
      isFeatured: true,
      tags: ['namkeen', 'snack', 'popular'],
    },
    {
      categoryId: personalCare.id,
      name: 'Dettol Handwash',
      slug: 'dettol-handwash',
      description: 'Dettol Original germ protection handwash - kills 99.9% of germs',
      images: ['https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=500'],
      mrp: 109,
      price: 89,
      unit: '250ml',
      stock: 350,
      isFeatured: false,
      tags: ['handwash', 'hygiene', 'germ-kill'],
    },
  ]

  for (const product of productsData) {
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: {},
      create: product,
    })
  }
  console.log('✅ Products seeded:', productsData.length)

  // ─── DYNAMICALLY SEED PRODUCTS FOR ANY BARE CATEGORIES ─────────────────
  const allCategories = await prisma.category.findMany()
  for (const category of allCategories) {
    const existingCount = await prisma.product.count({
      where: { categoryId: category.id }
    })
    
    if (existingCount < 3) {
      console.log(`🌱 Seeding default products for category: ${category.name}`)
      const itemsToSeed = [
        {
          name: `Premium ${category.name} Choice`,
          slug: `${category.slug}-choice`,
          description: `Top quality selected ${category.name} item. Handpicked, fresh, and premium grade.`,
          images: ['https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=500'],
          mrp: 120,
          price: 99,
          unit: '1 unit',
          tags: ['premium', 'featured', 'fresh'],
        },
        {
          name: `Standard ${category.name} Pack`,
          slug: `${category.slug}-pack`,
          description: `Value pack of standard ${category.name}. Best quality at the most affordable price.`,
          images: ['https://images.unsplash.com/photo-1542838132-92c53300491e?w=500'],
          mrp: 80,
          price: 69,
          unit: '500g',
          tags: ['value', 'fresh'],
        },
        {
          name: `Organic ${category.name} Special`,
          slug: `${category.slug}-special`,
          description: `100% organic and natural certified ${category.name}. Cultivated without synthetic pesticides.`,
          images: ['https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=500'],
          mrp: 180,
          price: 149,
          unit: '250g',
          tags: ['organic', 'premium', 'fresh'],
        }
      ]
      
      for (const item of itemsToSeed) {
        await prisma.product.upsert({
          where: { slug: item.slug },
          update: {},
          create: {
            ...item,
            categoryId: category.id,
            stock: 100
          }
        })
      }
    }
  }

  // ─── BANNERS ─────────────────────────────────────────────

  const banners = [
    {
      title: '10-Minute Delivery',
      imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800',
      deepLink: 'category/fruits-vegetables',
      sortOrder: 1,
    },
    {
      title: 'Fresh Dairy Daily',
      imageUrl: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=800',
      deepLink: 'category/dairy-eggs',
      sortOrder: 2,
    },
    {
      title: 'Snacks at Best Price',
      imageUrl: 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=800',
      deepLink: 'category/snacks-beverages',
      sortOrder: 3,
    },
  ]
  for (const banner of banners) {
    await prisma.banner.create({ data: banner }).catch(() => {})
  }
  console.log('✅ Banners seeded:', banners.length)

  // ─── COUPON ──────────────────────────────────────────────

  await prisma.coupon.upsert({
    where: { code: 'FIRST50' },
    update: {},
    create: {
      code: 'FIRST50',
      description: '₹50 off on your first order above ₹199',
      discountType: 'FLAT',
      discountValue: 50,
      minOrderValue: 199,
      maxDiscount: 50,
      usageLimit: 1000,
      isActive: true,
    },
  })
  await prisma.coupon.upsert({
    where: { code: 'SAVE10' },
    update: {},
    create: {
      code: 'SAVE10',
      description: '10% off up to ₹100 on orders above ₹299',
      discountType: 'PERCENT',
      discountValue: 10,
      minOrderValue: 299,
      maxDiscount: 100,
      usageLimit: 500,
      isActive: true,
    },
  })
  console.log('✅ Coupons seeded')

  // ─── USERS, WALLETS, ADDRESSES ───────────────────────────

  const usersToSeed = [
    {
      phone: '8409916425',
      name: 'Bhaskar Admin',
      email: 'bhaskar@zepto.com',
      role: 'ADMIN' as const,
    },
    {
      phone: '9999999999',
      name: 'Test User 0',
      email: 'test0@zepto.com',
      role: 'CUSTOMER' as const,
    },
    {
      phone: '9999999991',
      name: 'Test User 1',
      email: 'test1@zepto.com',
      role: 'CUSTOMER' as const,
    },
    {
      phone: '9999999992',
      name: 'Test User 2',
      email: 'test2@zepto.com',
      role: 'CUSTOMER' as const,
    },
    {
      phone: '9999999993',
      name: 'Test User 3',
      email: 'test3@zepto.com',
      role: 'CUSTOMER' as const,
    },
  ]

  for (const userData of usersToSeed) {
    const user = await prisma.user.upsert({
      where: { phone: userData.phone },
      update: {
        role: userData.role,
        name: userData.name,
      },
      create: {
        phone: userData.phone,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        isVerified: true,
      },
    })

    // Seed Wallet with ₹500 balance
    const wallet = await prisma.wallet.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        balance: 500,
      },
    })

    // Seed transaction if balance is new
    const txCount = await prisma.walletTransaction.count({
      where: { walletId: wallet.id }
    })
    if (txCount === 0) {
      await prisma.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: 'CREDIT',
          status: 'SUCCESS',
          amount: 500,
          balanceBefore: 0,
          balanceAfter: 500,
          description: 'Welcome bonus',
        },
      }).catch(() => {})
    }

    // Seed Default Address
    const addressCount = await prisma.address.count({
      where: { userId: user.id }
    })
    if (addressCount === 0) {
      await prisma.address.create({
        data: {
          userId: user.id,
          label: 'Home',
          type: 'HOME',
          line1: '42, MG Road',
          line2: 'Near HDFC Bank',
          city: 'Bengaluru',
          state: 'Karnataka',
          pincode: '560001',
          landmark: 'Opposite Cafe Coffee Day',
          isDefault: true,
        },
      }).catch(() => {})
    }
  }

  console.log('✅ Users, Wallets, and Addresses seeded for all 5 test accounts')

  console.log('\n🎉 Seed complete!')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('Admin phone  : 8409916425  | OTP: 123456')
  console.log('Test phone 0 : 9999999999  | OTP: 123456')
  console.log('Test phone 1 : 9999999991  | OTP: 123456')
  console.log('Test phone 2 : 9999999992  | OTP: 123456')
  console.log('Test phone 3 : 9999999993  | OTP: 123456')
  console.log('All Wallets  : ₹500 balance')
  console.log('Coupon       : FIRST50 (₹50 off on ₹199+)')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
