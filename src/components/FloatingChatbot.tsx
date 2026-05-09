import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  ArrowUpRight,
  Bot,
  BriefcaseBusiness,
  Headphones,
  MessageCircle,
  PackageSearch,
  RotateCcw,
  Search,
  Send,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Truck,
  WalletCards,
  X,
  type LucideIcon,
} from "lucide-react";
import { productAPI } from "../services/api";
import { useCartStore } from "../store/cart";
import { useCountryStore } from "../store/country";
import { useOrderStore } from "../store/orders";
import {
  getCountryConfig,
  getProductCountryPrice,
  getShippingOption,
} from "../lib/countryConfig";
import { formatCurrencyPlainForCountry } from "../lib/currency";
import {
  getLiveMarketplaceProducts,
  type LiveMarketplaceProduct,
} from "../lib/liveMarketplaceProducts";
import { buildProductPath } from "../lib/seo";
import {
  getSearchCorrection,
  getTrendingSearches,
  smartSearchProducts,
} from "../lib/smartSearch";

type AssistantMessage = {
  id: string;
  role: "bot" | "user";
  text: string;
  products?: LiveMarketplaceProduct[];
  cta?: {
    label: string;
    href: string;
  };
};

type QuickAction = {
  label: string;
  prompt: string;
  icon: LucideIcon;
};

const WHATSAPP_NUMBER = "971522608063";
const WHATSAPP_DISPLAY = "+971522608063";
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}`;
const FALLBACK_ANSWER =
  "I can help you with products, orders, delivery, warranty, COD, returns, and support. For fast help, contact ExShopi WhatsApp: +971522608063";
const WELCOME_MESSAGE =
  "Hi 👋 I’m ExShopi AI. I can help you find products, compare laptops, track orders, check delivery, understand warranty, and contact support.";

const QUICK_ACTIONS: QuickAction[] = [
  { label: "Find Products", prompt: "Find products for me", icon: PackageSearch },
  { label: "Track Order", prompt: "Track my order", icon: Truck },
  { label: "Laptop Help", prompt: "Help me choose a laptop", icon: Search },
  { label: "Mobile Help", prompt: "Help me find a mobile phone", icon: ShoppingBag },
  { label: "Delivery Info", prompt: "Delivery information", icon: Truck },
  { label: "Cash on Delivery", prompt: "Cash on delivery", icon: WalletCards },
  { label: "Warranty", prompt: "Warranty information", icon: ShieldCheck },
  { label: "Return Policy", prompt: "Return policy", icon: RotateCcw },
  { label: "Contact WhatsApp", prompt: "Contact WhatsApp support", icon: MessageCircle },
  { label: "Bulk Order", prompt: "Bulk order support", icon: BriefcaseBusiness },
  { label: "Seller Registration", prompt: "Seller registration", icon: ShoppingBag },
  { label: "Talk to Support", prompt: "Talk to support", icon: Headphones },
];

const PRODUCT_TERMS = [
  "laptop",
  "macbook",
  "imac",
  "mobile",
  "iphone",
  "samsung",
  "tablet",
  "camera",
  "dslr",
  "accessory",
  "accessories",
  "refurbished",
  "used",
  "dell",
  "hp",
  "elitebook",
  "lenovo",
  "gaming",
  "cheap",
  "under",
  "aed",
  "i7",
  "i5",
];

const messageId = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;

function normalizeText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function includesAny(query: string, terms: string[]) {
  const normalized = normalizeText(query);
  return terms.some((term) => normalized.includes(term));
}

function getProductSpecs(product: LiveMarketplaceProduct) {
  const raw = product.raw || {};
  const specs = raw.specs || {};
  const attributes = specs.attributes || {};
  const values = [
    raw.brand || specs.brand || attributes.brand,
    raw.model || specs.model || attributes.model,
    attributes.processor || attributes.cpu || specs.processor,
    attributes.ram || specs.ram,
    attributes.storage || specs.storage,
    attributes.condition || specs.condition || raw.condition,
  ]
    .map((value) => String(value || "").trim())
    .filter(Boolean);

  return Array.from(new Set(values)).slice(0, 4).join(" • ");
}

function needsWhatsAppHandoff(query: string) {
  return includesAny(query, [
    "whatsapp",
    "contact",
    "support",
    "agent",
    "human",
    "call",
    "phone",
    "order",
    "bulk",
    "seller",
    "vendor",
    "damaged",
    "wrong item",
    "cancel",
    "refund",
  ]);
}

function isProductQuery(query: string) {
  return includesAny(query, PRODUCT_TERMS);
}

export default function FloatingChatbot() {
  const navigate = useNavigate();
  const selectedCountry = useCountryStore((state) => state.selectedCountry);
  const selectedCity = useCountryStore((state) => state.selectedCity);
  const selectedShippingOption = useCountryStore((state) => state.selectedShippingOption);
  const cartItems = useCartStore((state) => state.items);
  const orders = useOrderStore((state) => state.orders);
  const currentOrder = useOrderStore((state) => state.currentOrder);

  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<AssistantMessage[]>([
    { id: "welcome", role: "bot", text: WELCOME_MESSAGE },
  ]);
  const [catalog, setCatalog] = useState<LiveMarketplaceProduct[]>([]);
  const [catalogLoaded, setCatalogLoaded] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const country = useMemo(() => getCountryConfig(selectedCountry), [selectedCountry]);
  const shippingOption = useMemo(
    () => getShippingOption(selectedCountry, selectedShippingOption),
    [selectedCountry, selectedShippingOption]
  );
  const cartCount = useMemo(
    () => cartItems.reduce((total, item) => total + item.quantity, 0),
    [cartItems]
  );

  const ensureCatalogLoaded = useCallback(async () => {
    if (catalogLoaded) return catalog;

    try {
      const products = await productAPI.getAll();
      const liveProducts = getLiveMarketplaceProducts(Array.isArray(products) ? products : []);
      setCatalog(liveProducts);
      setCatalogLoaded(true);
      return liveProducts;
    } catch (error) {
      console.warn("ExShopi AI product catalog failed to load:", error);
      setCatalogLoaded(true);
      return [];
    }
  }, [catalog, catalogLoaded]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isTyping]);

  useEffect(() => {
    const openChat = () => setIsOpen(true);
    window.addEventListener("openExshopiChat", openChat);
    return () => window.removeEventListener("openExshopiChat", openChat);
  }, []);

  useEffect(() => {
    if (isOpen) {
      void ensureCatalogLoaded();
    }
  }, [ensureCatalogLoaded, isOpen]);

  const buildAnswer = useCallback(
    (query: string, products: LiveMarketplaceProduct[]): AssistantMessage => {
      const lowerQuery = normalizeText(query);
      const correction = getSearchCorrection(query);
      const productResults = smartSearchProducts(products, query, 4).map((result) => result.item);
      const genericProductHelp =
        lowerQuery.includes("find products") ||
        lowerQuery.includes("show products") ||
        lowerQuery.includes("product help");
      const featuredProducts = genericProductHelp ? products.slice(0, 4) : [];
      const showProducts = isProductQuery(query) || productResults.length > 0;
      const withWhatsApp = needsWhatsAppHandoff(query);
      const cta = withWhatsApp ? { label: "Chat on WhatsApp", href: WHATSAPP_URL } : undefined;

      if (genericProductHelp && featuredProducts.length > 0) {
        return {
          id: messageId(),
          role: "bot",
          text: `Here are live ExShopi products to start with. You can also ask for MacBook, Dell i7, HP EliteBook, gaming laptop, iPhone, Samsung, camera, or a budget such as laptop under 1000 AED.`,
          products: featuredProducts,
          cta,
        };
      }

      if (showProducts && productResults.length > 0) {
        const correctionText = correction ? ` Did you mean ${correction}?` : "";
        return {
          id: messageId(),
          role: "bot",
          text: `I found ${productResults.length} live product match${
            productResults.length === 1 ? "" : "es"
          } for "${query}".${correctionText} You can open any item to check specs, price, stock, warranty, and delivery for ${country.shortName}.`,
          products: productResults,
          cta,
        };
      }

      if (showProducts) {
        return {
          id: messageId(),
          role: "bot",
          text: `I could not find an exact live match for "${query}" right now. Try ${getTrendingSearches()
            .slice(0, 4)
            .join(", ")}, or contact ExShopi WhatsApp for fast stock checking.`,
          cta: { label: "Chat on WhatsApp", href: WHATSAPP_URL },
        };
      }

      if (lowerQuery.includes("track") || lowerQuery.includes("status")) {
        const latestOrder = currentOrder || orders[orders.length - 1];
        return {
          id: messageId(),
          role: "bot",
          text: latestOrder
            ? `Your latest order ${latestOrder.id} is ${latestOrder.status.replace(/_/g, " ")}. Tracking code: ${
                latestOrder.trackingCode || "will be shared after dispatch"
              }. Estimated delivery: ${latestOrder.estimatedDelivery || shippingOption.eta}.`
            : "You can track orders from your account order page using your order ID or tracking code. If you placed an order by WhatsApp or COD, send your phone number to ExShopi support.",
          cta: { label: "Chat on WhatsApp", href: WHATSAPP_URL },
        };
      }

      if (lowerQuery.includes("delivery") || lowerQuery.includes("shipping") || lowerQuery.includes("gcc")) {
        return {
          id: messageId(),
          role: "bot",
          text: `${country.deliveryMessage}. Standard delivery to ${selectedCity || country.defaultCity} is ${
            shippingOption.eta
          }, with a delivery charge from ${formatCurrencyPlainForCountry(
            shippingOption.fee,
            selectedCountry
          )}. ExShopi supports UAE, Saudi Arabia, Qatar, Oman, Kuwait, and Bahrain.`,
          cta,
        };
      }

      if (lowerQuery.includes("cod") || lowerQuery.includes("cash on delivery") || lowerQuery.includes("cash")) {
        return {
          id: messageId(),
          role: "bot",
          text: "Cash on Delivery is available for eligible orders. You can check the item before payment when COD is offered, then pay at delivery according to the checkout confirmation.",
          cta,
        };
      }

      if (lowerQuery.includes("payment") || lowerQuery.includes("card") || lowerQuery.includes("bank") || lowerQuery.includes("paypal") || lowerQuery.includes("payoneer")) {
        return {
          id: messageId(),
          role: "bot",
          text: "ExShopi supports UAE Cash on Delivery with OTP, secure card checkout, and PayPal for eligible prepaid worldwide orders. Payoneer and assisted payment options remain available where shown in checkout.",
          cta,
        };
      }

      if (lowerQuery.includes("warranty") || lowerQuery.includes("condition") || lowerQuery.includes("refurbished") || lowerQuery.includes("used")) {
        return {
          id: messageId(),
          role: "bot",
          text: "Most refurbished and used electronics include a 30 days warranty unless the product page says otherwise. Product condition, specs, battery or accessory details should be checked on the product page before checkout.",
          cta,
        };
      }

      if (lowerQuery.includes("return") || lowerQuery.includes("replacement") || lowerQuery.includes("refund") || lowerQuery.includes("damaged") || lowerQuery.includes("wrong")) {
        return {
          id: messageId(),
          role: "bot",
          text: "For returns, replacement, damaged items, wrong items, or refund requests, contact ExShopi support quickly with your order ID, photos, and delivery details. The team will review eligibility and guide the next step.",
          cta: { label: "Chat on WhatsApp", href: WHATSAPP_URL },
        };
      }

      if (lowerQuery.includes("cart") || lowerQuery.includes("checkout") || lowerQuery.includes("wishlist") || lowerQuery.includes("account") || lowerQuery.includes("verification") || lowerQuery.includes("currency") || lowerQuery.includes("country")) {
        return {
          id: messageId(),
          role: "bot",
          text: `Your selected market is ${country.name} and currency is ${country.currency}. You have ${cartCount} item${
            cartCount === 1 ? "" : "s"
          } in cart. You can create an account, verify your phone, use wishlist, review cart, choose country, and complete checkout from the website flow.`,
          cta,
        };
      }

      if (lowerQuery.includes("bulk")) {
        return {
          id: messageId(),
          role: "bot",
          text: "For bulk laptop, mobile, camera, or accessories orders, share product type, quantity, target budget, country, and delivery city with ExShopi support. The team can confirm stock and best available pricing.",
          cta: { label: "Chat on WhatsApp", href: WHATSAPP_URL },
        };
      }

      if (lowerQuery.includes("seller") || lowerQuery.includes("vendor")) {
        return {
          id: messageId(),
          role: "bot",
          text: "Seller registration is available for vendors who want to list products on ExShopi. Prepare your store details, contact information, product categories, and business documents if requested.",
          cta: { label: "Chat on WhatsApp", href: WHATSAPP_URL },
        };
      }

      if (withWhatsApp) {
        return {
          id: messageId(),
          role: "bot",
          text: `For fast help with products, orders, delivery, warranty, COD, returns, seller support, or bulk orders, contact ExShopi WhatsApp: ${WHATSAPP_DISPLAY}.`,
          cta: { label: "Chat on WhatsApp", href: WHATSAPP_URL },
        };
      }

      return {
        id: messageId(),
        role: "bot",
        text: FALLBACK_ANSWER,
        cta: { label: "Chat on WhatsApp", href: WHATSAPP_URL },
      };
    },
    [cartCount, country, currentOrder, orders, selectedCity, selectedCountry, shippingOption]
  );

  const handleSendMessage = useCallback(
    async (message?: string) => {
      const messageText = (message || input).trim();
      if (!messageText) return;

      setInput("");
      setMessages((prev) => [
        ...prev,
        { id: messageId(), role: "user", text: messageText },
      ]);
      setIsTyping(true);

      const products = await ensureCatalogLoaded();
      const botMessage = buildAnswer(messageText, products);

      setMessages((prev) => [...prev, botMessage]);
      setIsTyping(false);
    },
    [buildAnswer, ensureCatalogLoaded, input]
  );

  const openProduct = (product: LiveMarketplaceProduct) => {
    setIsOpen(false);
    navigate(buildProductPath(product));
  };

  const openWhatsApp = () => {
    window.open(WHATSAPP_URL, "_blank", "noopener,noreferrer");
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="group fixed bottom-5 right-5 z-[99980] sm:bottom-6 sm:right-6"
        aria-label="Open ExShopi AI Assistant"
      >
        <span className="absolute inset-0 rounded-full bg-blue-500/30 blur-xl transition duration-300 group-hover:scale-125 group-hover:bg-blue-500/40" />
        <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 via-blue-600 to-blue-800 text-white shadow-[0_18px_50px_rgba(37,99,235,0.35)] transition duration-300 group-hover:scale-105 sm:h-16 sm:w-16">
          <MessageCircle className="h-6 w-6 sm:h-7 sm:w-7" />
          <Sparkles className="absolute right-3 top-3 h-3.5 w-3.5 text-blue-100" />
        </span>
        <span className="pointer-events-none absolute -top-11 right-0 hidden rounded-full bg-slate-950 px-3 py-1.5 text-xs font-semibold text-white opacity-0 shadow-xl transition duration-300 group-hover:opacity-100 sm:block">
          ExShopi AI
        </span>
      </button>
    );
  }

  return createPortal(
    <div className="pointer-events-none fixed inset-0 z-[99980]">
      <section
        className="pointer-events-auto fixed inset-x-3 bottom-3 top-3 flex min-h-0 flex-col overflow-hidden rounded-3xl border border-white/70 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.25)] sm:bottom-6 sm:left-auto sm:right-6 sm:top-auto sm:h-[75vh] sm:max-h-[680px] sm:w-[420px] sm:max-w-[calc(100vw-2rem)]"
        style={{ animation: "exshopiChatIn 180ms ease-out" }}
        role="dialog"
        aria-label="ExShopi AI chat assistant"
      >
        <header className="shrink-0 overflow-hidden bg-[linear-gradient(135deg,#1d4ed8,#2563eb,#102a6a)] px-4 py-4 text-white sm:px-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/30 bg-white/15">
                <Bot className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h2 className="text-base font-black leading-tight tracking-tight">ExShopi AI</h2>
                <p className="text-xs font-semibold text-blue-100">Smart Shopping Assistant</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white transition hover:bg-white/20"
              aria-label="Close ExShopi AI"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-blue-50">
            <span className="h-2 w-2 rounded-full bg-emerald-300" />
            <span>
              {country.shortName} • {country.currency} • WhatsApp {WHATSAPP_DISPLAY}
            </span>
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto bg-slate-50 px-3 py-4 sm:px-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm font-medium leading-relaxed shadow-sm ${
                    message.role === "user"
                      ? "rounded-br-md bg-blue-600 text-white"
                      : "rounded-bl-md border border-slate-200 bg-white text-slate-900"
                  }`}
                >
                  <p>{message.text}</p>
                  {message.products?.length ? (
                    <div className="mt-3 space-y-2">
                      {message.products.map((product) => {
                        const price = getProductCountryPrice(product, selectedCountry);
                        const specs = getProductSpecs(product);
                        return (
                          <button
                            key={product.id}
                            onClick={() => openProduct(product)}
                            className="flex w-full gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-2 text-left transition hover:border-blue-300 hover:bg-blue-50"
                          >
                            <img
                              src={product.image}
                              alt={product.title}
                              className="h-16 w-16 shrink-0 rounded-xl bg-white object-contain"
                              loading="lazy"
                            />
                            <span className="min-w-0 flex-1">
                              <span className="line-clamp-2 block text-xs font-black text-slate-950">
                                {product.title}
                              </span>
                              <span className="mt-1 block text-[11px] font-semibold text-slate-500">
                                {product.category} • {product.stock || "In Stock"}
                              </span>
                              {specs ? (
                                <span className="mt-1 line-clamp-1 block text-[11px] text-slate-500">
                                  {specs}
                                </span>
                              ) : null}
                              <span className="mt-1 block text-sm font-black text-blue-700">
                                {formatCurrencyPlainForCountry(price, selectedCountry)}
                              </span>
                            </span>
                            <ArrowUpRight className="mt-1 h-4 w-4 shrink-0 text-slate-400" />
                          </button>
                        );
                      })}
                    </div>
                  ) : null}
                  {message.cta ? (
                    <a
                      href={message.cta.href}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex items-center gap-2 rounded-full bg-emerald-600 px-3 py-2 text-xs font-black text-white transition hover:bg-emerald-700"
                    >
                      {message.cta.label}
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </a>
                  ) : null}
                </div>
              </div>
            ))}

            {messages.length === 1 ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-3 shadow-sm">
                <p className="px-1 pb-3 text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                  Quick help
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {QUICK_ACTIONS.map((action) => {
                    const Icon = action.icon;
                    return (
                      <button
                        key={action.label}
                        onClick={() => void handleSendMessage(action.prompt)}
                        className="flex min-h-[48px] items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-left text-xs font-black text-slate-800 transition hover:border-blue-300 hover:bg-blue-50 active:scale-[0.98]"
                      >
                        <Icon className="h-4 w-4 shrink-0 text-blue-600" />
                        <span className="min-w-0 leading-tight">{action.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {isTyping ? (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-md border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-500 shadow-sm">
                  Checking ExShopi data...
                </div>
              </div>
            ) : null}
            <div ref={messagesEndRef} />
          </div>
        </main>

        <footer className="shrink-0 border-t border-slate-200 bg-white px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3 sm:px-4">
          <div className="mb-2 flex gap-2 overflow-x-auto pb-1">
            {getTrendingSearches().slice(0, 5).map((term) => (
              <button
                key={term}
                onClick={() => void handleSendMessage(term)}
                className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50"
              >
                {term}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void handleSendMessage();
                }
              }}
              placeholder="Ask about products, orders, delivery, warranty…"
              className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-500 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
            />
            <button
              onClick={() => void handleSendMessage()}
              disabled={!input.trim() || isTyping}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Send message"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
          <button
            onClick={openWhatsApp}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700 transition hover:bg-emerald-100"
          >
            Chat on WhatsApp
            <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        </footer>
      </section>

      <style>{`
        @keyframes exshopiChatIn {
          from {
            opacity: 0;
            transform: translateY(14px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>,
    document.body
  );
}
