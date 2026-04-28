import React, { useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Image as ImageIcon,
  Loader2,
  Pencil,
  Sparkles,
  UploadCloud,
  X,
} from 'lucide-react';
import { adminProductBulkUploadAPI } from '../../services/api';

type BulkUploadEditableRow = {
  clientId: string;
  rowNumber: number;
  productTitle: string;
  sku: string;
  brand: string;
  model: string;
  parentCategory: string;
  category: string;
  subcategory: string;
  productType: string;
  condition: string;
  shortDescription: string;
  longDescription: string;
  productHighlights: string;
  sellerNotes: string;
  buyerNotes: string;
  regularPrice: string;
  salePrice: string;
  costPrice: string;
  discountPercentage: string;
  currency: string;
  vatStatus: string;
  shippingPrice: string;
  codAvailable: string;
  tabbyEligible: string;
  tamaraEligible: string;
  stockQuantity: string;
  lowStockAlert: string;
  availability: string;
  warehouseLocation: string;
  barcode: string;
  serialNumber: string;
  productStatus: string;
  visibilityStatus: string;
  approvalStatus: string;
  mainImageUrl: string;
  galleryImageUrls: string[];
  thumbnailUrl: string;
  imageAltText: string;
  color: string;
  storage: string;
  ram: string;
  size: string;
  capacity: string;
  material: string;
  connectivity: string;
  compatibility: string;
  processor: string;
  screenSize: string;
  graphics: string;
  operatingSystem: string;
  batteryHealth: string;
  camera: string;
  refreshRate: string;
  chipset: string;
  network: string;
  simType: string;
  warranty: string;
  boxContents: string;
  dimensions: string;
  weight: string;
  seoTitle: string;
  seoDescription: string;
  seoSlug: string;
  metaKeywords: string;
  breadcrumbCategoryData: string;
  sellerName: string;
  sellerId: string;
  sellerType: string;
  exshopiOfficial: string;
  vendorCommission: string;
  adminApprovalRequired: string;
  sellerStoreVisibility: string;
  deliveryCountry: string;
  uaeDeliveryAvailable: string;
  saudiDeliveryAvailable: string;
  gccDeliveryAvailable: string;
  shippingTime: string;
  warrantyPolicy: string;
  returnPolicy: string;
  codFee: string;
  featuredProduct: string;
  bestSeller: string;
  mostPopular: string;
  eidOffer: string;
  blackFridaySection: string;
  dealTimer: string;
  flashSalePrice: string;
  homepageSectionVisibility: string;
};

type PreviewRow = {
  clientId: string;
  rowNumber: number;
  fields: BulkUploadEditableRow;
  resolved: {
    sellerName: string;
    sellerId: string;
    parentCategoryName: string;
    parentCategorySlug: string;
    subcategoryName: string;
    subcategorySlug: string;
    seoSlug: string;
    status: string;
  };
  errors: string[];
  warnings: string[];
  canImport: boolean;
  approved?: boolean;
  skipped?: boolean;
};

type ImportResult = {
  clientId: string;
  title: string;
  success: boolean;
  id?: string;
  error?: string;
};

const TEMPLATE_HEADERS = [
  'product_title',
  'sku',
  'brand',
  'model',
  'parent_category',
  'category',
  'subcategory',
  'product_type',
  'condition',
  'short_description',
  'long_description',
  'product_highlights',
  'seller_notes',
  'buyer_notes',
  'regular_price',
  'sale_price',
  'cost_price',
  'discount_percentage',
  'currency',
  'vat_status',
  'shipping_price',
  'cod_available',
  'tabby_eligible',
  'tamara_eligible',
  'stock_quantity',
  'low_stock_alert',
  'availability',
  'warehouse_location',
  'barcode',
  'serial_number',
  'product_status',
  'visibility_status',
  'approval_status',
  'seller_name',
  'seller_id',
  'seller_type',
  'exshopi_official',
  'vendor_commission',
  'admin_approval_required',
  'seller_store_visibility',
  'main_image_url',
  'image_url_1',
  'image_url_2',
  'image_url_3',
  'image_url_4',
  'image_url_5',
  'image_url_6',
  'image_url_7',
  'thumbnail_image',
  'image_alt_text',
  'color',
  'storage',
  'ram',
  'size',
  'capacity',
  'material',
  'connectivity',
  'compatibility',
  'processor',
  'screen_size',
  'graphics',
  'operating_system',
  'battery_health',
  'camera',
  'refresh_rate',
  'chipset',
  'network',
  'sim_type',
  'warranty',
  'box_contents',
  'dimensions',
  'weight',
  'seo_slug',
  'seo_title',
  'seo_description',
  'meta_keywords',
  'breadcrumb_category_data',
  'delivery_country',
  'uae_delivery_available',
  'saudi_delivery_available',
  'gcc_delivery_available',
  'shipping_time',
  'warranty_policy',
  'return_policy',
  'cod_fee',
  'featured_product',
  'best_seller',
  'most_popular',
  'eid_offer',
  'black_friday_section',
  'deal_timer',
  'flash_sale_price',
  'homepage_section_visibility',
];

const TEMPLATE_SAMPLE_ROWS: Array<Record<string, string>> = [
  {
    product_title: 'Apple MacBook Pro 13-inch (2020) M1 8GB 256GB Silver',
    sku: 'MBP13-M1-8-256-SLV',
    brand: 'Apple',
    model: 'MacBook Pro 13-inch (2020) M1',
    parent_category: 'Electronics',
    category: 'Computers',
    subcategory: 'Laptops',
    product_type: 'Laptop',
    condition: 'Renewed',
    short_description: 'Apple M1 MacBook Pro with 8GB RAM and 256GB SSD.',
    long_description: 'Premium Apple laptop ideal for students, professionals, and creators who want excellent battery life and smooth everyday performance.',
    product_highlights: 'Apple M1 chip | 8GB unified memory | 256GB SSD | Retina display',
    regular_price: '3299',
    sale_price: '3099',
    stock_quantity: '12',
    seller_name: 'ExShopi Official',
    seller_type: 'ExShopi Official',
    exshopi_official: 'yes',
    main_image_url: 'https://images.unsplash.com/photo-1517336714739-489689fd1ca8?auto=format&fit=crop&w=1200&q=80',
    image_url_1: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=1200&q=80',
    color: 'Silver',
    storage: '256GB SSD',
    ram: '8GB',
    processor: 'Apple M1',
    screen_size: '13.3-inch',
    operating_system: 'macOS',
    seo_slug: 'apple-macbook-pro-13-inch-2020-m1-8gb-256gb-silver',
    seo_title: 'MacBook Pro 13-inch M1 Silver UAE',
    seo_description: 'Buy MacBook Pro 13-inch M1 in UAE with premium performance and fast delivery.',
    delivery_country: 'AE',
    uae_delivery_available: 'yes',
    saudi_delivery_available: 'yes',
    approval_status: 'approved',
    visibility_status: 'live',
  },
  {
    product_title: 'Samsung Galaxy S24 Ultra 256GB Titanium Gray',
    sku: 'SGS24U-256-TG',
    brand: 'Samsung',
    model: 'Galaxy S24 Ultra',
    parent_category: 'Electronics',
    category: 'Mobiles',
    subcategory: 'Smartphones',
    product_type: 'Smartphone',
    condition: 'New',
    short_description: 'Samsung flagship smartphone with premium titanium finish.',
    long_description: 'High-end Samsung smartphone with advanced camera system, vivid display, and fast performance built for UAE and Saudi buyers.',
    product_highlights: 'Titanium Gray | 256GB storage | Premium camera | 5G',
    regular_price: '4899',
    stock_quantity: '20',
    seller_name: 'ExShopi Official',
    seller_type: 'ExShopi Official',
    exshopi_official: 'yes',
    main_image_url: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?auto=format&fit=crop&w=1200&q=80',
    color: 'Titanium Gray',
    storage: '256GB',
    camera: '200MP',
    network: '5G',
    operating_system: 'Android',
    seo_slug: 'samsung-galaxy-s24-ultra-256gb-titanium-gray',
    seo_title: 'Samsung Galaxy S24 Ultra 256GB UAE',
    seo_description: 'Shop Samsung Galaxy S24 Ultra 256GB in UAE with premium delivery and trusted listing details.',
    delivery_country: 'AE',
    uae_delivery_available: 'yes',
    saudi_delivery_available: 'yes',
    approval_status: 'approved',
    visibility_status: 'live',
  },
  {
    product_title: 'Apple iPhone 15 Pro 128GB Natural Titanium',
    sku: 'IP15P-128-NT',
    brand: 'Apple',
    model: 'iPhone 15 Pro',
    parent_category: 'Electronics',
    category: 'Mobiles',
    subcategory: 'Smartphones',
    product_type: 'Smartphone',
    condition: 'New',
    short_description: 'Premium iPhone with titanium design and advanced camera system.',
    long_description: 'Apple iPhone 15 Pro with strong performance, refined titanium build, and professional camera features for premium buyers.',
    product_highlights: 'Natural Titanium | 128GB | Pro camera | 5G',
    regular_price: '4299',
    stock_quantity: '18',
    seller_name: 'ExShopi Official',
    seller_type: 'ExShopi Official',
    exshopi_official: 'yes',
    main_image_url: 'https://images.unsplash.com/photo-1696446702331-4adc4b24ca13?auto=format&fit=crop&w=1200&q=80',
    color: 'Natural Titanium',
    storage: '128GB',
    network: '5G',
    operating_system: 'iOS',
    seo_slug: 'apple-iphone-15-pro-128gb-natural-titanium',
    seo_title: 'iPhone 15 Pro 128GB UAE',
    seo_description: 'Buy iPhone 15 Pro 128GB in UAE with trusted premium listing details and fast delivery.',
    delivery_country: 'AE',
    uae_delivery_available: 'yes',
    saudi_delivery_available: 'yes',
    approval_status: 'approved',
    visibility_status: 'live',
  },
  {
    product_title: 'USB-C 100W Charging Cable 2m Laptop Accessory',
    sku: 'USBC-100W-2M',
    brand: 'Generic',
    model: 'USB-C 100W Cable',
    parent_category: 'Electronics',
    category: 'Accessories',
    subcategory: 'Computer Accessories',
    product_type: 'Accessory',
    condition: 'New',
    short_description: 'USB-C charging cable for laptops, tablets, and phones.',
    long_description: 'Reliable USB-C accessory suitable for laptops, tablets, and mobile devices with high-speed charging support.',
    product_highlights: '100W charging | 2 meters | USB-C to USB-C | Durable build',
    regular_price: '79',
    stock_quantity: '100',
    seller_name: 'ExShopi Official',
    seller_type: 'ExShopi Official',
    exshopi_official: 'yes',
    main_image_url: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=1200&q=80',
    color: 'Black',
    compatibility: 'Laptops, Tablets, Smartphones',
    connectivity: 'USB-C',
    material: 'Braided Cable',
    seo_slug: 'usb-c-100w-charging-cable-2m',
    seo_title: 'USB-C 100W Charging Cable UAE',
    seo_description: 'Shop USB-C 100W charging cable in UAE for laptops, tablets, and smartphones.',
    delivery_country: 'AE',
    uae_delivery_available: 'yes',
    saudi_delivery_available: 'yes',
    approval_status: 'approved',
    visibility_status: 'live',
  },
];

function csvEscape(value: unknown) {
  const content = String(value ?? '');
  return /[",\n]/.test(content) ? `"${content.replace(/"/g, '""')}"` : content;
}

function createTemplateCsv() {
  const lines = [
    TEMPLATE_HEADERS.join(','),
    ...TEMPLATE_SAMPLE_ROWS.map((row) => TEMPLATE_HEADERS.map((header) => csvEscape(row[header] || '')).join(',')),
  ];
  return `${lines.join('\n')}\n`;
}

function downloadBlob(fileName: string, content: BlobPart, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

function fileToBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      resolve(result.includes(',') ? result.split(',')[1] || '' : result);
    };
    reader.onerror = () => reject(reader.error || new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

function buildErrorReportCsv(rows: PreviewRow[]) {
  const headers = ['row_number', 'title', 'sku', 'errors', 'warnings'];
  const lines = [
    headers.join(','),
    ...rows.map((row) =>
      [
        row.rowNumber,
        csvEscape(row.fields.productTitle),
        csvEscape(row.fields.sku),
        csvEscape(row.errors.join(' | ')),
        csvEscape(row.warnings.join(' | ')),
      ].join(',')
    ),
  ];
  return `${lines.join('\n')}\n`;
}

type Props = {
  onImported?: () => void;
  mode?: 'admin' | 'seller';
};

export default function BulkProductUploadModal({ onImported, mode = 'admin' }: Props) {
  const [open, setOpen] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [previewRows, setPreviewRows] = useState<PreviewRow[]>([]);
  const [summary, setSummary] = useState<{ total: number; valid: number; invalid: number; warnings: number } | null>(null);
  const [error, setError] = useState('');
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
  const [importResults, setImportResults] = useState<ImportResult[]>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const editingRow = useMemo(
    () => previewRows.find((row) => row.clientId === editingRowId) || null,
    [editingRowId, previewRows]
  );

  const previewStats = useMemo(() => {
    const approvedRows = previewRows.filter((row) => row.approved !== false && !row.skipped);
    return {
      approved: approvedRows.length,
      ready: approvedRows.filter((row) => row.canImport).length,
      skipped: previewRows.filter((row) => row.skipped).length,
      invalid: previewRows.filter((row) => !row.canImport).length,
    };
  }, [previewRows]);

  const handleTemplateDownload = () => {
    downloadBlob('exshopi-full-product-template.csv', createTemplateCsv(), 'text/csv;charset=utf-8;');
  };

  const openFilePicker = () => inputRef.current?.click();

  const resetState = () => {
    setSelectedFile(null);
    setPreviewRows([]);
    setSummary(null);
    setError('');
    setEditingRowId(null);
    setImporting(false);
    setImportProgress({ current: 0, total: 0 });
    setImportResults([]);
  };

  const handleClose = () => {
    setOpen(false);
    resetState();
  };

  const handleFileChosen = async (file: File | null) => {
    if (!file) return;
    setSelectedFile(file);
    setLoadingPreview(true);
    setError('');
    setImportResults([]);
    try {
      const fileDataBase64 = await fileToBase64(file);
      const preview = await adminProductBulkUploadAPI.preview({
        fileName: file.name,
        fileDataBase64,
        mode,
      });
      const nextRows = (preview.rows || []).map((row: PreviewRow) => ({
        ...row,
        approved: row.canImport,
        skipped: false,
      }));
      setPreviewRows(nextRows);
      setSummary(preview.summary || null);
    } catch (previewError) {
      setError(previewError instanceof Error ? previewError.message : 'Failed to preview file');
      setPreviewRows([]);
      setSummary(null);
    } finally {
      setLoadingPreview(false);
    }
  };

  const updateRow = (clientId: string, updater: (row: PreviewRow) => PreviewRow) => {
    setPreviewRows((current) => current.map((row) => (row.clientId === clientId ? updater(row) : row)));
  };

  const handleImport = async () => {
    const candidates = previewRows.filter((row) => row.approved !== false && !row.skipped && row.canImport);
    if (!candidates.length) {
      setError('There are no valid approved rows ready to import.');
      return;
    }

    setImporting(true);
    setImportResults([]);
    setImportProgress({ current: 0, total: candidates.length });
    setError('');

    const chunkSize = 25;
    const results: ImportResult[] = [];

    try {
      for (let index = 0; index < candidates.length; index += chunkSize) {
        const chunk = candidates.slice(index, index + chunkSize);
        const response = await adminProductBulkUploadAPI.importRows({
          mode,
          rows: chunk.map((row) => ({ clientId: row.clientId, fields: row.fields })),
        });
        results.push(...(response.results || []));
        setImportResults([...results]);
        setImportProgress({ current: Math.min(index + chunk.length, candidates.length), total: candidates.length });
      }

      if (results.some((item) => item.success) && onImported) {
        onImported();
      }
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : 'Bulk import failed');
    } finally {
      setImporting(false);
    }
  };

  const downloadErrorReport = () => {
    downloadBlob(
      'exshopi-bulk-upload-errors.csv',
      buildErrorReportCsv(previewRows.filter((row) => row.errors.length || row.warnings.length)),
      'text/csv;charset=utf-8;'
    );
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-slate-700 transition hover:border-blue-500 hover:text-blue-600"
      >
        Bulk Upload Products
      </button>

      {open ? (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-7xl overflow-hidden rounded-[2rem] border border-white/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(247,250,255,0.97))] shadow-[0_40px_100px_rgba(15,23,42,0.24)]">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-blue-700">
                  <Sparkles className="h-3.5 w-3.5" />
                  Premium Bulk Upload
                </div>
                <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950">Bulk Product Upload</h2>
                <p className="mt-1 text-sm font-medium text-slate-500">
                  Upload CSV or Excel, validate catalog rows, preview issues, edit, approve, and import in chunks.
                </p>
              </div>
              <button
                onClick={handleClose}
                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
                type="button"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[calc(92vh-96px)] overflow-y-auto px-6 py-6">
              <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Step 1</p>
                      <h3 className="mt-2 text-xl font-black text-slate-900">Upload CSV / Excel</h3>
                    </div>
                    <button
                      onClick={handleTemplateDownload}
                      className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-slate-700 transition hover:border-blue-500 hover:text-blue-600"
                      type="button"
                    >
                      <Download className="h-4 w-4" />
                      Download Full Product Template
                    </button>
                  </div>

                  <div
                    onDragEnter={(event) => {
                      event.preventDefault();
                      setDragActive(true);
                    }}
                    onDragOver={(event) => {
                      event.preventDefault();
                      setDragActive(true);
                    }}
                    onDragLeave={(event) => {
                      event.preventDefault();
                      setDragActive(false);
                    }}
                    onDrop={(event) => {
                      event.preventDefault();
                      setDragActive(false);
                      void handleFileChosen(event.dataTransfer.files?.[0] || null);
                    }}
                    className={`mt-5 rounded-[1.75rem] border-2 border-dashed p-8 text-center transition ${
                      dragActive ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-slate-50'
                    }`}
                  >
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-900 text-white shadow-lg">
                      <UploadCloud className="h-7 w-7" />
                    </div>
                    <h4 className="mt-4 text-lg font-black text-slate-900">Drop CSV or Excel here</h4>
                    <p className="mt-2 text-sm font-medium text-slate-500">
                      Supports `.csv` and `.xlsx` with full product-field coverage.
                    </p>
                    <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={openFilePicker}
                        className="rounded-2xl bg-slate-900 px-5 py-3 text-xs font-black uppercase tracking-[0.16em] text-white transition hover:bg-blue-600"
                      >
                        Choose File
                      </button>
                      {selectedFile ? (
                        <div className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm">
                          <FileSpreadsheet className="h-4 w-4 text-blue-600" />
                          {selectedFile.name}
                        </div>
                      ) : null}
                    </div>
                    <input
                      ref={inputRef}
                      type="file"
                      accept=".csv,.xlsx"
                      className="hidden"
                      onChange={(event) => void handleFileChosen(event.target.files?.[0] || null)}
                    />
                  </div>

                  {error ? (
                    <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
                      {error}
                    </div>
                  ) : null}

                  {loadingPreview ? (
                    <div className="mt-5 rounded-[1.5rem] border border-slate-200 bg-slate-50 px-5 py-8">
                      <div className="flex items-center justify-center gap-3 text-sm font-semibold text-slate-600">
                        <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                        Reading file, validating rows, and preparing preview...
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Workflow</p>
                  <div className="mt-4 space-y-4">
                    {[
                      '1. Upload CSV or Excel file',
                      '2. Validate SKU, slug, category, seller, stock, price, and image URL',
                      '3. Preview rows and edit before import',
                      '4. Approve valid rows or skip weak rows',
                      '5. Import in safe chunks with success and error reporting',
                    ].map((step) => (
                      <div key={step} className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                        {step}
                      </div>
                    ))}
                  </div>

                  {summary ? (
                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      {[
                        ['Rows', summary.total, 'bg-slate-100 text-slate-700'],
                        ['Valid', summary.valid, 'bg-emerald-100 text-emerald-700'],
                        ['Invalid', summary.invalid, 'bg-rose-100 text-rose-700'],
                        ['Warnings', summary.warnings, 'bg-amber-100 text-amber-700'],
                      ].map(([label, value, tone]) => (
                        <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4">
                          <div className={`inline-flex rounded-xl px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${tone}`}>
                            {label}
                          </div>
                          <p className="mt-3 text-2xl font-black text-slate-900">{value}</p>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>

              {previewRows.length ? (
                <div className="mt-6 rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Step 2</p>
                      <h3 className="mt-2 text-xl font-black text-slate-900">Preview, Edit, Approve</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setPreviewRows((current) => current.map((row) => ({ ...row, approved: row.canImport, skipped: false })))
                        }
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-slate-700"
                      >
                        Approve Valid Rows
                      </button>
                      <button
                        type="button"
                        onClick={downloadErrorReport}
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-slate-700"
                      >
                        Download Error Report
                      </button>
                      <button
                        type="button"
                        onClick={handleImport}
                        disabled={importing || previewStats.ready === 0}
                        className="rounded-2xl bg-slate-900 px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-white disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Import All Valid Rows
                      </button>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 md:grid-cols-4">
                    {[
                      ['Approved', previewStats.approved, 'bg-blue-50 text-blue-700'],
                      ['Ready', previewStats.ready, 'bg-emerald-50 text-emerald-700'],
                      ['Skipped', previewStats.skipped, 'bg-slate-100 text-slate-700'],
                      ['Need Fix', previewStats.invalid, 'bg-rose-50 text-rose-700'],
                    ].map(([label, value, tone]) => (
                      <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4">
                        <div className={`inline-flex rounded-xl px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${tone}`}>
                          {label}
                        </div>
                        <p className="mt-3 text-2xl font-black text-slate-900">{value}</p>
                      </div>
                    ))}
                  </div>

                  {importing ? (
                    <div className="mt-5 rounded-2xl border border-blue-200 bg-blue-50 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-sm font-semibold text-blue-700">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Importing approved products in safe chunks
                        </div>
                        <div className="text-sm font-black text-blue-700">
                          {importProgress.current}/{importProgress.total}
                        </div>
                      </div>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-blue-100">
                        <div
                          className="h-full rounded-full bg-blue-600 transition-all"
                          style={{
                            width: `${importProgress.total ? (importProgress.current / importProgress.total) * 100 : 0}%`,
                          }}
                        />
                      </div>
                    </div>
                  ) : null}

                  {importResults.length ? (
                    <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex flex-wrap gap-3">
                        <div className="rounded-2xl bg-emerald-100 px-4 py-2 text-sm font-black text-emerald-700">
                          Successful: {importResults.filter((item) => item.success).length}
                        </div>
                        <div className="rounded-2xl bg-rose-100 px-4 py-2 text-sm font-black text-rose-700">
                          Failed: {importResults.filter((item) => !item.success).length}
                        </div>
                      </div>
                    </div>
                  ) : null}

                  <div className="mt-5 overflow-hidden rounded-[1.5rem] border border-slate-200">
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[1280px] divide-y divide-slate-100 text-left">
                        <thead className="bg-slate-50">
                          <tr className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                            <th className="px-4 py-4">Use</th>
                            <th className="px-4 py-4">Image</th>
                            <th className="px-4 py-4">Title / SKU</th>
                            <th className="px-4 py-4">Category</th>
                            <th className="px-4 py-4">Price / Stock</th>
                            <th className="px-4 py-4">Seller / Status</th>
                            <th className="px-4 py-4">Errors / Warnings</th>
                            <th className="px-4 py-4">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {previewRows.map((row) => (
                            <tr key={row.clientId} className="align-top hover:bg-slate-50/70">
                              <td className="px-4 py-4">
                                <input
                                  type="checkbox"
                                  checked={row.approved !== false}
                                  onChange={(event) =>
                                    updateRow(row.clientId, (current) => ({ ...current, approved: event.target.checked, skipped: !event.target.checked }))
                                  }
                                />
                              </td>
                              <td className="px-4 py-4">
                                <div className="h-16 w-16 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                                  {row.fields.mainImageUrl ? (
                                    <img src={row.fields.mainImageUrl} alt={row.fields.productTitle} className="h-full w-full object-cover" />
                                  ) : (
                                    <div className="flex h-full w-full items-center justify-center text-slate-300">
                                      <ImageIcon className="h-5 w-5" />
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-4">
                                <p className="max-w-[260px] text-sm font-black text-slate-900">{row.fields.productTitle || 'Untitled row'}</p>
                                <p className="mt-1 text-xs font-semibold text-slate-500">{row.fields.sku || 'No SKU'}</p>
                              </td>
                              <td className="px-4 py-4 text-sm font-semibold text-slate-700">
                                <p>{row.resolved.parentCategoryName || row.fields.parentCategory || 'Unknown'}</p>
                                <p className="mt-1 text-xs font-medium text-slate-500">{row.resolved.subcategoryName || row.fields.subcategory || 'No subcategory'}</p>
                              </td>
                              <td className="px-4 py-4 text-sm font-semibold text-slate-700">
                                <p>{row.fields.salePrice || row.fields.regularPrice || '0'}</p>
                                <p className="mt-1 text-xs font-medium text-slate-500">{row.fields.stockQuantity || '0'} stock</p>
                              </td>
                              <td className="px-4 py-4">
                                <div className="rounded-2xl bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
                                  {row.resolved.sellerName || row.fields.sellerName || 'No seller'}
                                </div>
                                <div className="mt-2 inline-flex rounded-full bg-blue-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-blue-700">
                                  {row.resolved.status}
                                </div>
                              </td>
                              <td className="px-4 py-4">
                                {row.errors.length ? (
                                  <div className="space-y-2">
                                    {row.errors.slice(0, 3).map((issue) => (
                                      <div key={issue} className="rounded-2xl bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700">
                                        {issue}
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="rounded-2xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">
                                    Ready to import
                                  </div>
                                )}
                                {row.warnings.length ? (
                                  <div className="mt-2 rounded-2xl bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700">
                                    {row.warnings[0]}
                                  </div>
                                ) : null}
                              </td>
                              <td className="px-4 py-4">
                                <div className="flex flex-col gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setEditingRowId(row.clientId)}
                                    className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-slate-700"
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                    Edit Row
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => updateRow(row.clientId, (current) => ({ ...current, skipped: !current.skipped, approved: current.skipped }))}
                                    className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-slate-700"
                                  >
                                    {row.skipped ? 'Unskip' : 'Skip'}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          {editingRow ? (
            <div className="fixed inset-0 z-[100001] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
              <div className="max-h-[88vh] w-full max-w-3xl overflow-y-auto rounded-[2rem] border border-white/60 bg-white p-6 shadow-[0_35px_90px_rgba(15,23,42,0.26)]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Edit Preview Row</p>
                    <h3 className="mt-2 text-2xl font-black text-slate-950">{editingRow.fields.productTitle || 'Untitled row'}</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditingRowId(null)}
                    className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  {[
                    ['productTitle', 'Product Title'],
                    ['sku', 'SKU'],
                    ['brand', 'Brand'],
                    ['model', 'Model'],
                    ['parentCategory', 'Parent Category'],
                    ['subcategory', 'Subcategory'],
                    ['sellerName', 'Seller Name'],
                    ['regularPrice', 'Regular Price'],
                    ['salePrice', 'Sale Price'],
                    ['stockQuantity', 'Stock Quantity'],
                    ['mainImageUrl', 'Main Image URL'],
                    ['seoSlug', 'SEO Slug'],
                  ].map(([key, label]) => (
                    <div key={key} className="space-y-2">
                      <label className="text-sm font-bold text-slate-800">{label}</label>
                      <input
                        value={(editingRow.fields as any)[key] || ''}
                        onChange={(event) =>
                          updateRow(editingRow.clientId, (current) => ({
                            ...current,
                            fields: {
                              ...current.fields,
                              [key]: event.target.value,
                            },
                          }))
                        }
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                      />
                    </div>
                  ))}
                </div>

                <div className="mt-4 grid gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-800">Short Description</label>
                    <textarea
                      value={editingRow.fields.shortDescription}
                      onChange={(event) =>
                        updateRow(editingRow.clientId, (current) => ({
                          ...current,
                          fields: {
                            ...current.fields,
                            shortDescription: event.target.value,
                          },
                        }))
                      }
                      rows={3}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-800">Long Description</label>
                    <textarea
                      value={editingRow.fields.longDescription}
                      onChange={(event) =>
                        updateRow(editingRow.clientId, (current) => ({
                          ...current,
                          fields: {
                            ...current.fields,
                            longDescription: event.target.value,
                          },
                        }))
                      }
                      rows={5}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                    />
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingRowId(null)}
                    className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-xs font-black uppercase tracking-[0.14em] text-slate-700"
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
