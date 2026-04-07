/**
 * QA AI Assistant - Production Version with Real AI Integration
 * Uses Anthropic Claude API for all intelligence features
 */

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_MODEL = 'claude-sonnet-4-20250514';

// ✅ ADD HERE 👇
function safeParseJSON(text) {
    try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        return JSON.parse(jsonMatch[0]);
    } catch (e) {
        console.error("JSON Parse Error", e);
        showToast("AI response format error");
        return null;
    }
}
// API Key Management
function getApiKey(provider) {
    return localStorage.getItem(provider + "_key");
}

function saveApiKey() {
    const claude = document.getElementById('claude-key').value.trim();
    const openai = document.getElementById('openai-key').value.trim();
    const gemini = document.getElementById('gemini-key').value.trim();
    const deepseek = document.getElementById('deepseek-key').value.trim();
    const grok = document.getElementById('grok-key').value.trim();

    if (claude) localStorage.setItem('claude_key', claude);
    if (openai) localStorage.setItem('openai_key', openai);
    if (gemini) localStorage.setItem('gemini_key', gemini);
    if (deepseek) localStorage.setItem('deepseek_key', deepseek);
    if (grok) localStorage.setItem('grok_key', grok);

    console.warn("⚠️ Keys stored in localStorage (not secure for production)");

    closeApiKeyModal();
    showToast('API Keys saved!');
}

function showApiKeyModal() {
    document.getElementById('api-key-modal').style.display = 'flex';

    document.getElementById('claude-key').value = getApiKey("claude") || "";
    document.getElementById('openai-key').value = getApiKey("openai") || "";
    document.getElementById('gemini-key').value = getApiKey("gemini") || "";
    document.getElementById('deepseek-key').value = getApiKey("deepseek") || "";
    document.getElementById('grok-key').value = getApiKey("grok") || "";
}

function closeApiKeyModal() {
    document.getElementById('api-key-modal').style.display = 'none';
}

// Check API key on load
window.addEventListener('DOMContentLoaded', () => {
    if (!getApiKey("claude")) {
        setTimeout(showApiKeyModal, 500);
    }
    initializeApp();
});

// Toast Notification
function showToast(message) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.remove('opacity-0', 'translate-y-8');
    toast.classList.add('opacity-100', 'translate-y-0');
    setTimeout(() => {
        toast.classList.remove('opacity-100', 'translate-y-0');
        toast.classList.add('opacity-0', 'translate-y-8');
    }, 3000);
}

// Loading State Management
function setLoading(btn, isLoading) {
    if (!btn) return;
    const btnText = btn.querySelector('.btn-text');
    const spinIcon = btn.querySelector('.spin-icon');

    if (isLoading) {
        btn.classList.add('generating-btn');
        btn.disabled = true;
        if (btnText) btnText.textContent = 'Processing...';
    } else {
        btn.classList.remove('generating-btn');
        btn.disabled = false;
        if (btnText) {
            // Restore original text based on button context
            const originalTexts = {
                'requirement-correction': 'Analyze Requirement',
                'test-case-architect': 'Generate Test Cases',
                'bug-report-gen': 'Generate Report',
                'sentence-correction': 'Correct Sentence',
                'test-case-gen': 'Architect Case'
            };
            const activeSection = document.querySelector('.module-section.active');
            if (activeSection) {
                btnText.textContent = originalTexts[activeSection.id] || 'Generate';
            }
        }
    }
}

// Core AI Function - Calls Anthropic API
async function generateAI(prompt, systemPrompt = "") {
    const provider = document.getElementById("ai-provider")?.value || "claude";

    if (provider === "claude") {
        return await callClaudeAPI(prompt, systemPrompt);
    }
    if (provider === "openai") {
        return await callOpenAI(prompt);
    }
    if (provider === "gemini") {
        return await callGemini(prompt);
    }
    if (provider === "deepseek") {
        return await callDeepSeek(prompt);
    }
    if (provider === "grok") {
        return await callGrok(prompt);
    }

    return await callClaudeAPI(prompt, systemPrompt);
}


async function callClaudeAPI(prompt, systemPrompt = "") {
    const apiKey = getApiKey("claude");
    if (!apiKey) {
        showToast("Claude API key missing!");
        return;
    }

    try {
        const res = await fetch(ANTHROPIC_API_URL, {
            method: 'POST',
            headers: {
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
                'content-type': 'application/json',
                'dangerously-allow-browser': 'true'
            },
            body: JSON.stringify({
                model: CLAUDE_MODEL,
                max_tokens: 4000,
                system: systemPrompt,
                messages: [{ role: 'user', content: prompt }]
            })
        });

        const data = await res.json();
        if (data.error) {
            console.error("Claude Error:", data.error);
            showToast("Claude Error: " + data.error.message);
            return null;
        }
        return data.content[0].text;
    } catch (error) {
        console.error("Claude Fetch Error:", error);
        showToast("Failed to connect to Claude");
        return null;
    }
}

async function callOpenAI(prompt) {
    const apiKey = getApiKey("openai");

    // ✅ ADD HERE 👇 (FIRST LINE AFTER apiKey)
    if (!apiKey) {
        showToast("OpenAI key missing, switching to Claude");
        return await callClaudeAPI(prompt);
    }

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Authorization": "Bearer " + apiKey,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }]
        })
    });

    const data = await res.json();
    if (!data.choices) {
        showToast("OpenAI error");
        return null;
    }
}

async function callGemini(prompt) {
    const apiKey = getApiKey("gemini");

    if (!apiKey) {
        showToast("Gemini key missing, switching to Claude");
        return await callClaudeAPI(prompt);
    }

    try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }]
            })
        });

        const data = await res.json();
        if (data.error) {
            console.error("Gemini Error:", data.error);
            showToast("Gemini Error: " + data.error.message);
            return null;
        }
        return data.candidates[0].content.parts[0].text;
    } catch (error) {
        console.error("Gemini Fetch Error:", error);
        showToast("Failed to connect to Gemini");
        return null;
    }
}

async function callDeepSeek(prompt) {
    const apiKey = getApiKey("deepseek");

    if (!apiKey) {
        showToast("DeepSeek key missing, switching to Claude");
        return await callClaudeAPI(prompt);
    }

    const res = await fetch("https://api.deepseek.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Authorization": "Bearer " + apiKey,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            model: "deepseek-chat",
            messages: [{ role: "user", content: prompt }]
        })
    });

    const data = await res.json();
    if (!data.choices) {
        showToast("DeepSeek error");
        return null;
    }
}

async function callGrok(prompt) {
    const apiKey = getApiKey("grok");

    if (!apiKey) {
        showToast("Grok key missing, switching to Claude");
        return await callClaudeAPI(prompt);
    }

    const res = await fetch("https://api.x.ai/v1/chat/completions", {
        method: "POST",
        headers: {
            "Authorization": "Bearer " + apiKey,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            model: "grok-1",
            messages: [{ role: "user", content: prompt }]
        })
    });

    const data = await res.json();
    if (!data.choices) {
        showToast("Grok error");
        return null;
    }
}



// === FEATURE 1: Requirement Intelligence ===
async function generateRequirementIntelligence() {
    const input = document.getElementById('req-intel-input').value.trim();
    const btn = event.target.closest('button');

    if (!input) {
        showToast('Please enter a requirement!');
        return;
    }

    setLoading(btn, true);

    const systemPrompt = `You are a senior Business Analyst and QA expert. Analyze requirements and provide:
1. Corrected/improved specification
2. Gap analysis (missing details, edge cases)
3. Test scenario suggestions

Format your response as JSON with keys: corrected_spec, gaps (array), test_scenarios (array)`;

    const prompt = `Analyze this requirement and provide comprehensive analysis:\n\n${input}`;

    try {
        const response = await generateAI(prompt, systemPrompt);
        const analysis = safeParseJSON(response);
        if (!analysis) return;

        // Display Corrected Spec
        document.getElementById('corrected-spec').innerHTML = `
            <div class="space-y-4">
                <div>
                    <h4 class="text-sm font-bold text-blue-600 mb-2">✓ IMPROVED SPECIFICATION</h4>
                    <p class="text-sm text-slate-700 leading-relaxed">${analysis.corrected_spec}</p>
                </div>
            </div>
        `;

        // Display Gaps
        const gapsHtml = analysis.gaps.map(gap => `
            <div class="flex gap-3 items-start">
                <span class="material-symbols-outlined text-orange-600 text-sm mt-0.5">warning</span>
                <p class="text-sm text-orange-900">${gap}</p>
            </div>
        `).join('');
        document.getElementById('gap-analysis').innerHTML = gapsHtml;

        // Display Test Scenarios
        const scenariosHtml = analysis.test_scenarios.map((scenario, idx) => `
            <div class="flex gap-3 items-start">
                <span class="flex-shrink-0 w-6 h-6 rounded-full bg-green-600 text-white text-xs flex items-center justify-center font-bold">${idx + 1}</span>
                <p class="text-sm text-green-900">${scenario}</p>
            </div>
        `).join('');
        document.getElementById('test-scenarios').innerHTML = scenariosHtml;

        document.getElementById('req-intel-output').style.display = 'block';
        showToast('Analysis complete!');
    } catch (error) {
        console.error("AI Error:", error);
        showToast('AI failed. Please try again.');
    } finally {
        setLoading(btn, false);
    }
}

// === FEATURE 2: Test Suite Architect ===
async function generateTestSuite() {
    const requirement = document.getElementById('test-suite-input').value.trim();
    const module = document.getElementById('module-name').value.trim() || 'General';
    const subModule = document.getElementById('sub-module-name').value.trim() || 'N/A';
    const btn = event.target.closest('button');

    if (!requirement) {
        showToast('Please enter a requirement!');
        return;
    }

    setLoading(btn, true);

    const systemPrompt = `You are a Senior QA Engineer. Generate comprehensive test cases in pipe-separated format for Excel import.
Format: Test Case ID | Module | Sub Module | Pre-Condition | Test Case | Steps | Test Data | Expected Result | Actual Result | Date | Status | Bug Id | Retest Status | Remarks

Generate at least 15-20 test cases covering: positive, negative, boundary, security, and performance scenarios.`;

    const prompt = `Generate test cases for:
Module: ${module}
Sub Module: ${subModule}
Requirement: ${requirement}

Return ONLY the pipe-separated table with header row.`;

    try {
        const response = await generateAI(prompt, systemPrompt);

        document.getElementById('test-cases-excel').textContent = response;
        document.getElementById('test-suite-output').style.display = 'block';
        showToast('Test suite generated!');
    } catch (error) {
        console.error("AI Error:", error);
        showToast('AI failed. Please try again.');
    } finally {
        setLoading(btn, false);
    }
}

function copyTestCases() {
    const text = document.getElementById('test-cases-excel').textContent;
    navigator.clipboard.writeText(text);
    showToast('Copied! Ready to paste in Excel');
}

// === FEATURE 3: Bug Report Generator ===
async function generateBugReport() {
    const input = document.getElementById('bug-input').value.trim();
    const btn = event.target.closest('button');

    if (!input) {
        showToast('Please describe the bug!');
        return;
    }

    setLoading(btn, true);

    const systemPrompt = `You are a QA Engineer. Transform rough bug notes into a professional JIRA-ready bug report.
Include: Title, Severity, Environment, Description, Steps to Reproduce, Expected Result, Actual Result.
Format as clean HTML with proper headings.`;

    const prompt = `Transform this into a professional bug report:\n\n${input}`;

    try {
        const response = await generateAI(prompt, systemPrompt);

        document.getElementById('bug-report-content').innerHTML = response;
        document.getElementById('bug-output').style.display = 'block';
        showToast('Bug report generated!');
    } catch (error) {
        console.error("AI Error:", error);
        showToast('AI failed. Please try again.');
    } finally {
        setLoading(btn, false);
    }
}

function copyBugReport() {
    const text = document.getElementById('bug-report-content').innerText;
    navigator.clipboard.writeText(text);
    showToast('Bug report copied!');
}

// === FEATURE 4: Sentence Correction ===
async function correctSentence() {
    const input = document.getElementById('sentence-input').value.trim();
    const btn = event.target.closest('button');

    if (!input) {
        showToast('Please enter a sentence!');
        return;
    }

    setLoading(btn, true);

    const systemPrompt = `You are a professional editor. Correct grammar, improve clarity, and provide variants.
Return JSON with: corrected (standard), casual (informal tone), formal (business tone)`;

    const prompt = `Correct and improve this sentence:\n\n"${input}"`;

    try {
        const response = await generateAI(prompt, systemPrompt);
        const result = safeParseJSON(response);
        if (!result) return;
        document.getElementById('corrected-sentence').textContent = result.corrected;
        document.getElementById('casual-tone').textContent = result.casual;
        document.getElementById('formal-tone').textContent = result.formal;

        document.getElementById('sentence-output').style.display = 'block';
        showToast('Sentence corrected!');
    } catch (error) {
        console.error("AI Error:", error);
        showToast('AI failed. Please try again.');
    } finally {
        setLoading(btn, false);
    }
}

// === FEATURE 5: Professional Case Architect ===
async function generateProfessionalCase() {
    const input = document.getElementById('professional-case-input').value.trim();
    const btn = event.target.closest('button');

    if (!input) {
        showToast('Please enter rough test notes!');
        return;
    }

    setLoading(btn, true);

    const systemPrompt = `You are a Senior QA Engineer. Transform rough test notes into a structured professional test case.
Include: Test Objective, Preconditions, Steps (numbered), Expected Result.
Format as clean HTML with proper sections.`;

    const prompt = `Transform this into a professional test case:\n\n${input}`;

    try {
        const response = await generateAI(prompt, systemPrompt);

        document.getElementById('professional-case-content').innerHTML = response;
        document.getElementById('professional-case-output').style.display = 'block';
        showToast('Professional case generated!');
    } catch (error) {
        console.error("AI Error:", error);
        showToast('AI failed. Please try again.');
    } finally {
        setLoading(btn, false);
    }
}

// === Navigation System ===
function initializeApp() {
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.module-section');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            // Remove active class from all
            navItems.forEach(n => {
                n.classList.remove('active', 'bg-blue-50', 'text-blue-700');
                n.classList.add('text-slate-600');
            });

            // Add active class to clicked
            item.classList.add('active', 'bg-blue-50', 'text-blue-700');
            item.classList.remove('text-slate-600');

            // Switch sections
            const targetId = item.getAttribute('data-target');
            sections.forEach(s => s.classList.remove('active'));
            document.getElementById(targetId).classList.add('active');
        });
    });
}