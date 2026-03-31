export type ListingFieldType = 'text' | 'textarea' | 'number' | 'select';

export interface ListingFieldDefinition {
  key: string;
  label: string;
  type: ListingFieldType;
  section: 'catalog' | 'technical' | 'commercial' | 'logistics';
  required?: boolean;
  options?: string[];
  placeholder?: string;
  helpText?: string;
}

export interface ListingTemplate {
  id: string;
  title: string;
  description: string;
  backendCategoryId: string;
  badge: string;
  fields: ListingFieldDefinition[];
}

export const UAE_EMIRATES = [
  'Abu Dhabi',
  'Dubai',
  'Sharjah',
  'Ajman',
  'Umm Al Quwain',
  'Ras Al Khaimah',
  'Fujairah',
];

export const LAUNCH_LISTING_TEMPLATES: ListingTemplate[] = [
  {
    id: 'laptops',
    title: 'Laptops',
    description: 'Performance laptops, business machines, gaming rigs, and premium refurbished devices.',
    backendCategoryId: 'cat1',
    badge: 'Launch Core',
    fields: [
      { key: 'brand', label: 'Brand', type: 'select', section: 'catalog', required: true, options: ['Apple', 'Dell', 'HP', 'Lenovo', 'ASUS', 'Acer', 'MSI', 'Huawei', 'Other'] },
      { key: 'model', label: 'Model', type: 'text', section: 'catalog', required: true, placeholder: 'MacBook Pro 14, ThinkPad X1 Carbon, etc.' },
      { key: 'processor', label: 'Processor', type: 'select', section: 'technical', required: true, options: ['Intel i5', 'Intel i7', 'Intel i9', 'AMD Ryzen 5', 'AMD Ryzen 7', 'AMD Ryzen 9', 'Apple M1', 'Apple M2', 'Apple M3', 'Other'] },
      { key: 'generation', label: 'Generation', type: 'text', section: 'technical', placeholder: '13th Gen, M3 Pro, Ryzen 7840HS' },
      { key: 'ram', label: 'RAM', type: 'select', section: 'technical', required: true, options: ['8GB', '16GB', '32GB', '64GB'] },
      { key: 'storage', label: 'Storage', type: 'select', section: 'technical', required: true, options: ['256GB', '512GB', '1TB', '2TB'] },
      { key: 'storageType', label: 'Storage Type', type: 'select', section: 'technical', options: ['SSD', 'NVMe SSD', 'HDD', 'Hybrid'] },
      { key: 'graphics', label: 'Graphics', type: 'text', section: 'technical', placeholder: 'Integrated, RTX 4060, M3 GPU' },
      { key: 'screenSize', label: 'Screen Size', type: 'select', section: 'technical', options: ['13-inch', '14-inch', '15-inch', '16-inch', '17-inch'] },
      { key: 'screenResolution', label: 'Screen Resolution', type: 'select', section: 'technical', options: ['Full HD', '2K', '3K', '4K', 'Retina'] },
      { key: 'operatingSystem', label: 'Operating System', type: 'select', section: 'technical', options: ['Windows 11', 'Windows 10', 'macOS', 'Linux', 'DOS'] },
      { key: 'condition', label: 'Condition', type: 'select', section: 'commercial', required: true, options: ['New', 'Open Box', 'Like New', 'Used - Excellent', 'Used - Good'] },
      { key: 'batteryHealth', label: 'Battery Health', type: 'text', section: 'commercial', placeholder: 'Required for used devices' },
      { key: 'chargerIncluded', label: 'Charger Included', type: 'select', section: 'commercial', options: ['Yes', 'No'] },
      { key: 'boxIncluded', label: 'Box Included', type: 'select', section: 'commercial', options: ['Yes', 'No'] },
      { key: 'warranty', label: 'Warranty', type: 'select', section: 'commercial', options: ['No Warranty', '7 Days', '30 Days', '6 Months', '1 Year', '2 Years'] },
      { key: 'shippingWeight', label: 'Shipping Weight (kg)', type: 'number', section: 'logistics', placeholder: '2.4' },
      { key: 'packageSize', label: 'Package Size', type: 'text', section: 'logistics', placeholder: '35 x 25 x 6 cm' },
    ],
  },
  {
    id: 'mobiles',
    title: 'Mobiles',
    description: 'Flagship smartphones, certified used phones, and UAE-ready handset listings.',
    backendCategoryId: 'cat1',
    badge: 'High Demand',
    fields: [
      { key: 'brand', label: 'Brand', type: 'select', section: 'catalog', required: true, options: ['Apple', 'Samsung', 'Google', 'Xiaomi', 'Nothing', 'OnePlus', 'Huawei', 'Other'] },
      { key: 'model', label: 'Model', type: 'text', section: 'catalog', required: true },
      { key: 'storage', label: 'Storage', type: 'select', section: 'technical', required: true, options: ['64GB', '128GB', '256GB', '512GB', '1TB'] },
      { key: 'ram', label: 'RAM', type: 'select', section: 'technical', options: ['4GB', '6GB', '8GB', '12GB', '16GB'] },
      { key: 'color', label: 'Color', type: 'text', section: 'catalog', required: true },
      { key: 'screenSize', label: 'Screen Size', type: 'text', section: 'technical' },
      { key: 'network', label: 'Network', type: 'select', section: 'technical', options: ['4G', '5G', 'Dual SIM 5G', 'WiFi only'] },
      { key: 'batteryHealth', label: 'Battery Health', type: 'text', section: 'commercial', placeholder: 'e.g. 96%' },
      { key: 'camera', label: 'Camera Details', type: 'text', section: 'technical', placeholder: '48MP + 12MP, 4K video, etc.' },
      { key: 'simType', label: 'SIM Type', type: 'select', section: 'technical', options: ['Nano SIM', 'eSIM', 'Dual SIM', 'Nano SIM + eSIM'] },
      { key: 'condition', label: 'Condition', type: 'select', section: 'commercial', required: true, options: ['New', 'Open Box', 'Like New', 'Used - Excellent', 'Used - Good'] },
      { key: 'accessoriesIncluded', label: 'Accessories Included', type: 'text', section: 'commercial', placeholder: 'Cable, adapter, case, etc.' },
      { key: 'warranty', label: 'Warranty', type: 'select', section: 'commercial', options: ['No Warranty', '7 Days', '30 Days', '6 Months', '1 Year'] },
      { key: 'shippingWeight', label: 'Shipping Weight (kg)', type: 'number', section: 'logistics' },
      { key: 'packageSize', label: 'Package Size', type: 'text', section: 'logistics' },
    ],
  },
  {
    id: 'tablets',
    title: 'Tablets',
    description: 'Work, family, and productivity tablets with WiFi and cellular options.',
    backendCategoryId: 'cat1',
    badge: 'Fast Moving',
    fields: [
      { key: 'brand', label: 'Brand', type: 'select', section: 'catalog', required: true, options: ['Apple', 'Samsung', 'Huawei', 'Lenovo', 'Xiaomi', 'Microsoft', 'Other'] },
      { key: 'model', label: 'Model', type: 'text', section: 'catalog', required: true },
      { key: 'storage', label: 'Storage', type: 'select', section: 'technical', required: true, options: ['64GB', '128GB', '256GB', '512GB', '1TB'] },
      { key: 'ram', label: 'RAM', type: 'select', section: 'technical', options: ['4GB', '6GB', '8GB', '12GB', '16GB'] },
      { key: 'screenSize', label: 'Screen Size', type: 'text', section: 'technical', required: true },
      { key: 'connectivity', label: 'WiFi / Cellular', type: 'select', section: 'technical', options: ['WiFi', 'WiFi + Cellular', '5G Cellular'] },
      { key: 'batteryStatus', label: 'Battery Status', type: 'text', section: 'commercial' },
      { key: 'color', label: 'Color', type: 'text', section: 'catalog' },
      { key: 'accessoriesIncluded', label: 'Accessories Included', type: 'text', section: 'commercial' },
      { key: 'condition', label: 'Condition', type: 'select', section: 'commercial', required: true, options: ['New', 'Open Box', 'Like New', 'Used - Excellent', 'Used - Good'] },
      { key: 'warranty', label: 'Warranty', type: 'select', section: 'commercial', options: ['No Warranty', '30 Days', '6 Months', '1 Year'] },
      { key: 'shippingWeight', label: 'Shipping Weight (kg)', type: 'number', section: 'logistics' },
    ],
  },
  {
    id: 'accessories',
    title: 'Accessories',
    description: 'Chargers, cables, audio, gaming gear, and daily-use device accessories.',
    backendCategoryId: 'cat1',
    badge: 'Add-on Category',
    fields: [
      { key: 'accessoryType', label: 'Accessory Type', type: 'select', section: 'catalog', required: true, options: ['Charger', 'Cable', 'Earbuds', 'Headphones', 'Keyboard', 'Mouse', 'Case', 'Screen Protector', 'Power Bank', 'Other'] },
      { key: 'compatibleDevices', label: 'Compatible Devices', type: 'text', section: 'catalog', required: true },
      { key: 'brand', label: 'Brand', type: 'text', section: 'catalog' },
      { key: 'color', label: 'Color', type: 'text', section: 'catalog' },
      { key: 'material', label: 'Material', type: 'text', section: 'technical' },
      { key: 'connectivityType', label: 'Connectivity Type', type: 'select', section: 'technical', options: ['Wired', 'Bluetooth', 'USB-C', 'Lightning', 'MagSafe', '2.4GHz'] },
      { key: 'size', label: 'Size / Length', type: 'text', section: 'technical' },
      { key: 'packageContent', label: 'Package Content', type: 'textarea', section: 'commercial' },
      { key: 'warranty', label: 'Warranty', type: 'select', section: 'commercial', options: ['No Warranty', '7 Days', '30 Days', '6 Months', '1 Year'] },
      { key: 'shippingWeight', label: 'Shipping Weight (kg)', type: 'number', section: 'logistics' },
    ],
  },
  {
    id: 'beauty-makeup',
    title: 'Beauty / Makeup',
    description: 'Premium beauty, skincare, fragrance, and authentic cosmetics listings.',
    backendCategoryId: 'cat3',
    badge: 'GCC Ready',
    fields: [
      { key: 'brand', label: 'Brand', type: 'text', section: 'catalog', required: true },
      { key: 'productType', label: 'Product Type', type: 'select', section: 'catalog', required: true, options: ['Foundation', 'Lipstick', 'Skincare', 'Perfume', 'Cleanser', 'Serum', 'Palette', 'Gift Set', 'Other'] },
      { key: 'shade', label: 'Shade / Color', type: 'text', section: 'catalog' },
      { key: 'skinType', label: 'Skin Type Compatibility', type: 'text', section: 'technical' },
      { key: 'sizeVolume', label: 'Size / Volume', type: 'text', section: 'technical', required: true },
      { key: 'ingredients', label: 'Ingredients', type: 'textarea', section: 'technical' },
      { key: 'expiryDate', label: 'Expiry Date', type: 'text', section: 'commercial', placeholder: 'MM/YYYY or ISO date' },
      { key: 'usageInstruction', label: 'Usage Instruction', type: 'textarea', section: 'commercial' },
      { key: 'authenticityStatus', label: 'Authenticity Status', type: 'select', section: 'commercial', options: ['Authentic', 'Imported', 'Distributor Stock'] },
      { key: 'shippingWeight', label: 'Shipping Weight (kg)', type: 'number', section: 'logistics' },
    ],
  },
  {
    id: 'gifts-daily-use',
    title: 'Gifts / Daily Use',
    description: 'Giftables, home picks, and daily-use products for UAE-first household demand.',
    backendCategoryId: 'cat3',
    badge: 'Lifestyle',
    fields: [
      { key: 'category', label: 'Product Category', type: 'text', section: 'catalog', required: true },
      { key: 'material', label: 'Material', type: 'text', section: 'technical' },
      { key: 'dimensions', label: 'Dimensions', type: 'text', section: 'technical' },
      { key: 'color', label: 'Color', type: 'text', section: 'catalog' },
      { key: 'usage', label: 'Usage / Occasion', type: 'text', section: 'catalog' },
      { key: 'packQuantity', label: 'Pack Quantity', type: 'text', section: 'commercial' },
      { key: 'brand', label: 'Brand', type: 'text', section: 'catalog' },
      { key: 'shippingWeight', label: 'Shipping Weight (kg)', type: 'number', section: 'logistics' },
      { key: 'packageSize', label: 'Package Size', type: 'text', section: 'logistics' },
    ],
  },
  {
    id: 'electronics-used-devices',
    title: 'Electronics & Used Devices',
    description: 'Certified refurbished electronics and pre-owned devices with condition grading.',
    backendCategoryId: 'cat1',
    badge: 'Refurbished',
    fields: [
      { key: 'deviceType', label: 'Device Type', type: 'select', section: 'catalog', required: true, options: ['Laptop', 'Mobile', 'Tablet', 'Console', 'Monitor', 'Accessory', 'Other'] },
      { key: 'brand', label: 'Brand', type: 'text', section: 'catalog', required: true },
      { key: 'model', label: 'Model', type: 'text', section: 'catalog', required: true },
      { key: 'condition', label: 'Condition Grade', type: 'select', section: 'commercial', required: true, options: ['A+', 'A', 'B+', 'B', 'C'] },
      { key: 'batteryHealth', label: 'Battery Health', type: 'text', section: 'commercial' },
      { key: 'cosmeticNotes', label: 'Cosmetic Notes', type: 'textarea', section: 'commercial' },
      { key: 'functionalStatus', label: 'Functional Status', type: 'select', section: 'commercial', options: ['Fully Tested', 'Minor Defect', 'Needs Repair'] },
      { key: 'includedItems', label: 'Included Items', type: 'textarea', section: 'commercial' },
      { key: 'warranty', label: 'Warranty', type: 'select', section: 'commercial', options: ['7 Days', '30 Days', '90 Days', '6 Months', '1 Year'] },
      { key: 'shippingWeight', label: 'Shipping Weight (kg)', type: 'number', section: 'logistics' },
    ],
  },
];

export const LISTING_TEMPLATE_MAP = Object.fromEntries(
  LAUNCH_LISTING_TEMPLATES.map((template) => [template.id, template])
) as Record<string, ListingTemplate>;

export const listingSectionLabels: Record<ListingFieldDefinition['section'], string> = {
  catalog: 'Catalog Identity',
  technical: 'Technical Specifications',
  commercial: 'Commercial & Condition',
  logistics: 'Logistics',
};
