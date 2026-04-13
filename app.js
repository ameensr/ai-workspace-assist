// Modified app.js - Add this at the top of your existing app.js

// ============================================
// TEST MODE CONFIGURATION
// ============================================
// Set TEST_MODE = true to use mock responses (no API calls)
// Set TEST_MODE = false for production (real API calls)
const TEST_MODE = true; // ← Change this to false when ready to use real API

// Mock responses for testing (no API cost)
const MOCK_RESPONSES = {
    requirementIntelligence: `{
        "corrected_spec": "User Authentication Feature: Users must be able to securely log in using email and password credentials. The system shall validate credentials against the database, implement rate limiting (5 attempts per 15 minutes), support password reset functionality, and maintain session security with JWT tokens.",
        "gaps": [
            "Missing specification for password complexity requirements",
            "No mention of multi-factor authentication (MFA) support",
            "Unclear session timeout duration"
        ],
        "test_scenarios": [
            "Verify successful login with valid credentials",
            "Verify login rejection with invalid password",
            "Verify account lockout after 5 failed attempts"
        ]
    }`,
    testSuite: `Test Case ID | Module | Sub Module | Pre-Condition | Test Case | Steps | Test Data | Expected Result
TC_001 | Auth | Login | User exists | Valid Login | 1. Open login page 2. Enter credentials | user@test.com | Login successful
TC_002 | Auth | Login | User exists | Invalid Password | 1. Enter wrong password | wrongpass | Error displayed`,
    bugReport: `<h3>Bug: Email Validation Missing</h3><p><strong>Severity:</strong> Medium</p><p>Login form accepts invalid emails.</p>`,
    sentenceCorrection: `{"corrected": "The login should validate credentials properly.", "casual": "Login needs to check if the info is right.", "formal": "The authentication module shall validate user credentials appropriately."}`,
    professionalCase: `<h3>Test Case: Login Validation</h3><p><strong>Objective:</strong> Verify login works correctly</p><ol><li>Open login page</li><li>Enter credentials</li><li>Click login</li></ol>`
};

// Simulated delay to mimic API response time
function mockDelay(ms = 1500) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================
// MODIFIED AI FUNCTION WITH TEST MODE
// ============================================
async function generateAI(prompt, systemPrompt = "", featureType = "") {
    // If test mode is ON, return mock response
    if (TEST_MODE) {
        console.log("🧪 TEST MODE: Using mock response (no API call)");
        await mockDelay(1500); // Simulate API delay

        // Return appropriate mock based on feature
        if (prompt.includes('requirement') || featureType === 'requirement') {
            return MOCK_RESPONSES.requirementIntelligence;
        } else if (prompt.includes('test cases') || featureType === 'testSuite') {
            return MOCK_RESPONSES.testSuite;
        } else if (prompt.includes('bug') || featureType === 'bugReport') {
            return MOCK_RESPONSES.bugReport;
        } else if (prompt.includes('sentence') || featureType === 'sentence') {
            return MOCK_RESPONSES.sentenceCorrection;
        } else if (featureType === 'professionalCase') {
            return MOCK_RESPONSES.professionalCase;
        }

        return MOCK_RESPONSES.requirementIntelligence; // Default
    }

    // If test mode is OFF, make real API call
    console.log("🔴 PRODUCTION MODE: Making real API call");
    return await callGemini(prompt, systemPrompt);
}

// ============================================
// UPDATE YOUR FEATURE FUNCTIONS
// ============================================
// Add featureType parameter to each function call

// Example for Requirement Intelligence:
async function generateRequirementIntelligence(e) {
    const input = document.getElementById('req-intel-input').value.trim();
    const btn = e?.target?.closest('button');

    if (!input) {
        showToast('Please enter a requirement!');
        return;
    }

    setLoading(btn, true);

    const systemPrompt = `You are a senior Business Analyst...`;
    const prompt = `Analyze this requirement: ${input}`;

    try {
        // Pass 'requirement' as featureType to get correct mock
        const response = await generateAI(prompt, systemPrompt, 'requirement');
        const analysis = safeParseJSON(response);

        if (!analysis) return;

        // Display results (same as before)
        document.getElementById('corrected-spec').innerHTML = `
            <div class="space-y-4">
                <div>
                    <h4 class="text-sm font-bold text-blue-600 mb-2">✓ IMPROVED SPECIFICATION</h4>
                    <p class="text-sm text-slate-700 leading-relaxed">${analysis.corrected_spec}</p>
                </div>
            </div>
        `;

        const gapsHtml = (analysis.gaps || []).map(gap => `
            <div class="flex gap-3 items-start">
                <span class="material-symbols-outlined text-orange-600 text-sm mt-0.5">warning</span>
                <p class="text-sm text-orange-900">${gap}</p>
            </div>
        `).join('');
        document.getElementById('gap-analysis').innerHTML = gapsHtml;

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
        console.error("Error:", error);
        showToast('AI failed. Please try again.');
    } finally {
        setLoading(btn, false);
    }
}

// Similarly update other feature functions:
// - generateTestSuite() → pass 'testSuite'
// - generateBugReport() → pass 'bugReport'
// - correctSentence() → pass 'sentence'
// - generateProfessionalCase() → pass 'professionalCase'