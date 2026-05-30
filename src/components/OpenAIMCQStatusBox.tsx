import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Animated,
  ActivityIndicator,
} from 'react-native';

/**
 * OpenAI MCQ Status Box
 * 
 * Overlays on camera view to show:
 * - Processing status
 * - Extracted answer
 * - Errors
 * - Request duration
 */

export interface OpenAIMCQStatusBoxProps {
  status?: 'idle' | 'processing' | 'success' | 'error';
  answer?: string;
  error?: string;
  duration?: number;
  progress?: number; // 0-1 for multiple items
}

export const OpenAIMCQStatusBox: React.FC<OpenAIMCQStatusBoxProps> = ({
  status = 'idle',
  answer,
  error,
  duration,
  progress,
}) => {
  const [fadeAnim] = useState(new Animated.Value(1));

  // Always visible - no hide animation
  useEffect(() => {
    if (status === 'processing') {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [status, fadeAnim]);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
        },
      ]}
    >
      <View
        style={[
          styles.box,
          status === 'error' ? styles.boxError : styles.boxDefault,
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>
            {status === 'processing' && '🔄 Analyzing...'}
            {status === 'success' && '✅ Answer Found'}
            {status === 'error' && '❌ Error'}
          </Text>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Processing spinner */}
          {status === 'processing' && (
            <>
              <ActivityIndicator color="#FF6B6B" size="large" />
              <Text style={styles.statusText}>Sending image to OpenAI...</Text>
              {progress !== undefined && progress > 0 && (
                <Text style={styles.progressText}>
                  {Math.round(progress * 100)}% complete
                </Text>
              )}
            </>
          )}

          {/* Success - show answer */}
          {status === 'success' && answer && (
            <>
              <Text style={styles.answerLabel}>Answer:</Text>
              <Text style={styles.answer}>{answer}</Text>
              {duration && (
                <Text style={styles.durationText}>{duration}ms</Text>
              )}
              <Text style={styles.successMessage}>
                Sent to Telegram
              </Text>
            </>
          )}

          {/* Error - show message */}
          {status === 'error' && error && (
            <>
              <Text style={styles.errorMessage}>{error}</Text>
              <Text style={styles.retryHint}>Retrying...</Text>
            </>
          )}
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    zIndex: 50,
  },
  box: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#4CAF50',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  boxDefault: {
    borderColor: '#4CAF50',
  },
  boxError: {
    borderColor: '#F44336',
  },
  header: {
    marginBottom: 12,
  },
  title: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  content: {
    alignItems: 'center',
  },
  statusText: {
    color: '#aaa',
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
  progressText: {
    color: '#FF6B6B',
    fontSize: 11,
    marginTop: 6,
    fontWeight: 'bold',
  },
  answerLabel: {
    color: '#aaa',
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  answer: {
    color: '#4CAF50',
    fontSize: 40,
    fontWeight: 'bold',
    fontFamily: 'monospace',
    marginVertical: 8,
  },
  durationText: {
    color: '#666',
    fontSize: 10,
    marginTop: 4,
  },
  successMessage: {
    color: '#4CAF50',
    fontSize: 11,
    marginTop: 8,
    fontWeight: '600',
  },
  errorMessage: {
    color: '#FF6B6B',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 16,
  },
  retryHint: {
    color: '#999',
    fontSize: 10,
    marginTop: 4,
    fontStyle: 'italic',
  },
});
