import { db } from "../backend/database";

const products = db.getAllProductsForAdmin();
let updated = 0;

for (const product of products) {
  db.updateProduct(product.id, {
    priceUae: Number((product as any).priceUae ?? product.price ?? 0),
    compareAtPriceUae: Number(
      (product as any).compareAtPriceUae ?? product.originalPrice ?? product.price ?? 0
    ),
  } as any);
  updated += 1;
}

console.log(`[country-pricing] backfilled ${updated} products`);
