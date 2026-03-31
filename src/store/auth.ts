import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type User = {
  id?: string;
  uid?: string;
  email?: string | null;
  name?: string | null;
  fullName?: string | null;
  displayName?: string | null;
  phone?: string | null;
  status?: string | null;
  country?: string | null;
  sellerApplicationStatus?: string | null;
};

type SellerApplication = {
  id?: string;
  status?: string;
  businessName?: string;
  adminNotes?: string;
  rejectionReason?: string;
};

interface AuthState {
  user: User | null;
  role: 'customer' | 'seller' | 'admin' | 'super_admin' | 'finance_manager' | 'support_agent' | null;
  accessToken: string | null;
  sellerApplication: SellerApplication | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setRole: (role: 'customer' | 'seller' | 'admin' | 'super_admin' | 'finance_manager' | 'support_agent' | null) => void;
  setAccessToken: (accessToken: string | null) => void;
  setSellerApplication: (sellerApplication: SellerApplication | null) => void;
  setLoading: (isLoading: boolean) => void;
  resetAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      role: null,
      accessToken: null,
      sellerApplication: null,
      isLoading: false,
      setUser: (user) => set({ user }),
      setRole: (role) => set({ role }),
      setAccessToken: (accessToken) => set({ accessToken }),
      setSellerApplication: (sellerApplication) => set({ sellerApplication }),
      setLoading: (isLoading) => set({ isLoading }),
      resetAuth: () => set({ user: null, role: null, accessToken: null, sellerApplication: null, isLoading: false }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
