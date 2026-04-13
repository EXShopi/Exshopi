import sharp from "sharp";
import fs from "fs";
import path from "path";

const inputDir = "./public";
const outputDir = "./public/optimized";

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

fs.readdirSync(inputDir).forEach(file => {
  if (file.endsWith(".png") || file.endsWith(".jpg")) {
    sharp(path.join(inputDir, file))
      .webp({ quality: 70 })
      .toFile(path.join(outputDir, file.replace(/\.(png|jpg)/, ".webp")))
      .then(() => console.log(`Converted: ${file}`));
  }
});