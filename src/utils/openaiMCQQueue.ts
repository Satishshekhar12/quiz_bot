/**
 * OpenAI MCQ Queue Manager
 *
 * COMPLETELY INDEPENDENT from Telegram queue
 * - Own queue system
 * - Own error handling
 * - Own retry logic
 * - Parallel processing with Telegram
 */

export interface OpenAIQueueItem {
  id: string;
  photoPath: string;
  timestamp: number;
  retries: number;
  maxRetries: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
  answer?: string;
}

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

class OpenAIMCQQueueManager {
  private queue: OpenAIQueueItem[] = [];
  private processing = false;
  private processedItems = new Map<string, OpenAIQueueItem>();

  /**
   * Add item to queue
   */
  addItem(photoPath: string): string {
    const id = `openai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const item: OpenAIQueueItem = {
      id,
      photoPath,
      timestamp: Date.now(),
      retries: 0,
      maxRetries: MAX_RETRIES,
      status: 'pending',
    };

    this.queue.push(item);
    console.log(`[OpenAI Queue] Added item: ${id} (queue size: ${this.queue.length})`);

    return id;
  }

  /**
   * Get current queue
   */
  getQueue(): OpenAIQueueItem[] {
    return [...this.queue];
  }

  /**
   * Get queue size
   */
  getQueueSize(): number {
    return this.queue.length;
  }

  /**
   * Get next item to process
   */
  getNextItem(): OpenAIQueueItem | null {
    return this.queue.find(item => item.status === 'pending') || null;
  }

  /**
   * Update item status
   */
  updateItemStatus(
    id: string,
    status: OpenAIQueueItem['status'],
    data?: { error?: string; answer?: string }
  ): void {
    const item = this.queue.find(i => i.id === id);
    if (item) {
      item.status = status;
      if (data?.error) item.error = data.error;
      if (data?.answer) item.answer = data.answer;
      console.log(`[OpenAI Queue] Item ${id} status: ${status}`);
    }
  }

  /**
   * Increment retry count
   */
  incrementRetry(id: string): number {
    const item = this.queue.find(i => i.id === id);
    if (item) {
      item.retries++;
      console.log(`[OpenAI Queue] Item ${id} retry: ${item.retries}/${item.maxRetries}`);
    }
    return item?.retries || 0;
  }

  /**
   * Mark item as processed and remove from queue
   */
  removeItem(id: string): void {
    const itemIndex = this.queue.findIndex(i => i.id === id);
    if (itemIndex !== -1) {
      const item = this.queue[itemIndex];
      this.processedItems.set(id, item);
      this.queue.splice(itemIndex, 1);
      console.log(`[OpenAI Queue] Item ${id} removed (queue size: ${this.queue.length})`);
    }
  }

  /**
   * Get processed items history
   */
  getProcessedItems(): OpenAIQueueItem[] {
    return Array.from(this.processedItems.values());
  }

  /**
   * Check if currently processing
   */
  isProcessing(): boolean {
    return this.processing;
  }

  /**
   * Set processing state
   */
  setProcessing(state: boolean): void {
    this.processing = state;
  }

  /**
   * Clear all data
   */
  clear(): void {
    this.queue = [];
    this.processedItems.clear();
    this.processing = false;
    console.log('[OpenAI Queue] Cleared all items');
  }

  /**
   * Get stats
   */
  getStats(): {
    pendingCount: number;
    processingCount: number;
    completedCount: number;
    failedCount: number;
    totalProcessed: number;
  } {
    const pending = this.queue.filter(i => i.status === 'pending').length;
    const processing = this.queue.filter(i => i.status === 'processing').length;
    const completed = this.queue.filter(i => i.status === 'completed').length;
    const failed = this.queue.filter(i => i.status === 'failed').length;

    return {
      pendingCount: pending,
      processingCount: processing,
      completedCount: completed,
      failedCount: failed,
      totalProcessed: this.processedItems.size,
    };
  }
}

// Singleton instance
export const openaiMCQQueue = new OpenAIMCQQueueManager();
