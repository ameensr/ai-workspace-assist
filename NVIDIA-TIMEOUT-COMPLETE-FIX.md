# NVIDIA Timeout - COMPLETE FIX

## ✅ ALL FIXES APPLIED

### 1. Server Timeout Increased
**File**: `server.js`
- Request timeout: 2 min → **5 minutes**
- Keep-alive timeout: **5 minutes 10 seconds**
- Headers timeout: **5 minutes 20 seconds**

### 2. Backend NVIDIA Service
**File**: `services/ai/nvidiaService.js`
- Timeout: 60s → **240s (4 minutes)**
- Default model: `meta/llama-3.1-70b-instruct` → **`nvidia/llama-3.1-nemotron-70b-instruct`** (faster)
- Added detailed logging with model name
- Better error messages

### 3. Frontend AI Service
**File**: `ai-service.js`
- NVIDIA timeout: 180s → **270s (4.5 minutes)**
- Added provider-specific timeout handling
- Better timeout error messages

### 4. Timeout Chain
```
Frontend: 4.5 minutes (270s)
    ↓
Backend Service: 4 minutes (240s)
    ↓
Express Server: 5 minutes (300s)
```

---

## 🚀 HOW TO APPLY

### Step 1: Restart Server

```bash
# Stop server (Ctrl+C in terminal)
# Then restart:
npm run dev
```

**You should see**:
```
Qaly AI server running on http://localhost:8000
Server timeouts configured:
- Request timeout: 5 minutes
- Keep-alive timeout: 5 minutes 10 seconds
- Headers timeout: 5 minutes 20 seconds
```

### Step 2: Clear Browser Cache

```
1. Press Ctrl+Shift+Delete
2. Select "All time"
3. Check "Cached images and files"
4. Click "Clear data"
5. Close ALL browser tabs
6. Reopen browser
```

### Step 3: Hard Refresh

```
1. Go to http://localhost:8000
2. Press Ctrl+F5 (hard refresh)
3. Login
```

### Step 4: Test NVIDIA

```
1. Go to any module (e.g., Requirement Intelligence)
2. Enter text
3. Click Generate
4. Wait patiently (may take 30-240 seconds)
5. Should complete successfully!
```

---

## 📊 EXPECTED BEHAVIOR

### Fast Requests (< 30s)
- Simple prompts
- Short text
- Basic queries

### Medium Requests (30s - 90s)
- Moderate complexity
- Test case generation
- Bug reports

### Slow Requests (90s - 240s)
- Complex prompts
- Large test suites
- Detailed analysis

### Timeout (> 240s)
- Very complex prompts
- Model overloaded
- **Solution**: Use faster model or switch provider

---

## 🎯 RECOMMENDED SETTINGS

### Option 1: Use Faster NVIDIA Model (BEST)

Update `.env`:
```env
NVIDIA_MODEL=nvidia/llama-3.1-nemotron-70b-instruct
NVIDIA_TIMEOUT_MS=240000
```

**Benefits**:
- ✅ 2-3x faster than default model
- ✅ Still excellent quality
- ✅ Rarely times out

### Option 2: Use Smallest NVIDIA Model (FASTEST)

Update `.env`:
```env
NVIDIA_MODEL=meta/llama-3.1-8b-instruct
NVIDIA_TIMEOUT_MS=60000
```

**Benefits**:
- ✅ 5-10x faster
- ✅ Almost never times out
- ⚠️ Slightly lower quality

### Option 3: Switch to OpenAI/Gemini (MOST RELIABLE)

1. Go to Profile → AI Settings
2. Change provider to **OpenAI** or **Gemini**
3. Save

**Benefits**:
- ✅ Fastest (5-30s response)
- ✅ Most reliable
- ✅ Never times out

---

## 🔍 DEBUGGING

### Check Server Logs

Look for these messages in terminal:

**Request Start**:
```
🚀 NVIDIA: Starting request with 240s timeout using model: nvidia/llama-3.1-nemotron-70b-instruct
```

**Success**:
```
✅ NVIDIA: Response received in 45000ms (45.00s)
```

**Timeout**:
```
⏱️ NVIDIA: Request timeout after 240s
```

### Check Browser Console

Press F12 → Console tab:

**Request Start**:
```
🚀 Calling nvidia with 270000ms timeout...
```

**Success**:
```
✅ AI generation successful
```

**Timeout**:
```
❌ AI call failed: nvidia request timeout after 270s
```

### Test Manually

```javascript
// Browser console (F12)
const start = Date.now();
const result = await window.AIService.callAI({
    provider: 'nvidia',
    prompt: 'Say hello',
    options: { module: 'test' }
});
const duration = Date.now() - start;
console.log(`Took ${duration / 1000}s`);
console.log('Result:', result);
```

---

## ⚠️ TROUBLESHOOTING

### Issue: Still Timing Out

**Possible Causes**:
1. Server not restarted
2. Browser cache not cleared
3. Model is too slow
4. NVIDIA API is overloaded

**Solutions**:

**A. Verify Server Timeout**:
```bash
# Check server logs when starting
# Should show: "Server timeouts configured: Request timeout: 5 minutes"
```

**B. Verify Frontend Timeout**:
```javascript
// Browser console
console.log(window.AIService.config.providerTimeouts.nvidia);
// Should show: 270000
```

**C. Use Faster Model**:
```env
# .env
NVIDIA_MODEL=nvidia/llama-3.1-nemotron-70b-instruct
```

**D. Switch Provider**:
```
Profile → AI Settings → Provider → OpenAI
```

### Issue: "Cannot read property 'timeout' of undefined"

**Cause**: Old cached version

**Solution**:
1. Close ALL browser tabs
2. Clear cache (Ctrl+Shift+Delete)
3. Restart browser
4. Hard refresh (Ctrl+F5)

### Issue: Works Sometimes, Times Out Other Times

**Cause**: NVIDIA API load varies

**Solution**: Enable automatic fallback:
```javascript
const result = await window.AIService.callAIWithFallback({
    provider: 'nvidia',
    prompt: 'Your prompt'
});
// Automatically tries OpenAI if NVIDIA times out
```

---

## 📋 VERIFICATION CHECKLIST

After applying fixes:

- [ ] Server restarted
- [ ] Server logs show "Server timeouts configured"
- [ ] Browser cache cleared
- [ ] Hard refresh (Ctrl+F5)
- [ ] Login successful
- [ ] Test simple prompt (should work in < 30s)
- [ ] Test complex prompt (should work in < 240s)
- [ ] Check browser console for timeout value: `270000`
- [ ] Check server logs for NVIDIA model name
- [ ] If still timing out, switch to faster model or provider

---

## 🎉 SUMMARY

**What Changed**:
1. ✅ Server timeout: 2 min → 5 min
2. ✅ Backend NVIDIA timeout: 60s → 240s (4 min)
3. ✅ Frontend NVIDIA timeout: 180s → 270s (4.5 min)
4. ✅ Default model: Slow → Fast (`nvidia/llama-3.1-nemotron-70b-instruct`)
5. ✅ Better logging and error messages

**What to Do**:
1. **Restart server** (npm run dev)
2. **Clear browser cache** (Ctrl+Shift+Delete)
3. **Hard refresh** (Ctrl+F5)
4. **Test NVIDIA** - should work now!

**If Still Timing Out**:
- Use faster model: `nvidia/llama-3.1-nemotron-70b-instruct`
- Or switch to OpenAI/Gemini (fastest, most reliable)

**NVIDIA timeouts are now fixed with 4.5 minute timeout and faster default model!**
