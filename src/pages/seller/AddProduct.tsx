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
  storage: string;
  ram: string;
  price: string;
  originalPrice: string;
  stock: string;
  sku: string;
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
  storage: '',
  ram: '',
  price: '',
  originalPrice: '',
  stock: '',
  sku: '',
});

const TEMPLATE_VARIANT_CONFIG: Record<
  string,
  {
    supportsColor: boolean;
    supportsStorage: boolean;
    supportsRam: boolean;
    storageOptions?: string[];
    ramOptions?: string[];
  }
> = {
  laptops: {
    supportsColor: true,
    supportsStorage: true,
    supportsRam: true,
    storageOptions: ['256GB', '512GB', '1TB', '2TB'],
    ramOptions: ['8GB', '16GB', '32GB', '64GB'],
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

type LiveCategory = {
  id: string;
  name: string;
  slug: string;
};

const TEMPLATE_CATEGORY_SLUG_MAP: Record<string, string> = {
  laptops: 'electronics',
  mobiles: 'electronics',
  tablets: 'electronics',
  accessories: 'electronics',
  'electronics-used-devices': 'electronics',
  'beauty-makeup': 'home-kitchen',
  'gifts-daily-use': 'home-kitchen',
};

const resolveTemplateCategoryId = (templateId: string, categories: LiveCategory[]) => {
  const targetSlug = TEMPLATE_CATEGORY_SLUG_MAP[templateId];
  if (!targetSlug) return null;
  return categories.find((category) => category.slug === targetSlug)?.id || null;
};

export default function AddProduct({ mode = 'seller' }: AddProductProps) {
  const navigate = useNavigate();
  const { user, role } = useAuthStore();
  const [searchParams] = useSearchParams();
  const editingId = searchParams.get('edit');

  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<StepId>('category');
  const [formData, setFormData] = useState<FormState>(initialFormState);
  const [images, setImages] = useState<string[]>([]);
  const [variants, setVariants] = useState<VariantRow[]>([]);
  const [categories, setCategories] = useState<LiveCategory[]>([]);
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
        setCategories(
          (items || []).map((item: any) => ({
            id: String(item.id),
            name: item.name,
            slug: item.slug,
          }))
        );
      })
      .catch(() => {
        if (mounted) setCategories([]);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const selectedTemplate = selectedTemplateId ? LISTING_TEMPLATE_MAP[selectedTemplateId] : null;
  const variantConfig = selectedTemplate ? TEMPLATE_VARIANT_CONFIG[selectedTemplate.id] : undefined;
  const selectedCategoryId = useMemo(
    () => (selectedTemplate ? resolveTemplateCategoryId(selectedTemplate.id, categories) : null),
    [categories, selectedTemplate]
  );
  const draftStorageKey = selectedTemplateId ? `seller-product-draft:${editingId || 'new'}:${selectedTemplateId}` : null;

  useEffect(() => {
    let mounted = true;

    const loadExistingProduct = async () => {
      if (!editingId) return;
      try {
        const product = await productAPI.get(editingId);
        if (!product || !mounted) return;

        const matchedTemplate =
          (product?.specs?.templateId && LISTING_TEMPLATE_MAP[product.specs.templateId]) ||
          LAUNCH_LISTING_TEMPLATES.find(
            (template) => resolveTemplateCategoryId(template.id, categories) === product.categoryId
          );

        setSelectedTemplateId(matchedTemplate?.id || null);
        setImages([product.image, ...(product.images || [])].filter(Boolean));
        setFormData({
          title: product.title || '',
          shortDescription: product.specs?.shortDescription || '',
          longDescription: product.specs?.longDescription || product.description || '',
          price: String(product.price ?? ''),
          originalPrice: String(product.originalPrice ?? product.price ?? ''),
          stock: String(product.stock ?? ''),
          sku: product.sku || '',
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
        setVariants(
          Array.isArray(product.specs?.variants) && product.specs.variants.length
            ? product.specs.variants.map((variant: any, index: number) => ({
                id: variant.id || `variant-loaded-${index}`,
                color: String(variant.color || ''),
                storage: String(variant.storage || ''),
                ram: String(variant.ram || ''),
                price: String(variant.price ?? ''),
                originalPrice: String(variant.originalPrice ?? variant.price ?? ''),
                stock: String(variant.stock ?? ''),
                sku: String(variant.sku || ''),
              }))
            : []
        );
        setCurrentStep('basic');
      } catch (loadError) {
        console.error('Failed to load product for editing:', loadError);
      }
    };

    loadExistingProduct();

    return () => {
      mounted = false;
    };
  }, [categories, editingId]);

  useEffect(() => {
    if (!draftStorageKey || !selectedTemplate || editingId) return;
    const rawDraft = localStorage.getItem(draftStorageKey);
    if (!rawDraft) return;

    try {
      const draft = JSON.parse(rawDraft);
      setFormData((prev) => ({ ...prev, ...draft.formData, fieldValues: draft.formData?.fieldValues || prev.fieldValues }));
      setImages(Array.isArray(draft.images) ? draft.images : []);
      setVariants(Array.isArray(draft.variants) ? draft.variants : []);
      setCurrentStep(draft.currentStep || 'basic');
      setLastSavedAt(draft.savedAt || null);
    } catch (draftError) {
      console.error('Failed to restore listing draft:', draftError);
    }
  }, [draftStorageKey, selectedTemplate, editingId]);

  useEffect(() => {
    if (!draftStorageKey || !selectedTemplate || success) return;
    const timeout = window.setTimeout(() => {
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

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const addImages = async (fileCollection: FileList | File[]) => {
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
      setError(String(uploadError));
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setDragActive(false);
    if (!e.dataTransfer.files?.length) return;
    try {
      await addImages(e.dataTransfer.files);
    } catch (uploadError) {
      setError(String(uploadError));
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
    setLastSavedAt(null);
    setError(null);
  };

  const validateForm = () => {
    if (!selectedTemplate) return 'Please choose a product category first.';
    if (!formData.title.trim()) return 'Product title is required.';
    if (!formData.price.trim() && !hasVariantPricing) return 'Price is required.';
    if (!formData.stock.trim() && !hasVariantPricing) return 'Stock quantity is required.';
    if (images.length === 0) return 'Please upload at least one product image.';
    if (
      variants.some(
        (variant) =>
          (variant.color.trim() ||
            variant.storage.trim() ||
            variant.ram.trim() ||
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

    return null;
  };

  const saveDraft = async () => {
    if (!selectedTemplate || !draftStorageKey) {
      setError('Choose a category before saving a draft.');
      return;
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

  const buildPayload = () => {
    if (!selectedTemplate || !selectedCategoryId) return null;

    const normalizedVariants = variants
      .map((variant, index) => ({
        id: variant.id || `variant-${index + 1}`,
        color: variant.color.trim(),
        storage: variant.storage.trim(),
        ram: variant.ram.trim(),
        price: variant.price.trim() ? parseFloat(variant.price) : null,
        originalPrice: variant.originalPrice.trim() ? parseFloat(variant.originalPrice) : null,
        stock: variant.stock.trim() ? parseInt(variant.stock, 10) || 0 : null,
        sku: variant.sku.trim(),
      }))
      .filter(
        (variant) =>
          variant.price !== null &&
          variant.stock !== null &&
          (variant.color || variant.storage || variant.ram || variant.sku)
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

    const specs = {
      templateId: selectedTemplate.id,
      templateName: selectedTemplate.title,
      backendCategoryId: selectedCategoryId,
      shortDescription: formData.shortDescription,
      longDescription: formData.longDescription,
      attributes: {
        ...formData.fieldValues,
        ...(primaryVariant?.color ? { color: primaryVariant.color } : {}),
        ...(primaryVariant?.storage ? { storage: primaryVariant.storage } : {}),
        ...(primaryVariant?.ram ? { ram: primaryVariant.ram } : {}),
      },
      variants: normalizedVariants,
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
    };

    const descriptionParts = [
      formData.shortDescription.trim(),
      formData.longDescription.trim(),
      featureList.length ? `Key Features:\n- ${featureList.join('\n- ')}` : '',
    ].filter(Boolean);

    return {
      categoryId: selectedCategoryId,
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
      badges: [selectedTemplate.badge, 'Pending Review'],
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
      const payload = buildPayload();
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
                  <h3 className="mt-2 text-lg font-black text-slate-900">Color, storage and RAM options</h3>
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

              {variants.length === 0 ? (
                <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm font-medium text-slate-500">
                  No option rows added yet. Use this for storage, RAM, or color-based pricing differences.
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
                        <button
                          type="button"
                          onClick={() => removeVariant(variant.id)}
                          className="rounded-xl border border-red-200 px-3 py-2 text-xs font-black uppercase tracking-[0.18em] text-red-600 transition hover:bg-red-50"
                        >
                          Remove
                        </button>
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
                Structured category-based listing for premium UAE marketplace approval. Your product will stay in pending approval until reviewed by ExShopi.
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
                {editingId ? 'Product saved successfully.' : 'Product submitted successfully for approval.'} Redirecting to your seller catalog...
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
                  {loading ? 'Submitting...' : editingId ? 'Save & Resubmit for Approval' : 'Submit for Approval'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
