import React, {JSX, useEffect, useRef} from 'react';
import {
  View,
  StyleSheet,
  NativeEventEmitter,
  NativeModules,
} from 'react-native';
import {
  LiveCameraView,
  LiveCameraViewHandle,
} from './components/LiveCameraView';

function App(): JSX.Element {
  const cameraRef = useRef<LiveCameraViewHandle>(null);

  // Set up keyboard listener for 'S' key to trigger camera capture
  useEffect(() => {
    try {
      const {RCTKeyboardModule} = NativeModules;
      if (RCTKeyboardModule) {
        const keyboardEmitter = new NativeEventEmitter(RCTKeyboardModule);
        const subscription = keyboardEmitter.addListener(
          'onKeyDown',
          (event: any) => {
            // 'S' key or 's' key (keyCodes 83 or 115)
            if (event.keyCode === 83 || event.keyCode === 115) {
              handleKeyboardCapture();
            }
          },
        );
        return () => subscription.remove();
      }
    } catch (error) {
      console.warn('Keyboard module not available:', error);
    }
  }, []);

  const handleKeyboardCapture = () => {
    // Trigger camera capture via the exposed imperative handle
    if (cameraRef.current) {
      cameraRef.current.capturePhoto();
    }
  };

  return (
    <View style={styles.container}>
      <LiveCameraView ref={cameraRef} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
});

export default App;
