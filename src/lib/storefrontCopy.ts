export type StorefrontLanguage =
  | "English"
  | "Arabic"
  | "Hindi"
  | "Urdu"
  | "Persian"
  | "Russian";

type CopyKey =
  | "choose_country"
  | "choose_country_subtitle"
  | "show_local_pricing"
  | "uae"
  | "saudi_arabia"
  | "add_to_cart"
  | "buy_now"
  | "free_delivery"
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
  | "wishlist"
  | "sign_in"
  | "categories"
  | "offers"
  | "secure_shopping"
  | "we_accept"
  | "download_app";

const copy: Record<StorefrontLanguage, Record<CopyKey, string>> = {
  English: {
    choose_country: "Choose Your Country",
    choose_country_subtitle: "Select your country to view local pricing, delivery, and offers.",
    show_local_pricing: "This helps us show local pricing, delivery, and offers.",
    uae: "UAE",
    saudi_arabia: "Saudi Arabia",
    add_to_cart: "Add to Cart",
    buy_now: "Buy Now",
    free_delivery: "Free Delivery",
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
    deliver_uae_only: "Now serving the GCC",
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
    wishlist: "Wishlist",
    sign_in: "Sign In",
    categories: "Categories",
    offers: "Offers",
    secure_shopping: "Secure Shopping",
    we_accept: "We Accept",
    download_app: "Download App",
  },
  Arabic: {
    choose_country: "اختر دولتك",
    choose_country_subtitle: "حدد دولتك لعرض الأسعار المحلية وخيارات التوصيل والعروض.",
    show_local_pricing: "يساعدنا هذا في عرض الأسعار المحلية والتوصيل والعروض.",
    uae: "الإمارات",
    saudi_arabia: "المملكة العربية السعودية",
    add_to_cart: "أضف إلى السلة",
    buy_now: "اشتر الآن",
    free_delivery: "توصيل مجاني",
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
    deliver_uae_only: "الآن نخدم الإمارات والسعودية",
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
    wishlist: "المفضلة",
    sign_in: "تسجيل الدخول",
    categories: "الفئات",
    offers: "العروض",
    secure_shopping: "تسوق آمن",
    we_accept: "نقبل",
    download_app: "تحميل التطبيق",
  },
  Hindi: {
    choose_country: "अपना देश चुनें",
    choose_country_subtitle: "स्थानीय कीमतें, डिलीवरी और ऑफ़र देखने के लिए अपना देश चुनें।",
    show_local_pricing: "इससे हम आपको स्थानीय कीमतें, डिलीवरी और ऑफ़र दिखा पाते हैं।",
    uae: "यूएई",
    saudi_arabia: "सऊदी अरब",
    add_to_cart: "कार्ट में जोड़ें",
    buy_now: "अभी खरीदें",
    free_delivery: "फ्री डिलीवरी",
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
    deliver_uae_only: "अब यूएई और सऊदी अरब में सेवा",
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
    wishlist: "विशलिस्ट",
    sign_in: "साइन इन",
    categories: "श्रेणियां",
    offers: "ऑफ़र",
    secure_shopping: "सुरक्षित खरीदारी",
    we_accept: "हम स्वीकार करते हैं",
    download_app: "ऐप डाउनलोड करें",
  },
  Urdu: {
    choose_country: "اپنا ملک منتخب کریں",
    choose_country_subtitle: "مقامی قیمتیں، ڈیلیوری اور آفرز دیکھنے کے لیے اپنا ملک منتخب کریں۔",
    show_local_pricing: "اس سے ہم آپ کو مقامی قیمتیں، ڈیلیوری اور آفرز دکھا سکتے ہیں۔",
    uae: "یو اے ای",
    saudi_arabia: "سعودی عرب",
    add_to_cart: "کارٹ میں شامل کریں",
    buy_now: "ابھی خریدیں",
    free_delivery: "مفت ڈیلیوری",
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
    deliver_uae_only: "اب یو اے ای اور سعودی عرب میں سروس",
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
    wishlist: "وش لسٹ",
    sign_in: "سائن اِن",
    categories: "اقسام",
    offers: "آفرز",
    secure_shopping: "محفوظ خریداری",
    we_accept: "ہم قبول کرتے ہیں",
    download_app: "ایپ ڈاؤن لوڈ کریں",
  },
  Persian: {
    choose_country: "کشور خود را انتخاب کنید",
    choose_country_subtitle: "برای مشاهده قیمت، ارسال و پیشنهادهای محلی، کشور خود را انتخاب کنید.",
    show_local_pricing: "این کار به ما کمک می‌کند قیمت، ارسال و پیشنهادهای محلی را نمایش دهیم.",
    uae: "امارات",
    saudi_arabia: "عربستان سعودی",
    add_to_cart: "افزودن به سبد",
    buy_now: "همین حالا بخرید",
    free_delivery: "ارسال رایگان",
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
    deliver_uae_only: "اکنون در امارات و عربستان سعودی فعال",
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
    wishlist: "علاقه‌مندی‌ها",
    sign_in: "ورود",
    categories: "دسته‌ها",
    offers: "پیشنهادها",
    secure_shopping: "خرید امن",
    we_accept: "روش‌های پرداخت",
    download_app: "دانلود اپ",
  },
  Russian: {
    choose_country: "Выберите страну",
    choose_country_subtitle: "Выберите страну, чтобы видеть локальные цены, доставку и предложения.",
    show_local_pricing: "Это помогает показывать локальные цены, доставку и предложения.",
    uae: "ОАЭ",
    saudi_arabia: "Саудовская Аравия",
    add_to_cart: "В корзину",
    buy_now: "Купить сейчас",
    free_delivery: "Бесплатная доставка",
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
    wishlist: "Избранное",
    sign_in: "Войти",
    categories: "Категории",
    offers: "Предложения",
    secure_shopping: "Безопасные покупки",
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
