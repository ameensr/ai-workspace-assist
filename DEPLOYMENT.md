# 🚀 DEPLOYMENT GUIDE - Step by Step

## Method 1: Deploy to Vercel (Recommended - Takes 5 minutes)

### Prerequisites
- GitHub account (free)
- Vercel account (free)
- Anthropic API key (from console.anthropic.com)

### Step-by-Step Instructions

#### STEP 1: Create GitHub Repository

1. Go to [github.com](https://github.com)
2. Click **"New Repository"** (green button)
3. Name it: `qa-architect`
4. Make it **Public**
5. Click **"Create Repository"**

#### STEP 2: Upload Your Files

**Option A: Using GitHub Website (Easiest)**
1. Click **"uploading an existing file"**
2. Drag and drop these 6 files:
   - `index.html`
   - `login.html`
   - `signup.html`
   - `app.js`
   - `vercel.json`
   - `package.json`
   - `README.md`
3. Click **"Commit changes"**

**Option B: Using Git Command Line**
```bash
# Navigate to your project folder
cd /path/to/qa-architect

# Initialize git
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit"

# Add remote (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/qa-architect.git

# Push to GitHub
git push -u origin main
```

#### STEP 3: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click **"Sign Up"** (use GitHub to sign in)
3. After logging in, click **"Add New Project"**
4. Click **"Import"** next to your `qa-architect` repository
5. **Project Settings:**
   - Framework Preset: **Other**
   - Root Directory: `./`
   - Leave everything else as default
6. Click **"Deploy"**
7. Wait 2-3 minutes...
8. ✅ Done! You'll get a URL like: `https://qa-architect.vercel.app`

#### STEP 4: Use Your Application

1. Visit your Vercel URL
2. Click **"API Settings"** in the sidebar
3. Enter your Anthropic API key (from console.anthropic.com)
4. Click **"Save & Continue"**
5. Start using AI-powered features! 🎉

---

## Method 2: Deploy to Netlify (Alternative)

### Step 1: Prepare Your Files
Make sure all 6 files are in one folder:
- index.html
- login.html  
- signup.html
- app.js
- vercel.json
- package.json

### Step 2: Deploy
1. Go to [netlify.com](https://netlify.com)
2. Sign up (free)
3. Click **"Add new site"** → **"Deploy manually"**
4. **Drag and drop** your project folder
5. Wait 1-2 minutes
6. ✅ Done! You'll get a URL like: `https://qa-architect-xyz.netlify.app`

---

## Method 3: Test Locally First

### Using Python (Built-in)
```bash
# Navigate to project folder
cd qa-architect

# Start server
python3 -m http.server 8000

# Open browser
# Visit: http://localhost:8000
```

### Using Node.js (If you have it)
```bash
# Install http-server globally
npm install -g http-server

# Navigate to project folder
cd qa-architect

# Start server
http-server -p 8000

# Visit: http://localhost:8000
```

---

## 🔑 Getting Your Anthropic API Key

1. Go to [console.anthropic.com](https://console.anthropic.com/)
2. Sign up or log in
3. Click **"API Keys"** in left sidebar
4. Click **"Create Key"**
5. Give it a name like "QA Architect"
6. Click **"Create Key"**
7. **COPY THE KEY** (starts with `sk-ant-`)
8. Save it somewhere safe (you can't see it again!)

**💰 Pricing:**
- $5 free credit when you sign up
- After that: ~$3 per million tokens
- For normal QA work: $20-50/month is typical

---

## ✅ Verification Checklist

After deployment, verify everything works:

- [ ] Can you access the login page?
- [ ] Can you navigate to the main dashboard?
- [ ] Can you open the API Settings modal?
- [ ] Can you save your API key?
- [ ] Can you generate a requirement analysis?
- [ ] Does the output appear correctly?

---

## 🐛 Common Issues & Fixes

### Issue: "API request failed"
**Fix:** 
- Check your API key is correct
- Verify you have credits at console.anthropic.com
- Check browser console for exact error

### Issue: "404 Not Found"
**Fix:**
- Make sure all files are uploaded
- Check file names are exactly: `index.html`, `app.js`, etc.
- No typos in filenames

### Issue: "API key modal won't close"
**Fix:**
- Enter a valid API key (starts with `sk-ant-`)
- Click "Save & Continue"
- Refresh the page

### Issue: "Modules not switching"
**Fix:**
- Clear browser cache (Ctrl+Shift+R)
- Check browser console for JavaScript errors

---

## 📱 Custom Domain (Optional)

### For Vercel:
1. Go to your project settings
2. Click **"Domains"**
3. Add your custom domain
4. Follow DNS instructions
5. Wait for SSL certificate (automatic)

### For Netlify:
1. Go to **"Domain settings"**
2. Click **"Add custom domain"**
3. Follow DNS instructions

---

## 🎯 Post-Deployment Tips

1. **Bookmark your URL** for easy access
2. **Share with your team** - they'll need their own API keys
3. **Monitor usage** at console.anthropic.com to track costs
4. **Enable 2FA** on your GitHub and Vercel accounts for security

---

## 🚀 You're Live!

Congratulations! Your QA Architect is now deployed and accessible worldwide.

**Your next steps:**
1. Start with the **Requirement Intelligence** module
2. Try generating test cases
3. Share with your QA team
4. Enjoy 10x faster test documentation! 🎉

---

## 📞 Need Help?

- **Vercel Docs:** [vercel.com/docs](https://vercel.com/docs)
- **Anthropic API Docs:** [docs.anthropic.com](https://docs.anthropic.com)
- **GitHub Help:** [docs.github.com](https://docs.github.com)