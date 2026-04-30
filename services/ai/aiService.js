import { deepseekService } from './deepseekService.js';
import { openaiService } from './openaiService.js';
import { geminiService } from './geminiService.js';
import { claudeService } from './claudeService.js';
import { chatCompatibleService } from './chatCompatibleService.js';
import { nvidiaService } from './nvidiaService.js';
import {
  AUTO_PROVIDER_ORDER,
  normalizeProviderName,
  toProviderRuntime
} from './providerUtils.js';

function resolveProviderChain(provider, availableKeys = {}) {
  const normalized = normalizeProviderName(provider);
  if (normalized !== 'auto') return [normalized];
  const defaultChain = [...AUTO_PROVIDER_ORDER];
  const available = defaultChain.filter(name => String(availableKeys[name] || '').trim());
  return available.length ? available : defaultChain;
}

async function callAdapter({ provider, apiKey, prompt, options = {} }) {
  const runtime = toProviderRuntime(provider, apiKey);
  if (!runtime) {
    const error = new Error(`${provider}: Invalid API key.`);
    error.statusCode = 401;
    throw error;
  }

  const adapterPayload = {
    apiKey: runtime.apiKey,
    prompt,
    options: {
      timeoutMs: runtime.timeoutMs,
      model: runtime.model,
      ...options
    }
  };

  if (runtime.name === 'deepseek') return deepseekService(adapterPayload);
  if (runtime.name === 'openai') return openaiService(adapterPayload);
  if (runtime.name === 'gemini') return geminiService(adapterPayload);
  if (runtime.name === 'claude') return claudeService(adapterPayload);
  if (runtime.name === 'nvidia') return nvidiaService(adapterPayload);
  if (runtime.name === 'grok' || runtime.name === 'perplexity') {
    return chatCompatibleService({
      provider: runtime.name,
      endpoint: runtime.endpoint,
      ...adapterPayload
    });
  }

  const error = new Error(`${provider}: Provider request failed.`);
  error.statusCode = 400;
  throw error;
}

export async function generateResponse({ provider, apiKeys = {}, prompt, options = {} }) {
  const chain = resolveProviderChain(provider, apiKeys);
  const errors = [];

  for (const providerName of chain) {
    const apiKey = String(apiKeys[providerName] || '').trim();
    if (!apiKey) {
      errors.push({ provider: providerName, message: `${providerName}: Invalid API key.` });
      continue;
    }
    try {
      const result = await callAdapter({ provider: providerName, apiKey, prompt, options });
      return {
        success: true,
        content: result.content,
        tokens: Number(result.tokens || 0),
        provider: result.provider,
        latencyMs: Number(result.latencyMs || 0),
        errors
      };
    } catch (error) {
      errors.push({
        provider: providerName,
        message: error.message || `${providerName}: Provider request failed.`,
        statusCode: error.statusCode || 502
      });
    }
  }

  return {
    success: false,
    content: '',
    tokens: 0,
    provider: 'none',
    latencyMs: 0,
    errors
  };
}
