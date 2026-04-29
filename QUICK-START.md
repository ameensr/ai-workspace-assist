# Quick Start Guide - Hybrid AI System

## 🚀 5-Minute Setup

### Step 1: Database Setup (2 minutes)

```bash
# 1. Go to Supabase SQL Editor
# 2. Run these files in order:

supabase-schema.sql          # Base schema
supabase-credits-schema.sql  # Credit system
```

### Step 2: Environment Setup (1 minute)

```bash
# Copy environment template
cp .env.hybrid .env

# Generate encryption secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Edit .env and add:
# - Supabase URL and key
# - Encryption secret (from above)
# - At least ONE system API key
```

### Step 3: Install & Run (2 minutes)

```bash
# Install dependencies
npm install

# Run hybrid server
node server-hybrid.js

# Server starts on http://localhost:8000
```

---

## ✅ Verify Setup

### 1. Check Health

```bash
curl http://localhost:8000/api/health
```

Expected:
```json
{
  "ok": true,
  "aiServiceEnabled": true,
  "hybridMode": true,
  "systemAIConfigured": true
}
```

### 2. Test with User

```javascript
// Login user and get token
const token = 'YOUR_JWT_TOKEN';

// Check credits
const response = await fetch('http://localhost:8000/api/credits', {
  headers: { 'Authorization': `Bearer ${token}` }
});

console.log(await response.json());
// Expected: { credits: 50, plan: "free", ... }
```

---

## 🎯 Usage Examples

### Example 1: Built-in AI (No API Key)

```javascript
const token = 'YOUR_JWT_TOKEN';

// Generate test cases using built-in AI
const response = await fetch('http://localhost:8000/api/ai/generate', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    prompt: 'Generate test cases for user login',
    module: 'test-case-architect'
  })
});

const result = await response.json();
console.log(result);
/*
{
  "success": true,
  "content": "Test Case 1: Valid Login...",
  "mode": "BUILT_IN",
  "creditsUsed": 5,
  "creditsRemaining": 45
}
*/
```

### Example 2: BYOK (User Has API Key)

```javascript
// User adds API key in settings first
// Then same request automatically uses BYOK

const response = await fetch('http://localhost:8000/api/ai/generate', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    prompt: 'Generate test cases for user login',
    module: 'test-case-architect'
  })
});

const result = await response.json();
console.log(result);
/*
{
  "success": true,
  "content": "Test Case 1: Valid Login...",
  "mode": "BYOK",
  "creditsUsed": 0  // No credits deducted!
}
*/
```

---

## 🔧 Configuration

### Adjust Credit Costs

Edit `server/config/credits.config.js`:

```javascript
export const CREDIT_COSTS = {
  'test-case-architect': 10,  // Change from 5 to 10
  'requirement-analyzer': 5,
  // ...
};
```

### Adjust Plans

```javascript
export const PLANS = {
  free: {
    monthlyCredits: 100,  // Change from 50 to 100
    maxRequestsPerMinute: 10
  },
  // ...
};
```

---

## 🐛 Troubleshooting

### Issue: "System AI is not configured"

**Solution**: Add at least one system API key to `.env`:

```env
SYSTEM_OPENAI_API_KEY=sk-your-key
# OR
SYSTEM_GEMINI_API_KEY=your-key
```

### Issue: "Insufficient credits"

**Solution**: Upgrade user plan:

```bash
curl -X POST http://localhost:8000/api/credits/upgrade \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"plan": "pro"}'
```

### Issue: Credits not resetting

**Solution**: Check `credits_reset_at` in database:

```sql
SELECT user_id, credits, credits_reset_at 
FROM user_settings 
WHERE user_id = 'YOUR_USER_ID';
```

---

## 📊 Monitor Usage

### Check Total Credits Used

```sql
SELECT 
  SUM(credits_used) as total_credits,
  COUNT(*) as total_requests
FROM usage_logs
WHERE is_byok = false;
```

### Check BYOK vs Built-in

```sql
SELECT 
  is_byok,
  COUNT(*) as requests,
  SUM(credits_used) as credits
FROM usage_logs
GROUP BY is_byok;
```

---

## 🎨 Frontend Integration

### Display Credits in UI

```javascript
async function updateCreditsDisplay() {
  const response = await fetch('/api/credits', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const data = await response.json();
  
  document.getElementById('credits').textContent = data.credits;
  document.getElementById('plan-badge').textContent = data.plan.toUpperCase();
  
  if (data.hasApiKey) {
    document.getElementById('mode').textContent = '🔑 BYOK Mode (Unlimited)';
  } else {
    document.getElementById('mode').textContent = `💳 ${data.credits} credits remaining`;
  }
}
```

### Show Upgrade Prompt

```javascript
function showUpgradePrompt() {
  const modal = `
    <div class="modal">
      <h2>Out of Credits</h2>
      <p>You've used all your free credits.</p>
      <div class="options">
        <button onclick="upgradeToPro()">
          Upgrade to Pro (1000 credits/month)
        </button>
        <button onclick="showAddApiKey()">
          Add Your Own API Key (Unlimited)
        </button>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modal);
}
```

---

## 📚 Next Steps

1. **Read Full Documentation**: `HYBRID-AI-GUIDE.md`
2. **API Reference**: `API-DOCUMENTATION.md`
3. **Customize Credit Costs**: `server/config/credits.config.js`
4. **Add Frontend UI**: Integrate credit display and upgrade prompts
5. **Monitor Usage**: Set up analytics dashboard

---

## 🎯 Key Concepts

### BYOK Mode
- User provides own API key
- Unlimited usage
- No credit deduction
- Logged as `is_byok = true`

### Built-in Mode
- Uses system API key
- Credit-based usage
- Monthly reset
- Logged as `is_byok = false`

### Hybrid Logic
```
if (user has API key):
    use BYOK mode
else:
    if (user has credits):
        use built-in mode
        deduct credits
    else:
        return error
```

---

## 💡 Tips

1. **Start with one system API key** (e.g., OpenAI or Gemini)
2. **Test with free plan first** before implementing pro
3. **Monitor credit usage** to adjust costs
4. **Add upgrade prompts** in UI for better UX
5. **Log all requests** for analytics

---

## 🆘 Support

- **Health Check**: `GET /api/health`
- **Server Logs**: Check console output
- **Database**: Query `usage_logs` table
- **Documentation**: See `HYBRID-AI-GUIDE.md`

---

**Ready to build!** 🚀

Start server: `node server-hybrid.js`
