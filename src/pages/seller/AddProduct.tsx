import React, { useEffect, useMemo, useState } from 'react';
import { MASTER_CATEGORIES, resolveCanonicalCategoryAssignment } from '../../lib/masterCategories';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Eye,
  ImagePlus,
  Save,
  Sparkles,
  Upload,
} from 'lucide-react';
import { adminProductAPI, categoryAPI, productAPI } from '../../services/api';
import { sellerAPI } from '../../services/api';
import { useAuthStore } from '../../store/auth';
import AuthService from '../../lib/authService';
import { fileToDataUrl, uploadImageDataUrl } from '../../lib/uploadClient';
import { compressImage } from '../../lib/imageUtils';
import { useDraftFormPersistence } from '../../hooks';
import SEOSettingsCard from '../../components/admin/SEOSettingsCard';
import ProductSpecificationEditor from '../../components/admin/ProductSpecificationEditor';
import { checkProductSlugAvailability } from '../../services/seoApi';
import {
  buildDetailedSpecificationGroups,
  getEnabledSpecificationFields,
  getMissingRequiredSpecificationLabels,
  getSpecificationTemplate,
  humanizeSpecificationValue,
  normalizeSpecificationValues,
  preserveMatchingSpecificationValues,
  type DetailedSpecificationGroup,
  type SpecificationTemplate,
  type VariantDimensionKey,
} from '../../lib/productSpecifications';
import {
  generateProductSeo,
  getProductSeoPayload,
  normalizeSeoText,
  slugifySeo,
  trimSeoKeywords,
} from '../../utils/seo';
import { COUNTRY_CONFIG, SUPPORTED_COUNTRY_CODES, convertFromAed } from '../../lib/countryConfig';

type FormState = {
  title: string;
  slug: string;
  shortDescription: string;
  longDescription: string;
  price: string;
  priceUae: string;
  priceKsa: string;
  priceQatar: string;
  priceKuwait: string;
  priceBahrain: string;
  priceOman: string;
  originalPrice: string;
  compareAtPriceUae: string;
  compareAtPriceKsa: string;
  compareAtPriceQatar: string;
  compareAtPriceKuwait: string;
  compareAtPriceBahrain: string;
  compareAtPriceOman: string;
  stock: string;
  sku: string;
  brand: string;
  searchTags: string;
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  canonicalUrl: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  shippingWeight: string;
  packageSize: string;
  returnPolicy: string;
  warrantyPolicy: string;
  sellerNotes: string;
};

type VariantRow = {
  id: string;
  color: string;
  size: string;
  storage: string;
  ram: string;
  processor: string;
  price: string;
  originalPrice: string;
  stock: string;
  sku: string;
  image?: string;
};

type StepId =
  | 'category'
  | 'basic'
  | 'media'
  | 'pricing'
  | 'specs'
  | 'shipping'
  | 'seo'
  | 'preview';

type Subcategory = {
  id?: string;
  name: string;
  slug: string;
};

type LiveCategory = {
  id: string;
  name: string;
  slug: string;
  subcategories: Subcategory[];
};

type AddProductProps = {
  mode?: 'seller' | 'admin';
};

type AuthRole =
  | 'customer'
  | 'seller'
  | 'admin'
  | 'super_admin'
  | 'finance_manager'
  | 'support_agent'
  | null;

type StoreUser = {
  id?: string;
  uid?: string;
};

type RestoredSession = {
  user?: {
    id?: string;
  } | null;
  role?: AuthRole | string | null;
};

type SellerRecord = {
  id?: string | null;
};

type ProductVariantRecord = {
  id?: string;
  color?: string;
  size?: string;
  storage?: string;
  ram?: string;
  processor?: string;
  price?: number | string | null;
  originalPrice?: number | string | null;
  stock?: number | string | null;
  sku?: string;
  image?: string;
};

type ProductRecord = {
  categoryId?: string | number | null;
  title?: string;
  description?: string;
  price?: number | string | null;
  originalPrice?: number | string | null;
  stock?: number | string | null;
  sku?: string;
  brand?: string;
  image?: string;
  images?: string[];
  category?: string | null;
  subcategory?: string | null;
  specs?: {
    parentCategorySlug?: string | null;
    categorySlug?: string | null;
    subcategorySlug?: string | null;
    shortDescription?: string;
    longDescription?: string;
    metaTitle?: string;
    metaDescription?: string;
    metaKeywords?: string;
    canonicalUrl?: string;
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
    shippingWeight?: string;
    packageSize?: string;
    returnPolicy?: string;
    warrantyPolicy?: string;
    sellerNotes?: string;
    defaultVariantId?: string | null;
    keyFeatures?: string[];
    briefHighlights?: string[];
    whatsInTheBox?: string[];
    searchTags?: string[];
    variants?: ProductVariantRecord[];
    specificationValues?: Record<string, unknown>;
    specificationGroups?: DetailedSpecificationGroup[];
    additionalSpecificationGroups?: DetailedSpecificationGroup[];
    variantAttributes?: VariantDimensionKey[];
    specifications?: Record<string, string>;
    pricesByCountry?: Record<string, { price?: number; compareAtPrice?: number }>;
    attributes?: {
      brand?: string;
      subcategory?: string | null;
    };
  };
};

type ProductPayload = {
  categoryId: string;
  slug?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  sellerId?: string;
  title: string;
  description: string;
  price: number;
  priceUae?: number;
  priceKsa?: number;
  priceQatar?: number;
  priceKuwait?: number;
  priceBahrain?: number;
  priceOman?: number;
  originalPrice: number;
  compareAtPriceUae?: number;
  compareAtPriceKsa?: number;
  compareAtPriceQatar?: number;
  compareAtPriceKuwait?: number;
  compareAtPriceBahrain?: number;
  compareAtPriceOman?: number;
  salePrice?: number;
  image: string;
  images: string[];
  stock: number;
  sku: string;
  brand: string;
  status: 'live' | 'pending';
  specs: {
    templateId: string;
    templateName: string;
    categoryTemplateKey: string;
    shortDescription: string;
    longDescription: string;
    specificationValues: Record<string, unknown>;
    specifications: Record<string, string>;
    specificationGroups: DetailedSpecificationGroup[];
    additionalSpecificationGroups: DetailedSpecificationGroup[];
    attributes: Record<string, string>;
    variants: Array<{
      id: string;
      color: string;
      size: string;
      storage: string;
      ram: string;
      processor: string;
      price: number | null;
      originalPrice: number | null;
      stock: number | null;
      sku: string;
      image?: string;
    }>;
    defaultVariantId?: string;
    briefHighlights: string[];
    keyFeatures: string[];
    whatsInTheBox: string[];
    searchTags: string[];
    variantAttributes: VariantDimensionKey[];
    basePriceAED?: number;
    pricesByCountry?: Record<string, { currency: string; price: number; compareAtPrice: number }>;
    metaTitle: string;
    metaDescription: string;
    metaKeywords: string;
    canonicalUrl: string;
    ogTitle: string;
    ogDescription: string;
    ogImage: string;
    shippingWeight: string;
    packageSize: string;
    returnPolicy: string;
    warrantyPolicy: string;
    sellerNotes: string;
    listingCompleteness: number;
    seoScore: number;
    parentCategorySlug: string;
    categorySlug: string;
    subcategorySlug: string;
    parentCategoryName: string;
    categoryName: string;
    subcategoryName: string;
    categoryPath: string;
    approvalStatus: 'approved' | 'pending';
    productStatus: 'live' | 'out_of_stock' | 'pending_approval';
    visibilityStatus: 'live' | 'pending';
    ownership: 'official' | 'seller';
    createdByRole: 'admin' | 'seller';
    badges: string[];
  };
};

type VariantEditableField =
  | 'color'
  | 'size'
  | 'storage'
  | 'ram'
  | 'processor'
  | 'sku'
  | 'price'
  | 'originalPrice'
  | 'stock';

const ADMIN_ROLES: AuthRole[] = [
  'admin',
  'super_admin',
  'finance_manager',
  'support_agent',
];

const VARIANT_FIELD_OPTIONS: Array<{ key: VariantEditableField; label: string }> = [
  { key: 'color', label: 'Color' },
  { key: 'size', label: 'Size' },
  { key: 'storage', label: 'Storage' },
  { key: 'ram', label: 'RAM' },
  { key: 'processor', label: 'Processor' },
  { key: 'sku', label: 'Variant SKU' },
  { key: 'price', label: 'Price' },
  { key: 'originalPrice', label: 'Original Price' },
  { key: 'stock', label: 'Stock' },
];

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function moveArrayItem<T>(items: T[], index: number, direction: -1 | 1) {
  const nextIndex = index + direction;
  if (nextIndex < 0 || nextIndex >= items.length) return items;
  const next = [...items];
  const [item] = next.splice(index, 1);
  next.splice(nextIndex, 0, item);
  return next;
}



const initialFormState: FormState = {
  title: '',
  slug: '',
  shortDescription: '',
  longDescription: '',
  price: '',
  priceUae: '',
  priceKsa: '',
  priceQatar: '',
  priceKuwait: '',
  priceBahrain: '',
  priceOman: '',
  originalPrice: '',
  compareAtPriceUae: '',
  compareAtPriceKsa: '',
  compareAtPriceQatar: '',
  compareAtPriceKuwait: '',
  compareAtPriceBahrain: '',
  compareAtPriceOman: '',
  stock: '',
  sku: '',
  brand: '',
  searchTags: '',
  metaTitle: '',
  metaDescription: '',
  metaKeywords: '',
  canonicalUrl: '',
  ogTitle: '',
  ogDescription: '',
  ogImage: '',
  shippingWeight: '',
  packageSize: '',
  returnPolicy: '7-day return policy. Product must remain in original condition.',
  warrantyPolicy: 'Seller warranty applies as selected in the listing specifications.',
  sellerNotes: '',
};

const stepMeta: { id: StepId; label: string; description: string }[] = [
  { id: 'category', label: 'Category', description: 'Choose parent and subcategory' },
  { id: 'basic', label: 'Basic Info', description: 'Title, summary, and description' },
  { id: 'media', label: 'Media', description: 'Upload and arrange images' },
  { id: 'pricing', label: 'Pricing', description: 'Price, stock, SKU, variants' },
  { id: 'specs', label: 'Specs', description: 'Highlights and technical details' },
  { id: 'shipping', label: 'Shipping', description: 'Weight, size, returns, warranty' },
  { id: 'seo', label: 'SEO', description: 'Tags and metadata' },
  { id: 'preview', label: 'Preview', description: 'Review and publish' },
];

const GCC_PRICE_FIELDS: Array<{
  code: (typeof SUPPORTED_COUNTRY_CODES)[number];
  priceKey: keyof FormState;
  compareKey: keyof FormState;
}> = [
  { code: 'AE', priceKey: 'priceUae', compareKey: 'compareAtPriceUae' },
  { code: 'SA', priceKey: 'priceKsa', compareKey: 'compareAtPriceKsa' },
  { code: 'QA', priceKey: 'priceQatar', compareKey: 'compareAtPriceQatar' },
  { code: 'KW', priceKey: 'priceKuwait', compareKey: 'compareAtPriceKuwait' },
  { code: 'BH', priceKey: 'priceBahrain', compareKey: 'compareAtPriceBahrain' },
  { code: 'OM', priceKey: 'priceOman', compareKey: 'compareAtPriceOman' },
];

const createVariantRow = (): VariantRow => ({
  id: `variant-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  color: '',
  size: '',
  storage: '',
  ram: '',
  processor: '',
  price: '',
  originalPrice: '',
  stock: '',
  sku: '',
  image: '',
});

const normalizeLiveCategories = (items: unknown[]): LiveCategory[] => {
  const source = Array.isArray(items) ? items : [];
  const liveCategories = source
    .map((item) => {
      const category = asRecord(item);
      const rawSubs =
        category.subcategories ||
        category.children ||
        category.categories ||
        category.items ||
        [];

      return {
        id: String(category.id || category.slug || category.name || ''),
        name: String(category.name || category.title || ''),
        slug: String(category.slug || slugifyValue(String(category.name || category.title || ''))),
        subcategories: (Array.isArray(rawSubs) ? rawSubs : [])
          .map((subcategory) => {
            const child = asRecord(subcategory);
            return {
              id: String(child.id || child.slug || child.name || ''),
              name: String(child.name || child.title || ''),
              slug: String(child.slug || slugifyValue(String(child.name || child.title || ''))),
            };
          })
          .filter((subcategory: Subcategory) => subcategory.name && subcategory.slug),
      };
    })
    .filter((category: LiveCategory) => category.name && category.slug);

  const mergedBySlug = new Map<string, LiveCategory>();

  (MASTER_CATEGORIES || []).forEach((category: any) => {
    mergedBySlug.set(String(category.slug), {
      id: String(category.id || category.slug || category.name || ''),
      name: String(category.name || ''),
      slug: String(category.slug || ''),
      subcategories: Array.isArray(category.subcategories)
        ? category.subcategories
            .map((subcategory: any) => ({
              id: String(subcategory.id || subcategory.slug || subcategory.name || ''),
              name: String(subcategory.name || ''),
              slug: String(subcategory.slug || ''),
            }))
            .filter((subcategory: Subcategory) => subcategory.name && subcategory.slug)
        : [],
    });
  });

  liveCategories.forEach((category) => {
    const canonical = mergedBySlug.get(category.slug);
    if (canonical) {
      mergedBySlug.set(category.slug, {
        ...canonical,
        id: category.id || canonical.id,
      });
      return;
    }

    mergedBySlug.set(category.slug, category);
  });

  return Array.from(mergedBySlug.values());
};

const toBulletList = (value: string) =>
  value
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);

const formatPercent = (value: number) => `${Math.max(0, Math.min(100, Math.round(value)))}%`;

const slugifyValue = (value: string) =>
  String(value || '')
    .toLowerCase()
    .trim()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const toUploadErrorMessage = (error: unknown) => {
  const message = String(error || '');
  if (/too many requests/i.test(message)) {
    return 'Image upload is temporarily busy. Please wait a few seconds and try again.';
  }
  if (/failed to fetch/i.test(message)) {
    return 'Image upload could not reach the server. Please check backend connection and try again.';
  }
  return message;
};

const uploadFilesAsHostedImages = async (
  files: FileList | File[],
  onProgress?: (value: number) => void
) => {
  const items = Array.from(files);
  const results: string[] = [];

  for (let index = 0; index < items.length; index += 1) {
    const file = items[index];
    const encoded = await fileToDataUrl(file);
    const optimized = await compressImage(encoded, 1280, 1280, 0.7);
    const uploaded = await uploadImageDataUrl(optimized, {
      folder: 'products',
      fileName: file.name,
    });
    results.push(uploaded);
    onProgress?.(Math.round(((index + 1) / items.length) * 100));
  }

  return results;
};

const ListingStepBadge: React.FC<{
  step: { id: StepId; label: string; description: string };
  index: number;
  active: boolean;
  completed: boolean;
  onClick: () => void;
}> = ({ step, index, active, completed, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`rounded-[1.5rem] border px-4 py-4 text-left transition-all ${
      active
        ? 'border-blue-200 bg-blue-50 shadow-lg shadow-blue-100/50'
        : completed
        ? 'border-emerald-200 bg-emerald-50'
        : 'border-slate-200 bg-white hover:bg-slate-50'
    }`}
  >
    <div className="flex items-start gap-3">
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-2xl text-sm font-black ${
          active ? 'bg-blue-600 text-white' : completed ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-white'
        }`}
      >
        0{index + 1}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">{step.label}</p>
        <p className="mt-2 text-sm font-bold text-slate-900">{step.description}</p>
      </div>
    </div>
  </button>
);

export default function AddProduct({ mode = 'seller' }: AddProductProps) {
  const navigate = useNavigate();
  const { user, role } = useAuthStore();
  const [searchParams] = useSearchParams();

  const editingId = searchParams.get('edit');
  const copyingId = searchParams.get('copy');

  const [currentStep, setCurrentStep] = useState<StepId>('category');
  const [formData, setFormData] = useState<FormState>(initialFormState);
  const [images, setImages] = useState<string[]>([]);
  const [variants, setVariants] = useState<VariantRow[]>([]);
  const [specificationValues, setSpecificationValues] = useState<Record<string, any>>({});
  const [briefHighlights, setBriefHighlights] = useState<string[]>(['', '', '']);
  const [boxContents, setBoxContents] = useState<string[]>(['']);
  const [customSpecificationGroups, setCustomSpecificationGroups] = useState<DetailedSpecificationGroup[]>([]);
  const [defaultVariantId, setDefaultVariantId] = useState<string | null>(null);
  const [categories, setCategories] = useState<LiveCategory[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedParentSlug, setSelectedParentSlug] = useState<string | null>(null);
  const [selectedSubcategorySlug, setSelectedSubcategorySlug] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [autosaveState, setAutosaveState] = useState<'idle' | 'saved'>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [slugCheckState, setSlugCheckState] = useState<'idle' | 'checking' | 'available' | 'duplicate'>('idle');
  const [slugCheckMessage, setSlugCheckMessage] = useState('');

  // Draft persistence hook - auto-saves form every 5 seconds
  const draftKey = `${mode}-product-listing`;
  const { saveDraft: saveDraftToStorage, restoreDraft: restoreDraftFromStorage, clearDraft } = useDraftFormPersistence(
    {
      formData,
      images,
      variants,
      specificationValues,
      briefHighlights,
      boxContents,
      selectedParentSlug,
      selectedSubcategorySlug,
      customSpecificationGroups,
      defaultVariantId,
    },
    draftKey,
    5000
  );

  // Restore draft on mount (unless we're editing an existing product)
  useEffect(() => {
    if (editingId || copyingId) {
      // Loading existing product, don't restore draft
      return;
    }

    const restored = restoreDraftFromStorage();
    if (restored && typeof restored === 'object') {
      const r = restored as any;
      if (r.formData) setFormData(r.formData);
      if (r.images) setImages(r.images);
      if (r.variants) setVariants(r.variants);
      if (r.specificationValues) setSpecificationValues(r.specificationValues);
      if (r.briefHighlights) setBriefHighlights(r.briefHighlights);
      if (r.boxContents) setBoxContents(r.boxContents);
      if (r.selectedParentSlug) setSelectedParentSlug(r.selectedParentSlug);
      if (r.selectedSubcategorySlug) setSelectedSubcategorySlug(r.selectedSubcategorySlug);
      if (r.customSpecificationGroups) setCustomSpecificationGroups(r.customSpecificationGroups);
      if (r.defaultVariantId) setDefaultVariantId(r.defaultVariantId);
      console.log('[PRODUCT] Draft restored from storage');
    }
  }, [editingId, copyingId, restoreDraftFromStorage]);

  const categoryOptions = useMemo(
  () => (categories.length ? categories : MASTER_CATEGORIES),
  [categories]
);

  const selectedParentCategory = useMemo(
  () => categoryOptions.find((category) => category.slug === selectedParentSlug) || null,
  [categoryOptions, selectedParentSlug]
);


  const selectedSubcategory = useMemo(
    () =>
      selectedParentCategory?.subcategories.find(
        (subcategory) => subcategory.slug === selectedSubcategorySlug
      ) || null,
    [selectedParentCategory, selectedSubcategorySlug]
  );

  const generatedSeoDefaults = useMemo(
    () =>
      generateProductSeo({
        title: formData.title,
        shortDescription: formData.shortDescription,
        category: selectedSubcategory?.name || selectedParentCategory?.name || '',
        subcategory: selectedSubcategory?.name || '',
        slug: formData.slug || formData.title,
        canonicalUrl:
          selectedParentSlug && selectedSubcategorySlug
            ? `https://exshopi.com/${selectedParentSlug}/${selectedSubcategorySlug}/${slugifySeo(formData.slug || formData.title || 'product')}`
            : '',
      }),
    [
      formData.title,
      formData.shortDescription,
      formData.slug,
      selectedParentCategory?.name,
      selectedParentSlug,
      selectedSubcategory?.name,
      selectedSubcategorySlug,
    ]
  );
  const seoState = useMemo(
    () =>
      getProductSeoPayload({
        title: formData.title,
        shortDescription: formData.shortDescription,
        description: formData.longDescription,
        category: selectedParentCategory?.name || '',
        subcategory: selectedSubcategory?.name || '',
        slug: formData.slug,
        metaTitle: formData.metaTitle,
        metaDescription: formData.metaDescription,
        metaKeywords: formData.metaKeywords,
        canonicalUrl: formData.canonicalUrl,
        ogTitle: formData.ogTitle,
        ogDescription: formData.ogDescription,
        ogImage: formData.ogImage,
        image: images[0],
      }),
    [
      formData.canonicalUrl,
      formData.longDescription,
      formData.metaDescription,
      formData.metaKeywords,
      formData.metaTitle,
      formData.ogDescription,
      formData.ogImage,
      formData.ogTitle,
      formData.shortDescription,
      formData.slug,
      formData.title,
      images,
      selectedParentCategory?.name,
      selectedSubcategory?.name,
    ]
  );

  const seoPreviewUrl = seoState.preview.url;

  const specificationTemplate = useMemo<SpecificationTemplate>(
    () => getSpecificationTemplate(selectedParentSlug, selectedSubcategorySlug, selectedSubcategory?.name || ''),
    [selectedParentSlug, selectedSubcategorySlug, selectedSubcategory?.name]
  );

  const enabledSpecificationFields = useMemo(
    () => getEnabledSpecificationFields(specificationTemplate),
    [specificationTemplate]
  );

  const enabledVariantDimensions = useMemo<VariantDimensionKey[]>(
    () => specificationTemplate.variantDimensions || [],
    [specificationTemplate]
  );

  const draftStorageKey = `product-draft:${mode}:${editingId || copyingId || 'new'}`;

  useEffect(() => {
    let mounted = true;

    const ensureAccess = async () => {
      const activeUser = (user || null) as StoreUser | null;
      let userId = activeUser?.id || activeUser?.uid || '';
      let effectiveRole: AuthRole | string | null = role;

      if (!userId) {
        const restored = (await AuthService.restoreSession().catch(() => null)) as RestoredSession | null;
        if (!mounted) return;

        if (restored?.user?.id) {
          userId = restored.user.id;
          effectiveRole = restored.role || effectiveRole;
        }
      }

      if (!userId) {
        navigate(mode === 'admin' ? '/admin/login' : '/seller/login');
        return;
      }

      if (mode === 'admin') {
        const isAdminUser = ADMIN_ROLES.includes((effectiveRole as AuthRole) || null);
        if (!isAdminUser) {
          navigate('/admin/login');
        }
        return;
      }

      const seller = ((await sellerAPI.getMyStore().catch(() => null)) ||
        (await sellerAPI.getByUserId(userId).catch(() => null))) as SellerRecord | null;

      if (!mounted) return;
      if (!seller?.id) {
        navigate('/seller/login');
      }
    };

    ensureAccess();

    return () => {
      mounted = false;
    };
  }, [mode, navigate, role, user]);

useEffect(() => {
  let mounted = true;

  const loadCategories = async () => {
    try {
      const apiResult = await categoryAPI.getAll();
      const normalized = normalizeLiveCategories(apiResult || []);
      if (!mounted) return;

      if (normalized.length > 0) {
        setCategories(normalized);
      } else {
        setCategories([]);
      }
    } catch {
      if (mounted) {
        setCategories([]);
      }
    }
  };

  loadCategories();

  return () => {
    mounted = false;
  };
}, []);

  useEffect(() => {
    if (editingId || copyingId) return;
    const rawDraft = localStorage.getItem(draftStorageKey);
    if (!rawDraft) return;

    try {
      const draft = JSON.parse(rawDraft);
      setFormData((prev) => ({ ...prev, ...(draft.formData || {}) }));
      setImages(Array.isArray(draft.images) ? draft.images : []);
      setVariants(Array.isArray(draft.variants) ? draft.variants : []);
      setSpecificationValues(draft.specificationValues && typeof draft.specificationValues === 'object' ? draft.specificationValues : {});
      setBriefHighlights(Array.isArray(draft.briefHighlights) && draft.briefHighlights.length ? draft.briefHighlights : ['', '', '']);
      setBoxContents(Array.isArray(draft.boxContents) && draft.boxContents.length ? draft.boxContents : ['']);
      setCustomSpecificationGroups(Array.isArray(draft.customSpecificationGroups) ? draft.customSpecificationGroups : []);
      setDefaultVariantId(draft.defaultVariantId || null);
      setCurrentStep(draft.currentStep || 'category');
      setSelectedCategoryId(draft.selectedCategoryId || null);
      setSelectedParentSlug(draft.selectedParentSlug || null);
      setSelectedSubcategorySlug(draft.selectedSubcategorySlug || null);
      setLastSavedAt(draft.savedAt || null);
    } catch {
      // ignore bad draft
    }
  }, [draftStorageKey, editingId, copyingId]);

  useEffect(() => {
    let mounted = true;

    const loadExistingProduct = async () => {
      const sourceId = editingId || copyingId;
      if (!sourceId) return;

      try {
        const product = (await productAPI.get(sourceId)) as ProductRecord | null;
        if (!product || !mounted) return;
        const resolvedAssignment = resolveCanonicalCategoryAssignment(product);

        const nextParentSlug =
          resolvedAssignment.parentCategorySlug ||
          product?.specs?.parentCategorySlug ||
          product?.specs?.categorySlug ||
          product?.category ||
          null;
        const nextSubcategorySlug =
          resolvedAssignment.subcategorySlug ||
          product?.specs?.subcategorySlug ||
          product?.specs?.attributes?.subcategory ||
          product?.subcategory ||
          null;

        setSelectedCategoryId(product.categoryId ? String(product.categoryId) : null);
        setSelectedParentSlug(nextParentSlug ? String(nextParentSlug) : null);
        setSelectedSubcategorySlug(nextSubcategorySlug ? String(nextSubcategorySlug) : null);

        setFormData({
          title: editingId ? product.title || '' : `${product.title || ''} Copy`.trim(),
          slug: editingId ? String((product as any).slug || '') : '',
          shortDescription: product.specs?.shortDescription || '',
          longDescription: product.specs?.longDescription || product.description || '',
          price: String(product.price ?? ''),
          priceUae: String((product as any).priceUae ?? product.price ?? ''),
          priceKsa: String((product as any).priceKsa ?? ''),
          priceQatar: String((product as any).priceQatar ?? product.specs?.pricesByCountry?.QA?.price ?? ''),
          priceKuwait: String((product as any).priceKuwait ?? product.specs?.pricesByCountry?.KW?.price ?? ''),
          priceBahrain: String((product as any).priceBahrain ?? product.specs?.pricesByCountry?.BH?.price ?? ''),
          priceOman: String((product as any).priceOman ?? product.specs?.pricesByCountry?.OM?.price ?? ''),
          originalPrice: String(product.originalPrice ?? product.price ?? ''),
          compareAtPriceUae: String((product as any).compareAtPriceUae ?? product.originalPrice ?? product.price ?? ''),
          compareAtPriceKsa: String((product as any).compareAtPriceKsa ?? ''),
          compareAtPriceQatar: String((product as any).compareAtPriceQatar ?? product.specs?.pricesByCountry?.QA?.compareAtPrice ?? ''),
          compareAtPriceKuwait: String((product as any).compareAtPriceKuwait ?? product.specs?.pricesByCountry?.KW?.compareAtPrice ?? ''),
          compareAtPriceBahrain: String((product as any).compareAtPriceBahrain ?? product.specs?.pricesByCountry?.BH?.compareAtPrice ?? ''),
          compareAtPriceOman: String((product as any).compareAtPriceOman ?? product.specs?.pricesByCountry?.OM?.compareAtPrice ?? ''),
          stock: String(product.stock ?? ''),
          sku: editingId ? product.sku || '' : '',
          brand: product.brand || product.specs?.attributes?.brand || '',
          searchTags: Array.isArray(product.specs?.searchTags) ? product.specs.searchTags.join(', ') : '',
          metaTitle: product.specs?.metaTitle || '',
          metaDescription: product.specs?.metaDescription || '',
          metaKeywords: product.specs?.metaKeywords || '',
          canonicalUrl: product.specs?.canonicalUrl || '',
          ogTitle: product.specs?.ogTitle || '',
          ogDescription: product.specs?.ogDescription || '',
          ogImage: product.specs?.ogImage || '',
          shippingWeight: product.specs?.shippingWeight || '',
          packageSize: product.specs?.packageSize || '',
          returnPolicy: product.specs?.returnPolicy || initialFormState.returnPolicy,
          warrantyPolicy: product.specs?.warrantyPolicy || initialFormState.warrantyPolicy,
          sellerNotes: product.specs?.sellerNotes || '',
        });

        setImages(
          [product.image, ...(product.images || [])].filter(
            (image): image is string => typeof image === 'string' && image.trim().length > 0
          )
        );
        setVariants(
          Array.isArray(product.specs?.variants)
            ? product.specs.variants.map((variant: ProductVariantRecord, index: number) => ({
                id: variant.id || `variant-${index + 1}`,
                color: String(variant.color || ''),
                size: String(variant.size || ''),
                storage: String(variant.storage || ''),
                ram: String(variant.ram || ''),
                processor: String(variant.processor || ''),
                price: String(variant.price ?? ''),
                originalPrice: String(variant.originalPrice ?? variant.price ?? ''),
                stock: String(variant.stock ?? ''),
                sku: editingId ? String(variant.sku || '') : '',
                image: String(variant.image || ''),
              }))
            : []
        );
        const incomingSpecifications = {
          ...(product.specs?.specificationValues || {}),
          ...(product.specs?.specifications || {}),
          ...((product.specs?.attributes as Record<string, string> | undefined) || {}),
        };
        setSpecificationValues(incomingSpecifications);
        setBriefHighlights(
          Array.isArray(product.specs?.briefHighlights)
            ? product.specs.briefHighlights
            : Array.isArray(product.specs?.keyFeatures)
            ? product.specs.keyFeatures
            : ['', '', '']
        );
        setBoxContents(Array.isArray(product.specs?.whatsInTheBox) ? product.specs.whatsInTheBox : ['']);
        setCustomSpecificationGroups(
          Array.isArray(product.specs?.additionalSpecificationGroups) ? product.specs.additionalSpecificationGroups : []
        );
        setDefaultVariantId(product.specs?.defaultVariantId || null);
        setCurrentStep('basic');
      } catch {
        // ignore load failure
      }
    };

    loadExistingProduct();

    return () => {
      mounted = false;
    };
  }, [editingId, copyingId]);

  useEffect(() => {
    if (success) return;
    const timeout = window.setTimeout(() => {
      localStorage.setItem(
        draftStorageKey,
        JSON.stringify({
          formData,
          images,
          variants,
          specificationValues,
          briefHighlights,
          boxContents,
          customSpecificationGroups,
          defaultVariantId,
          currentStep,
          selectedCategoryId,
          selectedParentSlug,
          selectedSubcategorySlug,
          savedAt: new Date().toISOString(),
        })
      );
      setAutosaveState('saved');
      setLastSavedAt(new Date().toISOString());
      window.setTimeout(() => setAutosaveState('idle'), 1400);
    }, 900);

    return () => window.clearTimeout(timeout);
  }, [
    draftStorageKey,
    formData,
    images,
    variants,
    specificationValues,
    briefHighlights,
    boxContents,
    customSpecificationGroups,
    defaultVariantId,
    currentStep,
    selectedCategoryId,
    selectedParentSlug,
    selectedSubcategorySlug,
    success,
  ]);

  useEffect(() => {
    setSpecificationValues((current) => {
      const next = preserveMatchingSpecificationValues(
        {
          ...current,
          ...(formData.brand.trim() ? { brand: formData.brand.trim() } : {}),
        },
        specificationTemplate
      );

      if (JSON.stringify(current) === JSON.stringify(next)) return current;
      return next;
    });
  }, [specificationTemplate, formData.brand]);

  useEffect(() => {
    setVariants((current) =>
      current.map((variant) => ({
        ...variant,
        color: enabledVariantDimensions.includes('color') ? variant.color : '',
        size: enabledVariantDimensions.includes('size') ? variant.size : '',
        storage: enabledVariantDimensions.includes('storage') ? variant.storage : '',
        ram: enabledVariantDimensions.includes('ram') ? variant.ram : '',
        processor: enabledVariantDimensions.includes('processor') ? variant.processor : '',
      }))
    );
  }, [enabledVariantDimensions]);

  useEffect(() => {
    if (formData.slug.trim()) return;
    const nextSlug = slugifySeo(formData.title);
    if (!nextSlug) return;
    setFormData((current) => (current.slug.trim() ? current : { ...current, slug: nextSlug }));
  }, [formData.title, formData.slug]);

  useEffect(() => {
    if (!formData.slug.trim()) {
      setSlugCheckState('idle');
      setSlugCheckMessage('');
      return;
    }

    const timeout = window.setTimeout(async () => {
      try {
        setSlugCheckState('checking');
        setSlugCheckMessage('Checking slug availability...');
        const result = await checkProductSlugAvailability(formData.slug.trim(), editingId || undefined);
        setSlugCheckState(result.available ? 'available' : 'duplicate');
        setSlugCheckMessage(
          result.available
            ? result.message || 'Slug looks available.'
            : result.message || `Slug taken. Suggested: ${result.suggestedSlug}`
        );
      } catch {
        setSlugCheckState('idle');
        setSlugCheckMessage('');
      }
    }, 450);

    return () => window.clearTimeout(timeout);
  }, [editingId, formData.slug, mode]);

  const applyGeneratedSeo = () => {
    setFormData((current) => ({
      ...current,
      slug: current.slug.trim() || generatedSeoDefaults.slug,
      metaTitle: generatedSeoDefaults.metaTitle,
      metaDescription: generatedSeoDefaults.metaDescription,
      metaKeywords: generatedSeoDefaults.metaKeywords,
      canonicalUrl:
        current.canonicalUrl.trim() ||
        generatedSeoDefaults.canonicalUrl ||
        seoPreviewUrl,
      ogTitle: generatedSeoDefaults.ogTitle,
      ogDescription: generatedSeoDefaults.ogDescription,
      ogImage: current.ogImage.trim(),
    }));
  };

  const applyGeneratedSlug = () => {
    setFormData((current) => ({
      ...current,
      slug: slugifySeo(current.title || current.slug || 'product'),
    }));
  };

  const titleWords = formData.title.trim().split(/\s+/).filter(Boolean).length;
  const titleQuality =
    titleWords >= 6 && formData.title.trim().length >= 35 ? 'Strong' : titleWords >= 4 ? 'Good' : 'Needs Work';
  const imageQuality =
    images.length >= 4 ? 'Marketplace Ready' : images.length >= 2 ? 'Needs More Images' : 'Insufficient';

  const hasVariantPricing = useMemo(
    () => variants.some((variant) => variant.price.trim() && variant.stock.trim()),
    [variants]
  );

  const missingRequiredSpecifications = useMemo(
    () => getMissingRequiredSpecificationLabels(specificationValues, specificationTemplate),
    [specificationValues, specificationTemplate]
  );

  const listingCompleteness = useMemo(() => {
    const checkpoints = [
      formData.title.trim() ? 12 : 0,
      formData.shortDescription.trim() ? 10 : 0,
      formData.longDescription.trim() ? 8 : 0,
      formData.price.trim() || hasVariantPricing ? 10 : 0,
      formData.stock.trim() || hasVariantPricing ? 10 : 0,
      images.length >= 3 ? 15 : images.length > 0 ? 8 : 0,
      formData.brand.trim() ? 10 : 0,
      missingRequiredSpecifications.length === 0 && enabledSpecificationFields.length > 0 ? 10 : 0,
      briefHighlights.filter((item) => item.trim()).length >= 3 ? 10 : 0,
      formData.metaTitle.trim() ? 5 : 0,
      formData.metaDescription.trim() ? 5 : 0,
      formData.shippingWeight.trim() || formData.packageSize.trim() ? 5 : 0,
      selectedParentSlug ? 10 : 0,
      selectedSubcategorySlug ? 10 : 0,
    ];
    return checkpoints.reduce((sum, item) => sum + item, 0);
  }, [
    formData.title,
    formData.shortDescription,
    formData.longDescription,
    formData.price,
    formData.stock,
    formData.brand,
    missingRequiredSpecifications.length,
    enabledSpecificationFields.length,
    briefHighlights,
    formData.metaTitle,
    formData.metaDescription,
    formData.shippingWeight,
    formData.packageSize,
    hasVariantPricing,
    images.length,
    selectedParentSlug,
    selectedSubcategorySlug,
  ]);

  const seoScore = useMemo(() => {
    let score = 0;
    if (seoState.quality.title === 'good') score += 30;
    if (seoState.quality.description === 'good') score += 30;
    if (formData.searchTags.split(',').map((tag) => tag.trim()).filter(Boolean).length >= 3) score += 20;
    if ((formData.ogTitle.trim() || formData.metaTitle.trim() || generatedSeoDefaults.ogTitle).length >= 30) score += 10;
    if (seoState.quality.slug === 'good') score += 10;
    return score;
  }, [formData.metaTitle, formData.metaDescription, formData.searchTags, formData.ogTitle, generatedSeoDefaults.ogTitle, seoState.quality.description, seoState.quality.slug, seoState.quality.title]);

  const validationChecklist = useMemo(
    () => [
      { label: 'Parent category selected', done: Boolean(selectedParentSlug) },
      { label: 'Subcategory selected', done: Boolean(selectedSubcategorySlug) },
      {
        label: 'Title and short description added',
        done: Boolean(formData.title.trim() && formData.shortDescription.trim()),
      },
      { label: 'At least one product image', done: images.length > 0 },
      {
        label: 'Price and stock set',
        done: Boolean((formData.price.trim() && formData.stock.trim()) || hasVariantPricing),
      },
      {
        label: 'Brand and shipping details added',
        done: Boolean(formData.brand.trim() && (formData.shippingWeight.trim() || formData.packageSize.trim())),
      },
      {
        label: 'Product specifications completed',
        done: enabledSpecificationFields.length > 0 && missingRequiredSpecifications.length === 0,
      },
      {
        label: 'Brief highlights ready',
        done: briefHighlights.filter((item) => item.trim()).length >= 3,
      },
      {
        label: 'SEO title and description ready',
        done: Boolean(
          normalizeSeoText(formData.metaTitle || generatedSeoDefaults.metaTitle) &&
            normalizeSeoText(formData.metaDescription || generatedSeoDefaults.metaDescription)
        ),
      },
    ],
    [
      formData.brand,
      formData.packageSize,
      formData.price,
      formData.shippingWeight,
      formData.shortDescription,
      formData.stock,
      formData.title,
      hasVariantPricing,
      images.length,
      formData.metaTitle,
      formData.metaDescription,
      enabledSpecificationFields.length,
      briefHighlights,
      generatedSeoDefaults.metaDescription,
      generatedSeoDefaults.metaTitle,
      missingRequiredSpecifications.length,
      selectedParentSlug,
      selectedSubcategorySlug,
    ]
  );

  const completedStepIndexes = useMemo(() => {
  const completed = new Set<number>();
  if (selectedParentSlug && selectedSubcategorySlug) completed.add(0);
  if (formData.title.trim() && formData.shortDescription.trim()) completed.add(1);
  if (images.length > 0) completed.add(2);
  if ((formData.price.trim() && formData.stock.trim()) || hasVariantPricing) completed.add(3);
  if (briefHighlights.filter((item) => item.trim()).length >= 3 && missingRequiredSpecifications.length === 0) completed.add(4);
  if (formData.returnPolicy.trim() && (formData.shippingWeight.trim() || formData.packageSize.trim())) completed.add(5);
  if (formData.metaTitle.trim() || formData.metaDescription.trim() || formData.searchTags.trim()) completed.add(6);
  if (validationChecklist.every((item) => item.done)) completed.add(7);
  return completed;
}, [
  selectedParentSlug,
  selectedSubcategorySlug,
  formData.title,
  formData.shortDescription,
  images.length,
  formData.price,
  formData.stock,
  hasVariantPricing,
  briefHighlights,
  missingRequiredSpecifications.length,
  formData.returnPolicy,
  formData.shippingWeight,
  formData.packageSize,
  formData.metaTitle,
  formData.metaDescription,
  formData.searchTags,
  validationChecklist,
]);

  const estimatedPayloadSizeMb = useMemo(() => {
    const payload = JSON.stringify({
      formData,
      images,
      variants,
      specificationValues,
      briefHighlights,
      boxContents,
      customSpecificationGroups,
      selectedCategoryId,
      selectedParentSlug,
      selectedSubcategorySlug,
    });
    try {
      return new Blob([payload]).size / (1024 * 1024);
    } catch {
      return 0;
    }
  }, [formData, images, variants, specificationValues, selectedCategoryId, selectedParentSlug, selectedSubcategorySlug]);

  const updateVariant = (id: string, key: keyof VariantRow, value: string) => {
    setVariants((prev) => prev.map((variant) => (variant.id === id ? { ...variant, [key]: value } : variant)));
  };

  const updateSpecificationValue = (key: string, value: any) => {
    setSpecificationValues((prev) => ({
      ...prev,
      [key]: value,
    }));

    if (key === 'brand') {
      setFormData((prev) => ({ ...prev, brand: value }));
    }
  };

  const updateHighlight = (index: number, value: string) => {
    setBriefHighlights((current) => {
      const next = [...current];
      next[index] = value;
      return next;
    });
  };

  const updateBoxContent = (index: number, value: string) => {
    setBoxContents((current) => {
      const next = [...current];
      next[index] = value;
      return next;
    });
  };

  const addVariant = () => setVariants((prev) => [...prev, createVariantRow()]);
  const removeVariant = (id: string) => setVariants((prev) => prev.filter((variant) => variant.id !== id));

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name } = e.target;
    let { value } = e.target;

    if (name === 'slug') value = slugifySeo(value);
    if (name === 'metaKeywords') value = value.replace(/\s*,\s*/g, ', ');

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const parentSlug = e.target.value || null;
    const parentCategory = categoryOptions.find((item) => item.slug === parentSlug) || null;
    const nextTemplate = getSpecificationTemplate(parentSlug, '', '', parentSlug);
    const nextCategoryId =
      parentCategory && typeof parentCategory === 'object' && 'id' in parentCategory
        ? String(parentCategory.id || '')
        : '';

    setSelectedParentSlug(parentSlug);
    setSelectedCategoryId(nextCategoryId || null);
    setSelectedSubcategorySlug(null);
    setSpecificationValues((current) => preserveMatchingSpecificationValues(current, nextTemplate));
    setCustomSpecificationGroups([]);
    setDefaultVariantId(null);
    setError('');
  };

  const handleSubcategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const subSlug = e.target.value || null;
    const nextTemplate = getSpecificationTemplate(
      selectedParentSlug,
      subSlug,
      selectedParentCategory?.subcategories.find((subcategory) => subcategory.slug === subSlug)?.name || '',
      selectedParentSlug
    );
    setSelectedSubcategorySlug(subSlug);
    setSpecificationValues((current) => preserveMatchingSpecificationValues(current, nextTemplate));
    setCustomSpecificationGroups([]);
    setDefaultVariantId(null);
    setError('');
  };

  const addImages = async (fileCollection: FileList | File[]) => {
    setError('');
    setUploadProgress(0);
    const encoded = await uploadFilesAsHostedImages(fileCollection, setUploadProgress);
    setImages((prev) => [...prev, ...encoded].slice(0, 8));
    window.setTimeout(() => setUploadProgress(0), 1200);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    try {
      await addImages(e.target.files);
    } catch (uploadError) {
      setError(toUploadErrorMessage(uploadError));
    } finally {
      e.target.value = '';
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setDragActive(false);
    if (!e.dataTransfer.files?.length) return;
    try {
      await addImages(e.dataTransfer.files);
    } catch (uploadError) {
      setError(toUploadErrorMessage(uploadError));
    }
  };

  const handleVariantImageUpload = async (variantId: string, fileList?: FileList | null) => {
    if (!fileList || !fileList.length) return;
    setError('');
    setUploadProgress(0);

    try {
      const urls = await uploadFilesAsHostedImages(fileList, setUploadProgress);
      if (urls[0]) updateVariant(variantId, 'image', urls[0]);
    } catch (uploadError) {
      setError(toUploadErrorMessage(uploadError));
    } finally {
      window.setTimeout(() => setUploadProgress(0), 1200);
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, imageIndex) => imageIndex !== index));
  };

  const setPrimaryImage = (index: number) => {
    setImages((prev) => {
      const next = [...prev];
      const [selected] = next.splice(index, 1);
      return selected ? [selected, ...next] : next;
    });
  };

  const resetDraft = () => {
    localStorage.removeItem(draftStorageKey);
    setFormData(initialFormState);
    setImages([]);
    setVariants([]);
    setSpecificationValues({});
    setBriefHighlights(['', '', '']);
    setBoxContents(['']);
    setCustomSpecificationGroups([]);
    setDefaultVariantId(null);
    setCurrentStep('category');
    setSelectedCategoryId(null);
    setSelectedParentSlug(null);
    setSelectedSubcategorySlug(null);
    setLastSavedAt(null);
    setError('');
  };

  const buildPayload = (): ProductPayload | null => {
    if (!selectedCategoryId || !selectedParentSlug || !selectedSubcategorySlug) {
      return null;
    }

    const normalizedVariants = variants
      .map((variant, index) => ({
        id: variant.id || `variant-${index + 1}`,
        color: enabledVariantDimensions.includes('color') ? variant.color.trim() : '',
        size: enabledVariantDimensions.includes('size') ? variant.size.trim() : '',
        storage: enabledVariantDimensions.includes('storage') ? variant.storage.trim() : '',
        ram: enabledVariantDimensions.includes('ram') ? variant.ram.trim() : '',
        processor: enabledVariantDimensions.includes('processor') ? variant.processor.trim() : '',
        price: variant.price.trim() ? parseFloat(variant.price) : null,
        originalPrice: variant.originalPrice.trim() ? parseFloat(variant.originalPrice) : null,
        stock: variant.stock.trim() ? parseInt(variant.stock, 10) || 0 : null,
        sku: variant.sku.trim(),
        image: variant.image ? String(variant.image).trim() : undefined,
      }))
      .filter((variant) => variant.price !== null && variant.stock !== null);

    const primaryVariant = normalizedVariants[0];

    const basePrice =
      primaryVariant?.price ?? (formData.price.trim() ? parseFloat(formData.price) : 0);

    const baseOriginalPrice =
      primaryVariant?.originalPrice ??
      (formData.originalPrice.trim() ? parseFloat(formData.originalPrice) : basePrice);

    const baseStock =
      primaryVariant?.stock ?? (formData.stock.trim() ? parseInt(formData.stock, 10) || 0 : 0);

    const baseSku =
      primaryVariant?.sku ||
      formData.sku.trim() ||
      `EX-${selectedSubcategorySlug.toUpperCase().replace(/[^A-Z0-9]/g, '')}-${Date.now()}`;

    const normalizedHighlights = briefHighlights.map((item) => item.trim()).filter(Boolean).slice(0, 10);
    const whatsInTheBox = boxContents.map((item) => item.trim()).filter(Boolean).slice(0, 10);
    const searchTags = formData.searchTags
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);
    const normalizedSpecificationValues = normalizeSpecificationValues(
      {
        ...specificationValues,
        brand: formData.brand.trim() || specificationValues.brand || '',
        ...(!specificationValues.color && primaryVariant?.color ? { color: primaryVariant.color } : {}),
        ...(primaryVariant?.size ? { size: primaryVariant.size } : {}),
        ...(primaryVariant?.storage ? { storage: primaryVariant.storage } : {}),
        ...(primaryVariant?.ram ? { ram: primaryVariant.ram } : {}),
        ...(primaryVariant?.processor ? { processor: primaryVariant.processor } : {}),
      },
      specificationTemplate
    );
    const structuredSpecifications = Object.fromEntries(
      Object.entries(normalizedSpecificationValues).map(([key, value]) => [key, humanizeSpecificationValue(value)])
    );
    const specificationGroups = buildDetailedSpecificationGroups(
      normalizedSpecificationValues,
      specificationTemplate,
      customSpecificationGroups
    );

    const descriptionParts = [
      formData.shortDescription.trim(),
      formData.longDescription.trim(),
      normalizedHighlights.length ? `Key Features:\n- ${normalizedHighlights.join('\n- ')}` : '',
    ].filter(Boolean);
    const resolvedAssignment = resolveCanonicalCategoryAssignment({
      parentCategorySlug: selectedParentSlug,
      categorySlug: selectedParentSlug,
      subcategorySlug: selectedSubcategorySlug,
      templateId: selectedSubcategorySlug,
      title: formData.title.trim(),
    });
    const basePriceAed = formData.priceUae.trim() ? parseFloat(formData.priceUae) : Number.isFinite(basePrice) ? basePrice : 0;
    const baseCompareAed = formData.compareAtPriceUae.trim()
      ? parseFloat(formData.compareAtPriceUae)
      : Number.isFinite(baseOriginalPrice)
      ? baseOriginalPrice
      : Number.isFinite(basePrice)
      ? basePrice
      : 0;
    const pricesByCountry = {
      AE: {
        currency: 'AED',
        price: basePriceAed,
        compareAtPrice: baseCompareAed,
      },
      SA: {
        currency: 'SAR',
        price: formData.priceKsa.trim() ? parseFloat(formData.priceKsa) : convertFromAed(basePriceAed, 'SA'),
        compareAtPrice: formData.compareAtPriceKsa.trim() ? parseFloat(formData.compareAtPriceKsa) : convertFromAed(baseCompareAed, 'SA'),
      },
      QA: {
        currency: 'QAR',
        price: formData.priceQatar.trim() ? parseFloat(formData.priceQatar) : convertFromAed(basePriceAed, 'QA'),
        compareAtPrice: formData.compareAtPriceQatar.trim() ? parseFloat(formData.compareAtPriceQatar) : convertFromAed(baseCompareAed, 'QA'),
      },
      KW: {
        currency: 'KWD',
        price: formData.priceKuwait.trim() ? parseFloat(formData.priceKuwait) : convertFromAed(basePriceAed, 'KW'),
        compareAtPrice: formData.compareAtPriceKuwait.trim() ? parseFloat(formData.compareAtPriceKuwait) : convertFromAed(baseCompareAed, 'KW'),
      },
      BH: {
        currency: 'BHD',
        price: formData.priceBahrain.trim() ? parseFloat(formData.priceBahrain) : convertFromAed(basePriceAed, 'BH'),
        compareAtPrice: formData.compareAtPriceBahrain.trim() ? parseFloat(formData.compareAtPriceBahrain) : convertFromAed(baseCompareAed, 'BH'),
      },
      OM: {
        currency: 'OMR',
        price: formData.priceOman.trim() ? parseFloat(formData.priceOman) : convertFromAed(basePriceAed, 'OM'),
        compareAtPrice: formData.compareAtPriceOman.trim() ? parseFloat(formData.compareAtPriceOman) : convertFromAed(baseCompareAed, 'OM'),
      },
    };

    return {
      categoryId: selectedCategoryId,
      slug: slugifySeo(formData.slug.trim() || formData.title.trim()),
      metaTitle: normalizeSeoText(formData.metaTitle || generatedSeoDefaults.metaTitle),
      metaDescription: normalizeSeoText(formData.metaDescription || generatedSeoDefaults.metaDescription),
      metaKeywords: trimSeoKeywords(formData.metaKeywords || generatedSeoDefaults.metaKeywords || searchTags.join(', ')),
      canonicalUrl: normalizeSeoText(formData.canonicalUrl || generatedSeoDefaults.canonicalUrl || seoPreviewUrl),
      ogTitle: normalizeSeoText(formData.ogTitle || formData.metaTitle || generatedSeoDefaults.ogTitle),
      ogDescription: normalizeSeoText(formData.ogDescription || formData.metaDescription || generatedSeoDefaults.ogDescription),
      ogImage: normalizeSeoText(formData.ogImage),
      sellerId: mode === 'admin' ? 'exshopi_official' : undefined,
      title: formData.title.trim(),
      description: descriptionParts.join('\n\n'),
      price: Number.isFinite(basePrice) ? basePrice : 0,
      priceUae: basePriceAed,
      priceKsa: formData.priceKsa.trim() ? parseFloat(formData.priceKsa) : undefined,
      priceQatar: formData.priceQatar.trim() ? parseFloat(formData.priceQatar) : undefined,
      priceKuwait: formData.priceKuwait.trim() ? parseFloat(formData.priceKuwait) : undefined,
      priceBahrain: formData.priceBahrain.trim() ? parseFloat(formData.priceBahrain) : undefined,
      priceOman: formData.priceOman.trim() ? parseFloat(formData.priceOman) : undefined,
      originalPrice: Number.isFinite(baseOriginalPrice)
        ? baseOriginalPrice
        : Number.isFinite(basePrice)
        ? basePrice
        : 0,
      compareAtPriceUae: baseCompareAed,
      compareAtPriceKsa: formData.compareAtPriceKsa.trim() ? parseFloat(formData.compareAtPriceKsa) : undefined,
      compareAtPriceQatar: formData.compareAtPriceQatar.trim() ? parseFloat(formData.compareAtPriceQatar) : undefined,
      compareAtPriceKuwait: formData.compareAtPriceKuwait.trim() ? parseFloat(formData.compareAtPriceKuwait) : undefined,
      compareAtPriceBahrain: formData.compareAtPriceBahrain.trim() ? parseFloat(formData.compareAtPriceBahrain) : undefined,
      compareAtPriceOman: formData.compareAtPriceOman.trim() ? parseFloat(formData.compareAtPriceOman) : undefined,
      salePrice:
        Number.isFinite(baseOriginalPrice) &&
        Number.isFinite(basePrice) &&
        baseOriginalPrice > basePrice
          ? basePrice
          : undefined,
      image: images[0] || '',
      images: images.slice(1),
      stock: baseStock,
      sku: baseSku,
      brand: formData.brand.trim(),
      status: mode === 'admin' ? 'live' : 'pending',
      specs: {
        templateId: selectedSubcategorySlug,
        templateName: selectedSubcategory?.name || selectedSubcategorySlug,
        categoryTemplateKey: specificationTemplate.key,
        shortDescription: formData.shortDescription.trim(),
        longDescription: formData.longDescription.trim(),
        specificationValues: normalizedSpecificationValues,
        specifications: structuredSpecifications,
        specificationGroups,
        additionalSpecificationGroups: customSpecificationGroups,
        attributes: {
          ...structuredSpecifications,
          brand: formData.brand.trim(),
          subcategory: selectedSubcategorySlug,
        },
        variants: normalizedVariants,
        defaultVariantId: defaultVariantId || normalizedVariants[0]?.id || undefined,
        briefHighlights: normalizedHighlights,
        keyFeatures: normalizedHighlights,
        whatsInTheBox,
        searchTags,
        variantAttributes: enabledVariantDimensions,
        basePriceAED: basePriceAed,
        pricesByCountry,
        metaTitle: normalizeSeoText(formData.metaTitle || generatedSeoDefaults.metaTitle),
        metaDescription: normalizeSeoText(formData.metaDescription || generatedSeoDefaults.metaDescription),
        metaKeywords: trimSeoKeywords(formData.metaKeywords || generatedSeoDefaults.metaKeywords || searchTags.join(', ')),
        canonicalUrl: normalizeSeoText(formData.canonicalUrl || generatedSeoDefaults.canonicalUrl || seoPreviewUrl),
        ogTitle: normalizeSeoText(formData.ogTitle || formData.metaTitle || generatedSeoDefaults.ogTitle),
        ogDescription: normalizeSeoText(formData.ogDescription || formData.metaDescription || generatedSeoDefaults.ogDescription),
        ogImage: normalizeSeoText(formData.ogImage),
        shippingWeight: formData.shippingWeight.trim(),
        packageSize: formData.packageSize.trim(),
        returnPolicy: formData.returnPolicy.trim(),
        warrantyPolicy: formData.warrantyPolicy.trim(),
        sellerNotes: formData.sellerNotes.trim(),
        listingCompleteness,
        seoScore,
        parentCategorySlug: resolvedAssignment.parentCategorySlug || selectedParentSlug || '',
        categorySlug: resolvedAssignment.categorySlug || selectedParentSlug || '',
        subcategorySlug: resolvedAssignment.subcategorySlug || selectedSubcategorySlug || '',
        parentCategoryName: resolvedAssignment.parentCategoryName || selectedParentCategory?.name || '',
        categoryName: resolvedAssignment.categoryName || selectedParentCategory?.name || '',
        subcategoryName: resolvedAssignment.subcategoryName || selectedSubcategory?.name || '',
        categoryPath:
          resolvedAssignment.categoryPath ||
          [selectedParentSlug, resolvedAssignment.categorySlug, selectedSubcategorySlug].filter(Boolean).join('/'),
        approvalStatus: mode === 'admin' ? 'approved' : 'pending',
        productStatus:
          mode === 'admin'
            ? 'live'
            : baseStock <= 0
            ? 'out_of_stock'
            : 'pending_approval',
        visibilityStatus: mode === 'admin' ? 'live' : 'pending',
        ownership: mode === 'admin' ? 'official' : 'seller',
        createdByRole: mode === 'admin' ? 'admin' : 'seller',
        badges:
          mode === 'admin'
            ? ['ExShopi Official', selectedSubcategory?.name || 'Catalog']
            : ['Pending Review', selectedSubcategory?.name || 'Catalog'],
      },
    };
  };
  const validateForm = () => {
    if (!selectedParentSlug) return 'Please select a parent category.';
    if (!selectedSubcategorySlug) return 'Please select a subcategory.';
    if (!formData.title.trim()) return 'Product title is required.';
    if (!formData.price.trim() && !hasVariantPricing) return 'Price is required.';
    if (!formData.stock.trim() && !hasVariantPricing) return 'Stock quantity is required.';
    if (images.length === 0) return 'Please upload at least one product image.';
    if (!formData.brand.trim()) return 'Brand is required.';
    if (!slugifySeo(formData.slug.trim() || formData.title.trim())) return 'SEO slug is required.';
    if (slugCheckState === 'duplicate') return 'SEO slug must be unique. Please choose another slug.';
    if (missingRequiredSpecifications.length > 0) {
      return `Complete Product Specifications before publishing: ${missingRequiredSpecifications.join(', ')}.`;
    }
    if (briefHighlights.map((item) => item.trim()).filter(Boolean).length < 3) {
      return 'Add at least 3 brief highlights before publishing.';
    }
    if (
      variants.some(
        (variant) =>
          ((enabledVariantDimensions.includes('color') && variant.color.trim()) ||
            (enabledVariantDimensions.includes('size') && variant.size.trim()) ||
            (enabledVariantDimensions.includes('storage') && variant.storage.trim()) ||
            (enabledVariantDimensions.includes('ram') && variant.ram.trim()) ||
            (enabledVariantDimensions.includes('processor') && variant.processor.trim()) ||
            variant.price.trim() ||
            variant.stock.trim() ||
            variant.sku.trim()) &&
          (!variant.price.trim() || !variant.stock.trim())
      )
    ) {
      return 'Each variant row needs at least a price and stock quantity.';
    }
    if (!normalizeSeoText(formData.metaTitle || generatedSeoDefaults.metaTitle)) {
      return 'SEO title is required before publishing.';
    }
    if (!normalizeSeoText(formData.metaDescription || generatedSeoDefaults.metaDescription)) {
      return 'SEO description is required before publishing.';
    }
    return null;
  };

  const buildProductPayload = () => buildPayload();

  const saveDraft = async () => {
    if (loading) return;
    setLoading(true);
    setError('');

    if (mode === 'admin') {
      try {
        const payload = buildProductPayload();
        localStorage.setItem('admin_product_draft', JSON.stringify(payload));
        setAutosaveState('saved');
        setLastSavedAt(new Date().toISOString());
        window.setTimeout(() => setAutosaveState('idle'), 1400);
        return;
      } catch (draftError: unknown) {
        setError(getErrorMessage(draftError, 'Failed to save draft'));
      } finally {
        setLoading(false);
      }
    }

    try {
      localStorage.setItem(
        draftStorageKey,
        JSON.stringify({
          formData,
          images,
          variants,
          specificationValues,
          briefHighlights,
          boxContents,
          customSpecificationGroups,
          defaultVariantId,
          currentStep,
          selectedCategoryId,
          selectedParentSlug,
          selectedSubcategorySlug,
          savedAt: new Date().toISOString(),
        })
      );
      setAutosaveState('saved');
      setLastSavedAt(new Date().toISOString());
      window.setTimeout(() => setAutosaveState('idle'), 1400);
    } catch (draftError: unknown) {
      setError(getErrorMessage(draftError, 'Failed to save draft'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError('');

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      setCurrentStep(
        validationError.toLowerCase().includes('specification') ? 'specs' : 'category'
      );
      return;
    }

    const payload = buildProductPayload();
    if (!payload) {
      setError('Unable to build listing payload. Category mapping is missing.');
      return;
    }

    if (estimatedPayloadSizeMb > 70) {
      setError('Listing payload is too large. Please reduce image size or number of images.');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'admin') {
        await (editingId
          ? adminProductAPI.update(editingId, payload)
          : adminProductAPI.create(payload));
        try {
          localStorage.removeItem('admin_product_draft');
        } catch {}
      } else if (editingId) {
        await productAPI.update(editingId, payload);
      } else {
        await productAPI.create(payload);
      }

      localStorage.removeItem(draftStorageKey);
      // Clear new draft persistence as well
      clearDraft();
      setSuccess(true);

      navigate(mode === 'admin' ? '/admin/products' : '/seller/products');
    } catch (submitError: unknown) {
      setError('Product creation failed. Please check pricing or required fields.');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
   if (currentStep === 'category') {
  return (
    <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 md:p-6">
      <div className="mb-5">
        <h2 className="text-2xl font-black text-slate-900">Category Selection</h2>
        <p className="mt-2 text-sm text-slate-500">
          Select parent category first, then subcategory. Saved category mapping controls homepage placement and category page filtering.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-bold text-slate-700">Parent Category</label>
          <select
            value={selectedParentSlug || ''}
            onChange={handleCategoryChange}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
          >
            <option value="">Select parent category</option>
            {categoryOptions.map((category) => (
              <option key={category.id} value={category.slug}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-bold text-slate-700">Subcategory</label>
          <select
            value={selectedSubcategorySlug || ''}
            onChange={handleSubcategoryChange}
            disabled={!selectedParentCategory}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
          >
            <option value="">Select subcategory</option>
            {(selectedParentCategory?.subcategories || []).map((subcategory) => (
              <option key={subcategory.slug} value={subcategory.slug}>
                {subcategory.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Saved Mapping</p>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl bg-white p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Parent Slug</p>
            <p className="mt-2 text-sm font-bold text-slate-900">{selectedParentSlug || 'Not selected'}</p>
          </div>
          <div className="rounded-2xl bg-white p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Subcategory Slug</p>
            <p className="mt-2 text-sm font-bold text-slate-900">{selectedSubcategorySlug || 'Not selected'}</p>
          </div>
          <div className="rounded-2xl bg-white p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Category Path</p>
            <p className="mt-2 text-sm font-bold text-slate-900">
              {selectedParentSlug && selectedSubcategorySlug
                ? `${selectedParentSlug}/${selectedSubcategorySlug}`
                : 'Not selected'}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

    if (currentStep === 'basic') {
      return (
        <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-5 rounded-[1.75rem] border border-slate-200 bg-white p-6">
            <div>
              <h2 className="text-xl font-black text-slate-900">Basic Product Identity</h2>
              <p className="mt-1 text-sm text-slate-500">
                Add the product title, short description, and long description.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-900">Product Title *</label>
              <input
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                placeholder="e.g. Apple MacBook Pro 13-inch A1502 2015"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-900">Brand *</label>
              <input
                name="brand"
                value={formData.brand}
                onChange={handleInputChange}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                placeholder="Apple, Dell, Samsung..."
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-900">Short Description *</label>
              <textarea
                name="shortDescription"
                value={formData.shortDescription}
                onChange={handleInputChange}
                rows={3}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                placeholder="Write a short marketplace-ready summary."
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-900">Long Description</label>
              <textarea
                name="longDescription"
                value={formData.longDescription}
                onChange={handleInputChange}
                rows={8}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                placeholder="Describe condition, highlights, usage, and buyer value."
              />
            </div>
          </div>

          <div className="space-y-5 rounded-[1.75rem] border border-slate-200 bg-white p-6">
            <div>
              <h3 className="text-lg font-black text-slate-900">Quick Quality Check</h3>
              <p className="mt-1 text-sm text-slate-500">
                These signals help improve listing quality before publish.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">Title Quality</p>
                <p className="mt-2 text-base font-black text-slate-900">{titleQuality}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">Completeness</p>
                <p className="mt-2 text-base font-black text-slate-900">{formatPercent(listingCompleteness)}</p>
              </div>
            </div>
          </div>
        </section>
      );
    }

    if (currentStep === 'media') {
      return (
        <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-6 rounded-[1.75rem] border border-slate-200 bg-white p-6">
            <div>
              <h2 className="text-xl font-black text-slate-900">Product Images</h2>
              <p className="mt-1 text-sm text-slate-500">
                Upload clean product images. Primary image is used for cards, homepage, and category pages.
              </p>
            </div>

            <label
              className={`block rounded-[1.75rem] border-2 border-dashed p-8 text-center transition ${
                dragActive ? 'border-blue-500 bg-blue-50' : 'border-slate-300 bg-white'
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
            >
              <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100">
                <Upload className="h-8 w-8 text-blue-600" />
              </div>
              <p className="text-base font-bold text-slate-900">Upload from PC or drag & drop</p>
              <p className="mt-2 text-sm font-medium text-slate-500">
                Max 8 images • Primary image will appear on homepage
              </p>
              {uploadProgress > 0 ? (
                <div className="mx-auto mt-4 h-2 max-w-sm rounded-full bg-slate-200">
                  <div className="h-2 rounded-full bg-blue-600" style={{ width: `${uploadProgress}%` }} />
                </div>
              ) : null}
            </label>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {images.map((image, index) => (
                <div key={`${image}-${index}`} className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white">
                  <div className="relative aspect-square bg-slate-100">
                    <img src={image} alt={`product-${index + 1}`} className="h-full w-full object-cover" />
                    {index === 0 ? (
                      <span className="absolute left-3 top-3 rounded-full bg-blue-600 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-white">
                        Primary
                      </span>
                    ) : null}
                  </div>
                  <div className="flex items-center justify-between gap-2 p-3">
                    <button
                      type="button"
                      onClick={() => setPrimaryImage(index)}
                      className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                    >
                      Make Primary
                    </button>
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="rounded-xl border border-rose-200 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <aside className="space-y-5 rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-blue-50 p-3 text-blue-600">
                <ImagePlus className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Image Quality</p>
                <h3 className="mt-2 text-xl font-black text-slate-900">{imageQuality}</h3>
              </div>
            </div>
            <div className="space-y-3">
              {[
                'Use 1:1 or clean portrait images.',
                'Avoid watermarks or promotional overlays.',
                'Show actual accessories for used electronics.',
                'First image should clearly show the actual item.',
              ].map((item) => (
                <div key={item} className="rounded-2xl border border-slate-200 px-4 py-4 text-sm font-medium text-slate-600">
                  {item}
                </div>
              ))}
            </div>
          </aside>
        </section>
      );
    }

    if (currentStep === 'pricing') {
      return (
        <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-6 rounded-[1.75rem] border border-slate-200 bg-white p-6">
            <div>
              <h2 className="text-xl font-black text-slate-900">Pricing & Inventory</h2>
              <p className="mt-1 text-sm text-slate-500">
                Set your AED base price, then override any GCC market manually when needed. Leave country fields empty to auto-convert from AED.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">Legacy / Base Price *</label>
                <input
                  name="price"
                  type="number"
                  value={formData.price}
                  onChange={handleInputChange}
                  placeholder="599"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              {GCC_PRICE_FIELDS.map(({ code, priceKey, compareKey }) => {
                const countryConfig = COUNTRY_CONFIG[code];
                const fallbackPrice = formData.priceUae.trim()
                  ? convertFromAed(formData.priceUae, code)
                  : formData.price.trim()
                    ? convertFromAed(formData.price, code)
                    : 0;
                const fallbackCompare = formData.compareAtPriceUae.trim()
                  ? convertFromAed(formData.compareAtPriceUae, code)
                  : formData.originalPrice.trim()
                    ? convertFromAed(formData.originalPrice, code)
                    : 0;

                return (
                  <React.Fragment key={code}>
                    <div>
                      <label className="mb-2 block text-sm font-bold text-slate-700">
                        {countryConfig.shortName} Price ({countryConfig.currency})
                      </label>
                      <input
                        name={priceKey}
                        type="number"
                        value={formData[priceKey]}
                        onChange={handleInputChange}
                        placeholder={fallbackPrice ? String(fallbackPrice) : countryConfig.currency}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                      />
                      <p className="mt-2 text-xs text-slate-500">
                        Leave blank to auto-convert from the AED base price.
                      </p>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-bold text-slate-700">
                        {countryConfig.shortName} Compare Price ({countryConfig.currency})
                      </label>
                      <input
                        name={compareKey}
                        type="number"
                        value={formData[compareKey]}
                        onChange={handleInputChange}
                        placeholder={fallbackCompare ? String(fallbackCompare) : countryConfig.currency}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                      />
                      <p className="mt-2 text-xs text-slate-500">
                        Optional manual strike-through price for {countryConfig.shortName}.
                      </p>
                    </div>
                  </React.Fragment>
                );
              })}

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">Stock *</label>
                <input
                  name="stock"
                  type="number"
                  value={formData.stock}
                  onChange={handleInputChange}
                  placeholder="12"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">SKU</label>
                <input
                  name="sku"
                  value={formData.sku}
                  onChange={handleInputChange}
                  placeholder="EX-MBP-001"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                />
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-slate-900">Variants</h3>
                  <p className="mt-1 text-sm text-slate-500">Optional. Use for color, storage, RAM, size, processor, etc.</p>
                </div>
                <button
                  type="button"
                  onClick={addVariant}
                  className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800"
                >
                  Add Variant
                </button>
              </div>

              <div className="space-y-4">
                {variants.map((variant) => (
                  <div key={variant.id} className="rounded-[1.25rem] border border-slate-200 bg-white p-4">
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          checked={defaultVariantId === variant.id}
                          onChange={() => setDefaultVariantId(variant.id)}
                        />
                        <span className="text-sm font-bold text-slate-700">Set as default variant</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeVariant(variant.id)}
                        className="rounded-xl border border-rose-200 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50"
                      >
                        Remove
                      </button>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                      {VARIANT_FIELD_OPTIONS.filter(({ key }) => {
                        if (['price', 'originalPrice', 'stock', 'sku'].includes(key)) return true;
                        return enabledVariantDimensions.includes(key as VariantDimensionKey);
                      }).map(({ key, label }) => (
                        <div key={key}>
                          <label className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                            {label}
                          </label>
                          <input
                            type={key === 'price' || key === 'originalPrice' || key === 'stock' ? 'number' : 'text'}
                            value={variant[key]}
                            onChange={(e) => updateVariant(variant.id, key, e.target.value)}
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                          />
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 flex items-center gap-4">
                      <label className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50">
                        Upload Variant Image
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleVariantImageUpload(variant.id, e.target.files)}
                        />
                      </label>
                      {variant.image ? (
                        <img src={variant.image} alt="variant" className="h-16 w-16 rounded-xl object-cover" />
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <aside className="space-y-5 rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="rounded-2xl border border-slate-200 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Commission Logic</p>
              <p className="mt-2 text-xl font-black text-slate-900">6% ExShopi Fee</p>
              <p className="mt-1 text-sm font-medium text-slate-500">Net estimate after commission only</p>
            </div>

            <div className="rounded-2xl border border-slate-200 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Estimated Net</p>
              <p className="mt-2 text-xl font-black text-emerald-700">
                {(
                  Number(variants[0]?.price || formData.price || 0) -
                  Number(variants[0]?.price || formData.price || 0) * 0.06
                ).toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="mt-1 text-sm font-medium text-slate-500">Before VAT, shipping, and refunds</p>
            </div>
          </aside>
        </section>
      );
    }

   if (currentStep === 'specs') {
      return (
        <ProductSpecificationEditor
          template={specificationTemplate}
          fields={enabledSpecificationFields}
          specificationValues={specificationValues}
          missingRequiredSpecifications={missingRequiredSpecifications}
          briefHighlights={briefHighlights}
          onSpecificationChange={updateSpecificationValue}
          onHighlightChange={updateHighlight}
          onAddHighlight={() => setBriefHighlights((current) => (current.length >= 10 ? current : [...current, '']))}
          onRemoveHighlight={(index) =>
            setBriefHighlights((current) =>
              current.length <= 1 ? current : current.filter((_, itemIndex) => itemIndex !== index)
            )
          }
          onMoveHighlight={(index, direction) =>
            setBriefHighlights((current) => moveArrayItem(current, index, direction))
          }
          whatsInTheBox={boxContents}
          onWhatsInTheBoxChange={updateBoxContent}
          onAddWhatsInTheBox={() => setBoxContents((current) => [...current, ''])}
          onRemoveWhatsInTheBox={(index) =>
            setBoxContents((current) =>
              current.length <= 1 ? current : current.filter((_, itemIndex) => itemIndex !== index)
            )
          }
          onMoveWhatsInTheBox={(index, direction) =>
            setBoxContents((current) => moveArrayItem(current, index, direction))
          }
          customGroups={customSpecificationGroups}
          onCustomGroupChange={setCustomSpecificationGroups}
          enabledVariantDimensions={enabledVariantDimensions}
        />
      );
    }
    if (currentStep === 'shipping') {
      return (
        <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-6 rounded-[1.75rem] border border-slate-200 bg-white p-6">
            <h2 className="text-xl font-black text-slate-900">Shipping, Returns & Warranty</h2>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">Shipping Weight</label>
                <input
                  type="text"
                  name="shippingWeight"
                  value={formData.shippingWeight}
                  onChange={handleInputChange}
                  placeholder="e.g. 1.2 kg"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">Package Size</label>
                <input
                  type="text"
                  name="packageSize"
                  value={formData.packageSize}
                  onChange={handleInputChange}
                  placeholder="e.g. 35 x 25 x 8 cm"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-bold text-slate-700">Return Policy</label>
                <textarea
                  name="returnPolicy"
                  value={formData.returnPolicy}
                  onChange={handleInputChange}
                  rows={5}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-bold text-slate-700">Warranty Policy</label>
                <textarea
                  name="warrantyPolicy"
                  value={formData.warrantyPolicy}
                  onChange={handleInputChange}
                  rows={5}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                />
              </div>
            </div>
          </div>

          <aside className="space-y-5 rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Marketplace Trust Rules</p>
              <h3 className="mt-2 text-xl font-black text-slate-900">UAE Fulfillment Readiness</h3>
            </div>
            <div className="space-y-3">
              {[
                'Used devices should clearly disclose condition, health, and included accessories.',
                'Warehouse and pickup settings should match your store profile for smoother dispatch.',
                'Return windows and warranty claims should stay aligned with ExShopi policy.',
              ].map((item) => (
                <div key={item} className="rounded-2xl border border-slate-200 px-4 py-4 text-sm font-medium text-slate-600">
                  {item}
                </div>
              ))}
            </div>
          </aside>
        </section>
      );
    }

    if (currentStep === 'seo') {
      return (
        <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <SEOSettingsCard
            value={formData}
            onChange={handleInputChange}
            onGenerateSeo={applyGeneratedSeo}
            onGenerateSlug={applyGeneratedSlug}
            preview={seoState.preview}
            quality={seoState.quality}
            slugMessage={slugCheckMessage}
            slugState={slugCheckState}
          />

          <aside className="space-y-5 rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">SEO Score</p>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-sm font-bold text-slate-700">SEO Strength</span>
                <span className="text-lg font-black text-violet-700">{seoScore}/100</span>
              </div>
              <div className="mt-3 h-3 rounded-full bg-slate-200">
                <div
                  className="h-3 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500"
                  style={{ width: `${seoScore}%` }}
                />
              </div>
            </div>

            <div className="space-y-3">
              {validationChecklist.map((item) => (
                <div key={item.label} className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3">
                  <span className="text-sm font-medium text-slate-600">{item.label}</span>
                  <span
                    className={`rounded-full px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] ${
                      item.done ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {item.done ? 'Done' : 'Missing'}
                  </span>
                </div>
              ))}
            </div>

            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Publishing Rules</p>
              <div className="mt-4 space-y-3 text-sm font-medium text-slate-600">
                <p>Meta title and meta description are required before publishing.</p>
                <p>SEO slug must stay unique and category-aware for clean marketplace URLs.</p>
                <p>Canonical and OG fields are optional, but they help search engines and social previews stay consistent.</p>
              </div>
            </div>
          </aside>
        </section>
      );
    }

    if (currentStep === 'preview') {
      return (
        <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-6 rounded-[1.75rem] border border-slate-200 bg-white p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Preview</p>
                <h2 className="mt-2 text-2xl font-black text-slate-900">{formData.title || 'Untitled product'}</h2>
                <p className="mt-2 text-sm text-slate-500">
                  {selectedParentCategory?.name || 'No category'} / {selectedSubcategory?.name || 'No subcategory'}
                </p>
              </div>
              <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700">
                {mode === 'admin' ? 'Admin Publish' : 'Seller Submit'}
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-[0.9fr_1.1fr]">
              <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-50">
                <div className="aspect-square">
                  {images[0] ? (
                    <img src={images[0]} alt="preview" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm font-bold text-slate-400">
                      No primary image
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Pricing</p>
                  <p className="mt-2 text-2xl font-black text-slate-900">
                    AED {Number(variants[0]?.price || formData.price || 0).toLocaleString()}
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-500">
                    Stock: {variants[0]?.stock || formData.stock || 0}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Summary</p>
                  <p className="mt-2 text-sm font-medium leading-6 text-slate-600">
                    {formData.shortDescription || 'No short description yet.'}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Ready for Homepage</p>
                  <p className="mt-2 text-sm font-medium leading-6 text-slate-600">
                    This product will be saved with category path{' '}
                    <span className="font-bold text-slate-900">
                      {selectedParentSlug && selectedSubcategorySlug
                        ? `${selectedParentSlug}/${selectedSubcategorySlug}`
                        : 'missing'}
                    </span>{' '}
                    so homepage and category pages can filter it correctly.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <aside className="space-y-5 rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Submission Summary</p>
              <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-900">Ready for Approval Queue</h3>
            </div>
            <div className="space-y-3">
              {[
                `Brand: ${formData.brand || 'Not set'}`,
                `SKU: ${variants[0]?.sku || formData.sku || 'Auto-generate on submit'}`,
                `Options: ${variants.length ? `${variants.length} saved combinations` : 'No variants added'}`,
                `Specifications: ${enabledSpecificationFields.length - missingRequiredSpecifications.length}/${enabledSpecificationFields.length} completed`,
                `Search tags: ${formData.searchTags || 'No tags added'}`,
                `Images: ${images.length} uploaded`,
              ].map((item) => (
                <div key={item} className="rounded-2xl border border-slate-200 px-4 py-4 text-sm font-medium text-slate-600">
                  {item}
                </div>
              ))}
            </div>
          </aside>
        </section>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-4 md:p-8">
      <div className="w-full max-w-none">
        <button
          onClick={() => navigate(mode === 'admin' ? '/admin/products' : '/seller/products')}
          className="mb-8 flex items-center gap-2 font-medium text-slate-600 transition-colors hover:text-slate-900"
          type="button"
        >
          <ArrowLeft className="h-5 w-5" />
          Back to Products
        </button>

        <form onSubmit={handleSubmit}>
          <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/60 md:p-10">
            <div className="mb-10 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-blue-700">
                  <Sparkles className="h-4 w-4" />
                  {mode === 'admin' ? 'Admin Workspace' : 'Seller Workspace'}
                </div>
                <h1 className="text-3xl font-black tracking-tight text-slate-900 md:text-4xl">
                  {editingId ? 'Edit marketplace listing' : 'Add a product'}
                </h1>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 md:text-base">
                  Build a professional ExShopi listing with category mapping, pricing, media, specifications,
                  shipping, SEO, and review-ready submission details.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-3">
                <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Completeness</p>
                  <p className="mt-2 text-2xl font-black text-slate-900">{formatPercent(listingCompleteness)}</p>
                </div>
                <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">SEO Score</p>
                  <p className="mt-2 text-2xl font-black text-violet-700">{seoScore}</p>
                </div>
                <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Draft Status</p>
                  <p className="mt-2 text-lg font-black text-slate-900">
                    {autosaveState === 'saved' ? 'Saved' : 'Autosave Active'}
                  </p>
                  <p className="mt-1 text-xs font-medium text-slate-500">
                    {lastSavedAt ? `Last saved ${new Date(lastSavedAt).toLocaleString()}` : 'No local draft yet'}
                  </p>
                </div>
              </div>
            </div>

            {error ? (
              <div className="mb-8 flex items-center gap-3 rounded-[1.25rem] border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-semibold text-rose-700">
                <AlertCircle className="h-5 w-5" />
                {error}
              </div>
            ) : null}

            {success ? (
              <div className="mb-8 flex items-center gap-3 rounded-[1.25rem] border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-700">
                <CheckCircle2 className="h-5 w-5" />
                Product saved successfully.
              </div>
            ) : null}

            <div className="grid gap-4 lg:grid-cols-4 xl:grid-cols-8">
              {stepMeta.map((step, index) => (
                <ListingStepBadge
                  key={step.id}
                  step={step}
                  index={index}
                  active={currentStep === step.id}
                  completed={completedStepIndexes.has(index)}
                  onClick={() => setCurrentStep(step.id)}
                />
              ))}
            </div>

           <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_420px]">
  <div>{renderStepContent()}</div>

  <aside className="h-fit rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex items-center gap-3">
      <div className="rounded-2xl bg-violet-50 p-3 text-violet-700">
        <Eye className="h-5 w-5" />
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Preview Helper</p>
        <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-900">Missing Fields Checker</h3>
      </div>
    </div>

    <div className="mt-5 space-y-3">
      {validationChecklist.map((item) => (
        <div
          key={item.label}
          className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-4"
        >
          <span className="text-sm font-medium text-slate-600">{item.label}</span>
          <span
            className={`rounded-full px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] ${
              item.done ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
            }`}
          >
            {item.done ? 'Done' : 'Missing'}
          </span>
        </div>
      ))}
    </div>
  </aside>
</div>

            <div className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-6 md:flex-row md:items-center md:justify-between">
  <div className="flex flex-wrap items-center gap-3">
    {currentStep !== 'category' ? (
      <button
        type="button"
        onClick={() =>
          setCurrentStep(stepMeta[Math.max(0, stepMeta.findIndex((step) => step.id === currentStep) - 1)].id)
        }
        className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-100"
      >
        Previous Step
      </button>
    ) : null}

    {currentStep !== 'preview' ? (
      <button
        type="button"
        onClick={() =>
          setCurrentStep(
            stepMeta[Math.min(stepMeta.length - 1, stepMeta.findIndex((step) => step.id === currentStep) + 1)].id
          )
        }
        className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-black text-white transition hover:bg-slate-800"
      >
        <span className="inline-flex items-center gap-2">
          Next Step
          <ChevronRight className="h-4 w-4" />
        </span>
      </button>
    ) : null}
  </div>
                            <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={resetDraft}
                  className="rounded-2xl border border-rose-200 px-4 py-3 text-sm font-black text-rose-600 transition hover:bg-rose-50"
                >
                  Reset
                </button>

                <button
                  type="button"
                  onClick={saveDraft}
                  disabled={loading}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                >
                  <span className="inline-flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    Save Draft
                  </span>
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-200 transition hover:opacity-95 disabled:opacity-60"
                >
                  {loading
                    ? 'Submitting...'
                    : mode === 'admin'
                    ? editingId
                      ? 'Update & Publish'
                      : 'Publish Product'
                    : editingId
                    ? 'Save & Resubmit for Approval'
                    : 'Submit for Approval'}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
