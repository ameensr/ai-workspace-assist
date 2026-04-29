import { CREDIT_COSTS } from '../config/credits.config.js';

export class CreditService {
  constructor(supabaseContext) {
    this.ctx = supabaseContext;
  }

  async getUserCredits(userId) {
    const response = await fetch(`${this.ctx.url}/rest/v1/rpc/get_user_credits`, {
      method: 'POST',
      headers: {
        apikey: this.ctx.anonKey,
        Authorization: `Bearer ${this.ctx.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ p_user_id: userId })
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user credits');
    }

    const data = await response.json();
    return Array.isArray(data) && data.length > 0 ? data[0] : null;
  }

  async deductCredits(userId, module) {
    const creditCost = CREDIT_COSTS[module] || 3;

    const response = await fetch(`${this.ctx.url}/rest/v1/rpc/deduct_credits`, {
      method: 'POST',
      headers: {
        apikey: this.ctx.anonKey,
        Authorization: `Bearer ${this.ctx.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        p_user_id: userId,
        p_credits: creditCost
      })
    });

    if (!response.ok) {
      throw new Error('Failed to deduct credits');
    }

    const data = await response.json();
    return Array.isArray(data) && data.length > 0 ? data[0] : null;
  }

  async checkCreditsAvailable(userId, module) {
    const credits = await this.getUserCredits(userId);
    const requiredCredits = CREDIT_COSTS[module] || 3;
    
    return {
      available: credits && credits.credits >= requiredCredits,
      current: credits?.credits || 0,
      required: requiredCredits,
      hasApiKey: credits?.has_api_key || false
    };
  }
}
