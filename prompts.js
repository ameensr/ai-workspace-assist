/**
 * PROMPT TEMPLATES - Structured default prompt definitions.
 * These are runtime fallbacks when Prompt Governance data is not configured in DB.
 */
const DEFAULT_PROMPT_CONFIGS = {
    requirementIntelligence: {
        module_name: 'Requirement Intelligence',
        role: 'Act as a Senior Business Analyst and QA Strategy Expert.',
        task: 'Analyze the provided requirement and return corrected specification, gaps, and test scenarios.',
        constraints: [
            'Keep response technical, precise, and unambiguous.',
            'Identify risks and edge cases.',
            'Return strictly valid JSON only.'
        ],
        output_format: [
            'corrected_spec: string',
            'gaps: string[]',
            'test_scenarios: string[]'
        ],
        style: 'concise'
    },
    testSuite: {
        module_name: 'Test Suite Architect',
        role: 'Act as a Senior QA Automation Engineer.',
        task: 'Generate a comprehensive test suite from the requirement.',
        constraints: [
            'Avoid duplicates.',
            'Include positive, negative, and edge cases.',
            'Return strictly valid JSON array only.'
        ],
        output_format: [
            'id',
            'module',
            'subModule',
            'preCondition',
            'testCase',
            'steps',
            'testData',
            'expectedResult',
            'actualResult',
            'status',
            'isCritical',
            'isSecurity'
        ],
        style: 'detailed'
    },
    bugReport: {
        module_name: 'Bug Report Generator',
        role: 'Act as a Lead QA Engineer.',
        task: 'Transform rough notes into a professional JIRA-ready bug report.',
        constraints: [
            'Use HTML formatting only (h2, h3, p, ul, li).',
            'Keep sections explicit and actionable.'
        ],
        output_format: [
            'Summary',
            'Severity/Priority',
            'Environment',
            'Description',
            'Steps to Reproduce',
            'Expected Result',
            'Actual Result'
        ],
        style: 'concise'
    },
    sentenceCorrection: {
        module_name: 'Clarity AI - The Text Refinery',
        role: 'Act as a Technical Writer specializing in software documentation.',
        task: 'Provide corrected, casual, and formal versions of the text.',
        constraints: [
            'Preserve core technical meaning.',
            'Return strictly valid JSON only.'
        ],
        output_format: [
            'corrected: string',
            'casual: string',
            'formal: string'
        ],
        style: 'concise'
    },
    professionalCase: {
        module_name: 'Test Case Builder',
        role: 'Act as an Expert Test Architect.',
        task: 'Convert rough test notes into a highly structured professional test case.',
        constraints: [
            'Use HTML formatting.',
            'Keep steps explicit and testable.'
        ],
        output_format: [
            'Test Objective',
            'Preconditions',
            'Numbered Test Steps',
            'Expected Result',
            'Post-conditions'
        ],
        style: 'detailed'
    }
};

function buildSystemPromptFromConfig(config) {
    if (!config || typeof config !== 'object') return '';
    const constraints = Array.isArray(config.constraints) ? config.constraints : [];
    const outputFormat = Array.isArray(config.output_format) ? config.output_format : [];
    const style = String(config.style || 'concise').trim();
    const role = String(config.role || '').trim();
    const task = String(config.task || '').trim();

    const sections = [
        role,
        task,
        constraints.length ? `Constraints:\n- ${constraints.join('\n- ')}` : '',
        outputFormat.length ? `Output Format:\n- ${outputFormat.join('\n- ')}` : '',
        `Style: ${style}`
    ].filter(Boolean);

    return sections.join('\n\n').trim();
}

function extractPromptPlaceholders(template) {
    const text = String(template || '');
    const matches = text.match(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g) || [];
    return [...new Set(matches.map(item => item.replace(/[{}]/g, '').trim()))];
}

function renderPromptTemplate(template, variables = {}) {
    let output = String(template || '');
    Object.entries(variables || {}).forEach(([key, value]) => {
        const safeValue = String(value ?? '').trim();
        const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
        output = output.replace(regex, safeValue);
    });
    return output;
}

const SYSTEM_PROMPTS = Object.fromEntries(
    Object.entries(DEFAULT_PROMPT_CONFIGS).map(([key, value]) => [key, buildSystemPromptFromConfig(value)])
);

// ============================================
// MASTER PROMPTS LIBRARY (User Facing Gallery)
// ============================================
const MASTER_PROMPTS_LIBRARY = [];

// Export for use in app.js and prompts.html
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        SYSTEM_PROMPTS,
        MASTER_PROMPTS_LIBRARY,
        DEFAULT_PROMPT_CONFIGS,
        buildSystemPromptFromConfig,
        extractPromptPlaceholders,
        renderPromptTemplate
    };
}
