/**
 * Centralized AI Service Layer
 * Handles all AI provider calls with unified interface
 */

const AI_SERVICE_CONFIG = {
    endpoint: '/api/ai/generate',
    timeout: 120000, // 120 seconds (2 minutes) - default
    providers: ['openai', 'nvidia', 'gemini', 'claude', 'deepseek', 'grok', 'perplexity'],
    providerTimeouts: {
        nvidia: 270000,    // 4.5 minutes for NVIDIA (slowest, needs more time)
        claude: 90000,     // 1.5 minutes for Claude
        openai: 60000,     // 1 minute for OpenAI
        gemini: 60000,     // 1 minute for Gemini
        deepseek: 60000,   // 1 minute for DeepSeek
        grok: 60000,       // 1 minute for Grok
        perplexity: 60000  // 1 minute for Perplexity
    }
};

/**
 * Get authentication token from Supabase session
 * @returns {Promise<string>} - Auth token
 */
async function getAuthToken() {
    if (!window.getCurrentSession) return '';
    try {
        const session = await window.getCurrentSession();
        return session?.access_token || '';
    } catch (error) {
        console.error('Failed to get auth token:', error);
        return '';
    }
}

/**
 * Main AI call function - single entry point for all AI requests
 * @param {Object} config - Configuration object
 * @param {string} config.provider - AI provider name
 * @param {string} config.prompt - User prompt
 * @param {Object} config.options - Additional options (systemPrompt, module, etc.)
 * @returns {Promise<string>} - Normalized AI response
 */
async function callAI({ provider, prompt, options = {} }) {
    if (!provider || !AI_SERVICE_CONFIG.providers.includes(provider.toLowerCase())) {
        throw new Error(`Unsupported AI provider: ${provider}`);
    }

    if (!prompt || !prompt.trim()) {
        throw new Error('Prompt is required');
    }

    // Get auth token
    const token = await getAuthToken();
    if (!token) {
        const error = new Error('Authentication required. Please log in.');
        error.code = 'MISSING_AUTH_TOKEN';
        throw error;
    }

    // Get provider-specific timeout or use default
    const providerTimeout = AI_SERVICE_CONFIG.providerTimeouts[provider.toLowerCase()] || AI_SERVICE_CONFIG.timeout;
    const requestTimeout = options.timeout || providerTimeout;

    console.log(`🚀 Calling ${provider} with ${requestTimeout}ms timeout...`);

    try {
        const response = await fetch(AI_SERVICE_CONFIG.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                prompt: prompt.trim(),
                systemPrompt: options.systemPrompt || '',
                module: options.module || 'generic',
                provider: provider.toLowerCase()
            }),
            signal: AbortSignal.timeout(requestTimeout)
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Request failed' }));
            throw new Error(error.error || `AI request failed with status ${response.status}`);
        }

        const data = await response.json();
        return normalizeResponse(provider, data);
    } catch (error) {
        if (error.name === 'AbortError' || error.name === 'TimeoutError') {
            throw new Error(`${provider} request timeout after ${requestTimeout / 1000}s. Try again or switch provider.`);
        }
        throw error;
    }
}

/**
 * Normalize responses from different providers to consistent format
 * @param {string} provider - Provider name
 * @param {Object} data - Raw API response
 * @returns {string} - Normalized content
 */
function normalizeResponse(provider, data) {
    if (!data.success) {
        throw new Error(data.error || 'AI request failed');
    }

    const content = data.content || data.text || '';
    
    if (!content.trim()) {
        throw new Error(`${provider} returned empty response`);
    }

    return content.trim();
}

/**
 * Call AI with automatic fallback to alternative providers
 * @param {Object} config - Configuration object
 * @returns {Promise<Object>} - Response with provider info
 */
async function callAIWithFallback(config) {
    const fallbackOrder = ['openai', 'gemini', 'nvidia', 'claude'];
    const primaryProvider = config.provider;
    
    try {
        const content = await callAI(config);
        return {
            content,
            provider: primaryProvider,
            fallbackUsed: false
        };
    } catch (primaryError) {
        console.warn(`Primary provider ${primaryProvider} failed:`, primaryError.message);
        
        for (const fallbackProvider of fallbackOrder) {
            if (fallbackProvider === primaryProvider) continue;
            
            try {
                console.log(`Attempting fallback to ${fallbackProvider}...`);
                const content = await callAI({ ...config, provider: fallbackProvider });
                return {
                    content,
                    provider: fallbackProvider,
                    fallbackUsed: true,
                    originalError: primaryError.message
                };
            } catch (fallbackError) {
                console.warn(`Fallback ${fallbackProvider} failed:`, fallbackError.message);
            }
        }
        
        throw new Error(`All providers failed. Last error: ${primaryError.message}`);
    }
}

/**
 * Get user's selected AI provider from settings
 * @returns {string} - Provider name
 */
function getUserSelectedProvider() {
    return localStorage.getItem('qaly_ai_provider') || 'openai';
}

/**
 * Check AI service status
 * @returns {Promise<Object>} - Service status
 */
async function checkAIStatus() {
    try {
        const token = await getAuthToken();
        if (!token) {
            return {
                canUseAI: false,
                mode: 'UNAUTHENTICATED',
                error: 'Not logged in'
            };
        }

        const response = await fetch('/api/ai/check', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Status check failed');
        }
        return await response.json();
    } catch (error) {
        console.error('AI status check failed:', error);
        return {
            canUseAI: false,
            mode: 'UNAVAILABLE',
            error: error.message
        };
    }
}

// Export functions
window.AIService = {
    callAI,
    callAIWithFallback,
    getUserSelectedProvider,
    checkAIStatus,
    config: AI_SERVICE_CONFIG
};
