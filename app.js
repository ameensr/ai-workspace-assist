/**
 * Qaly AI - Application Logic
 * Integrates with Gemini API and handles all UI modules.
 */

// ============================================
// CONFIGURATION & STATE
// ============================================
const DEBUG = true;

// UI State Management
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initCopyButtons();
    checkAPIStatus();
});

function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.module-section');

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
    const originalText = btn.getAttribute('data-original-text') || btn.querySelector('.btn-text')?.textContent;
    if (!btn.getAttribute('data-original-text')) btn.setAttribute('data-original-text', originalText);

    if (isLoading) {
        btn.classList.add('generating-btn');
        btn.disabled = true;
        const btnText = btn.querySelector('.btn-text');
        if (btnText) btnText.textContent = 'Processing...';
    } else {
        btn.classList.remove('generating-btn');
        btn.disabled = false;
        const btnText = btn.querySelector('.btn-text');
        if (btnText) btnText.textContent = originalText;
    }
}

function safeParseJSON(str) {
    try {
        // Clean up markdown code blocks if present
        const cleanStr = str.replace(/```json\n?|\n?```/g, '').trim();
        return JSON.parse(cleanStr);
    } catch (e) {
        console.error("JSON Parse Error:", e, "Original string:", str);
        // Fallback for partial JSON or plain text
        if (str.includes('{') && str.includes('}')) {
             const start = str.indexOf('{');
             const end = str.lastIndexOf('}') + 1;
             try { return JSON.parse(str.substring(start, end)); } catch(ie) {}
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
                    showToast('Copied to clipboard!');
                });
            }
        }
    });
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
    // Check if test mode is enabled (defined in app.js or test-config.js)
    const isTestMode = (typeof TEST_MODE !== 'undefined' && TEST_MODE) || (typeof appConfig !== 'undefined' && appConfig.testMode);

    if (isTestMode) {
        console.log(`🧪 TEST MODE: Mocking [${featureType}]`);
        await new Promise(r => setTimeout(r, 1500));
        
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
    const isTestMode = (typeof TEST_MODE !== 'undefined' && TEST_MODE);
    if (dot) {
        dot.className = isTestMode ? 'w-2.5 h-2.5 rounded-full bg-orange-500' : 'w-2.5 h-2.5 rounded-full bg-green-500';
        dot.title = isTestMode ? 'Running in TEST MODE (Mocking)' : 'API Active';
    }
}

// ============================================
// FEATURE HANDLERS
// ============================================

// 1. Requirement Intelligence
async function generateRequirementIntelligence(e) {
    const input = document.getElementById('req-intel-input').value.trim();
    if (!input) return showToast('Please enter a requirement!');

    const btn = e.currentTarget;
    setLoading(btn, true);

    try {
        const response = await generateAI(input, SYSTEM_PROMPTS.requirementIntelligence, 'requirementIntelligence');
        const data = safeParseJSON(response);

        if (!data) throw new Error("Could not parse AI response");

        document.getElementById('corrected-spec').innerHTML = `<p class="text-sm text-slate-700 leading-relaxed">${data.corrected_spec}</p>`;
        
        document.getElementById('gap-analysis').innerHTML = (data.gaps || []).map(gap => `
            <div class="flex gap-3 items-start p-2 bg-white/50 rounded-lg">
                <span class="material-symbols-outlined text-orange-600 text-sm mt-0.5">warning</span>
                <p class="text-xs text-slate-700 font-medium">${gap}</p>
            </div>
        `).join('');

        document.getElementById('test-scenarios').innerHTML = (data.test_scenarios || []).map((sc, i) => `
            <div class="flex gap-3 items-start p-2 bg-white/50 rounded-lg">
                <span class="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 text-green-700 text-[10px] flex items-center justify-center font-bold">${i+1}</span>
                <p class="text-xs text-slate-700 font-medium">${sc}</p>
            </div>
        `).join('');

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
    const module = document.getElementById('module-name').value.trim();
    const subModule = document.getElementById('sub-module-name').value.trim();
    const input = document.getElementById('test-suite-input').value.trim();
    
    if (!input) return showToast('Please enter feature description!');

    const btn = e.currentTarget;
    setLoading(btn, true);

    const prompt = `Module: ${module}, Sub-Module: ${subModule}\nRequirement: ${input}`;

    try {
        const response = await generateAI(prompt, SYSTEM_PROMPTS.testSuite, 'testSuite');
        document.getElementById('test-cases-excel').textContent = response;
        document.getElementById('test-suite-output').style.display = 'block';
        showToast('Test cases generated!');
    } catch (err) {
        showToast('Error: ' + err.message);
    } finally {
        setLoading(btn, false);
    }
}

// 3. Bug Report Generator
async function generateBugReport(e) {
    const input = document.getElementById('bug-input').value.trim();
    if (!input) return showToast('Please enter bug notes!');

    const btn = e.currentTarget;
    setLoading(btn, true);

    try {
        const response = await generateAI(input, SYSTEM_PROMPTS.bugReport, 'bugReport');
        document.getElementById('bug-report-content').innerHTML = response;
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
    const input = document.getElementById('sentence-input').value.trim();
    if (!input) return showToast('Please enter a sentence!');

    const btn = e.currentTarget;
    setLoading(btn, true);

    try {
        const response = await generateAI(input, SYSTEM_PROMPTS.sentenceCorrection, 'sentenceCorrection');
        const data = safeParseJSON(response);

        if (!data) throw new Error("Invalid format");

        document.getElementById('corrected-sentence').textContent = data.corrected;
        document.getElementById('casual-tone').textContent = data.casual;
        document.getElementById('formal-tone').textContent = data.formal;
        
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
    const input = document.getElementById('professional-case-input').value.trim();
    if (!input) return showToast('Please enter test notes!');

    const btn = e.currentTarget;
    setLoading(btn, true);

    try {
        const response = await generateAI(input, SYSTEM_PROMPTS.professionalCase, 'professionalCase');
        document.getElementById('professional-case-content').innerHTML = response;
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

// Export functions to window for HTML access
window.generateRequirementIntelligence = generateRequirementIntelligence;
window.generateTestSuite = generateTestSuite;
window.generateBugReport = generateBugReport;
window.correctSentence = correctSentence;
window.generateProfessionalCase = generateProfessionalCase;
window.copyTestCases = copyTestCases;
window.copyBugReport = copyBugReport;