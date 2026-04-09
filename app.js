// Check API key presence and initialize
window.addEventListener('DOMContentLoaded', () => {
    updateApiStatus();
    initializeApp();
});

// Update API Status UI
function updateApiStatus() {
    const dot = document.getElementById('api-status-dot');
    if (!dot) return;

    if (appConfig.geminiApiKey && appConfig.geminiApiKey.length > 5) {
        dot.classList.remove('bg-slate-300', 'bg-red-500');
        dot.classList.add('bg-green-500');
        dot.classList.remove('animate-pulse');
    } else {
        dot.classList.remove('bg-slate-300', 'bg-green-500');
        dot.classList.add('bg-red-500');
        dot.classList.add('animate-pulse');
    }
}

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

// Core AI Function - Multi-provider removed, Gemini only
async function generateAI(prompt, systemPrompt = "") {
    return await callGemini(prompt, systemPrompt);
}


async function callGemini(prompt, systemPrompt = "") {
    const apiKey = appConfig.geminiApiKey;

    if (!apiKey || apiKey.length < 5) {
        showToast("Gemini API key missing in config.js");
        updateApiStatus();
        return null;
    }

    try {
        const requestBody = {
            contents: [{
                parts: [{ text: prompt }]
            }]
        };

        if (systemPrompt) {
            requestBody.system_instruction = {
                parts: [{ text: systemPrompt }]
            };
        }

        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(requestBody)
        });

        const data = await res.json();

        if (data.error) {
            console.error("Gemini Error:", data.error);
            showToast("Gemini Error: " + data.error.message);
            return null;
        }

        if (!data.candidates || !data.candidates[0].content || !data.candidates[0].content.parts[0].text) {
             console.error("Gemini Error: Invalid response structure", data);
             showToast("Gemini Error: Invalid response");
             return null;
        }

        return data.candidates[0].content.parts[0].text;
    } catch (error) {
        console.error("Gemini Fetch Error:", error);
        showToast("Failed to connect to Gemini");
        return null;
    }
}





// Helper for robust JSON parsing from AI responses
function safeParseJSON(text) {
    try {
        // Clean markdown code blocks if present
        const cleaned = text.replace(/```json\n?|```/g, '').trim();
        return JSON.parse(cleaned);
    } catch (e) {
        console.error("JSON Parse Error:", e);
        console.error("Original Text:", text);
        showToast("Error processing AI response format");
        return null;
    }
}

// === FEATURE 1: Requirement Intelligence ===
async function generateRequirementIntelligence(e) {
    const input = document.getElementById('req-intel-input').value.trim();
    const btn = (e && e.target ? e.target : (window.event ? window.event.target : null))?.closest('button');

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
        const gapsHtml = (analysis.gaps || []).map(gap => `
            <div class="flex gap-3 items-start">
                <span class="material-symbols-outlined text-orange-600 text-sm mt-0.5">warning</span>
                <p class="text-sm text-orange-900">${gap}</p>
            </div>
        `).join('');
        document.getElementById('gap-analysis').innerHTML = gapsHtml;

        // Display Test Scenarios
        const scenariosHtml = (analysis.test_scenarios || []).map((scenario, idx) => `
            <div class="flex gap-3 items-start">
                <span class="flex-shrink-0 w-6 h-6 rounded-full bg-green-600 text-white text-xs flex items-center justify-center font-bold">${idx + 1}</span>
                <p class="text-sm text-green-900">${scenario}</p>
            </div>
        `).join('');
        document.getElementById('test-scenarios').innerHTML = scenariosHtml;

        document.getElementById('req-intel-output').style.display = 'block';
        showToast('Analysis complete!');
    } catch (error) {
        console.error("Requirement Intelligence AI Error:", error);
        showToast('AI failed. Please try again.');
    } finally {
        setLoading(btn, false);
    }
}

// === FEATURE 2: Test Suite Architect ===
async function generateTestSuite(e) {
    const requirement = document.getElementById('test-suite-input').value.trim();
    const module = document.getElementById('module-name').value.trim() || 'General';
    const subModule = document.getElementById('sub-module-name').value.trim() || 'N/A';
    const btn = (e && e.target ? e.target : (window.event ? window.event.target : null))?.closest('button');

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
        console.error("TestSuiteArchitect AI Error:", error);
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
async function generateBugReport(e) {
    const input = document.getElementById('bug-input').value.trim();
    const btn = (e && e.target ? e.target : (window.event ? window.event.target : null))?.closest('button');

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
        console.error("BugReportGenerator AI Error:", error);
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
async function correctSentence(e) {
    const input = document.getElementById('sentence-input').value.trim();
    const btn = (e && e.target ? e.target : (window.event ? window.event.target : null))?.closest('button');

    if (!input) {
        showToast('Please enter a sentence!');
        return;
    }

    setLoading(btn, true);

    const systemPrompt = `You are a professional editor. Correct grammar, improve clarity, and provide variants.
Return JSON with: corrected (standard), casual (informal tone), formal (business tone)`;

    const prompt = `Correct and improve this sentence:\n\n\"${input}\"`;

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
        console.error("SentenceCorrection AI Error:", error);
        showToast('AI failed. Please try again.');
    } finally {
        setLoading(btn, false);
    }
}

// === FEATURE 5: Professional Case Architect ===
async function generateProfessionalCase(e) {
    const input = document.getElementById('professional-case-input').value.trim();
    const btn = (e && e.target ? e.target : (window.event ? window.event.target : null))?.closest('button');

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
        console.error("ProfessionalCaseArchitect AI Error:", error);
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
