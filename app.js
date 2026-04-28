/**
 * Qaly AI - Application Logic
 * Integrates with Gemini API and handles all UI modules.
 */

// ============================================
// CONFIGURATION & STATE
// ============================================
const TEST_CASES_TABLE = 'user_test_suites';
const EXCEL_MIME_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const GEMINI_TIMEOUT_MS = 25000;
const AI_GENERATE_ENDPOINT = '/api/ai/generate';
const USER_THEME_KEY = 'qaly_theme';
const USER_AI_PROVIDER_KEY = 'qaly_ai_provider';
const ACTIVE_MODULE_KEY = 'qaly_active_module';
const MOCK_PROVIDER = 'mock';
const PROMPT_CONFIG_TABLE = 'master_prompts';
const MODULE_PROMPT_KEYS = [
    'requirementIntelligence',
    'testSuite',
    'bugReport',
    'sentenceCorrection',
    'professionalCase'
];

// Module route mapping
const MODULE_ROUTES = {
    'requirement-correction': 'requirement-intelligence',
    'test-case-architect': 'test-suite-architect',
    'test-case-gen': 'professional-case-architect',
    'bug-report-gen': 'bug-report-generator',
    'sentence-correction': 'sentence-correction'
};

const ROUTE_TO_MODULE = {
    'requirement-intelligence': 'requirement-correction',
    'test-suite-architect': 'test-case-architect',
    'professional-case-architect': 'test-case-gen',
    'bug-report-generator': 'bug-report-gen',
    'sentence-correction': 'sentence-correction'
};

const DEFAULT_MODULE = 'requirement-correction';

// UI State Management
let currentTestCases = [];
let currentUserId = null;
const promptCache = new Map();
let hasUserApiKeyConfigured = false;

// Initialize application
async function initApp() {
    applyPersistedTheme();
    initNavigation();
    initRouting(); // Initialize URL-based routing
    initCopyButtons();
    initFileUploads();
    await initUserIdentity();
    initUserMenu();
    await syncAiKeyStatus();
    checkAPIStatus();
    await updateModulePromptIndicators();
    await loadTestCases();
    restoreActiveModule(); // Restore last active module
}

function initFileUploads() {
    const uploads = [
        { inputId: 'req-intel-file', targetId: 'req-intel-input' },
        { inputId: 'ts-file-input', targetId: 'ts-requirement' },
        { inputId: 'bug-file', targetId: 'bug-input' },
        { inputId: 'professional-case-file', targetId: 'professional-case-input' }
    ];
    uploads.forEach(({ inputId, targetId }) => {
        const el = document.getElementById(inputId);
        if (el) el.addEventListener('change', (e) => handleRequirementUpload(e, targetId));
    });
}

document.addEventListener('DOMContentLoaded', initApp);

function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.module-section');
    const specialItems = document.querySelectorAll('.nav-item-special');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const target = item.getAttribute('data-target');
            navigateToModule(target);
        });
    });

    specialItems.forEach(item => {
        item.addEventListener('click', () => {
            const url = item.getAttribute('data-url');
            if (url) window.location.href = url;
        });
    });
}

// ============================================
// ROUTING & NAVIGATION PERSISTENCE
// ============================================

function initRouting() {
    // Listen for hash changes (browser back/forward)
    window.addEventListener('hashchange', handleRouteChange);
    
    // Listen for popstate (browser back/forward)
    window.addEventListener('popstate', handleRouteChange);
}

function handleRouteChange() {
    const hash = window.location.hash.slice(1); // Remove #
    if (hash && ROUTE_TO_MODULE[hash]) {
        const moduleId = ROUTE_TO_MODULE[hash];
        activateModule(moduleId, false); // false = don't update URL again
    }
}

function navigateToModule(moduleId) {
    activateModule(moduleId, true); // true = update URL
}

function activateModule(moduleId, updateUrl = true) {
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.module-section');

    // Update Nav UI
    navItems.forEach(i => i.classList.remove('active', 'bg-blue-50', 'text-blue-700'));
    const activeNav = document.querySelector(`.nav-item[data-target="${moduleId}"]`);
    if (activeNav) {
        activeNav.classList.add('active', 'bg-blue-50', 'text-blue-700');
    }

    // Update Section UI
    sections.forEach(s => s.classList.remove('active'));
    const targetSection = document.getElementById(moduleId);
    if (targetSection) {
        targetSection.classList.add('active');
    }

    // Persist to localStorage
    localStorage.setItem(ACTIVE_MODULE_KEY, moduleId);

    // Update URL hash (if requested)
    if (updateUrl) {
        const route = MODULE_ROUTES[moduleId] || moduleId;
        window.location.hash = route;
    }
}

function restoreActiveModule() {
    // Priority 1: Check URL hash
    const hash = window.location.hash.slice(1);
    if (hash && ROUTE_TO_MODULE[hash]) {
        const moduleId = ROUTE_TO_MODULE[hash];
        activateModule(moduleId, false);
        return;
    }

    // Priority 2: Check localStorage
    const savedModule = localStorage.getItem(ACTIVE_MODULE_KEY);
    if (savedModule && document.getElementById(savedModule)) {
        activateModule(savedModule, true);
        return;
    }

    // Priority 3: Default module
    activateModule(DEFAULT_MODULE, true);
}

// ============================================
// UTILITIES
// ============================================

function showToast(message, duration = 3000) {
    const toast = document.getElementById('toast');
    if (!toast) return;

    toast.textContent = message;
    toast.classList.add('show', 'opacity-100', '-translate-y-0');
    toast.classList.remove('opacity-0', 'translate-y-8');

    setTimeout(() => {
        toast.classList.remove('show', 'opacity-100', '-translate-y-0');
        toast.classList.add('opacity-0', 'translate-y-8');
    }, duration);
}

function setLoading(btn, isLoading) {
    if (!btn) return;
    const btnText = btn.querySelector('.btn-text');
    const originalText = btn.getAttribute('data-original-text') || btnText?.textContent;
    if (!btn.getAttribute('data-original-text')) btn.setAttribute('data-original-text', originalText);

    if (isLoading) {
        btn.classList.add('generating-btn', 'opacity-80');
        btn.disabled = true;
        if (btnText) {
            btnText.textContent = btn.getAttribute('data-loading-text') || 'Processing...';
        }
        btn.style.cursor = 'wait';
    } else {
        btn.classList.remove('generating-btn', 'opacity-80');
        btn.disabled = false;
        if (btnText) btnText.textContent = originalText;
        btn.style.cursor = 'pointer';
    }
}

function validateInput(inputId, errorId, message) {
    const input = document.getElementById(inputId);
    const error = document.getElementById(errorId);
    if (!input.value.trim()) {
        error.textContent = `⚠ ${message}`;
        error.classList.remove('hidden');
        input.classList.add('border-red-500', 'bg-red-50');
        input.focus();
        return false;
    }
    error.classList.add('hidden');
    input.classList.remove('border-red-500', 'bg-red-50');
    return true;
}

function generateConfidenceScore() {
    return Math.floor(Math.random() * (95 - 70 + 1)) + 70;
}

function copyToClipboard(elementId) {
    const element = document.getElementById(elementId);
    if (!element) return;
    const text = element.innerText || element.value;
    navigator.clipboard.writeText(text).then(() => {
        showToast('Copied!');
    });
}

function safeParseJSON(str) {
    try {
        // Clean up markdown code blocks if present
        const cleanStr = (str || '')
            .replace(/```json\s*/gi, '')
            .replace(/```/g, '')
            .trim();
        return JSON.parse(cleanStr);
    } catch (e) {
        console.error("JSON Parse Error:", e, "Original string:", str);

        // Fallback for partial JSON or plain text - handle objects {} and arrays []
        const startChars = ['{', '['];
        const endChars = ['}', ']'];

        for (let i = 0; i < startChars.length; i++) {
            if (str.includes(startChars[i]) && str.includes(endChars[i])) {
                const start = str.indexOf(startChars[i]);
                const end = str.lastIndexOf(endChars[i]) + 1;
                try {
                    const candidate = str.substring(start, end);
                    return JSON.parse(candidate);
                } catch (ie) { }
            }
        }
        return null;
    }
}

function slugifyFilename(value, fallback = 'test-cases') {
    return (value || fallback)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        || fallback;
}

function extractPlainTextFromBinary(buffer) {
    const bytes = new Uint8Array(buffer);
    let text = '';
    for (let i = 0; i < bytes.length; i += 1) {
        const code = bytes[i];
        if (code === 9 || code === 10 || code === 13 || (code >= 32 && code <= 126)) {
            text += String.fromCharCode(code);
        } else {
            text += ' ';
        }
    }

    return text
        .replace(/\s{2,}/g, ' ')
        .replace(/([.?!])\s+/g, '$1\n')
        .trim();
}

function loadExternalScript(src) {
    return new Promise((resolve, reject) => {
        const existing = document.querySelector(`script[src="${src}"]`);
        if (existing) {
            // Already fully loaded — onload already fired, just resolve.
            if (existing.dataset.loaded === 'true') return resolve();
            // Injected but still loading — wait for it.
            existing.addEventListener('load', resolve, { once: true });
            existing.addEventListener('error', () => reject(new Error(`Failed to load script: ${src}`)), { once: true });
            return;
        }
        const script = document.createElement('script');
        script.src = src;
        script.onload = () => { script.dataset.loaded = 'true'; resolve(); };
        script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
        document.head.appendChild(script);
    });
}

async function extractTextFromPdf(file) {
    if (!window.pdfjsLib) {
        try {
            await loadExternalScript('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js');
        } catch (e) {
            throw new Error('Failed to load PDF parser. Check your internet connection.');
        }
    }

    if (!window.pdfjsLib) {
        throw new Error('PDF parser failed to load.');
    }

    // Always set workerSrc — it may not have been set if pdf.js was pre-loaded via <head> script.
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const pages = [];

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
        const page = await pdf.getPage(pageNumber);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ').replace(/\s+/g, ' ').trim();
        if (pageText) {
            pages.push(pageText);
        }
    }

    return pages.join('\n\n').trim();
}

async function extractTextFromWord(file) {
    const arrayBuffer = await file.arrayBuffer();
    const lowerName = (file.name || '').toLowerCase();

    if (lowerName.endsWith('.docx')) {
        if (!window.mammoth) {
            try {
                await loadExternalScript('https://unpkg.com/mammoth@1.8.0/mammoth.browser.min.js');
            } catch (e) {
                throw new Error('Failed to load Word document parser.');
            }
        }

        const result = await window.mammoth.extractRawText({ arrayBuffer });
        return (result.value || '').trim();
    }

    return extractPlainTextFromBinary(arrayBuffer);
}

async function extractTextFromRequirementFile(file) {
    const name = (file?.name || '').toLowerCase();

    if (name.endsWith('.pdf')) {
        return extractTextFromPdf(file);
    }

    if (name.endsWith('.doc') || name.endsWith('.docx')) {
        return extractTextFromWord(file);
    }

    if (name.endsWith('.txt') || name.endsWith('.md') || name.endsWith('.csv') || name.endsWith('.json')) {
        return await file.text();
    }

    throw new Error('Unsupported file type. Please upload PDF, DOCX, or text files (.txt, .md, .csv).');
}

async function handleRequirementUpload(event, targetInputId) {
    const input = event?.target;
    const file = input?.files?.[0];
    const target = document.getElementById(targetInputId);

    if (!file || !target) return;

    try {
        showToast(`Extracting text from ${file.name}...`, 2000);
        const extractedText = await extractTextFromRequirementFile(file);
        if (!extractedText) {
            throw new Error('No readable text found in the uploaded document');
        }

        target.value = extractedText;
        target.dispatchEvent(new Event('input', { bubbles: true }));
        showToast('Requirement text extracted successfully!');
    } catch (error) {
        console.error('Requirement upload failed:', error);
        showToast(`Upload failed: ${error.message}`);
    } finally {
        input.value = '';
    }
}

function initCopyButtons() {
    // Generic copy functionality for any button with data-copy-target
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-copy-target]');
        if (btn) {
            const targetId = btn.getAttribute('data-copy-target');
            const target = document.getElementById(targetId);
            if (target) {
                const text = target.innerText || target.value;
                navigator.clipboard.writeText(text).then(() => {
                    showToast('Copied!');
                });
            }
        }
    });
}

function getDisplayUsername() {
    const localName = (localStorage.getItem('username') || '').trim();
    return localName || 'User';
}

function getAvatarLetter(username) {
    const initial = (username || 'U').trim().charAt(0);
    return (initial || 'U').toUpperCase();
}

function setHeaderIdentity(username) {
    const safeName = (username || 'User').trim() || 'User';
    const headerName = document.getElementById('header-username');
    const avatarBadge = document.getElementById('user-avatar-badge');

    if (headerName) headerName.textContent = safeName;
    if (avatarBadge) avatarBadge.textContent = getAvatarLetter(safeName);
}

async function initUserIdentity() {
    let username = getDisplayUsername();

    if (window.getCurrentSession) {
        try {
            const session = await window.getCurrentSession();
            const fullName = session?.user?.user_metadata?.full_name;
            const fallback = (session?.user?.email || '').split('@')[0];
            username = (fullName || fallback || username || 'User').trim();
            localStorage.setItem('username', username);
        } catch (error) {
            console.error('Could not hydrate username from session:', error.message);
        }
    }

    setHeaderIdentity(username);
}

function initUserMenu() {
    const trigger = document.getElementById('user-identity-trigger');
    const dropdown = document.getElementById('user-menu-dropdown');
    const profileBtn = document.getElementById('header-profile-btn');
    const headerLogout = document.getElementById('header-logout-btn');
    if (!trigger || !dropdown) return;

    const closeMenu = () => {
        dropdown.classList.add('hidden');
        trigger.setAttribute('aria-expanded', 'false');
    };

    const toggleMenu = () => {
        const willOpen = dropdown.classList.contains('hidden');
        dropdown.classList.toggle('hidden');
        trigger.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
    };

    trigger.addEventListener('click', (event) => {
        event.stopPropagation();
        toggleMenu();
    });

    trigger.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            toggleMenu();
        }
    });

    document.addEventListener('click', (event) => {
        if (!event.target.closest('.top-right-identity')) {
            closeMenu();
        }
    });

    if (headerLogout) {
        headerLogout.addEventListener('click', async (event) => {
            event.preventDefault();
            event.stopPropagation();
            closeMenu();
            if (window.logout) {
                try {
                    await window.logout();
                } catch (error) {
                    console.error('Logout failed:', error.message);
                    showToast('Logout failed. Please try again.');
                }
            }
        });
    }

    if (profileBtn) {
        profileBtn.addEventListener('click', () => {
            closeMenu();
            window.location.href = 'profile.html';
        });
    }
}

function getIsTestMode() {
    if (typeof appConfig !== 'undefined' && typeof appConfig.testMode === 'boolean') {
        return appConfig.testMode;
    }

    if (typeof window !== 'undefined' && typeof window.TEST_MODE === 'boolean') {
        return window.TEST_MODE;
    }

    return false;
}

function getMockResponse(featureType) {
    if (typeof window !== 'undefined' && window.MOCK_RESPONSES && featureType && window.MOCK_RESPONSES[featureType]) {
        return window.MOCK_RESPONSES[featureType];
    }
    if (typeof MOCK_RESPONSES !== 'undefined' && featureType && MOCK_RESPONSES[featureType]) {
        return MOCK_RESPONSES[featureType];
    }
    return null;
}

function applyPersistedTheme() {
    const theme = localStorage.getItem(USER_THEME_KEY) || 'light';
    const html = document.documentElement;
    const body = document.body;
    html.classList.toggle('dark', theme === 'dark');
    html.classList.toggle('light', theme !== 'dark');
    body.classList.toggle('dark', theme === 'dark');
}

async function getAuthTokenForApi() {
    if (!window.getCurrentSession) return '';
    try {
        const session = await window.getCurrentSession();
        return session?.access_token || '';
    } catch {
        return '';
    }
}

function setGenerateButtonsEnabled(isEnabled) {
    const selectors = [
        'button[onclick^="generateRequirementIntelligence"]',
        'button[onclick^="generateTestSuite"]',
        'button[onclick^="generateBugReport"]',
        'button[onclick^="correctSentence"]',
        'button[onclick^="generateProfessionalCase"]'
    ];
    const buttons = document.querySelectorAll(selectors.join(','));
    buttons.forEach((btn) => {
        btn.disabled = !isEnabled;
        btn.classList.toggle('opacity-50', !isEnabled);
        btn.classList.toggle('cursor-not-allowed', !isEnabled);
        btn.title = isEnabled ? '' : 'Configure API key in Settings to continue.';
    });
}

async function syncAiKeyStatus() {
    if (getIsTestMode()) {
        hasUserApiKeyConfigured = true;
        setGenerateButtonsEnabled(true);
        return true;
    }
    const preferredProvider = (localStorage.getItem(USER_AI_PROVIDER_KEY) || '').trim().toLowerCase();
    if (preferredProvider === MOCK_PROVIDER) {
        hasUserApiKeyConfigured = true;
        setGenerateButtonsEnabled(true);
        return true;
    }

    const token = await getAuthTokenForApi();
    if (!token) {
        hasUserApiKeyConfigured = false;
        setGenerateButtonsEnabled(false);
        return false;
    }

    try {
        const response = await fetch('/api/settings', {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        const payload = await response.json();
        hasUserApiKeyConfigured = Boolean(payload?.settings?.hasApiKey);
    } catch {
        hasUserApiKeyConfigured = false;
    }

    setGenerateButtonsEnabled(hasUserApiKeyConfigured);
    return hasUserApiKeyConfigured;
}

function shouldFallbackToMock() {
    if (typeof appConfig !== 'undefined' && typeof appConfig.fallbackToMockOnApiError === 'boolean') {
        return appConfig.fallbackToMockOnApiError;
    }
    return true;
}

function normalizeGeminiOutput(data) {
    const candidate = data?.candidates?.[0];
    const parts = candidate?.content?.parts;
    if (Array.isArray(parts) && typeof parts[0]?.text === 'string') {
        return parts[0].text;
    }
    if (typeof candidate?.output === 'string') {
        return candidate.output;
    }
    return null;
}

function normalizePromptList(value) {
    if (Array.isArray(value)) {
        return value.map(item => String(item || '').trim()).filter(Boolean);
    }
    if (typeof value === 'string') {
        return value
            .split('\n')
            .map(item => item.replace(/^\s*-\s*/, '').trim())
            .filter(Boolean);
    }
    return [];
}

function optimizePromptText(text) {
    return String(text || '')
        .replace(/[ \t]+/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

function renderTemplate(template, variables = {}) {
    let output = String(template || '');
    Object.entries(variables || {}).forEach(([key, value]) => {
        const safe = String(value ?? '').trim();
        output = output.replace(new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g'), safe);
    });
    return output;
}

function buildPromptFromConfig(config, userInput, options = {}) {
    const role = String(config?.role || '').trim();
    const task = String(config?.task || '').trim();
    const constraints = normalizePromptList(config?.constraints);
    const outputFormat = normalizePromptList(config?.output_format);
    const style = String(config?.style || 'concise').trim();
    const toggleConstraints = normalizePromptList(options?.toggleConstraints);

    const sections = [
        role ? `[Role]\n${role}` : '',
        task ? `[Task]\n${task}` : '',
        `[User Input]\n${String(userInput || '').trim()}`,
        constraints.length ? `[Constraints]\n- ${constraints.join('\n- ')}` : '',
        toggleConstraints.length ? `[Smart Toggles]\n- ${toggleConstraints.join('\n- ')}` : '',
        outputFormat.length ? `[Output Format]\n- ${outputFormat.join('\n- ')}` : '',
        `[Style]\n${style || 'concise'}`
    ].filter(Boolean);

    return optimizePromptText(sections.join('\n\n'));
}

async function getPromptGovernanceConfig(featureKey) {
    if (promptCache.has(featureKey)) {
        return promptCache.get(featureKey);
    }
    if (!window.supabaseClient) return null;

    const { data, error } = await window.supabaseClient
        .from(PROMPT_CONFIG_TABLE)
        .select('module_key, role, task, constraints, output_format, style, status, prompt_content, updated_at')
        .eq('module_key', featureKey)
        .eq('status', 'ACTIVE')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (error || !data) return null;
    promptCache.set(featureKey, data);
    return data;
}

async function resolvePromptPayload(featureKey, userInput, fallbackSystemPrompt, options = {}) {
    const config = await getPromptGovernanceConfig(featureKey);
    if (config) {
        const templateVars = options?.templateVars || {};
        const templateText = String(config?.prompt_content || '').trim();
        if (templateText.includes('{{')) {
            const compiledFromTemplate = optimizePromptText(renderTemplate(templateText, templateVars));
            return {
                prompt: compiledFromTemplate || userInput,
                systemPrompt: ''
            };
        }

        const compiledPrompt = buildPromptFromConfig(config, userInput, options);
        return {
            prompt: compiledPrompt,
            systemPrompt: ''
        };
    }

    return {
        prompt: userInput,
        systemPrompt: fallbackSystemPrompt
    };
}

// ============================================
// AI CORE
// ============================================

function setMockSourceBadge(source, provider = '') {
    const container = document.getElementById('api-status-container');
    if (!container) return;

    let badge = document.getElementById('mock-source-badge');
    if (!badge) {
        badge = document.createElement('span');
        badge.id = 'mock-source-badge';
        badge.className = 'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider';
        container.appendChild(badge);
    }

    const normalizedSource = String(source || '').toLowerCase();
    if (!normalizedSource || normalizedSource === 'idle') {
        badge.textContent = 'Source: --';
        badge.className = 'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-500';
        return;
    }

    if (normalizedSource === 'frontend_mock') {
        badge.textContent = 'Source: Frontend Mock';
        badge.className = 'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800';
        return;
    }

    if (normalizedSource === 'mock' || normalizedSource === 'backend_mock') {
        badge.textContent = 'Source: Backend Mock';
        badge.className = 'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-yellow-100 text-yellow-800';
        return;
    }

    if (normalizedSource === 'mock_fallback') {
        badge.textContent = 'Source: Mock Fallback';
        badge.className = 'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-orange-100 text-orange-800';
        return;
    }

    const labelProvider = String(provider || '').trim().toUpperCase();
    badge.textContent = labelProvider ? `Source: Live (${labelProvider})` : 'Source: Live';
    badge.className = 'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800';
}

async function callGemini(prompt, systemPrompt = "", featureType = "") {
    const keyConfigured = await syncAiKeyStatus();
    if (!keyConfigured) {
        showToast('API key not configured. Open Settings to add your key.');
        const err = new Error('API key not configured');
        err.code = 'MISSING_API_KEY';
        throw err;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);

    const token = await getAuthTokenForApi();
    const preferredProvider = (localStorage.getItem(USER_AI_PROVIDER_KEY) || '').trim().toLowerCase();
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    let response;
    try {
        response = await fetch(AI_GENERATE_ENDPOINT, {
            method: 'POST',
            headers,
            signal: controller.signal,
            body: JSON.stringify({ prompt, systemPrompt, featureType, provider: preferredProvider || undefined })
        });
    } catch (error) {
        clearTimeout(timer);
        const isAbort = error?.name === 'AbortError';
        const err = new Error(isAbort ? 'Gemini request timed out. Please try again.' : 'Network error while contacting Gemini. Please check your connection.');
        err.code = isAbort ? 'TIMEOUT' : 'NETWORK';
        throw err;
    } finally {
        clearTimeout(timer);
    }

    if (!response.ok) {
        let message = `Gemini API error (${response.status}).`;
        try {
            const errJson = await response.json();
            message = errJson?.error || errJson?.message || message;
        } catch (_) {
            try {
                const errText = await response.text();
                if (errText) message = errText;
            } catch (_) { }
        }
        const err = new Error(message);
        err.code = response.status === 401 || response.status === 403 ? 'INVALID_API_KEY' : 'API_ERROR';
        throw err;
    }

    const data = await response.json();
    const responseSource = String(data?.source || '').trim().toLowerCase();
    const responseProvider = String(data?.provider || '').trim().toLowerCase();
    setMockSourceBadge(responseSource || 'live', responseProvider);
    const output = typeof data?.text === 'string' ? data.text : normalizeGeminiOutput(data);
    if (!output || typeof output !== 'string' || !output.trim()) {
        const err = new Error('Gemini returned an empty or unexpected response. Try again or switch to Test Mode.');
        err.code = 'EMPTY_RESPONSE';
        throw err;
    }
    return output;
}

async function generateAI(prompt, systemPrompt = "", featureType = "") {
    // Show "Processing..." toast immediately
    showToast('Processing request...', 2000);

    // Add artificial delay to manage UX expectations (1.5s - 2s)
    const delay = Math.floor(Math.random() * 500) + 1500;
    await new Promise(r => setTimeout(r, delay));

    const isTestMode = getIsTestMode();
    const preferredProvider = (localStorage.getItem(USER_AI_PROVIDER_KEY) || '').trim().toLowerCase();
    const isMockProvider = preferredProvider === MOCK_PROVIDER;

    if (isTestMode || isMockProvider) {
        console.log(`🧪 TEST MODE: Mocking [${featureType}]`);
        setMockSourceBadge('frontend_mock');

        // Use MOCK_RESPONSES from test-config.js if available, else local fallback
        const mock = getMockResponse(featureType);
        return mock || "Mock response missing for this feature.";
    }

    if (!(prompt || '').trim()) {
        const err = new Error('Input is empty. Please enter your requirement before processing.');
        err.code = 'EMPTY_INPUT';
        throw err;
    }

    try {
        return await callGemini(prompt, systemPrompt, featureType);
    } catch (error) {
        console.error('AI call failed:', error);
        const canFallback = shouldFallbackToMock();
        const mock = getMockResponse(featureType);
        if (canFallback && mock) {
            showToast('Live AI failed. Falling back to mock mode.');
            setMockSourceBadge('frontend_mock');
            return mock;
        }
        throw error;
    }
}

function checkAPIStatus() {
    const dot = document.getElementById('api-status-dot');
    const text = document.getElementById('api-status-text');
    const container = document.getElementById('api-status-container');
    const isTestMode = getIsTestMode();
    const preferredProvider = (localStorage.getItem(USER_AI_PROVIDER_KEY) || '').trim().toLowerCase();
    const isMockProvider = preferredProvider === MOCK_PROVIDER;
    const hasKey = hasUserApiKeyConfigured;
    const providerLabel = preferredProvider && preferredProvider !== 'auto' && preferredProvider !== MOCK_PROVIDER
        ? preferredProvider.charAt(0).toUpperCase() + preferredProvider.slice(1)
        : 'AI';

    if (!dot || !text) return;
    if (container) container.classList.add('modern-tooltip');

    if (isTestMode || isMockProvider) {
        dot.className = 'w-2.5 h-2.5 rounded-full bg-yellow-500 animate-pulse';
        text.textContent = 'Mock Mode';
        const tooltipText = 'Mock Mode: AI responses are simulated test data, not live Gemini output.';
        if (container) container.setAttribute('data-tooltip', tooltipText);
        dot.removeAttribute('title');
        text.removeAttribute('title');
    } else if (hasKey) {
        dot.className = 'w-2.5 h-2.5 rounded-full bg-green-500';
        text.textContent = `🟢 ${providerLabel} Connected`;
        const tooltipText = `${providerLabel} Connected: Responses are generated from live provider API.`;
        if (container) container.setAttribute('data-tooltip', tooltipText);
        dot.removeAttribute('title');
        text.removeAttribute('title');
    } else {
        dot.className = 'w-2.5 h-2.5 rounded-full bg-red-500';
        text.textContent = '🔴 No API Configured';
        const tooltipText = 'No API Configured: Add your provider API key in Settings.';
        if (container) container.setAttribute('data-tooltip', tooltipText);
        dot.removeAttribute('title');
        text.removeAttribute('title');
    }
    setMockSourceBadge('idle');
}

function setPromptIndicatorState(moduleKey, prompt) {
    const indicator = document.querySelector(`.prompt-status-indicator[data-prompt-module="${moduleKey}"]`);
    if (!indicator) return;

    const isConfigured = Boolean(prompt);
    indicator.classList.toggle('hidden', !isConfigured);
    indicator.classList.toggle('inline-flex', isConfigured);
    indicator.title = isConfigured ? 'Prompt configured' : '';
}

async function fetchPromptIndicatorStatusFromApi() {
    if (!window.getCurrentSession) return null;
    const session = await window.getCurrentSession();
    const token = session?.access_token;
    if (!token) return null;

    const modules = MODULE_PROMPT_KEYS.join(',');
    const response = await fetch(`/api/module-prompt-status?modules=${encodeURIComponent(modules)}`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    if (!response.ok) {
        throw new Error('Could not load prompt indicators.');
    }

    const payload = await response.json();
    return new Map((payload.modules || []).map(item => [item.moduleKey, item.prompt || null]));
}

async function fetchPromptIndicatorStatusFromSupabase() {
    if (!window.supabaseClient) return new Map();

    const { data, error } = await window.supabaseClient
        .from(PROMPT_CONFIG_TABLE)
        .select('module_key, title, prompt_content, status')
        .in('module_key', MODULE_PROMPT_KEYS)
        .eq('status', 'ACTIVE');

    if (error) throw error;
    return new Map((data || []).map(item => [item.module_key, item]));
}

async function updateModulePromptIndicators() {
    MODULE_PROMPT_KEYS.forEach(moduleKey => setPromptIndicatorState(moduleKey, null));

    try {
        let statusByModule = await fetchPromptIndicatorStatusFromApi();
        if (!statusByModule) {
            statusByModule = await fetchPromptIndicatorStatusFromSupabase();
        }

        MODULE_PROMPT_KEYS.forEach(moduleKey => {
            setPromptIndicatorState(moduleKey, statusByModule.get(moduleKey) || null);
        });
    } catch (error) {
        console.error('Prompt indicator update failed:', error.message);
        try {
            const fallbackStatus = await fetchPromptIndicatorStatusFromSupabase();
            MODULE_PROMPT_KEYS.forEach(moduleKey => {
                setPromptIndicatorState(moduleKey, fallbackStatus.get(moduleKey) || null);
            });
        } catch (fallbackError) {
            console.error('Prompt indicator fallback failed:', fallbackError.message);
        }
    }
}

// ============================================
// FEATURE HANDLERS
// ============================================

// 1. Requirement Intelligence
async function generateRequirementIntelligence(e) {
    if (!validateInput('req-intel-input', 'req-intel-error', 'Please enter requirement before analyzing')) return;

    const input = document.getElementById('req-intel-input').value.trim();
    const btn = e.currentTarget;
    setLoading(btn, true);

    try {
        const payload = await resolvePromptPayload('requirementIntelligence', input, SYSTEM_PROMPTS.requirementIntelligence, {
            templateVars: {
                requirement: input,
                userInput: input
            }
        });
        const response = await generateAI(payload.prompt, payload.systemPrompt, 'requirementIntelligence');
        const data = safeParseJSON(response);

        if (!data) throw new Error("Could not parse AI response");

        document.getElementById('corrected-spec').innerHTML = `<p class="text-sm text-slate-700 leading-relaxed">${data.corrected_spec}</p>`;

        document.getElementById('gap-analysis').innerHTML = (data.gaps || []).map(gap => `
            <div class="flex gap-3 items-start p-3 bg-white shadow-sm rounded-xl border border-slate-100 hover:shadow-md transition-shadow duration-300">
                <span class="material-symbols-outlined text-orange-600 text-sm mt-0.5">warning</span>
                <p class="text-xs text-slate-700 font-medium">${gap}</p>
            </div>
        `).join('');

        document.getElementById('test-scenarios').innerHTML = (data.test_scenarios || []).map((sc, i) => `
            <div class="flex gap-3 items-start p-3 bg-white shadow-sm rounded-xl border border-slate-100 hover:shadow-md transition-shadow duration-300">
                <span class="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 text-green-700 text-[10px] flex items-center justify-center font-bold">${i + 1}</span>
                <p class="text-xs text-slate-700 font-medium">${sc}</p>
            </div>
        `).join('');

        // Metadata display
        const meta = document.getElementById('req-intel-meta');
        const confidence = document.getElementById('req-intel-confidence');
        if (meta && confidence) {
            confidence.textContent = `${generateConfidenceScore()}%`;
            meta.classList.remove('opacity-0');
        }

        document.getElementById('req-intel-output').style.display = 'block';
        showToast('Analysis complete!');
    } catch (err) {
        console.error(err);
        showToast('AI Error: ' + err.message);
    } finally {
        setLoading(btn, false);
    }
}

function clearRequirementIntelligence() {
    if (!confirm('Clear all input and output data?')) return;
    document.getElementById('req-intel-input').value = '';
    document.getElementById('req-intel-output').style.display = 'none';
    document.getElementById('req-intel-error').classList.add('hidden');
    document.getElementById('req-intel-input').classList.remove('border-red-500', 'bg-red-50');
    showToast('Cleared successfully!');
}

// 2. Test Suite Architect
let tsCurrentCases = [];

async function tsGenerate(e) {
    if (!validateInput('ts-requirement', 'ts-req-error', 'Please enter feature details before generating')) return;

    const module = document.getElementById('ts-module-name').value.trim();
    const subModule = document.getElementById('ts-sub-module').value.trim();
    const input = document.getElementById('ts-requirement').value.trim();
    const format = document.getElementById('ts-format-input').value.trim();

    const btn = e?.currentTarget || document.getElementById('ts-generate-btn');
    setLoading(btn, true);

    const prompt = `Module: ${module}, Sub-Module: ${subModule}\nFormat: ${format}\nRequirement: ${input}`;

    try {
        const payload = await resolvePromptPayload('testSuite', prompt, SYSTEM_PROMPTS.testSuite, {
            templateVars: {
                requirement: input,
                userInput: input,
                module,
                subModule,
                format
            }
        });
        const response = await generateAI(payload.prompt, payload.systemPrompt, 'testSuite');
        const data = safeParseJSON(response);

        if (data && Array.isArray(data)) {
            tsCurrentCases = data;
            await saveTestCases();
            tsRenderTable();
            tsUpdateStats();

            document.getElementById('ts-output').classList.remove('hidden');
            document.getElementById('ts-regenerate-btn').classList.remove('hidden');
            document.getElementById('ts-regenerate-btn').classList.add('flex');
            showToast('Test cases generated successfully!');
        } else {
            throw new Error("Invalid AI response format");
        }
    } catch (err) {
        console.error(err);
        showToast('Error: ' + err.message);
    } finally {
        setLoading(btn, false);
    }
}

async function tsRegenerate() {
    await tsGenerate();
}

function tsUpdateStats() {
    const total = tsCurrentCases.length;
    const negative = tsCurrentCases.filter(tc => tc.type?.toLowerCase().includes('negative')).length;
    const edge = tsCurrentCases.filter(tc => tc.type?.toLowerCase().includes('edge') || tc.type?.toLowerCase().includes('boundary')).length;
    const functional = tsCurrentCases.filter(tc => tc.type?.toLowerCase().includes('functional')).length;

    document.getElementById('ts-stat-total').textContent = total;
    document.getElementById('ts-stat-negative').textContent = negative;
    document.getElementById('ts-stat-edge').textContent = edge;
    document.getElementById('ts-stat-functional').textContent = functional;
}

function tsFilter() {
    const searchTerm = document.getElementById('ts-search').value.toLowerCase();
    const typeFilter = document.getElementById('ts-filter-type').value;

    const filtered = tsCurrentCases.filter(tc => {
        const matchesSearch = Object.values(tc).some(val => 
            String(val).toLowerCase().includes(searchTerm)
        );
        const matchesType = typeFilter === 'all' || tc.type === typeFilter;
        return matchesSearch && matchesType;
    });

    tsRenderTable(filtered);
}

function tsRenderTable(displayList = tsCurrentCases) {
    const thead = document.getElementById('ts-thead');
    const tbody = document.getElementById('ts-tbody');
    const emptyState = document.getElementById('ts-empty-state');

    if (displayList.length === 0) {
        tbody.innerHTML = '';
        emptyState.classList.remove('hidden');
        return;
    }

    emptyState.classList.add('hidden');

    // Build header from first case keys
    const headers = displayList[0] ? Object.keys(displayList[0]) : [];
    thead.innerHTML = `<tr class="bg-slate-50 border-b border-slate-200">${headers.map(h => 
        `<th class="px-4 py-3 text-left text-xs font-black uppercase tracking-widest text-slate-500">${h}</th>`
    ).join('')}<th class="px-4 py-3 text-right text-xs font-black uppercase tracking-widest text-slate-500">Actions</th></tr>`;

    tbody.innerHTML = displayList.map((tc, idx) => `
        <tr class="border-b border-slate-100 hover:bg-slate-50 transition-colors">
            ${headers.map(h => `<td class="px-4 py-3 text-sm text-slate-700">${tc[h] || ''}</td>`).join('')}
            <td class="px-4 py-3 text-right">
                <button onclick="tsEditRow(${idx})" class="action-icon-btn edit-btn" title="Edit">
                    <span class="material-symbols-outlined text-lg">edit</span>
                </button>
            </td>
        </tr>
    `).join('');
}

function tsEditRow(idx) {
    showToast('Edit functionality coming soon!');
}

function tsAddRow() {
    showToast('Add row functionality coming soon!');
}

function tsCopyAll() {
    if (tsCurrentCases.length === 0) return;

    const headers = Object.keys(tsCurrentCases[0]);
    const headerRow = headers.join('\t');
    const body = tsCurrentCases.map(tc => headers.map(h => tc[h] || '').join('\t')).join('\n');

    navigator.clipboard.writeText(headerRow + '\n' + body).then(() => {
        showToast('Copied all for Excel!');
    });
}

function tsDownloadExcel() {
    if (tsCurrentCases.length === 0) return;
    if (!window.XLSX) {
        showToast("XLSX library not loaded!");
        return;
    }

    const worksheet = XLSX.utils.json_to_sheet(tsCurrentCases);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Test Cases");

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const moduleName = document.getElementById('ts-module-name')?.value || 'test-cases';
    const filename = `${slugifyFilename(moduleName)}-${timestamp}.xlsx`;

    try {
        const excelBuffer = XLSX.write(workbook, {
            bookType: 'xlsx',
            type: 'array',
            compression: true
        });

        const blob = new Blob([excelBuffer], { type: EXCEL_MIME_TYPE });
        const downloadUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(downloadUrl);
        showToast('Excel download started!');
    } catch (error) {
        console.error(error);
        showToast('Error generating Excel file');
    }
}

async function tsClearSuite() {
    if (!confirm('Are you sure you want to clear all generated test cases? This action cannot be undone.')) {
        return;
    }

    tsCurrentCases = [];
    currentTestCases = [];
    localStorage.removeItem('qaly_saved_testcases');

    if (window.supabaseClient) {
        const userId = await resolveCurrentUserId();
        if (userId) {
            await window.supabaseClient
                .from(TEST_CASES_TABLE)
                .upsert({ user_id: userId, test_cases: [] }, { onConflict: 'user_id' });
        }
    }

    document.getElementById('ts-output').classList.add('hidden');
    tsRenderTable();
    tsUpdateStats();
    showToast('Test suite cleared.');
}

function tsClearInput() {
    if (!confirm('Clear all input fields?')) return;
    document.getElementById('ts-module-name').value = '';
    document.getElementById('ts-sub-module').value = '';
    document.getElementById('ts-requirement').value = '';
    document.getElementById('ts-format-input').value = 'Sl No | Test Case ID | Test Case | Pre-Conditions | Steps | Expected Result | Type';
    document.getElementById('ts-req-error').classList.add('hidden');
    document.getElementById('ts-requirement').classList.remove('border-red-500', 'bg-red-50');
    showToast('Input cleared successfully!');
}

function updateTestSuiteSummary() {
    const total = currentTestCases.length;
    const critical = currentTestCases.filter(tc => tc.isCritical).length;
    const security = currentTestCases.filter(tc => tc.isSecurity).length;

    document.getElementById('total-cases-count').textContent = total;
    document.getElementById('critical-cases-count').textContent = critical;
    document.getElementById('security-cases-count').textContent = security;
}

function populateModuleFilter() {
    const filter = document.getElementById('filter-module');
    const modules = [...new Set(currentTestCases.map(tc => tc.module))].filter(Boolean);

    let html = '<option value="all">All Modules</option>';
    modules.forEach(m => {
        html += `<option value="${m}">${m}</option>`;
    });
    filter.innerHTML = html;
}

function filterTestCases() {
    const searchTerm = document.getElementById('tc-search').value.toLowerCase();
    const moduleFilter = document.getElementById('filter-module').value;
    const statusFilter = document.getElementById('filter-status').value;

    const filtered = currentTestCases.filter(tc => {
        const matchesSearch = tc.testCase.toLowerCase().includes(searchTerm) ||
            tc.id.toLowerCase().includes(searchTerm) ||
            (tc.steps && tc.steps.toLowerCase().includes(searchTerm));
        const matchesModule = moduleFilter === 'all' || tc.module === moduleFilter;
        const matchesStatus = statusFilter === 'all' || tc.status === statusFilter;

        return matchesSearch && matchesModule && matchesStatus;
    });

    renderTestCasesTable(filtered);
}

function renderTestCasesTable(displayList = currentTestCases) {
    const tbody = document.getElementById('tc-table-body');
    const emptyState = document.getElementById('tc-empty-state');

    if (displayList.length === 0) {
        tbody.innerHTML = '';
        emptyState.classList.remove('hidden');
        return;
    }

    emptyState.classList.add('hidden');
    tbody.innerHTML = displayList.map((tc, index) => `
        <tr class="tc-row border-b border-slate-100" onclick="toggleRowExpansion(this, event)">
            <td class="px-4 py-4 text-center">
                <span class="material-symbols-outlined text-slate-400 text-sm transform transition-transform expand-icon">chevron_right</span>
            </td>
            <td class="px-4 py-4 font-mono text-xs font-bold text-slate-600">${tc.id}</td>
            <td class="px-4 py-4 text-xs font-medium text-slate-500">${tc.module}</td>
            <td class="px-4 py-4">
                <p class="text-sm font-bold text-slate-800">${tc.testCase}</p>
                <p class="text-[10px] text-slate-400 mt-0.5">${tc.subModule || ''}</p>
            </td>
            <td class="px-4 py-4">
                <span class="status-badge ${tc.status.toLowerCase().replace(' ', '-')}">${tc.status}</span>
            </td>
            <td class="px-4 py-4 text-right">
                <div class="flex items-center justify-end gap-1">
                    <button onclick="editTestCase('${tc.id}', this, event)" class="action-icon-btn edit-btn" title="Edit">
                        <span class="material-symbols-outlined text-lg">edit</span>
                    </button>
                    <button onclick="copyRow('${tc.id}', this, event)" class="action-icon-btn copy-btn" title="Copy Row">
                        <span class="material-symbols-outlined text-lg">content_copy</span>
                    </button>
                </div>
            </td>
        </tr>
        <tr class="tc-details">
            <td colspan="6" class="px-8 py-6 bg-slate-50/50">
                <div class="tc-details-content grid grid-cols-2 gap-8">
                    <div>
                        <h4 class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Pre-Conditions</h4>
                        <p class="text-xs text-slate-600 italic bg-white p-3 rounded-lg border border-slate-100">${tc.preCondition || 'None'}</p>
                        
                        <h4 class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-4 mb-2">Test Steps</h4>
                        <div class="text-xs text-slate-700 bg-white p-3 rounded-lg border border-slate-100 whitespace-pre-line leading-relaxed">${tc.steps}</div>
                    </div>
                    <div>
                        <h4 class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Test Data</h4>
                        <div class="text-xs text-slate-600 bg-white p-3 rounded-lg border border-slate-100">${tc.testData || 'N/A'}</div>
                        
                        <div class="grid grid-cols-2 gap-4 mt-4">
                            <div>
                                <h4 class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Expected Result</h4>
                                <div class="text-xs text-green-700 bg-green-50/50 p-3 rounded-lg border border-green-100">${tc.expectedResult}</div>
                            </div>
                            <div>
                                <h4 class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Actual Result</h4>
                                <div class="text-xs text-slate-600 bg-white p-3 rounded-lg border border-slate-100 min-h-[40px]">${tc.actualResult || ''}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </td>
        </tr>
    `).join('');
}

function toggleRowExpansion(row, event) {
    if (event.target.closest('.action-icon-btn')) return;

    row.classList.toggle('expanded');
    const icon = row.querySelector('.expand-icon');
    if (row.classList.contains('expanded')) {
        icon.style.transform = 'rotate(90deg)';
    } else {
        icon.style.transform = 'rotate(0deg)';
    }
}

function editTestCase(id, btn, event) {
    if (event) event.stopPropagation();
    const tc = currentTestCases.find(t => t.id === id);
    if (!tc) return;

    const row = btn.closest('tr');
    const detailsRow = row.nextElementSibling;

    // Auto-expand if not expanded
    if (!row.classList.contains('expanded')) {
        toggleRowExpansion(row, event);
    }

    const content = detailsRow.querySelector('.tc-details-content');
    content.innerHTML = `
        <div class="col-span-2 bg-blue-50/50 p-4 rounded-xl border border-blue-100 mb-4 flex justify-between items-center">
            <span class="text-sm font-bold text-blue-700">Editing Mode: ${tc.id}</span>
            <div class="flex gap-2">
                <button onclick="cancelEdit('${tc.id}', event)" class="px-4 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold hover:bg-slate-50">Cancel</button>
                <button onclick="saveEdit('${tc.id}', event)" class="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700">Save Changes</button>
            </div>
        </div>
        <div>
            <h4 class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Test Case Title</h4>
            <input type="text" id="edit-title-${tc.id}" class="edit-input mb-4" value="${tc.testCase}">

            <h4 class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Pre-Conditions</h4>
            <input type="text" id="edit-pre-${tc.id}" class="edit-input mb-4" value="${tc.preCondition}">
            
            <h4 class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Test Steps</h4>
            <textarea id="edit-steps-${tc.id}" class="edit-textarea">${tc.steps}</textarea>
        </div>
        <div>
            <h4 class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Test Data</h4>
            <input type="text" id="edit-data-${tc.id}" class="edit-input mb-4" value="${tc.testData}">
            
            <h4 class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Status</h4>
            <select id="edit-status-${tc.id}" class="edit-input mb-4">
                <option value="Draft" ${tc.status === 'Draft' ? 'selected' : ''}>Draft</option>
                <option value="Ready" ${tc.status === 'Ready' ? 'selected' : ''}>Ready</option>
                <option value="In Progress" ${tc.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                <option value="Pass" ${tc.status === 'Pass' ? 'selected' : ''}>Pass</option>
                <option value="Fail" ${tc.status === 'Fail' ? 'selected' : ''}>Fail</option>
            </select>

            <div class="grid grid-cols-2 gap-4">
                <div>
                    <h4 class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Expected Result</h4>
                    <textarea id="edit-expected-${tc.id}" class="edit-textarea">${tc.expectedResult}</textarea>
                </div>
                <div>
                    <h4 class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Actual Result</h4>
                    <textarea id="edit-actual-${tc.id}" class="edit-textarea">${tc.actualResult || ''}</textarea>
                </div>
            </div>
        </div>
    `;
}

function cancelEdit() {
    renderTestCasesTable(); // Just re-render everything
}

async function saveEdit(id) {
    const tcIndex = currentTestCases.findIndex(t => t.id === id);
    if (tcIndex === -1) return;

    currentTestCases[tcIndex].testCase = document.getElementById(`edit-title-${id}`).value;
    currentTestCases[tcIndex].preCondition = document.getElementById(`edit-pre-${id}`).value;
    currentTestCases[tcIndex].steps = document.getElementById(`edit-steps-${id}`).value;
    currentTestCases[tcIndex].testData = document.getElementById(`edit-data-${id}`).value;
    currentTestCases[tcIndex].status = document.getElementById(`edit-status-${id}`).value;
    currentTestCases[tcIndex].expectedResult = document.getElementById(`edit-expected-${id}`).value;
    currentTestCases[tcIndex].actualResult = document.getElementById(`edit-actual-${id}`).value;

    await saveTestCases();
    renderTestCasesTable();
    showToast('Changes saved successfully!');
}

function copyRow(id, btn, event) {
    if (event) event.stopPropagation();
    const tc = currentTestCases.find(t => t.id === id);
    if (!tc) return;

    const rowText = [
        tc.id, tc.module, tc.subModule, tc.preCondition, tc.testCase,
        tc.steps, tc.testData, tc.expectedResult, tc.actualResult || '', tc.status
    ].join('\t');

    navigator.clipboard.writeText(rowText).then(() => {
        showToast('Row copied successfully!');
    });
}

function copyAllForExcel() {
    if (currentTestCases.length === 0) return;

    const header = "Test Case ID\tModule\tSub Module\tPre-Condition\tTest Case\tSteps\tTest Data\tExpected Result\tActual Result\tStatus\n";
    const body = currentTestCases.map(tc => [
        tc.id, tc.module, tc.subModule, tc.preCondition, tc.testCase,
        tc.steps, tc.testData, tc.expectedResult, tc.actualResult || '', tc.status
    ].join('\t')).join('\n');

    navigator.clipboard.writeText(header + body).then(() => {
        showToast('Copied all for Excel!');
    });
}

function downloadExcel() {
    if (currentTestCases.length === 0) return;
    if (!window.XLSX) {
        showToast("XLSX library not loaded!");
        return;
    }

    const data = currentTestCases.map(tc => ({
        "Test Case ID": tc.id,
        "Module": tc.module,
        "Sub Module": tc.subModule,
        "Pre-Condition": tc.preCondition,
        "Test Case": tc.testCase,
        "Steps": tc.steps,
        "Test Data": tc.testData,
        "Expected Result": tc.expectedResult,
        "Actual Result": tc.actualResult || '',
        "Status": tc.status
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    worksheet["!cols"] = [
        { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 20 }, { wch: 25 },
        { wch: 40 }, { wch: 20 }, { wch: 30 }, { wch: 30 }, { wch: 12 }
    ];
    worksheet['!autofilter'] = { ref: worksheet['!ref'] };

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Test Cases");

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const moduleName = document.getElementById('module-name')?.value || 'test-cases';
    const filename = `${slugifyFilename(moduleName)}-${timestamp}.xlsx`;

    try {
        const excelBuffer = XLSX.write(workbook, {
            bookType: 'xlsx',
            type: 'array',
            compression: true
        });

        const blob = new Blob([excelBuffer], { type: EXCEL_MIME_TYPE });
        const downloadUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(downloadUrl);
        showToast('Excel download started!');
    } catch (error) {
        console.error(error);
        showToast('Error generating Excel file');
    }
}

async function resolveCurrentUserId() {
    if (currentUserId) return currentUserId;
    if (!window.getCurrentSession) return null;

    try {
        const session = await window.getCurrentSession();
        currentUserId = session?.user?.id || null;
        return currentUserId;
    } catch (error) {
        console.error('Could not resolve authenticated user:', error.message);
        return null;
    }
}

async function saveTestCases() {
    const casesToSave = tsCurrentCases.length > 0 ? tsCurrentCases : currentTestCases;
    localStorage.setItem('qaly_saved_testcases', JSON.stringify(casesToSave));

    if (!window.supabaseClient) return;
    const userId = await resolveCurrentUserId();
    if (!userId) return;

    const { error } = await window.supabaseClient
        .from(TEST_CASES_TABLE)
        .upsert(
            {
                user_id: userId,
                test_cases: casesToSave
            },
            { onConflict: 'user_id' }
        );

    if (error) {
        console.error('Supabase save failed:', error.message);
        showToast('Saved locally. Cloud sync failed.');
    }
}

async function loadTestCases() {
    let loadedFromSupabase = false;

    if (window.supabaseClient) {
        const userId = await resolveCurrentUserId();
        if (userId) {
            const { data, error } = await window.supabaseClient
                .from(TEST_CASES_TABLE)
                .select('test_cases')
                .eq('user_id', userId)
                .single();

            if (!error && data?.test_cases) {
                tsCurrentCases = Array.isArray(data.test_cases) ? data.test_cases : [];
                currentTestCases = tsCurrentCases;
                loadedFromSupabase = true;
            }
        }
    }

    if (!loadedFromSupabase) {
        const saved = localStorage.getItem('qaly_saved_testcases');
        if (saved) {
            try {
                tsCurrentCases = JSON.parse(saved);
                currentTestCases = tsCurrentCases;
            } catch (error) {
                console.error('Failed to parse local test cases:', error.message);
                tsCurrentCases = [];
                currentTestCases = [];
            }
        }
    }

    if (tsCurrentCases.length > 0) {
        document.getElementById('ts-output')?.classList.remove('hidden');
        document.getElementById('ts-regenerate-btn')?.classList.remove('hidden');
        document.getElementById('ts-regenerate-btn')?.classList.add('flex');
        tsRenderTable();
        tsUpdateStats();
    }

    // Legacy support for old test suite
    if (currentTestCases.length > 0) {
        const oldOutput = document.getElementById('test-suite-output');
        if (oldOutput) {
            oldOutput.style.display = 'block';
            renderTestCasesTable();
            updateTestSuiteSummary();
            populateModuleFilter();
        }
    }
}

async function clearTestSuite() {
    if (!confirm('Are you sure you want to clear all generated test cases? This action cannot be undone.')) {
        return;
    }

    currentTestCases = [];
    localStorage.removeItem('qaly_saved_testcases');

    if (window.supabaseClient) {
        const userId = await resolveCurrentUserId();
        if (userId) {
            const { error } = await window.supabaseClient
                .from(TEST_CASES_TABLE)
                .upsert(
                    {
                        user_id: userId,
                        test_cases: []
                    },
                    { onConflict: 'user_id' }
                );

            if (error) {
                console.error('Supabase clear failed:', error.message);
            }
        }
    }

    const output = document.getElementById('test-suite-output');
    if (output) output.style.display = 'none';
    renderTestCasesTable();
    updateTestSuiteSummary();
    populateModuleFilter();
    showToast('Test suite cleared.');
}

// 3. Bug Report Generator
async function generateBugReport(e) {
    if (!validateInput('bug-input', 'bug-error', 'Please enter bug details before generating report')) return;

    const input = document.getElementById('bug-input').value.trim();
    const btn = e.currentTarget;
    setLoading(btn, true);

    try {
        const payload = await resolvePromptPayload('bugReport', input, SYSTEM_PROMPTS.bugReport, {
            templateVars: {
                requirement: input,
                userInput: input
            }
        });
        const response = await generateAI(payload.prompt, payload.systemPrompt, 'bugReport');
        document.getElementById('bug-report-content').innerHTML = response;

        const meta = document.getElementById('bug-meta');
        const confidence = document.getElementById('bug-confidence');
        if (meta && confidence) {
            confidence.textContent = `${generateConfidenceScore()}%`;
            meta.classList.remove('opacity-0');
        }

        document.getElementById('bug-output').style.display = 'block';
        showToast('Report generated!');
    } catch (err) {
        showToast('Error: ' + err.message);
    } finally {
        setLoading(btn, false);
    }
}

function clearBugReport() {
    if (!confirm('Clear all input and output data?')) return;
    document.getElementById('bug-input').value = '';
    document.getElementById('bug-output').style.display = 'none';
    document.getElementById('bug-error').classList.add('hidden');
    document.getElementById('bug-input').classList.remove('border-red-500', 'bg-red-50');
    showToast('Cleared successfully!');
}

// 4. Sentence Correction
async function correctSentence(e) {
    if (!validateInput('sentence-input', 'sentence-error', 'Please enter text to correct')) return;

    const input = document.getElementById('sentence-input').value.trim();
    const btn = e.currentTarget;
    setLoading(btn, true);

    try {
        const payload = await resolvePromptPayload('sentenceCorrection', input, SYSTEM_PROMPTS.sentenceCorrection, {
            templateVars: {
                requirement: input,
                userInput: input
            }
        });
        const response = await generateAI(payload.prompt, payload.systemPrompt, 'sentenceCorrection');
        const data = safeParseJSON(response);

        if (!data) throw new Error("Invalid format");

        document.getElementById('corrected-sentence').textContent = data.corrected;
        document.getElementById('casual-tone').textContent = data.casual;
        document.getElementById('formal-tone').textContent = data.formal;

        const meta = document.getElementById('sentence-meta');
        const confidence = document.getElementById('sentence-confidence');
        if (meta && confidence) {
            confidence.textContent = `${generateConfidenceScore()}%`;
            meta.classList.remove('opacity-0');
        }

        document.getElementById('sentence-output').style.display = 'block';
        const sentenceOutputEmpty = document.getElementById('sentence-output-empty');
        if (sentenceOutputEmpty) sentenceOutputEmpty.style.display = 'none';
        showToast('Correction complete!');
    } catch (err) {
        showToast('Error: ' + err.message);
    } finally {
        setLoading(btn, false);
    }
}

function clearSentenceCorrection() {
    if (!confirm('Clear all input and output data?')) return;
    document.getElementById('sentence-input').value = '';
    document.getElementById('sentence-output').style.display = 'none';
    const sentenceOutputEmpty = document.getElementById('sentence-output-empty');
    if (sentenceOutputEmpty) sentenceOutputEmpty.style.display = 'block';
    document.getElementById('sentence-error').classList.add('hidden');
    document.getElementById('sentence-input').classList.remove('border-red-500', 'bg-red-50');
    showToast('Cleared successfully!');
}

// 5. Professional Case Architect
async function generateProfessionalCase(e) {
    if (!validateInput('professional-case-input', 'professional-case-error', 'Please enter test notes before architecting')) return;

    const input = document.getElementById('professional-case-input').value.trim();
    const btn = e.currentTarget;
    setLoading(btn, true);

    try {
        const payload = await resolvePromptPayload('professionalCase', input, SYSTEM_PROMPTS.professionalCase, {
            templateVars: {
                requirement: input,
                userInput: input
            }
        });
        const response = await generateAI(payload.prompt, payload.systemPrompt, 'professionalCase');
        document.getElementById('professional-case-content').innerHTML = response;

        const meta = document.getElementById('professional-case-meta');
        const confidence = document.getElementById('professional-case-confidence');
        if (meta && confidence) {
            confidence.textContent = `${generateConfidenceScore()}%`;
            meta.classList.remove('opacity-0');
        }

        document.getElementById('professional-case-output').style.display = 'block';
        showToast('Case architected!');
    } catch (err) {
        showToast('Error: ' + err.message);
    } finally {
        setLoading(btn, false);
    }
}

function clearProfessionalCase() {
    if (!confirm('Clear all input and output data?')) return;
    document.getElementById('professional-case-input').value = '';
    document.getElementById('professional-case-output').style.display = 'none';
    document.getElementById('professional-case-error').classList.add('hidden');
    document.getElementById('professional-case-input').classList.remove('border-red-500', 'bg-red-50');
    showToast('Cleared successfully!');
}

// Helper function for Excel Copy
function copyTestCases() {
    const text = document.getElementById('test-cases-excel').textContent;
    navigator.clipboard.writeText(text).then(() => showToast('Copied for Excel!'));
}

function copyBugReport() {
    const content = document.getElementById('bug-report-content').innerText;
    navigator.clipboard.writeText(content).then(() => showToast('Report copied!'));
}

// Export functions to window for HTML access securely
window.generateRequirementIntelligence = generateRequirementIntelligence;
window.generateTestSuite = generateTestSuite;
window.generateBugReport = generateBugReport;
window.correctSentence = correctSentence;
window.generateProfessionalCase = generateProfessionalCase;
window.copyTestCases = copyTestCases;
window.copyBugReport = copyBugReport;
window.filterTestCases = filterTestCases;
window.editTestCase = editTestCase;
window.copyRow = copyRow;
window.copyAllForExcel = copyAllForExcel;
window.downloadExcel = downloadExcel;
window.cancelEdit = cancelEdit;
window.saveEdit = saveEdit;
window.toggleRowExpansion = toggleRowExpansion;
window.clearTestSuite = clearTestSuite;
window.renderTestCasesTable = renderTestCasesTable;
window.copyToClipboard = copyToClipboard;
window.handleRequirementUpload = handleRequirementUpload;

// New Test Suite Architect functions
window.tsGenerate = tsGenerate;
window.tsRegenerate = tsRegenerate;
window.tsFilter = tsFilter;
window.tsRenderTable = tsRenderTable;
window.tsEditRow = tsEditRow;
window.tsAddRow = tsAddRow;
window.tsCopyAll = tsCopyAll;
window.tsDownloadExcel = tsDownloadExcel;
window.tsClearSuite = tsClearSuite;
window.tsClearInput = tsClearInput;

// Clear functions for all modules
window.clearRequirementIntelligence = clearRequirementIntelligence;
window.clearBugReport = clearBugReport;
window.clearSentenceCorrection = clearSentenceCorrection;
window.clearProfessionalCase = clearProfessionalCase;
