import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CartItem } from "./cart";

// Generate tracking code format: EXO-AE-2026-XXXXXX
function generateTrackingCode() {
  const num = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  return `EXO-AE-2026-${num}`;
}

// Generate order ID
function generateOrderId() {
  return `ORD-${Date.now()}-${Math.floor(Math.random() * 10000)}`.substring(0, 20);
}

export interface OrderItem extends CartItem {
  selectedColor?: string;
  selectedStorage?: string;
  selectedVariants?: Record<string, string>;
}

export interface Order {
  id: string;
  trackingCode: string;
  items: OrderItem[];
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  shipping: {
    address: string;
    city: string;
    postalCode?: string;
    country: string;
  };
  payment: {
    method: "cod" | "card" | "online";
    status: "pending" | "completed" | "failed";
  };
  summary: {
    subtotal: number;
    shipping: number;
    vat: number;
    currency?: string;
    taxRate?: number;
    discount: number;
    total: number;
  };
  status: "pending" | "confirmed" | "packed" | "shipped" | "out_for_delivery" | "delivered" | "cancelled";
  createdAt: string;
  estimatedDelivery?: string;
}

interface OrderState {
  orders: Order[];
  currentOrder: Order | null;
  
  createOrder: (
    items: OrderItem[],
    customer: Order["customer"],
    shipping: Order["shipping"],
    payment: Order["payment"],
    summary: Order["summary"]
  ) => string; // returns order ID
  
  getOrder: (orderId: string) => Order | undefined;
  hydrateOrderFromApi: (order: any) => Order | null;
  updateOrderStatus: (orderId: string, status: Order["status"]) => void;
  getCurrentOrder: () => Order | null;
  setCurrentOrder: (orderId: string) => void;
  clearCurrentOrder: () => void;
  getAllOrders: () => Order[];
}

export const useOrderStore = create<OrderState>()(
  persist(
    (set, get) => ({
      orders: [],
      currentOrder: null,

      createOrder: (items, customer, shipping, payment, summary) => {
        const orderId = generateOrderId();
        const trackingCode = generateTrackingCode();
        
        // Calculate estimated delivery date (3-7 days from now)
        const today = new Date();
        const deliveryDate = new Date(today.getTime() + (4 * 24 * 60 * 60 * 1000));
        const estimatedDelivery = deliveryDate.toISOString().split('T')[0];

        const newOrder: Order = {
          id: orderId,
          trackingCode,
          items,
          customer,
          shipping,
          payment: {
            ...payment,
            status: payment.method === "cod" ? "pending" : "completed",
          },
          summary,
          status: "confirmed",
          createdAt: new Date().toISOString(),
          estimatedDelivery,
        };

        set((state) => ({
          orders: [...state.orders, newOrder],
          currentOrder: newOrder,
        }));

        return orderId;
      },

      getOrder: (orderId: string) => {
        return get().orders.find((o) => o.id === orderId);
      },

      hydrateOrderFromApi: (order: any) => {
        if (!order) return null;

        const customerName = String(order.customerName || '').trim();
        const nameParts = customerName ? customerName.split(/\s+/) : [];
        const hydratedOrder: Order = {
          id: String(order.orderId || order.orderNumber || order.id || ''),
          trackingCode: String(order.trackingCode || ''),
          items: Array.isArray(order.items) ? order.items : Array.isArray(order.products) ? order.products : [],
          customer: {
            firstName: nameParts[0] || 'Customer',
            lastName: nameParts.slice(1).join(' '),
            email: String(order.customerEmail || ''),
            phone: String(order.customerPhone || ''),
          },
          shipping: {
            address:
              String(
                order.shippingAddress?.addressLine ||
                  order.shippingAddress?.address ||
                  order.shippingAddress?.street ||
                  ''
              ),
            city: String(order.shippingAddress?.city || order.shippingAddress?.emirate || ''),
            postalCode: String(order.shippingAddress?.postalCode || ''),
            country: String(order.deliveryCountry || order.shippingAddress?.country || 'AE'),
          },
          payment: {
            method: (String(order.paymentMethod || 'cod').toLowerCase() as Order["payment"]["method"]),
            status:
              String(order.paymentStatus || '').toLowerCase() === 'completed' ||
              String(order.paymentStatus || '').toLowerCase() === 'paid'
                ? 'completed'
                : String(order.paymentStatus || '').toLowerCase() === 'failed'
                ? 'failed'
                : 'pending',
          },
          summary: {
            subtotal: Number(order.subtotal || 0),
            shipping: Number(order.shippingCost || order.deliveryFee || 0),
            vat: Number(order.vatAmount || 0),
            currency: String(order.currency || 'AED'),
            taxRate: typeof order.taxRate === 'number' ? order.taxRate : undefined,
            discount: Number(order.discountAmount || 0),
            total: Number(order.totalAmount || order.total || order.subtotal || 0),
          },
          status:
            String(order.status || 'pending').toLowerCase() === 'pending_confirmation'
              ? 'pending'
              : (String(order.status || 'pending').toLowerCase() as Order["status"]),
          createdAt: String(order.createdAt || new Date().toISOString()),
          estimatedDelivery: String(order.deliveryEta || ''),
        };

        set((state) => {
          const nextOrders = state.orders.filter(
            (existing) => existing.id !== hydratedOrder.id && existing.trackingCode !== hydratedOrder.trackingCode
          );
          return {
            orders: [...nextOrders, hydratedOrder],
            currentOrder: hydratedOrder,
          };
        });

        return hydratedOrder;
      },

      updateOrderStatus: (orderId: string, status: Order["status"]) => {
        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === orderId ? { ...o, status } : o
          ),
          currentOrder:
            state.currentOrder?.id === orderId
              ? { ...state.currentOrder, status }
              : state.currentOrder,
        }));
      },

      getCurrentOrder: () => {
        return get().currentOrder;
      },

      setCurrentOrder: (orderId: string) => {
        const order = get().getOrder(orderId);
        if (order) {
          set({ currentOrder: order });
        }
      },

      clearCurrentOrder: () => {
        set({ currentOrder: null });
      },

      getAllOrders: () => {
        return get().orders;
      },
    }),
    {
      name: "orders-store",
    }
  )
);
