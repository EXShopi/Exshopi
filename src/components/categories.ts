export type SubCategoryGroup = {
  title: string;
  items: string[];
};

export type MainCategory = {
  id: string;
  name: string;
  description: string;
  groups: SubCategoryGroup[];
};

export const marketplaceCategories: MainCategory[] = [
  {
    id: "electronics-mobiles",
    name: "Electronics & Mobiles",
    description: "Phones, laptops, gadgets and accessories",
    groups: [
      {
        title: "Mobiles & Tablets",
        items: [
          "Smartphones",
          "Tablets",
          "iPads",
          "Refurbished Phones",
          "Mobile Accessories",
          "Cases",
          "Screen Protectors",
        ],
      },
      {
        title: "Laptops & Computers",
        items: [
          "MacBooks",
          "Windows Laptops",
          "Gaming PCs",
          "Monitors",
          "Printers",
          "Storage",
          "SSD / HDD",
        ],
      },
      {
        title: "Audio & Video",
        items: [
          "Headphones",
          "Earbuds (TWS)",
          "Bluetooth Speakers",
          "Home Theater",
          "Smart TVs",
        ],
      },
      {
        title: "Cameras",
        items: [
          "DSLR",
          "Mirrorless",
          "Action Cameras",
          "Drones",
          "Security Cameras",
        ],
      },
      {
        title: "Wearables",
        items: [
          "Smartwatches",
          "Fitness Trackers",
          "Apple Watch",
          "Wearable Accessories",
        ],
      },
    ],
  },
  {
    id: "fashion",
    name: "Fashion",
    description: "Men, women and kids fashion",
    groups: [
      {
        title: "Clothing",
        items: [
          "Tops",
          "Dresses",
          "Hoodies",
          "Activewear",
          "Abayas",
          "Kaftans",
          "Kurtas",
        ],
      },
      {
        title: "Footwear",
        items: [
          "Sneakers",
          "Formal Shoes",
          "Sandals",
          "Heels",
          "Sports Shoes",
        ],
      },
      {
        title: "Bags & Accessories",
        items: [
          "Handbags",
          "Backpacks",
          "Wallets",
          "Belts",
          "Sunglasses",
        ],
      },
      {
        title: "Jewelry & Watches",
        items: [
          "Luxury Watches",
          "Smartwatches",
          "Fine Jewelry",
          "Fashion Jewelry",
        ],
      },
    ],
  },
  {
    id: "home-kitchen-appliances",
    name: "Home, Kitchen & Appliances",
    description: "Furniture, decor, appliances and kitchen essentials",
    groups: [
      {
        title: "Large Appliances",
        items: [
          "Refrigerators",
          "Washing Machines",
          "Ovens",
          "Dishwashers",
          "ACs",
        ],
      },
      {
        title: "Small Appliances",
        items: [
          "Air Fryers",
          "Coffee Makers",
          "Blenders",
          "Kettles",
          "Microwaves",
        ],
      },
      {
        title: "Kitchen & Dining",
        items: [
          "Cookware Sets",
          "Storage & Organization",
          "Dinnerware",
          "Bakeware",
        ],
      },
      {
        title: "Furniture",
        items: [
          "Living Room",
          "Bedroom",
          "Office Furniture",
          "Gaming Chairs",
        ],
      },
      {
        title: "Home Decor",
        items: [
          "Lighting",
          "Rugs",
          "Bedding & Bath",
          "Fragrances",
          "Candles",
          "Diffusers",
        ],
      },
    ],
  },
  {
    id: "beauty-health-personal-care",
    name: "Beauty, Health & Personal Care",
    description: "Beauty, skincare, fragrances and wellness",
    groups: [
      {
        title: "Beauty & Makeup",
        items: [
          "Face Makeup",
          "Eye Makeup",
          "Lip Makeup",
          "Makeup Tools",
          "Brushes",
        ],
      },
      {
        title: "Skincare",
        items: [
          "Moisturizers",
          "Serums",
          "Sunscreen",
          "K-Beauty",
        ],
      },
      {
        title: "Fragrances",
        items: [
          "Luxury Perfumes",
          "Arabic Perfumes",
          "Body Mists",
          "Men’s Colognes",
        ],
      },
      {
        title: "Personal Care",
        items: [
          "Haircare",
          "Oral Care",
          "Men’s Grooming",
          "Bath & Body",
        ],
      },
      {
        title: "Health & Wellness",
        items: [
          "Vitamins & Supplements",
          "First Aid",
          "Medical Devices",
          "BP Monitors",
        ],
      },
    ],
  },
  {
    id: "baby-kids-toys",
    name: "Baby, Kids & Toys",
    description: "Baby essentials, toys and kids fashion",
    groups: [
      {
        title: "Baby Essentials",
        items: [
          "Diapers",
          "Wipes",
          "Baby Food & Formula",
          "Strollers",
          "Car Seats",
        ],
      },
      {
        title: "Toys & Games",
        items: [
          "LEGO",
          "Action Figures",
          "Dolls",
          "Board Games",
          "Outdoor Play",
          "Educational Toys",
        ],
      },
      {
        title: "Kids' Fashion",
        items: [
          "Boys Clothing",
          "Girls Clothing",
          "Infant Clothing",
          "Kids Shoes",
        ],
      },
    ],
  },
  {
    id: "sports-outdoors",
    name: "Sports & Outdoors",
    description: "Fitness, sports and outdoor gear",
    groups: [
      {
        title: "Fitness & Training",
        items: [
          "Gym Equipment",
          "Treadmills",
          "Dumbbells",
          "Yoga Mats",
        ],
      },
      {
        title: "Outdoor Adventure",
        items: [
          "Camping Gear",
          "Cycling",
          "Scooters",
          "Swimming",
        ],
      },
      {
        title: "Team Sports",
        items: [
          "Football",
          "Basketball",
          "Tennis",
          "Padel Rackets",
        ],
      },
    ],
  },
  {
    id: "grocery",
    name: "Grocery",
    description: "Fresh, pantry and household essentials",
    groups: [
      {
        title: "Fresh Food",
        items: [
          "Fruits & Vegetables",
          "Meat & Seafood",
          "Dairy & Eggs",
          "Bakery",
        ],
      },
      {
        title: "Pantry",
        items: [
          "Snacks",
          "Chocolates",
          "Beverages",
          "Canned Food",
          "Cooking Oils",
          "Rice & Pasta",
        ],
      },
      {
        title: "Household",
        items: [
          "Laundry Care",
          "Cleaning Supplies",
          "Tissues & Paper Rolls",
        ],
      },
      {
        title: "Pet Supplies",
        items: [
          "Dog Food",
          "Cat Food",
          "Pet Toys",
          "Grooming",
          "Pet Healthcare",
        ],
      },
    ],
  },
  {
    id: "tools-diy-automotive",
    name: "Tools, DIY & Automotive",
    description: "Tools, home improvement and automotive items",
    groups: [
      {
        title: "Tools",
        items: [
          "Power Tools",
          "Hand Tools",
          "Measurement",
          "Safety Gear",
        ],
      },
      {
        title: "Home Improvement",
        items: [
          "Smart Home",
          "Alexa / Google Home",
          "Electrical",
          "Plumbing",
        ],
      },
      {
        title: "Automotive",
        items: [
          "Car Accessories",
          "Tires",
          "Car Care",
          "Spare Parts",
        ],
      },
    ],
  },
];