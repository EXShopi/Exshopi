# Image Inventory Report - ExShopi src/ Directory

## Summary
This report catalogs all JSX/TSX components using images from `public/hero/`, `public/Banners/`, `public/Category Card/`, `public/Accessories/`, and other image directories.

---

## HERO SECTION IMAGES

### 1. **HeroSection Component**
- **File Path**: [src/components/HeroSection.tsx](src/components/HeroSection.tsx)
- **Component**: `HeroSection`
- **Image Paths Used**:
  - `/hero/hero-1.png`
  - `/hero/hero-2.png`
  - `/hero/hero-3.png`
  - `/hero/hero-4.png`
  - `/hero/hero-5.png`
  - `banner.image` (from remote bannerAPI)
  - `settings.homepage.hero.productImageUrl` (remote/fallback)

- **Image Tag Structure**:
  ```javascript
  // Fallback images (lines 51-62)
  const images = ['/hero/hero-5.png', '/hero/hero-2.png', '/hero/hero-3.png', '/hero/hero-4.png', '/hero/hero-5.png'];
  
  // Used in slide mapping with fallback
  image: banner.image || settings.homepage.hero.productImageUrl
  image: img  // local fallback
  ```
- **Data Source**: `bannerAPI.getAll()` + local fallback images
- **Notes**: Uses remote banners with local `/hero/` fallback images when banners unavailable

---

### 2. **HeroSlider Component**
- **File Path**: [src/components/HeroSlider.tsx](src/components/HeroSlider.tsx)
- **Component**: `HeroSlider`
- **Image Paths**: No external images (uses gradient backgrounds and theme colors)
- **Notes**: Hardcoded slide data with theme gradients, no image assets

---

## BANNER & PROMO SECTION IMAGES

### 3. **BannerCarousel Component**
- **File Path**: [src/components/BannerCarousel.tsx](src/components/BannerCarousel.tsx)
- **Component**: `BannerCarousel`
- **Image Paths Used**:
  - `https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1600&q=80` (external Unsplash)

- **Image Tag Structure**:
  ```jsx
  <img
    src={banner.image}
    alt={banner.title}
    className="h-full w-full object-cover"
  />
  ```
- **Notes**: Loads external images, not using public/ directory

---

### 4. **PromoSection Component**
- **File Path**: [src/components/PromoSection.tsx](src/components/PromoSection.tsx)
- **Component**: `PromoSection`
- **Image Paths Used**:
  - `box.imageUrl` (from settings - configurable)
  - No hardcoded paths

- **Image Tag Structure**:
  ```jsx
  {box.imageUrl ? (
    <img
      src={box.imageUrl}
      alt={box.title}
      className="h-full w-full object-cover"
      loading="lazy"
    />
  ) : (
    <div>Upload a collection image</div>
  )}
  ```
- **Notes**: Settings-driven, supports lazy loading

---

## CATEGORY SECTION IMAGES

### 5. **CategorySection Component**
- **File Path**: [src/components/CategorySection.tsx](src/components/CategorySection.tsx)
- **Component**: `CategorySection`
- **Image Paths Used**:
  - `/categories/Computer.png`
  - `/categories/Cellphone.png`
  - `/categories/Tv.png`
  - `/categories/Gaming.png`
  - `/categories/Clothing.png`
  - `/categories/Camera.png`
  - `/categories/Kitchen_Appliances.png`
  - `/categories/Projector.png`

- **Image Tag Structure**:
  ```jsx
  <img
    src={category.image}
    alt={category.name}
    className="max-h-full max-w-full object-contain transition duration-300 group-hover:scale-105"
  />
  ```
- **Count**: 8 category images
- **Notes**: Hardcoded category cards with PNG images

---

### 6. **MegaCategoryCarousel Component**
- **File Path**: [src/components/MegaCategoryCarousel.tsx](src/components/MegaCategoryCarousel.tsx)
- **Component**: `MegaCategoryCarousel`
- **Image Paths Used**:
  - `/Category Card/clearncestore.png`
  - `/Category Card/electronics.png`
  - `/Category Card/Grocery.png`
  - `/Category Card/Mobile.png`
  - `/Category Card/Laptop.png`
  - `/Category Card/beauty.png`
  - `/Category Card/Gift.png`
  - `/Category Card/home&kitchen.png`
  - `/Category Card/women fashion.png`
  - `/Category Card/manfashion.png`
  - `/Category Card/Homeappliances.png`
  - `/Category Card/healthnutrition.png`
  - `/Category Card/wearable.png`
  - `/Category Card/Backpack.png`
  - `/Category Card/Luggage.png`
  - `/Category Card/Television.png`

- **Image Tag Structure** (line 363):
  ```jsx
  <img
    src={category.image}
    alt={category.title}
    className="..."
  />
  ```
- **Count**: 16+ category card images from `public/Category Card/`
- **Notes**: Scrollable carousel with mega categories

---

### 7. **AccessoriesSection Component**
- **File Path**: [src/components/AccessoriesSection.tsx](src/components/AccessoriesSection.tsx)
- **Component**: `AccessoriesSection`
- **Image Paths Used**:
  - `/Accessories/phonecover.png`
  - `/Accessories/cables&connector.png`
  - `/Accessories/keyboard&mouse.png`
  - `/Accessories/harddisk.png`
  - `/Accessories/bag&sleeves.png`
  - `/Accessories/truewireless.png`

- **Image Tag Structure**:
  ```jsx
  <img
    src={item.image}
    alt={item.name}
    className="h-[54px] w-auto object-contain transition duration-300 group-hover:scale-110 md:h-[80px]"
  />
  ```
- **Count**: 6 accessory category images
- **Notes**: Uses `object-contain` and hover scale effect

---

## BRAND SECTION IMAGES

### 8. **ShopByBrandSection Component**
- **File Path**: [src/components/ShopByBrandSection.tsx](src/components/ShopByBrandSection.tsx)
- **Component**: `ShopByBrandSection`
- **Image Paths Used**:
  - `/Banners/apple.png`
  - `/Banners/samsung.png`
  - `/Banners/dell.png`
  - `/Banners/hp.png`
  - `/Banners/lenovo.png`
  - `/Banners/gaming.png`
  - `/Banners/acer.png`
  - `/Banners/asus.png`

- **Image Tag Structure**:
  ```jsx
  <img
    src={brand.logo}
    alt={brand.name}
    className="max-h-full max-w-full object-contain"
  />
  ```
- **Count**: 8 brand logos from `public/Banners/`
- **Notes**: Scrollable carousel, auto-scrolls every 2200ms

---

## PRODUCT DISPLAY COMPONENTS

### 9. **FeaturedProducts Component**
- **File Path**: [src/components/FeaturedProducts.tsx](src/components/FeaturedProducts.tsx)
- **Component**: `FeaturedProducts` → `FeaturedCard`
- **Image Paths Used**:
  - `product.image` (from API)

- **Image Tag Structure** (line 117):
  ```jsx
  <img
    src={product.image}
    alt={product.title}
    className="h-full w-full object-contain object-center transition duration-300 group-hover:scale-[1.03]"
  />
  ```
- **Data Source**: Dynamic from `productAPI`
- **Notes**: Loads product images with zoom effect on hover

---

### 10. **MostPopularSection Component**
- **File Path**: [src/components/MostPopularSection.tsx](src/components/MostPopularSection.tsx)
- **Component**: `MostPopularSection` → `PopularCard`
- **Image Paths Used**:
  - `product.image` (from API)

- **Image Tag Structure** (line 151):
  ```jsx
  <img
    src={product.image}
    alt={product.title}
    className="h-full w-full object-contain transition duration-300 group-hover:scale-105"
  />
  ```
- **Data Source**: Dynamic from `getLiveMarketplaceProducts()`
- **Notes**: Tabs for price ranges (Under 200, 500, 1000)

---

### 11. **BlackFridaySection Component**
- **File Path**: [src/components/BlackFridaySection.tsx](src/components/BlackFridaySection.tsx)
- **Component**: `BlackFridaySection` → `DealCard`
- **Image Paths Used**:
  - `item.image` (from API)

- **Image Tag Structure**:
  ```jsx
  <img src={item.image} alt={item.title} className="..." />
  ```
- **Data Source**: Dynamic from `getCampaignProducts()`
- **Notes**: Flash deals section

---

## UTILITY COMPONENTS

### 12. **LazyImage Component**
- **File Path**: [src/components/ui/LazyImage.tsx](src/components/ui/LazyImage.tsx)
- **Component**: `LazyImage` (wrapper)
- **Image Paths Used**:
  - `src` prop (generic)

- **Image Tag Structure**:
  ```jsx
  <img
    src={src}
    alt={alt}
    loading="lazy"
    onLoad={() => setLoaded(true)}
    className={`${className} transition-all duration-500 ${loaded ? "scale-100 opacity-100 blur-0" : "scale-[1.03] opacity-0 blur-sm"}`}
  />
  ```
- **Notes**: Intersection Observer for lazy loading, 180px rootMargin, Skeleton placeholder

---

## PAGE-LEVEL COMPONENTS

### 13. **Home.tsx**
- **File Path**: [src/pages/Home.tsx](src/pages/Home.tsx)
- **Component**: `Home`
- **Imported Sections**:
  - `HeroSection`
  - `CategorySection`
  - `MegaCategoryCarousel`
  - `FeaturedProducts`
  - `ShopByBrandSection`
  - `AccessoriesSection`
  - `MostPopularSection`
  - `BlackFridaySection`
  - `PromoSection`
  - `AllProductsSection`

- **Notes**: Main homepage orchestrates all image-heavy sections

---

## ADMIN & SPECIALIZED COMPONENTS

### 14. **AIChat Component**
- **File Path**: [src/components/AIChat.tsx](src/components/AIChat.tsx)
- **Component**: `WhatsAppButton` → `AIChat`
- **Image Paths Used**:
  - `public/Banners/call.png` (line 20)

- **Image Tag Structure** (line 19):
  ```jsx
  <img
    src="public/Banners/call.png"
    alt="WhatsApp"
    className="w-10 h-10 group-hover:scale-110 transition rounded-full flex items-center justify-center"
  />
  ```
- **Note**: ⚠️ **Issue**: Using `public/` prefix in src attribute (should be `/` only)

---

### 15. **AdminDashboard Component**
- **File Path**: [src/pages/AdminDashboard.tsx](src/pages/AdminDashboard.tsx)
- **Component**: `AdminDashboard`
- **Image Paths Used**:
  - `newProduct.image` (line 1004)
  - `product.image` (lines 1059, 1450)
  - `customer.photoURL` (line 1675)

- **Image Tag Structures**:
  ```jsx
  <img src={newProduct.image} className="absolute inset-0 w-full h-full object-contain p-2 bg-white" />
  <img src={img} className="w-full h-full object-contain" />
  <img src={product.image} alt={product.title} className="w-full h-full object-contain group-hover:scale-110 transition-transform drop-shadow-sm" />
  <img src={customer.photoURL} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
  ```
- **Data Source**: Dynamic from database

---

### 16. **Admin Banners Page**
- **File Path**: [src/pages/admin/Banners.tsx](src/pages/admin/Banners.tsx)
- **Component**: `AdminBanners`
- **Image Paths Used**:
  - `formData.image` (uploaded via `uploadImageFile()`)
  - `banner.image` (from bannerAPI)

- **Notes**: Manages banner uploads and configuration for HeroSection

---

## UI COMPONENTS WITH IMAGES

### 17. **CartDrawer Component**
- **File Path**: [src/components/CartDrawer.tsx](src/components/CartDrawer.tsx)
- **Component**: `CartDrawer`
- **Image Paths Used**:
  - `item.image` (cart items)

- **Image Tag Structure** (line 83):
  ```jsx
  <img src={item.image} alt={item.title} className="..." />
  ```

---

### 18. **Account Component**
- **File Path**: [src/pages/Account.tsx](src/pages/Account.tsx)
- **Component**: `Account`
- **Image Paths Used**:
  - `userData.photoURL` (lines 302, 586)

- **Image Tag Structures**:
  ```jsx
  <img src={userData.photoURL} alt="" className="w-full h-full rounded-2xl object-cover" referrerPolicy="no-referrer" />
  <img src={userData.photoURL} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
  ```

---

### 19. **Navbar Component (both locations)**
- **File Paths**:
  - [src/components/Navbar.tsx](src/components/Navbar.tsx) (lines 170, 363)
  - [ExShopi 25/src/components/Navbar.tsx](ExShopi%2025/src/components/Navbar.tsx) (lines 170, 363)

- **Image Paths Used**: Dynamic from cart/login state

---

### 20. **AISearchModal Component**
- **File Path**: [src/components/AISearchModal.tsx](src/components/AISearchModal.tsx)
- **Component**: `AISearchModal`
- **Image Paths Used**:
  - `product.image` (line 223)

- **Image Tag Structure**:
  ```jsx
  <img ... />
  ```

---

## PUBLIC IMAGE DIRECTORY INVENTORY

### Hero Images (`public/hero/`)
```
/hero/hero-1.png
/hero/hero-2.png
/hero/hero-3.png
/hero/hero-4.png
/hero/hero-5.png
```

### Category Card Images (`public/Category Card/`)
```
/Category Card/clearncestore.png
/Category Card/electronics.png
/Category Card/Grocery.png
/Category Card/Mobile.png
/Category Card/Laptop.png
/Category Card/beauty.png
/Category Card/Gift.png
/Category Card/home&kitchen.png
/Category Card/women fashion.png
/Category Card/manfashion.png
/Category Card/Homeappliances.png
/Category Card/healthnutrition.png
/Category Card/wearable.png
/Category Card/Backpack.png
/Category Card/Luggage.png
/Category Card/Television.png
(and more...)
```

### Banner Images (`public/Banners/`)
```
/Banners/apple.png
/Banners/samsung.png
/Banners/dell.png
/Banners/hp.png
/Banners/lenovo.png
/Banners/gaming.png
/Banners/acer.png
/Banners/asus.png
/Banners/call.png
```

### Accessory Images (`public/Accessories/`)
```
/Accessories/phonecover.png
/Accessories/cables&connector.png
/Accessories/keyboard&mouse.png
/Accessories/harddisk.png
/Accessories/bag&sleeves.png
/Accessories/truewireless.png
```

### Category Images (`public/categories/`)
```
/categories/Computer.png
/categories/Cellphone.png
/categories/Tv.png
/categories/Gaming.png
/categories/Clothing.png
/categories/Camera.png
/categories/Kitchen_Appliances.png
/categories/Projector.png
```

---

## ISSUES FOUND

### ⚠️ Issue #1: Incorrect Image Path in AIChat
- **File**: [src/components/AIChat.tsx](src/components/AIChat.tsx#L20)
- **Issue**: Using `public/Banners/call.png` with `public/` prefix
- **Should be**: `/Banners/call.png`
- **Fix**: Remove `public/` prefix

---

## SUMMARY STATISTICS

| Category | Count | Type |
|----------|-------|------|
| **Static Public Images** | 41+ | PNG from public/* |
| **Dynamic API Images** | 6+ | From product/banner APIs |
| **Components with Images** | 20 | JSX/TSX files |
| **Image Directories Used** | 6 | hero/, Banners/, Category Card/, categories/, Accessories/ |
| **Lazy Loading** | 1 | LazyImage utility |
| **External Images** | 1+ | Unsplash (BannerCarousel) |

---

## LOADING PATTERNS

### Object-Contain (for logos/categories)
- CategorySection
- AccessoriesSection
- ShopByBrandSection
- MegaCategoryCarousel

### Object-Cover (for banners/backgrounds)
- BannerCarousel
- PromoSection

### Object-Contain (for products)
- FeaturedProducts
- MostPopularSection
- BlackFridaySection
- Product cards

### Lazy Loading Strategy
- `LazyImage` component with Intersection Observer
- Manual `loading="lazy"` attributes in some components
- PromoSection implements lazy loading

---

## PERFORMANCE NOTES

1. **Hero Fallback Images**: 5 PNG files (when banners unavailable)
2. **Category Cards**: Multiple 16-image carousel (not paginated)
3. **Brand Carousel**: Auto-scrolling with duplicated dataset
4. **Lazy Loading**: Not applied to all components uniformly
5. **Image Optimization**: WebP format mentioned in public/ directory but not all components using it

---

End of Report
