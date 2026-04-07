# 🏗️ QA Architect - AI-Powered Testing Assistant

## 📋 Overview

QA Architect is a professional AI-powered tool for software testers and business analysts. It uses Claude AI (Anthropic) to:

- ✅ **Requirement Intelligence** - Analyze and improve requirements with gap detection
- ✅ **Test Suite Architect** - Generate comprehensive test cases automatically
- ✅ **Professional Case Architect** - Transform rough notes into structured test cases
- ✅ **Bug Report Generator** - Create JIRA-ready bug reports from rough descriptions
- ✅ **Sentence Correction** - Improve grammar and tone in technical documentation

---

## 🚀 Quick Start (3 Steps)

### Step 1: Get Your API Key

1. Go to [console.anthropic.com](https://console.anthropic.com/)
2. Sign up or log in
3. Navigate to **API Keys**
4. Click **Create Key**
5. Copy your API key (starts with `sk-ant-...`)

💰 **Cost**: ~$3 per 1 million tokens (very affordable for testing work)

### Step 2: Deploy to Vercel (FREE)

**Option A: Deploy via GitHub (Recommended)**

1. Create a GitHub account (if you don't have one)
2. Create a new repository called `qa-architect`
3. Upload all these files to the repository:
   - `index.html`
   - `login.html`
   - `signup.html`
   - `app.js`
   - `vercel.json`
   - `package.json`

4. Go to [vercel.com](https://vercel.com)
5. Click **Add New Project**
6. Import your GitHub repository
7. Click **Deploy**

**Option B: Deploy via Vercel CLI**

```bash
# Install Vercel CLI
npm install -g vercel

# Navigate to project folder
cd qa-architect

# Deploy
vercel --prod
```

### Step 3: Use the Application

1. Open your deployed URL (e.g., `https://qa-architect.vercel.app`)
2. When prompted, enter your Anthropic API key
3. Start using AI-powered QA tools!

---

## 📁 Project Structure

```
qa-architect/
├── index.html          # Main dashboard (all modules)
├── login.html          # Login page
├── signup.html         # Signup page
├── app.js             # AI integration + app logic
├── vercel.json        # Deployment config
├── package.json       # Project metadata
└── README.md          # This file
```

---

## 🛠️ Features Explained

### 1. Requirement Intelligence
**What it does**: Takes rough requirements and outputs:
- Corrected/improved specification
- Gap analysis (missing edge cases)
- Test scenario suggestions

**Use case**: Before sprint planning, paste user stories to get professional analysis

### 2. Test Suite Architect
**What it does**: Generates 15-20 comprehensive test cases in Excel format
- Covers positive, negative, boundary, security cases
- Outputs pipe-separated format for direct Excel paste

**Use case**: Speed up test case creation from 2 hours to 2 minutes

### 3. Professional Case Architect
**What it does**: Transforms "verify login with blank password" into:
- Structured test objective
- Detailed preconditions
- Step-by-step instructions
- Expected results

**Use case**: Convert rough notes into professional test documentation

### 4. Bug Report Generator
**What it does**: Converts rough bug descriptions into JIRA-ready reports with:
- Professional title
- Severity classification
- Steps to reproduce
- Expected vs actual results

**Use case**: Save time writing bug reports during testing sprints

### 5. Sentence Correction
**What it does**: Improves any sentence with:
- Grammar correction
- Casual tone variant
- Formal/business tone variant

**Use case**: Polish technical documentation and emails

---

## 💡 How It Works

1. **Frontend Only**: Pure HTML/CSS/JavaScript (no backend needed)
2. **AI Integration**: Direct API calls to Anthropic Claude
3. **API Key Storage**: Saved in browser localStorage (secure, never sent to our servers)
4. **Zero Cost Hosting**: Vercel's free tier is perfect for this use case

---

## 🔐 Security & Privacy

- ✅ **Your API key** is stored only in your browser (localStorage)
- ✅ **No data collection** - we don't have a backend
- ✅ **Direct API calls** - your data goes straight to Anthropic, not through us
- ✅ **Open source** - you can audit all code

---

## 🌐 Alternative Deployment Options

### Option 1: Netlify (FREE)
1. Create account at [netlify.com](https://netlify.com)
2. Drag and drop your project folder
3. Done!

### Option 2: GitHub Pages (FREE)
1. Push code to GitHub repository
2. Go to Settings → Pages
3. Select branch `main` and folder `/` (root)
4. Save

### Option 3: Cloudflare Pages (FREE)
1. Create account at [pages.cloudflare.com](https://pages.cloudflare.com)
2. Connect GitHub repository
3. Deploy

---

## 🐛 Troubleshooting

### "API request failed"
- **Check your API key** is correct (starts with `sk-ant-`)
- **Check your balance** at console.anthropic.com
- **Check internet connection**

### "Please set your API key first"
- Click the **Settings** icon in sidebar
- Enter your Anthropic API key
- Click **Save & Continue**

### "Module not loading"
- **Clear browser cache** (Ctrl+Shift+R or Cmd+Shift+R)
- **Check console** for errors (F12 → Console tab)

---

## 📊 Pricing Breakdown

**Anthropic Claude API:**
- Model: Claude Sonnet 4
- Cost: ~$3 per million input tokens, ~$15 per million output tokens
- **Typical usage**: 
  - 1 test suite generation = ~2,000 tokens = $0.03
  - 100 analyses/day = ~$3/day
  - For most QA teams: **$50-100/month**

**Hosting: $0** (Vercel/Netlify/GitHub Pages free tier)

---

## 🚀 Future Enhancements (Coming Soon)

- [ ] Save/load history (IndexedDB)
- [ ] Export to PDF/Word
- [ ] Team collaboration features
- [ ] Custom AI prompts
- [ ] Integration with JIRA API

---

## 📞 Support

**Issues?**
- Check the [Troubleshooting](#-troubleshooting) section
- Review browser console for errors (F12)

**Want to contribute?**
- Fork the repository
- Make improvements
- Submit a pull request

---

## 📜 License

MIT License - Free to use, modify, and distribute

---

## 🎉 You're Ready!

Your AI-powered QA assistant is ready to deploy. Follow the 3 steps above and start automating your testing workflow!

**Need help?** Check Anthropic's documentation: [docs.anthropic.com](https://docs.anthropic.com)