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
import {
  LAUNCH_LISTING_TEMPLATES,
  LISTING_TEMPLATE_MAP,
  ListingFieldDefinition,
  listingSectionLabels,
} from '../../lib/marketplaceTemplates';
import { compressImage } from '../../lib/imageUtils';
import { formatAED, formatAEDPlain } from '../../lib/currency';
import { useAuthStore } from '../../store/auth';
import { fileToDataUrl, uploadImageDataUrl } from '../../lib/uploadClient';
import CategorySelector from '../../components/CategorySelector';
import {
  MASTER_CATEGORIES,
  mapLegacyCategory,
  normalizeCategorySlug,
  getSubcategories as getMasterSubcategories,
  getChildCategories as getMasterChildCategories,
  gatherSlugsUnder,
} from '../../lib/masterCategories';
import type { LiveCategory } from '../../types/category';

type FormState = {
  title: string;
  shortDescription: string;
  longDescription: string;
  price: string;
  originalPrice: string;
  stock: string;
  sku: string;
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
  fieldValues: Record<string, string>;
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

const initialFormState: FormState = {
  title: '',
  shortDescription: '',
  longDescription: '',
  price: '',
  originalPrice: '',
  stock: '',
  sku: '',
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
  fieldValues: {},
};

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

const toSkuToken = (value: string) =>
  value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const TEMPLATE_VARIANT_CONFIG: Record<
  string,
  {
    supportsColor: boolean;
    supportsSize?: boolean;
    supportsStorage: boolean;
    supportsRam: boolean;
    supportsProcessor?: boolean;
    sizeOptions?: string[];
    storageOptions?: string[];
    ramOptions?: string[];
    processorOptions?: string[];
  }
> = {
  laptops: {
    supportsColor: true,
    supportsStorage: true,
    supportsRam: true,
    supportsProcessor: true,
    storageOptions: ['128GB', '256GB', '512GB', '1TB', '2TB'],
    ramOptions: ['4GB', '8GB', '16GB', '32GB', '64GB'],
    processorOptions: ['Intel Core i5', 'Intel Core i7', 'Intel Core Ultra 5', 'Intel Core Ultra 7', 'Apple M1', 'Apple M2', 'Apple M3'],
  },
  mobiles: {
    supportsColor: true,
    supportsStorage: true,
    supportsRam: true,
    storageOptions: ['64GB', '128GB', '256GB', '512GB', '1TB'],
    ramOptions: ['4GB', '6GB', '8GB', '12GB', '16GB'],
  },
  tablets: {
    supportsColor: true,
    supportsStorage: true,
    supportsRam: true,
    storageOptions: ['64GB', '128GB', '256GB', '512GB', '1TB'],
    ramOptions: ['4GB', '6GB', '8GB', '12GB', '16GB'],
  },
  accessories: {
    supportsColor: true,
    supportsStorage: false,
    supportsRam: false,
  },
  clothing: {
    supportsColor: true,
    supportsSize: true,
    supportsStorage: false,
    supportsRam: false,
    sizeOptions: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL', 'Free Size'],
  },
  shoes: {
    supportsColor: true,
    supportsSize: true,
    supportsStorage: false,
    supportsRam: false,
    sizeOptions: ['EU 35', 'EU 36', 'EU 37', 'EU 38', 'EU 39', 'EU 40', 'EU 41', 'EU 42', 'EU 43', 'EU 44', 'EU 45', 'EU 46'],
  },
  'electronics-used-devices': {
    supportsColor: true,
    supportsStorage: true,
    supportsRam: true,
    storageOptions: ['64GB', '128GB', '256GB', '512GB', '1TB', '2TB'],
    ramOptions: ['4GB', '8GB', '16GB', '32GB'],
  },
  'beauty-makeup': {
    supportsColor: true,
    supportsStorage: false,
    supportsRam: false,
  },
  'gifts-daily-use': {
    supportsColor: true,
    supportsStorage: false,
    supportsRam: false,
  },

};

const stepMeta: { id: StepId; label: string; description: string }[] = [
  { id: 'category', label: 'Category Selection', description: 'Choose the right Amazon/Noon style listing lane' },
  { id: 'basic', label: 'Basic Info', description: 'Title, summary, and listing identity' },
  { id: 'media', label: 'Images & Media', description: 'Upload, reorder, and verify product images' },
  { id: 'pricing', label: 'Pricing & Inventory', description: 'Price, sale price, stock, and SKU' },
  { id: 'specs', label: 'Specifications', description: 'Category-specific technical and commercial details' },
  { id: 'shipping', label: 'Shipping & Warranty', description: 'Fulfillment details, return rules, and warranty' },
  { id: 'seo', label: 'SEO & Visibility', description: 'Search tags, metadata, and moderation notes' },
  { id: 'preview', label: 'Preview & Submit', description: 'Review quality, completeness, and send for approval' },
];

const sectionOrder: ListingFieldDefinition['section'][] = ['catalog', 'technical', 'commercial', 'logistics'];

const uploadFilesAsHostedImages = async (
  files: FileList | File[],
  onProgress?: (value: number) => void
) => {
  const items = Array.from(files);
  const results: string[] = [];

  for (let index = 0; index < items.length; index += 1) {
    const file = items[index];
    const encoded = await fileToDataUrl(file);
    const optimized = await compressImage(encoded, 1280, 1280, 0.68);
    const uploaded = await uploadImageDataUrl(optimized, {
      folder: 'products',
      fileName: file.name,
    });
    results.push(uploaded);
    onProgress?.(Math.round(((index + 1) / items.length) * 100));
  }

  return results;
};

const toUploadErrorMessage = (error: unknown) => {
  const message = String(error || '');
  if (/too many requests/i.test(message)) {
    return 'Image upload is temporarily busy. Please wait a few seconds and try again.';
  }
  if (/failed to fetch/i.test(message)) {
    return 'Image upload could not reach the server. Please check the backend connection and try again.';
  }
  return message;
};

const toBulletList = (value: string) =>
  value
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);

const formatPercent = (value: number) => `${Math.max(0, Math.min(100, Math.round(value)))}%`;

const ListingStepBadge: React.FC<{
  step: { id: StepId; label: string; description: string };
  index: number;
  active: boolean;
  completed: boolean;
  onClick: () => void;
}> = (props) => {
  const { step, index, active, completed, onClick } = props;
  return (
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
};

type AddProductProps = {
  mode?: 'seller' | 'admin';
};

const normalizeLiveCategories = (items: any[]): LiveCategory[] =>
  (items || []).map((item: any) => ({
    id: String(item.id),
    name: item.name,
    slug: item.slug,
    subcategories: Array.isArray(item.subcategories)
      ? item.subcategories.map((subcategory: any) => ({
          name: String(subcategory.name || ''),
          slug: String(subcategory.slug || ''),
        }))
      : [],
  }));

const TEMPLATE_CATEGORY_MATCH_MAP: Record<
  string,
  {
    categorySlug?: string;
    subcategorySlug?: string;
  }
> = {
  laptops: { categorySlug: 'electronics', subcategorySlug: 'laptops' },
  mobiles: { categorySlug: 'electronics', subcategorySlug: 'mobiles' },
  tablets: { categorySlug: 'electronics', subcategorySlug: 'tablets' },
  accessories: { categorySlug: 'electronics', subcategorySlug: 'accessories' },
  clothing: { categorySlug: 'fashion', subcategorySlug: 'men-clothing' },
  shoes: { categorySlug: 'fashion', subcategorySlug: 'footwear' },
  'electronics-used-devices': {
    categorySlug: 'electronics',
    subcategorySlug: 'used-refurbished-devices',
  },
  'beauty-makeup': { categorySlug: 'beauty' },
  // Map the "gifts-daily-use" template to our Home & Kitchen category
  'gifts-daily-use': { categorySlug: 'home-kitchen' },
};

const resolveTemplateCategoryId = (templateId: string, categories: LiveCategory[]) => {
  const match = TEMPLATE_CATEGORY_MATCH_MAP[templateId];
  if (match) {
    if (match.subcategorySlug) {
      const parentCategory = categories.find((category) =>
        Array.isArray(category.subcategories) &&
        category.subcategories.some((subcategory) => subcategory.slug === match.subcategorySlug)
      );

      if (parentCategory?.id) {
        return parentCategory.id;
      }
    }

    if (match.categorySlug) {
      return categories.find((category) => category.slug === match.categorySlug)?.id || null;
    }
  }

  // Fallback: try template's configured backendCategoryId (some templates set backendCategoryId to 'cat3' etc.)
  const template = LISTING_TEMPLATE_MAP[templateId];
  if (template?.backendCategoryId) {
    // First try matching by id
    const byId = categories.find((c) => String(c.id) === String(template.backendCategoryId));
    if (byId?.id) return byId.id;
    // Then try matching by slug (in case backendCategoryId was provided as a slug)
    const bySlug = categories.find((c) => c.slug === String(template.backendCategoryId));
    if (bySlug?.id) return bySlug.id;
  }

  return null;
};

export default function AddProduct({ mode = 'seller' }: AddProductProps) {
  const navigate = useNavigate();
  const { user, role } = useAuthStore();
  const [searchParams] = useSearchParams();
  const editingId = searchParams.get('edit');
  const copyingId = searchParams.get('copy');

  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<StepId>('category');
  const [formData, setFormData] = useState<FormState>(initialFormState);
  const [images, setImages] = useState<string[]>([]);
  const [variants, setVariants] = useState<VariantRow[]>([]);
  const [defaultVariantId, setDefaultVariantId] = useState<string | null>(null);
  const [fashionColorsInput, setFashionColorsInput] = useState('');
  const [fashionSelectedSizes, setFashionSelectedSizes] = useState<string[]>([]);
  const [fashionVariantBasePrice, setFashionVariantBasePrice] = useState('');
  const [fashionVariantOriginalPrice, setFashionVariantOriginalPrice] = useState('');
  const [fashionVariantStock, setFashionVariantStock] = useState('');
  const [fashionVariantSkuPrefix, setFashionVariantSkuPrefix] = useState('');
  const [categories, setCategories] = useState<LiveCategory[]>([]);
  const [selectedCategoryChoice, setSelectedCategoryChoice] = useState<string | null>(null);
  const [selectedSubcategorySlug, setSelectedSubcategorySlug] = useState<string | null>(null);
  const [selectedMasterParentSlug, setSelectedMasterParentSlug] = useState<string | null>(null);
  const [selectedMasterChildSlug, setSelectedMasterChildSlug] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [autosaveState, setAutosaveState] = useState<'idle' | 'saved'>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let mounted = true;

    const ensureSellerAccess = async () => {
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

    ensureSellerAccess();
    return () => {
      mounted = false;
    };
  }, [mode, navigate, role, user]);

  useEffect(() => {
    let mounted = true;

    categoryAPI
      .getAll()
      .then((items) => {
        if (!mounted) return;
        setCategories(normalizeLiveCategories(items || []));
      })
      .catch(() => {
        if (mounted) setCategories([]);
      });

    return () => {
      mounted = false;
    };
  }, []);

  // master -> live categories mapping used only for selector UI (ids use slugs)
  const masterLiveCategories: LiveCategory[] = MASTER_CATEGORIES.map((p) => ({
    id: String(p.slug),
    name: p.name,
    slug: p.slug,
    subcategories: Array.isArray(p.subcategories)
      ? p.subcategories.map((s) => ({ name: s.name, slug: s.slug }))
      : [],
  }));

  const selectedTemplate = selectedTemplateId ? LISTING_TEMPLATE_MAP[selectedTemplateId] : null;
  const variantConfig = selectedTemplate ? TEMPLATE_VARIANT_CONFIG[selectedTemplate.id] : undefined;
  const selectedCategoryId = useMemo(
    () => (selectedTemplate ? resolveTemplateCategoryId(selectedTemplate.id, categories) : null),
    [categories, selectedTemplate]
  );
  const draftStorageKey = selectedTemplateId
    ? `seller-product-draft:${editingId || (copyingId ? `copy-${copyingId}` : 'new')}:${selectedTemplateId}`
    : null;

  const resolveSelectedCategoryId = async () => {
    // prefer explicit backend id selection
    if (selectedCategoryChoice) return selectedCategoryChoice;

    // map master selection (subcategory preferred) to backend id where possible
    if (selectedSubcategorySlug && categories && categories.length) {
      const backendBySub = categories.find((c) =>
        Array.isArray(c.subcategories) && c.subcategories.some((s) => String(s.slug) === String(selectedSubcategorySlug))
      );
      if (backendBySub && backendBySub.id) return backendBySub.id;
    }

    // fallback: map parent slug to backend id
    if (selectedMasterParentSlug && categories && categories.length) {
      const backend = categories.find((c) => String(c.slug) === String(selectedMasterParentSlug) || String(c.id) === String(selectedMasterParentSlug));
      if (backend && backend.id) return backend.id;
    }

    if (!selectedTemplate) return null;
    if (selectedCategoryId) return selectedCategoryId;

    try {
      const freshCategories = normalizeLiveCategories(await categoryAPI.getAll());
      setCategories(freshCategories);
      return resolveTemplateCategoryId(selectedTemplate.id, freshCategories);
    } catch {
      return null;
    }
  };

  useEffect(() => {
    let mounted = true;

    const loadExistingProduct = async () => {
      const sourceId = editingId || copyingId;
      if (!sourceId) return;
      try {
        const product = await productAPI.get(sourceId);
        if (!product || !mounted) return;

        // Prefer a template by most-specific mapping:
        // 1) exact subcategorySlug matches
        // 2) template.subcategorySlug subtree contains product subcategory
        // 3) exact categorySlug matches
        // 4) template.categorySlug subtree contains product parent/subcategory
        // fall back to backend category id mapping, then stored template id
        let matchedTemplate: any = null;
        const specSub = product.specs?.subcategorySlug || product.specs?.attributes?.subcategory || product.subcategory || null;
        const specParent = product.specs?.parentCategorySlug || product.specs?.categorySlug || product.category || null;
        const normSub = specSub ? normalizeCategorySlug(String(specSub)) : '';
        const normParent = specParent ? normalizeCategorySlug(String(specParent)) : '';

        // 1) exact subcategorySlug match
        if (normSub) {
          matchedTemplate = LAUNCH_LISTING_TEMPLATES.find((template) => {
            const map = TEMPLATE_CATEGORY_MATCH_MAP[template.id];
            if (!map) return false;
            return map.subcategorySlug && normalizeCategorySlug(map.subcategorySlug) === normSub;
          }) || null;
        }

        // 2) template.subcategorySlug subtree contains specSub
        if (!matchedTemplate && normSub) {
          matchedTemplate = LAUNCH_LISTING_TEMPLATES.find((template) => {
            const map = TEMPLATE_CATEGORY_MATCH_MAP[template.id];
            if (!map || !map.subcategorySlug) return false;
            const set = gatherSlugsUnder(map.subcategorySlug);
            return set.has(normSub);
          }) || null;
        }

        // 3) exact categorySlug match
        if (!matchedTemplate && normParent) {
          matchedTemplate = LAUNCH_LISTING_TEMPLATES.find((template) => {
            const map = TEMPLATE_CATEGORY_MATCH_MAP[template.id];
            if (!map || !map.categorySlug) return false;
            return normalizeCategorySlug(map.categorySlug) === normParent;
          }) || null;
        }

        // 4) categorySlug subtree contains specParent or sub
        if (!matchedTemplate && (normParent || normSub)) {
          const target = normSub || normParent;
          matchedTemplate = LAUNCH_LISTING_TEMPLATES.find((template) => {
            const map = TEMPLATE_CATEGORY_MATCH_MAP[template.id];
            if (!map || !map.categorySlug) return false;
            const set = gatherSlugsUnder(map.categorySlug);
            return set.has(target);
          }) || null;
        }

        // Fallback: try to resolve by backend category id mapping
        if (!matchedTemplate) {
          matchedTemplate = LAUNCH_LISTING_TEMPLATES.find(
            (template) => resolveTemplateCategoryId(template.id, categories) === product.categoryId
          );
        }

        // Final fallback: honor stored template id if present
        if (!matchedTemplate && product?.specs?.templateId) {
          matchedTemplate = LISTING_TEMPLATE_MAP[product.specs.templateId] || null;
        }

        setSelectedTemplateId(matchedTemplate?.id || null);
        setImages([product.image, ...(product.images || [])].filter(Boolean));
        setFormData({
          title: editingId ? product.title || '' : `${product.title || ''} Copy`.trim(),
          shortDescription: product.specs?.shortDescription || '',
          longDescription: product.specs?.longDescription || product.description || '',
          price: String(product.price ?? ''),
          originalPrice: String(product.originalPrice ?? product.price ?? ''),
          stock: String(product.stock ?? ''),
          sku: editingId ? product.sku || '' : '',
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
          fieldValues: product.specs?.attributes || {},
        });
        // preserve existing category selection when editing
        const existingCategoryId = product.categoryId || product.specs?.backendCategoryId || null;
        if (existingCategoryId) {
          const exists = categories.find((c) => String(c.id) === String(existingCategoryId));
          if (exists) {
            setSelectedCategoryChoice(existingCategoryId);
            // try to prefill master slugs from backend category slug and product attributes
            setSelectedMasterParentSlug(exists.slug || null);
            const existingSub = product.specs?.attributes?.subcategory || product.specs?.attributes?.category || null;
            if (existingSub) setSelectedSubcategorySlug(String(existingSub));
            const existingChild = product.specs?.attributes?.childCategory || null;
            if (existingChild) setSelectedMasterChildSlug(String(existingChild));
          } else {
            // Original category id no longer exists - try legacy mapping
            const legacySource = product.specs?.attributes?.subcategory || product.category || product.specs?.backendCategoryId || '';
            const legacyMapped = mapLegacyCategory(String(legacySource || ''));
            if (legacyMapped && legacyMapped.category) {
              // find backend id by mapped category slug
              const backendMatch = categories.find((c) => String(c.slug) === String(legacyMapped.category));
              if (backendMatch) setSelectedCategoryChoice(backendMatch.id);
              setSelectedMasterParentSlug(legacyMapped.category || null);
              if (legacyMapped.subcategory) setSelectedSubcategorySlug(legacyMapped.subcategory);
              setError('Original category not found. Legacy mapping applied — please confirm before saving.');
            } else {
              setSelectedCategoryChoice(null);
              const existingSub = product.specs?.attributes?.subcategory || null;
              if (existingSub) setSelectedSubcategorySlug(existingSub);
              setError('Original category no longer exists. Please choose a valid category.');
            }
          }
        } else {
          // No explicit backend category id — try to infer via legacy mapping from textual fields
          const legacyMapped = mapLegacyCategory(String(product.category || product.specs?.attributes?.subcategory || ''));
          if (legacyMapped && legacyMapped.category) {
            const backendMatch = categories.find((c) => String(c.slug) === String(legacyMapped.category));
            if (backendMatch) setSelectedCategoryChoice(backendMatch.id);
            setSelectedMasterParentSlug(legacyMapped.category || null);
            if (legacyMapped.subcategory) setSelectedSubcategorySlug(legacyMapped.subcategory);
          }
        }
        setVariants(
          Array.isArray(product.specs?.variants) && product.specs.variants.length
            ? product.specs.variants.map((variant: any, index: number) => ({
                id: variant.id || `variant-loaded-${index}`,
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
      } catch (loadError) {
        console.error('Failed to load product for editing:', loadError);
      }
    };

    loadExistingProduct();

    return () => {
      mounted = false;
    };
  }, [categories, copyingId, editingId]);

  useEffect(() => {
    if (!draftStorageKey || !selectedTemplate || editingId || copyingId) return;
    const rawDraft = localStorage.getItem(draftStorageKey);
    if (!rawDraft) return;

    try {
      const draft = JSON.parse(rawDraft);
      setFormData((prev) => ({ ...prev, ...draft.formData, fieldValues: draft.formData?.fieldValues || prev.fieldValues }));
      setImages(Array.isArray(draft.images) ? draft.images : []);
      setVariants(Array.isArray(draft.variants) ? draft.variants : []);
      setDefaultVariantId(draft.defaultVariantId || null);
      setCurrentStep(draft.currentStep || 'basic');
      setLastSavedAt(draft.savedAt || null);
    } catch (draftError) {
      console.error('Failed to restore listing draft:', draftError);
    }
  }, [draftStorageKey, selectedTemplate, copyingId, editingId]);

  useEffect(() => {
    if (!draftStorageKey || !selectedTemplate || success) return;
    const timeout = window.setTimeout(() => {
      localStorage.setItem(
      draftStorageKey,
      JSON.stringify({
        formData,
        images,
        variants,
        defaultVariantId,
        currentStep,
        savedAt: new Date().toISOString(),
      })
    );
      setAutosaveState('saved');
      setLastSavedAt(new Date().toISOString());
      window.setTimeout(() => setAutosaveState('idle'), 1600);
    }, 900);

    return () => window.clearTimeout(timeout);
  }, [draftStorageKey, selectedTemplate, formData, images, variants, currentStep, success]);

  const groupedFields = useMemo(() => {
    if (!selectedTemplate) return [];
    return sectionOrder
      .map((section) => ({
        section,
        label: listingSectionLabels[section],
        fields: selectedTemplate.fields.filter((field) => field.section === section),
      }))
      .filter((group) => group.fields.length > 0);
  }, [selectedTemplate]);

  const hasVariantPricing = useMemo(
    () => variants.some((variant) => variant.price.trim() && variant.stock.trim()),
    [variants]
  );

  const titleWords = formData.title.trim().split(/\s+/).filter(Boolean).length;
  const requiredFieldCount = selectedTemplate?.fields.filter((field) => field.required).length || 0;
  const requiredFieldHits =
    selectedTemplate?.fields.filter(
      (field) => !field.required || String(formData.fieldValues[field.key] || '').trim()
    ).length || 0;

  const listingCompleteness = useMemo(() => {
    const checkpoints = [
      formData.title.trim() ? 12 : 0,
      formData.shortDescription.trim() ? 10 : 0,
      formData.longDescription.trim() ? 8 : 0,
      formData.price.trim() || hasVariantPricing ? 10 : 0,
      formData.stock.trim() || hasVariantPricing ? 10 : 0,
      images.length >= 3 ? 15 : images.length > 0 ? 8 : 0,
      requiredFieldCount > 0 ? (requiredFieldHits / requiredFieldCount) * 20 : 20,
      formData.metaTitle.trim() ? 5 : 0,
      formData.metaDescription.trim() ? 5 : 0,
      formData.shippingWeight.trim() || formData.packageSize.trim() ? 5 : 0,
    ];
    return checkpoints.reduce((sum, item) => sum + item, 0);
  }, [
    formData.title,
    formData.shortDescription,
    formData.longDescription,
    formData.price,
    formData.stock,
    hasVariantPricing,
    images.length,
    requiredFieldCount,
    requiredFieldHits,
    formData.metaTitle,
    formData.metaDescription,
    formData.shippingWeight,
    formData.packageSize,
  ]);

  const seoScore = useMemo(() => {
    let score = 0;
    if (formData.metaTitle.trim().length >= 30) score += 35;
    if (formData.metaDescription.trim().length >= 80) score += 35;
    if (formData.searchTags.split(',').map((tag) => tag.trim()).filter(Boolean).length >= 3) score += 20;
    if (formData.title.trim().length >= 35) score += 10;
    return score;
  }, [formData.metaDescription, formData.metaTitle, formData.searchTags, formData.title]);

  const titleQuality = titleWords >= 6 && formData.title.trim().length >= 35 ? 'Strong' : titleWords >= 4 ? 'Good' : 'Needs Work';
  const imageQuality = images.length >= 4 ? 'Marketplace Ready' : images.length >= 2 ? 'Needs More Images' : 'Insufficient';

  const validationChecklist = [
    { label: 'Category selected', done: Boolean(selectedTemplate) },
    { label: 'Title and short description added', done: Boolean(formData.title.trim() && formData.shortDescription.trim()) },
    { label: 'At least 3 product images', done: images.length >= 3 },
    { label: 'Price and stock set', done: Boolean((formData.price.trim() && formData.stock.trim()) || hasVariantPricing) },
    { label: 'Required category fields completed', done: requiredFieldCount === 0 || requiredFieldHits >= requiredFieldCount },
    { label: 'Shipping and return details added', done: Boolean(formData.returnPolicy.trim() && (formData.shippingWeight.trim() || formData.packageSize.trim())) },
  ];

  const completedStepIndexes = useMemo(() => {
    const completed = new Set<number>();
    if (selectedTemplate) completed.add(0);
    if (formData.title.trim() && formData.shortDescription.trim()) completed.add(1);
    if (images.length > 0) completed.add(2);
    if ((formData.price.trim() && formData.stock.trim()) || hasVariantPricing) completed.add(3);
    if (requiredFieldCount === 0 || requiredFieldHits >= requiredFieldCount) completed.add(4);
    if (formData.returnPolicy.trim() && (formData.shippingWeight.trim() || formData.packageSize.trim())) completed.add(5);
    if (formData.metaTitle.trim() && formData.metaDescription.trim()) completed.add(6);
    if (selectedTemplate) completed.add(7);
    return completed;
  }, [
    selectedTemplate,
    formData.title,
    formData.shortDescription,
    images.length,
    formData.price,
    formData.stock,
    hasVariantPricing,
    requiredFieldCount,
    requiredFieldHits,
    formData.returnPolicy,
    formData.shippingWeight,
    formData.packageSize,
    formData.metaTitle,
    formData.metaDescription,
  ]);

  const updateFieldValue = (key: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      fieldValues: {
        ...prev.fieldValues,
        [key]: value,
      },
    }));
  };

  const updateVariant = (id: string, key: keyof VariantRow, value: string) => {
    setVariants((prev) => prev.map((variant) => (variant.id === id ? { ...variant, [key]: value } : variant)));
  };

  const addVariant = () => {
    setVariants((prev) => [...prev, createVariantRow()]);
  };

  const removeVariant = (id: string) => {
    setVariants((prev) => prev.filter((variant) => variant.id !== id));
  };

  const toggleFashionSize = (size: string) => {
    setFashionSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((item) => item !== size) : [...prev, size]
    );
  };

  const appendFashionVariants = (mode: 'sizes-only' | 'color-size') => {
    const parsedColors = fashionColorsInput
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
    const colors = mode === 'color-size' ? parsedColors : [''];
    const sizes = fashionSelectedSizes.length > 0 ? fashionSelectedSizes : [''];

    if (selectedTemplate?.id === 'shoes' || selectedTemplate?.id === 'clothing') {
      if (mode === 'color-size' && colors.length === 0) {
        setError('Add at least one color before generating color + size variants.');
        return;
      }
      if (sizes.every((size) => !size.trim())) {
        setError('Select at least one size before generating fashion variants.');
        return;
      }
    }

    setError(null);
    setVariants((prev) => {
      const existingCombos = new Set(
        prev.map((variant) =>
          `${variant.color.trim().toLowerCase()}::${variant.size.trim().toLowerCase()}`
        )
      );

      const generated: VariantRow[] = [];

      colors.forEach((color) => {
        sizes.forEach((size) => {
          const comboKey = `${color.trim().toLowerCase()}::${size.trim().toLowerCase()}`;
          if (existingCombos.has(comboKey)) return;

          const nextVariant = createVariantRow();
          nextVariant.color = color;
          nextVariant.size = size;
          nextVariant.price = fashionVariantBasePrice.trim();
          nextVariant.originalPrice = fashionVariantOriginalPrice.trim();
          nextVariant.stock = fashionVariantStock.trim();

          if (fashionVariantSkuPrefix.trim()) {
            const parts = [
              toSkuToken(fashionVariantSkuPrefix),
              color ? toSkuToken(color) : '',
              size ? toSkuToken(size) : '',
            ].filter(Boolean);
            nextVariant.sku = parts.join('-');
          }

          generated.push(nextVariant);
          existingCombos.add(comboKey);
        });
      });

      return generated.length > 0 ? [...prev, ...generated] : prev;
    });
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const addImages = async (fileCollection: FileList | File[]) => {
    setError(null);
    setUploadProgress(0);
    const encoded = await uploadFilesAsHostedImages(fileCollection, setUploadProgress);
    setImages((prev) => [...prev, ...encoded].slice(0, 8));
    window.setTimeout(() => setUploadProgress(0), 1200);
  };

  const handleVariantImageUpload = async (variantId: string, fileList?: FileList | null) => {
    if (!fileList || !fileList.length) return;
    setError(null);
    setUploadProgress(0);
    try {
      const urls = await uploadFilesAsHostedImages(fileList, setUploadProgress);
      const url = urls && urls.length ? urls[0] : null;
      if (url) updateVariant(variantId, 'image', url);
    } catch (uploadError) {
      setError(toUploadErrorMessage(uploadError));
    } finally {
      window.setTimeout(() => setUploadProgress(0), 1200);
    }
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

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, imageIndex) => imageIndex !== index));
  };

  const setPrimaryImage = (index: number) => {
    setImages((prev) => {
      const next = [...prev];
      const [selected] = next.splice(index, 1);
      return [selected, ...next];
    });
  };

  const resetDraft = () => {
    if (draftStorageKey) {
      localStorage.removeItem(draftStorageKey);
    }
    setFormData(initialFormState);
    setImages([]);
    setVariants([]);
    setCurrentStep(selectedTemplate ? 'basic' : 'category');
    setDefaultVariantId(null);
    setLastSavedAt(null);
    setError(null);
  };

  const handleMasterCategoryChange = (parentSlug: string | null, subSlug: string | null) => {
    // Update master selection state
    setSelectedMasterParentSlug(parentSlug);
    setSelectedSubcategorySlug(subSlug);
    setSelectedMasterChildSlug(null);

    // Set slugs; the effect below will resolve the template and reset template state if needed.
    setSelectedMasterParentSlug(parentSlug);
    setSelectedSubcategorySlug(subSlug);
    setSelectedMasterChildSlug(null);

    // Map to backend category id when possible
    const backendMatch =
      categories.find((c) => String(c.slug) === String(parentSlug) || String(c.id) === String(parentSlug)) ||
      (subSlug
        ? categories.find((c) =>
            Array.isArray(c.subcategories) && c.subcategories.some((s: any) => String(s.slug) === String(subSlug))
          )
        : null);
    if (backendMatch && backendMatch.id) setSelectedCategoryChoice(backendMatch.id);
    setError(null);

    // Immediately resolve the best template for the selected master slugs and reset template-specific state
    const normSub = normalizeCategorySlug(subSlug || '');
    const normParent = normalizeCategorySlug(parentSlug || '');
    let resolved: string | null = null;

    // 1) exact subcategorySlug match
    if (normSub) {
      const t = LAUNCH_LISTING_TEMPLATES.find((template) => {
        const map = TEMPLATE_CATEGORY_MATCH_MAP[template.id];
        if (!map) return false;
        return map.subcategorySlug && normalizeCategorySlug(map.subcategorySlug) === normSub;
      });
      if (t) resolved = t.id;
    }

    // 2) template.subcategorySlug subtree contains specSub
    if (!resolved && normSub) {
      const t = LAUNCH_LISTING_TEMPLATES.find((template) => {
        const map = TEMPLATE_CATEGORY_MATCH_MAP[template.id];
        if (!map || !map.subcategorySlug) return false;
        const set = gatherSlugsUnder(map.subcategorySlug);
        return set.has(normSub);
      });
      if (t) resolved = t.id;
    }

    // 3) exact categorySlug match
    if (!resolved && normParent) {
      const t = LAUNCH_LISTING_TEMPLATES.find((template) => {
        const map = TEMPLATE_CATEGORY_MATCH_MAP[template.id];
        if (!map || !map.categorySlug) return false;
        return normalizeCategorySlug(map.categorySlug) === normParent;
      });
      if (t) resolved = t.id;
    }

    // 4) categorySlug subtree contains specParent or sub
    if (!resolved && (normParent || normSub)) {
      const target = normSub || normParent;
      const t = LAUNCH_LISTING_TEMPLATES.find((template) => {
        const map = TEMPLATE_CATEGORY_MATCH_MAP[template.id];
        if (!map || !map.categorySlug) return false;
        const set = gatherSlugsUnder(map.categorySlug);
        return set.has(target);
      });
      if (t) resolved = t.id;
    }

    // fallback: try by backend category id mapping
    if (!resolved) {
      const byBackend = LAUNCH_LISTING_TEMPLATES.find((template) => resolveTemplateCategoryId(template.id, categories) === backendMatch?.id);
      if (byBackend) resolved = byBackend.id;
    }

    // If the resolved template changed, reset previous template-specific state
    if (resolved !== selectedTemplateId) {
      const prevForm = formData;
      const preservedBrand = prevForm.fieldValues?.brand || '';
      const preservedColor = prevForm.fieldValues?.color || '';
      const nextFieldValues: Record<string, string> = {};

      if (resolved) {
        const newTemplate = LAUNCH_LISTING_TEMPLATES.find((x) => x.id === resolved);
        if (newTemplate) {
          if (newTemplate.fields.some((f) => f.key === 'brand') && preservedBrand) nextFieldValues.brand = preservedBrand;
          if (newTemplate.fields.some((f) => f.key === 'color') && preservedColor) nextFieldValues.color = preservedColor;
        }
      }

      setFormData({
        ...initialFormState,
        title: prevForm.title || initialFormState.title,
        shortDescription: prevForm.shortDescription || initialFormState.shortDescription,
        longDescription: prevForm.longDescription || initialFormState.longDescription,
        price: prevForm.price || initialFormState.price,
        originalPrice: prevForm.originalPrice || initialFormState.originalPrice,
        stock: prevForm.stock || initialFormState.stock,
        sku: prevForm.sku || initialFormState.sku,
        fieldValues: nextFieldValues,
      });
      setVariants([]);
      setDefaultVariantId(null);
      setSelectedTemplateId(resolved);

      try {
        const prevDraftKey = selectedTemplateId
          ? `seller-product-draft:${editingId || (copyingId ? `copy-${copyingId}` : 'new')}:${selectedTemplateId}`
          : null;
        if (prevDraftKey) localStorage.removeItem(prevDraftKey);
      } catch (e) {
        // ignore
      }
    }
  };

  // Resolve template id from master slugs
  const resolveTemplateIdFromMaster = (parentSlug: string | null, subSlug: string | null) => {
    const normParent = normalizeCategorySlug(parentSlug || '');
    const normSub = normalizeCategorySlug(subSlug || '');
    for (const template of LAUNCH_LISTING_TEMPLATES) {
      const map = TEMPLATE_CATEGORY_MATCH_MAP[template.id];
      if (!map) continue;
      if (map.subcategorySlug) {
        const set = gatherSlugsUnder(map.subcategorySlug);
        if (set.has(normSub) || set.has(normParent) || normalizeCategorySlug(map.subcategorySlug) === normSub || normalizeCategorySlug(map.subcategorySlug) === normParent) {
          return template.id;
        }
      }
      if (map.categorySlug) {
        const set = gatherSlugsUnder(map.categorySlug);
        if (set.has(normSub) || set.has(normParent) || normalizeCategorySlug(map.categorySlug) === normSub || normalizeCategorySlug(map.categorySlug) === normParent) {
          return template.id;
        }
      }
    }
    return null;
  };

  // When master slugs change, ensure the selected template matches and reset template-specific state
  useEffect(() => {
    const resolved = resolveTemplateIdFromMaster(selectedMasterParentSlug, selectedSubcategorySlug);
    if (resolved === selectedTemplateId) return;

    const prevForm = formData;
    const preservedBrand = prevForm.fieldValues?.brand || '';
    const preservedColor = prevForm.fieldValues?.color || '';
    const nextFieldValues: Record<string, string> = {};

    if (resolved) {
      const newTemplate = LAUNCH_LISTING_TEMPLATES.find((x) => x.id === resolved);
      if (newTemplate) {
        if (newTemplate.fields.some((f) => f.key === 'brand') && preservedBrand) nextFieldValues.brand = preservedBrand;
        if (newTemplate.fields.some((f) => f.key === 'color') && preservedColor) nextFieldValues.color = preservedColor;
      }
    }

    // Preserve only safe values; clear all category-specific temp state (specs, variants, defaults)
    setFormData({
      ...initialFormState,
      title: prevForm.title || initialFormState.title,
      shortDescription: prevForm.shortDescription || initialFormState.shortDescription,
      longDescription: prevForm.longDescription || initialFormState.longDescription,
      price: prevForm.price || initialFormState.price,
      originalPrice: prevForm.originalPrice || initialFormState.originalPrice,
      stock: prevForm.stock || initialFormState.stock,
      sku: prevForm.sku || initialFormState.sku,
      fieldValues: nextFieldValues,
    });

    // keep images intact; clear variants and default variant
    setVariants([]);
    setDefaultVariantId(null);
    setSelectedTemplateId(resolved);

    try {
      const prevDraftKey = selectedTemplateId
        ? `seller-product-draft:${editingId || (copyingId ? `copy-${copyingId}` : 'new')}:${selectedTemplateId}`
        : null;
      if (prevDraftKey) localStorage.removeItem(prevDraftKey);
    } catch (e) {
      // ignore storage errors
    }
  }, [selectedMasterParentSlug, selectedSubcategorySlug, categories]);

  const validateForm = () => {
    // require master category selection
    if (!selectedMasterParentSlug) return 'Please select a parent category.';
    // if parent has child categories / categories, ensure one is selected
    const parentNode = MASTER_CATEGORIES.find((p) => normalizeCategorySlug(p.slug) === normalizeCategorySlug(selectedMasterParentSlug || ''));
    if (parentNode && Array.isArray(parentNode.subcategories) && parentNode.subcategories.length > 0 && !selectedSubcategorySlug) {
      return 'Please select a category under the chosen parent.';
    }

    if (!selectedTemplate) return 'Please choose a product category first.';
    if (!formData.title.trim()) return 'Product title is required.';
    if (!formData.price.trim() && !hasVariantPricing) return 'Price is required.';
    if (!formData.stock.trim() && !hasVariantPricing) return 'Stock quantity is required.';
    if (images.length === 0) return 'Please upload at least one product image.';
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
      return 'Each option row needs at least a price and stock quantity.';
    }

    const missingField = selectedTemplate.fields.find(
      (field) => field.required && !String(formData.fieldValues[field.key] || '').trim()
    );
    if (missingField) {
      return `${missingField.label} is required for ${selectedTemplate.title}.`;
    }

    // Ensure canonical slugs will be set (child slug may fallback to category when no deeper child exists)
    if (!selectedMasterParentSlug || !selectedSubcategorySlug) {
      return 'Please select a valid parent and category from the official category selector.';
    }

    return null;
  };

  const saveDraft = async () => {
    if (!selectedTemplate || !draftStorageKey) {
      setError('Choose a category before saving a draft.');
      return;
    }

    if (mode === 'admin') {
      try {
        setLoading(true);
        setError(null);
        const payload = buildPayload(await resolveSelectedCategoryId());
        if (!payload) {
          throw new Error('Unable to build listing draft. Category mapping is missing.');
        }

        const draftPayload = {
          ...payload,
          status: 'draft',
          approvalStatus: 'pending',
          productStatus: 'draft',
          visibilityStatus: 'hidden',
        };

        const saved = editingId
          ? await adminProductAPI.update(editingId, draftPayload)
          : await adminProductAPI.create(draftPayload);

        setAutosaveState('saved');
        setLastSavedAt(new Date().toISOString());
        window.setTimeout(() => setAutosaveState('idle'), 1600);

        if (!editingId && saved?.id) {
          navigate(`/admin/products/add?edit=${saved.id}`, { replace: true });
        }
        return;
      } catch (draftError) {
        setError(`Failed to save draft: ${String(draftError)}`);
        return;
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
        currentStep,
        savedAt: new Date().toISOString(),
      })
    );
    setAutosaveState('saved');
    setLastSavedAt(new Date().toISOString());
    window.setTimeout(() => setAutosaveState('idle'), 1600);
  };

  const buildPayload = (resolvedCategoryId: string | null = selectedCategoryId) => {
    if (!selectedTemplate || !resolvedCategoryId) return null;

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
      .filter(
        (variant) =>
          variant.price !== null &&
          variant.stock !== null &&
          (variant.color || variant.size || variant.storage || variant.ram || variant.processor || variant.sku)
      );

    const primaryVariant = normalizedVariants[0];
    const basePrice = primaryVariant?.price ?? parseFloat(formData.price);
    const baseOriginalPrice =
      primaryVariant?.originalPrice ??
      (formData.originalPrice ? parseFloat(formData.originalPrice) : basePrice);
    const baseStock = primaryVariant?.stock ?? (parseInt(formData.stock, 10) || 0);
    const baseSku =
      primaryVariant?.sku || formData.sku || `EX-${selectedTemplate.id.toUpperCase()}-${Date.now()}`;

    const featureList = toBulletList(formData.keyFeatures);
    const tags = formData.searchTags
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);
    // prepare canonical master category values
    const parentSlug = selectedMasterParentSlug || null;
    const categorySlug = selectedSubcategorySlug || null; // mid-level
    const childLevelSlug = selectedMasterChildSlug || null; // deepest level if selected
    // final subcategory slug must always be present for strict model; fallback to categorySlug when no deeper child exists
    const finalSubcategorySlug = childLevelSlug || categorySlug || null;

    const parentNode = parentSlug ? MASTER_CATEGORIES.find((p) => normalizeCategorySlug(p.slug) === normalizeCategorySlug(parentSlug)) : null;
    let categoryNode: any = null;
    let childNode: any = null;
    if (parentNode && categorySlug) {
      categoryNode = (parentNode.subcategories || []).find((s: any) => normalizeCategorySlug(s.slug) === normalizeCategorySlug(categorySlug));
      if (categoryNode && childLevelSlug) {
        childNode = (categoryNode.childCategories || []).find((c: any) => normalizeCategorySlug(c.slug) === normalizeCategorySlug(childLevelSlug));
      }
    }

    const categoryPath = [parentSlug, categorySlug, finalSubcategorySlug].filter(Boolean).join('/');

    const specs = {
      templateId: selectedTemplate.id,
      templateName: selectedTemplate.title,
      backendCategoryId: resolvedCategoryId,
      shortDescription: formData.shortDescription,
      longDescription: formData.longDescription,
      attributes: {
        ...formData.fieldValues,
        // subcategory attribute must reflect canonical master slug (no free-text fallbacks)
        subcategory: finalSubcategorySlug || '',
        ...(primaryVariant?.color ? { color: primaryVariant.color } : {}),
        ...(primaryVariant?.size ? { size: primaryVariant.size } : {}),
        ...(primaryVariant?.storage ? { storage: primaryVariant.storage } : {}),
        ...(primaryVariant?.ram ? { ram: primaryVariant.ram } : {}),
        ...(primaryVariant?.processor ? { processor: primaryVariant.processor } : {}),
      },
      variants: normalizedVariants,
      defaultVariantId: defaultVariantId || (normalizedVariants[0] && normalizedVariants[0].id) || undefined,
      variantConfig,
      keyFeatures: featureList,
      whatsInTheBox: toBulletList(formData.whatsInTheBox),
      searchTags: tags,
      metaTitle: formData.metaTitle || formData.title,
      metaDescription: formData.metaDescription || formData.shortDescription,
      shippingWeight: formData.shippingWeight || formData.fieldValues.shippingWeight || '',
      packageSize: formData.packageSize || formData.fieldValues.packageSize || '',
      returnPolicy: formData.returnPolicy,
      warrantyPolicy: formData.warrantyPolicy,
      sellerNotes: formData.sellerNotes,
      listingCompleteness,
      seoScore,
      // canonical master category slugs & readable names
      parentCategorySlug: parentSlug || undefined,
      categorySlug: categorySlug || undefined,
      subcategorySlug: finalSubcategorySlug || undefined,
      childCategorySlug: childNode ? childNode.slug : undefined,
      parentCategoryName: parentNode ? parentNode.name : undefined,
      categoryName: categoryNode ? categoryNode.name : undefined,
      subcategoryName: childNode ? childNode.name : undefined,
      categoryPath: categoryPath || undefined,
    };

    const descriptionParts = [
      formData.shortDescription.trim(),
      formData.longDescription.trim(),
      featureList.length ? `Key Features:\n- ${featureList.join('\n- ')}` : '',
    ].filter(Boolean);

    return {
      categoryId: resolvedCategoryId,
      sellerId: mode === 'admin' ? 'exshopi_official' : undefined,
      title: formData.title,
      description: descriptionParts.join('\n\n'),
      price: Number.isFinite(basePrice) ? basePrice : 0,
      originalPrice: Number.isFinite(baseOriginalPrice) ? baseOriginalPrice : Number.isFinite(basePrice) ? basePrice : 0,
      salePrice:
        Number.isFinite(baseOriginalPrice) && Number.isFinite(basePrice) && baseOriginalPrice > basePrice
          ? basePrice
          : undefined,
      image: images[0],
      images: images.slice(1),
      stock: baseStock,
      sku: baseSku,
      brand: formData.fieldValues.brand || '',
      specs,
      badges:
        mode === 'admin'
          ? [selectedTemplate.badge, 'ExShopi Official']
          : [selectedTemplate.badge, 'Pending Review'],
      status: mode === 'admin' ? 'live' : 'pending',
      approvalStatus: mode === 'admin' ? 'approved' : 'pending',
      productStatus: mode === 'admin' ? 'live' : baseStock <= 0 ? 'out_of_stock' : 'pending_approval',
      visibilityStatus: mode === 'admin' ? 'live' : 'pending',
      ownership: mode === 'admin' ? 'official' : 'seller',
      createdByRole: mode === 'admin' ? 'admin' : 'seller',
    };
  };

  const estimatedPayloadSizeMb = useMemo(() => {
    const payload = buildPayload();
    if (!payload) return 0;
    try {
      return new Blob([JSON.stringify(payload)]).size / (1024 * 1024);
    } catch {
      return 0;
    }
  }, [selectedTemplate, formData, images, variants, listingCompleteness, seoScore, variantConfig]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const validationError = validateForm();
    if (validationError || !selectedTemplate) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const payload = buildPayload(await resolveSelectedCategoryId());
      if (!payload) throw new Error('Unable to build listing payload. Category mapping is missing.');
      if (estimatedPayloadSizeMb > 70) {
        throw new Error('Listing payload is still too large. Please reduce the number of images or use smaller source files.');
      }

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

      if (draftStorageKey) {
        localStorage.removeItem(draftStorageKey);
      }
      setSuccess(true);
      setTimeout(() => {
        navigate(mode === 'admin' ? '/admin/products' : '/seller/products');
      }, 1400);
    } catch (submitError) {
      setError(`Failed to ${editingId ? 'save' : mode === 'admin' ? 'publish' : 'submit'} product: ${String(submitError)}`);
    } finally {
      setLoading(false);
    }
  };

  const renderField = (field: ListingFieldDefinition) => {
    const commonClassName =
      'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100';

    if (field.type === 'select') {
      return (
        <select
          value={formData.fieldValues[field.key] || ''}
          onChange={(e) => updateFieldValue(field.key, e.target.value)}
          className={commonClassName}
        >
          <option value="">Select {field.label}</option>
          {(field.options || []).map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      );
    }

    if (field.type === 'textarea') {
      return (
        <textarea
          value={formData.fieldValues[field.key] || ''}
          onChange={(e) => updateFieldValue(field.key, e.target.value)}
          rows={4}
          className={commonClassName}
          placeholder={field.placeholder}
        />
      );
    }

    return (
      <input
        type={field.type === 'number' ? 'number' : 'text'}
        value={formData.fieldValues[field.key] || ''}
        onChange={(e) => updateFieldValue(field.key, e.target.value)}
        className={commonClassName}
        placeholder={field.placeholder}
      />
    );
  };

  const renderStepContent = () => {
    if (!selectedTemplate) return null;

    if (currentStep === 'category') {
      const suggestedId = selectedCategoryId;
      const suggestedName = suggestedId ? categories.find((c) => c.id === suggestedId)?.name || '' : '';
      const selectValue = selectedCategoryChoice ? (selectedSubcategorySlug ? `${selectedCategoryChoice}::${selectedSubcategorySlug}` : selectedCategoryChoice) : '';

      return (
        <section className="space-y-6 rounded-[1.75rem] border border-slate-200 bg-slate-50/60 p-6">
          <div>
            <h2 className="text-xl font-black text-slate-900">Category Selection</h2>
            <p className="mt-1 text-sm font-medium text-slate-500">
              Choose the display category where this product should appear. Admins can override the automatic template mapping below.
            </p>
          </div>

          <div className="grid gap-4">
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">Select Category / Subcategory</label>
              <CategorySelector
                categories={masterLiveCategories}
                parentId={selectedMasterParentSlug || undefined}
                subSlug={selectedSubcategorySlug}
                onChange={(p, s) => handleMasterCategoryChange(p || null, s || null)}
                suggestedParentId={selectedMasterParentSlug || selectedCategoryId || undefined}
                suggestedSubcategorySlug={selectedSubcategorySlug || undefined}
                className="mt-2"
              />

              {/* Classic dropdown fallback removed — master selector enforced */}

              {/* Child category selector (optional) */}
              {selectedMasterParentSlug && selectedSubcategorySlug && (
                (() => {
                  const children = getMasterChildCategories(selectedMasterParentSlug, selectedSubcategorySlug) || [];
                  if (!children || children.length === 0) return null;
                  return (
                    <div className="mt-3">
                      <label className="mb-2 block text-sm font-bold text-slate-700">Optional child category / product type</label>
                      <select
                        value={selectedMasterChildSlug || ''}
                        onChange={(e) => setSelectedMasterChildSlug(e.target.value || null)}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none"
                      >
                        <option value="">None</option>
                        {children.map((c) => (
                          <option key={c.slug} value={c.slug}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  );
                })()
              )}

              {/* No classic dropdown — selection must come from master categories only. */}

              {suggestedName && (
                <div className="mt-2 flex items-center gap-3">
                  <p className="text-sm text-slate-500">Suggested mapping: <strong className="text-slate-900">{suggestedName}</strong> (from template)</p>
                  <button
                      type="button"
                      onClick={() => {
                        if (!suggestedId) return;
                        setSelectedCategoryChoice(suggestedId);
                        const backendParent = categories.find((c) => String(c.id) === String(suggestedId));
                        const suggestedSubSlug = selectedTemplate ? TEMPLATE_CATEGORY_MATCH_MAP[selectedTemplate.id]?.subcategorySlug || null : null;
                        handleMasterCategoryChange(backendParent?.slug || null, suggestedSubSlug);
                        setError(null);
                      }}
                      className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                    >
                      Accept Suggested Category
                    </button>
                </div>
              )}
            </div>
          </div>
        </section>
      );
    }

    if (currentStep === 'basic') {
      return (
        <section className="grid grid-cols-1 gap-8 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6 rounded-[1.75rem] border border-slate-200 bg-slate-50/60 p-6">
            <h2 className="text-xl font-black text-slate-900">Basic Product Identity</h2>
            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">Product Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                  placeholder={`Enter a premium ${selectedTemplate.title.toLowerCase()} listing title`}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">Short Description</label>
                <textarea
                  name="shortDescription"
                  value={formData.shortDescription}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                  placeholder="One concise customer-facing summary for cards, SEO, and moderation."
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">Long Description</label>
                <textarea
                  name="longDescription"
                  value={formData.longDescription}
                  onChange={handleInputChange}
                  rows={6}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                  placeholder="Write a polished description with premium context, highlights, and UAE customer value."
                />
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">Key Features</label>
                  <textarea
                    name="keyFeatures"
                    value={formData.keyFeatures}
                    onChange={handleInputChange}
                    rows={5}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                    placeholder={'One feature per line\nPremium build quality\nFast delivery support'}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">What&apos;s in the Box</label>
                  <textarea
                    name="whatsInTheBox"
                    value={formData.whatsInTheBox}
                    onChange={handleInputChange}
                    rows={5}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                    placeholder={'One item per line\nDevice\nCharger\nDocumentation'}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-5 rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Listing Helper</p>
              <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-900">Title & Content Quality</h3>
            </div>
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-700">Listing completeness</span>
                  <span className="text-lg font-black text-blue-700">{formatPercent(listingCompleteness)}</span>
                </div>
                <div className="mt-3 h-3 rounded-full bg-slate-200">
                  <div className="h-3 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500" style={{ width: `${Math.min(100, listingCompleteness)}%` }} />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Title Quality</p>
                  <p className="mt-2 text-lg font-black text-slate-900">{titleQuality}</p>
                  <p className="mt-1 text-sm font-medium text-slate-500">{titleWords} words in title</p>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">SEO Score</p>
                  <p className="mt-2 text-lg font-black text-slate-900">{seoScore}/100</p>
                  <p className="mt-1 text-sm font-medium text-slate-500">Improves discoverability on ExShopi</p>
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Marketplace Guidance</p>
                <div className="mt-3 space-y-2">
                  {[
                    'Use brand + model + key spec in the first 60 characters.',
                    'Avoid duplicate keywords or repeated promo claims.',
                    'Mention condition clearly for used devices.',
                  ].map((tip) => (
                    <div key={tip} className="rounded-xl bg-slate-50 px-3 py-3 text-sm font-medium text-slate-600">
                      {tip}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      );
    }

    if (currentStep === 'media') {
      return (
        <section className="grid grid-cols-1 gap-8 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6 rounded-[1.75rem] border border-slate-200 bg-slate-50/60 p-6">
            <h2 className="text-xl font-black text-slate-900">Upload Product Images</h2>
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
              <p className="text-lg font-black text-slate-900">Upload from PC or drag & drop</p>
              <p className="mt-2 text-sm font-medium text-slate-500">
                Minimum 3 images recommended • Max 8 images • No image URL input allowed
              </p>
            </label>

            <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Estimated payload size</span>
                <span className="text-sm font-black text-slate-900">{estimatedPayloadSizeMb.toFixed(1)} MB</span>
              </div>
              <p className="mt-2 text-sm font-medium text-slate-500">
                Images are compressed automatically before submission to keep seller listings stable and approval-ready.
              </p>
            </div>

            {uploadProgress > 0 && (
              <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-blue-700">Upload progress</span>
                  <span className="text-sm font-black text-blue-700">{uploadProgress}%</span>
                </div>
                <div className="mt-3 h-3 rounded-full bg-blue-100">
                  <div className="h-3 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500" style={{ width: `${uploadProgress}%` }} />
                </div>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {images.map((image, index) => (
                <div key={`${image.slice(0, 50)}-${index}`} className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm">
                  <div className="relative aspect-square bg-slate-100">
                    <img src={image} alt={`Product ${index + 1}`} className="h-full w-full object-cover" loading="lazy" />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute right-3 top-3 rounded-full bg-white/90 p-2 text-slate-600 shadow"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-4">
                    <div>
                      <p className="text-sm font-black text-slate-900">{index === 0 ? 'Main Image' : `Gallery ${index}`}</p>
                      <p className="text-xs font-medium text-slate-500">
                        {index === 0 ? 'Used across search, cards, and PDP' : 'Additional supporting media'}
                      </p>
                    </div>
                    {index !== 0 && (
                      <button
                        type="button"
                        onClick={() => setPrimaryImage(index)}
                        className="rounded-xl bg-slate-900 px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-white"
                      >
                        Set Main
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-5 rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Media Validation</p>
              <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-900">Image Quality Check</h3>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-700">Image quality</span>
                <span className="text-lg font-black text-slate-900">{imageQuality}</span>
              </div>
              <p className="mt-2 text-sm font-medium text-slate-500">
                Clean white-background or premium product shots improve approval speed and conversion.
              </p>
            </div>
            <div className="space-y-3">
              {[
                'Use 1:1 or clean portrait images.',
                'Avoid watermarks or promotional overlays.',
                'Show key accessories for used electronics.',
                'First image should clearly show the actual item.',
              ].map((rule) => (
                <div key={rule} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-600">
                  {rule}
                </div>
              ))}
            </div>
          </div>
        </section>
      );
    }

    if (currentStep === 'pricing') {
      return (
        <section className="grid grid-cols-1 gap-8 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6 rounded-[1.75rem] border border-slate-200 bg-slate-50/60 p-6">
            <h2 className="text-xl font-black text-slate-900">Pricing & Inventory</h2>
            <div className="grid gap-5 md:grid-cols-2">
              {[
                ['price', 'Selling Price (AED)', '599'],
                ['originalPrice', 'Original Price (AED)', '699'],
                ['stock', 'Stock Quantity', '12'],
                ['sku', 'SKU', 'EX-LAPTOP-001'],
              ].map(([name, label, placeholder]) => (
                <div key={name}>
                  <label className="mb-2 block text-sm font-bold text-slate-700">{label}</label>
                  <input
                    type={name === 'stock' ? 'number' : 'text'}
                    name={name}
                    value={(formData as any)[name]}
                    onChange={handleInputChange}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                    placeholder={placeholder}
                  />
                </div>
              ))}
            </div>

            <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Variant Pricing</p>
                  <h3 className="mt-2 text-lg font-black text-slate-900">Color, size, storage, RAM and processor options</h3>
                  <p className="mt-1 text-sm font-medium text-slate-500">
                    Add product combinations with their own price, stock and SKU. The first valid row becomes the default storefront option.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addVariant}
                  className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-black text-white transition hover:bg-slate-800"
                >
                  + Add Option
                </button>
              </div>

              {(selectedTemplate?.id === 'clothing' || selectedTemplate?.id === 'shoes') && (
                <div className="mt-5 rounded-[1.25rem] border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-sky-50 p-4 shadow-sm">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-600">Fashion Variant Builder</p>
                      <h4 className="mt-1 text-base font-black text-slate-900">Generate size and color combinations faster</h4>
                      <p className="mt-1 text-sm font-medium text-slate-500">
                        This only appends missing variant rows. Existing option rows and listed products stay untouched.
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 lg:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-bold text-slate-700">Colors</label>
                      <input
                        type="text"
                        value={fashionColorsInput}
                        onChange={(e) => setFashionColorsInput(e.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                        placeholder="Black, White, Navy, Red"
                      />
                      <p className="mt-2 text-xs font-medium text-slate-500">Separate colors with commas for T-shirts, shirts, sneakers, sandals, and similar fashion listings.</p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-bold text-slate-700">Base Price (AED)</label>
                        <input
                          type="number"
                          value={fashionVariantBasePrice}
                          onChange={(e) => setFashionVariantBasePrice(e.target.value)}
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                          placeholder="99"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-bold text-slate-700">Original Price (AED)</label>
                        <input
                          type="number"
                          value={fashionVariantOriginalPrice}
                          onChange={(e) => setFashionVariantOriginalPrice(e.target.value)}
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                          placeholder="129"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-bold text-slate-700">Stock Per Variant</label>
                        <input
                          type="number"
                          value={fashionVariantStock}
                          onChange={(e) => setFashionVariantStock(e.target.value)}
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                          placeholder="10"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-bold text-slate-700">SKU Prefix</label>
                        <input
                          type="text"
                          value={fashionVariantSkuPrefix}
                          onChange={(e) => setFashionVariantSkuPrefix(e.target.value)}
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                          placeholder="TSHIRT-2026"
                        />
                      </div>
                    </div>
                  </div>

                  {variantConfig?.sizeOptions?.length ? (
                    <div className="mt-4">
                      <label className="mb-2 block text-sm font-bold text-slate-700">Sizes</label>
                      <div className="flex flex-wrap gap-2">
                        {variantConfig.sizeOptions.map((size) => {
                          const isActive = fashionSelectedSizes.includes(size);
                          return (
                            <button
                              key={size}
                              type="button"
                              onClick={() => toggleFashionSize(size)}
                              className={`rounded-full border px-3 py-2 text-xs font-black uppercase tracking-[0.14em] transition ${
                                isActive
                                  ? 'border-emerald-500 bg-emerald-500 text-white shadow-sm'
                                  : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-300 hover:text-emerald-700'
                              }`}
                            >
                              {size}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}

                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => appendFashionVariants('color-size')}
                      className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-black text-white transition hover:bg-slate-800"
                    >
                      Generate Color + Size Options
                    </button>
                    <button
                      type="button"
                      onClick={() => appendFashionVariants('sizes-only')}
                      className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 transition hover:border-emerald-300 hover:text-emerald-700"
                    >
                      Generate Sizes Only
                    </button>
                  </div>
                </div>
              )}

              {variants.length === 0 ? (
                <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm font-medium text-slate-500">
                  No option rows added yet. Use this for size, color, storage, RAM, or processor-based pricing differences.
                </div>
              ) : (
                <div className="mt-5 space-y-4">
                  {variants.map((variant, index) => (
                    <div key={variant.id} className="rounded-[1.25rem] border border-slate-200 p-4">
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-black text-slate-900">Option {index + 1}</p>
                          <p className="text-xs font-medium text-slate-500">Set the exact customer-selectable combination.</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            {variant.image ? (
                              <img src={variant.image} alt="variant" className="h-10 w-10 rounded-md object-cover border" />
                            ) : (
                              <div className="h-10 w-10 rounded-md bg-slate-100 flex items-center justify-center text-xs text-slate-400">No image</div>
                            )}
                          </div>

                          <label className="inline-flex items-center gap-2">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleVariantImageUpload(variant.id, e.target.files)}
                              className="hidden"
                            />
                            <button type="button" className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-slate-700 transition hover:bg-slate-50">
                              <Upload className="h-3.5 w-3.5 inline-block" /> Upload
                            </button>
                          </label>

                          <label className="inline-flex items-center gap-2 text-xs text-slate-600">
                            <input
                              type="radio"
                              name={`defaultVariant`}
                              checked={defaultVariantId === variant.id}
                              onChange={() => setDefaultVariantId(variant.id)}
                            />
                            <span>Default</span>
                          </label>

                          <button
                            type="button"
                            onClick={() => removeVariant(variant.id)}
                            className="rounded-xl border border-red-200 px-3 py-2 text-xs font-black uppercase tracking-[0.18em] text-red-600 transition hover:bg-red-50"
                          >
                            Remove
                          </button>
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        {variantConfig?.supportsColor && (
                          <div>
                            <label className="mb-2 block text-sm font-bold text-slate-700">Color</label>
                            <input
                              type="text"
                              value={variant.color}
                              onChange={(e) => updateVariant(variant.id, 'color', e.target.value)}
                              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                              placeholder="Black"
                            />
                          </div>
                        )}
                        {variantConfig?.supportsSize && (
                          <div>
                            <label className="mb-2 block text-sm font-bold text-slate-700">Size</label>
                            <select
                              value={variant.size}
                              onChange={(e) => updateVariant(variant.id, 'size', e.target.value)}
                              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                            >
                              <option value="">Select size</option>
                              {(variantConfig.sizeOptions || []).map((option) => (
                                <option key={option} value={option}>
                                  {option}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                        {variantConfig?.supportsStorage && (
                          <div>
                            <label className="mb-2 block text-sm font-bold text-slate-700">Storage</label>
                            <select
                              value={variant.storage}
                              onChange={(e) => updateVariant(variant.id, 'storage', e.target.value)}
                              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                            >
                              <option value="">Select storage</option>
                              {(variantConfig.storageOptions || []).map((option) => (
                                <option key={option} value={option}>
                                  {option}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                        {variantConfig?.supportsRam && (
                          <div>
                            <label className="mb-2 block text-sm font-bold text-slate-700">RAM</label>
                            <select
                              value={variant.ram}
                              onChange={(e) => updateVariant(variant.id, 'ram', e.target.value)}
                              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                            >
                              <option value="">Select RAM</option>
                              {(variantConfig.ramOptions || []).map((option) => (
                                <option key={option} value={option}>
                                  {option}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                        {variantConfig?.supportsProcessor && (
                          <div>
                            <label className="mb-2 block text-sm font-bold text-slate-700">Processor</label>
                            <select
                              value={variant.processor}
                              onChange={(e) => updateVariant(variant.id, 'processor', e.target.value)}
                              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                            >
                              <option value="">Select processor</option>
                              {(variantConfig.processorOptions || []).map((option) => (
                                <option key={option} value={option}>
                                  {option}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                        <div>
                          <label className="mb-2 block text-sm font-bold text-slate-700">SKU</label>
                          <input
                            type="text"
                            value={variant.sku}
                            onChange={(e) => updateVariant(variant.id, 'sku', e.target.value)}
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                            placeholder="EX-VAR-001"
                          />
                        </div>
                        <div>
                          <label className="mb-2 block text-sm font-bold text-slate-700">Selling Price (AED)</label>
                          <input
                            type="number"
                            value={variant.price}
                            onChange={(e) => updateVariant(variant.id, 'price', e.target.value)}
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                            placeholder="4999"
                          />
                        </div>
                        <div>
                          <label className="mb-2 block text-sm font-bold text-slate-700">Original Price (AED)</label>
                          <input
                            type="number"
                            value={variant.originalPrice}
                            onChange={(e) => updateVariant(variant.id, 'originalPrice', e.target.value)}
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                            placeholder="5499"
                          />
                        </div>
                        <div>
                          <label className="mb-2 block text-sm font-bold text-slate-700">Stock</label>
                          <input
                            type="number"
                            value={variant.stock}
                            onChange={(e) => updateVariant(variant.id, 'stock', e.target.value)}
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                            placeholder="12"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="space-y-5 rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Commercial Readiness</p>
              <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-900">Pricing Signals</h3>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Commission Logic</p>
                <p className="mt-2 text-xl font-black text-slate-900">6% ExShopi Fee</p>
                <p className="mt-1 text-sm font-medium text-slate-500">Net estimate after commission only</p>
              </div>
              <div className="rounded-2xl border border-slate-200 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Estimated Net</p>
                <p className="mt-2 text-xl font-black text-emerald-700">
                  {formatAED(
                    Number((variants[0]?.price || formData.price) || 0)
                      ? Number((variants[0]?.price || formData.price) || 0) * 0.94
                      : 0,
                    { maximumFractionDigits: 2, minimumFractionDigits: 2 }
                  )}
                </p>
                <p className="mt-1 text-sm font-medium text-slate-500">Before VAT, shipping, and refunds</p>
              </div>
            </div>
          </div>
        </section>
      );
    }

    if (currentStep === 'specs') {
      return (
        <section className="space-y-6 rounded-[1.75rem] border border-slate-200 bg-slate-50/60 p-6">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-900">Category-Specific Specifications</h2>
              <p className="mt-1 text-sm font-medium text-slate-500">
                These details control customer trust, admin approval, and filterability on the website.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-900">
              {requiredFieldCount} required specification fields
            </div>
          </div>
          {groupedFields.map((group) => (
            <div key={group.section} className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">{group.label}</p>
                  <h3 className="mt-2 text-lg font-black text-slate-900">{group.label}</h3>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-600">
                  {group.fields.length} fields
                </span>
              </div>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                {group.fields.map((field) => (
                  <div key={field.key} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
                    <label className="mb-2 block text-sm font-bold text-slate-700">
                      {field.label} {field.required && <span className="text-red-500">*</span>}
                    </label>
                    {renderField(field)}
                    {field.helpText && <p className="mt-2 text-xs font-medium text-slate-500">{field.helpText}</p>}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>
      );
    }

    if (currentStep === 'shipping') {
      return (
        <section className="grid grid-cols-1 gap-8 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-6 rounded-[1.75rem] border border-slate-200 bg-slate-50/60 p-6">
            <h2 className="text-xl font-black text-slate-900">Shipping, Returns & Warranty</h2>
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">Shipping Weight</label>
                <input
                  type="text"
                  name="shippingWeight"
                  value={formData.shippingWeight}
                  onChange={handleInputChange}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                  placeholder="e.g. 1.2 kg"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">Package Size</label>
                <input
                  type="text"
                  name="packageSize"
                  value={formData.packageSize}
                  onChange={handleInputChange}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                  placeholder="e.g. 35 x 25 x 8 cm"
                />
              </div>
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-bold text-slate-700">Return Policy</label>
                <textarea
                  name="returnPolicy"
                  value={formData.returnPolicy}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                />
              </div>
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-bold text-slate-700">Warranty Policy</label>
                <textarea
                  name="warrantyPolicy"
                  value={formData.warrantyPolicy}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                />
              </div>
            </div>
          </div>
          <div className="space-y-5 rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">UAE Fulfillment Readiness</p>
              <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-900">Marketplace Trust Rules</h3>
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
          </div>
        </section>
      );
    }

    if (currentStep === 'seo') {
      return (
        <section className="grid grid-cols-1 gap-8 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-6 rounded-[1.75rem] border border-slate-200 bg-slate-50/60 p-6">
            <h2 className="text-xl font-black text-slate-900">SEO, Search Tags & Visibility</h2>
            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">Search Tags</label>
                <input
                  type="text"
                  name="searchTags"
                  value={formData.searchTags}
                  onChange={handleInputChange}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                  placeholder="laptop, refurbished, apple, m2, dubai"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">Meta Title</label>
                <input
                  type="text"
                  name="metaTitle"
                  value={formData.metaTitle}
                  onChange={handleInputChange}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                  placeholder="SEO-ready page title for search and sharing"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">Meta Description</label>
                <textarea
                  name="metaDescription"
                  value={formData.metaDescription}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                  placeholder="A clearer summary for search engines and preview cards"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">Seller Notes</label>
                <textarea
                  name="sellerNotes"
                  value={formData.sellerNotes}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                  placeholder="Anything the admin team should know during moderation"
                />
              </div>
            </div>
          </div>
          <div className="space-y-5 rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-700">SEO Score</span>
                <span className="text-lg font-black text-violet-700">{seoScore}/100</span>
              </div>
              <div className="mt-3 h-3 rounded-full bg-slate-200">
                <div className="h-3 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500" style={{ width: `${seoScore}%` }} />
              </div>
            </div>
            <div className="space-y-3">
              {validationChecklist.map((item) => (
                <div key={item.label} className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3">
                  <span className="text-sm font-medium text-slate-600">{item.label}</span>
                  <span className={`rounded-full px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] ${item.done ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                    {item.done ? 'Done' : 'Pending'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      );
    }

    return (
      <section className="grid grid-cols-1 gap-8 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-6 rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Final Review</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900">Preview Listing Before Submit</h2>
            </div>
            <div className="rounded-2xl bg-blue-50 px-4 py-3 text-sm font-black text-blue-700">
              {formatPercent(listingCompleteness)} complete
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5">
            <div className="grid gap-6 md:grid-cols-[180px_1fr]">
              <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white">
                {images[0] ? (
                  <img src={images[0]} alt={formData.title || 'Preview'} className="h-44 w-full object-cover" />
                ) : (
                  <div className="flex h-44 items-center justify-center bg-slate-100 text-slate-400">
                    <ImagePlus className="h-8 w-8" />
                  </div>
                )}
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">{selectedTemplate.title}</p>
                  <h3 className="mt-2 text-2xl font-black text-slate-900">{formData.title || 'Untitled Listing'}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">{formData.shortDescription || 'Short description will appear here.'}</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Price</p>
                    <p className="mt-1 text-xl font-black text-slate-900">
                      {formatAEDPlain(
                        Number((variants[0]?.price || formData.price) || 0),
                        { maximumFractionDigits: 2, minimumFractionDigits: 2 }
                      )}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Stock</p>
                    <p className="mt-1 text-xl font-black text-slate-900">{variants[0]?.stock || formData.stock || '0'}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Brand</p>
                    <p className="mt-1 text-xl font-black text-slate-900">{formData.fieldValues.brand || 'Not set'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Moderation Readiness</p>
              <div className="mt-4 space-y-3">
                {validationChecklist.map((item) => (
                  <div key={item.label} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3">
                    <span className="text-sm font-medium text-slate-600">{item.label}</span>
                    <span className={`rounded-full px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] ${item.done ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                      {item.done ? 'Ready' : 'Fix'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Listing Quality</p>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Completeness</p>
                  <p className="mt-2 text-2xl font-black text-blue-700">{formatPercent(listingCompleteness)}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">SEO Score</p>
                  <p className="mt-2 text-2xl font-black text-violet-700">{seoScore}/100</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Image Quality</p>
                  <p className="mt-2 text-base font-black text-slate-900">{imageQuality}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Title Quality</p>
                  <p className="mt-2 text-base font-black text-slate-900">{titleQuality}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-5 rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Submission Summary</p>
            <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-900">Ready for Approval Queue</h3>
          </div>
          <div className="space-y-3">
            {[
              `Template: ${selectedTemplate.title}`,
              `Brand: ${formData.fieldValues.brand || 'Not set'}`,
              `SKU: ${variants[0]?.sku || formData.sku || 'Auto-generate on submit'}`,
              `Options: ${variants.length ? `${variants.length} saved combinations` : 'No variant combinations added'}`,
              `Search tags: ${formData.searchTags || 'No tags added'}`,
              `Images: ${images.length} uploaded`,
            ].map((item) => (
              <div key={item} className="rounded-2xl border border-slate-200 px-4 py-4 text-sm font-medium text-slate-600">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  };

  if (!selectedTemplate) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-4 md:p-8">
      <div className="w-full max-w-none">
          <button
            onClick={() => navigate('/seller/products')}
            className="mb-8 flex items-center gap-2 font-medium text-slate-600 transition-colors hover:text-slate-900"
          >
            <ArrowLeft className="h-5 w-5" />
            Back to Products
          </button>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/60 md:p-10">
            <div className="mb-10 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-xs font-black uppercase tracking-[0.25em] text-blue-700">
                  <Sparkles className="h-4 w-4" />
                  Seller Listing Workspace
                </div>
                <h1 className="text-3xl font-black tracking-tight text-slate-900 md:text-4xl">
                  {editingId ? 'Edit marketplace listing' : 'Add a product'}
                </h1>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 md:text-base">
                  Choose the right category first. ExShopi will adapt the listing form to match Amazon and Noon style marketplace detail requirements for each product type.
                </p>
              </div>
              <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50/80 p-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-white p-3 shadow-sm">
                    <LayoutTemplate className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">Guided Listing Flow</p>
                    <p className="text-xl font-black text-slate-900">Built like a real marketplace workflow</p>
                  </div>
                </div>
                <div className="mt-6 space-y-3">
                  {stepMeta.map((step, index) => (
                    <div key={step.id} className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-[40px_1fr] md:items-center">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-sm font-black text-white">
                        0{index + 1}
                      </div>
                      <div>
                        <p className="font-black text-slate-900">{step.label}</p>
                        <p className="mt-1 text-sm text-slate-500">{step.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {LAUNCH_LISTING_TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  onClick={() => {
                    setSelectedTemplateId(template.id);
                    setFormData(initialFormState);
                    setImages([]);
                    setError(null);
                    setSuccess(false);
                    setCurrentStep('basic');
                  }}
                  className="group rounded-[1.75rem] border border-slate-200 bg-slate-50/70 p-6 text-left transition-all duration-200 hover:-translate-y-1 hover:border-blue-300 hover:bg-white hover:shadow-xl hover:shadow-blue-100/50"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <span className="rounded-full bg-slate-900 px-3 py-1 text-[11px] font-black uppercase tracking-[0.22em] text-white">
                      {template.badge}
                    </span>
                    <span className="text-sm font-semibold text-slate-400">{template.fields.length} fields</span>
                  </div>
                  <h3 className="text-xl font-black text-slate-900 transition-colors group-hover:text-blue-700">
                    {template.title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{template.description}</p>
                  <div className="mt-5 inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-blue-700">
                    {editingId ? 'Continue Editing' : 'Start Listing'}
                    <ChevronRight className="h-4 w-4" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-4 md:p-8">
      <div className="w-full max-w-none">
        <button
          onClick={() => setSelectedTemplateId(null)}
          className="mb-8 flex items-center gap-2 font-medium text-slate-600 transition-colors hover:text-slate-900"
        >
          <ArrowLeft className="h-5 w-5" />
          {editingId ? 'Back to Product List' : 'Change Category'}
        </button>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/60 md:p-10">
          <div className="mb-8 grid gap-4 border-b border-slate-100 pb-6 xl:grid-cols-[1.05fr_0.95fr]">
            <div>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.22em] text-blue-700">
                {selectedTemplate.badge}
              </span>
              <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900">
                {editingId ? `Edit Product: ${selectedTemplate.title}` : `Add a Product: ${selectedTemplate.title}`}
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                {mode === 'admin'
                  ? 'Structured category-based listing for ExShopi Official catalog publishing. Products created here go live immediately under ExShopi Official.'
                  : 'Structured category-based listing for premium UAE marketplace approval. Your product will stay in pending approval until reviewed by ExShopi.'}
              </p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-4 text-sm font-medium text-amber-800">
                Commission 6% • Monthly seller fee 99 AED • UAE-first marketplace listing workflow
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                <div className="flex items-center gap-3">
                  <PackageSearch className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Template Coverage</p>
                    <p className="text-sm font-black text-slate-900">{selectedTemplate.fields.length} structured fields for {selectedTemplate.title}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-6 flex gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">
              <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 flex gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600" />
              <p className="text-sm font-medium text-emerald-800">
                {editingId
                  ? 'Product saved successfully.'
                  : mode === 'admin'
                  ? 'ExShopi Official product published successfully.'
                  : 'Product submitted successfully for approval.'}{' '}
                Redirecting to your {mode === 'admin' ? 'admin catalog' : 'seller catalog'}...
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid gap-3 xl:grid-cols-4">
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

            <div className="grid gap-8 xl:grid-cols-[minmax(0,1.12fr)_380px]">
              <div className="space-y-8">{renderStepContent()}</div>

              <aside className="space-y-5">
                <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Draft Status</p>
                      <h3 className="mt-2 text-xl font-black tracking-tight text-slate-900">
                        {autosaveState === 'saved' ? 'Draft Saved' : 'Autosave Active'}
                      </h3>
                    </div>
                    <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
                      <Save className="h-5 w-5" />
                    </div>
                  </div>
                  <p className="mt-3 text-sm font-medium text-slate-500">
                    {lastSavedAt ? `Last saved ${new Date(lastSavedAt).toLocaleString()}` : 'Draft will auto-save locally while you work.'}
                  </p>
                  <div className="mt-5 grid gap-3 md:grid-cols-2">
                    <button
                      type="button"
                      onClick={saveDraft}
                      className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-100"
                    >
                      Save Draft
                    </button>
                    <button
                      type="button"
                      onClick={resetDraft}
                      className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-black text-red-700 transition hover:bg-red-100"
                    >
                      Reset Draft
                    </button>
                  </div>
                </div>

                <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Listing Quality</p>
                      <h3 className="mt-2 text-xl font-black tracking-tight text-slate-900">Marketplace Readiness</h3>
                    </div>
                    <div className="rounded-full bg-blue-50 px-3 py-2 text-xs font-black uppercase tracking-[0.18em] text-blue-700">
                      {formatPercent(listingCompleteness)}
                    </div>
                  </div>
                  <div className="mt-5 space-y-3">
                    {[
                      ['Listing completeness', formatPercent(listingCompleteness)],
                      ['SEO score', `${seoScore}/100`],
                      ['Title quality', titleQuality],
                      ['Image quality', imageQuality],
                    ].map(([label, value]) => (
                      <div key={label} className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3">
                        <span className="text-sm font-medium text-slate-600">{label}</span>
                        <span className="text-sm font-black text-slate-900">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-violet-50 p-3 text-violet-700">
                      <Eye className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Preview Helper</p>
                      <h3 className="text-xl font-black tracking-tight text-slate-900">Missing Fields Checker</h3>
                    </div>
                  </div>
                  <div className="mt-5 space-y-3">
                    {validationChecklist.map((item) => (
                      <div key={item.label} className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3">
                        <span className="text-sm font-medium text-slate-600">{item.label}</span>
                        <span className={`rounded-full px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] ${item.done ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          {item.done ? 'Done' : 'Missing'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </aside>
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-100 pt-6 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-wrap items-center gap-3">
                {currentStep !== 'category' && (
                  <button
                    type="button"
                    onClick={() => setCurrentStep(stepMeta[Math.max(0, stepMeta.findIndex((step) => step.id === currentStep) - 1)].id)}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-100"
                  >
                    Previous Step
                  </button>
                )}
                {currentStep !== 'preview' && (
                  <button
                    type="button"
                    onClick={() => setCurrentStep(stepMeta[Math.min(stepMeta.length - 1, stepMeta.findIndex((step) => step.id === currentStep) + 1)].id)}
                    className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-black text-white transition hover:bg-slate-800"
                  >
                    Next Step
                  </button>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={saveDraft}
                  disabled={loading}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50"
                >
                  Save Draft
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep('preview')}
                  className="rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm font-black text-violet-700 transition hover:bg-violet-100"
                >
                  Preview Listing
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-200 transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? 'Submitting...' : mode === 'admin' ? (editingId ? 'Update & Publish' : 'Publish Product') : editingId ? 'Save & Resubmit for Approval' : 'Submit for Approval'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
