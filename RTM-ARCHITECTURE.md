# RTM Generator - Architecture Diagram

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                          │
│                         (index.html)                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐ │
│  │  Requirements    │  │   Test Cases     │  │   Actions    │ │
│  │  Input Area      │  │   Input Area     │  │   Buttons    │ │
│  ├──────────────────┤  ├──────────────────┤  ├──────────────┤ │
│  │ • Manual Entry   │  │ • Manual Entry   │  │ • Generate   │ │
│  │ • File Upload    │  │ • File Upload    │  │ • Clear      │ │
│  │ • PDF/DOCX/TXT   │  │ • Import Builder │  │ • Download   │ │
│  └──────────────────┘  └──────────────────┘  └──────────────┘ │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              RTM Output Section                         │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │  ┌──────┬──────┬──────┬──────┐                         │   │
│  │  │ Cov% │Covrd │Uncov │Orphan│  ← Metrics Dashboard    │   │
│  │  └──────┴──────┴──────┴──────┘                         │   │
│  │                                                         │   │
│  │  ┌─────────────────────────────────────────────────┐   │   │
│  │  │  Req ID │ Description │ TC-01 │ TC-02 │ Status │   │   │
│  │  ├─────────┼─────────────┼───────┼───────┼────────┤   │   │
│  │  │ REQ-001 │ Login...    │   ✓   │   ✓   │Covered │   │   │
│  │  │ REQ-002 │ Validate... │       │   ✓   │Covered │   │   │
│  │  │ REQ-003 │ Reset...    │       │       │Uncovrd │   │   │
│  │  └─────────┴─────────────┴───────┴───────┴────────┘   │   │
│  │                    ↑ RTM Table                         │   │
│  │                                                         │   │
│  │  ┌──────────────────┐  ┌──────────────────┐           │   │
│  │  │ Uncovered Reqs   │  │ Orphan Test Cases│           │   │
│  │  │ • REQ-003: ...   │  │ • TC-015: ...    │           │   │
│  │  └──────────────────┘  └──────────────────┘           │   │
│  │                    ↑ Insights Section                  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND LOGIC LAYER                         │
│                    (rtm-generator.js)                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  parseRequirements()  →  Parse text into requirement objects   │
│  parseTestCases()     →  Parse text into test case objects     │
│  importFromBuilder()  →  Import from localStorage              │
│  generateRTM()        →  Orchestrate AI mapping                │
│  calculateMetrics()   →  Calculate coverage stats              │
│  renderRTM()          →  Render table and UI                   │
│  rtmDownloadExcel()   →  Generate Excel file                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    SHARED UTILITIES                             │
│                    (app.js)                                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  generateAI()              →  AI orchestration                 │
│  resolvePromptPayload()    →  Prompt governance                │
│  safeParseJSON()           →  JSON parsing                     │
│  handleRequirementUpload() →  File upload handling             │
│  showToast()               →  User notifications               │
│  setLoading()              →  Loading states                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND API LAYER                            │
│                    (server.js)                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  POST /api/ai/generate                                          │
│  ├─ Authenticate user (JWT)                                    │
│  ├─ Load user settings (API keys)                              │
│  ├─ Call AI provider                                           │
│  ├─ Log usage                                                  │
│  └─ Return response                                            │
│                                                                 │
│  GET /api/module-prompt-status                                 │
│  └─ Return prompt configuration status                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    AI PROVIDERS                                 │
│                    (services/ai/)                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │  Gemini  │  │  OpenAI  │  │  Claude  │  │ DeepSeek │      │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘      │
│                                                                 │
│  ┌──────────┐  ┌──────────┐                                   │
│  │   Grok   │  │Perplexity│                                   │
│  └──────────┘  └──────────┘                                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    DATABASE LAYER                               │
│                    (Supabase PostgreSQL)                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  rtm_reports                                                    │
│  ├─ id (UUID)                                                  │
│  ├─ user_id (UUID) ← RLS Policy                               │
│  ├─ report_name (TEXT)                                         │
│  ├─ requirements (JSONB)                                       │
│  ├─ test_cases (JSONB)                                         │
│  ├─ mappings (JSONB)                                           │
│  ├─ metrics (JSONB)                                            │
│  ├─ created_at (TIMESTAMPTZ)                                   │
│  └─ updated_at (TIMESTAMPTZ)                                   │
│                                                                 │
│  master_prompts                                                 │
│  ├─ module_key = 'rtmGenerator'                                │
│  ├─ prompt_content (TEXT)                                      │
│  ├─ status = 'ACTIVE'                                          │
│  └─ ...                                                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 Data Flow Diagram

```
┌──────────────┐
│     USER     │
└──────┬───────┘
       │
       │ 1. Enter Requirements & Test Cases
       ↓
┌──────────────────────────────────────┐
│  FRONTEND (rtm-generator.js)         │
│  • parseRequirements()               │
│  • parseTestCases()                  │
└──────┬───────────────────────────────┘
       │
       │ 2. Click "Generate RTM"
       ↓
┌──────────────────────────────────────┐
│  FRONTEND (app.js)                   │
│  • resolvePromptPayload()            │
│  • generateAI()                      │
└──────┬───────────────────────────────┘
       │
       │ 3. POST /api/ai/generate
       │    { prompt, systemPrompt, featureType: 'rtmGenerator' }
       ↓
┌──────────────────────────────────────┐
│  BACKEND (server.js)                 │
│  • Authenticate user                 │
│  • Load user settings                │
│  • Get API keys                      │
└──────┬───────────────────────────────┘
       │
       │ 4. Call AI Provider
       ↓
┌──────────────────────────────────────┐
│  AI SERVICE (aiService.js)           │
│  • Select provider (Gemini/OpenAI)   │
│  • Send prompt                       │
│  • Parse response                    │
└──────┬───────────────────────────────┘
       │
       │ 5. Return JSON
       │    { "mappings": [...] }
       ↓
┌──────────────────────────────────────┐
│  FRONTEND (rtm-generator.js)         │
│  • Apply mappings to data            │
│  • calculateMetrics()                │
│  • renderRTM()                       │
│  • renderMetrics()                   │
│  • renderInsights()                  │
└──────┬───────────────────────────────┘
       │
       │ 6. Display RTM
       ↓
┌──────────────┐
│     USER     │
│  Views RTM   │
└──────┬───────┘
       │
       │ 7. Click "Download Excel"
       ↓
┌──────────────────────────────────────┐
│  FRONTEND (rtm-generator.js)         │
│  • rtmDownloadExcel()                │
│  • Generate Excel with SheetJS       │
│  • Trigger download                  │
└──────┬───────────────────────────────┘
       │
       │ 8. Excel File Downloaded
       ↓
┌──────────────┐
│     USER     │
│  Opens Excel │
└──────────────┘
```

---

## 🔄 Integration Points

```
┌─────────────────────────────────────────────────────────────┐
│                    RTM GENERATOR                            │
└─────────────────────────────────────────────────────────────┘
                    ↓           ↑           ↓
        ┌───────────┴───────────┴───────────┴───────────┐
        ↓                       ↑                       ↓
┌───────────────┐    ┌──────────────────┐    ┌──────────────┐
│ Test Case     │    │   AI Service     │    │   Supabase   │
│   Builder     │    │   (Multi-Prov)   │    │   Database   │
├───────────────┤    ├──────────────────┤    ├──────────────┤
│ • Import TCs  │    │ • Gemini         │    │ • rtm_reports│
│ • localStorage│    │ • OpenAI         │    │ • RLS        │
│ • JSON format │    │ • Claude         │    │ • Persistence│
└───────────────┘    │ • DeepSeek       │    └──────────────┘
                     │ • Grok           │
                     │ • Perplexity     │
                     └──────────────────┘
```

---

## 🎯 Component Responsibilities

### Frontend (rtm-generator.js)
- ✅ Parse user input
- ✅ Orchestrate AI calls
- ✅ Calculate metrics
- ✅ Render UI
- ✅ Generate Excel
- ✅ Handle user interactions

### Shared Utilities (app.js)
- ✅ AI integration
- ✅ Prompt governance
- ✅ File upload handling
- ✅ JSON parsing
- ✅ Toast notifications
- ✅ Loading states

### Backend (server.js)
- ✅ Authentication
- ✅ API key management
- ✅ AI provider routing
- ✅ Usage logging
- ✅ Error handling

### Database (Supabase)
- ✅ Data persistence
- ✅ User scoping (RLS)
- ✅ Prompt storage
- ✅ Usage tracking

---

## 📦 Module Dependencies

```
rtm-generator.js
├── app.js (utilities)
│   ├── generateAI()
│   ├── resolvePromptPayload()
│   ├── safeParseJSON()
│   ├── handleRequirementUpload()
│   ├── showToast()
│   └── setLoading()
├── SheetJS (XLSX)
│   └── Excel generation
├── Existing file parsers
│   ├── extractTextFromPdf()
│   ├── extractTextFromWord()
│   └── extractTextFromRequirementFile()
└── localStorage
    └── Test Case Builder integration
```

---

## 🔐 Security Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    SECURITY LAYERS                       │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  1. Authentication (Supabase JWT)                        │
│     ├─ User login required                              │
│     ├─ Session validation                               │
│     └─ Token expiration                                 │
│                                                          │
│  2. Authorization (RLS Policies)                         │
│     ├─ User can only see own RTMs                       │
│     ├─ User can only modify own RTMs                    │
│     └─ Admin role for master prompts                    │
│                                                          │
│  3. Input Validation                                     │
│     ├─ File type validation                             │
│     ├─ File size limits                                 │
│     └─ XSS prevention                                   │
│                                                          │
│  4. API Security                                         │
│     ├─ Rate limiting                                    │
│     ├─ API key encryption                               │
│     └─ HTTPS only                                       │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## 🎨 UI Component Hierarchy

```
RTM Generator Module
├── Header
│   ├── Title
│   └── Prompt Status Indicator
├── Input Section
│   ├── Requirements Input
│   │   ├── Textarea
│   │   └── Upload Button
│   └── Test Cases Input
│       ├── Textarea
│       ├── Upload Button
│       └── Import Button
├── Action Buttons
│   ├── Clear Button
│   └── Generate Button
└── Output Section
    ├── Metrics Dashboard
    │   ├── Coverage Card
    │   ├── Covered Card
    │   ├── Uncovered Card
    │   └── Orphans Card
    ├── RTM Table
    │   ├── Header Row
    │   └── Data Rows
    ├── Insights Section
    │   ├── Uncovered Requirements
    │   └── Orphan Test Cases
    └── Export Button
```

---

**This architecture ensures scalability, maintainability, and seamless integration with your existing Qaly AI system.**
