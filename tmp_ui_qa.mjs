
import { chromium } from 'playwright';

const appBase = 'http://localhost:5179';
const apiBase = 'http://localhost:3101/api';
const adminPassword = 'VhPtE423q9zmQNxajBD7-iZl';
const stamp = Date.now();
const sellerEmail = `ui.seller.${stamp}@example.com`;
const sellerPassword = 'StrongPass123!';
const customerEmail = `ui.customer.${stamp}@example.com`;
const customerPassword = 'StrongPass123!';

async function api(path, { method='GET', body, token } = {}) {
  const headers = {};
  if (body) headers['Content-Type'] = 'application/json';
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${apiBase}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status} ${text}`);
  return json;
}

const admin = await api('/auth/login', { method:'POST', body:{ email:'ahsansajid295@gmail.com', password:adminPassword }});
const sellerReg = await api('/auth/register', { method:'POST', body:{ name:'UI Seller', email:sellerEmail, password:sellerPassword, role:'seller', phone:'+971500009999' }});
const sellerToken = sellerReg.accessToken;
const application = await api('/seller-applications', {
  method:'POST',
  token:sellerToken,
  body:{
    businessName:'UI Seller LLC', ownerName:'UI Seller', email:sellerEmail, phone:'+971500009999', businessType:'llc',
    country:'UAE', city:'Dubai', warehouseAddress:'Marina', vatTrn:'TRNUI', documents:[], logo:'/logo.png', banner:'/hero/hero-1.png', about:'UI Seller', policies:{}, bankDetails:{ iban:'AE070331234567890123456' }
  }
});
await api(`/admin/seller-applications/${application.id}/approve`, { method:'POST', token:admin.accessToken, body:{ notes:'ui qa approve' }});
await api('/auth/register', { method:'POST', body:{ name:'UI Customer', email:customerEmail, password:customerPassword, role:'customer', phone:'+971500008888' }});

const browser = await chromium.launch({ headless: true });
const results = [];
const consoleMessages = [];

async function withPage(name, fn) {
  console.log('START', name);
  const page = await browser.newPage();
  page.on('console', msg => {
    if (msg.type() === 'error') consoleMessages.push(`${name}: ${msg.text()}`);
  });
  page.on('pageerror', err => consoleMessages.push(`${name}: pageerror ${err.message}`));
  try {
    await fn(page);
    console.log('PASS', name);
    results.push({ name, status: 'PASS' });
  } catch (error) {
    console.log('FAIL', name, String(error));
    results.push({ name, status: 'FAIL', error: String(error) });
  } finally {
    await page.close();
  }
}

await withPage('admin_login_and_modules', async (page) => {
  await page.goto(`${appBase}/admin/login`, { waitUntil: 'networkidle' });
  await page.fill('input[placeholder="admin@example.com"]', 'ahsansajid295@gmail.com');
  await page.fill('input[placeholder="••••••••"]', adminPassword);
  await page.click('button:has-text("Grant Admin Access")');
  await page.waitForURL('**/admin/dashboard', { timeout: 15000 });
  await page.waitForSelector('text=Admin Dashboard', { timeout: 15000 });
  await page.goto(`${appBase}/admin/orders`, { waitUntil: 'networkidle' });
  await page.waitForSelector('text=Order Monitoring', { timeout: 15000 });
  await page.goto(`${appBase}/admin/customers`, { waitUntil: 'networkidle' });
  await page.waitForSelector('text=Customer Intelligence', { timeout: 15000 });
  await page.goto(`${appBase}/admin/support`, { waitUntil: 'networkidle' });
  await page.waitForSelector('text=Support Operations', { timeout: 15000 });
});

await withPage('seller_login_and_modules', async (page) => {
  await page.goto(`${appBase}/seller/login`, { waitUntil: 'networkidle' });
  await page.fill('input[placeholder="seller@example.com"]', sellerEmail);
  await page.fill('input[placeholder="••••••••"]', sellerPassword);
  await page.click('button:has-text("Sign In to Dashboard")');
  await page.waitForURL('**/seller/dashboard', { timeout: 15000 });
  await page.waitForSelector('text=Welcome', { timeout: 15000 });
  await page.goto(`${appBase}/seller/products`, { waitUntil: 'networkidle' });
  await page.waitForSelector('text=Catalog Management', { timeout: 15000 });
  await page.goto(`${appBase}/seller/orders`, { waitUntil: 'networkidle' });
  await page.waitForSelector('text=Fulfillment Center', { timeout: 15000 });
  await page.goto(`${appBase}/seller/support`, { waitUntil: 'networkidle' });
  await page.waitForSelector('text=Seller Support', { timeout: 15000 });
});

await withPage('customer_storefront_pages', async (page) => {
  await page.goto(`${appBase}/`, { waitUntil: 'networkidle' });
  await page.waitForSelector('text=ExShopi', { timeout: 15000 });
  await page.goto(`${appBase}/products`, { waitUntil: 'networkidle' });
  await page.waitForSelector('body', { timeout: 15000 });
  await page.goto(`${appBase}/cart`, { waitUntil: 'networkidle' });
  await page.waitForSelector('text=Your Cart', { timeout: 15000 });
});

await withPage('customer_auth_modal', async (page) => {
  await page.goto(`${appBase}/`, { waitUntil: 'networkidle' });
  await page.click('button:has-text("Sign In")');
  await page.click('text=Sign In');
  await page.waitForSelector('text=Welcome back', { timeout: 10000 });
  await page.fill('input[placeholder="you@example.com"]', customerEmail);
  await page.fill('input[placeholder="••••••••"]', customerPassword);
  await page.click('button:has-text("Sign In")');
  await page.waitForTimeout(2500);
  const storage = await page.evaluate(() => localStorage.getItem('auth-storage'));
  if (!storage) {
    throw new Error('Customer auth modal did not persist a session');
  }
});

console.log(JSON.stringify({ results, consoleMessages }, null, 2));
await browser.close();
