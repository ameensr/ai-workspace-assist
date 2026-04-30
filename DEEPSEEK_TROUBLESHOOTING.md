# DeepSeek API Troubleshooting Guide

## Common Issues and Solutions

### Issue: "DeepSeek Provider failed" Error

This error can occur for several reasons. Follow these steps to diagnose and fix:

---

## Step 1: Verify API Key Format

DeepSeek API keys should start with `sk-` (similar to OpenAI).

**Check your key:**
```
✅ Correct: sk-abc123def456...
❌ Wrong: deepseek-abc123...
❌ Wrong: ds-abc123...
```

---

## Step 2: Test API Key Directly

Run the test script to verify your API key works:

```bash
node test-deepseek.js YOUR_DEEPSEEK_API_KEY
```

**Expected output:**
```
Testing DeepSeek API...
API Key format: sk-abc123...
Response status: 200
Success! Response: {...}
Content: Hello World
```

**If you get an error:**
- 401 Unauthorized → Invalid API key
- 429 Rate Limit → Too many requests
- 500 Server Error → DeepSeek service issue

---

## Step 3: Check API Key Storage

### Option A: Using Your Own API Key (BYOK Mode)

1. Go to **Profile → AI Settings**
2. Select **DeepSeek** from dropdown
3. Paste your API key
4. Click **Save**
5. Verify it's saved by refreshing the page

### Option B: Using System API Key (Built-in Mode)

1. Open `.env` file
2. Check this line:
   ```env
   SYSTEM_DEEPSEEK_API_KEY=sk-your-actual-key-here
   ```
3. Replace with your real API key
4. Restart the server:
   ```bash
   npm run dev
   ```

---

## Step 4: Check Server Logs

When you try to use DeepSeek, check the terminal/console for error messages:

```
[DeepSeek] API Error: 401 {"error": {"message": "Invalid API key"}}
[DeepSeek] API Error: 429 {"error": {"message": "Rate limit exceeded"}}
[DeepSeek] Request timeout after 20000 ms
[DeepSeek] Empty response: {...}
```

These logs will tell you exactly what's wrong.

---

## Step 5: Verify Provider Selection

1. Open browser console (F12)
2. Go to **Profile → AI Settings**
3. Check the `/api/ai/check` response:
   ```json
   {
     "provider": "deepseek",
     "availableProviders": ["deepseek"],
     "hasApiKey": true
   }
   ```

If `availableProviders` doesn't include "deepseek", your key isn't being loaded.

---

## Step 6: Clear Cache and Re-login

Sometimes cached data causes issues:

1. **Logout** from the app
2. **Clear browser cache** (Ctrl+Shift+Delete)
3. **Close all browser tabs**
4. **Restart the server**
5. **Login again**
6. **Re-enter API key** in Profile → AI Settings

---

## Step 7: Check Database Encryption

If using BYOK mode, verify encryption is working:

1. Check `.env` has:
   ```env
   API_KEY_ENCRYPTION_SECRET=your-32-byte-hex-string
   ```

2. If missing, generate one:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

3. Add to `.env` and restart server

---

## Step 8: Test with Different Provider

To isolate the issue, try another provider:

1. Go to **Profile → AI Settings**
2. Select **OpenAI** or **Gemini**
3. Enter that provider's API key
4. Test if it works

If other providers work but DeepSeek doesn't:
- Your DeepSeek API key is invalid
- DeepSeek service is down
- Your IP is blocked by DeepSeek

---

## Step 9: Check Network/Firewall

DeepSeek API endpoint: `https://api.deepseek.com/v1/chat/completions`

**Test connectivity:**
```bash
curl -X POST https://api.deepseek.com/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{"model":"deepseek-chat","messages":[{"role":"user","content":"test"}]}'
```

If this fails, check:
- Firewall blocking the domain
- Corporate proxy settings
- VPN interference

---

## Step 10: Verify Model Name

DeepSeek uses specific model names. Check `.env`:

```env
DEEPSEEK_MODEL=deepseek-chat
```

**Valid models:**
- `deepseek-chat` (default)
- `deepseek-coder`

**Invalid models:**
- `deepseek-v2` ❌
- `deepseek-1.5` ❌

---

## Quick Fixes Summary

| Problem | Solution |
|---------|----------|
| Invalid API key | Get new key from DeepSeek dashboard |
| Key not saving | Check encryption secret in `.env` |
| Timeout errors | Increase timeout in `.env`: `DEEPSEEK_TIMEOUT_MS=30000` |
| Rate limit | Wait or upgrade DeepSeek plan |
| Empty response | Check model name is correct |
| Network error | Check firewall/proxy settings |

---

## Getting a DeepSeek API Key

1. Go to [https://platform.deepseek.com](https://platform.deepseek.com)
2. Sign up or login
3. Navigate to **API Keys** section
4. Click **Create API Key**
5. Copy the key (starts with `sk-`)
6. Paste into Qaly AI settings

---

## Still Not Working?

If none of the above works:

1. **Check server logs** for detailed error messages
2. **Run test script** to verify API key: `node test-deepseek.js YOUR_KEY`
3. **Try different browser** (Chrome, Firefox, Edge)
4. **Check DeepSeek status**: [https://status.deepseek.com](https://status.deepseek.com)
5. **Contact DeepSeek support** if API key is definitely valid

---

## Debug Checklist

- [ ] API key starts with `sk-`
- [ ] API key is valid (test with curl or test script)
- [ ] API key is saved in Profile → AI Settings
- [ ] Provider is set to "deepseek" or "auto"
- [ ] Server logs show no errors
- [ ] Browser console shows no errors
- [ ] Encryption secret is set in `.env`
- [ ] Server has been restarted after `.env` changes
- [ ] Cache has been cleared
- [ ] Network can reach api.deepseek.com
- [ ] Model name is correct (deepseek-chat)

---

## Changes Made to Fix DeepSeek

The following files were updated to improve DeepSeek support:

1. **deepseekService.js**
   - Added better error handling
   - Added console logging for debugging
   - Added explicit `stream: false` parameter
   - Improved timeout handling

2. **authMiddleware.js**
   - Added `nvidia` provider to API keys mapping

3. **hybridAIService.js**
   - Added `nvidia` provider to system API keys

4. **aiRoutes.js**
   - Added debug info to `/api/ai/check` endpoint
   - Shows which providers have valid keys

5. **test-deepseek.js** (new file)
   - Standalone test script to verify API key

---

## Example Working Configuration

**.env file:**
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
API_KEY_ENCRYPTION_SECRET=ae84d89776a6f7c4a28e281623ac6cfb72154d4ff40d3553e7db4ce265bfff46
SYSTEM_DEEPSEEK_API_KEY=sk-your-real-deepseek-key
DEEPSEEK_MODEL=deepseek-chat
DEEPSEEK_TIMEOUT_MS=20000
APP_TEST_MODE=false
PORT=8000
```

**Profile → AI Settings:**
- Provider: DeepSeek
- API Key: sk-your-real-deepseek-key
- Status: ✅ Saved

**Expected behavior:**
- Module generates response using DeepSeek
- No error messages in console
- Response appears in output area

---

**Last Updated:** 2025
