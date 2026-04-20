function normalizeText(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
}
function titleCase(value) {
    return normalizeText(value)
        .split(/[-_\s]+/)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
}
export function cleanSeoSlug(value) {
    return normalizeText(value)
        .toLowerCase()
        .replace(/\bcopy\b/g, "")
        .replace(/-copy(?:-\d+)?$/g, "")
        .replace(/copy-\d+$/g, "")
        .replace(/&/g, " and ")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 140);
}
export function extractProductSeoFacts(product) {
    const specs = product?.specs || {};
    const attributes = specs?.attributes || {};
    const title = normalizeText(product?.title || product?.name || "Marketplace Product");
    const brand = normalizeText(product?.brand ||
        attributes?.brand ||
        specs?.brand ||
        title.split(" ").slice(0, 2).join(" "));
    const titleYearMatch = title.match(/\b(20\d{2}|19\d{2})\b/);
    const year = normalizeText(product?.year ||
        attributes?.year ||
        specs?.year ||
        titleYearMatch?.[0] ||
        "");
    const model = normalizeText(attributes?.model ||
        specs?.model ||
        title
            .replace(new RegExp(`^${brand}`, "i"), "")
            .replace(/\b(renewed|refurbished|used)\b/gi, "")
            .trim());
    const prioritizedSpecs = [
        attributes?.processor,
        attributes?.chipset,
        attributes?.ram,
        attributes?.storage,
        attributes?.screenSize,
        attributes?.screen_size,
        specs?.processor,
        specs?.ram,
        specs?.storage,
    ]
        .map((value) => normalizeText(String(value || "")))
        .filter(Boolean)
        .slice(0, 3);
    return {
        title,
        brand,
        model,
        year,
        prioritizedSpecs,
    };
}
export function buildRichProductTitle(product) {
    const facts = extractProductSeoFacts(product);
    const parts = [
        facts.brand,
        facts.model,
        facts.year,
        facts.prioritizedSpecs.join(" | "),
        "UAE",
    ].filter(Boolean);
    return parts.join(" ").replace(/\s+\|/g, " |").trim();
}
export function buildProductSeoNarrative(product) {
    const facts = extractProductSeoFacts(product);
    const category = normalizeText(product?.specs?.subcategoryName ||
        product?.specs?.categoryName ||
        product?.category ||
        "electronics");
    const seller = normalizeText(product?.sellerName || product?.seller || "ExShopi Official");
    const stock = Number(product?.stock || 0) > 0 ? "in stock" : "currently limited in stock";
    return [
        `${facts.title} is built for shoppers in the UAE who want a clearer way to compare ${category.toLowerCase()} listings before ordering online. ExShopi surfaces structured specifications, condition notes, and seller details so buyers in Dubai, Abu Dhabi, Sharjah, and across the Emirates can understand exactly what they are getting before checkout.`,
        `${facts.brand || "This model"}${facts.year ? ` from ${facts.year}` : ""} stands out with ${facts.prioritizedSpecs.length ? facts.prioritizedSpecs.join(", ") : "practical everyday performance"}, making it a strong fit for work, study, home use, and value-focused upgrades. The listing is supported by product metadata, keyword-rich descriptions, and clean marketplace signals that help both shoppers and search engines interpret the offer more accurately.`,
        `This item is sold by ${seller} and is ${stock}, with UAE-focused trust cues such as cash on delivery support, delivery visibility, and verified marketplace handling. Buyers searching for ${facts.brand || category} in UAE, refurbished ${category.toLowerCase()} deals, or competitive electronics pricing can use this page to review the main specifications, compare related products, and move from research to purchase with more confidence.`,
    ].join(" ");
}
export function buildCategorySeoBody(input) {
    const categoryName = titleCase(input.categoryName || input.subcategorySlug || input.categorySlug || "Marketplace");
    const keyword = input.subcategorySlug
        ? `${titleCase(input.subcategorySlug)} in UAE`
        : `${categoryName} in UAE`;
    const countText = input.productCount ? `${input.productCount}+ live listings` : "live marketplace listings";
    return [
        `${categoryName} shoppers in the UAE usually want three things at once: trusted pricing, clearer product information, and faster ways to compare offers without opening ten different tabs. This category page is designed to solve exactly that problem by grouping ${countText}, surfacing cleaner product titles, and helping search engines understand what ExShopi offers for Dubai, Abu Dhabi, Sharjah, and wider GCC demand. If you are searching for ${keyword.toLowerCase()}, this page gives you a stronger starting point than generic listing pages with thin metadata or vague specifications.`,
        `Every category section on ExShopi is built to support both discoverability and conversion. Product cards connect directly to structured detail pages, related items, and seller context so buyers can move from category browsing to product evaluation with less friction. That internal linking pattern also helps search engines understand how products, subcategories, and homepage collections connect to one another, which supports better crawling and more consistent indexing over time.`,
        `For UAE shoppers, trust signals matter as much as price. ExShopi highlights marketplace-ready details such as cash on delivery support, UAE delivery expectations, verified sellers, and product-level specifications where available. Whether you are researching ${categoryName.toLowerCase()} for business, study, gifting, or home use, this collection is meant to give you better context, more navigational depth, and a clearer path toward ordering electronics online in the UAE.`,
    ];
}
export const LANDING_PAGES = [
    {
        slug: "buy-iphone-uae",
        title: "Buy iPhone in UAE",
        metaTitle: "Buy iPhone UAE | Trusted Marketplace Deals | ExShopi",
        metaDescription: "Buy iPhone in UAE with cleaner product listings, verified seller signals, COD-ready checkout, and marketplace links to related Apple and mobile deals on ExShopi.",
        keywords: ["buy iPhone UAE", "cheap iPhone UAE", "iPhone Dubai", "Apple mobile UAE"],
        h1: "Buy iPhone in UAE with clearer marketplace listings",
        intro: "This landing page targets high-intent iPhone shoppers in the UAE who are comparing model year, storage, condition, and delivery trust before placing an order online.",
        sections: [
            {
                heading: "Why UAE iPhone buyers need clearer listings",
                body: [
                    "A good iPhone listing should tell you more than the model name. Buyers in Dubai and across the UAE usually want to compare storage, condition, battery expectations, accessories, and overall value without guessing what the seller meant. ExShopi is built to make those buying signals easier to read, with cleaner product metadata, more structured titles, and direct paths into category and product pages that search engines can index properly.",
                    "That matters for both usability and SEO. Search-driven shoppers looking for buy iPhone UAE, cheap iPhone UAE, or Apple phone Dubai often land on pages that are either too thin or too cluttered. This page is designed to guide them into the most relevant mobile listings while strengthening internal links back to product details, category pages, and broader marketplace discovery.",
                ],
            },
            {
                heading: "What to check before you order",
                body: [
                    "Model year, storage size, seller reputation, and delivery support all affect the real value of an iPhone listing. Buyers should also look for clean URLs, complete titles, and visible product images because those are often signs of a better maintained catalog. On ExShopi, the goal is to combine that buyer clarity with crawlable landing-page content that helps relevant iPhone pages surface more consistently in UAE search results.",
                ],
            },
        ],
        primaryCategorySlug: "electronics",
        primarySubcategorySlug: "mobiles",
    },
    {
        slug: "refurbished-laptops-uae",
        title: "Refurbished Laptops UAE",
        metaTitle: "Refurbished Laptops UAE | Compare Trusted Deals | ExShopi",
        metaDescription: "Shop refurbished laptops UAE with structured specifications, verified seller trust signals, and internal links to laptop and MacBook deals on ExShopi.",
        keywords: ["refurbished laptops UAE", "used laptops Dubai", "cheap laptop UAE", "renewed laptop UAE"],
        h1: "Refurbished laptops UAE buyers can compare with more confidence",
        intro: "This page supports shoppers who want budget-friendly laptop options in the UAE without sacrificing specification clarity or seller trust.",
        sections: [
            {
                heading: "A smarter entry point for laptop search traffic",
                body: [
                    "Refurbished laptop buyers are usually balancing price, reliability, and specification transparency at the same time. That is why this landing page focuses on the exact search intent behind refurbished laptops UAE, used laptops Dubai, and cheap laptop deals across the Emirates. It connects shoppers to cleaner category routes, structured product pages, and stronger marketplace trust signals so they can compare listings without losing context.",
                    "Search engines also benefit when this information is grouped logically. A dedicated landing page helps reinforce how laptop-related products connect to the wider ExShopi category structure, which improves crawl paths and supports broader indexing for product URLs, subcategory routes, and blog content that answers laptop buying questions.",
                ],
            },
            {
                heading: "What makes a refurbished laptop listing useful",
                body: [
                    "The best listings usually show processor generation, RAM, storage, display size, condition notes, and seller support up front. ExShopi uses those product details to create clearer user journeys, from landing page to category page to individual product page. That combination of relevance, context, and internal linking is important for both organic growth and conversion quality.",
                ],
            },
        ],
        primaryCategorySlug: "electronics",
        primarySubcategorySlug: "laptops",
    },
    {
        slug: "cheap-macbook-dubai",
        title: "Cheap MacBook Dubai",
        metaTitle: "Cheap MacBook Dubai | Refurbished Apple Laptops | ExShopi",
        metaDescription: "Find cheap MacBook Dubai deals with structured product details, cleaner Apple laptop pages, and marketplace trust signals built for UAE search intent.",
        keywords: ["cheap MacBook Dubai", "used MacBook Dubai", "refurbished MacBook UAE", "Apple laptop Dubai"],
        h1: "Cheap MacBook Dubai searches need better product clarity",
        intro: "MacBook shoppers in Dubai often compare older Intel models, refreshed business stock, and refurbished units, so the listing quality matters almost as much as the price.",
        sections: [
            {
                heading: "How this page supports MacBook search intent",
                body: [
                    "People searching for cheap MacBook Dubai are usually not looking for the cheapest number on the screen. They want dependable value, model-year clarity, and enough specification detail to know whether a listing fits school, business, or creative use. This landing page helps connect that search intent to ExShopi category routes, laptop pages, and Apple-relevant product details that are easier to index and easier to trust.",
                    "By giving search engines a dedicated destination for used MacBook Dubai and refurbished MacBook UAE queries, ExShopi gains a better opportunity to rank supporting category pages and individual product URLs. Stronger metadata, related internal links, and semantically relevant copy all help reinforce that structure.",
                ],
            },
            {
                heading: "How to compare budget MacBook listings",
                body: [
                    "Look for model year, processor family, RAM, storage, and charger or accessory notes before comparing prices. Those details tell you more about real value than the headline discount alone. ExShopi brings those buying cues together so shoppers can evaluate MacBook listings with more context and move into the relevant product pages with less friction.",
                ],
            },
        ],
        primaryCategorySlug: "electronics",
        primarySubcategorySlug: "laptops",
    },
    {
        slug: "electronics-online-uae",
        title: "Electronics Online UAE",
        metaTitle: "Electronics Online UAE | Trusted Marketplace | ExShopi",
        metaDescription: "Browse electronics online UAE with category links, structured product pages, COD-ready checkout signals, and verified marketplace trust on ExShopi.",
        keywords: ["electronics online UAE", "buy electronics UAE", "online electronics Dubai", "UAE marketplace electronics"],
        h1: "Electronics online UAE shoppers need indexable, trusted marketplace pages",
        intro: "This page acts as a broad organic entry point for high-volume UAE electronics terms while pushing visitors deeper into categories, products, and buyer guidance.",
        sections: [
            {
                heading: "A broad landing page for electronics discovery",
                body: [
                    "Many shoppers begin with broad searches such as electronics online UAE or buy electronics UAE before they narrow into phones, laptops, accessories, or Apple deals. This landing page helps capture that earlier-stage intent and direct it into better structured destination pages across ExShopi. The result is a stronger internal linking network for search engines and a more useful entry point for real buyers.",
                    "From an SEO perspective, broad electronics landing pages work best when they clearly connect to the main product architecture. That means linking homepage, categories, blog content, and live product routes in a way that supports crawling and reinforces topical relevance for UAE marketplace searches.",
                ],
            },
            {
                heading: "Trust signals that matter in UAE ecommerce",
                body: [
                    "Marketplace trust grows when buyers can see delivery expectations, seller context, product specifications, and payment flexibility before checkout. ExShopi supports those signals with COD-ready positioning, verified seller messaging, and route-level metadata that helps search engines understand the purpose of each page. This makes the browsing experience better for people and improves the chances of stable indexing for important commercial pages.",
                ],
            },
        ],
        primaryCategorySlug: "electronics",
    },
];
export function getLandingPageBySlug(slug) {
    return LANDING_PAGES.find((page) => page.slug === slug) || null;
}
export const UAE_TRUST_SIGNALS = [
    "UAE Trusted Marketplace",
    "Cash on Delivery available",
    "Fast UAE delivery support",
    "Verified sellers and structured listings",
];
