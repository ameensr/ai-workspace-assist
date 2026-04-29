# Production Deployment Checklist

## ✅ Complete Setup Guide

Follow these steps to get your hybrid AI system running in production.

---

## Phase 1: Database Setup (5 minutes)

### Step 1: Run Base Schema
```sql
-- In Supabase SQL Editor
-- File: supabase-schema.sql
```
✅ Creates `user_settings` and `usage_logs` tables

### Step 2: Run Credits Schema
```sql
-- In Supabase SQL Editor
-- File: supabase-credits-schema.sql
```
✅ Adds credit system columns and functions

### Step 3: Verify Tables
```sql
-- Check tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('user_settings', 'usage_logs');

-- Check columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_settings';
```

Expected columns in `user_settings`:
- ✅ `user_id`
- ✅ `provider`
- ✅ `api_key`
- ✅ `theme`
- ✅ `credits`
- ✅ `plan`
- ✅ `credits_reset_at`

---

## Phase 2: Environment Configuration (3 minutes)

### Step 1: Configure .env

Your `.env` file should have:

```env
# ✅ Supabase (REQUIRED)
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ✅ Encryption (ALREADY GENERATED)
API_KEY_ENCRYPTION_SECRET=ae84d89776a6f7c4a28e281623ac6cfb72154d4ff40d3553e7db4ce265bfff46

# ✅ System AI Keys (AT LEAST ONE REQUIRED)
SYSTEM_OPENAI_API_KEY=sk-proj-xxxxx
SYSTEM_GEMINI_API_KEY=AIzaSyxxxxx
SYSTEM_CLAUDE_API_KEY=sk-ant-xxxxx
SYSTEM_DEEPSEEK_API_KEY=sk-xxxxx

# ✅ Runtime
APP_TEST_MODE=false
PORT=8000
```

### Step 2: Verify Configuration

```bash
# Check .env exists
dir .env

# Test server starts
node server.js
```

---

## Phase 3: Testing (10 minutes)

### Test 1: Health Check

```bash
# PowerShell
Invoke-WebRequest -Uri http://localhost:8000/api/health -UseBasicParsing | Select-Object -ExpandProperty Content
```

Expected response:
```json
{
  "ok": true,
  "aiServiceEnabled": true,
  "hybridMode": true,
  "systemAIConfigured": true
}
```

✅ If `systemAIConfigured: true` → System keys are working!

### Test 2: Create Test User

1. Open `http://localhost:8000/signup.html`
2. Create account: `test@example.com`
3. Login
4. Open browser console (F12)
5. Get token:
```javascript
localStorage.getItem('supabase.auth.token')
```

### Test 3: Check Credits

```bash
# Replace YOUR_TOKEN with actual token
$token = "YOUR_TOKEN"
Invoke-WebRequest -Uri http://localhost:8000/api/credits -Headers @{Authorization="Bearer $token"} -UseBasicParsing | Select-Object -ExpandProperty Content
```

Expected response:
```json
{
  "credits": 50,
  "plan": "free",
  "resetAt": "2025-02-15T10:00:00.000Z",
  "hasApiKey": false
}
```

✅ User has 50 free credits!

### Test 4: Generate AI (Built-in Mode)

```bash
$body = @{
    prompt = "Generate 3 test cases for login"
    featureType = "test-case-architect"
} | ConvertTo-Json

Invoke-WebRequest -Uri http://localhost:8000/api/ai/generate -Method POST -Headers @{Authorization="Bearer $token"; "Content-Type"="application/json"} -Body $body -UseBasicParsing | Select-Object -ExpandProperty Content
```

Expected response:
```json
{
  "text": "Test Case 1: Valid Login...",
  "provider": "openai",
  "mode": "BUILT_IN",
  "creditsUsed": 5,
  "creditsRemaining": 45
}
```

✅ Built-in AI works! Credits deducted!

### Test 5: Add User API Key (BYOK Mode)

1. Go to `http://localhost:8000/profile.html`
2. Click "AI Settings"
3. Add your OpenAI key
4. Click "Save"
5. Generate AI again

Expected response:
```json
{
  "text": "Test Case 1: Valid Login...",
  "provider": "openai",
  "mode": "BYOK",
  "creditsUsed": 0,
  "creditsRemaining": null
}
```

✅ BYOK mode works! No credits deducted!

---

## Phase 4: Frontend Integration (Optional)

### Add Credit Display

Create `credits-widget.js`:

```javascript
async function loadCredits() {
  const token = localStorage.getItem('supabase.auth.token');
  const response = await fetch('/api/credits', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await response.json();
  
  const widget = document.getElementById('credits-widget');
  if (data.hasApiKey) {
    widget.innerHTML = `
      <div class="byok-mode">
        🔑 BYOK Mode (Unlimited)
      </div>
    `;
  } else {
    widget.innerHTML = `
      <div class="credits-display">
        💳 ${data.credits} credits
        <span class="plan-badge">${data.plan.toUpperCase()}</span>
      </div>
    `;
  }
}

// Load on page load
document.addEventListener('DOMContentLoaded', loadCredits);
```

### Add to Dashboard

```html
<!-- In index.html -->
<div id="credits-widget"></div>
<script src="credits-widget.js"></script>
```

---

## Phase 5: Production Deployment

### Option A: Deploy to Cloud

**Recommended Platforms:**
- Vercel
- Railway
- Render
- AWS EC2
- DigitalOcean

**Environment Variables:**
Set all `.env` variables in platform dashboard.

### Option B: Self-Hosted

```bash
# Install PM2
npm install -g pm2

# Start server
pm2 start server.js --name "qaly-ai"

# Save configuration
pm2 save

# Setup auto-restart
pm2 startup
```

---

## Phase 6: Monitoring

### Setup Logging

```javascript
// Add to server.js
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});
```

### Monitor Credits Usage

```sql
-- Daily credits consumed
SELECT 
  DATE(timestamp) as date,
  SUM(credits_used) as total_credits,
  COUNT(*) as requests
FROM usage_logs
WHERE is_byok = false
GROUP BY DATE(timestamp)
ORDER BY date DESC
LIMIT 30;
```

### Monitor Costs

```sql
-- Estimate costs (assuming $0.001 per credit)
SELECT 
  SUM(credits_used) * 0.001 as estimated_cost_usd
FROM usage_logs
WHERE is_byok = false
AND timestamp >= CURRENT_DATE - INTERVAL '30 days';
```

---

## 🚨 Troubleshooting

### Issue: "systemAIConfigured: false"

**Solution:** Add at least one system API key to `.env`

```env
SYSTEM_OPENAI_API_KEY=sk-proj-xxxxx
```

### Issue: "Insufficient credits"

**Solution:** Upgrade user plan

```bash
$body = @{plan = "pro"} | ConvertTo-Json
Invoke-WebRequest -Uri http://localhost:8000/api/credits/upgrade -Method POST -Headers @{Authorization="Bearer $token"; "Content-Type"="application/json"} -Body $body
```

### Issue: Credits not resetting

**Solution:** Check `credits_reset_at` date

```sql
SELECT user_id, credits, credits_reset_at 
FROM user_settings 
WHERE credits_reset_at < NOW();
```

---

## 📊 Success Metrics

After setup, you should see:

✅ Health endpoint returns `hybridMode: true`  
✅ New users get 50 credits automatically  
✅ AI generation works without user API key  
✅ Credits deduct correctly  
✅ BYOK mode works when user adds key  
✅ No credits deducted in BYOK mode  
✅ Credits reset monthly  

---

## 🎯 Final Checklist

- [ ] Database schema applied
- [ ] `.env` configured with Supabase
- [ ] At least one system API key added
- [ ] Server starts without errors
- [ ] Health check returns `systemAIConfigured: true`
- [ ] Test user can generate AI with credits
- [ ] Test user can add API key for BYOK
- [ ] Credits deduct correctly
- [ ] BYOK mode doesn't deduct credits
- [ ] Frontend displays credits/mode
- [ ] Monitoring setup
- [ ] Production deployment ready

---

## 📚 Documentation

- **System Overview:** `HYBRID-SYSTEM-EXPLAINED.md`
- **API Reference:** `API-DOCUMENTATION.md`
- **Quick Start:** `QUICK-START.md`
- **Environment Setup:** `ENV-SETUP-GUIDE.md`

---

## 🆘 Support

If you encounter issues:

1. Check server logs
2. Verify `.env` configuration
3. Test health endpoint
4. Check database schema
5. Review documentation

---

**🎉 You're ready for production!**

Your hybrid AI system is now:
- ✅ Beginner-friendly (no API key needed)
- ✅ Scalable (credit-based monetization)
- ✅ Flexible (BYOK for power users)
- ✅ Cost-efficient (users pay or use credits)
- ✅ Production-ready (secure & monitored)
