import { generateResponse } from '../../services/ai/aiService.js';
import { CreditService } from './creditService.js';

export class HybridAIService {
  constructor(supabaseContext, userId) {
    this.ctx = supabaseContext;
    this.userId = userId;
    this.creditService = new CreditService(supabaseContext);
  }

  async generateAIResponse({ prompt, systemPrompt, module, userApiKeys, userProvider }) {
    const hasUserApiKey = Object.values(userApiKeys || {}).some(key => key && key.trim());

    // MODE 1: BYOK - User has their own API key
    if (hasUserApiKey) {
      return await this.handleBYOK({ prompt, systemPrompt, module, userApiKeys, userProvider });
    }

    // MODE 2: Built-in AI - Use system key with credits
    return await this.handleBuiltInAI({ prompt, systemPrompt, module });
  }

  async handleBYOK({ prompt, systemPrompt, module, userApiKeys, userProvider }) {
    const combinedPrompt = `${systemPrompt}\n\nUser Input: ${prompt}`.trim();

    const result = await generateResponse({
      provider: userProvider || 'auto',
      apiKeys: userApiKeys,
      prompt: combinedPrompt,
      options: {}
    });

    if (!result.success) {
      throw new Error(result.errors?.[0]?.message || 'AI request failed');
    }

    // Log usage without deducting credits
    await this.logUsage({
      module,
      provider: result.provider,
      tokens: result.tokens,
      creditsUsed: 0,
      isByok: true
    });

    return {
      content: result.content,
      provider: result.provider,
      tokens: result.tokens,
      mode: 'BYOK',
      creditsUsed: 0
    };
  }

  async handleBuiltInAI({ prompt, systemPrompt, module }) {
    // Check if user has enough credits
    const creditCheck = await this.creditService.checkCreditsAvailable(this.userId, module);

    if (!creditCheck.available) {
      throw new Error(
        `Insufficient credits. You need ${creditCheck.required} credits but have ${creditCheck.current}. ` +
        'Please upgrade your plan or add your own API key in Settings.'
      );
    }

    // Deduct credits BEFORE making AI request
    const deductResult = await this.creditService.deductCredits(this.userId, module);

    if (!deductResult.success) {
      throw new Error(deductResult.message || 'Failed to deduct credits');
    }

    // Get system API key from environment
    const systemApiKeys = this.getSystemApiKeys();

    if (!Object.values(systemApiKeys).some(key => key)) {
      throw new Error('System AI is not configured. Please add your own API key in Settings.');
    }

    const combinedPrompt = `${systemPrompt}\n\nUser Input: ${prompt}`.trim();

    try {
      const result = await generateResponse({
        provider: 'auto',
        apiKeys: systemApiKeys,
        prompt: combinedPrompt,
        options: {}
      });

      if (!result.success) {
        // Refund credits on failure
        await this.refundCredits(module);
        throw new Error(result.errors?.[0]?.message || 'AI request failed');
      }

      // Log usage with credits deducted
      await this.logUsage({
        module,
        provider: result.provider,
        tokens: result.tokens,
        creditsUsed: creditCheck.required,
        isByok: false
      });

      return {
        content: result.content,
        provider: result.provider,
        tokens: result.tokens,
        mode: 'BUILT_IN',
        creditsUsed: creditCheck.required,
        creditsRemaining: deductResult.remaining_credits
      };
    } catch (error) {
      // Refund credits on error
      await this.refundCredits(module);
      throw error;
    }
  }

  getSystemApiKeys() {
    return {
      openai: process.env.SYSTEM_OPENAI_API_KEY || '',
      gemini: process.env.SYSTEM_GEMINI_API_KEY || '',
      claude: process.env.SYSTEM_CLAUDE_API_KEY || '',
      deepseek: process.env.SYSTEM_DEEPSEEK_API_KEY || '',
      grok: process.env.SYSTEM_GROK_API_KEY || '',
      perplexity: process.env.SYSTEM_PERPLEXITY_API_KEY || '',
      nvidia: process.env.SYSTEM_NVIDIA_API_KEY || ''
    };
  }

  async refundCredits(module) {
    try {
      const creditCost = require('../config/credits.config.js').CREDIT_COSTS[module] || 3;
      
      await fetch(`${this.ctx.url}/rest/v1/user_settings?user_id=eq.${this.userId}`, {
        method: 'PATCH',
        headers: {
          apikey: this.ctx.anonKey,
          Authorization: `Bearer ${this.ctx.token}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          credits: `credits + ${creditCost}`
        })
      });
    } catch (error) {
      console.error('Failed to refund credits:', error);
    }
  }

  async logUsage({ module, provider, tokens, creditsUsed, isByok }) {
    try {
      await fetch(`${this.ctx.url}/rest/v1/usage_logs`, {
        method: 'POST',
        headers: {
          apikey: this.ctx.anonKey,
          Authorization: `Bearer ${this.ctx.token}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          user_id: this.userId,
          provider,
          tokens,
          module,
          request_type: module,
          credits_used: creditsUsed,
          is_byok: isByok
        })
      });
    } catch (error) {
      console.error('Failed to log usage:', error);
    }
  }
}
