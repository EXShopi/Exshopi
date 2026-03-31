import { create } from "zustand";
import { persist } from "zustand/middleware";

export type WishlistProduct = {
  id: string | number;
  slug?: string;
  name: string;
  category?: string;
  price?: number;
  oldPrice?: number;
  rating?: number;
  reviews?: number;
  badge?: string;
  image?: string;
  stock?: string;
};

type WishlistCollection = {
  id: string;
  name: string;
  isDefault: boolean;
  productIds: Array<string | number>;
};

type WishlistState = {
  items: WishlistProduct[];
  collections: WishlistCollection[];
  activeCollectionId: string;
  view: "grid" | "list";
  filter: "all" | "inStock" | "discounted" | "topRated";

  addItem: (product: WishlistProduct) => void;
  removeItem: (productId: string | number) => void;
  toggleWishlist: (product: WishlistProduct) => void;
  isInWishlist: (productId: string | number) => boolean;

  createCollection: (name: string, isDefault?: boolean) => void;
  setActiveCollection: (id: string) => void;
  addToCollection: (collectionId: string, productId: string | number) => void;
  removeFromCollection: (collectionId: string, productId: string | number) => void;

  setView: (view: "grid" | "list") => void;
  setFilter: (filter: "all" | "inStock" | "discounted" | "topRated") => void;
  clearCollection: (collectionId: string) => void;
};

const defaultCollectionId = "default";

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      collections: [
        {
          id: defaultCollectionId,
          name: "Default",
          isDefault: true,
          productIds: [],
        },
      ],
      activeCollectionId: defaultCollectionId,
      view: "grid",
      filter: "all",

      addItem: (product) => {
        const { items, activeCollectionId, collections } = get();
        const alreadyExists = items.some((item) => item.id === product.id);

        const updatedItems = alreadyExists ? items : [...items, product];

        const updatedCollections = collections.map((collection) =>
          collection.id === activeCollectionId
            ? {
                ...collection,
                productIds: collection.productIds.includes(product.id)
                  ? collection.productIds
                  : [...collection.productIds, product.id],
              }
            : collection
        );

        set({
          items: updatedItems,
          collections: updatedCollections,
        });
      },

      removeItem: (productId) => {
        const { collections } = get();

        const updatedCollections = collections.map((collection) => ({
          ...collection,
          productIds: collection.productIds.filter((id) => id !== productId),
        }));

        const stillUsed = updatedCollections.some((collection) =>
          collection.productIds.includes(productId)
        );

        set((state) => ({
          items: stillUsed
            ? state.items
            : state.items.filter((item) => item.id !== productId),
          collections: updatedCollections,
        }));
      },

      toggleWishlist: (product) => {
        const exists = get().isInWishlist(product.id);

        if (exists) {
          get().removeItem(product.id);
        } else {
          get().addItem(product);
        }
      },

      isInWishlist: (productId) => {
        const { collections } = get();
        return collections.some((collection) =>
          collection.productIds.includes(productId)
        );
      },

      createCollection: (name, isDefault = false) => {
        const trimmed = name.trim();
        if (!trimmed) return;

        const id = `${trimmed.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`;

        set((state) => {
          const updatedCollections = isDefault
            ? state.collections.map((c) => ({ ...c, isDefault: false }))
            : state.collections;

          return {
            collections: [
              ...updatedCollections,
              {
                id,
                name: trimmed,
                isDefault,
                productIds: [],
              },
            ],
            activeCollectionId: id,
          };
        });
      },

      setActiveCollection: (id) => set({ activeCollectionId: id }),

      addToCollection: (collectionId, productId) => {
        set((state) => ({
          collections: state.collections.map((collection) =>
            collection.id === collectionId
              ? {
                  ...collection,
                  productIds: collection.productIds.includes(productId)
                    ? collection.productIds
                    : [...collection.productIds, productId],
                }
              : collection
          ),
        }));
      },

      removeFromCollection: (collectionId, productId) => {
        set((state) => ({
          collections: state.collections.map((collection) =>
            collection.id === collectionId
              ? {
                  ...collection,
                  productIds: collection.productIds.filter((id) => id !== productId),
                }
              : collection
          ),
        }));
      },

      setView: (view) => set({ view }),
      setFilter: (filter) => set({ filter }),

      clearCollection: (collectionId) => {
        set((state) => {
          const targetCollection = state.collections.find(
            (collection) => collection.id === collectionId
          );

          if (!targetCollection) return state;

          const idsToRemove = targetCollection.productIds;

          const updatedCollections = state.collections.map((collection) =>
            collection.id === collectionId
              ? { ...collection, productIds: [] }
              : collection
          );

          const stillUsedIds = new Set(
            updatedCollections.flatMap((collection) => collection.productIds)
          );

          return {
            collections: updatedCollections,
            items: state.items.filter(
              (item) =>
                !idsToRemove.includes(item.id) || stillUsedIds.has(item.id)
            ),
          };
        });
      },
    }),
    {
      name: "exshopi-wishlist",
    }
  )
);