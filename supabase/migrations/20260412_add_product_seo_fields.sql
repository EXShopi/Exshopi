alter table public.products
  add column if not exists slug text,
  add column if not exists meta_title text,
  add column if not exists meta_description text,
  add column if not exists meta_keywords text,
  add column if not exists canonical_url text,
  add column if not exists og_title text,
  add column if not exists og_description text,
  add column if not exists og_image text;

update public.products
set slug = lower(
  regexp_replace(
    regexp_replace(coalesce(slug, title, 'product'), '[^a-zA-Z0-9]+', '-', 'g'),
    '(^-+|-+$)',
    '',
    'g'
  )
)
where slug is null or btrim(slug) = '';

create unique index if not exists idx_products_slug_unique
  on public.products (slug)
  where slug is not null;

create index if not exists idx_products_slug
  on public.products (slug);
