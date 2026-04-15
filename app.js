/**
 * Qaly AI - Application Logic
 * Integrates with Gemini API and handles all UI modules.
 */

// ============================================
// CONFIGURATION & STATE
// ============================================
const DEBUG = true;
const TEST_CASES_TABLE = 'user_test_suites';

// UI State Management
let currentTestCases = [];
let currentUserId = null;

// Initialize application
async function initApp() {
    initNavigation();
    initCopyButtons();
    await initUserIdentity();
    initUserMenu();
    checkAPIStatus();
    await loadTestCases();
}

document.addEventListener('DOMContentLoaded', initApp);

function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.module-section');
    const specialItems = document.querySelectorAll('.nav-item-special');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const target = item.getAttribute('data-target');

            // Update Nav UI
            navItems.forEach(i => i.classList.remove('active', 'bg-blue-50', 'text-blue-700'));
            item.classList.add('active', 'bg-blue-50', 'text-blue-700');

            // Update Section UI
            sections.forEach(s => s.classList.remove('active'));
            const targetSection = document.getElementById(target);
            if (targetSection) targetSection.classList.add('active');
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
            btnText.textContent = 'Analyzing requirement...';
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
        const cleanStr = str.replace(/```json\n?|\n?```/g, '').trim();
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

// ============================================
// AI CORE
// ============================================

async function callGemini(prompt, systemPrompt = "") {
    const apiKey = typeof appConfig !== 'undefined' ? appConfig.geminiApiKey : null;
    if (!apiKey || apiKey === "YOUR_API_KEY_HERE") {
        throw new Error("Gemini API Key missing in config.js");
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{
                parts: [{ text: `${systemPrompt}\n\nUser Input: ${prompt}` }]
            }]
        })
    });

    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error?.message || "API Call Failed");
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
}

async function generateAI(prompt, systemPrompt = "", featureType = "") {
    // Show "Processing..." toast immediately
    showToast('🚀 Analyzing requirement...', 2000);

    // Add artificial delay to manage UX expectations (1.5s - 2s)
    const delay = Math.floor(Math.random() * 500) + 1500;
    await new Promise(r => setTimeout(r, delay));

    // Check if test mode is enabled
    const isTestMode = (typeof TEST_MODE !== 'undefined' && TEST_MODE) || (typeof appConfig !== 'undefined' && appConfig.testMode);

    if (isTestMode) {
        console.log(`🧪 TEST MODE: Mocking [${featureType}]`);

        // Use MOCK_RESPONSES from test-config.js if available, else local fallback
        if (typeof MOCK_RESPONSES !== 'undefined' && MOCK_RESPONSES[featureType]) {
            return MOCK_RESPONSES[featureType];
        }
        return "Mock response: Please integrate test-config.js for detailed mocks.";
    }

    return await callGemini(prompt, systemPrompt);
}

function checkAPIStatus() {
    const dot = document.getElementById('api-status-dot');
    const text = document.getElementById('api-status-text');
    const container = document.getElementById('api-status-container');
    const isTestMode = (typeof TEST_MODE !== 'undefined' && TEST_MODE);
    const apiKey = typeof appConfig !== 'undefined' ? appConfig.geminiApiKey : null;
    const hasKey = apiKey && apiKey !== "YOUR_API_KEY_HERE";

    if (!dot || !text) return;
    if (container) container.classList.add('modern-tooltip');

    if (isTestMode) {
        dot.className = 'w-2.5 h-2.5 rounded-full bg-yellow-500 animate-pulse';
        text.textContent = 'Mock Mode';
        const tooltipText = 'Mock Mode: AI responses are simulated test data, not live Gemini output.';
        if (container) container.setAttribute('data-tooltip', tooltipText);
        dot.removeAttribute('title');
        text.removeAttribute('title');
    } else if (hasKey) {
        dot.className = 'w-2.5 h-2.5 rounded-full bg-green-500';
        text.textContent = '🟢 Gemini Connected';
        const tooltipText = 'Gemini Connected: Responses are generated from live Gemini API.';
        if (container) container.setAttribute('data-tooltip', tooltipText);
        dot.removeAttribute('title');
        text.removeAttribute('title');
    } else {
        dot.className = 'w-2.5 h-2.5 rounded-full bg-red-500';
        text.textContent = '🔴 No API Configured';
        const tooltipText = 'No API Configured: Add geminiApiKey in config.js to enable live AI responses.';
        if (container) container.setAttribute('data-tooltip', tooltipText);
        dot.removeAttribute('title');
        text.removeAttribute('title');
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
        const response = await generateAI(input, SYSTEM_PROMPTS.requirementIntelligence, 'requirementIntelligence');
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

// 2. Test Suite Architect
async function generateTestSuite(e) {
    if (!validateInput('test-suite-input', 'test-suite-error', 'Please enter feature details before generating')) return;

    const module = document.getElementById('module-name').value.trim();
    const subModule = document.getElementById('sub-module-name').value.trim();
    const input = document.getElementById('test-suite-input').value.trim();

    const btn = e.currentTarget;
    setLoading(btn, true);

    const prompt = `Module: ${module}, Sub-Module: ${subModule}\nRequirement: ${input}`;

    try {
        const response = await generateAI(prompt, SYSTEM_PROMPTS.testSuite, 'testSuite');
        const data = safeParseJSON(response);

        if (data && Array.isArray(data)) {
            currentTestCases = data;
            await saveTestCases();
            renderTestCasesTable();
            updateTestSuiteSummary();
            populateModuleFilter();

            // Handle Confidence Score
            const confidence = document.getElementById('test-suite-confidence');
            if (confidence) {
                confidence.textContent = `${generateConfidenceScore()}%`;
            }

            document.getElementById('test-suite-output').style.display = 'block';
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

function cancelEdit(id, event) {
    renderTestCasesTable(); // Just re-render everything
}

async function saveEdit(id, event) {
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

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Test Cases");

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `test-cases-${timestamp}.xlsx`;

    try {
        XLSX.writeFile(workbook, filename);
        showToast('Excel download started!');
    } catch (error) {
        console.error(error);
        showToast('Error generating Excel file');
    }
}

function saveTestCasesToLocal() {
    localStorage.setItem('qaly_saved_testcases', JSON.stringify(currentTestCases));
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
    saveTestCasesToLocal(); // Fallback cache for offline/temporary failures.

    if (!window.supabaseClient) return;
    const userId = await resolveCurrentUserId();
    if (!userId) return;

    const { error } = await window.supabaseClient
        .from(TEST_CASES_TABLE)
        .upsert(
            {
                user_id: userId,
                test_cases: currentTestCases
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
                currentTestCases = Array.isArray(data.test_cases) ? data.test_cases : [];
                loadedFromSupabase = true;
            }
        }
    }

    if (!loadedFromSupabase) {
        const saved = localStorage.getItem('qaly_saved_testcases');
        if (saved) {
            try {
                currentTestCases = JSON.parse(saved);
            } catch (error) {
                console.error('Failed to parse local test cases:', error.message);
                currentTestCases = [];
            }
        }
    }

    if (currentTestCases.length > 0) {
        document.getElementById('test-suite-output').style.display = 'block';
        renderTestCasesTable();
        updateTestSuiteSummary();
        populateModuleFilter();
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
        const response = await generateAI(input, SYSTEM_PROMPTS.bugReport, 'bugReport');
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

// 4. Sentence Correction
async function correctSentence(e) {
    if (!validateInput('sentence-input', 'sentence-error', 'Please enter text to correct')) return;

    const input = document.getElementById('sentence-input').value.trim();
    const btn = e.currentTarget;
    setLoading(btn, true);

    try {
        const response = await generateAI(input, SYSTEM_PROMPTS.sentenceCorrection, 'sentenceCorrection');
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
        showToast('Correction complete!');
    } catch (err) {
        showToast('Error: ' + err.message);
    } finally {
        setLoading(btn, false);
    }
}

// 5. Professional Case Architect
async function generateProfessionalCase(e) {
    if (!validateInput('professional-case-input', 'professional-case-error', 'Please enter test notes before architecting')) return;

    const input = document.getElementById('professional-case-input').value.trim();
    const btn = e.currentTarget;
    setLoading(btn, true);

    try {
        const response = await generateAI(input, SYSTEM_PROMPTS.professionalCase, 'professionalCase');
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
window.copyToClipboard = copyToClipboard; // Shared copy helper
