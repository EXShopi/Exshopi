#!/usr/bin/env tsx
/*
  Reassign product.categoryId values in backend/db.json to use current local category IDs.
  - Dry-run by default: writes report to scripts/reassign-report.json but does not modify db.json
  - Use --apply to perform a backup and update backend/db.json in-place
  This script is conservative: it creates a backup before applying and preserves legacy backendCategoryId in specs.
*/
import fs from 'node:fs';
import path from 'node:path';

const DB_PATH = path.resolve(process.cwd(), 'backend', 'db.json');
const REPORT_PATH = path.resolve(process.cwd(), 'scripts', 'reassign-report.json');

function readDb() {
  const raw = fs.readFileSync(DB_PATH, 'utf8');
  return JSON.parse(raw);
}

function writeReport(report: any) {
  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2), 'utf8');
}

function backupDb() {
  const bak = `${DB_PATH}.bak-${Date.now()}`;
  fs.copyFileSync(DB_PATH, bak);
  return bak;
}

function buildLocalMaps(db: any) {
  const slugToParentId = new Map<string, string>();
  const idSet = new Set<string>();
  for (const c of db.categories || []) {
    if (c.id) idSet.add(String(c.id));
    slugToParentId.set(String(c.slug), String(c.id));
    for (const sub of c.subcategories || []) {
      if (sub && sub.slug) slugToParentId.set(String(sub.slug), String(c.id));
    }
  }
  return { slugToParentId, idSet };
}

function main() {
  const args = process.argv.slice(2);
  const apply = args.includes('--apply') || args.includes('-a');

  const db = readDb();
  const { slugToParentId, idSet } = buildLocalMaps(db);

  // Known external (Thunderbit) category ids -> preferred local category slug
  const externalMap: Record<string, string> = {
    // electronics
    cmnd5pp800007c9lrhh02cmrd: 'electronics',
    // accessories
    cmnd5psjh000fc9lrxk217w23: 'accessories',
    // daily use / gifts -> home-kitchen
    cmnd5pw9f000kc9lrvx6zq7ld: 'home-kitchen',
    // men clothing
    cmnh8k5oa0002c9kwoz7c8f5b: 'men-clothing',
    // mobiles/laptops/tablets
    cmnd5pqvr000bc9lr5e72qdxh: 'mobiles',
    cmnd5pq2v0009c9lr57i3qcsv: 'laptops',
    cmnd5prnj000dc9lrmitv6ipy: 'tablets',
  };

  // Template -> category slug map (keeps in sync with frontend mapping)
  const templateToSlug: Record<string, string> = {
    laptops: 'laptops',
    mobiles: 'mobiles',
    tablets: 'tablets',
    accessories: 'accessories',
    clothing: 'men-clothing',
    shoes: 'fashion',
    'electronics-used-devices': 'electronics',
    'beauty-makeup': 'beauty',
    'gifts-daily-use': 'home-kitchen',
  };

  const keywordChecks: Array<{ regex: RegExp; slug: string }> = [
    { regex: /\b(macbook|laptop|notebook|ssd|intel|radeon|core i|mac pro)\b/i, slug: 'electronics' },
    { regex: /\b(iphone|smartphone|mobile|galaxy|samsung|pixel|xiaomi|oppO)\b/i, slug: 'mobiles' },
    { regex: /\b(shirt|t-?shirt|jeans|polo|jacket|hoodie|trouser|dress|skirt)\b/i, slug: 'men-clothing' },
    { regex: /\b(women|women's|women s|ladies|dress|skirt|blouse)\b/i, slug: 'women-clothing' },
    { regex: /\b(kitchen|utensil|plate|cup|mug|storage|organizer|shelf|household|cleaner|vacuum|bag|zipper|container)\b/i, slug: 'home-kitchen' },
    { regex: /\b(accessor(y|ies)|case|charger|cable|headset|headphones|speaker|camera|watch|backpack|wallet|sunglass|organizer)\b/i, slug: 'accessories' },
  ];

  const report: any = { total: 0, changed: 0, unchanged: 0, details: [] };

  for (const product of db.products || []) {
    report.total += 1;
    const original = product.categoryId || product.specs?.backendCategoryId || null;
    let resolved: string | null = null;

    // If original is already a current local top-level id, leave it
    if (original && idSet.has(String(original))) {
      resolved = String(original);
    }

    // If original is a known external id, map to local parent id via slug
    if (!resolved && original && externalMap[String(original)]) {
      const slug = externalMap[String(original)];
      resolved = slugToParentId.get(slug) || null;
    }

    // If original value looks like a slug (e.g. 'electronics' or 'mobiles')
    if (!resolved && original && typeof original === 'string' && slugToParentId.has(String(original))) {
      resolved = slugToParentId.get(String(original)) || null;
    }

    // Try template mapping
    if (!resolved && product.specs?.templateId) {
      const tpl = String(product.specs.templateId);
      const slug = templateToSlug[tpl];
      if (slug && slugToParentId.has(slug)) resolved = slugToParentId.get(slug) || null;
    }

    // Keyword heuristics
    if (!resolved) {
      const hay = `${product.title || ''} ${product.description || ''} ${product.specs?.shortDescription || ''}`;
      for (const k of keywordChecks) {
        if (k.regex.test(hay)) {
          resolved = slugToParentId.get(k.slug) || null;
          if (resolved) break;
        }
      }
    }

    const before = original || null;
    const after = resolved || null;

    if (after && String(product.categoryId || '') !== String(after)) {
      report.changed += 1;
      report.details.push({ id: product.id, title: product.title, before, after, reason: 'mapped' });
      // apply change in-memory
      product.categoryId = after;
      // preserve legacy external id inside specs.backendCategoryId if present
      if (!product.specs) product.specs = {};
      if (before && !product.specs.backendCategoryId) {
        product.specs.backendCategoryId = before;
      }
    } else {
      report.unchanged += 1;
      report.details.push({ id: product.id, title: product.title, before, after: product.categoryId || null, reason: 'unchanged' });
    }
  }

  // write report
  writeReport(report);
  console.log('Reassign dry-run complete. Report written to', REPORT_PATH);
  console.log(`${report.total} products scanned — ${report.changed} changed, ${report.unchanged} unchanged.`);

  if (apply) {
    const bak = backupDb();
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8');
    console.log('Applied changes to', DB_PATH, 'backup created at', bak);
  } else {
    console.log('Run with --apply (or -a) to write changes to backend/db.json (a backup will be created).');
  }
}

main();
