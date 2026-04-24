import fs from 'node:fs';
import path from 'node:path';

type Product = {
  id?: string;
  title?: string;
  slug?: string;
  description?: string;
  metaTitle?: string;
  metaDescription?: string;
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  image?: string;
  images?: string[];
  specs?: {
    shortDescription?: string;
    longDescription?: string;
    sellerNotes?: string;
    keyFeatures?: string[];
  };
};

type SuggestedUpdate = {
  productId: string;
  currentTitle: string;
  confidenceLevel: 'high';
  approvedForApply: boolean;
  improvedTitle: string;
  shortDescription: string;
  fullDescription: string;
  keySpecifications: string[];
  seoSlug: string;
  seoTitle: string;
  seoDescription: string;
  canonicalUrl: string;
  ogTitle: string;
  ogDescription: string;
  sellerNote: string;
};

type SuggestedUpdatesFile = {
  updates?: SuggestedUpdate[];
};

type UpdateLog = {
  productId: string;
  title: string;
  fieldsChanged: string[];
  skipped: boolean;
  reason?: string;
};

const cwd = process.cwd();
const dbPath = path.join(cwd, 'backend', 'db.json');
const updatesPath = path.join(cwd, 'backend', 'data', 'draftCatalogSuggestedUpdates.high.json');
const logsDir = path.join(cwd, 'backend', 'data');

function readJsonFile<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
}

function normalizeText(value: unknown): string {
  return String(value ?? '').trim();
}

function backupDb(): string {
  const timestamp = Date.now();
  const backupPath = path.join(cwd, 'backend', `db.json.pre-draft-catalog-apply-${timestamp}.bak`);
  fs.copyFileSync(dbPath, backupPath);
  return backupPath;
}

function setIfBetter(target: Record<string, unknown>, key: string, nextValue: unknown, changed: string[]): void {
  const incoming = normalizeText(nextValue);
  if (!incoming) return;

  const current = normalizeText(target[key]);
  if (current === incoming) return;

  if (!current || incoming.length > current.length) {
    target[key] = nextValue;
    changed.push(key);
  }
}

function applyUpdate(product: Product, update: SuggestedUpdate): string[] {
  const changed: string[] = [];
  const specs = product.specs && typeof product.specs === 'object' ? product.specs : {};
  product.specs = specs;

  setIfBetter(product as Record<string, unknown>, 'title', update.improvedTitle, changed);
  setIfBetter(product as Record<string, unknown>, 'description', update.fullDescription, changed);
  setIfBetter(product as Record<string, unknown>, 'slug', update.seoSlug, changed);
  setIfBetter(product as Record<string, unknown>, 'metaTitle', update.seoTitle, changed);
  setIfBetter(product as Record<string, unknown>, 'metaDescription', update.seoDescription, changed);
  setIfBetter(product as Record<string, unknown>, 'canonicalUrl', update.canonicalUrl, changed);
  setIfBetter(product as Record<string, unknown>, 'ogTitle', update.ogTitle, changed);
  setIfBetter(product as Record<string, unknown>, 'ogDescription', update.ogDescription, changed);
  setIfBetter(specs as Record<string, unknown>, 'shortDescription', update.shortDescription, changed);
  setIfBetter(specs as Record<string, unknown>, 'longDescription', update.fullDescription, changed);
  setIfBetter(specs as Record<string, unknown>, 'sellerNotes', update.sellerNote, changed);

  if ((!Array.isArray(specs.keyFeatures) || specs.keyFeatures.length === 0) && update.keySpecifications.length > 0) {
    specs.keyFeatures = update.keySpecifications;
    changed.push('specs.keyFeatures');
  }

  return changed;
}

function main(): void {
  const db = readJsonFile<{ products?: Product[] }>(dbPath);
  const updatesFile = readJsonFile<SuggestedUpdatesFile>(updatesPath);
  const products = Array.isArray(db.products) ? db.products : [];
  const updates = Array.isArray(updatesFile.updates) ? updatesFile.updates : [];
  const logs: UpdateLog[] = [];

  const approvedUpdates = updates.filter((update) => update.approvedForApply && update.confidenceLevel === 'high');

  if (approvedUpdates.length === 0) {
    const logPath = path.join(logsDir, 'draftCatalogApplyLog.json');
    fs.writeFileSync(
      logPath,
      `${JSON.stringify(
        {
          generatedAt: new Date().toISOString(),
          backupPath: null,
          changedProducts: 0,
          message: 'No approved high-confidence updates found. backend/db.json was not modified.',
          logs: [],
        },
        null,
        2
      )}\n`,
      'utf8'
    );
    console.log(
      JSON.stringify(
        {
          changedProducts: 0,
          backupPath: null,
          logPath: path.relative(cwd, logPath),
          message: 'No approved high-confidence updates found. backend/db.json was not modified.',
        },
        null,
        2
      )
    );
    return;
  }

  const backupPath = backupDb();

  for (const update of approvedUpdates) {
    const product = products.find((item) => normalizeText(item.id) === update.productId);
    if (!product) {
      logs.push({
        productId: update.productId,
        title: update.currentTitle,
        fieldsChanged: [],
        skipped: true,
        reason: 'product_not_found',
      });
      continue;
    }

    const changed = applyUpdate(product, update);
    if (changed.length === 0) {
      logs.push({
        productId: update.productId,
        title: normalizeText(product.title || update.currentTitle),
        fieldsChanged: [],
        skipped: true,
        reason: 'no_better_data_to_apply',
      });
      continue;
    }

    logs.push({
      productId: update.productId,
      title: normalizeText(product.title || update.currentTitle),
      fieldsChanged: changed,
      skipped: false,
    });
  }

  fs.writeFileSync(dbPath, `${JSON.stringify(db, null, 2)}\n`, 'utf8');

  const logPath = path.join(logsDir, 'draftCatalogApplyLog.json');
  fs.writeFileSync(
    logPath,
    `${JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        backupPath: path.relative(cwd, backupPath),
        changedProducts: logs.filter((log) => !log.skipped).length,
        logs,
      },
      null,
      2
    )}\n`,
    'utf8'
  );

  console.log(
    JSON.stringify(
      {
        changedProducts: logs.filter((log) => !log.skipped).length,
        backupPath: path.relative(cwd, backupPath),
        logPath: path.relative(cwd, logPath),
      },
      null,
      2
    )
  );
}

main();
