## EXSHOPI CATEGORY NAVIGATION - CODE EXAMPLES & SNIPPETS

---

## 1️⃣ BASIC CATEGORY PAGE IMPLEMENTATION

### Simple TypeScript Implementation

```typescript
// src/pages/CategoryPage.tsx
import { useParams } from 'react-router-dom';
import { categoryData } from '../data/categoryStructure';

export default function CategoryPage() {
  const { slug, subcategorySlug } = useParams<{
    slug?: string;
    subcategorySlug?: string;
  }>();

  // Find the main category
  const category = categoryData.find(c => c.slug === slug);
  
  // Find subcategory if provided
  const subcategory = category?.subcategories.find(
    s => s.slug === subcategorySlug
  );

  if (!category) {
    return (
      <div className="min-h-screen bg-white p-8">
        <h1 className="text-3xl font-bold text-slate-900">Category not found</h1>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
        {/* Breadcrumb */}
        <div className="mb-6 flex items-center gap-2 text-sm text-slate-600">
          <a href="/" className="hover:text-blue-600">Home</a>
          <span>/</span>
          <a href={`/category/${category.slug}`} className="hover:text-blue-600">
            {category.name}
          </a>
          {subcategory && (
            <>
              <span>/</span>
              <span className="text-slate-900 font-medium">{subcategory.name}</span>
            </>
          )}
        </div>

        {/* Page Title */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            {category.icon && <span className="text-4xl">{category.icon}</span>}
            <h1 className="text-3xl font-bold text-slate-900">
              {subcategory ? subcategory.name : category.name}
            </h1>
          </div>
          <p className="text-slate-600">
            {subcategory 
              ? `Browse all items in ${category.name} > ${subcategory.name}`
              : `Browse all items in ${category.name}`
            }
          </p>
        </div>

        {/* Product Grid - Placeholder */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="h-48 bg-slate-200 rounded-lg mb-4" />
              <h3 className="font-semibold text-slate-900">Product {i + 1}</h3>
              <p className="text-blue-600 font-bold">$99.99</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

---

## 2️⃣ ROUTER CONFIGURATION

### React Router Setup

```typescript
// src/main.tsx or src/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './layouts/Layout';
import CategoryPage from './pages/CategoryPage';
import Home from './pages/Home';
import ProductDetail from './pages/ProductDetail';
import Vendors from './pages/Vendors';
import Deals from './pages/Deals';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          {/* Home */}
          <Route path="/" element={<Home />} />

          {/* Category Routes */}
          <Route path="/category/:slug" element={<CategoryPage />} />
          <Route path="/category/:slug/:subcategorySlug" element={<CategoryPage />} />

          {/* Product Route */}
          <Route path="/product/:id" element={<ProductDetail />} />

          {/* Special Routes */}
          <Route path="/vendors" element={<Vendors />} />
          <Route path="/deals" element={<Deals />} />
          <Route path="/categories" element={<AllCategories />} />

          {/* Catch-all for 404 */}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
```

---

## 3️⃣ PRODUCT CARD WITH CATEGORY LINK

### ProductCard Component

```typescript
// src/components/ProductCard.tsx
import { Link } from 'react-router-dom';

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;      // e.g., 'electronics'
  subcategory: string;   // e.g., 'laptops'
  rating: number;
  reviews: number;
}

export default function ProductCard({
  id,
  name,
  price,
  image,
  category,
  subcategory,
  rating,
  reviews,
}: ProductCardProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white overflow-hidden hover:shadow-lg transition">
      {/* Image */}
      <Link to={`/product/${id}`}>
        <img
          src={image}
          alt={name}
          className="w-full h-48 object-cover hover:scale-105 transition"
        />
      </Link>

      {/* Content */}
      <div className="p-4">
        {/* Category Link */}
        <Link
          to={`/category/${category}/${subcategory}`}
          className="text-xs text-blue-600 hover:underline mb-1 block"
        >
          {category} › {subcategory}
        </Link>

        {/* Title */}
        <Link
          to={`/product/${id}`}
          className="font-semibold text-slate-900 hover:text-blue-600 line-clamp-2 mb-2"
        >
          {name}
        </Link>

        {/* Rating */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <span
                key={i}
                className={`text-lg ${
                  i < Math.floor(rating) ? 'text-yellow-400' : 'text-slate-300'
                }`}
              >
                ★
              </span>
            ))}
          </div>
          <span className="text-sm text-slate-500">({reviews})</span>
        </div>

        {/* Price */}
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-blue-600">
            ${price.toFixed(2)}
          </span>
          <button className="text-2xl hover:text-red-600 transition">♡</button>
        </div>
      </div>
    </div>
  );
}
```

---

## 4️⃣ BREADCRUMB COMPONENT

### Reusable Breadcrumb

```typescript
// src/components/Breadcrumb.tsx
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
  isActive?: boolean;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav className="flex items-center gap-1 text-sm text-slate-600" aria-label="Breadcrumb">
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-1">
          {index > 0 && <ChevronRight className="h-4 w-4" />}

          {item.href && !item.isActive ? (
            <Link
              to={item.href}
              className="text-blue-600 hover:underline transition"
            >
              {item.label}
            </Link>
          ) : (
            <span className={item.isActive ? 'font-medium text-slate-900' : ''}>
              {item.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  );
}

// Usage:
// <Breadcrumb items={[
//   { label: 'Home', href: '/' },
//   { label: 'Electronics', href: '/category/electronics' },
//   { label: 'Laptops', href: '/category/electronics/laptops' },
//   { label: 'Gaming Laptops', isActive: true }
// ]} />
```

---

## 5️⃣ CATEGORY FILTER COMPONENT

### Filter by Category

```typescript
// src/components/CategoryFilter.tsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { categoryData } from '../data/categoryStructure';
import { ChevronDown } from 'lucide-react';

interface CategoryFilterProps {
  activeCategory?: string;
  activeSubcategory?: string;
}

export default function CategoryFilter({
  activeCategory,
  activeSubcategory,
}: CategoryFilterProps) {
  const [expanded, setExpanded] = useState<string | null>(activeCategory);

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="font-bold text-slate-900 mb-4">Categories</h3>

      <div className="space-y-1">
        {categoryData.map((category) => {
          const isExpanded = expanded === category.slug;

          return (
            <div key={category.slug}>
              {/* Main Category */}
              <button
                onClick={() => setExpanded(isExpanded ? null : category.slug)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition ${
                  activeCategory === category.slug
                    ? 'bg-blue-50 text-blue-600 font-semibold'
                    : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  {category.icon && <span>{category.icon}</span>}
                  <span>{category.name}</span>
                </div>
                <ChevronDown
                  className={`h-4 w-4 transition ${isExpanded ? 'rotate-180' : ''}`}
                />
              </button>

              {/* Subcategories */}
              {isExpanded && (
                <div className="pl-6 space-y-1 mt-1">
                  {category.subcategories.map((sub) => (
                    <Link
                      key={sub.slug}
                      to={`/category/${category.slug}/${sub.slug}`}
                      className={`block px-3 py-2 rounded-lg text-sm transition ${
                        activeSubcategory === sub.slug
                          ? 'bg-blue-100 text-blue-600 font-medium'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {sub.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

---

## 6️⃣ ADDING MOBILE MENU TO NAVBAR

### Updated Navbar with Mobile Menu

```typescript
// src/components/Navbar.tsx (Partial Update)
import { useState } from 'react';
import { Menu } from 'lucide-react';
import MobileCategoryNav from './MobileCategoryNav';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      {/* Existing Navbar Content */}
      <header className="sticky top-0 z-80 bg-white border-b border-slate-200">
        <div className="flex items-center justify-between px-4">
          {/* Logo */}
          <div className="flex-shrink-0">
            <img src="/logo.png" alt="ExShopi" className="h-16" />
          </div>

          {/* Search Bar - Desktop */}
          <div className="flex-1 mx-8 hidden lg:block">
            {/* Search component */}
          </div>

          {/* Icons */}
          <div className="flex items-center gap-4">
            {/* Cart, Wishlist, Account */}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden ml-4"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open categories menu"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </header>

      {/* Mobile Category Navigation Drawer */}
      <MobileCategoryNav
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />
    </>
  );
}
```

---

## 7️⃣ STYLING WITH TAILWIND

### Tailwind Utility Classes Reference

```css
/* Navigation Bar */
sticky top-16 z-70 border-b border-slate-200 bg-white shadow-sm

/* Nav Items */
px-4 py-3.5 font-semibold text-slate-700 hover:text-blue-600

/* Mega Menu Container */
absolute left-0 top-full z-50 mt-0 w-screen max-w-6xl rounded-2xl shadow-2xl

/* Mega Menu Grid */
grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-0

/* Category Title */
font-bold text-slate-900 group-hover:text-blue-600

/* Subcategory Link */
text-sm text-slate-600 hover:text-blue-600 transition

/* Active Indicator */
absolute bottom-0 left-0 right-0 h-1 bg-blue-600
```

---

## 8️⃣ TYPESCRIPT TYPES

### Complete Type Definitions

```typescript
// src/types/category.ts
export interface Subcategory {
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  productCount?: number;
}

export interface Category {
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  image?: string;
  subcategories: Subcategory[];
  featured?: boolean;
  order?: number;
}

export interface NavItem {
  name: string;
  slug: string;
  route?: string;
  icon?: string;
  hasMenu?: boolean;
  children?: NavItem[];
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
  isActive?: boolean;
}

export interface FilterOption {
  category: string;
  subcategory?: string;
  priceRange?: [number, number];
  sortBy?: 'popular' | 'price-low' | 'price-high' | 'newest' | 'rating';
}
```

---

## 9️⃣ API INTEGRATION EXAMPLE

### Fetching Products by Category

```typescript
// src/services/categoryService.ts
import axios from 'axios';
import { Category, FilterOption } from '../types/category';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

export const categoryService = {
  // Get all categories
  getAllCategories: async (): Promise<Category[]> => {
    const response = await axios.get(`${API_BASE_URL}/categories`);
    return response.data;
  },

  // Get category by slug
  getCategory: async (slug: string): Promise<Category> => {
    const response = await axios.get(`${API_BASE_URL}/categories/${slug}`);
    return response.data;
  },

  // Get products in category
  getProducts: async (
    categorySlug: string,
    subcategorySlug?: string,
    filters?: FilterOption
  ) => {
    const params = new URLSearchParams();
    params.append('category', categorySlug);
    if (subcategorySlug) params.append('subcategory', subcategorySlug);
    if (filters?.priceRange) {
      params.append('minPrice', filters.priceRange[0].toString());
      params.append('maxPrice', filters.priceRange[1].toString());
    }
    if (filters?.sortBy) params.append('sort', filters.sortBy);

    const response = await axios.get(
      `${API_BASE_URL}/products?${params.toString()}`
    );
    return response.data;
  },

  // Search across categories
  search: async (query: string) => {
    const response = await axios.get(`${API_BASE_URL}/search`, {
      params: { q: query },
    });
    return response.data;
  },
};

// Usage in component:
// const products = await categoryService.getProducts('electronics', 'laptops');
```

---

## 🔟 TESTING CHECKLIST SCRIPT

### Manual Testing Script

```typescript
// tests/category-navigation.test.ts (Manual Testing Guide)

describe('Category Navigation System', () => {
  // 1. Desktop Navigation
  test('Departments button should open mega menu on click', () => {
    // 1. Click Departments button
    // 2. Mega menu should appear
    // 3. Menu should have 8 categories
    // 4. Each category should have 6 subcategories
  });

  test('Hovering over Departments should show mega menu', () => {
    // 1. Hover over Departments
    // 2. Wait 200ms for animation
    // 3. Mega menu should be visible
    // 4. All items should be clickable
  });

  // 2. Mobile Navigation
  test('Mobile menu button should open drawer', () => {
    // 1. Resize viewport to 375px width
    // 2. Click menu button
    // 3. Drawer should slide in from left
    // 4. Close button should be visible
  });

  // 3. Routing
  test('Category links should navigate correctly', () => {
    // 1. Click "Electronics" category
    // 2. Verify URL is /category/electronics
    // 3. Page should show Electronics content
  });

  test('Subcategory links should navigate correctly', () => {
    // 1. Click "Laptops" under Electronics
    // 2. Verify URL is /category/electronics/laptops
    // 3. Page should filter to laptops
  });

  // 4. Visual Quality
  test('No extra white line should appear under navbar', () => {
    // 1. Take screenshot of header
    // 2. Verify no duplicate borders
    // 3. Spacing should be even
  });

  test('Mega menu should have smooth animation', () => {
    // 1. Open DevTools (F12)
    // 2. Go to Performance tab
    // 3. Open mega menu
    // 4. FPS should stay above 55
  });

  // 5. Responsive
  test('Layout should adapt to screen size', () => {
    // Desktop (1440px): 4 columns
    // Tablet (768px): 3 columns
    // Mobile (375px): Drawer menu
  });
});
```

---

## 🎯 QUICK START COMMANDS

### Initialize and Test

```bash
# Install dependencies (if needed)
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Type check
npm run type-check

# Lint code
npm run lint

# Format code
npm run format
```

---

## 📞 COMMON ISSUES & FIXES

### Issue: Extra line still visible

**Fix**:
```bash
# Clear cache
rm -rf node_modules/.vite
npm run dev
```

### Issue: Mega menu doesn't close

**Fix**: Check browser console for errors
```javascript
// In console:
// Verify categoryData imported correctly
import { categoryData } from './data/categoryStructure';
console.log(categoryData);
```

### Issue: Routes return 404

**Fix**: Create CategoryPage.tsx
```bash
# Create the file
touch src/pages/CategoryPage.tsx

# Then add route handling
# See example #1 above
```

---

**Last Updated**: March 28, 2026
**Code Examples Version**: 1.0
