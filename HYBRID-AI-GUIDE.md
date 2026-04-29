# Hybrid AI Credit System - Implementation Guide

## 🎯 Overview

This implementation adds a **Hybrid AI Usage Model** to the QA AI Assistant platform:

1. **Built-in AI** - Users can use AI without API keys (credit-based)
2. **BYOK** - Users can add their own API keys (unlimited, no credits)

---

## 🏗️ Architecture

### Request Flow

```
User Request
    ↓
Auth Middleware (validate user)
    ↓
Check: Does user have API key?
    ↓
YES → Use BYOK Mode          NO → Use Built-in AI Mode
    ↓                             ↓
Use user's API key           Check credits available?
    ↓                             ↓
Call AI Provider             YES → Deduct credits
    ↓                             ↓
Log usage (no credits)       Use system API key
    ↓                             ↓
Return response              Call AI Provider
                                  ↓
                             Log usage (with credits)
                                  ↓
                             Return response + credits remaining
```

---

## 📁 File Structure

```
QA-Ai-Assistant/
├── server/
│   ├── config/
│   │   └── credits.config.js          # Credit costs per module
│   ├── middleware/
│   │   └── authMiddleware.js          # JWT auth + user context
│   ├── routes/
│   │   ├── creditRoutes.js            # Credit management endpoints
│   │   └── aiRoutes.js                # Hybrid AI generation endpoints
│   └── services/
│       ├── creditService.js           # Credit operations
│       └── hybridAIService.js         # BYOK vs Built-in logic
├── server-hybrid.js                   # New hybrid server
├── supabase-credits-schema.sql        # Database schema for credits
└── .env.hybrid                        # Environment template
```

---

## 🗄️ Database Schema

### New Columns in `user_settings`

| Column | Type | Description |
|--------|------|-------------|
| `credits` | INTEGER | Remaining credits (default: 50) |
| `plan` | TEXT | User plan: 'free' or 'pro' |
| `credits_reset_at` | TIMESTAMPTZ | When credits reset (monthly) |

### New Columns in `usage_logs`

| Column | Type | Description |
|--------|------|-------------|
| `credits_used` | INTEGER | Credits deducted for request |
| `is_byok` | BOOLEAN | Whether user used own API key |

### New Functions

- `deduct_credits(user_id, credits)` - Deduct credits with validation
- `get_user_credits(user_id)` - Get user credit info
- `upgrade_user_plan(user_id, plan)` - Upgrade user plan

---

## 💳 Credit System

### Credit Costs (Configurable)

```javascript
{
  'test-case-architect': 5,
  'requirement-analyzer': 3,
  'bug-analyzer': 4,
  'rtm-generator': 4,
  'meeting-notes': 3,
  'clarity-ai': 2
}
```

### Plans

| Plan | Monthly Credits | Max Requests/Min |
|------|----------------|------------------|
| Free | 50 | 5 |
| Pro | 1000 | 20 |

### Credit Reset

- Credits reset automatically every 30 days
- Reset date stored in `credits_reset_at`
- Checked on every request

---

## 🔐 Security

### API Key Encryption

- User API keys encrypted with AES-256-GCM
- System API keys stored in environment variables
- Never exposed to frontend

### Authentication

- JWT token validation on every request
- User context extracted from Supabase auth
- Row-level security enforced

---

## 🚀 Setup Instructions

### 1. Database Setup

Run in Supabase SQL Editor:

```bash
# First, run existing schema
supabase-schema.sql

# Then, run credit system schema
supabase-credits-schema.sql
```

### 2. Environment Configuration

Copy `.env.hybrid` to `.env`:

```bash
cp .env.hybrid .env
```

Configure:

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key

# Encryption (generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
API_KEY_ENCRYPTION_SECRET=your-32-byte-secret

# System AI Keys (at least one required)
SYSTEM_OPENAI_API_KEY=sk-your-key
SYSTEM_GEMINI_API_KEY=your-key
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Run Hybrid Server

```bash
node server-hybrid.js
```

---

## 📡 API Endpoints

### Credit Management

#### GET `/api/credits`

Get user credit info.

**Response:**
```json
{
  "credits": 45,
  "plan": "free",
  "resetAt": "2025-02-15T10:00:00Z",
  "hasApiKey": false
}
```

#### POST `/api/credits/upgrade`

Upgrade user plan.

**Request:**
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

### AI Generation

#### POST `/api/ai/generate`

Generate AI response (hybrid mode).

**Request:**
```json
{
  "prompt": "Generate test cases for login",
  "systemPrompt": "You are a QA expert",
  "module": "test-case-architect",
  "provider": "auto"
}
```

**Response (BYOK):**
```json
{
  "success": true,
  "content": "Test cases...",
  "provider": "openai",
  "tokens": 150,
  "mode": "BYOK",
  "creditsUsed": 0
}
```

**Response (Built-in):**
```json
{
  "success": true,
  "content": "Test cases...",
  "provider": "gemini",
  "tokens": 120,
  "mode": "BUILT_IN",
  "creditsUsed": 5,
  "creditsRemaining": 40
}
```

**Error (No Credits):**
```json
{
  "success": false,
  "error": "Insufficient credits. You need 5 credits but have 2. Please upgrade your plan or add your own API key in Settings."
}
```

#### GET `/api/ai/check?module=test-case-architect`

Check if user can use AI.

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

---

## 🎨 Frontend Integration

### Check Credits Before Request

```javascript
async function checkAIAvailability(module) {
  const response = await fetch(`/api/ai/check?module=${module}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const data = await response.json();
  
  if (!data.canUseAI) {
    showUpgradePrompt();
    return false;
  }
  
  return true;
}
```

### Make AI Request

```javascript
async function generateAI(prompt, module) {
  const response = await fetch('/api/ai/generate', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      prompt,
      systemPrompt: 'You are a QA expert',
      module
    })
  });
  
  const data = await response.json();
  
  if (!data.success) {
    if (data.error.includes('Insufficient credits')) {
      showUpgradePrompt();
    }
    throw new Error(data.error);
  }
  
  // Update UI with credits remaining
  if (data.mode === 'BUILT_IN') {
    updateCreditsDisplay(data.creditsRemaining);
  }
  
  return data.content;
}
```

### Display Credits

```javascript
async function loadCredits() {
  const response = await fetch('/api/credits', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const data = await response.json();
  
  document.getElementById('credits').textContent = data.credits;
  document.getElementById('plan').textContent = data.plan.toUpperCase();
  
  if (data.hasApiKey) {
    document.getElementById('mode').textContent = 'BYOK (Unlimited)';
  } else {
    document.getElementById('mode').textContent = `Built-in AI (${data.credits} credits)`;
  }
}
```

---

## 🧪 Testing

### Test Built-in AI Mode

1. Create user without API key
2. Check credits: `GET /api/credits`
3. Generate AI: `POST /api/ai/generate`
4. Verify credits deducted
5. Exhaust credits
6. Verify error message

### Test BYOK Mode

1. Add user API key in settings
2. Generate AI: `POST /api/ai/generate`
3. Verify no credits deducted
4. Check usage logs: `is_byok = true`

### Test Credit Reset

1. Set `credits_reset_at` to past date
2. Make AI request
3. Verify credits reset to plan amount

---

## 🔧 Configuration

### Adjust Credit Costs

Edit `server/config/credits.config.js`:

```javascript
export const CREDIT_COSTS = {
  'test-case-architect': 10,  // Increase cost
  'requirement-analyzer': 5,
  // ...
};
```

### Adjust Plan Limits

```javascript
export const PLANS = {
  free: {
    monthlyCredits: 100,  // Increase free credits
    maxRequestsPerMinute: 10
  },
  pro: {
    monthlyCredits: 5000,
    maxRequestsPerMinute: 50
  }
};
```

---

## 📊 Monitoring

### Track Usage

```sql
-- Total credits used today
SELECT SUM(credits_used) 
FROM usage_logs 
WHERE timestamp >= CURRENT_DATE;

-- BYOK vs Built-in breakdown
SELECT 
  is_byok,
  COUNT(*) as requests,
  SUM(credits_used) as total_credits
FROM usage_logs
GROUP BY is_byok;

-- Top users by credit usage
SELECT 
  user_id,
  SUM(credits_used) as total_credits
FROM usage_logs
WHERE is_byok = false
GROUP BY user_id
ORDER BY total_credits DESC
LIMIT 10;
```

---

## 🚨 Error Handling

### Insufficient Credits

```javascript
{
  "success": false,
  "error": "Insufficient credits. You need 5 credits but have 2. Please upgrade your plan or add your own API key in Settings."
}
```

### System AI Not Configured

```javascript
{
  "success": false,
  "error": "System AI is not configured. Please add your own API key in Settings."
}
```

### AI Request Failed

```javascript
{
  "success": false,
  "error": "AI request failed: Rate limit exceeded"
}
```

---

## 🎯 Benefits

### For Users

- **Beginners**: Start immediately without API keys
- **Advanced**: Use own keys for unlimited access
- **Flexible**: Switch between modes anytime

### For Platform

- **Revenue**: Monetize through credit system
- **Cost Control**: Limit free tier usage
- **Scalable**: Easy to add new plans
- **Transparent**: Clear usage tracking

---

## 🔮 Future Enhancements

- [ ] Credit purchase system (Stripe integration)
- [ ] Usage analytics dashboard
- [ ] Credit gifting/sharing
- [ ] Enterprise plans with custom limits
- [ ] Credit rollover for pro users
- [ ] Referral credit bonuses

---

## 📞 Support

For issues:
1. Check database schema is applied
2. Verify environment variables
3. Check server logs
4. Test with `/api/health` endpoint

---

**Status**: ✅ Production Ready
**Version**: 1.0.0
**Last Updated**: 2025
