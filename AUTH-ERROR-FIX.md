# Authentication Error Fix - "Missing Supabase Session Token"

## ❌ ERROR

```
Error: missing supabase session token
```

## ✅ FIXED

The AI service now properly handles authentication by:

1. **Getting auth token from Supabase session**
2. **Including token in all API requests**
3. **Handling unauthenticated state gracefully**

---

## 🔧 WHAT WAS CHANGED

### Before (Broken)

```javascript
// ai-service.js - Missing authentication
const response = await fetch('/api/ai/generate', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
        // ❌ Missing Authorization header
    },
    body: JSON.stringify({ prompt, provider })
});
```

### After (Fixed)

```javascript
// ai-service.js - With authentication
async function getAuthToken() {
    if (!window.getCurrentSession) return '';
    const session = await window.getCurrentSession();
    return session?.access_token || '';
}

async function callAI({ provider, prompt, options }) {
    // ✅ Get auth token
    const token = await getAuthToken();
    if (!token) {
        throw new Error('Authentication required. Please log in.');
    }

    // ✅ Include token in request
    const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` // ✅ Token included
        },
        body: JSON.stringify({ prompt, provider })
    });
}
```

---

## 🚀 HOW TO TEST

### 1. Clear Browser Cache

```
1. Close all browser tabs
2. Press Ctrl+Shift+Delete
3. Select "All time"
4. Check "Cached images and files"
5. Click "Clear data"
6. Close browser
7. Reopen browser
```

### 2. Login to Application

```
1. Go to http://localhost:8000
2. Login with your credentials
3. Verify you're redirected to dashboard
```

### 3. Test AI Generation

```
1. Go to any module (e.g., Requirement Intelligence)
2. Enter some text
3. Click "Generate" button
4. Verify AI response is generated
5. Check browser console - should see no errors
```

### 4. Verify Token is Sent

**Open Browser DevTools**:
1. Press F12
2. Go to "Network" tab
3. Click "Generate" in any module
4. Find request to `/api/ai/generate`
5. Click on it
6. Go to "Headers" tab
7. Verify "Authorization: Bearer ..." header is present

---

## 🔍 DEBUGGING

### Check if User is Logged In

```javascript
// Open browser console (F12)
const session = await window.getCurrentSession();
console.log('Session:', session);
console.log('Token:', session?.access_token);
```

**Expected Output**:
```javascript
Session: {
    access_token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    user: { id: "...", email: "..." }
}
Token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Check if AI Service is Loaded

```javascript
// Open browser console (F12)
console.log('AIService:', window.AIService);
console.log('callAI:', typeof window.AIService.callAI);
```

**Expected Output**:
```javascript
AIService: { callAI: ƒ, callAIWithFallback: ƒ, ... }
callAI: "function"
```

### Test AI Service Manually

```javascript
// Open browser console (F12)
const provider = window.AIService.getUserSelectedProvider();
console.log('Provider:', provider);

const result = await window.AIService.callAI({
    provider: 'openai',
    prompt: 'Say hello',
    options: { module: 'test' }
});
console.log('Result:', result);
```

**Expected Output**:
```javascript
Provider: "openai"
Result: "Hello! How can I help you today?"
```

---

## ⚠️ COMMON ISSUES

### Issue 1: "Authentication required. Please log in."

**Cause**: User is not logged in or session expired

**Solution**:
1. Logout (if logged in)
2. Clear browser cache
3. Login again
4. Try generating AI content

### Issue 2: "Unauthorized" (401 error)

**Cause**: Invalid or expired token

**Solution**:
1. Logout
2. Login again
3. If issue persists, check Supabase configuration

### Issue 3: "window.getCurrentSession is not a function"

**Cause**: auth.js not loaded properly

**Solution**:
1. Check browser console for script loading errors
2. Verify `auth.js` is loaded before `ai-service.js`
3. Hard refresh page (Ctrl+F5)

### Issue 4: Token is undefined

**Cause**: Supabase session not initialized

**Solution**:
```javascript
// Check Supabase client
console.log('Supabase:', window.supabaseClient);

// Check session
const { data, error } = await window.supabaseClient.auth.getSession();
console.log('Session data:', data);
console.log('Session error:', error);
```

---

## 📋 VERIFICATION CHECKLIST

After the fix, verify:

- [ ] User can login successfully
- [ ] Dashboard loads without errors
- [ ] Browser console shows no authentication errors
- [ ] AI generation works in all modules
- [ ] Network tab shows Authorization header in requests
- [ ] Token is valid and not expired
- [ ] Session persists across page refreshes

---

## 🎯 ROOT CAUSE

The original `ai-service.js` was missing authentication token handling. The backend requires a valid Supabase session token in the `Authorization` header for all `/api/ai/generate` requests.

**Backend Requirement** (from `authMiddleware.js`):
```javascript
export async function authMiddleware(req, res, next) {
    const ctx = getSupabaseContext(req); // Gets token from Authorization header
    if (!ctx) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    // ... validates token with Supabase
}
```

**Frontend Fix** (in `ai-service.js`):
```javascript
// Now includes token in all requests
const token = await getAuthToken();
const response = await fetch('/api/ai/generate', {
    headers: {
        'Authorization': `Bearer ${token}` // ✅ Token included
    }
});
```

---

## ✅ SOLUTION SUMMARY

1. ✅ Added `getAuthToken()` function to get Supabase session token
2. ✅ Modified `callAI()` to include token in Authorization header
3. ✅ Added authentication check before making requests
4. ✅ Updated `checkAIStatus()` to include token
5. ✅ Added proper error handling for unauthenticated state

**The error "missing supabase session token" is now fixed!**
