import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

export interface EcommerceStore {
  // Cart
  cartItems: CartItem[];
  addToCart: (item: Omit<CartItem, 'quantity'>) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  getCartCount: () => number;
  getCartTotal: () => number;

  // Wishlist
  wishlistItems: string[]; // store product IDs
  toggleWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  getWishlistCount: () => number;
  clearWishlist: () => void;

  // UI State
  isCartOpen: boolean;
  setCartOpen: (open: boolean) => void;
}

export const useEcommerceStore = create<EcommerceStore>()(
  persist(
    (set, get) => ({
      // Cart state
      cartItems: [],

      addToCart: (item) => {
        set((state) => {
          const existingItem = state.cartItems.find((i) => i.id === item.id);
          if (existingItem) {
            return {
              cartItems: state.cartItems.map((i) =>
                i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
              ),
            };
          }
          return {
            cartItems: [...state.cartItems, { ...item, quantity: 1 }],
          };
        });
      },

      removeFromCart: (id) => {
        set((state) => ({
          cartItems: state.cartItems.filter((i) => i.id !== id),
        }));
      },

      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().removeFromCart(id);
        } else {
          set((state) => ({
            cartItems: state.cartItems.map((i) =>
              i.id === id ? { ...i, quantity } : i
            ),
          }));
        }
      },

      clearCart: () => {
        set({ cartItems: [] });
      },

      getCartCount: () => {
        return get().cartItems.reduce((sum, item) => sum + item.quantity, 0);
      },

      getCartTotal: () => {
        return get().cartItems.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        );
      },

      // Wishlist state
      wishlistItems: [],

      toggleWishlist: (productId) => {
        set((state) => {
          const isInWishlist = state.wishlistItems.includes(productId);
          return {
            wishlistItems: isInWishlist
              ? state.wishlistItems.filter((id) => id !== productId)
              : [...state.wishlistItems, productId],
          };
        });
      },

      isInWishlist: (productId) => {
        return get().wishlistItems.includes(productId);
      },

      getWishlistCount: () => {
        return get().wishlistItems.length;
      },

      clearWishlist: () => {
        set({ wishlistItems: [] });
      },

      // UI state
      isCartOpen: false,
      setCartOpen: (open) => {
        set({ isCartOpen: open });
      },
    }),
    {
      name: 'exshopi-ecommerce',
      partialize: (state) => ({
        cartItems: state.cartItems,
        wishlistItems: state.wishlistItems,
      }),
    }
  )
);
