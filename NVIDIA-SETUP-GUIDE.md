# 🟢 NVIDIA API Integration - Complete Guide

## ✅ NVIDIA SUPPORT ADDED

NVIDIA NIM (NVIDIA Inference Microservices) is now fully integrated!

---

## 🚀 QUICK SETUP

### Step 1: Get NVIDIA API Key

1. **Go to**: https://build.nvidia.com/
2. **Sign in** with NVIDIA account (or create one)
3. **Navigate to**: "API Keys" or "My Account"
4. **Generate** new API key
5. **Copy** the key (starts with `nvapi-`)

### Step 2: Add to Your App

1. **Open**: http://localhost:8000/profile.html
2. **Click**: "AI Settings" tab
3. **Select**: "NVIDIA" from provider dropdown
4. **Paste**: Your NVIDIA API key
5. **Click**: "Test Connection" (optional)
6. **Click**: "Save"

### Step 3: Test

1. Go to any module (e.g., Test Case Architect)
2. Generate test cases
3. Check status: "🟢 NVIDIA Connected | Source: Live (NVIDIA)"

---

## 🎯 NVIDIA MODELS AVAILABLE

### Default Model
```
meta/llama-3.1-70b-instruct
```

### Other Popular Models
- `meta/llama-3.1-405b-instruct` - Largest, most capable
- `meta/llama-3.1-8b-instruct` - Fastest, cheapest
- `mistralai/mixtral-8x7b-instruct-v0.1` - Good balance
- `google/gemma-2-27b-it` - Google's model
- `microsoft/phi-3-medium-128k-instruct` - Long context

### Change Model (Optional)

Add to `.env`:
```env
NVIDIA_MODEL=meta/llama-3.1-405b-instruct
```

Or in code, it will use the default.

---

## 💰 PRICING

### Free Tier
- **Credits**: 1,000 free credits on signup
- **Rate Limit**: Varies by model
- **Duration**: Credits don't expire

### Paid Tier
- **Pay-as-you-go**: After free credits
- **Cost**: ~$0.001 - $0.01 per request (model dependent)
- **No subscription**: Only pay for what you use

### Cost Comparison

| Model | Cost per 1M tokens | Speed |
|-------|-------------------|-------|
| Llama 3.1 8B | $0.20 | Fast |
| Llama 3.1 70B | $0.88 | Medium |
| Llama 3.1 405B | $5.32 | Slow |

**Recommendation**: Use 70B for best balance

---

## 🔧 CONFIGURATION

### Environment Variables

Add to `.env`:

```env
# NVIDIA Configuration
SYSTEM_NVIDIA_API_KEY=nvapi-your-key-here
NVIDIA_MODEL=meta/llama-3.1-70b-instruct
NVIDIA_TIMEOUT_MS=30000
```

### Available Models

Check available models:
```bash
curl https://integrate.api.nvidia.com/v1/models \
  -H "Authorization: Bearer YOUR_NVIDIA_KEY"
```

---

## 🧪 TESTING

### Test 1: Validate API Key

```bash
curl https://integrate.api.nvidia.com/v1/models \
  -H "Authorization: Bearer nvapi-YOUR-KEY"
```

**Expected**: List of available models

### Test 2: Test Generation

```bash
curl https://integrate.api.nvidia.com/v1/chat/completions \
  -H "Authorization: Bearer nvapi-YOUR-KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "meta/llama-3.1-70b-instruct",
    "messages": [{"role": "user", "content": "Hello"}],
    "max_tokens": 100
  }'
```

**Expected**: AI response

### Test 3: In Application

1. Add NVIDIA key in Settings
2. Generate test cases
3. Check browser console (F12)
4. Should see: `✅ AI Response: { provider: 'nvidia' }`

---

## 🚨 TROUBLESHOOTING

### Issue 1: "Invalid API Key"

**Causes**:
- Key is incorrect
- Key is expired
- Key doesn't have proper format

**Solutions**:
1. Verify key starts with `nvapi-`
2. Regenerate key from NVIDIA dashboard
3. Check for extra spaces when copying
4. Try testing with curl command above

### Issue 2: "Model Not Found"

**Cause**: Model name is incorrect

**Solution**:
```env
# Use correct model name
NVIDIA_MODEL=meta/llama-3.1-70b-instruct

# NOT:
NVIDIA_MODEL=llama-3.1-70b  # ❌ Wrong
```

### Issue 3: "Rate Limit Exceeded"

**Cause**: Too many requests

**Solutions**:
1. Wait 1 minute and retry
2. Upgrade to paid tier
3. Use smaller model (8B instead of 405B)
4. Add multiple providers for failover

### Issue 4: "Connection Timeout"

**Cause**: NVIDIA API is slow or down

**Solutions**:
1. Increase timeout in `.env`:
```env
NVIDIA_TIMEOUT_MS=60000  # 60 seconds
```
2. Check NVIDIA status: https://status.nvidia.com
3. Try different model (smaller = faster)

### Issue 5: "NVIDIA Not in Dropdown"

**Cause**: Server not restarted after adding support

**Solution**:
```bash
# Stop server (Ctrl+C)
node server.js

# Clear browser cache (Ctrl+Shift+Delete)
# Refresh page (Ctrl+F5)
```

---

## 📊 PERFORMANCE

### Response Times

| Model | Avg Response Time | Quality |
|-------|------------------|---------|
| Llama 3.1 8B | 1-2 seconds | Good |
| Llama 3.1 70B | 3-5 seconds | Excellent |
| Llama 3.1 405B | 10-15 seconds | Best |

### Recommendations

**For Speed**: Use 8B model
```env
NVIDIA_MODEL=meta/llama-3.1-8b-instruct
```

**For Quality**: Use 70B model (default)
```env
NVIDIA_MODEL=meta/llama-3.1-70b-instruct
```

**For Best Results**: Use 405B model
```env
NVIDIA_MODEL=meta/llama-3.1-405b-instruct
```

---

## 🎯 BEST PRACTICES

### 1. Multi-Provider Setup

Configure multiple providers for redundancy:

```
Profile → AI Settings:

Provider: Auto

API Keys:
✅ NVIDIA: nvapi-xxxxx (Primary)
✅ Gemini: AIzaSyxxxxx (Backup)
✅ DeepSeek: sk-xxxxx (Cheap backup)
```

### 2. Model Selection

Choose based on use case:

**Test Case Generation**: 70B (balanced)
**Bug Reports**: 70B (detailed)
**Quick Corrections**: 8B (fast)
**Complex Analysis**: 405B (thorough)

### 3. Cost Optimization

```env
# Use 8B for most tasks (cheap)
NVIDIA_MODEL=meta/llama-3.1-8b-instruct

# Switch to 70B only when needed
```

### 4. Error Handling

Always have backup provider:
- Primary: NVIDIA
- Backup: Gemini (free)
- Emergency: DeepSeek (cheap)

---

## 🔍 VERIFICATION

### Check Integration

```bash
# 1. Restart server
node server.js

# 2. Check health endpoint
curl http://localhost:8000/api/health

# Should show:
{
  "ok": true,
  "aiServiceEnabled": true,
  "hybridMode": true,
  "systemAIConfigured": true
}
```

### Verify in UI

1. Go to Profile → AI Settings
2. Provider dropdown should include "NVIDIA"
3. Add NVIDIA key
4. Click "Test Connection"
5. Should show: "✅ Connection successful"

### Test Generation

1. Go to Test Case Architect
2. Enter requirement
3. Click "Generate"
4. Check status: "🟢 NVIDIA Connected | Source: Live (NVIDIA)"
5. Check console: `✅ AI Response: { provider: 'nvidia' }`

---

## 📚 NVIDIA NIM FEATURES

### Advantages

✅ **Free Credits**: 1,000 credits on signup
✅ **Multiple Models**: Choose based on need
✅ **Fast Inference**: Optimized for speed
✅ **High Quality**: State-of-the-art models
✅ **No Rate Limits**: (on paid tier)
✅ **Pay-as-you-go**: No subscription needed

### Disadvantages

⚠️ **Requires Account**: Need NVIDIA account
⚠️ **Limited Free Tier**: 1,000 credits
⚠️ **Model Specific**: Need to choose right model

---

## 🎉 SUMMARY

### What Was Added

1. ✅ NVIDIA provider support
2. ✅ API key validation
3. ✅ Model configuration
4. ✅ Error handling
5. ✅ Auto-detection of NVIDIA keys
6. ✅ Integration with hybrid system

### How to Use

```
1. Get NVIDIA API key: https://build.nvidia.com/
2. Add to Settings: Profile → AI Settings → NVIDIA
3. Test: Generate test cases
4. Verify: Check status shows "NVIDIA Connected"
```

### Recommended Setup

```
Provider: Auto
Keys:
- NVIDIA (primary)
- Gemini (backup)
- DeepSeek (cheap backup)

Model: meta/llama-3.1-70b-instruct (default)
```

---

## 🆘 SUPPORT

### Get Help

1. **NVIDIA Docs**: https://docs.nvidia.com/nim/
2. **API Reference**: https://build.nvidia.com/docs
3. **Status Page**: https://status.nvidia.com
4. **Support**: https://developer.nvidia.com/support

### Common Links

- **Dashboard**: https://build.nvidia.com/
- **API Keys**: https://build.nvidia.com/account
- **Models**: https://build.nvidia.com/explore
- **Pricing**: https://build.nvidia.com/pricing

---

**NVIDIA is now fully integrated and ready to use!** 🚀

Get your API key and start generating with state-of-the-art models!
