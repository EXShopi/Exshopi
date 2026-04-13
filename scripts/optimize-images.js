#!/usr/bin/env node

/**
 * ExShopi Image Optimization Script
 * Converts PNG/JPG images to WebP for better performance
 * Maintains original files for fallback
 */

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CONFIG = {
  webpQuality: 80, // 0-100, balance between quality and size
  avifQuality: 75, // AVIF slightly lower quality as it's more efficient
  directories: [
    'public/hero',
    'public/Banners',
    'public/Category Card',
    'public/Accessories',
    'public/Product',
    'public/categories',
    'public/images/sellers',
  ],
  skipFiles: [
    'favicon',
    'logo',
    'apple-touch-icon',
    'macbook.jpeg.webp', // Already WebP
  ],
};

// Color codes for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
};

const log = {
  info: (msg) => console.log(`${colors.cyan}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg) => console.error(`${colors.red}✗${colors.reset} ${msg}`),
};

async function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

async function shouldSkipFile(filePath) {
  return CONFIG.skipFiles.some(skip => filePath.includes(skip));
}

async function convertImageToWebP(inputPath) {
  const fileName = path.basename(inputPath, path.extname(inputPath));
  const dirName = path.dirname(inputPath);
  const webpPath = path.join(dirName, `${fileName}.webp`);

  try {
    // Skip if already exists
    if (fs.existsSync(webpPath)) {
      const stats = fs.statSync(webpPath);
      return { status: 'exists', webpPath, webpSize: stats.size };
    }

    // Get original file size
    const originalStats = fs.statSync(inputPath);
    const originalSize = originalStats.size;

    // Convert to WebP
    await sharp(inputPath)
      .webp({ quality: CONFIG.webpQuality })
      .toFile(webpPath);

    // Get WebP file size
    const webpStats = fs.statSync(webpPath);
    const webpSize = webpStats.size;
    const savings = ((1 - webpSize / originalSize) * 100).toFixed(1);

    return {
      status: 'success',
      webpPath,
      originalSize,
      webpSize,
      savings,
    };
  } catch (error) {
    return { status: 'error', error: error.message };
  }
}

async function processDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    log.warn(`Directory not found: ${dirPath}`);
    return { processed: 0, skipped: 0, errors: 0, totalOriginal: 0, totalOptimized: 0 };
  }

  const files = fs.readdirSync(dirPath);
  const imageFiles = files.filter(
    (file) =>
      (file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg')) &&
      !file.endsWith('.webp')
  );

  log.info(`Found ${imageFiles.length} image(s) in ${dirPath}`);

  let stats = { processed: 0, skipped: 0, errors: 0, totalOriginal: 0, totalOptimized: 0 };

  for (const file of imageFiles) {
    const filePath = path.join(dirPath, file);

    if (await shouldSkipFile(filePath)) {
      log.warn(`Skipping: ${file} (in skip list)`);
      stats.skipped++;
      continue;
    }

    const result = await convertImageToWebP(filePath);

    if (result.status === 'success') {
      const originalSize = await formatBytes(result.originalSize);
      const webpSize = await formatBytes(result.webpSize);
      log.success(
        `${file}: ${originalSize} → ${webpSize} (${result.savings}% reduction)`
      );
      stats.processed++;
      stats.totalOriginal += result.originalSize;
      stats.totalOptimized += result.webpSize;
    } else if (result.status === 'exists') {
      log.info(`Already optimized: ${file}`);
      stats.skipped++;
    } else {
      log.error(`Failed to convert ${file}: ${result.error}`);
      stats.errors++;
    }
  }

  return stats;
}

async function main() {
  console.log(`\n${colors.cyan}═════════════════════════════════════${colors.reset}`);
  console.log(`${colors.cyan}  ExShopi Image Optimization${colors.reset}`);
  console.log(`${colors.cyan}═════════════════════════════════════${colors.reset}\n`);

  let totalStats = { processed: 0, skipped: 0, errors: 0, totalOriginal: 0, totalOptimized: 0 };

  for (const dir of CONFIG.directories) {
    const fullPath = path.join(process.cwd(), dir);
    log.info(`\nProcessing: ${dir}`);
    const result = await processDirectory(fullPath);

    totalStats.processed += result.processed;
    totalStats.skipped += result.skipped;
    totalStats.errors += result.errors;
    totalStats.totalOriginal += result.totalOriginal;
    totalStats.totalOptimized += result.totalOptimized;
  }

  // Summary
  console.log(`\n${colors.cyan}═════════════════════════════════════${colors.reset}`);
  console.log(`${colors.cyan}  Summary${colors.reset}`);
  console.log(`${colors.cyan}═════════════════════════════════════${colors.reset}`);
  log.info(`Processed: ${totalStats.processed} images`);
  log.info(`Skipped: ${totalStats.skipped} images`);
  if (totalStats.errors > 0) log.error(`Errors: ${totalStats.errors} images`);

  if (totalStats.processed > 0) {
    const originalSize = await formatBytes(totalStats.totalOriginal);
    const optimizedSize = await formatBytes(totalStats.totalOptimized);
    const totalSavings = ((1 - totalStats.totalOptimized / totalStats.totalOriginal) * 100).toFixed(1);
    
    console.log(`\n${colors.yellow}Total savings:${colors.reset}`);
    log.success(`${originalSize} → ${optimizedSize}`);
    log.success(`Overall: ${totalSavings}% reduction`);
  }

  console.log(`\n${colors.green}Image optimization complete!${colors.reset}\n`);
}

main().catch((error) => {
  log.error(`Fatal error: ${error.message}`);
  process.exit(1);
});
