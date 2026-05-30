/**
 * OpenAI API Configuration
 * 
 * Reads API key from bundled config file
 * This is the proper way to handle config in React Native
 */

// Import the config directly - this gets bundled with the app
const config = require('./openai.config.json');

// Cache the API key after first read
let cachedOpenAIKey: string | null = null;

/**
 * Get OpenAI API key from bundled config
 * Synchronous - no async needed since it's bundled
 */
export const getOpenAIAPIKey = (): string => {
  if (cachedOpenAIKey) {
    return cachedOpenAIKey;
  }

  try {
    const apiKey = config?.openai?.apiKey;

    if (!apiKey) {
      throw new Error('API key not found in config');
    }

    cachedOpenAIKey = apiKey;
    console.log('[API Config] OpenAI API key loaded successfully');
    return apiKey;
  } catch (error) {
    console.error('[API Config] Error loading OpenAI API key:', error);
    throw new Error(`Failed to load OpenAI API key: ${error}`);
  }
};

/**
 * Get OpenAI model from config
 */
export const getOpenAIModel = (): string => {
  try {
    const model = config?.openai?.model || 'gpt-4-mini';
    console.log('[API Config] Using OpenAI model:', model);
    return model;
  } catch (error) {
    console.warn('[API Config] Error loading model config, using default:', error);
    return 'gpt-4-mini';
  }
};

/**
 * Clear cached API key (for testing or reconfiguration)
 */
export const clearCachedAPIKey = () => {
  cachedOpenAIKey = null;
  console.log('[API Config] Cached API key cleared');
};
