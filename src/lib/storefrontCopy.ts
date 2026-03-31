export type StorefrontLanguage =
  | "English"
  | "Arabic"
  | "Hindi"
  | "Urdu"
  | "Persian"
  | "Russian";

type CopyKey =
  | "all_categories"
  | "search"
  | "search_placeholder"
  | "departments"
  | "laptops"
  | "mobiles"
  | "tablets"
  | "accessories"
  | "vendors"
  | "today_deals"
  | "browse_all_categories"
  | "fast_delivery"
  | "trusted_sellers"
  | "deliver_uae_only"
  | "need_help"
  | "chat_with_us"
  | "call_us"
  | "email_us"
  | "help_center"
  | "browse_faqs"
  | "customer_service"
  | "contact"
  | "track_order"
  | "returns"
  | "warranty"
  | "shop"
  | "seller"
  | "sell_with_exshopi"
  | "company"
  | "about"
  | "privacy"
  | "terms"
  | "faq"
  | "we_accept"
  | "download_app";

const copy: Record<StorefrontLanguage, Record<CopyKey, string>> = {
  English: {
    all_categories: "All Categories",
    search: "Search",
    search_placeholder: "Search for laptops, phones, accessories, sellers...",
    departments: "Departments",
    laptops: "Laptops",
    mobiles: "Mobiles",
    tablets: "Tablets",
    accessories: "Accessories",
    vendors: "Vendors",
    today_deals: "Today Deals",
    browse_all_categories: "Browse All Categories",
    fast_delivery: "Fast Delivery",
    trusted_sellers: "Trusted Sellers",
    deliver_uae_only: "Delivering across UAE only",
    need_help: "Need help?",
    chat_with_us: "Chat with us",
    call_us: "Call us",
    email_us: "Email us",
    help_center: "Help center",
    browse_faqs: "Browse FAQs",
    customer_service: "Customer Service",
    contact: "Contact",
    track_order: "Track Order",
    returns: "Returns",
    warranty: "Warranty",
    shop: "Shop",
    seller: "Seller",
    sell_with_exshopi: "Sell with ExShopi",
    company: "Company",
    about: "About",
    privacy: "Privacy",
    terms: "Terms",
    faq: "FAQ",
    we_accept: "We Accept",
    download_app: "Download App",
  },
  Arabic: {
    all_categories: "كل الفئات",
    search: "بحث",
    search_placeholder: "ابحث عن لابتوبات، هواتف، إكسسوارات، وبائعين...",
    departments: "الأقسام",
    laptops: "لابتوبات",
    mobiles: "هواتف",
    tablets: "أجهزة لوحية",
    accessories: "إكسسوارات",
    vendors: "البائعون",
    today_deals: "عروض اليوم",
    browse_all_categories: "تصفح كل الفئات",
    fast_delivery: "توصيل سريع",
    trusted_sellers: "بائعون موثوقون",
    deliver_uae_only: "التوصيل داخل الإمارات فقط",
    need_help: "تحتاج مساعدة؟",
    chat_with_us: "تحدث معنا",
    call_us: "اتصل بنا",
    email_us: "راسلنا",
    help_center: "مركز المساعدة",
    browse_faqs: "تصفح الأسئلة الشائعة",
    customer_service: "خدمة العملاء",
    contact: "اتصل بنا",
    track_order: "تتبع الطلب",
    returns: "الإرجاع",
    warranty: "الضمان",
    shop: "تسوق",
    seller: "البائع",
    sell_with_exshopi: "بع مع إكس شوبي",
    company: "الشركة",
    about: "من نحن",
    privacy: "الخصوصية",
    terms: "الشروط",
    faq: "الأسئلة الشائعة",
    we_accept: "نقبل",
    download_app: "تحميل التطبيق",
  },
  Hindi: {
    all_categories: "सभी श्रेणियां",
    search: "खोजें",
    search_placeholder: "लैपटॉप, फोन, एक्सेसरीज़ और सेलर खोजें...",
    departments: "विभाग",
    laptops: "लैपटॉप",
    mobiles: "मोबाइल",
    tablets: "टैबलेट",
    accessories: "एक्सेसरीज़",
    vendors: "विक्रेता",
    today_deals: "आज के ऑफ़र",
    browse_all_categories: "सभी श्रेणियां देखें",
    fast_delivery: "तेज़ डिलीवरी",
    trusted_sellers: "विश्वसनीय विक्रेता",
    deliver_uae_only: "पूरे यूएई में डिलीवरी",
    need_help: "मदद चाहिए?",
    chat_with_us: "चैट करें",
    call_us: "कॉल करें",
    email_us: "ईमेल करें",
    help_center: "सहायता केंद्र",
    browse_faqs: "FAQ देखें",
    customer_service: "ग्राहक सेवा",
    contact: "संपर्क",
    track_order: "ऑर्डर ट्रैक करें",
    returns: "रिटर्न",
    warranty: "वारंटी",
    shop: "शॉप",
    seller: "विक्रेता",
    sell_with_exshopi: "ExShopi के साथ बेचें",
    company: "कंपनी",
    about: "हमारे बारे में",
    privacy: "गोपनीयता",
    terms: "शर्तें",
    faq: "FAQ",
    we_accept: "हम स्वीकार करते हैं",
    download_app: "ऐप डाउनलोड करें",
  },
  Urdu: {
    all_categories: "تمام اقسام",
    search: "تلاش",
    search_placeholder: "لیپ ٹاپ، فون، ایکسیسریز اور سیلرز تلاش کریں...",
    departments: "شعبے",
    laptops: "لیپ ٹاپ",
    mobiles: "موبائل",
    tablets: "ٹیبلیٹس",
    accessories: "ایکسیسریز",
    vendors: "فروخت کنندگان",
    today_deals: "آج کی ڈیلز",
    browse_all_categories: "تمام اقسام دیکھیں",
    fast_delivery: "تیز ترسیل",
    trusted_sellers: "قابل اعتماد سیلرز",
    deliver_uae_only: "پورے یو اے ای میں ڈیلیوری",
    need_help: "مدد چاہیے؟",
    chat_with_us: "ہم سے چیٹ کریں",
    call_us: "ہمیں کال کریں",
    email_us: "ای میل کریں",
    help_center: "ہیلپ سینٹر",
    browse_faqs: "عمومی سوالات دیکھیں",
    customer_service: "کسٹمر سروس",
    contact: "رابطہ",
    track_order: "آرڈر ٹریک کریں",
    returns: "واپسی",
    warranty: "وارنٹی",
    shop: "شاپ",
    seller: "سیلر",
    sell_with_exshopi: "ExShopi کے ساتھ فروخت کریں",
    company: "کمپنی",
    about: "ہمارے بارے میں",
    privacy: "پرائیویسی",
    terms: "شرائط",
    faq: "FAQ",
    we_accept: "ہم قبول کرتے ہیں",
    download_app: "ایپ ڈاؤن لوڈ کریں",
  },
  Persian: {
    all_categories: "همه دسته‌ها",
    search: "جستجو",
    search_placeholder: "لپ‌تاپ، موبایل، لوازم جانبی و فروشندگان را جستجو کنید...",
    departments: "بخش‌ها",
    laptops: "لپ‌تاپ",
    mobiles: "موبایل",
    tablets: "تبلت",
    accessories: "لوازم جانبی",
    vendors: "فروشندگان",
    today_deals: "پیشنهادهای امروز",
    browse_all_categories: "مشاهده همه دسته‌ها",
    fast_delivery: "ارسال سریع",
    trusted_sellers: "فروشندگان معتبر",
    deliver_uae_only: "ارسال در سراسر امارات",
    need_help: "نیاز به کمک دارید؟",
    chat_with_us: "چت با ما",
    call_us: "تماس با ما",
    email_us: "ایمیل به ما",
    help_center: "مرکز راهنما",
    browse_faqs: "مشاهده سوالات متداول",
    customer_service: "خدمات مشتریان",
    contact: "تماس",
    track_order: "پیگیری سفارش",
    returns: "مرجوعی",
    warranty: "گارانتی",
    shop: "فروشگاه",
    seller: "فروشنده",
    sell_with_exshopi: "با ExShopi بفروشید",
    company: "شرکت",
    about: "درباره ما",
    privacy: "حریم خصوصی",
    terms: "شرایط",
    faq: "FAQ",
    we_accept: "روش‌های پرداخت",
    download_app: "دانلود اپ",
  },
  Russian: {
    all_categories: "Все категории",
    search: "Поиск",
    search_placeholder: "Ищите ноутбуки, телефоны, аксессуары и продавцов...",
    departments: "Разделы",
    laptops: "Ноутбуки",
    mobiles: "Телефоны",
    tablets: "Планшеты",
    accessories: "Аксессуары",
    vendors: "Продавцы",
    today_deals: "Сделки дня",
    browse_all_categories: "Смотреть все категории",
    fast_delivery: "Быстрая доставка",
    trusted_sellers: "Надежные продавцы",
    deliver_uae_only: "Доставка по всему ОАЭ",
    need_help: "Нужна помощь?",
    chat_with_us: "Написать нам",
    call_us: "Позвонить нам",
    email_us: "Написать на почту",
    help_center: "Центр помощи",
    browse_faqs: "Смотреть FAQ",
    customer_service: "Сервис",
    contact: "Контакты",
    track_order: "Отследить заказ",
    returns: "Возвраты",
    warranty: "Гарантия",
    shop: "Магазин",
    seller: "Продавец",
    sell_with_exshopi: "Продавать с ExShopi",
    company: "Компания",
    about: "О нас",
    privacy: "Конфиденциальность",
    terms: "Условия",
    faq: "FAQ",
    we_accept: "Мы принимаем",
    download_app: "Скачать приложение",
  },
};

export function storefrontT(language: string, key: CopyKey): string {
  const normalized = (Object.keys(copy) as StorefrontLanguage[]).find(
    (lang) => lang.toLowerCase() === language.toLowerCase()
  ) || "English";
  return copy[normalized][key] || copy.English[key];
}
