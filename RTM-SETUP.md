# RTM Generator - Quick Setup Guide

## 🚀 Installation Steps

### 1. Database Setup (One-Time)

Run these SQL scripts in Supabase SQL Editor:

```bash
# 1. Create RTM table and policies
supabase-rtm-schema.sql

# 2. Add RTM master prompt
supabase-rtm-prompt.sql
```

### 2. Verify Files

Ensure these files exist:
```
✅ rtm-generator.js          # Core module logic
✅ index.html                # Updated with RTM section
✅ app.js                    # Updated with routes
✅ RTM-GENERATOR-GUIDE.md    # Documentation
✅ RTM-SAMPLE-DATA.md        # Test data
```

### 3. Test the Module

1. Start the server:
```bash
npm run dev
```

2. Open browser:
```
http://localhost:8000
```

3. Navigate to RTM Generator from sidebar

4. Test with sample data from `RTM-SAMPLE-DATA.md`

---

## ✅ Verification Checklist

- [ ] RTM Generator appears in sidebar navigation
- [ ] Module loads when clicked
- [ ] Requirements input accepts text
- [ ] Test cases input accepts text
- [ ] File upload buttons work
- [ ] "Import from Builder" button works
- [ ] "Generate RTM" button triggers AI
- [ ] RTM table renders with mappings
- [ ] Metrics cards display correctly
- [ ] Insights section shows uncovered/orphans
- [ ] "Download Excel" exports file
- [ ] Clear button resets all data
- [ ] Navigation persistence works (refresh page)

---

## 🧪 Quick Test

### Test Input

**Requirements:**
```
User must be able to login with email and password
System should validate email format
Password must be at least 8 characters
```

**Test Cases:**
```
Verify login with valid credentials
Verify email format validation
Verify password minimum length
```

### Expected Output

- Coverage: 100%
- Covered: 3
- Uncovered: 0
- Orphans: 0
- Matrix shows 3x3 grid with checkmarks

---

## 🐛 Troubleshooting

### Issue: Module not appearing in sidebar
**Fix**: Clear browser cache, refresh page

### Issue: AI not responding
**Fix**: 
1. Check API key configured in Profile → AI Settings
2. Verify `APP_AI_MOCK_MODE=false` in `.env`
3. Check browser console for errors

### Issue: Excel export fails
**Fix**: Verify SheetJS library loaded (check browser console)

### Issue: Import from Builder fails
**Fix**: Generate test cases in Test Case Builder first

---

## 📊 API Endpoints Used

- `POST /api/ai/generate` - AI mapping generation
- `GET /api/module-prompt-status` - Prompt indicator
- Supabase RLS - Data persistence (future)

---

## 🎯 Next Steps

1. ✅ Test with real requirements and test cases
2. ✅ Verify Excel export formatting
3. ✅ Test file upload with PDF/DOCX
4. ✅ Test integration with Test Case Builder
5. ✅ Review AI mapping accuracy
6. ⏳ Add save/load functionality (future)
7. ⏳ Add manual mapping editing (future)

---

## 📝 Configuration

### Mock Mode Testing

To test without AI charges:

```env
# .env
APP_TEST_MODE=true
APP_AI_MOCK_MODE=true
```

Add to `test-config.js`:
```javascript
MOCK_RESPONSES.rtmGenerator = JSON.stringify({
  "mappings": [
    {"requirementId": "REQ-001", "testCaseIds": ["TC-001", "TC-002"]},
    {"requirementId": "REQ-002", "testCaseIds": ["TC-003"]},
    {"requirementId": "REQ-003", "testCaseIds": ["TC-004"]}
  ]
});
```

### Production Mode

```env
# .env
APP_TEST_MODE=false
APP_AI_MOCK_MODE=false
```

Configure AI provider in Profile → AI Settings

---

## 🎉 You're Ready!

The RTM Generator is now fully integrated and ready to use. Start by testing with the sample data, then use it with your real requirements and test cases.

**Need help?** Check `RTM-GENERATOR-GUIDE.md` for detailed documentation.
