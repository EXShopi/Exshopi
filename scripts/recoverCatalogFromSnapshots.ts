import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const currentDbPath = path.join(root, 'backend', 'db.json');
const liveBackupPath = path.join(root, 'backend', 'db.json.pre-import-thunderbit-1775219958749.bak');
const draftImportPath = path.join(root, 'backend', 'data', 'importedDraftProducts.json');

const readJson = (filePath: string) => JSON.parse(fs.readFileSync(filePath, 'utf8'));
const writeJson = (filePath: string, value: any) =>
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');

const normalize = (value: any) => String(value || '').trim().toLowerCase();
const normalizeModel = (product: any) =>
  normalize(product?.specs?.model || product?.specs?.specificationValues?.model);

const getIdentity = (product: any) => {
  const slug = normalize(product?.slug);
  const title = normalize(product?.title);
  const brand = normalize(product?.brand);
  const model = normalizeModel(product);
  return {
    slug,
    title,
    brandModel: brand && model ? `${brand}::${model}` : '',
  };
};

const countByLifecycle = (products: any[]) =>
  products.reduce(
    (acc, product) => {
      const status = normalize(product?.status || product?.productStatus);
      if (status === 'live') acc.live += 1;
      if (status === 'draft') acc.draft += 1;
      if (status === 'pending' || status === 'pending_approval') acc.pending += 1;
      return acc;
    },
    { live: 0, draft: 0, pending: 0 }
  );

const db = readJson(currentDbPath);
const currentProducts = Array.isArray(db.products) ? db.products : [];
const liveBackup = Array.isArray(readJson(liveBackupPath).products) ? readJson(liveBackupPath).products : [];
const draftImport = Array.isArray(readJson(draftImportPath)) ? readJson(draftImportPath) : [];

const slugSet = new Set<string>();
const titleSet = new Set<string>();
const brandModelSet = new Set<string>();

for (const product of currentProducts) {
  const identity = getIdentity(product);
  if (identity.slug) slugSet.add(identity.slug);
  if (identity.title) titleSet.add(identity.title);
  if (identity.brandModel) brandModelSet.add(identity.brandModel);
}

const exists = (product: any) => {
  const identity = getIdentity(product);
  return (
    (identity.slug && slugSet.has(identity.slug)) ||
    (identity.title && titleSet.has(identity.title)) ||
    (identity.brandModel && brandModelSet.has(identity.brandModel))
  );
};

const register = (product: any) => {
  const identity = getIdentity(product);
  if (identity.slug) slugSet.add(identity.slug);
  if (identity.title) titleSet.add(identity.title);
  if (identity.brandModel) brandModelSet.add(identity.brandModel);
};

const restoredLive: any[] = [];
for (const product of liveBackup) {
  if (exists(product)) continue;
  const restored = {
    ...product,
    status: 'live',
    productStatus: product.productStatus || 'live',
    approvalStatus: product.approvalStatus || 'approved',
    visibilityStatus: product.visibilityStatus || 'live',
  };
  restoredLive.push(restored);
  register(restored);
}

const restoredDrafts: any[] = [];
for (const product of draftImport) {
  if (exists(product)) continue;
  const restored = {
    ...product,
    status: 'draft',
    productStatus: 'draft',
    approvalStatus: product.approvalStatus || 'pending',
    visibilityStatus: product.visibilityStatus || 'hidden',
    ownership: product.ownership || 'official',
    createdByRole: product.createdByRole || 'admin',
  };
  restoredDrafts.push(restored);
  register(restored);
}

const mergedProducts = [...currentProducts, ...restoredLive, ...restoredDrafts];
const backupPath = path.join(root, 'backend', `db.json.pre-recovery-${Date.now()}.bak`);
fs.copyFileSync(currentDbPath, backupPath);
writeJson(currentDbPath, {
  ...db,
  products: mergedProducts,
});

const before = countByLifecycle(currentProducts);
const after = countByLifecycle(mergedProducts);

console.log(
  JSON.stringify(
    {
      backupPath,
      before: {
        total: currentProducts.length,
        ...before,
      },
      restored: {
        live: restoredLive.length,
        drafts: restoredDrafts.length,
      },
      after: {
        total: mergedProducts.length,
        ...after,
      },
    },
    null,
    2
  )
);
