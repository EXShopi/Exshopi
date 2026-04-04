import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  id: string;
  slug?: string;
  title: string;
  price: number;
  image: string;
  quantity: number;
  rating?: number;
  reviews?: number;
  seller?: string;
  sellerId?: string;
  stockQuantity?: number;
  freeDelivery?: boolean;
  originalPrice?: number;
  salePrice?: number;
  costPrice?: number;
  discountAmount?: number;
  createdAt?: string;
  updatedAt?: string;
  variants?: any[];
  isFeatured?: boolean;
  isBestseller?: boolean;
  isNewArrival?: boolean;
  isOffer?: boolean;
  isTrending?: boolean;
  isFlashDeal?: boolean;
  lowStockAlert?: boolean;
  category?: string;
  subcategory?: string;
  brand?: string;
  sku?: string;
}

// Alias for compatibility
export type Product = CartItem;

interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (id: string) => void;
  increaseQty: (id: string) => void;
  decreaseQty: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  getCartCount: () => number;
  getCartTotal: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        const existing = get().items.find((i) => i.id === item.id);

        if (existing) {
          set({
            items: get().items.map((i) =>
              i.id === item.id
                ? { ...i, quantity: i.quantity + 1 }
                : i
            ),
          });
          return;
        }

        set({
          items: [...get().items, { ...item, quantity: 1 }],
        });
      },

      removeItem: (id) => {
        set({
          items: get().items.filter((i) => i.id !== id),
        });
      },

      increaseQty: (id) => {
        set({
          items: get().items.map((i) =>
            i.id === id ? { ...i, quantity: i.quantity + 1 } : i
          ),
        });
      },

      decreaseQty: (id) => {
        set({
          items: get()
            .items.map((i) =>
              i.id === id ? { ...i, quantity: i.quantity - 1 } : i
            )
            .filter((i) => i.quantity > 0),
        });
      },

      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          set({
            items: get().items.filter((i) => i.id !== id),
          });
          return;
        }

        set({
          items: get().items.map((i) =>
            i.id === id ? { ...i, quantity } : i
          ),
        });
      },

      clearCart: () => set({ items: [] }),

      getCartCount: () =>
        get().items.reduce((total, item) => total + item.quantity, 0),

      getCartTotal: () =>
        get().items.reduce(
          (total, item) => total + item.price * item.quantity,
          0
        ),
    }),
    {
      name: "exshopi-cart",
    }
  )
);
