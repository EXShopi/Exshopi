import 'dotenv/config';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { prismaRuntime } from '../backend/prismaRuntime';

type SpreadsheetRow = Record<string, string>;

const INPUT_PATH =
  process.argv[2] ||
  path.join(process.env.HOME || '.', 'Downloads', 'exshopi_full_350_products_with_specs.xlsx');

function safeText(value: unknown): string {
  return value == null ? '' : String(value).trim();
}

function normalize(value: unknown): string {
  return safeText(value).toLowerCase();
}

function slugify(value: unknown): string {
  return safeText(value)
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function parseNumber(value: unknown, fallback = 0): number {
  const cleaned = safeText(value).replace(/[^0-9.\-]/g, '');
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseInteger(value: unknown, fallback = 0): number {
  return Math.max(0, Math.round(parseNumber(value, fallback)));
}

function splitTags(value: unknown): string[] {
  const seen = new Set<string>();
  const tags: string[] = [];

  for (const part of safeText(value).split(/[,|/]+/g)) {
    const tag = part.trim();
    const normalized = tag.toLowerCase();
    if (!tag || seen.has(normalized)) continue;
    seen.add(normalized);
    tags.push(tag);
  }

  return tags;
}

function readZipText(file: string, innerPath: string): string {
  return execFileSync('unzip', ['-p', file, innerPath], { encoding: 'utf8' });
}

function parseSharedStrings(file: string): string[] {
  try {
    const xml = readZipText(file, 'xl/sharedStrings.xml');
    return [...xml.matchAll(/<si[\s\S]*?>([\s\S]*?)<\/si>/g)].map((match) => {
      const segment = match[1] || '';
      return [...segment.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)]
        .map((entry) => decodeXml(entry[1] || ''))
        .join('');
    });
  } catch {
    return [];
  }
}

function decodeXml(value: string): string {
  return value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}

function columnIndexToLetters(index: number): string {
  let current = index;
  let result = '';
  while (current > 0) {
    const remainder = (current - 1) % 26;
    result = String.fromCharCode(65 + remainder) + result;
    current = Math.floor((current - 1) / 26);
  }
  return result;
}

function parseXlsxRows(file: string): SpreadsheetRow[] {
  const sharedStrings = parseSharedStrings(file);
  const xml = readZipText(file, 'xl/worksheets/sheet1.xml');
  const rowMatches = [...xml.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)];
  if (!rowMatches.length) return [];

  const parseCell = (cellXml: string) => {
    const typeMatch = cellXml.match(/\bt="([^"]+)"/);
    const type = typeMatch?.[1] || '';

    if (type === 'inlineStr') {
      return [...cellXml.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)]
        .map((entry) => decodeXml(entry[1] || ''))
        .join('');
    }

    const valueMatch = cellXml.match(/<v[^>]*>([\s\S]*?)<\/v>/);
    const rawValue = valueMatch?.[1] || '';
    if (type === 's') {
      return sharedStrings[Number(rawValue)] || '';
    }
    return decodeXml(rawValue);
  };

  const readRow = (rowXml: string) => {
    const cells = [...rowXml.matchAll(/<c\b([^>]*)>([\s\S]*?)<\/c>/g)];
    const byColumn = new Map<string, string>();

    for (const [, attributes, cellBody] of cells) {
      const refMatch = attributes.match(/\br="([A-Z]+)\d+"/);
      const columnRef = refMatch?.[1];
      if (!columnRef) continue;
      byColumn.set(columnRef, parseCell(`<c ${attributes}>${cellBody}</c>`));
    }

    return byColumn;
  };

  const headersByColumn = readRow(rowMatches[0][1] || '');
  const headerColumns = [...headersByColumn.keys()].sort((a, b) => a.localeCompare(b));
  const headers = headerColumns.map((column) => headersByColumn.get(column) || '');
  const rows: SpreadsheetRow[] = [];

  for (const match of rowMatches.slice(1)) {
    const row = readRow(match[1] || '');
    const result: SpreadsheetRow = {};

    headers.forEach((header, index) => {
      if (!header) return;
      result[header] = row.get(columnIndexToLetters(index + 1)) || '';
    });

    rows.push(result);
  }

  return rows;
}

function mapCategory(rawSubcategory: string) {
  const normalized = normalize(rawSubcategory);

  if (['laptop', 'laptops', 'notebook', 'notebooks'].includes(normalized)) {
    return {
      parentCategorySlug: 'electronics',
      categorySlug: 'laptops',
      subcategorySlug: '',
      parentCategoryName: 'Electronics',
      categoryName: 'Laptops',
      subcategoryName: '',
      categoryPath: 'electronics/laptops',
      importCategorySlug: 'laptops',
    };
  }

  if (['phone', 'phones', 'mobile', 'mobiles', 'smartphone', 'smartphones'].includes(normalized)) {
    return {
      parentCategorySlug: 'electronics',
      categorySlug: 'mobiles-tablets',
      subcategorySlug: 'smartphones',
      parentCategoryName: 'Electronics',
      categoryName: 'Mobiles & Tablets',
      subcategoryName: 'Smartphones',
      categoryPath: 'electronics/mobiles-tablets/smartphones',
      importCategorySlug: 'phones',
    };
  }

  if (['tablet', 'tablets', 'ipad', 'ipads'].includes(normalized)) {
    return {
      parentCategorySlug: 'electronics',
      categorySlug: 'mobiles-tablets',
      subcategorySlug: 'tablets',
      parentCategoryName: 'Electronics',
      categoryName: 'Mobiles & Tablets',
      subcategoryName: 'Tablets',
      categoryPath: 'electronics/mobiles-tablets/tablets',
      importCategorySlug: 'tablets',
    };
  }

  if (['accessory', 'accessories', 'mobile-accessories'].includes(normalized)) {
    return {
      parentCategorySlug: 'electronics',
      categorySlug: 'mobiles-tablets',
      subcategorySlug: 'mobile-accessories',
      parentCategoryName: 'Electronics',
      categoryName: 'Mobiles & Tablets',
      subcategoryName: 'Mobile Accessories',
      categoryPath: 'electronics/mobiles-tablets/mobile-accessories',
      importCategorySlug: 'accessories',
    };
  }

  return {
    parentCategorySlug: 'electronics',
    categorySlug: 'laptops',
    subcategorySlug: '',
    parentCategoryName: 'Electronics',
    categoryName: 'Laptops',
    subcategoryName: '',
    categoryPath: 'electronics/laptops',
    importCategorySlug: slugify(rawSubcategory || 'laptops') || 'laptops',
  };
}

function buildCanonicalUrl(row: SpreadsheetRow, slug: string, category: ReturnType<typeof mapCategory>) {
  const provided = safeText(row.CanonicalURL || row.canonical_url);
  if (/^https:\/\//i.test(provided)) return provided;
  return `https://exshopi.com/${category.categoryPath}/${slug}`;
}

async function main() {
  if (!prismaRuntime.enabled) {
    throw new Error('Prisma runtime is not enabled. Set USE_PRISMA_RUNTIME=true and DATABASE_URL before running this importer.');
  }

  const rows = parseXlsxRows(INPUT_PATH);
  if (!rows.length) {
    throw new Error(`No spreadsheet rows found in ${INPUT_PATH}`);
  }

  await prismaRuntime.ensureCoreAuthRecords();

  const categoryRecords = await prismaRuntime.getCategories();
  const electronics = categoryRecords.find((entry) => entry.slug === 'electronics');
  if (!electronics) {
    throw new Error('Electronics category is missing from the production catalog.');
  }

  const seller =
    (await prismaRuntime.getSeller('exshopi_official')) ||
    (await prismaRuntime.getSellerBySlug('exshopi-official')) ||
    (await prismaRuntime.getAllSellers()).find((entry) => entry.isOfficial);

  if (!seller) {
    throw new Error('ExShopi Official seller/store record is missing.');
  }

  const existingProducts = await prismaRuntime.getAllProductsForAdmin();
  const existingSlugs = new Set(existingProducts.map((product) => normalize(product.slug)).filter(Boolean));
  const existingTitles = new Set(existingProducts.map((product) => normalize(product.title)).filter(Boolean));
  const existingBrandModels = new Set(
    existingProducts
      .map((product) => {
        const brand = normalize(product.brand);
        const model = normalize(product.specs?.model || product.specs?.specificationValues?.model || '');
        return brand && model ? `${brand}::${model}` : '';
      })
      .filter(Boolean)
  );

  const seenInputKeys = new Set<string>();
  const summary = {
    totalRows: rows.length,
    validatedRows: 0,
    inserted: 0,
    skipped: 0,
    duplicateCount: 0,
    invalidCount: 0,
    failedCount: 0,
    duplicateRows: [] as string[],
    invalidRows: [] as Array<{ title: string; reason: string }>,
    failedRows: [] as Array<{ title: string; reason: string }>,
  };

  for (const row of rows) {
    const title = safeText(row.Title || row.title);
    const brand = safeText(row.Brand || row.brand);
    const model = safeText(row.Model || row.model);
    const requestedSlug = slugify(row.Slug || row.slug || title);
    const duplicateKey = `${normalize(title)}::${normalize(brand)}::${normalize(model)}`;

    if (!title || !requestedSlug) {
      summary.invalidCount += 1;
      summary.skipped += 1;
      summary.invalidRows.push({ title: title || '(untitled row)', reason: 'Missing required title or slug.' });
      continue;
    }

    if (
      existingSlugs.has(normalize(requestedSlug)) ||
      existingTitles.has(normalize(title)) ||
      (brand && model && existingBrandModels.has(`${normalize(brand)}::${normalize(model)}`)) ||
      seenInputKeys.has(duplicateKey)
    ) {
      summary.duplicateCount += 1;
      summary.skipped += 1;
      summary.duplicateRows.push(title);
      continue;
    }

    const category = mapCategory(row.Subcategory || row.subcategory || row.Category || row.category);
    const description = [safeText(row.Description || row.description), safeText(row.LongDescription || row.long_description)]
      .filter(Boolean)
      .join('\n\n');

    const price = parseNumber(row.PriceAED || row.price_aed, 0);
    const stock = parseInteger(row.Stock || row.stock, 0);
    const searchTags = splitTags(row.SearchTags || row.search_tags);
    const canonicalUrl = buildCanonicalUrl(row, requestedSlug, category);

    summary.validatedRows += 1;

    try {
      await prismaRuntime.createProduct({
        sellerId: seller.id,
        storeId: seller.id,
        categoryId: electronics.id,
        title,
        slug: requestedSlug,
        description,
        price,
        originalPrice: price,
        salePrice: price,
        image: '',
        images: [],
        stock,
        rating: 0,
        reviews: 0,
        sku: safeText(row.SKU || row.sku) || `EX-DRAFT-${requestedSlug.toUpperCase()}`,
        brand,
        metaTitle: safeText(row.SEOTitle || row.seo_title) || title,
        metaDescription: safeText(row.SEODescription || row.seo_description) || safeText(row.Description || row.description),
        canonicalUrl,
        ogTitle: safeText(row.SEOTitle || row.seo_title) || title,
        ogDescription: safeText(row.SEODescription || row.seo_description) || safeText(row.Description || row.description),
        ogImage: '',
        status: 'draft',
        approvalStatus: 'pending',
        productStatus: 'draft',
        visibilityStatus: 'hidden',
        ownership: 'official',
        createdByRole: 'admin',
        approvalRequestedAt: new Date().toISOString(),
        approvedAt: '',
        rejectedAt: '',
        views: 0,
        wishlistCount: 0,
        rejectionReason: '',
        approvalNotes: '',
        badges: [],
        specs: {
          templateId: category.subcategorySlug || category.categorySlug,
          templateName: category.subcategoryName || category.categoryName,
          categoryTemplateKey: category.subcategorySlug || category.categorySlug,
          shortDescription: safeText(row.Description || row.description),
          longDescription: safeText(row.Description || row.description),
          specificationValues: {
            brand,
            model,
            condition: safeText(row.Condition || row.condition),
            processorBrand: safeText(row.ProcessorBrand || row.processor_brand),
            processorModel: safeText(row.ProcessorModel || row.processor_model),
            generation: safeText(row.Generation || row.generation),
            ram: safeText(row.RAM || row.ram),
            ramType: safeText(row.RAMType || row.ram_type),
            storage: safeText(row.Storage || row.storage),
            storageType: safeText(row.StorageType || row.storage_type),
            graphics: safeText(row.Graphics || row.graphics),
            graphicsType: safeText(row.GraphicsType || row.graphics_type),
            screenSize: safeText(row.ScreenSize || row.screen_size),
            resolution: safeText(row.Resolution || row.resolution),
            displayType: safeText(row.DisplayType || row.display_type),
            keyboard: safeText(row.Keyboard || row.keyboard),
            color: safeText(row.Color || row.color),
            operatingSystem: safeText(row.OperatingSystem || row.operating_system),
            weight: safeText(row.Weight || row.weight),
            ports: safeText(row.Ports || row.ports),
            battery: safeText(row.Battery || row.battery),
          },
          specifications: {
            Condition: safeText(row.Condition || row.condition),
            'Processor Brand': safeText(row.ProcessorBrand || row.processor_brand),
            'Processor Model': safeText(row.ProcessorModel || row.processor_model),
            Generation: safeText(row.Generation || row.generation),
            RAM: safeText(row.RAM || row.ram),
            'RAM Type': safeText(row.RAMType || row.ram_type),
            Storage: safeText(row.Storage || row.storage),
            'Storage Type': safeText(row.StorageType || row.storage_type),
            Graphics: safeText(row.Graphics || row.graphics),
            'Graphics Type': safeText(row.GraphicsType || row.graphics_type),
            'Screen Size': safeText(row.ScreenSize || row.screen_size),
            Resolution: safeText(row.Resolution || row.resolution),
            'Display Type': safeText(row.DisplayType || row.display_type),
            Keyboard: safeText(row.Keyboard || row.keyboard),
            Color: safeText(row.Color || row.color),
            'Operating System': safeText(row.OperatingSystem || row.operating_system),
            Weight: safeText(row.Weight || row.weight),
            Ports: safeText(row.Ports || row.ports),
            Battery: safeText(row.Battery || row.battery),
            Model: model,
          },
          specificationGroups: [],
          additionalSpecificationGroups: [],
          attributes: {
            brand,
            model,
            subcategory: category.subcategorySlug || category.categorySlug,
            importCategorySlug: category.importCategorySlug,
          },
          variants: [],
          defaultVariantId: null,
          briefHighlights: [brand, model, safeText(row.ProcessorModel || row.processor_model), safeText(row.RAM || row.ram), safeText(row.Storage || row.storage)].filter(Boolean),
          keyFeatures: [brand, model, safeText(row.ProcessorModel || row.processor_model), safeText(row.RAM || row.ram), safeText(row.Storage || row.storage)].filter(Boolean),
          whatsInTheBox: [],
          searchTags,
          variantAttributes: [],
          metaTitle: safeText(row.SEOTitle || row.seo_title) || title,
          metaDescription: safeText(row.SEODescription || row.seo_description) || safeText(row.Description || row.description),
          metaKeywords: searchTags.join(', '),
          canonicalUrl,
          ogTitle: safeText(row.SEOTitle || row.seo_title) || title,
          ogDescription: safeText(row.SEODescription || row.seo_description) || safeText(row.Description || row.description),
          ogImage: '',
          shippingWeight: safeText(row.Weight || row.weight),
          packageSize: safeText(row.ScreenSize || row.screen_size),
          returnPolicy: '',
          warrantyPolicy: '',
          sellerNotes: 'Imported via Prisma draft importer. Images intentionally left empty for manual admin upload.',
          listingCompleteness: 70,
          seoScore: 76,
          parentCategorySlug: category.parentCategorySlug,
          categorySlug: category.categorySlug,
          subcategorySlug: category.subcategorySlug,
          parentCategoryName: category.parentCategoryName,
          categoryName: category.categoryName,
          subcategoryName: category.subcategoryName,
          categoryPath: category.categoryPath,
          approvalStatus: 'pending',
          productStatus: 'draft',
          visibilityStatus: 'hidden',
          ownership: 'official',
          createdByRole: 'admin',
          badges: [],
          model,
          condition: safeText(row.Condition || row.condition),
          importMeta: {
            source: 'xlsx-prisma',
            sourceFile: path.basename(INPUT_PATH),
            originalImageUrl: safeText(row.ImageURL || row.image_url),
          },
        },
      } as any);

      existingSlugs.add(normalize(requestedSlug));
      existingTitles.add(normalize(title));
      if (brand && model) {
        existingBrandModels.add(`${normalize(brand)}::${normalize(model)}`);
      }
      seenInputKeys.add(duplicateKey);
      summary.inserted += 1;
    } catch (error) {
      summary.failedCount += 1;
      summary.skipped += 1;
      summary.failedRows.push({
        title,
        reason: error instanceof Error ? error.message : String(error),
      });
    }
  }

  console.log(
    JSON.stringify(
      {
        ...summary,
        duplicateRows: summary.duplicateRows.slice(0, 20),
        invalidRows: summary.invalidRows.slice(0, 20),
        failedRows: summary.failedRows.slice(0, 20),
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
