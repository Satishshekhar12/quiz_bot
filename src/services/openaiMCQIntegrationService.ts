/**
 * OpenAI MCQ Integration Service
 *
 * Bridges:
 * - OpenAI MCQ analysis
 * - Telegram message sending
 * - Independent error handling
 * - Background async processing
 */

import { ToastAndroid, Platform } from 'react-native';
import { analyzeOpenAIMCQ } from './openaiMCQService';
import { openaiMCQQueue, OpenAIQueueItem } from '../utils/openaiMCQQueue';
import RNFS from 'react-native-fs';

const TELEGRAM_BOT_TOKEN = '8568771571:AAHThxjhZlp4X8SZ7H-LK9P06GQdDkOkRLc';
const CHAT_ID = '-1003929309689';

/**
 * Send text message to Telegram
 * This is SEPARATE from photo upload
 */
const sendTelegramTextMessage = async (text: string): Promise<boolean> => {
  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: text,
      }),
    });

    const data = await response.json();

    if (data.ok) {
      console.log('[OpenAI Integration] Telegram message sent:', text);
      return true;
    } else {
      console.error('[OpenAI Integration] Telegram message error:', data.description);
      return false;
    }
  } catch (error) {
    console.error('[OpenAI Integration] Error sending Telegram message:', error);
    return false;
  }
};

/**
 * Show toast notification
 */
const showToast = (message: string) => {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  }
  console.log('[OpenAI Integration] Toast:', message);
};

/**
 * Process single MCQ image through OpenAI
 * Called for each item in the queue
 */
export const processOpenAIMCQItem = async (item: OpenAIQueueItem): Promise<void> => {
  const itemId = item.id;

  try {
    // Mark as processing
    openaiMCQQueue.updateItemStatus(itemId, 'processing');

    console.log(`[OpenAI Integration] Processing item: ${itemId}`);
    console.log(`[OpenAI Integration] Image path: ${item.photoPath}`);

    // Verify file exists
    const filePath = item.photoPath.startsWith('file://')
      ? item.photoPath.substring(7)
      : item.photoPath;

    const fileExists = await RNFS.exists(filePath);
    if (!fileExists) {
      throw new Error(`File not found: ${filePath}`);
    }

    // Analyze image with OpenAI
    console.log(`[OpenAI Integration] Calling OpenAI API...`);
    const result = await analyzeOpenAIMCQ(item.photoPath);

    if (!result.success) {
      throw new Error(result.error || 'OpenAI analysis failed');
    }

    const answer = result.answer || 'N/A';
    console.log(`[OpenAI Integration] Answer extracted: ${answer}`);

    // Update queue with answer
    openaiMCQQueue.updateItemStatus(itemId, 'completed', { answer });

    // Show toast with answer
    const toastMessage = `Answer: ${answer}`;
    showToast(toastMessage);

    // Send Telegram message
    console.log(`[OpenAI Integration] Sending Telegram message...`);
    const telegramSent = await sendTelegramTextMessage(toastMessage);

    if (!telegramSent) {
      console.warn(
        `[OpenAI Integration] Failed to send Telegram message, but MCQ analysis succeeded`
      );
    }

    console.log(`[OpenAI Integration] Item ${itemId} completed successfully`);
  } catch (error) {
    const errorMessage = String(error);
    console.error(`[OpenAI Integration] Error processing item ${itemId}:`, error);

    // Check if we should retry
    const retryCount = openaiMCQQueue.incrementRetry(itemId);
    const maxRetries = item.maxRetries;

    if (retryCount < maxRetries) {
      // Mark for retry
      openaiMCQQueue.updateItemStatus(itemId, 'pending', {
        error: `Retry ${retryCount}/${maxRetries}: ${errorMessage}`,
      });

      console.log(
        `[OpenAI Integration] Item ${itemId} marked for retry (${retryCount}/${maxRetries})`
      );
      showToast(`❌ MCQ error, retrying... (${retryCount}/${maxRetries})`);
    } else {
      // Mark as failed
      openaiMCQQueue.updateItemStatus(itemId, 'failed', { error: errorMessage });
      console.error(`[OpenAI Integration] Item ${itemId} failed after ${maxRetries} retries`);
      showToast(`❌ MCQ analysis failed`);
    }
  }
};

/**
 * Main queue processor
 * Runs independently, processes one item at a time
 * NEVER blocks camera or Telegram operations
 */
export const startOpenAIQueueProcessor = async (): Promise<void> => {
  // Already processing
  if (openaiMCQQueue.isProcessing()) {
    return;
  }

  openaiMCQQueue.setProcessing(true);

  try {
    while (true) {
      // Get next pending item
      const nextItem = openaiMCQQueue.getNextItem();

      if (!nextItem) {
        // Queue is empty
        break;
      }

      // Process the item
      await processOpenAIMCQItem(nextItem);

      // Remove from queue
      openaiMCQQueue.removeItem(nextItem.id);

      // Small delay between items to avoid overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  } finally {
    openaiMCQQueue.setProcessing(false);
    console.log('[OpenAI Integration] Queue processing stopped');

    // Log stats
    const stats = openaiMCQQueue.getStats();
    console.log('[OpenAI Integration] Stats:', stats);
  }
};

/**
 * Queue image for MCQ analysis
 * This is called from LiveCameraView after photo capture
 * Returns immediately - processing happens asynchronously
 */
export const queueImageForOpenAIAnalysis = async (photoPath: string): Promise<void> => {
  try {
    // Add to queue
    const itemId = openaiMCQQueue.addItem(photoPath);
    console.log(`[OpenAI Integration] Queued for analysis: ${itemId}`);

    // Start processing (will be no-op if already processing)
    startOpenAIQueueProcessor().catch(error => {
      console.error('[OpenAI Integration] Error starting queue processor:', error);
    });
  } catch (error) {
    console.error('[OpenAI Integration] Error queuing image:', error);
  }
};
