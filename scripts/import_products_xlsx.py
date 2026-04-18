#!/usr/bin/env python3
import json
import re
import sys
import time
from copy import deepcopy
from pathlib import Path
from typing import Dict, List, Tuple
from xml.etree import ElementTree as ET
from zipfile import ZipFile


NS = {"a": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}


def safe_text(value) -> str:
    if value is None:
        return ""
    return str(value).strip()


def slugify(value: str) -> str:
    text = safe_text(value).lower()
    text = text.replace("&", " and ")
    text = re.sub(r"[^a-z0-9]+", "-", text)
    return text.strip("-")


def normalize_key(value: str) -> str:
    return safe_text(value).strip().lower()


def parse_number(value: str, default: float = 0) -> float:
    raw = safe_text(value)
    if not raw:
        return default
    cleaned = re.sub(r"[^0-9.\-]", "", raw)
    if not cleaned:
        return default
    try:
        return float(cleaned)
    except ValueError:
        return default


def parse_int(value: str, default: int = 0) -> int:
    return int(round(parse_number(value, default)))


def split_tags(value: str) -> List[str]:
    seen = set()
    tags: List[str] = []
    for chunk in re.split(r"[,|/]+", safe_text(value)):
        tag = chunk.strip()
        normalized = tag.lower()
        if not tag or normalized in seen:
            continue
        seen.add(normalized)
        tags.append(tag)
    return tags


def column_letters(index: int) -> str:
    letters = ""
    current = index
    while current:
        current, rem = divmod(current - 1, 26)
        letters = chr(65 + rem) + letters
    return letters


def parse_cell(cell, shared_strings: List[str]) -> str:
    cell_type = cell.attrib.get("t")

    if cell_type == "inlineStr":
        return "".join(node.text or "" for node in cell.iterfind(".//a:t", NS))

    value_node = cell.find("a:v", NS)
    if value_node is None:
        return ""

    value = value_node.text or ""
    if cell_type == "s":
        return shared_strings[int(value)] if value else ""
    return value


def parse_xlsx_rows(path: Path) -> List[Dict[str, str]]:
    with ZipFile(path) as workbook:
        shared_strings: List[str] = []
        if "xl/sharedStrings.xml" in workbook.namelist():
            root = ET.fromstring(workbook.read("xl/sharedStrings.xml"))
            for string_item in root.findall("a:si", NS):
                shared_strings.append(
                    "".join(node.text or "" for node in string_item.iterfind(".//a:t", NS))
                )

        sheet = ET.fromstring(workbook.read("xl/worksheets/sheet1.xml"))
        rows = sheet.find("a:sheetData", NS).findall("a:row", NS)
        if not rows:
            return []

        headers = [parse_cell(cell, shared_strings) for cell in rows[0].findall("a:c", NS)]
        results: List[Dict[str, str]] = []

        for row in rows[1:]:
            raw_by_column: Dict[str, str] = {}
            for cell in row.findall("a:c", NS):
                ref = cell.attrib.get("r", "")
                letters = "".join(ch for ch in ref if ch.isalpha())
                raw_by_column[letters] = parse_cell(cell, shared_strings)

            record: Dict[str, str] = {}
            for index, header in enumerate(headers, start=1):
                record[header] = raw_by_column.get(column_letters(index), "")
            results.append(record)

        return results


def map_category_fields(row: Dict[str, str]) -> Tuple[str, str, str, str, str, str]:
    parent_slug = "electronics"
    parent_name = "Electronics"
    category_id = "cat1"

    raw_subcategory = normalize_key(row.get("subcategory") or row.get("category"))

    if raw_subcategory in {"laptop", "laptops", "notebook", "notebooks"}:
        return category_id, parent_slug, "laptops", "", parent_name, "Laptops"

    if raw_subcategory in {"phone", "phones", "mobile", "mobiles", "smartphone", "smartphones"}:
        return category_id, parent_slug, "mobiles-tablets", "smartphones", parent_name, "Smartphones"

    if raw_subcategory in {"tablet", "tablets", "ipad", "ipads"}:
        return category_id, parent_slug, "mobiles-tablets", "tablets", parent_name, "Tablets"

    if raw_subcategory in {"accessory", "accessories", "mobile-accessories"}:
        return category_id, parent_slug, "mobiles-tablets", "mobile-accessories", parent_name, "Mobile Accessories"

    fallback_slug = slugify(raw_subcategory or "laptops") or "laptops"
    fallback_name = safe_text(row.get("subcategory")) or safe_text(row.get("category")) or "Laptops"
    return category_id, parent_slug, fallback_slug, "", parent_name, fallback_name


def build_canonical_url(parent_slug: str, category_slug: str, subcategory_slug: str, slug: str, source: str) -> str:
    if safe_text(source):
        return safe_text(source)

    parts = [parent_slug]
    if category_slug:
        parts.append(category_slug)
    if subcategory_slug:
        parts.append(subcategory_slug)
    parts.append(slug)
    return "https://exshopi.com/" + "/".join(parts)


def build_description(short_description: str, long_description: str) -> str:
    parts = [safe_text(short_description), safe_text(long_description)]
    return "\n\n".join([part for part in parts if part])


def make_specification_values(row: Dict[str, str], category_name: str, subcategory_name: str) -> Dict[str, str]:
    return {
        "brand": safe_text(row.get("brand")),
        "series": safe_text(row.get("series")),
        "model": safe_text(row.get("model")),
        "category": category_name,
        "subcategory": subcategory_name,
        "condition": safe_text(row.get("condition")),
        "processorBrand": safe_text(row.get("processor_brand")),
        "processorModel": safe_text(row.get("processor_model")),
        "generation": safe_text(row.get("generation")),
        "ram": safe_text(row.get("ram")),
        "ramType": safe_text(row.get("ram_type")),
        "storage": safe_text(row.get("storage")),
        "storageType": safe_text(row.get("storage_type")),
        "graphics": safe_text(row.get("graphics")),
        "graphicsType": safe_text(row.get("graphics_type")),
        "screenSize": safe_text(row.get("screen_size")),
        "resolution": safe_text(row.get("resolution")),
        "displayType": safe_text(row.get("display_type")),
        "keyboard": safe_text(row.get("keyboard")),
        "color": safe_text(row.get("color")),
        "operatingSystem": safe_text(row.get("operating_system")),
        "weight": safe_text(row.get("weight")),
        "ports": safe_text(row.get("ports")),
        "battery": safe_text(row.get("battery")),
        "warranty": safe_text(row.get("warranty")),
    }


def compact_specifications(values: Dict[str, str]) -> Dict[str, str]:
    labels = {
        "processorBrand": "Processor Brand",
        "processorModel": "Processor Model",
        "generation": "Generation",
        "ram": "RAM",
        "ramType": "RAM Type",
        "storage": "Storage",
        "storageType": "Storage Type",
        "graphics": "Graphics",
        "graphicsType": "Graphics Type",
        "screenSize": "Screen Size",
        "resolution": "Resolution",
        "displayType": "Display Type",
        "keyboard": "Keyboard",
        "color": "Color",
        "operatingSystem": "Operating System",
        "weight": "Weight",
        "ports": "Ports",
        "battery": "Battery",
        "condition": "Condition",
        "series": "Series",
        "model": "Model",
        "warranty": "Warranty",
    }
    result: Dict[str, str] = {}
    for key, label in labels.items():
        value = safe_text(values.get(key))
        if value:
            result[label] = value
    return result


def ensure_unique_slug(base_slug: str, existing_slugs: set) -> str:
    candidate = base_slug or f"product-{int(time.time())}"
    if candidate not in existing_slugs:
        return candidate

    suffix = 2
    while f"{candidate}-{suffix}" in existing_slugs:
        suffix += 1
    return f"{candidate}-{suffix}"


def build_product(row: Dict[str, str], existing_slugs: set, timestamp_seed: int, index: int) -> Dict[str, object]:
    category_id, parent_slug, category_slug, subcategory_slug, parent_name, leaf_name = map_category_fields(row)
    title = safe_text(row.get("title"))
    base_slug = slugify(row.get("slug") or title)
    slug = ensure_unique_slug(base_slug, existing_slugs)
    canonical_url = build_canonical_url(
        parent_slug,
        category_slug,
        subcategory_slug,
        slug,
        row.get("canonical_url", ""),
    )

    stock = max(parse_int(row.get("stock"), 0), 0)
    price = round(parse_number(row.get("price_aed"), 0), 2)
    brand = safe_text(row.get("brand"))
    model = safe_text(row.get("model"))
    short_description = safe_text(row.get("short_description"))
    long_description = safe_text(row.get("long_description"))
    description = build_description(short_description, long_description)
    tags = split_tags(row.get("search_tags", ""))

    specification_values = make_specification_values(row, parent_name, leaf_name)
    structured_specifications = compact_specifications(specification_values)

    effective_category_name = "Mobiles & Tablets" if category_slug == "mobiles-tablets" else leaf_name
    effective_subcategory_name = leaf_name if subcategory_slug else ""

    return {
        "id": f"prod_import_xlsx_{timestamp_seed}_{index}",
        "sellerId": "exshopi_official",
        "storeId": "exshopi_official",
        "categoryId": category_id,
        "title": title,
        "slug": slug,
        "description": description,
        "price": price,
        "originalPrice": price,
        "salePrice": price,
        "image": "",
        "images": [],
        "stock": stock,
        "rating": 0,
        "reviews": 0,
        "sku": f"EX-DRAFT-{slug.upper().replace('-', '-')}",
        "brand": brand,
        "metaTitle": safe_text(row.get("seo_title")) or title,
        "metaDescription": safe_text(row.get("seo_description")) or short_description or long_description[:160],
        "canonicalUrl": canonical_url,
        "status": "draft",
        "approvalStatus": "pending",
        "productStatus": "draft",
        "visibilityStatus": "hidden",
        "visibility": False,
        "ownership": "official",
        "createdByRole": "admin",
        "approvalNotes": "",
        "rejectionReason": "",
        "approvalRequestedAt": "",
        "approvedAt": "",
        "rejectedAt": "",
        "views": 0,
        "wishlistCount": 0,
        "badges": [],
        "createdAt": time.strftime("%Y-%m-%dT%H:%M:%S.000Z", time.gmtime()),
        "updatedAt": time.strftime("%Y-%m-%dT%H:%M:%S.000Z", time.gmtime()),
        "specs": {
            "templateId": subcategory_slug or category_slug,
            "templateName": effective_subcategory_name or effective_category_name,
            "categoryTemplateKey": subcategory_slug or category_slug,
            "shortDescription": short_description,
            "longDescription": long_description,
            "specificationValues": specification_values,
            "specifications": structured_specifications,
            "specificationGroups": [
                {
                    "id": "core-specs",
                    "title": "Specifications",
                    "items": [{"label": key, "value": value} for key, value in structured_specifications.items()],
                }
            ],
            "additionalSpecificationGroups": [],
            "attributes": {
                "brand": brand,
                "model": model,
                "subcategory": subcategory_slug or category_slug,
                **structured_specifications,
            },
            "variants": [],
            "defaultVariantId": None,
            "briefHighlights": [item for item in [brand, model, safe_text(row.get("processor_model")), safe_text(row.get("ram")), safe_text(row.get("storage"))] if item][:4],
            "keyFeatures": [item for item in [brand, model, safe_text(row.get("processor_model")), safe_text(row.get("ram")), safe_text(row.get("storage"))] if item][:4],
            "whatsInTheBox": [],
            "searchTags": tags,
            "variantAttributes": [],
            "metaTitle": safe_text(row.get("seo_title")) or title,
            "metaDescription": safe_text(row.get("seo_description")) or short_description or long_description[:160],
            "metaKeywords": ", ".join(tags),
            "canonicalUrl": canonical_url,
            "ogTitle": safe_text(row.get("seo_title")) or title,
            "ogDescription": safe_text(row.get("seo_description")) or short_description or long_description[:160],
            "ogImage": "",
            "shippingWeight": safe_text(row.get("weight")),
            "packageSize": safe_text(row.get("screen_size")),
            "returnPolicy": "",
            "warrantyPolicy": safe_text(row.get("warranty")),
            "sellerNotes": "Imported from ExShopi product spreadsheet in draft mode. Images intentionally left empty for manual admin upload.",
            "listingCompleteness": 72,
            "seoScore": 78,
            "parentCategorySlug": parent_slug,
            "categorySlug": category_slug,
            "subcategorySlug": subcategory_slug,
            "parentCategoryName": parent_name,
            "categoryName": effective_category_name,
            "subcategoryName": effective_subcategory_name,
            "categoryPath": "/".join([part for part in [parent_slug, category_slug, subcategory_slug] if part]),
            "approvalStatus": "pending",
            "productStatus": "draft",
            "visibilityStatus": "hidden",
            "ownership": "official",
            "createdByRole": "admin",
            "badges": [],
            "model": model,
            "series": safe_text(row.get("series")),
            "importMeta": {
                "source": "xlsx",
                "sourceFile": "exshopi_full_350_products_with_specs.xlsx",
                "importedAt": time.strftime("%Y-%m-%dT%H:%M:%S.000Z", time.gmtime()),
            },
        },
    }


def main() -> int:
    source_path = (
        Path(sys.argv[1]).expanduser()
        if len(sys.argv) > 1
        else Path.home() / "Downloads" / "exshopi_full_350_products_with_specs.xlsx"
    )
    db_path = Path("backend/db.json")

    if not source_path.exists():
        print(f"Source spreadsheet not found: {source_path}", file=sys.stderr)
        return 2

    if not db_path.exists():
        print(f"Database file not found: {db_path}", file=sys.stderr)
        return 3

    rows = parse_xlsx_rows(source_path)
    if not rows:
        print("No rows found in spreadsheet.", file=sys.stderr)
        return 4

    db = json.loads(db_path.read_text())
    if not isinstance(db.get("products"), list):
        db["products"] = []
    if not isinstance(db.get("sellers"), list):
        db["sellers"] = []

    existing_slugs = set()
    existing_titles = set()
    for product in db["products"]:
        existing_slug = slugify(product.get("slug") or "")
        existing_title = safe_text(product.get("title")).lower()
        if existing_slug:
            existing_slugs.add(existing_slug)
        if existing_title:
            existing_titles.add(existing_title)

    imported_products: List[Dict[str, object]] = []
    skipped_duplicates: List[str] = []
    skipped_missing_titles = 0
    timestamp_seed = int(time.time() * 1000)
    seen_input_signatures = set()

    for index, row in enumerate(rows, start=1):
        normalized_row = {normalize_key(key): safe_text(value) for key, value in row.items()}
        title = safe_text(normalized_row.get("title"))
        if not title:
            skipped_missing_titles += 1
            continue

        requested_slug = slugify(normalized_row.get("slug") or title)
        duplicate_signature = (requested_slug, title.lower())
        if requested_slug in existing_slugs or title.lower() in existing_titles or duplicate_signature in seen_input_signatures:
            skipped_duplicates.append(title)
            continue

        product = build_product(normalized_row, existing_slugs, timestamp_seed, index)
        imported_products.append(product)
        existing_slugs.add(slugify(product["slug"]))
        existing_titles.add(title.lower())
        seen_input_signatures.add(duplicate_signature)

    if not imported_products:
        print(
            json.dumps(
                {
                    "imported": 0,
                    "skippedDuplicates": len(skipped_duplicates),
                    "skippedMissingTitles": skipped_missing_titles,
                    "message": "No new products were imported.",
                },
                indent=2,
            )
        )
        return 0

    backup_path = db_path.with_name(f"{db_path.name}.pre-import-xlsx-{timestamp_seed}.bak")
    backup_path.write_text(json.dumps(db, indent=2))

    next_db = deepcopy(db)
    next_db["products"].extend(imported_products)

    for seller in next_db["sellers"]:
        if seller.get("id") == "exshopi_official":
            seller["totalProducts"] = int(seller.get("totalProducts") or 0) + len(imported_products)
            seller["updatedAt"] = time.strftime("%Y-%m-%dT%H:%M:%S.000Z", time.gmtime())
            break

    db_path.write_text(json.dumps(next_db, indent=2))

    print(
        json.dumps(
            {
                "imported": len(imported_products),
                "skippedDuplicates": len(skipped_duplicates),
                "skippedMissingTitles": skipped_missing_titles,
                "backup": str(backup_path),
                "database": str(db_path),
                "sampleImportedSlugs": [product["slug"] for product in imported_products[:5]],
            },
            indent=2,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
