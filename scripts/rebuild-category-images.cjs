#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const root = process.cwd();
const publicDir = path.join(root, 'public');
const categoryDir = path.join(publicDir, 'categories');
const candidates = [
  path.join(publicDir, 'Category Card'),
  path.join(publicDir, 'Banners'),
  path.join(publicDir, 'images'),
  publicDir,
];

const mappings = [
  { target: 'computer.webp', sourceNames: ['electronics', 'computeracessories', 'laptop'] },
  { target: 'tv.webp', sourceNames: ['Television', 'television', 'Television'] },
  { target: 'gaming.webp', sourceNames: ['Gamingpc', 'gaming'] },
  { target: 'clothing.webp', sourceNames: ['women fashion', 'manfashion', 'best seller'] },
  { target: 'kitchen-appliances.webp', sourceNames: ['Homeappliances', 'homeappliances'] },
  { target: 'projector.webp', sourceNames: ['electronics', 'Laptop', 'television'] },
];

async function findSource(name) {
  if (name.includes(path.sep) || name.includes('/')) {
    const direct = path.join(publicDir, name);
    for (const ext of ['', '.png', '.webp', '.jpg', '.jpeg']) {
      const p = direct.endsWith(ext) ? direct : direct + ext;
      if (fs.existsSync(p)) return p;
    }
  }

  for (const folder of candidates) {
    for (const ext of ['.png', '.webp', '.jpg', '.jpeg']) {
      const p = path.join(folder, `${name}${ext}`);
      if (fs.existsSync(p)) return p;
    }
    const pExact = path.join(folder, name);
    if (fs.existsSync(pExact)) return pExact;
  }
  return null;
}

async function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

async function convertToWebp(src, dest) {
  try {
    await sharp(src)
      .resize(480, 480, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .webp({ quality: 82 })
      .toFile(dest);
    console.log('WROTE', dest);
  } catch (err) {
    console.error('FAILED converting', src, '->', dest, err.message || err);
  }
}

(async () => {
  await ensureDir(categoryDir);

  for (const m of mappings) {
    const targetPath = path.join(categoryDir, m.target);
    let found = null;
    for (const candidateName of m.sourceNames) {
      const s = await findSource(candidateName);
      if (s) {
        found = s;
        break;
      }
    }

    if (!found) {
      console.warn('No source found for', m.target, '— leaving as-is');
      continue;
    }

    await convertToWebp(found, targetPath);
  }

  console.log('Done — check public/categories for regenerated files.');
})();