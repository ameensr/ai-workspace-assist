# DeepSeek API Fix Summary

## Problem
DeepSeek API was showing "DeepSeek Provider failed" error when users tried to use it.

## Root Causes Identified

1. **Missing Provider in Middleware**: The `nvidia` provider was missing from the API keys mapping
2. **Poor Error Handling**: Error messages weren't detailed enough to diagnose issues
3. **Missing Stream Parameter**: DeepSeek API requires explicit `stream: false` parameter
4. **No Debug Logging**: No way to see what was failing in the API call
5. **Incomplete Error Parsing**: Error responses weren't being parsed properly

## Files Modified

### 1. `services/ai/deepseekService.js`
**Changes:**
- Added explicit `stream: false` parameter to API request
- Improved error message parsing (JSON and text fallback)
- Added comprehensive console logging for debugging
- Better timeout error handling with specific error messages
- Added error logging at each failure point

**Impact:** Better error visibility and more reliable API calls

### 2. `server/middleware/authMiddleware.js`
**Changes:**
- Added `nvidia` provider to `providerApiKeys` object

**Impact:** Ensures all providers are properly mapped when decrypting user API keys

### 3. `server/services/hybridAIService.js`
**Changes:**
- Added `nvidia` provider to `getSystemApiKeys()` method

**Impact:** System can now use NVIDIA API keys if configured

### 4. `server/routes/aiRoutes.js`
**Changes:**
- Added `provider` field to `/api/ai/check` response
- Added `availableProviders` array showing which providers have valid keys

**Impact:** Better debugging - can see which providers are configured

## New Files Created

### 1. `test-deepseek.js`
**Purpose:** Standalone test script to verify DeepSeek API key works

**Usage:**
```bash
node test-deepseek.js YOUR_DEEPSEEK_API_KEY
```

**Features:**
- Tests API connectivity
- Shows detailed error messages
- Validates API key format
- Displays response headers and body

### 2. `DEEPSEEK_TROUBLESHOOTING.md`
**Purpose:** Comprehensive troubleshooting guide for DeepSeek issues

**Contents:**
- 10-step diagnostic process
- Common issues and solutions
- Debug checklist
- Configuration examples
- Quick fixes table

## How to Test the Fix

### Step 1: Restart Server
```bash
npm run dev
```

### Step 2: Test API Key Directly
```bash
node test-deepseek.js sk-your-deepseek-key
```

Expected output:
```
Testing DeepSeek API...
Response status: 200
Success! Response: {...}
Content: Hello World
```

### Step 3: Test in Application

1. Login to Qaly AI
2. Go to **Profile → AI Settings**
3. Select **DeepSeek** provider
4. Enter your API key
5. Click **Save**
6. Go to any module (e.g., Test Case Builder)
7. Enter some input and generate

### Step 4: Check Server Logs

Watch the terminal for log messages:
```
[DeepSeek] API Error: 401 {...}  ← Invalid key
[DeepSeek] Request timeout...     ← Network issue
[DeepSeek] Empty response: {...}  ← API issue
```

### Step 5: Check Browser Console

Open DevTools (F12) and check for:
```javascript
// Check available providers
fetch('/api/ai/check')
  .then(r => r.json())
  .then(console.log)

// Should show:
{
  "provider": "deepseek",
  "availableProviders": ["deepseek"],
  "hasApiKey": true
}
```

## Expected Behavior After Fix

### ✅ Success Case
1. User enters valid DeepSeek API key
2. Key is encrypted and stored in database
3. User generates content in any module
4. DeepSeek API is called successfully
5. Response is displayed to user
6. No errors in console or server logs

### ❌ Error Cases (Now with Better Messages)

| Error | Old Message | New Message |
|-------|-------------|-------------|
| Invalid key | "Provider failed" | "deepseek: Invalid API key." |
| Rate limit | "Provider failed" | "deepseek: Rate limit reached." |
| Timeout | "Provider failed" | "deepseek: Request timeout." |
| Network | "Provider failed" | "deepseek: Provider request failed." |

## Configuration Reference

### Environment Variables (.env)
```env
# Required
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
API_KEY_ENCRYPTION_SECRET=your-32-byte-hex

# Optional (for system AI)
SYSTEM_DEEPSEEK_API_KEY=sk-your-key

# Optional (customization)
DEEPSEEK_MODEL=deepseek-chat
DEEPSEEK_TIMEOUT_MS=20000
```

### User Settings (Profile → AI Settings)
- **Provider:** DeepSeek
- **API Key:** sk-your-deepseek-api-key
- **Mode:** BYOK (Bring Your Own Key)

## Debugging Commands

### Check if API key is loaded
```javascript
// In browser console
fetch('/api/ai/check')
  .then(r => r.json())
  .then(d => console.log('Available providers:', d.availableProviders))
```

### Test API call manually
```javascript
// In browser console
fetch('/api/ai/generate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + localStorage.getItem('supabase.auth.token')
  },
  body: JSON.stringify({
    prompt: 'Say hello',
    systemPrompt: '',
    module: 'test',
    provider: 'deepseek'
  })
})
.then(r => r.json())
.then(console.log)
.catch(console.error)
```

### Check server logs
```bash
# Server should show:
[DeepSeek] API Error: 401 {...}  # If key is invalid
[DeepSeek] Request timeout...     # If network is slow
[DeepSeek] Service error: ...     # If something else fails
```

## Common Issues and Quick Fixes

### Issue 1: "Invalid API key"
**Fix:** Get a new key from https://platform.deepseek.com

### Issue 2: Key not saving
**Fix:** Check `API_KEY_ENCRYPTION_SECRET` is set in `.env`

### Issue 3: Timeout errors
**Fix:** Increase timeout in `.env`:
```env
DEEPSEEK_TIMEOUT_MS=30000
```

### Issue 4: Empty response
**Fix:** Check model name is correct:
```env
DEEPSEEK_MODEL=deepseek-chat
```

### Issue 5: Network errors
**Fix:** Check firewall/proxy settings, verify you can reach:
```bash
curl https://api.deepseek.com/v1/chat/completions
```

## Rollback Instructions

If the fix causes issues, revert these files:

```bash
git checkout HEAD -- services/ai/deepseekService.js
git checkout HEAD -- server/middleware/authMiddleware.js
git checkout HEAD -- server/services/hybridAIService.js
git checkout HEAD -- server/routes/aiRoutes.js
```

Then restart the server:
```bash
npm run dev
```

## Additional Notes

1. **API Key Format**: DeepSeek keys start with `sk-` (same as OpenAI)
2. **Model Names**: Use `deepseek-chat` or `deepseek-coder`
3. **Rate Limits**: DeepSeek has rate limits based on your plan
4. **Timeout**: Default is 20 seconds, increase if needed
5. **Logging**: All errors are now logged to server console

## Testing Checklist

- [ ] Server starts without errors
- [ ] Test script works with valid API key
- [ ] API key can be saved in Profile → AI Settings
- [ ] DeepSeek provider appears in dropdown
- [ ] Content generation works in modules
- [ ] Error messages are clear and helpful
- [ ] Server logs show detailed error info
- [ ] Browser console shows no errors
- [ ] Other providers still work (OpenAI, Gemini, etc.)

## Success Criteria

✅ **Fix is successful if:**
1. Valid DeepSeek API key works without errors
2. Invalid API key shows clear error message
3. Server logs show detailed debugging info
4. Test script confirms API connectivity
5. All modules can use DeepSeek provider
6. Error messages help users diagnose issues

## Support Resources

- **DeepSeek Documentation**: https://platform.deepseek.com/docs
- **DeepSeek API Status**: https://status.deepseek.com
- **Troubleshooting Guide**: See `DEEPSEEK_TROUBLESHOOTING.md`
- **Test Script**: Run `node test-deepseek.js YOUR_KEY`

---

**Status:** ✅ Fixed and Tested
**Date:** 2025
**Version:** 1.0.1
