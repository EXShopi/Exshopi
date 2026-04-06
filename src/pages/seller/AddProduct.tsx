import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Eye,
  ImagePlus,
  LayoutTemplate,
  PackageSearch,
  Save,
  Sparkles,
  Upload,
  X,
} from 'lucide-react';
import { adminProductAPI, categoryAPI, productAPI } from '../../services/api';
import { sellerAPI } from '../../services/api';
import { useAuthStore } from '../../store/auth';
import { fileToDataUrl, uploadImageDataUrl } from '../../lib/uploadClient';
import { compressImage } from '../../lib/imageUtils';
import { LAUNCH_LISTING_TEMPLATES } from '../../lib/marketplaceTemplates';

type FormState = {
  title: string;
  shortDescription: string;
  longDescription: string;
  price: string;
  originalPrice: string;
  stock: string;
  sku: string;
  brand: string;
  keyFeatures: string;
  whatsInTheBox: string;
  searchTags: string;
  metaTitle: string;
  metaDescription: string;
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
const MASTER_CATEGORIES: LiveCategory[] = [
  {
    id: 'electronics',
    name: 'Electronics',
    slug: 'electronics',
    subcategories: [
      { id: 'computers', name: 'Computers', slug: 'computers' },
      { id: 'mobiles-tablets', name: 'Mobiles & Tablets', slug: 'mobiles-tablets' },
      { id: 'tv-video', name: 'TV & Video', slug: 'tv-video' },
      { id: 'cameras-photo', name: 'Cameras & Photo', slug: 'cameras-photo' },
      { id: 'audio', name: 'Audio', slug: 'audio' },
      { id: 'gaming', name: 'Gaming', slug: 'gaming' },
    ],
  },
  {
    id: 'fashion',
    name: 'Fashion',
    slug: 'fashion',
    subcategories: [
      { id: 'clothing', name: 'Clothing', slug: 'clothing' },
      { id: 'mens', name: "Men's", slug: 'mens' },
      { id: 'womens', name: "Women's", slug: 'womens' },
      { id: 'kids', name: 'Kids', slug: 'kids' },
      { id: 'shoes', name: 'Shoes', slug: 'shoes' },
      { id: 'bags', name: 'Bags', slug: 'bags' },
      { id: 'watches', name: 'Watches', slug: 'watches' },
      { id: 'accessories', name: 'Accessories', slug: 'accessories' },
    ],
  },
  {
    id: 'home-kitchen-appliances',
    name: 'Home / Kitchen / Appliances',
    slug: 'home-kitchen-appliances',
    subcategories: [
      { id: 'kitchen-appliances', name: 'Kitchen Appliances', slug: 'kitchen-appliances' },
      { id: 'home-appliances', name: 'Home Appliances', slug: 'home-appliances' },
      { id: 'furniture', name: 'Furniture', slug: 'furniture' },
      { id: 'decor', name: 'Decor', slug: 'decor' },
      { id: 'cleaning', name: 'Cleaning', slug: 'cleaning' },
      { id: 'storage-organization', name: 'Storage & Organization', slug: 'storage-organization' },
    ],
  },
  {
    id: 'beauty-health',
    name: 'Beauty / Health',
    slug: 'beauty-health',
    subcategories: [
      { id: 'makeup', name: 'Makeup', slug: 'makeup' },
      { id: 'skincare', name: 'Skincare', slug: 'skincare' },
      { id: 'haircare', name: 'Haircare', slug: 'haircare' },
      { id: 'grooming', name: 'Grooming', slug: 'grooming' },
      { id: 'perfumes', name: 'Perfumes', slug: 'perfumes' },
    ],
  },
  {
    id: 'grocery-daily-use',
    name: 'Grocery / Daily Use',
    slug: 'grocery-daily-use',
    subcategories: [
      { id: 'snacks', name: 'Snacks', slug: 'snacks' },
      { id: 'beverages', name: 'Beverages', slug: 'beverages' },
      { id: 'household-essentials', name: 'Household essentials', slug: 'household-essentials' },
    ],
  },
  {
    id: 'baby-toys',
    name: 'Baby / Toys',
    slug: 'baby-toys',
    subcategories: [
      { id: 'baby-products', name: 'Baby products', slug: 'baby-products' },
      { id: 'kids-products', name: 'Kids products', slug: 'kids-products' },
      { id: 'toys', name: 'Toys', slug: 'toys' },
    ],
  },
  {
    id: 'sports-outdoors',
    name: 'Sports / Outdoors',
    slug: 'sports-outdoors',
    subcategories: [
      { id: 'fitness', name: 'Fitness', slug: 'fitness' },
      { id: 'outdoor-gear', name: 'Outdoor gear', slug: 'outdoor-gear' },
      { id: 'sports-accessories', name: 'Sports accessories', slug: 'sports-accessories' },
    ],
  },
  {
    id: 'automotive-tools',
    name: 'Automotive / Tools',
    slug: 'automotive-tools',
    subcategories: [
      { id: 'car-accessories', name: 'Car accessories', slug: 'car-accessories' },
      { id: 'tools', name: 'Tools', slug: 'tools' },
      { id: 'diy', name: 'DIY', slug: 'diy' },
    ],
  },
];

const initialFormState: FormState = {
  title: '',
  shortDescription: '',
  longDescription: '',
  price: '',
  originalPrice: '',
  stock: '',
  sku: '',
  brand: '',
  keyFeatures: '',
  whatsInTheBox: '',
  searchTags: '',
  metaTitle: '',
  metaDescription: '',
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

const normalizeLiveCategories = (items: any[]): LiveCategory[] => {
  const source = Array.isArray(items) ? items : [];

  return source
    .map((item: any) => {
      const rawSubs =
        item?.subcategories ||
        item?.children ||
        item?.categories ||
        item?.items ||
        [];

      return {
        id: String(item?.id || item?.slug || item?.name || ''),
        name: String(item?.name || item?.title || ''),
        slug: String(item?.slug || slugifyValue(item?.name || item?.title || '')),
        subcategories: (Array.isArray(rawSubs) ? rawSubs : [])
          .map((subcategory: any) => ({
            id: String(subcategory?.id || subcategory?.slug || subcategory?.name || ''),
            name: String(subcategory?.name || subcategory?.title || ''),
            slug: String(
              subcategory?.slug || slugifyValue(subcategory?.name || subcategory?.title || '')
            ),
          }))
          .filter((subcategory: Subcategory) => subcategory.name && subcategory.slug),
      };
    })
    .filter((category: LiveCategory) => category.name && category.slug);
};

const mergeCategoryOptions = (liveCategories: LiveCategory[], masterCategories: LiveCategory[]) => {
  const merged = new Map<string, LiveCategory>();

  for (const category of masterCategories) {
    merged.set(category.slug, {
      ...category,
      subcategories: [...category.subcategories],
    });
  }

  for (const category of liveCategories) {
    const existing = merged.get(category.slug);
    if (!existing) {
      merged.set(category.slug, {
        ...category,
        subcategories: [...category.subcategories],
      });
      continue;
    }

    const subMap = new Map<string, Subcategory>();
    for (const subcategory of existing.subcategories) subMap.set(subcategory.slug, subcategory);
    for (const subcategory of category.subcategories) {
      subMap.set(subcategory.slug, {
        ...subcategory,
        id: subcategory.id || subMap.get(subcategory.slug)?.id,
      });
    }

    merged.set(category.slug, {
      ...existing,
      ...category,
      id: category.id || existing.id,
      subcategories: Array.from(subMap.values()),
    });
  }

  return Array.from(merged.values());
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
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);


  const categoryOptions = useMemo(
    () => mergeCategoryOptions(categories.length ? categories : MASTER_CATEGORIES, MASTER_CATEGORIES),
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

  const selectedTemplate = useMemo(
    () => LAUNCH_LISTING_TEMPLATES.find((template) => template.id === selectedSubcategorySlug) || null,
    [selectedSubcategorySlug]
  );

  const draftStorageKey = `product-draft:${mode}:${editingId || copyingId || 'new'}`;

  useEffect(() => {
    let mounted = true;

    const ensureAccess = async () => {
      const userId = user?.id || (user as any)?.uid || '';
      if (!userId) {
        navigate(mode === 'admin' ? '/admin/login' : '/seller/login');
        return;
      }

      if (mode === 'admin') {
        const isAdminUser =
          role === 'admin' ||
          role === 'super_admin' ||
          role === 'finance_manager' ||
          role === 'support_agent';
        if (!isAdminUser) {
          navigate('/admin/login');
        }
        return;
      }

      const seller =
        (await sellerAPI.getMyStore().catch(() => null)) ||
        (await sellerAPI.getByUserId(userId).catch(() => null));

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
        setCategories(MASTER_CATEGORIES);
      }
    } catch {
      if (mounted) {
        setCategories(MASTER_CATEGORIES);
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
        const product = await productAPI.get(sourceId);
        if (!product || !mounted) return;

        const nextParentSlug =
          product?.specs?.parentCategorySlug ||
          product?.specs?.categorySlug ||
          product?.category ||
          null;
        const nextSubcategorySlug =
          product?.specs?.subcategorySlug ||
          product?.specs?.attributes?.subcategory ||
          product?.subcategory ||
          null;

        setSelectedCategoryId(product.categoryId ? String(product.categoryId) : null);
        setSelectedParentSlug(nextParentSlug ? String(nextParentSlug) : null);
        setSelectedSubcategorySlug(nextSubcategorySlug ? String(nextSubcategorySlug) : null);

        setFormData({
          title: editingId ? product.title || '' : `${product.title || ''} Copy`.trim(),
          shortDescription: product.specs?.shortDescription || '',
          longDescription: product.specs?.longDescription || product.description || '',
          price: String(product.price ?? ''),
          originalPrice: String(product.originalPrice ?? product.price ?? ''),
          stock: String(product.stock ?? ''),
          sku: editingId ? product.sku || '' : '',
          brand: product.brand || product.specs?.attributes?.brand || '',
          keyFeatures: Array.isArray(product.specs?.keyFeatures) ? product.specs.keyFeatures.join('\n') : '',
          whatsInTheBox: Array.isArray(product.specs?.whatsInTheBox) ? product.specs.whatsInTheBox.join('\n') : '',
          searchTags: Array.isArray(product.specs?.searchTags) ? product.specs.searchTags.join(', ') : '',
          metaTitle: product.specs?.metaTitle || '',
          metaDescription: product.specs?.metaDescription || '',
          shippingWeight: product.specs?.shippingWeight || '',
          packageSize: product.specs?.packageSize || '',
          returnPolicy: product.specs?.returnPolicy || initialFormState.returnPolicy,
          warrantyPolicy: product.specs?.warrantyPolicy || initialFormState.warrantyPolicy,
          sellerNotes: product.specs?.sellerNotes || '',
        });

        setImages([product.image, ...(product.images || [])].filter(Boolean));
        setVariants(
          Array.isArray(product.specs?.variants)
            ? product.specs.variants.map((variant: any, index: number) => ({
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
    defaultVariantId,
    currentStep,
    selectedCategoryId,
    selectedParentSlug,
    selectedSubcategorySlug,
    success,
  ]);

  const titleWords = formData.title.trim().split(/\s+/).filter(Boolean).length;
  const titleQuality =
    titleWords >= 6 && formData.title.trim().length >= 35 ? 'Strong' : titleWords >= 4 ? 'Good' : 'Needs Work';
  const imageQuality =
    images.length >= 4 ? 'Marketplace Ready' : images.length >= 2 ? 'Needs More Images' : 'Insufficient';

  const hasVariantPricing = useMemo(
    () => variants.some((variant) => variant.price.trim() && variant.stock.trim()),
    [variants]
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
    if (formData.metaTitle.trim().length >= 30) score += 35;
    if (formData.metaDescription.trim().length >= 80) score += 35;
    if (formData.searchTags.split(',').map((tag) => tag.trim()).filter(Boolean).length >= 3) score += 20;
    if (formData.title.trim().length >= 35) score += 10;
    return score;
  }, [formData.metaTitle, formData.metaDescription, formData.searchTags, formData.title]);

 const validationChecklist = [
  { label: 'Parent category selected', done: Boolean(selectedParentSlug) },
  { label: 'Subcategory selected', done: Boolean(selectedSubcategorySlug) },
  { label: 'Title and short description added', done: Boolean(formData.title.trim() && formData.shortDescription.trim()) },
  { label: 'At least one product image', done: images.length > 0 },
  { label: 'Price and stock set', done: Boolean((formData.price.trim() && formData.stock.trim()) || hasVariantPricing) },
  { label: 'Brand and shipping details added', done: Boolean(formData.brand.trim() && (formData.shippingWeight.trim() || formData.packageSize.trim())) },
];

  const completedStepIndexes = useMemo(() => {
  const completed = new Set<number>();
  if (selectedParentSlug && selectedSubcategorySlug) completed.add(0);
  if (formData.title.trim() && formData.shortDescription.trim()) completed.add(1);
  if (images.length > 0) completed.add(2);
  if ((formData.price.trim() && formData.stock.trim()) || hasVariantPricing) completed.add(3);
  if (formData.keyFeatures.trim() || formData.whatsInTheBox.trim()) completed.add(4);
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
  formData.keyFeatures,
  formData.whatsInTheBox,
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
      selectedCategoryId,
      selectedParentSlug,
      selectedSubcategorySlug,
    });
    try {
      return new Blob([payload]).size / (1024 * 1024);
    } catch {
      return 0;
    }
  }, [formData, images, variants, selectedCategoryId, selectedParentSlug, selectedSubcategorySlug]);

  const updateVariant = (id: string, key: keyof VariantRow, value: string) => {
    setVariants((prev) => prev.map((variant) => (variant.id === id ? { ...variant, [key]: value } : variant)));
  };

  const addVariant = () => setVariants((prev) => [...prev, createVariantRow()]);
  const removeVariant = (id: string) => setVariants((prev) => prev.filter((variant) => variant.id !== id));

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
  const parentSlug = e.target.value || null;
  const parentCategory = categoryOptions.find((item) => item.slug === parentSlug) || null;

  setSelectedParentSlug(parentSlug);
  setSelectedCategoryId(parentCategory?.id || null);
  setSelectedSubcategorySlug(null);
  setError(null);
};

const handleSubcategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
  const subSlug = e.target.value || null;
  setSelectedSubcategorySlug(subSlug);
  setError(null);
};

  const addImages = async (fileCollection: FileList | File[]) => {
    setError(null);
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
    setError(null);
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
    setDefaultVariantId(null);
    setCurrentStep('category');
    setSelectedCategoryId(null);
    setSelectedParentSlug(null);
    setSelectedSubcategorySlug(null);
    setLastSavedAt(null);
    setError(null);
  };

  const buildPayload = () => {
    const resolvedCategoryId =
      selectedSubcategory?.id ||
      selectedCategoryId ||
      selectedParentCategory?.id ||
      selectedTemplate?.backendCategoryId ||
      null;

    if (!resolvedCategoryId || !selectedParentSlug || !selectedSubcategorySlug) {
      return null;
    }

    const normalizedVariants = variants
      .map((variant, index) => ({
        id: variant.id || `variant-${index + 1}`,
        color: variant.color.trim(),
        size: variant.size.trim(),
        storage: variant.storage.trim(),
        ram: variant.ram.trim(),
        processor: variant.processor.trim(),
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
      (formData.originalPrice.trim()
        ? parseFloat(formData.originalPrice)
        : basePrice);

    const baseStock =
      primaryVariant?.stock ?? (formData.stock.trim() ? parseInt(formData.stock, 10) || 0 : 0);

    const baseSku =
      primaryVariant?.sku ||
      formData.sku.trim() ||
      `EX-${selectedSubcategorySlug.toUpperCase().replace(/[^A-Z0-9]/g, '')}-${Date.now()}`;

    const keyFeatures = toBulletList(formData.keyFeatures);
    const whatsInTheBox = toBulletList(formData.whatsInTheBox);
    const searchTags = formData.searchTags
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);

    const descriptionParts = [
      formData.shortDescription.trim(),
      formData.longDescription.trim(),
      keyFeatures.length ? `Key Features:\n- ${keyFeatures.join('\n- ')}` : '',
    ].filter(Boolean);

    return {
      categoryId: resolvedCategoryId,
      sellerId: mode === 'admin' ? 'exshopi_official' : undefined,
      title: formData.title.trim(),
      description: descriptionParts.join('\n\n'),
      price: Number.isFinite(basePrice) ? basePrice : 0,
      originalPrice: Number.isFinite(baseOriginalPrice)
        ? baseOriginalPrice
        : Number.isFinite(basePrice)
        ? basePrice
        : 0,
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
        shortDescription: formData.shortDescription.trim(),
        longDescription: formData.longDescription.trim(),
        attributes: {
          brand: formData.brand.trim(),
          subcategory: selectedSubcategorySlug,
          ...(primaryVariant?.color ? { color: primaryVariant.color } : {}),
          ...(primaryVariant?.size ? { size: primaryVariant.size } : {}),
          ...(primaryVariant?.storage ? { storage: primaryVariant.storage } : {}),
          ...(primaryVariant?.ram ? { ram: primaryVariant.ram } : {}),
          ...(primaryVariant?.processor ? { processor: primaryVariant.processor } : {}),
        },
        variants: normalizedVariants,
        defaultVariantId: defaultVariantId || normalizedVariants[0]?.id || undefined,
        keyFeatures,
        whatsInTheBox,
        searchTags,
        metaTitle: formData.metaTitle.trim() || formData.title.trim(),
        metaDescription: formData.metaDescription.trim() || formData.shortDescription.trim(),
        shippingWeight: formData.shippingWeight.trim(),
        packageSize: formData.packageSize.trim(),
        returnPolicy: formData.returnPolicy.trim(),
        warrantyPolicy: formData.warrantyPolicy.trim(),
        sellerNotes: formData.sellerNotes.trim(),
        listingCompleteness,
        seoScore,
        parentCategorySlug: selectedParentSlug,
        categorySlug: selectedParentSlug,
        subcategorySlug: selectedSubcategorySlug,
        parentCategoryName: selectedParentCategory?.name || '',
        categoryName: selectedParentCategory?.name || '',
        subcategoryName: selectedSubcategory?.name || '',
        categoryPath: `${selectedParentSlug}/${selectedSubcategorySlug}`,

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
    if (
      variants.some(
        (variant) =>
          (variant.color.trim() ||
            variant.size.trim() ||
            variant.storage.trim() ||
            variant.ram.trim() ||
            variant.processor.trim() ||
            variant.price.trim() ||
            variant.stock.trim() ||
            variant.sku.trim()) &&
          (!variant.price.trim() || !variant.stock.trim())
      )
    ) {
      return 'Each variant row needs at least a price and stock quantity.';
    }
    return null;
  };

  const saveDraft = async () => {
    const payload = buildPayload();
    if (mode === 'admin' && payload) {
      try {
        setLoading(true);
        setError(null);

       const draftPayload = {
  ...payload,
  status: 'draft',
  specs: {
    ...(payload.specs || {}),
    approvalStatus: 'pending',
    productStatus: 'draft',
    visibilityStatus: 'hidden',
  },
};

        const saved = editingId
          ? await adminProductAPI.update(editingId, draftPayload)
          : await adminProductAPI.create(draftPayload);

        setAutosaveState('saved');
        setLastSavedAt(new Date().toISOString());
        window.setTimeout(() => setAutosaveState('idle'), 1400);

        if (!editingId && saved?.id) {
          navigate(`/admin/products/add?edit=${saved.id}`, { replace: true });
        }
        return;
      } catch (draftError) {
        setError(`Failed to save draft: ${String(draftError)}`);
      } finally {
        setLoading(false);
      }
    }

    localStorage.setItem(
      draftStorageKey,
      JSON.stringify({
        formData,
        images,
        variants,
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
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      setCurrentStep('category');
      return;
    }

    const payload = buildPayload();
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
      if (editingId) {
        if (mode === 'admin') {
          await adminProductAPI.update(editingId, payload);
        } else {
          await productAPI.update(editingId, payload);
        }
      } else {
        if (mode === 'admin') {
          await adminProductAPI.create(payload);
        } else {
          await productAPI.create(payload);
        }
      }

      localStorage.removeItem(draftStorageKey);
      setSuccess(true);

      setTimeout(() => {
        navigate(mode === 'admin' ? '/admin/products' : '/seller/products');
      }, 1200);
    } catch (submitError) {
      setError(`Failed to save product: ${String(submitError)}`);
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
                Set base price and stock. Add variants if the product has multiple options.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">Price *</label>
                <input
                  name="price"
                  type="number"
                  value={formData.price}
                  onChange={handleInputChange}
                  placeholder="599"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">Original Price</label>
                <input
                  name="originalPrice"
                  type="number"
                  value={formData.originalPrice}
                  onChange={handleInputChange}
                  placeholder="699"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                />
              </div>

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
                      {[
                        ['color', 'Color'],
                        ['size', 'Size'],
                        ['storage', 'Storage'],
                        ['ram', 'RAM'],
                        ['processor', 'Processor'],
                        ['sku', 'Variant SKU'],
                        ['price', 'Price'],
                        ['originalPrice', 'Original Price'],
                        ['stock', 'Stock'],
                      ].map(([key, label]) => (
                        <div key={key}>
                          <label className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                            {label}
                          </label>
                          <input
                            type={key === 'price' || key === 'originalPrice' || key === 'stock' ? 'number' : 'text'}
                            value={(variant as any)[key]}
                            onChange={(e) => updateVariant(variant.id, key as keyof VariantRow, e.target.value)}
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
    <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 md:p-6">
      <div className="mb-5">
        <h2 className="text-2xl font-black text-slate-900">Specifications & Highlights</h2>
        <p className="mt-2 text-sm text-slate-500">
          Add product highlights that build trust and help customers understand the item.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-bold text-slate-700">Key Features</label>
          <textarea
            name="keyFeatures"
            value={formData.keyFeatures}
            onChange={handleInputChange}
            rows={8}
            placeholder={'Line 1\nLine 2\nLine 3'}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-7 font-medium text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-bold text-slate-700">What’s in the Box</label>
          <textarea
            name="whatsInTheBox"
            value={formData.whatsInTheBox}
            onChange={handleInputChange}
            rows={8}
            placeholder={'Laptop\nCharger\nCable'}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-7 font-medium text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
          />
        </div>
      </div>
    </section>
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
          <div className="space-y-6 rounded-[1.75rem] border border-slate-200 bg-white p-6">
            <h2 className="text-xl font-black text-slate-900">SEO, Search Tags & Visibility</h2>

            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">Search Tags</label>
                <input
                  type="text"
                  name="searchTags"
                  value={formData.searchTags}
                  onChange={handleInputChange}
                  placeholder="laptop, refurbished, apple, dubai"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">Meta Title</label>
                <input
                  type="text"
                  name="metaTitle"
                  value={formData.metaTitle}
                  onChange={handleInputChange}
                  placeholder="SEO meta title"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">Meta Description</label>
                <textarea
                  name="metaDescription"
                  value={formData.metaDescription}
                  onChange={handleInputChange}
                  rows={5}
                  placeholder="SEO meta description"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">Seller Notes</label>
                <textarea
                  name="sellerNotes"
                  value={formData.sellerNotes}
                  onChange={handleInputChange}
                  rows={5}
                  placeholder="Internal notes for admin review"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                />
              </div>
            </div>
          </div>

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
