import RNFS from 'react-native-fs';
import { getOpenAIAPIKey, getOpenAIModel } from '../config/apiConfig';

/**
 * COMPLETELY INDEPENDENT from Telegram
 * This service has:
 * - Its own API interface
 * - Its own error handling
 * - Its own queue logic (if needed)
 * - No shared state with Telegram
 */

export interface OpenAIMCQResponse {
  success: boolean;
  answer?: string; // Extracted single answer (A, B, C, D, E)
  rawResponse?: string; // Full API response
  requestDuration?: number; // In milliseconds
  error?: string;
  metadata?: {
    model: string;
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}

export interface OpenAIMCQTestResult {
  success: boolean;
  answer?: string;
  rawResponse?: string;
  requestDuration?: number;
  error?: string;
  metadata?: any;
  imageFileName?: string;
  timestamp?: string;
}

/**
 * MCQ Analysis Prompt
 * Instructs OpenAI to analyze MCQ image and return ONLY the answer letter
 */
const MCQ_ANALYSIS_PROMPT = `You will receive an image containing a multiple-choice question.

Analyze the image carefully and return ONLY the final answer option.

Valid outputs:
A
B
C
D
E

No explanation.
No reasoning.
No extra text.
Return only a single option.`;

/**
 * Convert image file to base64
 */
const imageToBase64 = async (imagePath: string): Promise<string> => {
  try {
    const filePath = imagePath.startsWith('file://')
      ? imagePath.substring(7)
      : imagePath;

    const fileExists = await RNFS.exists(filePath);
    if (!fileExists) {
      throw new Error(`Image file not found: ${filePath}`);
    }

    const base64Data = await RNFS.readFile(filePath, 'base64');
    return base64Data;
  } catch (error) {
    throw new Error(`Failed to convert image to base64: ${error}`);
  }
};

/**
 * Send MCQ image to OpenAI for analysis
 * INDEPENDENT: No connection to Telegram, camera capture, or existing workflows
 */
export const analyzeOpenAIMCQ = async (
  imagePath: string
): Promise<OpenAIMCQResponse> => {
  const startTime = Date.now();

  try {
    // Step 1: Get API Key
    console.log('[OpenAI MCQ] Getting API key...');
    const apiKey = getOpenAIAPIKey();

    // Step 2: Convert image to base64
    console.log('[OpenAI MCQ] Converting image to base64...');
    const imageBase64 = await imageToBase64(imagePath);

    // Step 3: Prepare OpenAI API request
    console.log('[OpenAI MCQ] Preparing API request...');
    const model = getOpenAIModel();
    const requestBody = {
      model: model, // Using model from config
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: MCQ_ANALYSIS_PROMPT,
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`,
              },
            },
          ],
        },
      ],
      max_tokens: 10, // Only expect single letter response
      temperature: 0, // Deterministic response
    };

    // Step 4: Call OpenAI API
    console.log('[OpenAI MCQ] Calling OpenAI API...');
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    const requestDuration = Date.now() - startTime;

    // Step 5: Parse response
    console.log('[OpenAI MCQ] Parsing response...');
    const data = await response.json();

    if (!response.ok) {
      console.error('[OpenAI MCQ] API Error:', data);
      return {
        success: false,
        error: data.error?.message || 'OpenAI API error',
        requestDuration,
        metadata: {
          model: 'gpt-4-mini',
        },
      };
    }

    // Step 6: Extract answer from response
    const rawResponse = data.choices?.[0]?.message?.content || '';
    const answer = extractMCQAnswer(rawResponse);

    console.log('[OpenAI MCQ] Analysis complete:', {
      rawResponse,
      answer,
      duration: requestDuration,
    });

    return {
      success: true,
      answer,
      rawResponse,
      requestDuration,
      metadata: {
        model: model,
        promptTokens: data.usage?.prompt_tokens,
        completionTokens: data.usage?.completion_tokens,
        totalTokens: data.usage?.total_tokens,
      },
    };
  } catch (error) {
    const requestDuration = Date.now() - startTime;
    const model = getOpenAIModel();
    console.error('[OpenAI MCQ] Error:', error);

    return {
      success: false,
      error: String(error),
      requestDuration,
      metadata: {
        model: model,
      },
    };
  }
};

/**
 * Extract MCQ answer letter from OpenAI response
 * Handles various response formats and extracts A, B, C, D, or E
 */
const extractMCQAnswer = (response: string): string | undefined => {
  if (!response) return undefined;

  // Trim and uppercase
  const cleaned = response.trim().toUpperCase();

  // Check if it's a single letter answer
  const match = cleaned.match(/^[A-E]$/);
  if (match) {
    return match[0];
  }

  // Try to find first occurrence of valid answer
  const firstAnswer = cleaned.match(/[A-E]/);
  if (firstAnswer) {
    console.warn('[OpenAI MCQ] Response contains extra text, extracted:', firstAnswer[0]);
    return firstAnswer[0];
  }

  // If no valid answer found, log warning
  console.warn('[OpenAI MCQ] Could not extract valid answer from:', response);
  return undefined;
};

/**
 * Test the OpenAI MCQ service with a single image
 * Used for Phase 1 verification
 */
export const testOpenAIMCQService = async (
  imagePath: string
): Promise<OpenAIMCQTestResult> => {
  const timestamp = new Date().toISOString();
  const imageFileName = imagePath.split('/').pop() || 'unknown';

  try {
    console.log('[OpenAI Test] Starting MCQ analysis test...');
    const result = await analyzeOpenAIMCQ(imagePath);

    return {
      ...result,
      imageFileName,
      timestamp,
    };
  } catch (error) {
    return {
      success: false,
      error: String(error),
      imageFileName,
      timestamp,
    };
  }
};
