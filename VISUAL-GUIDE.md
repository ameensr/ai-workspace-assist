# Visual Guide: Hybrid AI System

## 🎯 The Big Picture

```
┌─────────────────────────────────────────────────────────────────┐
│                     QA AI ASSISTANT                              │
│                   (Your SaaS Platform)                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │
        ┌─────────────────────┴─────────────────────┐
        │                                           │
        ↓                                           ↓
┌───────────────────┐                    ┌──────────────────────┐
│   SYSTEM KEYS     │                    │    USER KEYS         │
│   (Your .env)     │                    │  (Profile → AI)      │
├───────────────────┤                    ├──────────────────────┤
│ OPENAI_KEY        │                    │ User adds own key    │
│ GEMINI_KEY        │                    │ in web UI            │
│ CLAUDE_KEY        │                    │                      │
├───────────────────┤                    ├──────────────────────┤
│ Powers:           │                    │ Powers:              │
│ • Built-in AI     │                    │ • BYOK Mode          │
│ • Credit system   │                    │ • Unlimited usage    │
│ • Free/Pro plans  │                    │ • No credits         │
└───────────────────┘                    └──────────────────────┘
        │                                           │
        │ YOU PAY                                   │ USER PAYS
        │                                           │
        ↓                                           ↓
┌───────────────────┐                    ┌──────────────────────┐
│  AI PROVIDERS     │                    │  AI PROVIDERS        │
│  (OpenAI, etc)    │                    │  (OpenAI, etc)       │
└───────────────────┘                    └──────────────────────┘
```

---

## 🔄 Request Flow Diagram

```
                    USER CLICKS "GENERATE"
                            │
                            ↓
                    ┌───────────────┐
                    │ Authenticate  │
                    │     User      │
                    └───────┬───────┘
                            │
                            ↓
                ┌───────────────────────┐
                │ Check: Has API Key?   │
                └───────┬───────────────┘
                        │
            ┌───────────┴───────────┐
           NO                      YES
            │                       │
            ↓                       ↓
    ┌──────────────┐        ┌─────────────┐
    │ BUILT-IN AI  │        │  BYOK MODE  │
    └──────┬───────┘        └──────┬──────┘
           │                       │
           ↓                       ↓
    ┌──────────────┐        ┌─────────────┐
    │ Check Credits│        │ Use User's  │
    │ Available?   │        │   API Key   │
    └──────┬───────┘        └──────┬──────┘
           │                       │
      ┌────┴────┐                  │
     YES       NO                  │
      │         │                  │
      ↓         ↓                  │
┌──────────┐ ┌──────────┐         │
│ Deduct   │ │  Show    │         │
│ Credits  │ │ Upgrade  │         │
└────┬─────┘ │  Prompt  │         │
     │       └──────────┘         │
     ↓                            │
┌──────────┐                      │
│ Use Your │                      │
│ System   │                      │
│ API Key  │                      │
└────┬─────┘                      │
     │                            │
     └────────────┬───────────────┘
                  │
                  ↓
          ┌───────────────┐
          │  Call AI      │
          │  Provider     │
          └───────┬───────┘
                  │
                  ↓
          ┌───────────────┐
          │  Log Usage    │
          │  (credits,    │
          │   is_byok)    │
          └───────┬───────┘
                  │
                  ↓
          ┌───────────────┐
          │  Return       │
          │  Response     │
          └───────────────┘
```

---

## 💳 Credit System Flow

```
NEW USER SIGNS UP
        │
        ↓
┌───────────────────┐
│ Create Account    │
│ Plan: FREE        │
│ Credits: 50       │
│ Reset: +30 days   │
└────────┬──────────┘
         │
         ↓
┌───────────────────┐
│ User Dashboard    │
│ 💳 50 credits     │
│ Free Plan         │
└────────┬──────────┘
         │
         ↓
┌───────────────────┐
│ Generate Test     │
│ Cases (5 credits) │
└────────┬──────────┘
         │
         ↓
┌───────────────────┐
│ Deduct 5 Credits  │
│ 50 → 45           │
└────────┬──────────┘
         │
         ↓
┌───────────────────┐
│ User Dashboard    │
│ 💳 45 credits     │
│ Free Plan         │
└────────┬──────────┘
         │
         ↓ (after 10 requests)
┌───────────────────┐
│ User Dashboard    │
│ 💳 0 credits      │
│ Free Plan         │
└────────┬──────────┘
         │
         ↓
┌───────────────────┐
│ Show Upgrade      │
│ Prompt            │
│ • Upgrade to Pro  │
│ • Add API Key     │
└────────┬──────────┘
         │
    ┌────┴────┐
   PRO      BYOK
    │         │
    ↓         ↓
┌────────┐ ┌────────┐
│ 1000   │ │ ∞      │
│ credits│ │ usage  │
└────────┘ └────────┘
```

---

## 🔑 API Key Comparison

```
┌─────────────────────────────────────────────────────────────┐
│                    SYSTEM KEYS                               │
├─────────────────────────────────────────────────────────────┤
│ Location:    .env file on server                            │
│ Configured:  By you (platform owner)                        │
│ Visible to:  Nobody (server-side only)                      │
│ Purpose:     Power built-in AI for all users                │
│ Cost:        You pay for API calls                          │
│ Usage:       Limited by user credits                        │
│ Example:     SYSTEM_OPENAI_API_KEY=sk-proj-xxxxx            │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ vs
                              │
┌─────────────────────────────────────────────────────────────┐
│                     USER KEYS                                │
├─────────────────────────────────────────────────────────────┤
│ Location:    Database (encrypted)                           │
│ Configured:  By end user in web UI                          │
│ Visible to:  Only that user                                 │
│ Purpose:     BYOK - user's own unlimited AI                 │
│ Cost:        User pays for API calls                        │
│ Usage:       Unlimited (no credits)                         │
│ Example:     User adds in Profile → AI Settings             │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 User Journey Comparison

### Journey A: Free User (No API Key)

```
Day 1:  Sign up → 50 credits
        │
        ↓
Day 2:  Generate 5 test cases → 45 credits
        │
        ↓
Day 5:  Generate 3 bug reports → 33 credits
        │
        ↓
Day 10: Generate RTM → 28 credits
        │
        ↓
Day 15: Generate more → 0 credits
        │
        ↓
        ❌ "Out of credits"
        │
        ↓
        Choose:
        • Upgrade to Pro ($29/month)
        • Add API key (unlimited)
```

### Journey B: Pro User (No API Key)

```
Day 1:  Upgrade to Pro → 1000 credits
        │
        ↓
Month:  Generate 200 test cases → 0 credits
        │
        ↓
        ✅ Still have credits
        │
        ↓
Day 30: Credits reset → 1000 credits
```

### Journey C: BYOK User (Has API Key)

```
Day 1:  Add OpenAI key
        │
        ↓
        ✅ Unlimited usage
        │
        ↓
Month:  Generate 1000+ test cases
        │
        ↓
        ✅ No credits deducted
        │
        ↓
        User pays OpenAI directly
```

---

## 💰 Cost Breakdown

```
┌─────────────────────────────────────────────────────────────┐
│                  YOUR COSTS (System Keys)                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Free User (50 credits/month):                              │
│  ├─ 10 requests × $0.001 = $0.01/month                      │
│  └─ Revenue: $0                                             │
│     Profit: -$0.01 (loss leader)                            │
│                                                              │
│  Pro User (1000 credits/month):                             │
│  ├─ 200 requests × $0.001 = $0.20/month                     │
│  └─ Revenue: $29                                            │
│     Profit: $28.80                                          │
│                                                              │
│  BYOK User:                                                  │
│  ├─ 0 requests on your key = $0/month                       │
│  └─ Revenue: $0 (or platform fee)                           │
│     Profit: $0 (or platform fee)                            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎨 UI Mockups

### Dashboard - Free User (No API Key)

```
┌─────────────────────────────────────────────────────────┐
│  QA AI Assistant                          [Profile ▼]   │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │  Your AI Credits                               │    │
│  │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │    │
│  │                                                 │    │
│  │  💳 45 credits remaining                       │    │
│  │  📅 Free Plan (50/month)                       │    │
│  │  🔄 Resets in 15 days                          │    │
│  │                                                 │    │
│  │  [Upgrade to Pro]  [Add API Key]               │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  Modules:                                                │
│  ┌──────────────────┐  ┌──────────────────┐            │
│  │ Test Case        │  │ Requirement      │            │
│  │ Architect        │  │ Analyzer         │            │
│  │ 💳 5 credits     │  │ 💳 3 credits     │            │
│  └──────────────────┘  └──────────────────┘            │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Dashboard - BYOK User (Has API Key)

```
┌─────────────────────────────────────────────────────────┐
│  QA AI Assistant                          [Profile ▼]   │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │  Your AI Mode                                  │    │
│  │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │    │
│  │                                                 │    │
│  │  🔑 BYOK Mode (Unlimited)                      │    │
│  │  Using your OpenAI key                         │    │
│  │                                                 │    │
│  │  [Manage API Keys]                             │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  Modules:                                                │
│  ┌──────────────────┐  ┌──────────────────┐            │
│  │ Test Case        │  │ Requirement      │            │
│  │ Architect        │  │ Analyzer         │            │
│  │ ∞ Unlimited      │  │ ∞ Unlimited      │            │
│  └──────────────────┘  └──────────────────┘            │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 🎯 Key Takeaways

```
┌─────────────────────────────────────────────────────────┐
│  SYSTEM KEYS (.env)                                     │
│  ═══════════════════                                    │
│  • You configure                                        │
│  • Hidden from users                                    │
│  • Powers built-in AI                                   │
│  • You pay                                              │
│  • Credit-based usage                                   │
│  • Monetization opportunity                             │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  USER KEYS (Profile → AI Settings)                      │
│  ══════════════════════════════════                     │
│  • User configures                                      │
│  • Visible to user                                      │
│  • Powers BYOK mode                                     │
│  • User pays                                            │
│  • Unlimited usage                                      │
│  • User flexibility                                     │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  TOGETHER = HYBRID SYSTEM                               │
│  ═════════════════════════                              │
│  • Beginner-friendly (no setup needed)                  │
│  • Scalable (credit monetization)                       │
│  • Flexible (BYOK for power users)                      │
│  • Cost-efficient (users choose)                        │
│  • Production-ready (secure & monitored)                │
└─────────────────────────────────────────────────────────┘
```

---

## 📚 Quick Reference

| Aspect | System Keys | User Keys |
|--------|-------------|-----------|
| **Location** | `.env` file | Database (encrypted) |
| **Who sets** | You | End user |
| **Visibility** | Server-only | User-only |
| **Purpose** | Built-in AI | BYOK |
| **Cost** | You pay | User pays |
| **Credits** | Deducted | Not deducted |
| **Limit** | Credit-based | Unlimited |
| **Use case** | Freemium | Power users |

---

**🎉 Your hybrid AI system is ready!**

Both systems work seamlessly together to provide the best experience for all users.
