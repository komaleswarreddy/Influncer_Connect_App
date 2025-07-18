import React, { useRef, useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import ViewShot from 'react-native-view-shot';

interface SignaturePadProps {
  value: string;
  onChange: (signature: string) => void;
}

export default function SignaturePad({ value, onChange }: SignaturePadProps) {
  const viewShotRef = useRef<ViewShot>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const captureSignature = async () => {
    try {
      if (viewShotRef.current?.capture) {
        const uri = await viewShotRef.current.capture();
        onChange(uri);
      }
    } catch (error) {
      console.error('Error capturing signature:', error);
      Alert.alert('Error', 'Failed to capture signature');
    }
  };

  const clearSignature = () => {
    onChange('');
  };

  return (
    <View style={styles.container}>
      <View style={styles.signatureArea}>
        <ViewShot
          ref={viewShotRef}
          style={styles.viewShot}
          options={{
            format: 'png',
            quality: 0.9,
          }}
        >
          <View style={styles.drawingArea}>
            {value ? (
              <Text style={styles.signatureText}>Signature captured</Text>
            ) : (
              <Text style={styles.placeholderText}>
                Tap "Draw Signature" to open signature pad
              </Text>
            )}
          </View>
        </ViewShot>
      </View>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => {
            Alert.alert(
              'Signature Pad',
              'Signature drawing functionality will be implemented with a proper drawing library like react-native-signature-canvas',
              [
                { text: 'OK', onPress: () => {
                  // For now, simulate a signature capture
                  onChange('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==');
                }}
              ]
            );
          }}
        >
          <Text style={styles.buttonText}>Draw Signature</Text>
        </TouchableOpacity>
        
        {value && (
          <TouchableOpacity
            style={[styles.button, styles.clearButton]}
            onPress={clearSignature}
          >
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  signatureArea: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    overflow: 'hidden',
  },
  viewShot: {
    backgroundColor: '#fff',
  },
  drawingArea: {
    height: 120,
    backgroundColor: '#f9fafb',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  signatureText: {
    color: '#10b981',
    fontSize: 16,
    fontWeight: '600',
  },
  placeholderText: {
    color: '#6b7280',
    fontSize: 14,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  button: {
    flex: 1,
    backgroundColor: '#14b8a6',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  clearButton: {
    backgroundColor: '#ef4444',
  },
  clearButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
}); 