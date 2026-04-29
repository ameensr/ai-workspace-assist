import { Router } from 'express';
import { HybridAIService } from '../services/hybridAIService.js';

export const aiRoutes = Router();

// Hybrid AI generation endpoint
aiRoutes.post('/generate', async (req, res) => {
  try {
    const { prompt, systemPrompt, module, provider } = req.body;

    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const hybridAI = new HybridAIService(req.supabaseContext, req.userId);

    const result = await hybridAI.generateAIResponse({
      prompt,
      systemPrompt: systemPrompt || '',
      module: module || 'generic',
      userApiKeys: req.userApiKeys,
      userProvider: provider || req.userProvider
    });

    res.json({
      success: true,
      content: result.content,
      provider: result.provider,
      tokens: result.tokens,
      mode: result.mode,
      creditsUsed: result.creditsUsed,
      creditsRemaining: result.creditsRemaining
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message
    });
  }
});

// Check if user can use AI (has credits or API key)
aiRoutes.get('/check', async (req, res) => {
  try {
    const { module } = req.query;
    
    const hybridAI = new HybridAIService(req.supabaseContext, req.userId);
    const creditCheck = await hybridAI.creditService.checkCreditsAvailable(
      req.userId,
      module || 'generic'
    );

    const hasUserApiKey = Object.values(req.userApiKeys || {}).some(key => key && key.trim());

    res.json({
      canUseAI: hasUserApiKey || creditCheck.available,
      mode: hasUserApiKey ? 'BYOK' : 'BUILT_IN',
      credits: creditCheck.current,
      requiredCredits: creditCheck.required,
      hasApiKey: hasUserApiKey
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
