# Widget Security Pre-Deployment Verification Checklist

Manual verification checklist containing copy-pasteable `curl` commands to test the public chat widget security pipeline against a staging or test environment.

---

## Environment Setup

Replace all placeholders marked with `[FILL IN]` before executing commands.

- **Staging Base URL**: `[FILL IN STAGING_URL]` (e.g. `https://api-staging.yourdomain.com`)
- **Company ID**: `[FILL IN COMPANY_ID]` (e.g. `65f1a2b3c4d5e6f7a8b9c0d1`)
- **Widget API Key**: `[FILL IN WIDGET_KEY]` (e.g. `ctx_live_1234567890abcdef1234567890abcdef`)
- **Allowed Domain**: `[FILL IN ALLOWED_DOMAIN]` (e.g. `https://app.example.com`)
- **Disallowed Domain**: `[FILL IN DISALLOWED_DOMAIN]` (e.g. `https://unauthorized-domain.com`)

---

## Verification Test Commands

### 1. Initialize Widget Session from Allowed Domain
**Expected Result**: HTTP `200 OK` with JSON `{ "success": true, "sessionToken": "...", "widgetApiKey": "..." }`.

```bash
curl -i -X GET "[FILL IN STAGING_URL]/api/chat/widget/[FILL IN COMPANY_ID]" \
  -H "Referer: [FILL IN ALLOWED_DOMAIN]/dashboard"
```

---

### 2. Initialize Widget Session from Disallowed / Missing Domain
**Expected Result**: HTTP `403 Forbidden` with JSON `{ "error": "Domain not authorized" }`.

```bash
# Test 2a: Disallowed Referer Header
curl -i -X GET "[FILL IN STAGING_URL]/api/chat/widget/[FILL IN COMPANY_ID]" \
  -H "Referer: [FILL IN DISALLOWED_DOMAIN]"

# Test 2b: Missing Referer / Origin Header
curl -i -X GET "[FILL IN STAGING_URL]/api/chat/widget/[FILL IN COMPANY_ID]"
```

---

### 3. Send Chat Request with Valid Key + Valid Session Token
**Expected Result**: HTTP `200 OK` with AI answer JSON `{ "success": true, "answer": "...", "sources": [...] }`.

> **Note**: Save the `sessionToken` returned from Test 1 and use it in `[FILL IN SESSION_TOKEN]`.

```bash
curl -i -X POST "[FILL IN STAGING_URL]/api/chat/widget/[FILL IN COMPANY_ID]" \
  -H "Content-Type: application/json" \
  -H "X-Widget-Key: [FILL IN WIDGET_KEY]" \
  -H "X-Widget-Session: [FILL IN SESSION_TOKEN]" \
  -d '{
    "question": "What is the return policy?"
  }'
```

---

### 4. Send Chat Request with Valid Key but Missing / Invalid Session Token
**Expected Result**: HTTP `401 Unauthorized` with JSON `{ "error": "Invalid or expired widget session" }`.

```bash
# Test 4a: Missing X-Widget-Session header
curl -i -X POST "[FILL IN STAGING_URL]/api/chat/widget/[FILL IN COMPANY_ID]" \
  -H "Content-Type: application/json" \
  -H "X-Widget-Key: [FILL IN WIDGET_KEY]" \
  -d '{
    "question": "Will this request be rejected?"
  }'

# Test 4b: Invalid / Tampered Session Token
curl -i -X POST "[FILL IN STAGING_URL]/api/chat/widget/[FILL IN COMPANY_ID]" \
  -H "Content-Type: application/json" \
  -H "X-Widget-Key: [FILL IN WIDGET_KEY]" \
  -H "X-Widget-Session: invalid.tampered.token" \
  -d '{
    "question": "Will this request be rejected?"
  }'
```

---

### 5. Rapid-fire Requests Exceeding Rate Limit Threshold
**Expected Result**: HTTP `429 Too Many Requests` with JSON `{ "error": "Too many requests. Please try again later." }`.

```bash
# Rapid-fire loop (runs 25 requests sequentially to trigger WIDGET_RATE_LIMIT_PER_MIN)
for i in {1..25}; do
  echo "--- Request $i ---"
  curl -s -o /dev/null -w "Status: %{http_code}\n" -X POST "[FILL IN STAGING_URL]/api/chat/widget/[FILL IN COMPANY_ID]" \
    -H "Content-Type: application/json" \
    -H "X-Widget-Key: [FILL IN WIDGET_KEY]" \
    -H "X-Widget-Session: [FILL IN SESSION_TOKEN]" \
    -d '{"question": "Rate limit check"}'
done
```

---

### 6. Test Key Rotation Endpoint
**Expected Result**: HTTP `200 OK` with JSON `{ "success": true, "message": "Widget API key rotated successfully", "widgetApiKey": "ctx_live_..." }`.

```bash
curl -i -X POST "[FILL IN STAGING_URL]/api/auth/rotate-widget-key" \
  -H "Authorization: Bearer [FILL IN JWT_BEARER_TOKEN]"
```
