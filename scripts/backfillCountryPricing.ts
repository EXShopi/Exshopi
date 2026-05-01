import { prisma } from '../backend/prisma';
import { db } from '../backend/database';

type GccCountryCode = 'AE' | 'SA' | 'QA' | 'KW' | 'BH' | 'OM';

const GCC_CODES: GccCountryCode[] = ['AE', 'SA', 'QA', 'KW', 'BH', 'OM'];
const GCC_RATE_FROM_AED: Record<GccCountryCode, number> = {
  AE: 1,
  SA: 1.02,
  QA: 0.99,
  KW: 0.083,
  BH: 0.102,
  OM: 0.105,
};
const GCC_CURRENCY_BY_COUNTRY: Record<GccCountryCode, string> = {
  AE: 'AED',
  SA: 'SAR',
  QA: 'QAR',
  KW: 'KWD',
  BH: 'BHD',
  OM: 'OMR',
};
const PRICE_COLUMN_BY_COUNTRY: Record<GccCountryCode, string> = {
  AE: 'price_uae',
  SA: 'price_ksa',
  QA: 'price_qatar',
  KW: 'price_kuwait',
  BH: 'price_bahrain',
  OM: 'price_oman',
};
const COMPARE_COLUMN_BY_COUNTRY: Record<GccCountryCode, string> = {
  AE: 'compare_at_price_uae',
  SA: 'compare_at_price_ksa',
  QA: 'compare_at_price_qatar',
  KW: 'compare_at_price_kuwait',
  BH: 'compare_at_price_bahrain',
  OM: 'compare_at_price_oman',
};

function ceilToStep(value: number, step: number) {
  return Math.ceil(value / step) * step;
}

function toNumber(value: unknown, fallback = 0) {
  const numeric = Number(value ?? fallback);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function convertAedToSmartGccPrice(amountAed: unknown, countryCode: GccCountryCode) {
  const base = toNumber(amountAed, 0);
  if (base <= 0) return 0;
  const converted = Number((base * GCC_RATE_FROM_AED[countryCode]).toFixed(2));

  switch (countryCode) {
    case 'SA':
      return Math.max(1, ceilToStep(converted, 50) - 1);
    case 'QA':
      return Math.max(1, ceilToStep(converted, 100) - 1);
    case 'KW':
    case 'OM':
      return converted < 10
        ? Number((Math.ceil(converted * 10) / 10).toFixed(2))
        : Math.max(0.1, ceilToStep(converted, 10) - 1);
    case 'BH':
      return ceilToStep(converted, 5);
    case 'AE':
    default:
      return Math.round(converted);
  }
}

function buildSmartPricing(basePriceAed: unknown, comparePriceAed: unknown) {
  const basePrice = toNumber(basePriceAed, 0);
  const comparePrice = toNumber(comparePriceAed, basePrice);
  return GCC_CODES.reduce((acc, countryCode) => {
    acc[countryCode] = {
      currency: GCC_CURRENCY_BY_COUNTRY[countryCode],
      price: convertAedToSmartGccPrice(basePrice, countryCode),
      compareAtPrice: convertAedToSmartGccPrice(comparePrice, countryCode),
    };
    return acc;
  }, {} as Record<GccCountryCode, { currency: string; price: number; compareAtPrice: number }>);
}

async function getProductColumns() {
  const rows = await prisma.$queryRaw<Array<{ column_name: string }>>`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = 'products'
  `;
  return new Set(rows.map((row) => row.column_name));
}

async function backfillPrismaProducts() {
  const columns = await getProductColumns();
  const selectParts = [
    'id',
    'title',
    'price',
    columns.has('price_uae') ? 'price_uae' : 'NULL::numeric AS price_uae',
    columns.has('original_price') ? 'original_price' : 'NULL::numeric AS original_price',
    columns.has('compare_at_price_uae') ? 'compare_at_price_uae' : 'NULL::numeric AS compare_at_price_uae',
    columns.has('specs_json') ? 'specs_json' : 'NULL::jsonb AS specs_json',
  ];
  const products = await prisma.$queryRawUnsafe<Array<Record<string, any>>>(
    `SELECT ${selectParts.join(', ')} FROM products ORDER BY created_at DESC`
  );

  let updated = 0;
  for (const product of products) {
    const basePriceAed = toNumber(product.price_uae ?? product.price, 0);
    const comparePriceAed = toNumber(product.compare_at_price_uae ?? product.original_price ?? product.price, basePriceAed);
    const pricesByCountry = buildSmartPricing(basePriceAed, comparePriceAed);
    const specsJson = {
      ...(product.specs_json && typeof product.specs_json === 'object' ? product.specs_json : {}),
      pricesByCountry,
      pricingFallbacks: {
        priceUae: pricesByCountry.AE.price,
        priceKsa: pricesByCountry.SA.price,
        priceQatar: pricesByCountry.QA.price,
        priceKuwait: pricesByCountry.KW.price,
        priceBahrain: pricesByCountry.BH.price,
        priceOman: pricesByCountry.OM.price,
        compareAtPriceUae: pricesByCountry.AE.compareAtPrice,
        compareAtPriceKsa: pricesByCountry.SA.compareAtPrice,
        compareAtPriceQatar: pricesByCountry.QA.compareAtPrice,
        compareAtPriceKuwait: pricesByCountry.KW.compareAtPrice,
        compareAtPriceBahrain: pricesByCountry.BH.compareAtPrice,
        compareAtPriceOman: pricesByCountry.OM.compareAtPrice,
      },
    };

    const sets: string[] = [];
    const values: any[] = [];
    const addValue = (value: any) => {
      values.push(value);
      return `$${values.length}`;
    };

    for (const countryCode of GCC_CODES) {
      const priceColumn = PRICE_COLUMN_BY_COUNTRY[countryCode];
      if (columns.has(priceColumn)) {
        sets.push(`"${priceColumn}" = ${addValue(pricesByCountry[countryCode].price)}`);
      }

      const compareColumn = COMPARE_COLUMN_BY_COUNTRY[countryCode];
      if (columns.has(compareColumn)) {
        sets.push(`"${compareColumn}" = ${addValue(pricesByCountry[countryCode].compareAtPrice)}`);
      }
    }

    if (columns.has('prices_by_country')) {
      sets.push(`"prices_by_country" = ${addValue(JSON.stringify(pricesByCountry))}::jsonb`);
    }
    if (columns.has('specs_json')) {
      sets.push(`"specs_json" = ${addValue(JSON.stringify(specsJson))}::jsonb`);
    }

    if (!sets.length) continue;
    await prisma.$executeRawUnsafe(
      `UPDATE products SET ${sets.join(', ')} WHERE id = ${addValue(product.id)}`,
      ...values
    );
    updated += 1;
  }

  console.log(`[country-pricing] smart backfilled ${updated} Prisma products`);
}

function backfillJsonProducts() {
  const products = db.getAllProductsForAdmin();
  let updated = 0;
  for (const product of products) {
    const basePriceAed = toNumber((product as any).priceUae ?? product.price, 0);
    const comparePriceAed = toNumber((product as any).compareAtPriceUae ?? product.originalPrice ?? product.price, basePriceAed);
    const pricesByCountry = buildSmartPricing(basePriceAed, comparePriceAed);

    db.updateProduct(product.id, {
      priceUae: pricesByCountry.AE.price,
      priceKsa: pricesByCountry.SA.price,
      priceQatar: pricesByCountry.QA.price,
      priceKuwait: pricesByCountry.KW.price,
      priceBahrain: pricesByCountry.BH.price,
      priceOman: pricesByCountry.OM.price,
      compareAtPriceUae: pricesByCountry.AE.compareAtPrice,
      compareAtPriceKsa: pricesByCountry.SA.compareAtPrice,
      compareAtPriceQatar: pricesByCountry.QA.compareAtPrice,
      compareAtPriceKuwait: pricesByCountry.KW.compareAtPrice,
      compareAtPriceBahrain: pricesByCountry.BH.compareAtPrice,
      compareAtPriceOman: pricesByCountry.OM.compareAtPrice,
      pricesByCountry,
      specs: {
        ...((product as any).specs || {}),
        pricesByCountry,
      },
    } as any);
    updated += 1;
  }

  console.log(`[country-pricing] smart backfilled ${updated} JSON products`);
}

async function main() {
  if (process.env.DATABASE_URL || process.env.EXSHOPI_DB_MODE === 'prisma' || process.env.USE_PRISMA_RUNTIME === 'true') {
    await backfillPrismaProducts();
    await prisma.$disconnect();
    return;
  }

  backfillJsonProducts();
}

main().catch(async (error) => {
  console.error('[country-pricing] backfill failed', error);
  await prisma.$disconnect().catch(() => undefined);
  process.exit(1);
});
