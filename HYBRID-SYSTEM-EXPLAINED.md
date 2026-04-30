# Understanding the Hybrid AI System

## 🎯 The Two-Tier API Key System Explained

Your QA AI Assistant now has **TWO separate API key systems** working together:

---

## 1️⃣ System API Keys (Platform Owner - YOU)

### Location
`.env` file on your server

### Configuration
```env
SYSTEM_OPENAI_API_KEY=sk-proj-xxxxx
SYSTEM_GEMINI_API_KEY=AIzaSyxxxxx
SYSTEM_CLAUDE_API_KEY=sk-ant-xxxxx
```

### Purpose
- Powers the **Built-in AI** feature
- Allows users to use AI **without their own API keys**
- You (platform owner) pay for these API calls

### Who Uses It
- New users who don't have API keys
- Free tier users (50 credits/month)
- Pro tier users (1000 credits/month)

### Cost Model
- **You pay** for API calls
- Users consume **credits** (not money)
- Credits reset monthly

### User Experience
```
User: "Generate test cases"
System: ✅ Generated! (5 credits used, 45 remaining)
```

---

## 2️⃣ User API Keys (End Users - YOUR CUSTOMERS)

### Location
Profile → AI Settings (in the web UI)

### Configuration
Users add their own keys through the UI:
- OpenAI key
- Gemini key
- Claude key
- etc.

### Purpose
- **BYOK** (Bring Your Own Key)
- Advanced users who want unlimited usage
- Users who prefer to pay directly to AI providers

### Who Uses It
- Power users
- Users who exhaust free credits
- Users who want specific AI providers

### Cost Model
- **User pays** for API calls
- No credits deducted
- Unlimited usage

### User Experience
```
User: "Generate test cases"
System: ✅ Generated! (BYOK Mode - Unlimited)
```

---

## 🔄 How They Work Together

### Decision Flow

```
User clicks "Generate Test Cases"
         ↓
┌────────────────────────┐
│ Does user have API key │
│ in Profile Settings?   │
└───────┬────────────────┘
        │
    ┌───┴───┐
   YES     NO
    │       │
    ↓       ↓
┌─────────────┐  ┌──────────────────┐
│  BYOK MODE  │  │  BUILT-IN MODE   │
├─────────────┤  ├──────────────────┤
│ Use user's  │  │ Check credits    │
│ API key     │  │                  │
│             │  │ Enough? YES      │
│ No credits  │  │   ↓              │
│ deducted    │  │ Deduct 5 credits │
│             │  │   ↓              │
│ Unlimited   │  │ Use YOUR key     │
│             │  │ (from .env)      │
└─────────────┘  └──────────────────┘
```

---

## 📊 Real-World Examples

### Example 1: New User (No API Key)

**User Journey:**
1. Signs up → Gets 50 free credits
2. Goes to "Test Case Architect"
3. Clicks "Generate"

**What Happens:**
```javascript
// System checks
hasUserApiKey = false
userCredits = 50
requiredCredits = 5

// System uses YOUR API key from .env
SYSTEM_OPENAI_API_KEY = "sk-proj-xxxxx"

// Deducts credits
userCredits = 50 - 5 = 45

// Response
{
  "mode": "BUILT_IN",
  "creditsUsed": 5,
  "creditsRemaining": 45
}
```

**User sees:** "✅ Generated! 45 credits remaining"

---

### Example 2: User Adds Their Own Key

**User Journey:**
1. Goes to Profile → AI Settings
2. Adds OpenAI key: `sk-user-xxxxx`
3. Clicks "Save"
4. Goes to "Test Case Architect"
5. Clicks "Generate"

**What Happens:**
```javascript
// System checks
hasUserApiKey = true
userApiKey = "sk-user-xxxxx"

// System uses THEIR API key
// NO credit deduction

// Response
{
  "mode": "BYOK",
  "creditsUsed": 0,
  "creditsRemaining": null
}
```

**User sees:** "✅ Generated! (BYOK Mode - Unlimited)"

---

### Example 3: User Runs Out of Credits

**User Journey:**
1. User has 2 credits left
2. Tries to generate test cases (costs 5 credits)

**What Happens:**
```javascript
// System checks
hasUserApiKey = false
userCredits = 2
requiredCredits = 5

// Not enough credits!
// Response
{
  "error": "Insufficient credits. You need 5 credits but have 2. Please upgrade your plan or add your own API key in Settings."
}
```

**User sees:** Error message with two options:
- **Option A:** Upgrade to Pro (1000 credits/month)
- **Option B:** Add your own API key (unlimited)

---

## 💰 Business Model

### Revenue Streams

**1. Subscription Plans**
```
Free Plan:  50 credits/month  = $0/month
Pro Plan:   1000 credits/month = $29/month
```

**2. Cost Structure**
```
Your Cost (using system keys):
- OpenAI GPT-4: ~$0.03 per request
- Gemini: ~$0.001 per request
- DeepSeek: ~$0.0001 per request

Your Revenue (Pro plan):
- $29/month for 1000 credits
- If using DeepSeek: Cost = $0.10
- Profit = $28.90 per user
```

**3. BYOK Users**
```
Cost to you: $0 (they use their own keys)
Revenue: Can charge for platform access
```

---

## 🎨 UI/UX Recommendations

### Dashboard Display

```
┌─────────────────────────────────────┐
│  Your AI Mode                       │
├─────────────────────────────────────┤
│  🔑 BYOK Mode (Unlimited)           │
│  Using your OpenAI key              │
│                                     │
│  [Manage API Keys]                  │
└─────────────────────────────────────┘
```

OR

```
┌─────────────────────────────────────┐
│  Your AI Credits                    │
├─────────────────────────────────────┤
│  💳 45 credits remaining            │
│  Free Plan (50/month)               │
│                                     │
│  Resets in 15 days                  │
│                                     │
│  [Upgrade to Pro] [Add API Key]     │
└─────────────────────────────────────┘
```

### Module Usage Display

Before generation:
```
┌─────────────────────────────────────┐
│  Test Case Architect                │
├─────────────────────────────────────┤
│  Cost: 5 credits                    │
│  Your balance: 45 credits           │
│                                     │
│  [Generate Test Cases]              │
└─────────────────────────────────────┘
```

After generation:
```
✅ Test cases generated successfully!
💳 5 credits used (40 remaining)
```

---

## 🔧 Configuration

### Adjust Credit Costs

Edit `server/config/credits.config.js`:

```javascript
export const CREDIT_COSTS = {
  'test-case-architect': 5,    // Expensive (complex)
  'requirement-analyzer': 3,   // Medium
  'bug-analyzer': 4,           // Medium-high
  'rtm-generator': 4,          // Medium-high
  'meeting-notes': 3,          // Medium
  'clarity-ai': 2              // Cheap (simple)
};
```

### Adjust Plans

```javascript
export const PLANS = {
  free: {
    monthlyCredits: 50,
    maxRequestsPerMinute: 5
  },
  pro: {
    monthlyCredits: 1000,
    maxRequestsPerMinute: 20
  },
  enterprise: {
    monthlyCredits: 10000,
    maxRequestsPerMinute: 100
  }
};
```

---

## 🚀 Making It Work

### Step 1: Run Database Migration

```sql
-- Run in Supabase SQL Editor
supabase-credits-schema.sql
```

This adds:
- `credits` column to `user_settings`
- `plan` column to `user_settings`
- `credits_reset_at` column
- `credits_used` and `is_byok` to `usage_logs`
- Functions for credit management

### Step 2: Configure System Keys

Add to `.env`:
```env
# At least ONE required
SYSTEM_OPENAI_API_KEY=sk-proj-xxxxx
SYSTEM_GEMINI_API_KEY=AIzaSyxxxxx
```

### Step 3: Restart Server

```bash
node server.js
```

### Step 4: Test

```bash
# Check health
curl http://localhost:8000/api/health

# Should show:
{
  "hybridMode": true,
  "systemAIConfigured": true
}
```

---

## 📈 Monitoring

### Track Usage

```sql
-- Total credits used today
SELECT SUM(credits_used) 
FROM usage_logs 
WHERE timestamp >= CURRENT_DATE 
AND is_byok = false;

-- BYOK vs Built-in breakdown
SELECT 
  is_byok,
  COUNT(*) as requests,
  SUM(credits_used) as total_credits
FROM usage_logs
GROUP BY is_byok;

-- Top users by credit consumption
SELECT 
  user_id,
  SUM(credits_used) as total_credits,
  COUNT(*) as requests
FROM usage_logs
WHERE is_byok = false
GROUP BY user_id
ORDER BY total_credits DESC
LIMIT 10;
```

---

## ✅ Summary

| Aspect | System Keys (.env) | User Keys (UI) |
|--------|-------------------|----------------|
| **Who configures** | You (platform owner) | End users |
| **Where** | `.env` file | Profile → AI Settings |
| **Purpose** | Built-in AI with credits | BYOK unlimited usage |
| **Cost** | You pay | User pays |
| **Credits** | Deducted | Not deducted |
| **Visibility** | Hidden from users | Visible to user |
| **Use case** | Freemium model | Power users |

---

## 🎯 Key Takeaway

**System keys** = Your investment to provide free/paid AI service  
**User keys** = User's choice to bypass your system and use their own

Both work seamlessly together, giving users flexibility while allowing you to monetize through credits!

---

**Questions?** Check `API-DOCUMENTATION.md` for technical details.
