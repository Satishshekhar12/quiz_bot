import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
  ToastAndroid,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { analyzeOpenAIMCQ, OpenAIMCQResponse } from '../services/openaiMCQService';

/**
 * OpenAI MCQ Test Screen
 * 
 * COMPLETELY INDEPENDENT test module:
 * - Isolated UI component
 * - Manual image selection
 * - Displays raw API response
 * - Shows extracted answer
 * - Displays request duration
 * - Shows any errors
 * 
 * NO CONNECTION TO:
 * - Telegram upload
 * - Camera capture
 * - Existing upload queues
 * - Existing workflows
 */

interface TestResult {
  success: boolean;
  imageUri?: string;
  imageName?: string;
  answer?: string;
  rawResponse?: string;
  duration?: number;
  error?: string;
  metadata?: any;
  timestamp?: string;
}

export const OpenAIMCQTestScreen: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);

  /**
   * Open image picker to select MCQ image
   */
  const handleSelectImage = async () => {
    try {
      const response = await launchImageLibrary({
        mediaType: 'photo',
        selectionLimit: 1,
      });

      if (!response.didCancel && response.assets && response.assets.length > 0) {
        const asset = response.assets[0];
        if (asset.uri) {
          setSelectedImageUri(asset.uri);
          setTestResult(null); // Clear previous results
          
          // Show toast
          if (Platform.OS === 'android') {
            ToastAndroid.show('Image selected', ToastAndroid.SHORT);
          }
        }
      }
    } catch (error) {
      console.error('Error selecting image:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  /**
   * Send selected image to OpenAI for MCQ analysis
   */
  const handleAnalyzeMCQ = async () => {
    if (!selectedImageUri) {
      Alert.alert('Info', 'Please select an image first');
      return;
    }

    setLoading(true);
    const startTime = Date.now();

    try {
      console.log('[Test] Sending image to OpenAI:', selectedImageUri);
      
      const response = await analyzeOpenAIMCQ(selectedImageUri);
      const duration = Date.now() - startTime;

      const imageName = selectedImageUri.split('/').pop() || 'unknown';

      const result: TestResult = {
        success: response.success,
        imageUri: selectedImageUri,
        imageName,
        answer: response.answer,
        rawResponse: response.rawResponse,
        duration: response.requestDuration || duration,
        error: response.error,
        metadata: response.metadata,
        timestamp: new Date().toISOString(),
      };

      setTestResult(result);

      // Show success toast
      if (response.success) {
        if (Platform.OS === 'android') {
          ToastAndroid.show(
            `✓ Answer: ${response.answer || 'N/A'}`,
            ToastAndroid.LONG
          );
        }
      } else {
        if (Platform.OS === 'android') {
          ToastAndroid.show(
            `✗ Error: ${response.error?.substring(0, 30)}`,
            ToastAndroid.LONG
          );
        }
      }

      console.log('[Test] Analysis complete:', result);
    } catch (error) {
      console.error('[Test] Error analyzing MCQ:', error);
      
      const result: TestResult = {
        success: false,
        imageUri: selectedImageUri,
        imageName: selectedImageUri.split('/').pop() || 'unknown',
        error: String(error),
        timestamp: new Date().toISOString(),
      };

      setTestResult(result);
      Alert.alert('Error', `Failed to analyze MCQ: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Clear all results and start fresh
   */
  const handleClear = () => {
    setSelectedImageUri(null);
    setTestResult(null);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>OpenAI MCQ Test</Text>
        <Text style={styles.subtitle}>Phase 1: API Verification</Text>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Instructions */}
        <View style={styles.instructionsBox}>
          <Text style={styles.instructionTitle}>Instructions:</Text>
          <Text style={styles.instructionText}>
            1. Tap "Select Image" to choose an MCQ image from your device
          </Text>
          <Text style={styles.instructionText}>
            2. Tap "Analyze MCQ" to send image to OpenAI
          </Text>
          <Text style={styles.instructionText}>
            3. View the extracted answer and request duration below
          </Text>
        </View>

        {/* Selected Image Info */}
        {selectedImageUri && (
          <View style={styles.selectedImageBox}>
            <Text style={styles.boxTitle}>📸 Selected Image</Text>
            <Text style={styles.filePath}>{selectedImageUri.split('/').pop()}</Text>
          </View>
        )}

        {/* Results Section */}
        {testResult && (
          <View
            style={[
              styles.resultBox,
              {
                borderColor: testResult.success ? '#4CAF50' : '#F44336',
              },
            ]}
          >
            <Text
              style={[
                styles.resultStatus,
                {
                  color: testResult.success ? '#4CAF50' : '#F44336',
                },
              ]}
            >
              {testResult.success ? '✓ SUCCESS' : '✗ ERROR'}
            </Text>

            {/* Extracted Answer */}
            {testResult.success && testResult.answer && (
              <View style={styles.resultField}>
                <Text style={styles.fieldLabel}>Extracted Answer:</Text>
                <Text style={styles.answerValue}>{testResult.answer}</Text>
              </View>
            )}

            {/* Request Duration */}
            {testResult.duration !== undefined && (
              <View style={styles.resultField}>
                <Text style={styles.fieldLabel}>Request Duration:</Text>
                <Text style={styles.fieldValue}>{testResult.duration}ms</Text>
              </View>
            )}

            {/* Raw API Response */}
            {testResult.rawResponse && (
              <View style={styles.resultField}>
                <Text style={styles.fieldLabel}>Raw API Response:</Text>
                <View style={styles.responseBox}>
                  <Text style={styles.responseText}>{testResult.rawResponse}</Text>
                </View>
              </View>
            )}

            {/* Error Message */}
            {testResult.error && (
              <View style={styles.resultField}>
                <Text style={styles.fieldLabel}>Error:</Text>
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{testResult.error}</Text>
                </View>
              </View>
            )}

            {/* Metadata */}
            {testResult.metadata && (
              <View style={styles.resultField}>
                <Text style={styles.fieldLabel}>Metadata:</Text>
                <View style={styles.metadataBox}>
                  <Text style={styles.metadataText}>
                    Model: {testResult.metadata.model}
                  </Text>
                  {testResult.metadata.promptTokens && (
                    <Text style={styles.metadataText}>
                      Prompt Tokens: {testResult.metadata.promptTokens}
                    </Text>
                  )}
                  {testResult.metadata.completionTokens && (
                    <Text style={styles.metadataText}>
                      Completion Tokens: {testResult.metadata.completionTokens}
                    </Text>
                  )}
                  {testResult.metadata.totalTokens && (
                    <Text style={styles.metadataText}>
                      Total Tokens: {testResult.metadata.totalTokens}
                    </Text>
                  )}
                </View>
              </View>
            )}

            {/* Timestamp */}
            {testResult.timestamp && (
              <View style={styles.resultField}>
                <Text style={styles.fieldLabel}>Timestamp:</Text>
                <Text style={styles.fieldValue}>{testResult.timestamp}</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Bottom Buttons */}
      <View style={styles.buttonContainer}>
        {!loading ? (
          <>
            <TouchableOpacity
              style={[
                styles.button,
                styles.selectButton,
                selectedImageUri && styles.buttonActive,
              ]}
              onPress={handleSelectImage}
            >
              <Text style={styles.buttonText}>📸 Select Image</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                styles.analyzeButton,
                !selectedImageUri && styles.buttonDisabled,
              ]}
              onPress={handleAnalyzeMCQ}
              disabled={!selectedImageUri}
            >
              <Text style={styles.buttonText}>🔍 Analyze MCQ</Text>
            </TouchableOpacity>

            {testResult && (
              <TouchableOpacity
                style={[styles.button, styles.clearButton]}
                onPress={handleClear}
              >
                <Text style={styles.buttonText}>🔄 Clear</Text>
              </TouchableOpacity>
            )}
          </>
        ) : (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color="#FF6B6B" size="large" />
            <Text style={styles.loadingText}>Analyzing MCQ...</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#2a2a2a',
    borderBottomColor: '#FF6B6B',
    borderBottomWidth: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#aaa',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  instructionsBox: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderLeftColor: '#FF6B6B',
    borderLeftWidth: 4,
  },
  instructionTitle: {
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 8,
    fontSize: 14,
  },
  instructionText: {
    color: '#ccc',
    fontSize: 12,
    marginBottom: 4,
    lineHeight: 18,
  },
  selectedImageBox: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderColor: '#4CAF50',
    borderWidth: 1,
  },
  boxTitle: {
    color: '#4CAF50',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  filePath: {
    color: '#ccc',
    fontSize: 12,
    fontFamily: 'monospace',
  },
  resultBox: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 16,
    borderWidth: 2,
    marginBottom: 16,
  },
  resultStatus: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  resultField: {
    marginBottom: 16,
  },
  fieldLabel: {
    color: '#aaa',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  fieldValue: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'monospace',
  },
  answerValue: {
    color: '#4CAF50',
    fontSize: 28,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  responseBox: {
    backgroundColor: '#1a1a1a',
    borderRadius: 6,
    padding: 10,
    borderColor: '#444',
    borderWidth: 1,
  },
  responseText: {
    color: '#fff',
    fontSize: 13,
    fontFamily: 'monospace',
    lineHeight: 18,
  },
  errorBox: {
    backgroundColor: '#1a1a1a',
    borderRadius: 6,
    padding: 10,
    borderColor: '#F44336',
    borderWidth: 1,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 12,
    fontFamily: 'monospace',
    lineHeight: 16,
  },
  metadataBox: {
    backgroundColor: '#1a1a1a',
    borderRadius: 6,
    padding: 10,
    borderColor: '#444',
    borderWidth: 1,
  },
  metadataText: {
    color: '#aaa',
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  buttonContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 20,
    gap: 8,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectButton: {
    backgroundColor: '#2a2a2a',
    borderColor: '#FF6B6B',
    borderWidth: 2,
  },
  buttonActive: {
    backgroundColor: '#FF6B6B',
    borderColor: '#FF6B6B',
  },
  analyzeButton: {
    backgroundColor: '#4CAF50',
  },
  clearButton: {
    backgroundColor: '#2196F3',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    color: '#fff',
    marginTop: 12,
    fontSize: 14,
  },
});
