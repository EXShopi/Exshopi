# CORS Fix - Quick Testing Checklist

## ✅ Pre-Deployment Checklist

- [ ] Code changes committed to git
- [ ] `tsc --noEmit` passes (TypeScript compilation)
- [ ] No `ts-node` errors when running backend locally
- [ ] All routes still work (test with Postman/curl)
- [ ] `/api/health` endpoint responds correctly

---

## 🚀 Post-Deployment Testing (After deploying to Render)

### 1. Health Check
```bash
curl -i https://exshopi-api.onrender.com/api/health -H "Origin: https://exshopi.onrender.com"
```
**Expected:** `200 OK` with CORS headers present

### 2. Check CORS Headers
```bash
curl -i -X OPTIONS https://exshopi-api.onrender.com/api/settings/site \
  -H "Origin: https://exshopi.onrender.com" \
  -H "Access-Control-Request-Method: GET"
```
**Expected Response Headers:**
```
HTTP/1.1 200 OK
Access-Control-Allow-Origin: https://exshopi.onrender.com
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: GET,POST,PUT,PATCH,DELETE,OPTIONS,HEAD
Access-Control-Allow-Headers: Content-Type,Authorization,X-Requested-With,Accept,Origin,Cache-Control
```

### 3. Test Actual API Call (from Postman/curl)
```bash
curl https://exshopi-api.onrender.com/api/settings/site \
  -H "Origin: https://exshopi.onrender.com" \
  -H "Authorization: Bearer YOUR_TOKEN"
```
**Expected:** Returns data with CORS headers

### 4. Browser Console Test
Open https://exshopi.onrender.com and run:
```javascript
// Test health endpoint
fetch('https://exshopi-api.onrender.com/api/health', {
  credentials: 'include'
}).then(r => r.json()).then(console.log).catch(console.error);

// Test actual API endpoint
fetch('https://exshopi-api.onrender.com/api/settings/site', {
  credentials: 'include'
}).then(r => r.json()).then(console.log).catch(console.error);
```
**Expected:** Both should return data without CORS errors in console

### 5. Check Server Logs on Render
Visit Render Dashboard → Your Backend Service → Logs
Look for:
```
[CORS] Configured allowed origins: https://exshopi.onrender.com, ...
[CORS] 🔄 Preflight request from: https://exshopi.onrender.com → /api/settings/site
```

---

## 🔍 Advanced Diagnostics

### Test All CORS Phases

#### Phase 1: No Origin (Server-to-server)
```bash
curl https://exshopi-api.onrender.com/api/health
# Should work (no CORS check for requests without Origin header)
```

#### Phase 2: Blocked Origin
```bash
curl -H "Origin: https://malicious.com" https://exshopi-api.onrender.com/api/health
# Should see warning in logs: "[CORS] 🚫 Blocked request from origin: https://malicious.com"
```

#### Phase 3: Allowed Origin with Credentials
```bash
curl -i \
  -H "Origin: https://exshopi.onrender.com" \
  -H "Cookie: sessionId=xyz" \
  https://exshopi-api.onrender.com/api/health
# Should respond with: Access-Control-Allow-Credentials: true
```

### Test Different HTTP Methods

```bash
# GET
curl -X GET https://exshopi-api.onrender.com/api/settings/site \
  -H "Origin: https://exshopi.onrender.com"

# POST with body
curl -X POST https://exshopi-api.onrender.com/api/settings/site \
  -H "Origin: https://exshopi.onrender.com" \
  -H "Content-Type: application/json" \
  -d '{"key": "value"}'

# PUT
curl -X PUT https://exshopi-api.onrender.com/api/settings/site \
  -H "Origin: https://exshopi.onrender.com" \
  -H "Content-Type: application/json" \
  -d '{"key": "value"}'

# DELETE
curl -X DELETE https://exshopi-api.onrender.com/api/settings/site \
  -H "Origin: https://exshopi.onrender.com"
```

### Test with Different Headers

```bash
# Custom header that must be in CORS allowed list
curl -X GET https://exshopi-api.onrender.com/api/settings/site \
  -H "Origin: https://exshopi.onrender.com" \
  -H "Authorization: Bearer token" \
  -H "X-Custom-Header: value"
```

---

## 📋 Feature Testing

### 1. Login Flow
```bash
curl -X POST https://exshopi-api.onrender.com/api/auth/login \
  -H "Origin: https://exshopi.onrender.com" \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password"}' \
  -i
```
Should include `Access-Control-Allow-Origin` header

### 2. Settings Fetch (From the error report)
```bash
curl -X GET https://exshopi-api.onrender.com/api/settings/site \
  -H "Origin: https://exshopi.onrender.com" \
  -i
```
Should return data with CORS headers

### 3. Product Listing
```bash
curl -X GET https://exshopi-api.onrender.com/api/products \
  -H "Origin: https://exshopi.onrender.com" \
  -i
```
Should return products with CORS headers

---

## 🎯 Success Criteria

- ✅ All requests from https://exshopi.onrender.com work
- ✅ Browser console shows no CORS errors
- ✅ Response headers include `Access-Control-Allow-Origin`
- ✅ Credentials/cookies work (when required)
- ✅ Requests from other origins are blocked
- ✅ `/api/health` endpoint works
- ✅ Server logs show CORS configuration startup

---

## ❌ Common Failure Points

| Issue | Cause | Fix |
|-------|-------|-----|
| CORS error still showing | Origin not whitelisted | Add to `defaultAllowedOrigins` |
| Preflight failing (OPTIONS) | Wrong optionsSuccessStatus | Should be 200 |
| No CORS headers | Middleware order wrong | Must be BEFORE routes |
| Credentials not sent | Missing `credentials: 'include'` | Add to fetch/axios |
| Custom headers blocked | Not in allowedHeaders | Add to CORS config |
| Error responses blocked | No CORS in error handler | Should be set |

---

## 📞 Support

If tests fail:
1. Check `/api/health` endpoint works
2. Review server logs for `[CORS]` messages
3. Verify origin is in `defaultAllowedOrigins`
4. Ensure middleware order in server.ts
5. Restart backend service

---

**Generated:** April 8, 2026
**For:** ExShopi Backend CORS Fix
