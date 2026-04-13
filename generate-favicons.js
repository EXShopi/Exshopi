#!/usr/bin/env node

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const inputPath = path.join(__dirname, 'public/logo.png');
const publicDir = path.join(__dirname, 'public');

async function generateFavicons() {
  try {
    console.log('🎨 Generating versioned favicon assets...\n');

    // Read the source image
    const sourceImage = sharp(inputPath);
    
    // 1. Generate favicon-32x32-v2.png
    console.log('📝 Creating favicon-32x32-v2.png...');
    await sourceImage
      .resize(32, 32, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .png()
      .toFile(path.join(publicDir, 'favicon-32x32-v2.png'));
    
    // 2. Generate favicon-16x16-v2.png
    console.log('📝 Creating favicon-16x16-v2.png...');
    await sharp(inputPath)
      .resize(16, 16, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .png()
      .toFile(path.join(publicDir, 'favicon-16x16-v2.png'));
    
    // 3. Generate apple-touch-icon-v2.png (180x180 for iOS)
    console.log('📝 Creating apple-touch-icon-v2.png (180x180)...');
    await sharp(inputPath)
      .resize(180, 180, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .png()
      .toFile(path.join(publicDir, 'apple-touch-icon-v2.png'));
    
    // 4. Generate favicon-192x192-v2.png (PWA icon)
    console.log('📝 Creating favicon-192x192-v2.png...');
    await sharp(inputPath)
      .resize(192, 192, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .png()
      .toFile(path.join(publicDir, 'favicon-192x192-v2.png'));

    // 5. Generate favicon-512x512-v2.png (PWA icon large)
    console.log('📝 Creating favicon-512x512-v2.png...');
    await sharp(inputPath)
      .resize(512, 512, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .png()
      .toFile(path.join(publicDir, 'favicon-512x512-v2.png'));

    // 6. Create favicon-v2.ico from 32x32
    console.log('📝 Creating favicon-v2.ico...');
    // For a simple solution, we'll create a copy of the 32x32 and manually convert it
    // In a production environment, you might use a library like 'icojs' or 'jimp'
    // For now, we'll create the .ico using a more practical method
    const icoBuffer = await sharp(inputPath)
      .resize(32, 32, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .toBuffer();
    
    // Write as PNG but rename to .ico (browsers accept PNG as ICO fallback)
    fs.writeFileSync(path.join(publicDir, 'favicon-v2.ico'), icoBuffer);

    console.log('\n✅ All favicon assets generated successfully!\n');
    
    // Print summary
    console.log('Generated files:');
    console.log('  ✓ favicon-v2.ico');
    console.log('  ✓ favicon-16x16-v2.png');
    console.log('  ✓ favicon-32x32-v2.png');
    console.log('  ✓ apple-touch-icon-v2.png (180x180)');
    console.log('  ✓ favicon-192x192-v2.png');
    console.log('  ✓ favicon-512x512-v2.png');
    console.log('\nAll files are ready for deployment! 🚀');

  } catch (error) {
    console.error('❌ Error generating favicons:', error.message);
    process.exit(1);
  }
}

generateFavicons();
