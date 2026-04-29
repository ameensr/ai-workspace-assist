# .env Configuration Guide

## ✅ Step 1: Create .env File (DONE)

Your `.env` file has been created with a secure encryption secret!

---

## 📝 Step 2: Configure Supabase

### Get Your Supabase Credentials

1. Go to [supabase.com](https://supabase.com)
2. Open your project
3. Go to **Settings** → **API**
4. Copy these values:

```
Project URL: https://xxxxx.supabase.co
anon/public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Update .env

Open `.env` and replace:

```env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 🤖 Step 3: Add System AI Keys

You need **at least ONE** system API key for built-in AI to work.

### Option A: OpenAI (Recommended)

1. Go to [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Create new API key
3. Copy the key (starts with `sk-`)

Update `.env`:
```env
SYSTEM_OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxx
```

### Option B: Google Gemini (Free Tier Available)

1. Go to [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. Create API key
3. Copy the key

Update `.env`:
```env
SYSTEM_GEMINI_API_KEY=AIzaSyxxxxxxxxxxxxx
```

### Option C: Anthropic Claude

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Get API key
3. Copy the key (starts with `sk-ant-`)

Update `.env`:
```env
SYSTEM_CLAUDE_API_KEY=sk-ant-xxxxxxxxxxxxx
```

### Option D: DeepSeek (Cheap)

1. Go to [platform.deepseek.com](https://platform.deepseek.com)
2. Get API key
3. Copy the key

Update `.env`:
```env
SYSTEM_DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxx
```

---

## 🔍 Step 4: Verify Your .env File

Your `.env` should look like this:

```env
# Supabase Configuration
SUPABASE_URL=https://abcdefgh.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODAwMDAwMDAsImV4cCI6MTk5NTU3NjAwMH0.xxxxxxxxxxxxx

# API Key Encryption (ALREADY GENERATED)
API_KEY_ENCRYPTION_SECRET=ae84d89776a6f7c4a28e281623ac6cfb72154d4ff40d3553e7db4ce265bfff46

# System AI Keys (ADD AT LEAST ONE)
SYSTEM_OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxx
SYSTEM_GEMINI_API_KEY=AIzaSyxxxxxxxxxxxxx
SYSTEM_CLAUDE_API_KEY=sk-ant-xxxxxxxxxxxxx
SYSTEM_DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxx
SYSTEM_GROK_API_KEY=xai-xxxxxxxxxxxxx
SYSTEM_PERPLEXITY_API_KEY=pplx-xxxxxxxxxxxxx

# Runtime Behavior
APP_TEST_MODE=false
PORT=8000
```

---

## ✅ Checklist

- [x] `.env` file created
- [x] Encryption secret generated
- [ ] Supabase URL added
- [ ] Supabase anon key added
- [ ] At least ONE system AI key added

---

## 🧪 Test Configuration

After completing the steps above, test your setup:

```bash
# Start the server
node server-hybrid.js

# In another terminal, test health endpoint
curl http://localhost:8000/api/health
```

Expected response:
```json
{
  "ok": true,
  "aiServiceEnabled": true,
  "hybridMode": true,
  "systemAIConfigured": true  ← Should be true
}
```

If `systemAIConfigured: false`, you need to add at least one system AI key.

---

## 🚨 Common Issues

### Issue: "API key encryption secret is not configured"

**Solution**: The encryption secret is already set. If you see this error, make sure the `.env` file is in the root directory.

### Issue: "System AI is not configured"

**Solution**: Add at least one system API key (OpenAI, Gemini, Claude, or DeepSeek).

### Issue: "Supabase is not configured on server"

**Solution**: Add your Supabase URL and anon key to `.env`.

---

## 🔐 Security Notes

1. **Never commit .env to Git** - It's already in `.gitignore`
2. **Keep encryption secret safe** - It's used to encrypt user API keys
3. **Rotate system API keys** - Periodically update them for security
4. **Use environment variables in production** - Don't use `.env` files in production

---

## 📚 Next Steps

1. ✅ Configure `.env` (follow steps above)
2. Run database migrations: `supabase-credits-schema.sql`
3. Start server: `node server-hybrid.js`
4. Test with frontend

---

## 💡 Pro Tips

### Use Multiple System Keys

For better reliability, add multiple system AI keys:

```env
SYSTEM_OPENAI_API_KEY=sk-proj-xxxxx
SYSTEM_GEMINI_API_KEY=AIzaSyxxxxx
SYSTEM_DEEPSEEK_API_KEY=sk-xxxxx
```

The system will automatically fallback if one provider fails.

### Cost Optimization

**Cheapest Options**:
1. **DeepSeek** - Very cheap, good quality
2. **Gemini** - Free tier available
3. **OpenAI GPT-3.5** - Affordable

**Best Quality**:
1. **OpenAI GPT-4** - Best results
2. **Claude** - Great for analysis
3. **Gemini Pro** - Good balance

---

## 🆘 Need Help?

1. Check `.env` file exists in root directory
2. Verify all required fields are filled
3. Test with health endpoint
4. Check server logs for errors

---

**Your .env is ready!** Just add your Supabase credentials and at least one AI key. 🚀
