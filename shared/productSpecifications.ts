export type SpecificationFieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'select'
  | 'multi-select'
  | 'boolean'
  | 'tags'
  | 'list'
  | 'key-value';

export type VariantDimensionKey =
  | 'color'
  | 'size'
  | 'storage'
  | 'ram'
  | 'processor'
  | 'material'
  | 'style';

export type SpecificationValue =
  | string
  | number
  | boolean
  | string[]
  | Array<{ key: string; value: string }>
  | null
  | undefined;

export type SpecificationFieldDefinition = {
  key: string;
  label: string;
  type: SpecificationFieldType;
  section: string;
  required?: boolean;
  enabled?: boolean;
  options?: string[];
  placeholder?: string;
  helpText?: string;
  unit?: string;
  min?: number;
  max?: number;
  variantDimension?: VariantDimensionKey;
};

export type SpecificationTemplate = {
  id: string;
  key: string;
  title: string;
  description: string;
  appliesTo: {
    parentSlugs?: string[];
    categorySlugs?: string[];
    subcategorySlugs?: string[];
    subcategoryNameIncludes?: string[];
  };
  sections: string[];
  variantDimensions: VariantDimensionKey[];
  highlightSuggestions: string[];
  fields: SpecificationFieldDefinition[];
};

export type DetailedSpecificationItem = {
  key: string;
  label: string;
  value: string;
  fieldType?: SpecificationFieldType;
};

export type DetailedSpecificationGroup = {
  key: string;
  title: string;
  items: DetailedSpecificationItem[];
};

function slugify(value?: string | null) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normalizeSlugList(values?: string[]) {
  return (values || []).map((value) => slugify(value)).filter(Boolean);
}

function normalizeFieldDefinition(field: SpecificationFieldDefinition): SpecificationFieldDefinition {
  return {
    enabled: true,
    required: false,
    ...field,
    section: field.section || 'General',
  };
}

function createTemplate(template: SpecificationTemplate): SpecificationTemplate {
  return {
    ...template,
    key: template.key || template.id,
    sections: template.sections || [],
    variantDimensions: template.variantDimensions || [],
    highlightSuggestions: template.highlightSuggestions || [],
    fields: (template.fields || []).map(normalizeFieldDefinition),
  };
}

const BRAND_OPTIONS = ['Apple', 'Samsung', 'Xiaomi', 'Oppo', 'Vivo', 'OnePlus', 'Dell', 'HP', 'Lenovo', 'Asus', 'Acer', 'Sony', 'LG', 'Canon', 'Nikon', 'Bose', 'JBL', 'Dyson', 'Generic'];
const CONDITION_OPTIONS = ['New', 'Open Box', 'Refurbished', 'Used - Excellent', 'Used - Good', 'Used - Fair'];
const COLOR_OPTIONS = ['Black', 'White', 'Blue', 'Silver', 'Gray', 'Gold', 'Green', 'Red', 'Pink', 'Purple', 'Titanium', 'Beige', 'Brown'];
const STORAGE_OPTIONS = ['32GB', '64GB', '128GB', '256GB', '512GB', '1TB', '2TB'];
const RAM_OPTIONS = ['2GB', '4GB', '6GB', '8GB', '12GB', '16GB', '24GB', '32GB', '64GB'];
const NETWORK_OPTIONS = ['Wi-Fi', '4G LTE', '5G', 'Wi-Fi + Cellular'];
const WARRANTY_OPTIONS = ['No Warranty', '7 Days', '30 Days', '3 Months', '6 Months', '1 Year', '2 Years'];
const YES_NO_OPTIONS = ['Yes', 'No'];

export const DEFAULT_SPECIFICATION_TEMPLATES: SpecificationTemplate[] = [
  createTemplate({
    id: 'mobiles-smartphones',
    key: 'mobiles-smartphones',
    title: 'Mobiles / Smartphones',
    description: 'Smartphone-ready specification fields for premium catalog quality and fast admin entry.',
    appliesTo: {
      parentSlugs: ['electronics'],
      subcategorySlugs: ['mobiles', 'mobile-phones', 'phones', 'smartphones', 'mobiles-tablets'],
      subcategoryNameIncludes: ['mobile', 'phone', 'smartphone', 'iphone'],
    },
    sections: ['General', 'Display', 'Performance', 'Camera', 'Battery', 'Connectivity', 'Dimensions', 'In The Box', 'Warranty'],
    variantDimensions: ['color', 'storage', 'ram'],
    highlightSuggestions: ['5G connectivity', 'AMOLED display', 'All-day battery life'],
    fields: [
      { key: 'brand', label: 'Brand', type: 'select', required: true, section: 'General', options: BRAND_OPTIONS, placeholder: 'Select brand' },
      { key: 'model', label: 'Model', type: 'text', required: true, section: 'General', placeholder: 'iPhone 15 Pro Max' },
      { key: 'series', label: 'Series', type: 'text', section: 'General', placeholder: 'Galaxy S / iPhone Pro / Redmi Note' },
      { key: 'condition', label: 'Condition', type: 'select', required: true, section: 'General', options: CONDITION_OPTIONS },
      { key: 'color', label: 'Color', type: 'select', required: true, section: 'General', options: COLOR_OPTIONS, variantDimension: 'color' },
      { key: 'storage', label: 'Storage', type: 'select', required: true, section: 'General', options: STORAGE_OPTIONS, variantDimension: 'storage' },
      { key: 'ram', label: 'RAM', type: 'select', required: true, section: 'Performance', options: RAM_OPTIONS, variantDimension: 'ram' },
      { key: 'screenSize', label: 'Screen Size', type: 'text', required: true, section: 'Display', placeholder: '6.7-inch' },
      { key: 'displayType', label: 'Display Type', type: 'select', section: 'Display', options: ['AMOLED', 'OLED', 'LCD', 'Retina', 'Super Retina XDR', 'IPS LCD'] },
      { key: 'refreshRate', label: 'Refresh Rate', type: 'select', section: 'Display', options: ['60Hz', '90Hz', '120Hz', '144Hz'] },
      { key: 'processor', label: 'Processor', type: 'text', required: true, section: 'Performance', placeholder: 'A17 Pro / Snapdragon 8 Gen 3' },
      { key: 'chipset', label: 'Chipset', type: 'text', section: 'Performance', placeholder: 'Snapdragon / Apple Silicon / MediaTek' },
      { key: 'rearCamera', label: 'Rear Camera', type: 'text', section: 'Camera', placeholder: '48MP + 12MP + 12MP' },
      { key: 'frontCamera', label: 'Front Camera', type: 'text', section: 'Camera', placeholder: '12MP' },
      { key: 'batteryCapacity', label: 'Battery Capacity', type: 'text', section: 'Battery', placeholder: '5000mAh' },
      { key: 'chargingType', label: 'Charging Type', type: 'select', section: 'Battery', options: ['USB-C', 'Lightning', 'Wireless', 'Fast Charging'] },
      { key: 'simType', label: 'SIM Type', type: 'select', section: 'Connectivity', options: ['Single SIM', 'Dual SIM', 'eSIM', 'Dual SIM + eSIM'] },
      { key: 'network', label: 'Network', type: 'select', section: 'Connectivity', options: NETWORK_OPTIONS },
      { key: 'operatingSystem', label: 'Operating System', type: 'text', section: 'Performance', placeholder: 'iOS 18 / Android 15' },
      { key: 'biometrics', label: 'Face ID / Fingerprint', type: 'multi-select', section: 'Security', options: ['Face ID', 'Fingerprint', 'In-display Fingerprint', 'Side Fingerprint', 'None'] },
      { key: 'waterResistance', label: 'Water Resistance', type: 'select', section: 'General', options: ['None', 'IP52', 'IP54', 'IP67', 'IP68'] },
      { key: 'warranty', label: 'Warranty', type: 'select', section: 'Warranty', options: WARRANTY_OPTIONS },
      { key: 'weight', label: 'Weight', type: 'text', section: 'Dimensions', placeholder: '221 g' },
      { key: 'dimensions', label: 'Dimensions', type: 'text', section: 'Dimensions', placeholder: '159.9 x 76.7 x 8.3 mm' },
      { key: 'boxContents', label: 'What’s in the Box', type: 'list', section: 'In The Box', placeholder: 'Phone, cable, documentation' },
    ],
  }),
  createTemplate({
    id: 'tablets',
    key: 'tablets',
    title: 'Tablets',
    description: 'Tablet-specific specifications for Wi-Fi, storage, display, and productivity features.',
    appliesTo: {
      parentSlugs: ['electronics'],
      subcategorySlugs: ['tablets', 'tablet', 'mobiles-tablets'],
      subcategoryNameIncludes: ['tablet', 'ipad'],
    },
    sections: ['General', 'Display', 'Performance', 'Camera', 'Battery', 'Connectivity', 'Dimensions', 'Warranty'],
    variantDimensions: ['color', 'storage', 'ram'],
    highlightSuggestions: ['Large vibrant display', 'Cellular-ready variant options', 'Stylus support'],
    fields: [
      { key: 'brand', label: 'Brand', type: 'select', required: true, section: 'General', options: BRAND_OPTIONS },
      { key: 'model', label: 'Model', type: 'text', required: true, section: 'General' },
      { key: 'storage', label: 'Storage', type: 'select', required: true, section: 'General', options: STORAGE_OPTIONS, variantDimension: 'storage' },
      { key: 'ram', label: 'RAM', type: 'select', section: 'Performance', options: RAM_OPTIONS, variantDimension: 'ram' },
      { key: 'screenSize', label: 'Screen Size', type: 'text', required: true, section: 'Display', placeholder: '11-inch' },
      { key: 'displayType', label: 'Display', type: 'select', section: 'Display', options: ['LCD', 'IPS LCD', 'OLED', 'Retina', 'Liquid Retina'] },
      { key: 'battery', label: 'Battery', type: 'text', section: 'Battery', placeholder: '8000mAh / up to 10 hours' },
      { key: 'network', label: 'Network', type: 'select', section: 'Connectivity', options: NETWORK_OPTIONS },
      { key: 'operatingSystem', label: 'OS', type: 'text', section: 'Performance', placeholder: 'iPadOS / Android' },
      { key: 'camera', label: 'Camera', type: 'text', section: 'Camera', placeholder: '12MP rear / 12MP front' },
      { key: 'color', label: 'Color', type: 'select', section: 'General', options: COLOR_OPTIONS, variantDimension: 'color' },
      { key: 'warranty', label: 'Warranty', type: 'select', section: 'Warranty', options: WARRANTY_OPTIONS },
    ],
  }),
  createTemplate({
    id: 'laptops',
    key: 'laptops',
    title: 'Laptops',
    description: 'Detailed laptop specifications with performance, display, battery, and port coverage.',
    appliesTo: {
      parentSlugs: ['electronics'],
      subcategorySlugs: ['laptops', 'notebooks', 'laptops-desktops', 'computers'],
      subcategoryNameIncludes: ['laptop', 'notebook', 'macbook'],
    },
    sections: ['General', 'Performance', 'Display', 'Battery', 'Connectivity', 'Ports', 'Dimensions', 'In The Box', 'Warranty'],
    variantDimensions: ['color', 'storage', 'ram', 'processor'],
    highlightSuggestions: ['Backlit keyboard', 'Fast SSD storage', 'Ideal for work and study'],
    fields: [
      { key: 'brand', label: 'Brand', type: 'select', required: true, section: 'General', options: BRAND_OPTIONS },
      { key: 'model', label: 'Model', type: 'text', required: true, section: 'General' },
      { key: 'series', label: 'Series', type: 'text', section: 'General', placeholder: 'ThinkPad / Inspiron / MacBook Air' },
      { key: 'condition', label: 'Condition', type: 'select', required: true, section: 'General', options: CONDITION_OPTIONS },
      { key: 'processorBrand', label: 'Processor Brand', type: 'select', required: true, section: 'Performance', options: ['Intel', 'AMD', 'Apple', 'Qualcomm'] },
      { key: 'processor', label: 'Processor Model', type: 'text', required: true, section: 'Performance', placeholder: 'Core i7-1360P / M3 / Ryzen 7', variantDimension: 'processor' },
      { key: 'generation', label: 'Generation', type: 'text', section: 'Performance', placeholder: '13th Gen / M3' },
      { key: 'ram', label: 'RAM', type: 'select', required: true, section: 'Performance', options: RAM_OPTIONS, variantDimension: 'ram' },
      { key: 'ramType', label: 'RAM Type', type: 'select', section: 'Performance', options: ['DDR4', 'DDR5', 'LPDDR4X', 'LPDDR5', 'Unified Memory'] },
      { key: 'storage', label: 'Storage', type: 'select', required: true, section: 'Performance', options: STORAGE_OPTIONS, variantDimension: 'storage' },
      { key: 'storageType', label: 'Storage Type', type: 'select', section: 'Performance', options: ['SSD', 'NVMe SSD', 'HDD', 'eMMC'] },
      { key: 'graphics', label: 'Graphics', type: 'text', section: 'Performance', placeholder: 'Intel Iris Xe / RTX 4060 / M3 GPU' },
      { key: 'graphicsMemory', label: 'Graphics Memory', type: 'text', section: 'Performance', placeholder: 'Integrated / 8GB GDDR6' },
      { key: 'screenSize', label: 'Screen Size', type: 'text', required: true, section: 'Display', placeholder: '15.6-inch' },
      { key: 'screenResolution', label: 'Screen Resolution', type: 'select', section: 'Display', options: ['HD', 'Full HD', 'QHD', '2.8K', '4K'] },
      { key: 'displayType', label: 'Display Type', type: 'select', section: 'Display', options: ['IPS', 'OLED', 'Retina', 'Mini-LED', 'TN'] },
      { key: 'refreshRate', label: 'Refresh Rate', type: 'select', section: 'Display', options: ['60Hz', '90Hz', '120Hz', '144Hz', '165Hz'] },
      { key: 'operatingSystem', label: 'Operating System', type: 'text', section: 'General', placeholder: 'Windows 11 / macOS / DOS' },
      { key: 'batteryHealth', label: 'Battery Health / Backup', type: 'text', section: 'Battery', placeholder: '92% health / up to 8 hours' },
      { key: 'keyboardLayout', label: 'Keyboard Layout', type: 'select', section: 'General', options: ['US', 'UK', 'Arabic / English', 'Other'] },
      { key: 'touchscreen', label: 'Touchscreen', type: 'boolean', section: 'Display' },
      { key: 'ports', label: 'Ports', type: 'list', section: 'Ports', placeholder: 'USB-C, USB-A, HDMI, Audio Jack' },
      { key: 'webcam', label: 'Webcam', type: 'text', section: 'Connectivity', placeholder: '720p / 1080p / 12MP Center Stage' },
      { key: 'wifi', label: 'Wi-Fi', type: 'text', section: 'Connectivity', placeholder: 'Wi-Fi 6 / Wi-Fi 6E' },
      { key: 'bluetooth', label: 'Bluetooth', type: 'text', section: 'Connectivity', placeholder: 'Bluetooth 5.3' },
      { key: 'color', label: 'Color', type: 'select', section: 'General', options: COLOR_OPTIONS, variantDimension: 'color' },
      { key: 'weight', label: 'Weight', type: 'text', section: 'Dimensions', placeholder: '1.24 kg' },
      { key: 'dimensions', label: 'Dimensions', type: 'text', section: 'Dimensions', placeholder: '304.1 x 215 x 11.3 mm' },
      { key: 'warranty', label: 'Warranty', type: 'select', section: 'Warranty', options: WARRANTY_OPTIONS },
      { key: 'boxContents', label: 'What’s in the Box', type: 'list', section: 'In The Box', placeholder: 'Laptop, charger, manuals' },
    ],
  }),
  createTemplate({
    id: 'desktops',
    key: 'desktops',
    title: 'Desktops',
    description: 'Desktop PC specifications for performance, case type, connectivity, and included accessories.',
    appliesTo: {
      parentSlugs: ['electronics'],
      subcategorySlugs: ['desktops', 'desktop-pcs', 'desktop', 'computers', 'laptops-desktops'],
      subcategoryNameIncludes: ['desktop', 'pc', 'tower'],
    },
    sections: ['General', 'Performance', 'Connectivity', 'Ports', 'In The Box', 'Warranty'],
    variantDimensions: ['storage', 'ram', 'processor'],
    highlightSuggestions: ['Ready for office workloads', 'Upgradeable memory and storage', 'Multiple connectivity ports'],
    fields: [
      { key: 'brand', label: 'Brand', type: 'select', required: true, section: 'General', options: BRAND_OPTIONS },
      { key: 'model', label: 'Model', type: 'text', required: true, section: 'General' },
      { key: 'processor', label: 'Processor', type: 'text', required: true, section: 'Performance', variantDimension: 'processor' },
      { key: 'ram', label: 'RAM', type: 'select', required: true, section: 'Performance', options: RAM_OPTIONS, variantDimension: 'ram' },
      { key: 'storage', label: 'Storage', type: 'select', required: true, section: 'Performance', options: STORAGE_OPTIONS, variantDimension: 'storage' },
      { key: 'storageType', label: 'Storage Type', type: 'select', section: 'Performance', options: ['SSD', 'NVMe SSD', 'HDD', 'Hybrid'] },
      { key: 'graphics', label: 'Graphics', type: 'text', section: 'Performance' },
      { key: 'operatingSystem', label: 'Operating System', type: 'text', section: 'General' },
      { key: 'caseType', label: 'Case Type', type: 'select', section: 'General', options: ['Mini PC', 'Tower', 'SFF', 'All-in-One'] },
      { key: 'ports', label: 'Ports', type: 'list', section: 'Ports' },
      { key: 'connectivity', label: 'Connectivity', type: 'list', section: 'Connectivity', placeholder: 'Wi-Fi 6, Bluetooth 5.2, Ethernet' },
      { key: 'includedAccessories', label: 'Included Accessories', type: 'list', section: 'In The Box', placeholder: 'Keyboard, mouse, power cable' },
      { key: 'warranty', label: 'Warranty', type: 'select', section: 'Warranty', options: WARRANTY_OPTIONS },
    ],
  }),
  createTemplate({
    id: 'accessories',
    key: 'accessories',
    title: 'Accessories',
    description: 'Compatibility-focused accessory specifications for electronics and lifestyle listings.',
    appliesTo: {
      subcategorySlugs: ['accessories', 'computer-accessories', 'mobile-accessories', 'sports-accessories', 'car-accessories'],
      subcategoryNameIncludes: ['accessor', 'case', 'cable', 'charger', 'adapter'],
    },
    sections: ['General', 'Compatibility', 'Material', 'Connectivity', 'In The Box', 'Warranty'],
    variantDimensions: ['color', 'size'],
    highlightSuggestions: ['Wide device compatibility', 'Compact everyday use', 'Premium finishing'],
    fields: [
      { key: 'brand', label: 'Brand', type: 'select', section: 'General', options: BRAND_OPTIONS, required: true },
      { key: 'type', label: 'Type', type: 'text', section: 'General', required: true, placeholder: 'Cable / Charger / Case / Mouse' },
      { key: 'compatibility', label: 'Compatibility', type: 'tags', section: 'Compatibility', required: true, placeholder: 'iPhone 15, MacBook Air, USB-C' },
      { key: 'material', label: 'Material', type: 'text', section: 'Material', placeholder: 'Silicone / Aluminum / TPU' },
      { key: 'color', label: 'Color', type: 'select', section: 'General', options: COLOR_OPTIONS, variantDimension: 'color' },
      { key: 'size', label: 'Size', type: 'text', section: 'General', variantDimension: 'size', placeholder: '1m / Medium / 45mm' },
      { key: 'connectivity', label: 'Connectivity', type: 'list', section: 'Connectivity', placeholder: 'USB-C, Bluetooth, Lightning' },
      { key: 'warranty', label: 'Warranty', type: 'select', section: 'Warranty', options: WARRANTY_OPTIONS },
      { key: 'boxContents', label: 'Box Contents', type: 'list', section: 'In The Box' },
    ],
  }),
  createTemplate({
    id: 'audio',
    key: 'audio',
    title: 'Audio',
    description: 'Audio product specs for headphones, earbuds, speakers, and microphones.',
    appliesTo: {
      parentSlugs: ['electronics'],
      subcategorySlugs: ['audio', 'headphones', 'earbuds', 'speakers', 'microphones'],
      subcategoryNameIncludes: ['audio', 'headphone', 'earbud', 'speaker', 'microphone'],
    },
    sections: ['General', 'Audio', 'Battery', 'Connectivity', 'Dimensions', 'Warranty'],
    variantDimensions: ['color'],
    highlightSuggestions: ['Rich sound signature', 'Wireless connectivity', 'Long playback time'],
    fields: [
      { key: 'brand', label: 'Brand', type: 'select', section: 'General', required: true, options: BRAND_OPTIONS },
      { key: 'model', label: 'Model', type: 'text', section: 'General', required: true },
      { key: 'type', label: 'Type', type: 'select', section: 'General', options: ['Headphones', 'Earbuds', 'Speaker', 'Microphone', 'Soundbar'], required: true },
      { key: 'connectivity', label: 'Connectivity', type: 'multi-select', section: 'Connectivity', options: ['Bluetooth', '3.5mm', 'USB-C', 'Wi-Fi', 'AUX'] },
      { key: 'noiseCancellation', label: 'Noise Cancellation', type: 'boolean', section: 'Audio' },
      { key: 'batteryLife', label: 'Battery Life', type: 'text', section: 'Battery', placeholder: 'Up to 30 hours' },
      { key: 'driverSize', label: 'Driver Size', type: 'text', section: 'Audio', placeholder: '40mm' },
      { key: 'microphone', label: 'Microphone', type: 'text', section: 'Audio', placeholder: 'Dual mic / beamforming' },
      { key: 'color', label: 'Color', type: 'select', section: 'General', options: COLOR_OPTIONS, variantDimension: 'color' },
      { key: 'weight', label: 'Weight', type: 'text', section: 'Dimensions' },
      { key: 'warranty', label: 'Warranty', type: 'select', section: 'Warranty', options: WARRANTY_OPTIONS },
    ],
  }),
  createTemplate({
    id: 'video-tv',
    key: 'video-tv',
    title: 'Video / TV',
    description: 'Displays, projectors, and TV products with visual and connectivity specs.',
    appliesTo: {
      parentSlugs: ['electronics'],
      subcategorySlugs: ['tv-video', 'tv', 'television', 'projector', 'monitors'],
      subcategoryNameIncludes: ['tv', 'television', 'projector', 'monitor', 'display'],
    },
    sections: ['General', 'Display', 'Audio', 'Connectivity', 'Dimensions', 'Warranty'],
    variantDimensions: ['size'],
    highlightSuggestions: ['4K-ready picture quality', 'Smart features', 'Multiple HDMI ports'],
    fields: [
      { key: 'brand', label: 'Brand', type: 'select', section: 'General', required: true, options: BRAND_OPTIONS },
      { key: 'model', label: 'Model', type: 'text', section: 'General', required: true },
      { key: 'screenSize', label: 'Screen Size', type: 'text', section: 'Display', required: true, variantDimension: 'size' },
      { key: 'resolution', label: 'Resolution', type: 'select', section: 'Display', options: ['HD', 'Full HD', '4K UHD', '8K'] },
      { key: 'panelType', label: 'Panel Type', type: 'select', section: 'Display', options: ['LED', 'QLED', 'OLED', 'Mini-LED', 'LCD'] },
      { key: 'refreshRate', label: 'Refresh Rate', type: 'select', section: 'Display', options: ['60Hz', '120Hz', '144Hz'] },
      { key: 'smartPlatform', label: 'Smart Platform', type: 'text', section: 'General', placeholder: 'Google TV / webOS / Tizen' },
      { key: 'audioOutput', label: 'Audio Output', type: 'text', section: 'Audio', placeholder: '20W / Dolby Atmos' },
      { key: 'ports', label: 'Ports', type: 'list', section: 'Connectivity', placeholder: 'HDMI, USB, Ethernet' },
      { key: 'wirelessConnectivity', label: 'Wireless Connectivity', type: 'multi-select', section: 'Connectivity', options: ['Wi-Fi', 'Bluetooth', 'Chromecast', 'AirPlay'] },
      { key: 'dimensions', label: 'Dimensions', type: 'text', section: 'Dimensions' },
      { key: 'weight', label: 'Weight', type: 'text', section: 'Dimensions' },
      { key: 'warranty', label: 'Warranty', type: 'select', section: 'Warranty', options: WARRANTY_OPTIONS },
    ],
  }),
  createTemplate({
    id: 'cameras',
    key: 'cameras',
    title: 'Cameras',
    description: 'Camera and photography specifications with sensor, lens, and shooting details.',
    appliesTo: {
      parentSlugs: ['electronics'],
      subcategorySlugs: ['cameras-photo', 'cameras', 'camera', 'photo'],
      subcategoryNameIncludes: ['camera', 'photo', 'lens'],
    },
    sections: ['General', 'Sensor', 'Lens', 'Video', 'Connectivity', 'In The Box', 'Warranty'],
    variantDimensions: ['color'],
    highlightSuggestions: ['High-resolution sensor', 'Interchangeable lens support', '4K video capture'],
    fields: [
      { key: 'brand', label: 'Brand', type: 'select', section: 'General', required: true, options: BRAND_OPTIONS },
      { key: 'model', label: 'Model', type: 'text', section: 'General', required: true },
      { key: 'cameraType', label: 'Camera Type', type: 'select', section: 'General', options: ['Mirrorless', 'DSLR', 'Compact', 'Action Camera', 'Instant Camera'] },
      { key: 'sensorResolution', label: 'Sensor Resolution', type: 'text', section: 'Sensor', placeholder: '24.2MP' },
      { key: 'sensorType', label: 'Sensor Type', type: 'text', section: 'Sensor', placeholder: 'Full Frame / APS-C / Micro Four Thirds' },
      { key: 'lensMount', label: 'Lens Mount', type: 'text', section: 'Lens' },
      { key: 'videoResolution', label: 'Video Resolution', type: 'select', section: 'Video', options: ['Full HD', '4K', '6K', '8K'] },
      { key: 'stabilization', label: 'Stabilization', type: 'boolean', section: 'Video' },
      { key: 'connectivity', label: 'Connectivity', type: 'multi-select', section: 'Connectivity', options: ['Wi-Fi', 'Bluetooth', 'USB-C', 'HDMI'] },
      { key: 'boxContents', label: 'Included Items', type: 'list', section: 'In The Box' },
      { key: 'warranty', label: 'Warranty', type: 'select', section: 'Warranty', options: WARRANTY_OPTIONS },
    ],
  }),
  createTemplate({
    id: 'wearables',
    key: 'wearables',
    title: 'Wearables',
    description: 'Smartwatch and wearable device specifications for fitness, connectivity, and health sensors.',
    appliesTo: {
      subcategorySlugs: ['wearables', 'smartwatch', 'smart-watch', 'fitness-band', 'watches'],
      subcategoryNameIncludes: ['wearable', 'smartwatch', 'fitness band'],
    },
    sections: ['General', 'Display', 'Health', 'Battery', 'Connectivity', 'Dimensions', 'Warranty'],
    variantDimensions: ['color', 'size'],
    highlightSuggestions: ['Health tracking sensors', 'Long battery backup', 'Bluetooth calling'],
    fields: [
      { key: 'brand', label: 'Brand', type: 'select', section: 'General', required: true, options: BRAND_OPTIONS },
      { key: 'model', label: 'Model', type: 'text', section: 'General', required: true },
      { key: 'displayType', label: 'Display Type', type: 'select', section: 'Display', options: ['AMOLED', 'OLED', 'LCD'] },
      { key: 'screenSize', label: 'Screen Size', type: 'text', section: 'Display', placeholder: '1.9-inch' },
      { key: 'healthSensors', label: 'Health Sensors', type: 'tags', section: 'Health', placeholder: 'Heart Rate, SpO2, Sleep Tracking' },
      { key: 'batteryLife', label: 'Battery Life', type: 'text', section: 'Battery', placeholder: 'Up to 14 days' },
      { key: 'network', label: 'Connectivity', type: 'multi-select', section: 'Connectivity', options: ['Bluetooth', 'GPS', 'Wi-Fi', 'LTE', 'NFC'] },
      { key: 'color', label: 'Color', type: 'select', section: 'General', options: COLOR_OPTIONS, variantDimension: 'color' },
      { key: 'size', label: 'Size', type: 'text', section: 'Dimensions', variantDimension: 'size', placeholder: '42mm / 45mm' },
      { key: 'warranty', label: 'Warranty', type: 'select', section: 'Warranty', options: WARRANTY_OPTIONS },
    ],
  }),
  createTemplate({
    id: 'home-appliances',
    key: 'home-appliances',
    title: 'Home Appliances',
    description: 'Appliance specifications focused on capacity, power, energy, and dimensions.',
    appliesTo: {
      parentSlugs: ['home-kitchen-appliances'],
      subcategorySlugs: ['home-appliances'],
      subcategoryNameIncludes: ['home appliance', 'air conditioner', 'washing machine', 'vacuum', 'cleaning'],
    },
    sections: ['General', 'Performance', 'Power', 'Dimensions', 'In The Box', 'Warranty'],
    variantDimensions: ['color', 'size'],
    highlightSuggestions: ['Energy efficient performance', 'Family-ready capacity', 'Reliable warranty support'],
    fields: [
      { key: 'brand', label: 'Brand', type: 'select', section: 'General', required: true, options: BRAND_OPTIONS },
      { key: 'model', label: 'Model', type: 'text', section: 'General', required: true },
      { key: 'capacity', label: 'Capacity', type: 'text', section: 'Performance', placeholder: '8kg / 1.5 Ton / 20L' },
      { key: 'power', label: 'Power', type: 'text', section: 'Power', placeholder: '1800W' },
      { key: 'voltage', label: 'Voltage', type: 'text', section: 'Power', placeholder: '220-240V' },
      { key: 'material', label: 'Material', type: 'text', section: 'General' },
      { key: 'dimensions', label: 'Dimensions', type: 'text', section: 'Dimensions' },
      { key: 'weight', label: 'Weight', type: 'text', section: 'Dimensions' },
      { key: 'energyRating', label: 'Energy Rating', type: 'select', section: 'Performance', options: ['A+++', 'A++', 'A+', 'A', 'B'] },
      { key: 'includedItems', label: 'Included Items', type: 'list', section: 'In The Box' },
      { key: 'warranty', label: 'Warranty', type: 'select', section: 'Warranty', options: WARRANTY_OPTIONS },
    ],
  }),
  createTemplate({
    id: 'kitchen-appliances',
    key: 'kitchen-appliances',
    title: 'Kitchen Appliances',
    description: 'Kitchen appliance specs for capacity, material, power, and included accessories.',
    appliesTo: {
      parentSlugs: ['home-kitchen-appliances'],
      subcategorySlugs: ['kitchen-appliances'],
      subcategoryNameIncludes: ['kitchen', 'blender', 'microwave', 'air fryer', 'coffee'],
    },
    sections: ['General', 'Performance', 'Power', 'Dimensions', 'In The Box', 'Warranty'],
    variantDimensions: ['color', 'size'],
    highlightSuggestions: ['Compact countertop design', 'Fast cooking performance', 'Easy everyday operation'],
    fields: [
      { key: 'brand', label: 'Brand', type: 'select', section: 'General', required: true, options: BRAND_OPTIONS },
      { key: 'model', label: 'Model', type: 'text', section: 'General', required: true },
      { key: 'capacity', label: 'Capacity', type: 'text', section: 'Performance', placeholder: '5L / 25L' },
      { key: 'power', label: 'Power', type: 'text', section: 'Power', placeholder: '1500W' },
      { key: 'voltage', label: 'Voltage', type: 'text', section: 'Power' },
      { key: 'material', label: 'Material', type: 'text', section: 'General' },
      { key: 'dimensions', label: 'Dimensions', type: 'text', section: 'Dimensions' },
      { key: 'weight', label: 'Weight', type: 'text', section: 'Dimensions' },
      { key: 'includedItems', label: 'Included Items', type: 'list', section: 'In The Box' },
      { key: 'warranty', label: 'Warranty', type: 'select', section: 'Warranty', options: WARRANTY_OPTIONS },
    ],
  }),
  createTemplate({
    id: 'fashion',
    key: 'fashion',
    title: 'Fashion',
    description: 'Structured fashion specifications with fit, pattern, material, and size variants.',
    appliesTo: {
      parentSlugs: ['fashion'],
      subcategorySlugs: ['mens', 'womens', 'kids', 'shoes', 'bags', 'watches', 'accessories'],
      subcategoryNameIncludes: ['fashion', 'shirt', 'dress', 'abaya', 'shoe', 'bag', 'watch', 'accessory'],
    },
    sections: ['General', 'Material', 'Sizing', 'Style', 'Care', 'Origin'],
    variantDimensions: ['color', 'size'],
    highlightSuggestions: ['Comfortable everyday fit', 'Premium material finish', 'Easy size selection'],
    fields: [
      { key: 'brand', label: 'Brand', type: 'select', section: 'General', required: true, options: BRAND_OPTIONS },
      { key: 'gender', label: 'Gender', type: 'select', section: 'General', options: ['Men', 'Women', 'Unisex', 'Kids'], required: true },
      { key: 'material', label: 'Material', type: 'text', section: 'Material', required: true, variantDimension: 'material' },
      { key: 'fabricType', label: 'Fabric Type', type: 'text', section: 'Material' },
      { key: 'color', label: 'Color', type: 'select', section: 'General', options: COLOR_OPTIONS, required: true, variantDimension: 'color' },
      { key: 'size', label: 'Size', type: 'text', section: 'Sizing', required: true, placeholder: 'S / M / L / 42', variantDimension: 'size' },
      { key: 'fitType', label: 'Fit Type', type: 'select', section: 'Sizing', options: ['Slim Fit', 'Regular Fit', 'Relaxed Fit', 'Oversized', 'Tailored'] },
      { key: 'pattern', label: 'Pattern', type: 'select', section: 'Style', options: ['Solid', 'Printed', 'Striped', 'Checked', 'Embroidered'] },
      { key: 'sleeveType', label: 'Sleeve Type', type: 'select', section: 'Style', options: ['Full Sleeve', 'Half Sleeve', 'Sleeveless', 'N/A'] },
      { key: 'neckType', label: 'Neck Type', type: 'select', section: 'Style', options: ['Round Neck', 'V-Neck', 'Collar', 'Boat Neck', 'N/A'] },
      { key: 'occasion', label: 'Occasion', type: 'tags', section: 'Style', placeholder: 'Casual, Office, Party' },
      { key: 'careInstructions', label: 'Care Instructions', type: 'textarea', section: 'Care', placeholder: 'Machine wash cold. Do not bleach.' },
      { key: 'countryOfOrigin', label: 'Country of Origin', type: 'text', section: 'Origin', placeholder: 'UAE / India / China' },
    ],
  }),
  createTemplate({
    id: 'beauty',
    key: 'beauty',
    title: 'Beauty',
    description: 'Beauty and personal care specifications for shades, ingredients, usage, and expiry details.',
    appliesTo: {
      parentSlugs: ['beauty-health'],
      subcategorySlugs: ['makeup', 'skincare', 'haircare', 'grooming', 'perfumes'],
      subcategoryNameIncludes: ['beauty', 'makeup', 'skincare', 'hair', 'perfume'],
    },
    sections: ['General', 'Formula', 'Usage', 'Benefits', 'Origin'],
    variantDimensions: ['color', 'size'],
    highlightSuggestions: ['Suitable for everyday use', 'Clear ingredient disclosure', 'Beauty-category ready attributes'],
    fields: [
      { key: 'brand', label: 'Brand', type: 'select', section: 'General', required: true, options: BRAND_OPTIONS },
      { key: 'productType', label: 'Product Type', type: 'text', section: 'General', required: true, placeholder: 'Foundation / Serum / Perfume' },
      { key: 'skinType', label: 'Skin Type', type: 'multi-select', section: 'Formula', options: ['All Skin Types', 'Dry', 'Oily', 'Combination', 'Sensitive'] },
      { key: 'shade', label: 'Shade / Color', type: 'text', section: 'General', variantDimension: 'color', placeholder: 'Warm Beige / Ruby Red' },
      { key: 'finish', label: 'Finish', type: 'select', section: 'Formula', options: ['Matte', 'Dewy', 'Natural', 'Satin', 'Glossy'] },
      { key: 'sizeVolume', label: 'Size / Volume', type: 'text', section: 'General', variantDimension: 'size', placeholder: '30ml / 100ml / 250g' },
      { key: 'ingredients', label: 'Ingredients', type: 'textarea', section: 'Formula', placeholder: 'List key ingredients or full INCI list' },
      { key: 'benefits', label: 'Benefits', type: 'tags', section: 'Benefits', placeholder: 'Hydrating, Long-lasting, SPF' },
      { key: 'expiryDate', label: 'Expiry Date', type: 'text', section: 'Usage', placeholder: '2027-12 / 24 months from opening' },
      { key: 'usageInstructions', label: 'Usage Instructions', type: 'textarea', section: 'Usage' },
      { key: 'countryOfOrigin', label: 'Country of Origin', type: 'text', section: 'Origin' },
    ],
  }),
  createTemplate({
    id: 'daily-use',
    key: 'daily-use',
    title: 'Daily Use',
    description: 'Daily use and grocery specifications for quantity, ingredients, and storage details.',
    appliesTo: {
      parentSlugs: ['grocery-daily-use'],
      subcategorySlugs: ['snacks', 'beverages', 'household-essentials'],
      subcategoryNameIncludes: ['daily', 'grocery', 'snack', 'beverage', 'household'],
    },
    sections: ['General', 'Packaging', 'Usage', 'Origin'],
    variantDimensions: ['size'],
    highlightSuggestions: ['Clear pack size', 'Everyday household essential', 'Fast marketplace listing workflow'],
    fields: [
      { key: 'brand', label: 'Brand', type: 'select', section: 'General', required: true, options: BRAND_OPTIONS },
      { key: 'productType', label: 'Product Type', type: 'text', section: 'General', required: true },
      { key: 'sizeVolume', label: 'Size / Volume', type: 'text', section: 'Packaging', required: true, variantDimension: 'size', placeholder: '500ml / 1kg / Pack of 6' },
      { key: 'ingredients', label: 'Ingredients / Material', type: 'textarea', section: 'General' },
      { key: 'benefits', label: 'Benefits / Use Case', type: 'tags', section: 'Usage' },
      { key: 'expiryDate', label: 'Expiry Date', type: 'text', section: 'Usage' },
      { key: 'storageInstructions', label: 'Storage Instructions', type: 'textarea', section: 'Usage' },
      { key: 'countryOfOrigin', label: 'Country of Origin', type: 'text', section: 'Origin' },
    ],
  }),
  createTemplate({
    id: 'gifts',
    key: 'gifts',
    title: 'Gifts',
    description: 'Gift and seasonal product specifications with material, occasion, and presentation details.',
    appliesTo: {
      subcategorySlugs: ['gifts', 'gift', 'toys', 'baby-products', 'kids-products'],
      subcategoryNameIncludes: ['gift', 'hamper', 'toy', 'baby'],
    },
    sections: ['General', 'Material', 'Occasion', 'Dimensions', 'In The Box', 'Origin'],
    variantDimensions: ['color', 'size'],
    highlightSuggestions: ['Gift-ready presentation', 'Occasion-based merchandising', 'Clear included items'],
    fields: [
      { key: 'brand', label: 'Brand', type: 'select', section: 'General', options: BRAND_OPTIONS },
      { key: 'productType', label: 'Product Type', type: 'text', section: 'General', required: true },
      { key: 'material', label: 'Material', type: 'text', section: 'Material' },
      { key: 'occasion', label: 'Occasion', type: 'tags', section: 'Occasion', placeholder: 'Birthday, Eid, Anniversary' },
      { key: 'ageGroup', label: 'Age Group', type: 'select', section: 'General', options: ['Kids', 'Teens', 'Adults', 'All Ages'] },
      { key: 'color', label: 'Color', type: 'select', section: 'General', options: COLOR_OPTIONS, variantDimension: 'color' },
      { key: 'size', label: 'Size', type: 'text', section: 'Dimensions', variantDimension: 'size' },
      { key: 'boxContents', label: 'Included Items', type: 'list', section: 'In The Box' },
      { key: 'countryOfOrigin', label: 'Country of Origin', type: 'text', section: 'Origin' },
    ],
  }),
  createTemplate({
    id: 'generic',
    key: 'generic',
    title: 'General Listing',
    description: 'Fallback template for future categories and products that do not match a specific schema yet.',
    appliesTo: {},
    sections: ['General', 'Attributes', 'Dimensions', 'Warranty'],
    variantDimensions: ['color', 'size'],
    highlightSuggestions: ['Clean marketplace listing', 'Useful key product details', 'Ready for future category templates'],
    fields: [
      { key: 'brand', label: 'Brand', type: 'text', section: 'General', required: true, placeholder: 'Brand name' },
      { key: 'model', label: 'Model', type: 'text', section: 'General', placeholder: 'Model or series' },
      { key: 'condition', label: 'Condition', type: 'select', section: 'General', options: CONDITION_OPTIONS },
      { key: 'material', label: 'Material', type: 'text', section: 'Attributes' },
      { key: 'color', label: 'Color', type: 'select', section: 'General', options: COLOR_OPTIONS, variantDimension: 'color' },
      { key: 'size', label: 'Size', type: 'text', section: 'Attributes', variantDimension: 'size' },
      { key: 'dimensions', label: 'Dimensions', type: 'text', section: 'Dimensions' },
      { key: 'weight', label: 'Weight', type: 'text', section: 'Dimensions' },
      { key: 'warranty', label: 'Warranty', type: 'select', section: 'Warranty', options: WARRANTY_OPTIONS },
    ],
  }),
];

export function getEnabledSpecificationFields(template: SpecificationTemplate) {
  return (template.fields || []).filter((field) => field.enabled !== false);
}

export function getTemplateFieldMap(template: SpecificationTemplate) {
  return Object.fromEntries(getEnabledSpecificationFields(template).map((field) => [field.key, field]));
}

function matchesTemplate(
  template: SpecificationTemplate,
  parentSlug?: string | null,
  categorySlug?: string | null,
  subcategorySlug?: string | null,
  subcategoryName?: string | null
) {
  const normalizedParent = slugify(parentSlug);
  const normalizedCategory = slugify(categorySlug);
  const normalizedSubcategory = slugify(subcategorySlug);
  const normalizedName = slugify(subcategoryName);

  const parentRules = normalizeSlugList(template.appliesTo.parentSlugs);
  const categoryRules = normalizeSlugList(template.appliesTo.categorySlugs);
  const subcategoryRules = normalizeSlugList(template.appliesTo.subcategorySlugs);
  const nameRules = normalizeSlugList(template.appliesTo.subcategoryNameIncludes);

  const parentMatch = !parentRules.length || parentRules.includes(normalizedParent);
  const categoryMatch = !categoryRules.length || categoryRules.includes(normalizedCategory);
  const subcategoryMatch = !subcategoryRules.length || subcategoryRules.includes(normalizedSubcategory);
  const nameMatch = !nameRules.length || nameRules.some((rule) => normalizedName.includes(rule));

  return parentMatch && categoryMatch && (subcategoryMatch || nameMatch);
}

export function getSpecificationTemplate(
  parentSlug?: string | null,
  subcategorySlug?: string | null,
  subcategoryName?: string | null,
  categorySlug?: string | null
) {
  return (
    DEFAULT_SPECIFICATION_TEMPLATES.find(
      (template) =>
        template.id !== 'generic' &&
        matchesTemplate(template, parentSlug, categorySlug || parentSlug, subcategorySlug, subcategoryName)
    ) || DEFAULT_SPECIFICATION_TEMPLATES.find((template) => template.id === 'generic')!
  );
}

function normalizeListValue(raw: unknown) {
  if (Array.isArray(raw)) {
    return raw.map((item) => String(item || '').trim()).filter(Boolean);
  }
  return String(raw || '')
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeKeyValueValue(raw: unknown) {
  if (Array.isArray(raw)) {
    return raw
      .map((item) => ({
        key: String((item as any)?.key || '').trim(),
        value: String((item as any)?.value || '').trim(),
      }))
      .filter((item) => item.key && item.value);
  }

  return String(raw || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [key, ...rest] = line.split(':');
      return {
        key: String(key || '').trim(),
        value: rest.join(':').trim(),
      };
    })
    .filter((item) => item.key && item.value);
}

export function normalizeSpecificationValue(
  field: SpecificationFieldDefinition,
  raw: unknown
): SpecificationValue {
  if (raw == null) return field.type === 'multi-select' || field.type === 'tags' || field.type === 'list' ? [] : field.type === 'key-value' ? [] : '';

  if (field.type === 'boolean') {
    if (typeof raw === 'boolean') return raw;
    const normalized = String(raw).trim().toLowerCase();
    return normalized === 'true' || normalized === 'yes';
  }

  if (field.type === 'number') {
    const normalized = String(raw).trim();
    if (!normalized) return '';
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? String(parsed) : '';
  }

  if (field.type === 'multi-select' || field.type === 'tags' || field.type === 'list') {
    return normalizeListValue(raw);
  }

  if (field.type === 'key-value') {
    return normalizeKeyValueValue(raw);
  }

  return String(raw || '').trim();
}

export function normalizeSpecificationValues(
  values: Record<string, unknown>,
  template: SpecificationTemplate
) {
  const next: Record<string, SpecificationValue> = {};
  const fieldMap = getTemplateFieldMap(template);

  Object.entries(values || {}).forEach(([key, rawValue]) => {
    const field = fieldMap[key];
    if (!field) return;

    const value = normalizeSpecificationValue(field, rawValue);
    if (Array.isArray(value)) {
      if (value.length > 0) next[key] = value;
      return;
    }

    if (typeof value === 'boolean') {
      next[key] = value;
      return;
    }

    if (String(value || '').trim()) {
      next[key] = String(value).trim();
    }
  });

  return next;
}

export function preserveMatchingSpecificationValues(
  values: Record<string, unknown>,
  nextTemplate: SpecificationTemplate
) {
  return normalizeSpecificationValues(values, nextTemplate);
}

export function humanizeSpecificationValue(value: SpecificationValue): string {
  if (Array.isArray(value)) {
    if (value.length === 0) return '';
    if (typeof value[0] === 'string') {
      return (value as string[]).map((item) => String(item || '').trim()).filter(Boolean).join(', ');
    }
    return (value as Array<{ key: string; value: string }>)
      .map((item) => `${item.key}: ${item.value}`)
      .filter(Boolean)
      .join(' | ');
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  return String(value || '').trim();
}

export function buildFlatSpecifications(
  values: Record<string, unknown>,
  template: SpecificationTemplate
) {
  const normalized = normalizeSpecificationValues(values, template);
  const rows: Record<string, string> = {};

  getEnabledSpecificationFields(template).forEach((field) => {
    const displayValue = humanizeSpecificationValue(normalized[field.key]);
    if (!displayValue) return;
    rows[field.key] = displayValue;
  });

  return rows;
}

export function buildDetailedSpecificationGroups(
  values: Record<string, unknown>,
  template: SpecificationTemplate,
  extraGroups: DetailedSpecificationGroup[] = []
) {
  const normalized = normalizeSpecificationValues(values, template);
  const groups = new Map<string, DetailedSpecificationGroup>();

  getEnabledSpecificationFields(template).forEach((field) => {
    const displayValue = humanizeSpecificationValue(normalized[field.key]);
    if (!displayValue) return;

    const groupKey = slugify(field.section || 'general');
    if (!groups.has(groupKey)) {
      groups.set(groupKey, {
        key: groupKey,
        title: field.section || 'General',
        items: [],
      });
    }

    groups.get(groupKey)!.items.push({
      key: field.key,
      label: field.label,
      value: displayValue,
      fieldType: field.type,
    });
  });

  extraGroups.forEach((group) => {
    const items = (group.items || []).filter((item) => String(item?.label || '').trim() && String(item?.value || '').trim());
    if (!items.length) return;
    const key = slugify(group.key || group.title);
    const existing = groups.get(key);
    groups.set(key, {
      key,
      title: group.title || group.key || existing?.title || 'Additional Specifications',
      items: [
        ...(existing?.items || []),
        ...items.map((item) => ({
          key: item.key || slugify(item.label),
          label: item.label,
          value: item.value,
          fieldType: item.fieldType,
        })),
      ],
    });
  });

  const orderedKeys = [
    ...template.sections.map((section) => slugify(section)),
    ...Array.from(groups.keys()).filter((key) => !template.sections.map((section) => slugify(section)).includes(key)),
  ];

  return orderedKeys
    .map((key) => groups.get(key))
    .filter((group): group is DetailedSpecificationGroup => Boolean(group && group.items.length));
}

export function getMissingRequiredSpecificationLabels(
  values: Record<string, unknown>,
  template: SpecificationTemplate
) {
  const normalized = normalizeSpecificationValues(values, template);

  return getEnabledSpecificationFields(template)
    .filter((field) => field.required)
    .filter((field) => {
      const value = normalized[field.key];
      if (Array.isArray(value)) return value.length === 0;
      if (typeof value === 'boolean') return value === false;
      return !String(value || '').trim();
    })
    .map((field) => field.label);
}

export function getTemplateVariantFields(template: SpecificationTemplate) {
  const enabledDimensions = new Set(template.variantDimensions || []);
  return getEnabledSpecificationFields(template).filter(
    (field) => field.variantDimension && enabledDimensions.has(field.variantDimension)
  );
}

export function buildSpecificationTableRows(
  values: Record<string, unknown>,
  template?: SpecificationTemplate | null
) {
  if (!template) {
    return Object.entries(values || {})
      .map(([key, rawValue]) => ({
        key,
        label: key
          .replace(/([a-z])([A-Z])/g, '$1 $2')
          .replace(/[_-]+/g, ' ')
          .replace(/\b\w/g, (character) => character.toUpperCase()),
        value: humanizeSpecificationValue(rawValue as SpecificationValue),
      }))
      .filter((row) => row.value);
  }

  return buildDetailedSpecificationGroups(values, template).flatMap((group) =>
    group.items.map((item) => ({
      key: `${group.key}:${item.key}`,
      label: item.label,
      value: item.value,
      section: group.title,
    }))
  );
}
