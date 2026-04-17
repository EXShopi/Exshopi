import {
  filterProductsByCategoryTree,
  getCategoryRouteInfo,
  productMatchesCategoryAssignment,
  resolveCanonicalCategoryAssignment,
} from '../src/lib/masterCategories';
import { isLiveMarketplaceProduct } from '../src/lib/liveMarketplaceProducts';
import { generateCategorySeo, getCategoryPath } from '../src/lib/seo';

function assert(condition: unknown, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

const laptopProduct = {
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

const pcProduct = {
  id: 'pc-1',
  title: 'Gaming Desktop PC',
  slug: 'gaming-desktop-pc',
  status: 'live',
  approvalStatus: 'approved',
  visibilityStatus: 'live',
  brand: 'Custom',
  specs: {
    parentCategorySlug: 'electronics',
    categorySlug: 'pc',
    subcategorySlug: '',
    attributes: {
      brand: 'Custom',
      subcategory: 'pc',
      model: 'GTX Tower',
    },
  },
};

const computerProduct = {
  id: 'computer-1',
  title: 'Office Computer Bundle',
  slug: 'office-computer-bundle',
  status: 'live',
  approvalStatus: 'approved',
  visibilityStatus: 'live',
  brand: 'Generic',
  specs: {
    parentCategorySlug: 'electronics',
    categorySlug: 'computers',
    subcategorySlug: '',
    attributes: {
      brand: 'Generic',
      subcategory: 'computers',
      model: 'Business Station',
    },
  },
};

const copiedLaptop = {
  ...laptopProduct,
  id: 'apple-laptop-copy',
  slug: 'apple-macbook-pro-a1708-copy',
  title: 'Apple MacBook Pro A1708 Copy',
};

const canonicalLaptop = resolveCanonicalCategoryAssignment(laptopProduct);
assert(canonicalLaptop.parentCategorySlug === 'electronics', 'Expected electronics parent category for laptop');
assert(canonicalLaptop.categorySlug === 'laptops', 'Expected laptops category for laptop');
assert(canonicalLaptop.subcategorySlug === '', 'Expected no deeper subcategory for laptop');

const canonicalPc = resolveCanonicalCategoryAssignment(pcProduct);
assert(canonicalPc.categorySlug === 'pc', 'Expected pc category for desktop product');

const canonicalComputer = resolveCanonicalCategoryAssignment(computerProduct);
assert(canonicalComputer.categorySlug === 'computers', 'Expected computers category for computer product');

assert(isLiveMarketplaceProduct(laptopProduct), 'Expected live approved laptop to be publicly visible');
assert(productMatchesCategoryAssignment(laptopProduct, 'laptops'), 'Expected laptop to match /category/laptops alias');
assert(productMatchesCategoryAssignment(laptopProduct, 'electronics', 'laptops'), 'Expected laptop to match /category/electronics/laptops');
assert(!productMatchesCategoryAssignment(laptopProduct, 'electronics', 'pc'), 'Expected laptop to stay out of /category/electronics/pc');
assert(!productMatchesCategoryAssignment(laptopProduct, 'electronics', 'computers'), 'Expected laptop to stay out of /category/electronics/computers');

assert(productMatchesCategoryAssignment(pcProduct, 'electronics', 'pc'), 'Expected PC product to match /category/electronics/pc');
assert(!productMatchesCategoryAssignment(pcProduct, 'electronics', 'laptops'), 'Expected PC product to stay out of laptop page');

assert(productMatchesCategoryAssignment(computerProduct, 'electronics', 'computers'), 'Expected computer product to match /category/electronics/computers');
assert(!productMatchesCategoryAssignment(computerProduct, 'electronics', 'pc'), 'Expected computer product to stay out of PC page');

const products = [laptopProduct, pcProduct, computerProduct];

assert(filterProductsByCategoryTree(products, 'laptops').length === 1, 'Expected only laptop products on laptops page');
assert(filterProductsByCategoryTree(products, 'electronics', 'laptops').length === 1, 'Expected only laptop products on electronics/laptops page');
assert(filterProductsByCategoryTree(products, 'electronics', 'pc').length === 1, 'Expected only pc products on electronics/pc page');
assert(filterProductsByCategoryTree(products, 'electronics', 'computers').length === 1, 'Expected only computer products on electronics/computers page');
assert(filterProductsByCategoryTree(products, 'electronics').length === 3, 'Expected electronics page to include all electronics descendants');

const laptopRoute = getCategoryRouteInfo('laptops');
assert(laptopRoute?.canonicalPath === '/category/electronics/laptops', 'Expected laptops alias to resolve to electronics/laptops');
assert(getCategoryPath('laptops') === '/category/electronics/laptops', 'Expected canonical category path for laptops');
assert(getCategoryPath('pc') === '/category/electronics/pc', 'Expected canonical category path for pc');
assert(getCategoryPath('computers') === '/category/electronics/computers', 'Expected canonical category path for computers');

const laptopSeo = generateCategorySeo('Laptops', 'laptops');
const pcSeo = generateCategorySeo('PC', 'pc');
const computerSeo = generateCategorySeo('Computers', 'computers');
assert(laptopSeo.metaTitle.includes('Laptops'), 'Expected laptop SEO title to mention Laptops');
assert(pcSeo.metaTitle.includes('PC'), 'Expected PC SEO title to mention PC');
assert(computerSeo.metaTitle.includes('Computers'), 'Expected computer SEO title to mention Computers');

const copied = resolveCanonicalCategoryAssignment(copiedLaptop);
assert(copied.categorySlug === 'laptops', 'Expected copied laptop to preserve laptop category');

console.log('[validate-category-assignment] All checks passed.');
