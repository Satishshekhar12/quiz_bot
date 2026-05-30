import { useCallback } from 'react';
import { queueImageForOpenAIAnalysis } from '../services/openaiMCQIntegrationService';

/**
 * React Hook: useOpenAIMCQQueue
 *
 * Minimal hook to integrate OpenAI MCQ analysis into components
 * Provides single method: queueForAnalysis(photoPath)
 *
 * Usage in LiveCameraView:
 * const { queueForAnalysis } = useOpenAIMCQQueue();
 * // ... in handleCapture:
 * queueForAnalysis(photo.path);
 */

export const useOpenAIMCQQueue = () => {
  const queueForAnalysis = useCallback(async (photoPath: string) => {
    try {
      await queueImageForOpenAIAnalysis(photoPath);
    } catch (error) {
      console.error('[useOpenAIMCQQueue] Error:', error);
    }
  }, []);

  return {
    queueForAnalysis,
  };
};
