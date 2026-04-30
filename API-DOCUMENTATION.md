# Hybrid AI API Documentation

## Base URL

```
http://localhost:8000/api
```

## Authentication

All endpoints require JWT authentication via Bearer token:

```
Authorization: Bearer <supabase_jwt_token>
```

---

## Endpoints

### 1. Health Check

**GET** `/health`

Check server status and configuration.

**Response:**
```json
{
  "ok": true,
  "aiServiceEnabled": true,
  "hybridMode": true,
  "systemAIConfigured": true
}
```

---

### 2. Get User Credits

**GET** `/credits`

Get current user credit information.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "credits": 45,
  "plan": "free",
  "resetAt": "2025-02-15T10:00:00.000Z",
  "hasApiKey": false
}
```

**Status Codes:**
- `200` - Success
- `401` - Unauthorized
- `404` - Credits not found
- `500` - Server error

---

### 3. Upgrade Plan

**POST** `/credits/upgrade`

Upgrade user subscription plan.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "plan": "pro"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Plan upgraded successfully"
}
```

**Status Codes:**
- `200` - Success
- `400` - Invalid plan
- `401` - Unauthorized
- `500` - Server error

---

### 4. Generate AI Response

**POST** `/ai/generate`

Generate AI response using hybrid mode (BYOK or built-in).

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "prompt": "Generate test cases for user login functionality",
  "systemPrompt": "You are a QA testing expert. Generate comprehensive test cases.",
  "module": "test-case-architect",
  "provider": "auto"
}
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `prompt` | string | Yes | User input prompt |
| `systemPrompt` | string | No | System instructions for AI |
| `module` | string | No | Module name (for credit calculation) |
| `provider` | string | No | AI provider ('auto', 'openai', 'gemini', etc.) |

**Response (BYOK Mode):**
```json
{
  "success": true,
  "content": "Test Case 1: Valid Login\nPreconditions: User has valid credentials...",
  "provider": "openai",
  "tokens": 150,
  "mode": "BYOK",
  "creditsUsed": 0
}
```

**Response (Built-in Mode):**
```json
{
  "success": true,
  "content": "Test Case 1: Valid Login\nPreconditions: User has valid credentials...",
  "provider": "gemini",
  "tokens": 120,
  "mode": "BUILT_IN",
  "creditsUsed": 5,
  "creditsRemaining": 40
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Insufficient credits. You need 5 credits but have 2. Please upgrade your plan or add your own API key in Settings."
}
```

**Status Codes:**
- `200` - Success
- `400` - Invalid request
- `401` - Unauthorized
- `500` - Server error

---

### 5. Check AI Availability

**GET** `/ai/check?module=<module_name>`

Check if user can use AI for a specific module.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `module` | string | No | Module name (default: 'generic') |

**Response:**
```json
{
  "canUseAI": true,
  "mode": "BUILT_IN",
  "credits": 45,
  "requiredCredits": 5,
  "hasApiKey": false
}
```

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `canUseAI` | boolean | Whether user can make AI request |
| `mode` | string | 'BYOK' or 'BUILT_IN' |
| `credits` | number | Current credit balance |
| `requiredCredits` | number | Credits needed for this module |
| `hasApiKey` | boolean | Whether user has own API key |

**Status Codes:**
- `200` - Success
- `401` - Unauthorized
- `500` - Server error

---

## Credit Costs by Module

| Module | Credits |
|--------|---------|
| `test-case-architect` | 5 |
| `requirement-analyzer` | 3 |
| `bug-analyzer` | 4 |
| `rtm-generator` | 4 |
| `meeting-notes` | 3 |
| `clarity-ai` | 2 |
| `generic` | 3 |

---

## Plans

| Plan | Monthly Credits | Max Requests/Min |
|------|----------------|------------------|
| `free` | 50 | 5 |
| `pro` | 1000 | 20 |

---

## Usage Flow

### Scenario 1: User with API Key (BYOK)

```javascript
// 1. Check availability
const check = await fetch('/api/ai/check?module=test-case-architect', {
  headers: { 'Authorization': `Bearer ${token}` }
});
// Response: { canUseAI: true, mode: "BYOK", hasApiKey: true }

// 2. Generate AI
const response = await fetch('/api/ai/generate', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    prompt: 'Generate test cases',
    module: 'test-case-architect'
  })
});
// Response: { success: true, mode: "BYOK", creditsUsed: 0 }
```

### Scenario 2: User without API Key (Built-in)

```javascript
// 1. Check availability
const check = await fetch('/api/ai/check?module=test-case-architect', {
  headers: { 'Authorization': `Bearer ${token}` }
});
// Response: { canUseAI: true, mode: "BUILT_IN", credits: 45, requiredCredits: 5 }

// 2. Generate AI
const response = await fetch('/api/ai/generate', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    prompt: 'Generate test cases',
    module: 'test-case-architect'
  })
});
// Response: { success: true, mode: "BUILT_IN", creditsUsed: 5, creditsRemaining: 40 }

// 3. Check updated credits
const credits = await fetch('/api/credits', {
  headers: { 'Authorization': `Bearer ${token}` }
});
// Response: { credits: 40, plan: "free" }
```

### Scenario 3: Insufficient Credits

```javascript
// User has 2 credits, needs 5
const response = await fetch('/api/ai/generate', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    prompt: 'Generate test cases',
    module: 'test-case-architect'
  })
});
// Response: { 
//   success: false, 
//   error: "Insufficient credits. You need 5 credits but have 2. Please upgrade your plan or add your own API key in Settings."
// }

// Upgrade to pro
await fetch('/api/credits/upgrade', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ plan: 'pro' })
});
// Response: { success: true, message: "Plan upgraded successfully" }

// Now user has 1000 credits
```

---

## Error Codes

| Status | Error | Description |
|--------|-------|-------------|
| 400 | Invalid request | Missing or invalid parameters |
| 401 | Unauthorized | Missing or invalid JWT token |
| 404 | Not found | Resource not found |
| 429 | Rate limit exceeded | Too many requests |
| 500 | Server error | Internal server error |

---

## Rate Limiting

Requests are limited based on user plan:

- **Free**: 5 requests/minute
- **Pro**: 20 requests/minute

Rate limit headers:
```
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 4
X-RateLimit-Reset: 1640000000
```

---

## Examples

### cURL

```bash
# Get credits
curl -X GET http://localhost:8000/api/credits \
  -H "Authorization: Bearer YOUR_TOKEN"

# Generate AI
curl -X POST http://localhost:8000/api/ai/generate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Generate test cases for login",
    "module": "test-case-architect"
  }'

# Upgrade plan
curl -X POST http://localhost:8000/api/credits/upgrade \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"plan": "pro"}'
```

### JavaScript (Fetch)

```javascript
const token = 'YOUR_SUPABASE_JWT_TOKEN';

// Get credits
async function getCredits() {
  const response = await fetch('http://localhost:8000/api/credits', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return await response.json();
}

// Generate AI
async function generateAI(prompt, module) {
  const response = await fetch('http://localhost:8000/api/ai/generate', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ prompt, module })
  });
  return await response.json();
}

// Check availability
async function checkAI(module) {
  const response = await fetch(`http://localhost:8000/api/ai/check?module=${module}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return await response.json();
}
```

### Python (Requests)

```python
import requests

TOKEN = 'YOUR_SUPABASE_JWT_TOKEN'
BASE_URL = 'http://localhost:8000/api'

headers = {
    'Authorization': f'Bearer {TOKEN}',
    'Content-Type': 'application/json'
}

# Get credits
response = requests.get(f'{BASE_URL}/credits', headers=headers)
print(response.json())

# Generate AI
data = {
    'prompt': 'Generate test cases for login',
    'module': 'test-case-architect'
}
response = requests.post(f'{BASE_URL}/ai/generate', headers=headers, json=data)
print(response.json())

# Upgrade plan
data = {'plan': 'pro'}
response = requests.post(f'{BASE_URL}/credits/upgrade', headers=headers, json=data)
print(response.json())
```

---

## Webhooks (Future)

Coming soon: Webhook notifications for:
- Credit exhaustion
- Plan upgrades
- Monthly credit resets

---

## Support

For API issues:
- Check `/api/health` endpoint
- Verify JWT token is valid
- Check rate limits
- Review server logs

---

**Version**: 1.0.0  
**Last Updated**: 2025
