(async () => {
  const wait = (ms) => new Promise((res) => setTimeout(res, ms));
  async function getJson(url, opts) {
    try {
      const r = await fetch(url, opts);
      return await r.json();
    } catch (e) {
      return null;
    }
  }

  let publicJson = null;
  for (let i = 0; i < 20; i++) {
    publicJson = await getJson('http://localhost:3001/api/products');
    if (publicJson) break;
    await wait(1000);
  }
  const pubCount = Array.isArray(publicJson) ? publicJson.length : (publicJson && publicJson.products ? publicJson.products.length : -1);
  console.log('public_count', pubCount);

  const login = await getJson('http://localhost:3001/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'ahsansajid295@gmail.com', password: 'T7&fD!2q' }),
  });
  if (!login) {
    console.log('login_failed');
    process.exit(0);
  }
  const token = login.accessToken || login.access_token || login.access;
  if (!token) {
    console.log('login_no_token', JSON.stringify(login).slice(0, 500));
    process.exit(0);
  }

  const adminJson = await getJson('http://localhost:3001/api/admin/products', { headers: { Authorization: 'Bearer ' + token } });
  const adminCount = Array.isArray(adminJson) ? adminJson.length : (adminJson && adminJson.products ? adminJson.products.length : -1);
  console.log('admin_count', adminCount);
})().catch((e) => {
  console.error(e && e.stack ? e.stack : e);
  process.exit(1);
});
