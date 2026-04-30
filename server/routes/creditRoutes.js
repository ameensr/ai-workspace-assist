import { Router } from 'express';
import { CreditService } from '../services/creditService.js';

export const creditRoutes = Router();

// Get user credits info
creditRoutes.get('/credits', async (req, res) => {
  try {
    const creditService = new CreditService(req.supabaseContext);
    const credits = await creditService.getUserCredits(req.userId);

    if (!credits) {
      return res.status(404).json({ error: 'Credits not found' });
    }

    res.json({
      credits: credits.credits,
      plan: credits.plan,
      resetAt: credits.credits_reset_at,
      hasApiKey: credits.has_api_key
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upgrade user plan
creditRoutes.post('/upgrade', async (req, res) => {
  try {
    const { plan } = req.body;

    if (!['free', 'pro'].includes(plan)) {
      return res.status(400).json({ error: 'Invalid plan' });
    }

    const response = await fetch(`${req.supabaseContext.url}/rest/v1/rpc/upgrade_user_plan`, {
      method: 'POST',
      headers: {
        apikey: req.supabaseContext.anonKey,
        Authorization: `Bearer ${req.supabaseContext.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        p_user_id: req.userId,
        p_new_plan: plan
      })
    });

    if (!response.ok) {
      throw new Error('Failed to upgrade plan');
    }

    const data = await response.json();
    const result = Array.isArray(data) && data.length > 0 ? data[0] : null;

    if (!result || !result.success) {
      return res.status(400).json({ error: result?.message || 'Upgrade failed' });
    }

    res.json({ success: true, message: result.message });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
