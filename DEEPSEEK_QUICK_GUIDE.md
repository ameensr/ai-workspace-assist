# DeepSeek Quick Setup Guide

## 🚀 Quick Start (3 Steps)

### 1️⃣ Get API Key
- Go to: https://platform.deepseek.com
- Sign up/Login → API Keys → Create
- Copy key (starts with `sk-`)

### 2️⃣ Add to Qaly AI
- Login to Qaly AI
- Profile → AI Settings
- Provider: **DeepSeek**
- Paste API key → Save

### 3️⃣ Test It
- Go to any module
- Enter input → Generate
- ✅ Should work!

---

## 🔧 If It Doesn't Work

### Quick Test
```bash
node test-deepseek.js sk-your-key-here
```

### Check Logs
Look at server terminal for:
```
[DeepSeek] API Error: 401 → Invalid key
[DeepSeek] Request timeout → Network issue
```

### Common Fixes

| Problem | Solution |
|---------|----------|
| Invalid key | Get new key from DeepSeek |
| Not saving | Check `.env` has `API_KEY_ENCRYPTION_SECRET` |
| Timeout | Add to `.env`: `DEEPSEEK_TIMEOUT_MS=30000` |
| Network | Check firewall/proxy |

---

## 📝 Configuration

### .env File
```env
# Required
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
API_KEY_ENCRYPTION_SECRET=your-32-byte-hex

# Optional
SYSTEM_DEEPSEEK_API_KEY=sk-your-key
DEEPSEEK_MODEL=deepseek-chat
DEEPSEEK_TIMEOUT_MS=20000
```

### Generate Encryption Secret
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## ✅ Verify Setup

### Browser Console (F12)
```javascript
fetch('/api/ai/check')
  .then(r => r.json())
  .then(console.log)

// Should show:
// { provider: "deepseek", hasApiKey: true }
```

### Test Generation
1. Go to Test Case Builder
2. Enter: "Login functionality"
3. Click Generate
4. Should see test cases

---

## 📚 More Help

- **Full Guide**: See `DEEPSEEK_TROUBLESHOOTING.md`
- **Fix Details**: See `DEEPSEEK_FIX_SUMMARY.md`
- **Test Script**: Run `node test-deepseek.js YOUR_KEY`

---

## 🎯 What Was Fixed

✅ Better error messages
✅ Detailed logging
✅ Improved API handling
✅ Added test script
✅ Complete troubleshooting guide

---

**Need Help?** Check server logs and browser console for detailed error messages.
