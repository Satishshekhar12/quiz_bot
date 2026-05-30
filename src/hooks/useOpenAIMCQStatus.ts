import { useState, useEffect, useCallback } from 'react';
import { openaiMCQQueue } from '../utils/openaiMCQQueue';
import { OpenAIMCQStatusBoxProps } from '../components/OpenAIMCQStatusBox';

/**
 * Hook: useOpenAIMCQStatus
 * 
 * Manages OpenAI MCQ status box visibility and content
 * - Listens to queue changes
 * - Updates status (idle, processing, success, error)
 * - Auto-hides after success
 */

interface OpenAIMCQStatusState extends OpenAIMCQStatusBoxProps {
  status: 'idle' | 'processing' | 'success' | 'error';
}

export const useOpenAIMCQStatus = () => {
  const [statusState, setStatusState] = useState<OpenAIMCQStatusState>({
    status: 'processing', // Start with processing state so box is visible
    answer: '',
  });

  const pollQueueStatus = useCallback(() => {
    const queue = openaiMCQQueue.getQueue();
    const stats = openaiMCQQueue.getStats();

    // Check if anything is processing
    const processing = queue.find(item => item.status === 'processing');
    const failed = queue.find(item => item.status === 'failed');
    const completed = queue.find(item => item.status === 'completed');

    if (processing) {
      // Show processing status
      const queueSize = queue.length;
      const progress = queueSize > 0 ? 1 - queueSize / 10 : 0;

      setStatusState({
        status: 'processing',
        progress: Math.max(0, Math.min(1, progress)),
      });
    } else if (failed) {
      // Show error - persist it
      setStatusState({
        status: 'error',
        error: failed.error || 'Analysis failed',
      });
    } else if (completed) {
      // Show success with answer - persist it
      setStatusState({
        status: 'success',
        answer: completed.answer || 'N/A',
        duration: completed.timestamp ? Date.now() - completed.timestamp : undefined,
      });
    } else {
      // No items in queue - keep last status visible
      // Don't reset to idle, maintain previous answer
    }
  }, [statusState.status]);

  // Poll queue status every 500ms
  useEffect(() => {
    const interval = setInterval(() => {
      pollQueueStatus();
    }, 500);

    return () => clearInterval(interval);
  }, [pollQueueStatus]);

  return statusState;
};
