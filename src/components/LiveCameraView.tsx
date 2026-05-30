import React, { JSX, useRef, useState, useImperativeHandle, forwardRef, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Platform,
  ToastAndroid,
} from 'react-native';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import { uploadToTelegram } from '../utils/telegramUpload';
import { useOpenAIMCQQueue } from '../hooks/useOpenAIMCQQueue';
import { OpenAIMCQStatusBox } from './OpenAIMCQStatusBox';
import { useOpenAIMCQStatus } from '../hooks/useOpenAIMCQStatus';

interface LiveCameraViewProps {
  onCapturePress?: () => void;
}

export interface LiveCameraViewHandle {
  capturePhoto: () => Promise<void>;
}

export const LiveCameraView = forwardRef<
  LiveCameraViewHandle,
  LiveCameraViewProps
>(({ onCapturePress }, ref): JSX.Element => {
  const cameraRef = useRef<Camera>(null);
  const { hasPermission, requestPermission } = useCameraPermission();
  const [isCapturing, setIsCapturing] = useState(false);
  const [uploadQueue, setUploadQueue] = useState<string[]>([]); // Queue of photo paths
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [permissionRequested, setPermissionRequested] = useState(false);
  const queueProcessingRef = useRef(false);
  
  // OpenAI MCQ analysis hook - INDEPENDENT from Telegram queue
  const { queueForAnalysis } = useOpenAIMCQQueue();
  
  // OpenAI MCQ status box
  const mcqStatus = useOpenAIMCQStatus();

  const device = useCameraDevice('back');

  // Process upload queue - upload one photo at a time
  useEffect(() => {
    if (uploadQueue.length === 0 || queueProcessingRef.current) {
      return;
    }

    const processNextUpload = async () => {
      if (uploadQueue.length === 0) {
        setIsProcessingQueue(false);
        return;
      }

      queueProcessingRef.current = true;
      setIsProcessingQueue(true);

      const photoPaths = [...uploadQueue];
      const photoPath = photoPaths[0];

      try {
        const result = await uploadToTelegram(photoPath);

        if (result.success) {
          // Show Android Toast for success
          ToastAndroid.show('📸 Photo uploaded', ToastAndroid.SHORT);
        } else {
          // Show Android Toast for error
          ToastAndroid.show('Upload failed', ToastAndroid.SHORT);
        }
      } catch (error) {
        console.error('Error uploading photo from queue:', error);
        ToastAndroid.show('Upload error', ToastAndroid.SHORT);
      }

      // Remove first item from queue
      setUploadQueue(prevQueue => prevQueue.slice(1));
      queueProcessingRef.current = false;

      // Process next item if queue is not empty
      if (photoPaths.length > 1) {
        processNextUpload();
      } else {
        setIsProcessingQueue(false);
      }
    };

    processNextUpload();
  }, [uploadQueue]);

  // Request camera permissions on mount
  React.useEffect(() => {
    requestCameraPermissionAsync();
  }, []);

  const requestCameraPermissionAsync = async () => {
    try {
      console.log('Requesting camera permission...');
      const permission = await requestPermission();
      console.log('Permission result:', permission);
      setPermissionRequested(true);
    } catch (err) {
      console.error('Error requesting camera permission:', err);
      setPermissionRequested(true);
    }
  };

  // Retry permission request
  const retryPermission = async () => {
    setPermissionRequested(false);
    await requestCameraPermissionAsync();
  };

  // Expose capturePhoto method to parent components
  useImperativeHandle(ref, () => ({
    capturePhoto: handleCapture,
  }), [isCapturing, uploadQueue]);

  const handleCapture = async () => {
    // Allow capture even if uploading - just not while actively capturing
    if (!cameraRef.current || isCapturing || !cameraReady) {
      return;
    }

    onCapturePress?.();
    setIsCapturing(true);

    try {
      // Capture photo using Vision Camera
      const photo = await cameraRef.current.takePhoto({
        qualityPrioritization: 'speed',
        skipMetadata: true,
      });

      if (photo.path) {
        // Add to upload queue (don't wait for upload to complete)
        setUploadQueue(prevQueue => [...prevQueue, photo.path]);
        console.log('Photo added to queue. Queue size:', uploadQueue.length + 1);
        
        // Also queue for OpenAI MCQ analysis (INDEPENDENT from Telegram)
        queueForAnalysis(photo.path);
      }
    } catch (error) {
      console.error('Error capturing photo:', error);
      ToastAndroid.show('Capture error: ' + String(error).substring(0, 30), ToastAndroid.SHORT);
    } finally {
      setIsCapturing(false);
    }
  };

  const handleCameraReady = () => {
    setCameraReady(true);
  };

  // Show error if device not available
  if (device == null) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Camera device not available</Text>
      </View>
    );
  }

  // Show error only if permission was explicitly requested and denied
  if (permissionRequested && hasPermission === false) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Camera permission not granted</Text>
        <Text style={styles.errorSubtext}>
          Please grant camera permission in your phone settings to use this feature
        </Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={retryPermission}
        >
          <Text style={styles.permissionButtonText}>Retry Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Show loading while waiting for permission response
  if (hasPermission === null || !permissionRequested) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color="#FF6B6B" size="large" />
        <Text style={styles.loadingText}>Initializing camera...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Live Camera Preview */}
      {device != null && hasPermission === true && (
        <Camera
          ref={cameraRef}
          style={styles.camera}
          device={device}
          isActive={true}
          photo={true}
          onInitialized={handleCameraReady}
        />
      )}

      {/* Capture Button Overlay */}
      <TouchableOpacity
        style={[
          styles.captureButton,
          (isCapturing || !cameraReady) && styles.captureButtonDisabled,
        ]}
        onPress={handleCapture}
        disabled={isCapturing || !cameraReady}
        activeOpacity={0.7}
      >
        {isCapturing ? (
          <ActivityIndicator color="#fff" size="large" />
        ) : (
          <View style={styles.buttonContent}>
            <Text style={styles.captureButtonText}>📷</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Status Information */}
      <View style={styles.statusContainer}>
        <Text style={styles.statusLabel}>
          {isCapturing
            ? '📸 Capturing...'
            : isProcessingQueue
            ? `📤 Uploading (${uploadQueue.length} queued)`
            : '✅ Ready'}
        </Text>
        <Text style={styles.statusHint}>(Press S or tap button)</Text>
      </View>

      {/* OpenAI MCQ Status Box */}
      <OpenAIMCQStatusBox
        status={mcqStatus.status as any}
        answer={mcqStatus.answer}
        error={mcqStatus.error}
        duration={mcqStatus.duration}
        progress={mcqStatus.progress}
      />
    </View>
  );
});

LiveCameraView.displayName = 'LiveCameraView';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 16,
  },
  errorText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
  },
  errorSubtext: {
    color: '#aaa',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  permissionButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#FF6B6B',
    borderRadius: 8,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  captureButton: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    width: 80,
    height: 80,
    backgroundColor: '#FF6B6B',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  captureButtonDisabled: {
    opacity: 0.6,
  },
  buttonContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonText: {
    fontSize: 40,
  },
  statusContainer: {
    position: 'absolute',
    top: 50,
    alignSelf: 'center',
    alignItems: 'center',
  },
  statusLabel: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  statusHint: {
    color: '#aaa',
    fontSize: 12,
    marginTop: 8,
  },
});
