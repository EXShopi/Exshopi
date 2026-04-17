import { filterProductsByCategoryTree, productMatchesCategoryAssignment, resolveCanonicalCategoryAssignment } from '../src/lib/masterCategories';
import { isLiveMarketplaceProduct } from '../src/lib/liveMarketplaceProducts';

function assert(condition: unknown, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

const appleLaptop = {
  id: 'apple-laptop-1',
  title: 'Apple MacBook Pro A1708',
  slug: 'apple-macbook-pro-a1708',
  status: 'live',
  approvalStatus: 'approved',
  visibilityStatus: 'live',
  brand: 'Apple',
  specs: {
    parentCategorySlug: 'electronics',
    categorySlug: 'computers',
    subcategorySlug: 'computers',
    templateId: 'laptops',
    attributes: {
      brand: 'Apple',
      subcategory: 'laptops',
      model: 'A1708',
    },
    searchTags: ['apple laptop', 'a1708', 'macbook'],
  },
};

const copiedLaptop = {
  ...appleLaptop,
  id: 'apple-laptop-copy',
  slug: 'apple-macbook-pro-a1708-copy',
  title: 'Apple MacBook Pro A1708 Copy',
};

const canonical = resolveCanonicalCategoryAssignment(appleLaptop);
assert(canonical.parentCategorySlug === 'electronics', 'Expected electronics parent category');
assert(canonical.categorySlug === 'computers', 'Expected computers category');
assert(canonical.subcategorySlug === 'laptops', 'Expected laptops subcategory');

assert(isLiveMarketplaceProduct(appleLaptop), 'Expected live approved product to be publicly visible');
assert(productMatchesCategoryAssignment(appleLaptop, 'laptops'), 'Expected laptop to match /category/laptops');
assert(productMatchesCategoryAssignment(appleLaptop, 'electronics', 'computers'), 'Expected laptop to match /category/electronics/computers');

const laptops = filterProductsByCategoryTree([appleLaptop], 'laptops');
assert(laptops.length === 1, 'Expected live approved laptop to appear in laptops category listing');

const computers = filterProductsByCategoryTree([appleLaptop], 'electronics', 'computers');
assert(computers.length === 1, 'Expected live approved laptop to appear in electronics/computers listing');

const copied = resolveCanonicalCategoryAssignment(copiedLaptop);
assert(copied.subcategorySlug === 'laptops', 'Expected copied product to preserve laptop subcategory');

console.log('[validate-category-assignment] All checks passed.');
