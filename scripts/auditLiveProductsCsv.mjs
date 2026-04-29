import fs from "fs";
import path from "path";

function parseCsv(text) {
  const rows = [];
  let i = 0;
  let field = "";
  let row = [];
  let inQuotes = false;
  while (i < text.length) {
    const ch = text[i];
    const next = text[i + 1];
    if (inQuotes) {
      if (ch === '"' && next === '"') {
        field += '"';
        i += 2;
        continue;
      }
      if (ch === '"') {
        inQuotes = false;
        i++;
        continue;
      }
      field += ch;
      i++;
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      i++;
      continue;
    }
    if (ch === ",") {
      row.push(field);
      field = "";
      i++;
      continue;
    }
    if (ch === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      i++;
      continue;
    }
    if (ch === "\r") {
      i++;
      continue;
    }
    field += ch;
    i++;
  }
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }
  const [header = [], ...body] = rows;
  return body.map((cols) =>
    Object.fromEntries(header.map((key, index) => [key, cols[index] ?? ""]))
  );
}

function csvEscape(value) {
  const stringValue = String(value ?? "");
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

function toCsv(rows, fields) {
  const lines = [fields.join(",")];
  for (const row of rows) {
    lines.push(fields.map((field) => csvEscape(row[field] ?? "")).join(","));
  }
  return `${lines.join("\n")}\n`;
}

function cleanText(value) {
  return String(value ?? "")
    .replace(/\u2013|\u2014/g, "-")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function titleCase(value) {
  return cleanText(value)
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function slugify(value) {
  return cleanText(value)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/\bcopy\b/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function truncate(value, max) {
  const text = cleanText(value);
  if (text.length <= max) return text;
  const trimmed = text.slice(0, max - 1).trim();
  const safe = trimmed.slice(0, Math.max(trimmed.lastIndexOf(" "), 24)).trim();
  return `${safe || trimmed}`.slice(0, max);
}

function findFirst(patterns, haystack) {
  for (const pattern of patterns) {
    const match = haystack.match(pattern);
    if (match?.[1]) return cleanText(match[1]);
  }
  return "";
}

function detectBrand(row) {
  const title = cleanText(row.title);
  return cleanText(row.brand) || title.split(" ")[0] || "";
}

function detectModel(row, brand) {
  if (cleanText(row.model)) return cleanText(row.model);
  const title = cleanText(row.title);
  const short = cleanText(row.shortDescription);
  const long = cleanText(row.longDescription);
  const combined = `${title} ${short} ${long}`;

  if (/airtag/i.test(title)) return "AirTag (2nd Generation)";
  if (/iPhone\s+15 Pro Max/i.test(title)) return "iPhone 15 Pro Max";
  if (/Galaxy S24\+/i.test(title)) return "Galaxy S24+";
  if (/Galaxy S23\+/i.test(title)) return "Galaxy S23+";
  if (/Galaxy S22\+/i.test(title)) return "Galaxy S22+";
  if (/Galaxy S21\+/i.test(title)) return "Galaxy S21+";
  if (/Galaxy S20\+/i.test(title)) return "Galaxy S20+";
  if (/Galaxy Note10\+/i.test(title)) return "Galaxy Note10+";
  if (/iPad Air M2/i.test(title)) return "iPad Air M2";
  if (/iPad Air M1/i.test(title)) return "iPad Air M1";
  if (/iPad Pro M2/i.test(title)) return "iPad Pro M2";
  if (/MacBook Air/i.test(title) || /MacBook Pro/i.test(title)) {
    const enclosure = findFirst([/(A\d{4})/i], title);
    const year = findFirst([/\((20\d{2})\)/, /(?:\b)(20\d{2})(?:\b)/], title);
    const family = /MacBook Air/i.test(title) ? "MacBook Air" : "MacBook Pro";
    return cleanText([family, enclosure, year && `(${year})`].filter(Boolean).join(" "));
  }
  const hpModel = findFirst([
    /\b(EliteBook\s+x360\s+1040\s+G5)\b/i,
    /\b(EliteBook\s+x360\s+1030\s+G2)\b/i,
    /\b(EliteBook\s+840\s+G[35678])\b/i,
    /\b(EliteBook\s+850\s+G[567])\b/i,
    /\b(EliteBook\s+745\s+G[56])\b/i,
    /\b(ProBook\s+650\s+G4)\b/i,
    /\b(ProBook\s+640\s+G4)\b/i,
    /\b(ProBook\s+455\s+G7)\b/i,
    /\b(ProBook\s+450\s+G[567])\b/i,
    /\b(ProBook\s+440\s+G[567])\b/i,
    /\b(ZBook\s+Fury\s+15\s+G7)\b/i,
    /\b(250\s+G[67])\b/i,
    /\b(255\s+G[78])\b/i,
  ], combined);
  if (hpModel) return hpModel.replace(/^HP\s+/i, "");
  const asusModel = findFirst([
    /\b(TUF Gaming F15 FX506H)\b/i,
    /\b(TUF Gaming A15 FA506NFR-HN004W)\b/i,
    /\b(ROG Strix G15 2020)\b/i,
  ], combined);
  if (asusModel) return asusModel.replace(/^ASUS\s+/i, "");
  const dellModel = findFirst([/\b(XPS 13 9360)\b/i], combined);
  if (dellModel) return dellModel.replace(/^Dell\s+/i, "");
  if (/Plain Black Cotton T-Shirt/i.test(title)) return "Plain Black Cotton T-Shirt";
  return cleanText(title.replace(new RegExp(`^${brand}\\s*`, "i"), ""));
}

function detectProcessor(row) {
  const titleText = `${row.title}`;
  const bodyText = `${row.description} ${row.longDescription}`;
  const exact = findFirst([
    /\b(Intel Core i[3579][- ]?\d{4,5}[A-Z]{0,2})\b/i,
    /\b(Core i[3579][- ]?\d{4,5}[A-Z]{0,2})\b/i,
    /\b(AMD Ryzen [3579](?: PRO)?[- ]?\d{4,5}[A-Z]{0,3})\b/i,
    /\b(Ryzen [3579][- ]?\d{4,5}[A-Z]{0,3})\b/i,
    /\b(Intel Core i[3579]\b(?:\s+\d+(?:st|nd|rd|th)\s+Gen)?)\b/i,
    /\b(Apple M[12])\b/i,
    /\b(A17 Pro)\b/i,
    /\b(Exynos \d+)\b/i,
    /\b(Snapdragon [\w+ ]+)\b/i,
    /\b(Athlon 3050U)\b/i,
    /\b(A6-9225)\b/i,
  ], titleText) || findFirst([
    /\b(Intel Core i[3579][- ]?\d{4,5}[A-Z]{0,2})\b/i,
    /\b(Core i[3579][- ]?\d{4,5}[A-Z]{0,2})\b/i,
    /\b(AMD Ryzen [3579](?: PRO)?[- ]?\d{4,5}[A-Z]{0,3})\b/i,
    /\b(Ryzen [3579][- ]?\d{4,5}[A-Z]{0,3})\b/i,
    /\b(Intel Core i[3579]\b(?:\s+\d+(?:st|nd|rd|th)\s+Gen)?)\b/i,
    /\b(Apple M[12])\b/i,
    /\b(A17 Pro)\b/i,
    /\b(Exynos \d+)\b/i,
    /\b(Snapdragon [\w+ ]+)\b/i,
    /\b(Athlon 3050U)\b/i,
    /\b(A6-9225)\b/i,
  ], bodyText);
  return exact.replace(/\bIntel\s+7th Gen i5 7200U\b/i, "Intel Core i5-7200U");
}

function detectRam(row) {
  return (
    findFirst([/\b(\d{1,3}GB)\s*(?:DDR\d\s*)?RAM\b/i, /\bRAM\s*(\d{1,3}GB)\b/i], `${row.title}`) ||
    findFirst([/\b(\d{1,3}GB)\s*(?:DDR\d\s*)?RAM\b/i, /\bRAM\s*(\d{1,3}GB)\b/i], `${row.description} ${row.longDescription}`)
  );
}

function detectStorage(row) {
  const patterns = [
    /\b(1TB)\b/i,
    /\b(512GB)\b/i,
    /\b(256GB)\b/i,
    /\b(128GB)\b/i,
    /\b(64GB)\b/i,
    /\b(500GB)\b/i,
  ];
  return findFirst(patterns, `${row.title}`) || findFirst(patterns, `${row.description} ${row.longDescription}`);
}

function detectScreenSize(row) {
  return findFirst([
    /\b(15\.6[- ]?inch|15\.6["”]|15\.6)\b/i,
    /\b(14[- ]?inch|14["”])\b/i,
    /\b(13\.3[- ]?inch|13\.3["”])\b/i,
    /\b(13[- ]?inch|13["”])\b/i,
    /\b(11[- ]?inch|11["”])\b/i,
    /\b(10\.9[- ]?inch|10\.9["”])\b/i,
    /\b(6\.7[- ]?inch|6\.7["”])\b/i,
  ], `${row.title} ${row.description} ${row.longDescription}`);
}

function normalizeScreenSize(value) {
  const v = cleanText(value).replace(/["”]/g, "-inch");
  if (!v) return "";
  if (/inch/i.test(v)) return v.replace(/\s+/g, " ");
  return `${v}-inch`;
}

function detectGraphics(row) {
  return findFirst([
    /\b(NVIDIA Quadro [A-Z]?\d{4})\b/i,
    /\b(GeForce RTX \d{4})\b/i,
    /\b(Intel Iris Plus Graphics \d+)\b/i,
    /\b(Intel HD Graphics \d+)\b/i,
    /\b(Radeon Vega \d+)\b/i,
    /\b(Apple \d-core GPU)\b/i,
  ], `${row.title} ${row.description} ${row.longDescription}`);
}

function detectColor(row) {
  const title = cleanText(row.title);
  const colors = [
    "Space Gray", "Space Grey", "Silver", "Blue", "Black Titanium", "Natural Titanium",
    "Phantom Gray", "Phantom White", "Phantom Black", "Cream", "Green", "Lavender",
    "Cosmic Black", "Aura Glow", "Gray", "Graphite Black", "Space Grey", "Black"
  ];
  for (const color of colors) {
    if (new RegExp(color.replace(/\s+/g, "\\s+"), "i").test(title)) return color;
  }
  return "";
}

function detectCondition(row) {
  const text = cleanText(`${row.title} ${row.description} ${row.sellerNotes}`);
  if (/refurbished/i.test(text)) return "Refurbished";
  if (/renewed/i.test(text)) return "Renewed";
  if (/used/i.test(text)) return "Used";
  return "";
}

function detectOs(row) {
  const text = `${row.title} ${row.description}`;
  return findFirst([
    /\b(Windows 11 Pro)\b/i,
    /\b(Windows 11 Home)\b/i,
    /\b(Windows 10 Pro)\b/i,
    /\b(Windows 10 Home)\b/i,
    /\b(Windows 11)\b/i,
    /\b(Windows 10)\b/i,
    /\b(macOS [A-Za-z]+)\b/i,
    /\b(macOS)\b/i,
    /\b(iOS)\b/i,
    /\b(Android)\b/i,
    /\b(DOS)\b/i,
  ], text);
}

function detectConnectivity(row) {
  const text = `${row.title} ${row.description} ${row.longDescription}`;
  const parts = [];
  for (const token of ["Wi-Fi 6", "Wi-Fi", "Bluetooth 5.0", "Bluetooth", "5G", "4G LTE", "Dual SIM", "eSIM", "USB-C", "Thunderbolt 3", "HDMI"]) {
    if (new RegExp(token.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&"), "i").test(text)) parts.push(token);
  }
  return Array.from(new Set(parts)).join(", ");
}

function detectCamera(row) {
  return findFirst([
    /\b(48MP [^.\n]+)\b/i,
    /\b(12MP Wide Rear Camera)\b/i,
    /\b(12MP Ultra-Wide Front Camera(?: with Center Stage)?)\b/i,
    /\b(HD Webcam)\b/i,
  ], `${row.description} ${row.longDescription}`);
}

function detectPorts(row) {
  const text = `${row.description} ${row.longDescription}`;
  const ports = [];
  for (const token of ["Thunderbolt 3 / USB-C", "USB-C", "HDMI", "Wi-Fi 6", "Bluetooth 5.0"]) {
    if (new RegExp(token.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&"), "i").test(text)) ports.push(token);
  }
  return ports.join(", ");
}

function detectCategorySet(row, brand) {
  const title = cleanText(row.title).toLowerCase();
  if (/t-shirt/i.test(title)) {
    return {
      parentCategory: "Fashion",
      category: "Men's Fashion",
      subcategory: "Men's Clothing",
      parentCategorySlug: "fashion",
      categorySlug: "mens-fashion",
      subcategorySlug: "mens-clothing",
    };
  }
  if (/airtag|cable|holder|stand/i.test(title)) {
    return {
      parentCategory: "Electronics",
      category: "Accessories",
      subcategory: /airtag/i.test(title) ? "Mobile Accessories" : "Accessories",
      parentCategorySlug: "electronics",
      categorySlug: "accessories",
      subcategorySlug: /airtag/i.test(title) ? "mobile-accessories" : "accessories",
    };
  }
  if (/iphone|galaxy|smartphone|note10\+/i.test(title)) {
    return {
      parentCategory: "Electronics",
      category: "Mobiles & Tablets",
      subcategory: "Smartphones",
      parentCategorySlug: "electronics",
      categorySlug: "mobiles-tablets",
      subcategorySlug: "smartphones",
    };
  }
  if (/ipad|tablet/i.test(title)) {
    return {
      parentCategory: "Electronics",
      category: "Mobiles & Tablets",
      subcategory: /ipad/i.test(title) ? "iPads" : "Tablets",
      parentCategorySlug: "electronics",
      categorySlug: "mobiles-tablets",
      subcategorySlug: /ipad/i.test(title) ? "ipads" : "tablets",
    };
  }
  if (/rog|tuf|gaming|rtx|geforce/i.test(title)) {
    return {
      parentCategory: "Electronics",
      category: "Laptops",
      subcategory: "Laptops",
      parentCategorySlug: "electronics",
      categorySlug: "laptops",
      subcategorySlug: "laptops",
    };
  }
  if (/macbook|elitebook|probook|zbook|xps|laptop|notebook/i.test(title)) {
    return {
      parentCategory: "Electronics",
      category: "Laptops",
      subcategory: "Laptops",
      parentCategorySlug: "electronics",
      categorySlug: "laptops",
      subcategorySlug: "laptops",
    };
  }
  return {
    parentCategory: cleanText(row.parentCategory) || "Electronics",
    category: cleanText(row.category) || "Electronics",
    subcategory: cleanText(row.subcategory) || cleanText(row.category) || "Electronics",
    parentCategorySlug: slugify(row.parentCategory || "electronics"),
    categorySlug: slugify(row.category || "electronics"),
    subcategorySlug: slugify(row.subcategory || row.category || "electronics"),
  };
}

function buildTitle(row, derived) {
  const brand = derived.brand;
  const model = derived.model;
  const parts = [];
  if (/iphone|ipad/i.test(model)) {
    parts.push(`${brand} ${model}`);
    if (derived.screenSize) parts.push(normalizeScreenSize(derived.screenSize));
    if (derived.storage) parts.push(derived.storage);
    if (derived.ram) parts.push(`${derived.ram} RAM`);
    if (derived.connectivity) parts.push(derived.connectivity.split(", ").filter((x) => /Wi-Fi|5G|Dual SIM|eSIM/.test(x)).join(", "));
    if (derived.color) parts.push(derived.color);
    if (/UAE/i.test(row.title)) parts.push("UAE Version");
    if (derived.condition) parts.push(`(${derived.condition})`);
    return cleanText(parts.filter(Boolean).join(" | ").replace(/\s+\|\s+\(/, " ("));
  }
  if (/macbook/i.test(model)) {
    return cleanText(
      `${brand} ${model}${derived.processor ? `, ${derived.processor}` : ""}${derived.ram ? `, ${derived.ram} RAM` : ""}${derived.storage ? `, ${derived.storage}` : ""}${derived.screenSize ? `, ${normalizeScreenSize(derived.screenSize)}` : ""}${derived.color ? `, ${derived.color}` : ""}${derived.condition ? ` (${derived.condition})` : ""}`
    );
  }
  if (/laptop|elitebook|probook|zbook|xps|tuf|rog/i.test(`${row.title} ${model}`.toLowerCase())) {
    return cleanText(
      `${brand} ${model}${derived.processor ? `, ${derived.processor}` : ""}${derived.ram ? `, ${derived.ram}` : ""}${derived.storage ? `, ${derived.storage}` : ""}${derived.screenSize ? `, ${normalizeScreenSize(derived.screenSize)}` : ""}${derived.os ? `, ${derived.os}` : ""}${derived.condition ? ` (${derived.condition} UAE)` : ""}`
    ).replace(/\((Renewed) UAE\)/, "($1 UAE)").replace(/\s+,/g, ",");
  }
  return cleanText(row.title);
}

function buildShortDescription(derived, row) {
  const bits = [
    `${derived.brand} ${derived.model}`.trim(),
    derived.processor,
    derived.ram ? `${derived.ram} RAM` : "",
    derived.storage,
    derived.screenSize ? normalizeScreenSize(derived.screenSize) : "",
  ].filter(Boolean);
  const first = bits.join(", ");
  const conditionLabel = derived.condition ? `${derived.condition.toLowerCase()} ` : "";
  const tail = /laptop|macbook|elitebook|probook|zbook|xps|tuf|rog/i.test(row.title)
    ? `${conditionLabel}laptop professionally tested by ExShopi for work, study, and everyday performance in the UAE and Saudi Arabia.`
    : /iphone|galaxy|smartphone/i.test(row.title)
    ? `${conditionLabel}smartphone professionally tested by ExShopi with strong daily performance and trusted GCC delivery support.`
    : /ipad|tablet/i.test(row.title)
    ? `${conditionLabel}tablet professionally tested by ExShopi for study, entertainment, and productivity in the UAE and Saudi Arabia.`
    : `${conditionLabel}product professionally checked by ExShopi before dispatch.`;
  return truncate(`${first}. ${tail}`, 320);
}

function buildLongDescription(derived, row) {
  const lines = [];
  const introType = /iphone|galaxy|smartphone/i.test(row.title)
    ? "smartphone"
    : /ipad|tablet/i.test(row.title)
    ? "tablet"
    : /airtag|cable|holder|stand|t-shirt/i.test(row.title)
    ? "product"
    : "laptop";
  lines.push(`${derived.brand} ${derived.model} is a premium ${derived.condition ? `${derived.condition.toLowerCase()} ` : ""}${introType} prepared for ExShopi customers in the UAE, Saudi Arabia, and across the GCC.`);
  const specBits = [
    derived.processor && `Processor: ${derived.processor}`,
    derived.ram && `RAM: ${derived.ram}`,
    derived.storage && `Storage: ${derived.storage}`,
    derived.screenSize && `Display: ${normalizeScreenSize(derived.screenSize)}`,
    derived.graphics && `Graphics: ${derived.graphics}`,
    derived.os && `Operating System: ${derived.os}`,
    derived.connectivity && `Connectivity: ${derived.connectivity}`,
    derived.camera && `Camera: ${derived.camera}`,
    derived.ports && `Ports: ${derived.ports}`,
    derived.color && `Color: ${derived.color}`,
  ].filter(Boolean);
  if (specBits.length) {
    lines.push(`Key specifications include ${specBits.join("; ")}.`);
  }
  lines.push("Each unit is cleaned, tested, and verified before dispatch. Cosmetic signs of previous use may be visible on refurbished or renewed products, but they do not affect normal performance.");
  lines.push("This listing is designed for buyers who want a clearer product page, trustworthy condition notes, and fast delivery support without changing the existing ExShopi price or stock position.");
  return truncate(lines.join(" "), 1800);
}

function buildSeoTitle(derived, row) {
  const core = `${derived.brand} ${derived.model}`.trim();
  const extras = [derived.processor, derived.ram, derived.storage].filter(Boolean).join(" ");
  return truncate(`${core} ${extras} UAE | ExShopi`, 60);
}

function buildSeoDescription(derived, row) {
  const kind = /iphone|galaxy|smartphone/i.test(row.title)
    ? "smartphone"
    : /ipad|tablet/i.test(row.title)
    ? "tablet"
    : /t-shirt/i.test(row.title)
    ? "fashion essential"
    : "laptop";
  return truncate(
    `Buy ${derived.brand} ${derived.model} in UAE and Saudi Arabia. ${derived.processor ? `${derived.processor}, ` : ""}${derived.ram ? `${derived.ram} RAM, ` : ""}${derived.storage ? `${derived.storage}, ` : ""}${derived.condition ? `${derived.condition.toLowerCase()} ` : ""}${kind} with warranty and fast delivery.`,
    160
  );
}

function buildSearchTags(derived, row) {
  const tags = [
    "UAE",
    "Saudi",
    "GCC",
    derived.brand,
    derived.model,
    derived.processor,
    derived.ram,
    derived.storage,
    /macbook|laptop|elitebook|probook|zbook|xps|tuf|rog/i.test(row.title) ? "used laptop" : "",
    /refurbished|renewed/i.test(row.title) ? "refurbished" : "",
    /iphone|galaxy|smartphone/i.test(row.title) ? "smartphone" : "",
    /ipad|tablet/i.test(row.title) ? "tablet" : "",
  ].map(cleanText).filter(Boolean);
  return Array.from(new Set(tags)).join(", ");
}

function buildSellerNote(derived, row) {
  if (/refurbished|renewed|used/i.test(`${row.title} ${row.description}`)) {
    return "Professionally tested, cleaned, and quality checked by ExShopi. Battery, keyboard, ports, display, speakers, camera, and connectivity are verified before dispatch. Includes warranty support and condition grading based on overall cosmetic and functional inspection.";
  }
  return "Verified by ExShopi before dispatch with warranty support, functional testing, and marketplace quality checks.";
}

function buildBuyerNote(derived, row) {
  return "Please review the full specification and condition details before checkout. Accessories may vary by listing, and refurbished or renewed items can show minor cosmetic wear without affecting performance.";
}

function buildReviewFlags(row, derived) {
  const flags = [];
  const text = `${row.title} ${row.description} ${row.longDescription}`;
  if (/x360 1040 G5/i.test(row.title) && /1030 G2/i.test(text)) flags.push("Description references HP EliteBook x360 1030 G2 while title says 1040 G5.");
  if (/14[”\"]/.test(row.title) && /13\.3[- ]inch/i.test(text)) flags.push("Display size conflict between title and description.");
  if (/i97/i.test(text)) flags.push("Processor typo detected in description.");
  if (/1TB/i.test(row.title) && /\b256GB\b/i.test(text)) flags.push("Storage conflict between title and description.");
  if (/MacBook Air A1466 \(2017\)/i.test(row.title) && !/2017/i.test(derived.model)) flags.push("MacBook generation needs manual confirmation.");
  if (/Plain Black Cotton T-Shirt/i.test(row.title)) flags.push("Fashion item is outside the main electronics pattern and should be reviewed manually.");
  return flags;
}

const inputPath = process.argv[2] || "/Users/albareds/Downloads/exshopi-live-products-2026-04-29.csv";
const outputCsv = path.resolve("backend/data/exshopi-live-products-audited-2026-04-29.csv");
const outputJson = path.resolve("backend/data/exshopi-live-products-audited-2026-04-29.json");

const source = fs.readFileSync(inputPath, "utf8");
const rows = parseCsv(source);

const auditedRows = rows.map((row) => {
  const brand = detectBrand(row);
  const model = detectModel(row, brand);
  const processor = detectProcessor(row);
  const ram = detectRam(row);
  const storage = detectStorage(row);
  const screenSize = normalizeScreenSize(detectScreenSize(row));
  const graphics = detectGraphics(row);
  const color = detectColor(row);
  const condition = detectCondition(row);
  const operatingSystem = detectOs(row);
  const connectivity = detectConnectivity(row);
  const camera = detectCamera(row);
  const ports = detectPorts(row);
  const categorySet = detectCategorySet(row, brand);
  const derived = { brand, model, processor, ram, storage, screenSize, graphics, color, condition, os: operatingSystem, operatingSystem, connectivity, camera, ports };
  const improvedTitle = buildTitle(row, derived);
  const shortDescription = buildShortDescription(derived, row);
  const longDescription = buildLongDescription(derived, row);
  const seoTitle = buildSeoTitle(derived, row);
  const seoDescription = buildSeoDescription(derived, row);
  const sellerNote = buildSellerNote(derived, row);
  const buyerNote = buildBuyerNote(derived, row);
  const searchTags = buildSearchTags(derived, row);
  const flags = buildReviewFlags(row, derived);
  const auditStatus = flags.length ? "manual_review" : "auto_improved";
  return {
    ...row,
    title: improvedTitle,
    brand,
    model,
    parentCategory: categorySet.parentCategory,
    category: categorySet.category,
    subcategory: categorySet.subcategory,
    parentCategorySlug: categorySet.parentCategorySlug,
    categorySlug: categorySet.categorySlug,
    subcategorySlug: categorySet.subcategorySlug,
    metaTitle: seoTitle,
    metaDescription: seoDescription,
    slug: slugify(row.slug || improvedTitle),
    shortDescription,
    longDescription,
    description: longDescription,
    sellerNotes: sellerNote,
    buyerNotes: buyerNote,
    searchTags,
    specBrand: brand,
    specModel: model,
    specProcessor: processor,
    specRam: ram,
    specStorage: storage,
    specScreenSize: screenSize,
    specGraphics: graphics,
    specOperatingSystem: operatingSystem,
    specColor: color,
    specCondition: condition,
    specConnectivity: connectivity,
    specCamera: camera,
    specPorts: ports,
    manualReviewReason: flags.join(" | "),
    auditStatus,
  };
});

const fields = [
  ...Object.keys(rows[0] || {}),
  "parentCategorySlug",
  "categorySlug",
  "subcategorySlug",
  "searchTags",
  "specBrand",
  "specModel",
  "specProcessor",
  "specRam",
  "specStorage",
  "specScreenSize",
  "specGraphics",
  "specOperatingSystem",
  "specColor",
  "specCondition",
  "specConnectivity",
  "specCamera",
  "specPorts",
  "manualReviewReason",
  "auditStatus",
];

fs.mkdirSync(path.dirname(outputCsv), { recursive: true });
fs.writeFileSync(outputCsv, toCsv(auditedRows, fields));
fs.writeFileSync(
  outputJson,
  JSON.stringify(
    {
      checkedAt: new Date().toISOString(),
      totalChecked: auditedRows.length,
      autoImproved: auditedRows.filter((row) => row.auditStatus === "auto_improved").length,
      manualReview: auditedRows.filter((row) => row.auditStatus === "manual_review").length,
      rows: auditedRows,
    },
    null,
    2
  )
);

const missingFixed = auditedRows.reduce((sum, row, index) => {
  const original = rows[index];
  const keys = ["model", "metaTitle", "metaDescription", "shortDescription", "longDescription", "sellerNotes", "buyerNotes", "category", "subcategory"];
  return (
    sum +
    keys.filter((key) => !cleanText(original[key]) && cleanText(row[key])).length
  );
}, 0);

const summary = {
  totalChecked: auditedRows.length,
  totalUpdated: auditedRows.filter((row, index) => JSON.stringify(row) !== JSON.stringify(rows[index])).length,
  missingDataFixed: missingFixed,
  manualReviewCount: auditedRows.filter((row) => row.auditStatus === "manual_review").length,
};

console.log(JSON.stringify(summary, null, 2));
