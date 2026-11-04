import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

export default function BiometricSetupScreen({ biometricType, onTurnOn, onNotNow, employeeId }) {
  const [statusState, setStatusState] = useState('default'); // 'default', 'processing', 'success'
  const isFaceId = biometricType === 'face_id';

  const handleEnrollBiometrics = async () => {
    if (statusState === 'processing' || statusState === 'success') return;
    setStatusState('processing');

    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        alert("🔒 Biometric Hardware Error:\nFingerprint scanner/Face ID is either missing or not set up in your Android phone settings. Please register at least one finger inside Android Settings first.");
        setStatusState('default');
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: isFaceId ? 'Confirm Face ID for SAM Controls' : 'Scan your fingerprint sensor to link account',
        disableDeviceFallback: true,
        cancelLabel: 'Cancel Setup'
      });

      if (result.success) {
        const mockSecureToken = `token_${employeeId || 'EMP-10482'}_${Date.now()}`;
        
        await SecureStore.setItemAsync('user_session_token', mockSecureToken);
        await SecureStore.setItemAsync('saved_employee_id', employeeId || 'EMP-10482');
        await SecureStore.setItemAsync('biometric_enabled_status', 'true');

        setStatusState('success');

        setTimeout(() => {
          if (onTurnOn) {
            onTurnOn();
          }
        }, 1500);

      } else {
        setStatusState('default');
      }
    } catch (error) {
      setStatusState('default');
      alert("⚠️ Encryption keystore storage failed to initialize.");
    }
  };

  return (
    <View style={styles.mainWrapper}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        
        <View style={styles.iconContainer}>
          <View style={[
            styles.iconCircle,
            statusState === 'success' && styles.iconCircleSuccess
          ]}>
            {statusState === 'processing' && (
              <ActivityIndicator size="large" color="#0B6655" />
            )}
            
            {statusState === 'default' && (
              <Ionicons 
                name={isFaceId ? "scan-outline" : "finger-print-outline"} 
                size={48} 
                color="#0B6655" 
              />
            )}

            {statusState === 'success' && (
              <Ionicons 
                name="checkmark-circle" 
                size={64} 
                color="#0B6655" 
                style={styles.checkmarkScaleAnimation}
              />
            )}
          </View>
        </View>

        <View style={styles.contentSection}>
          <Text style={styles.mainTitle}>
            {isFaceId ? "Log in with Face ID?" : "Log in with your fingerprint?"}
          </Text>
          <Text style={styles.descriptionText}>
            {isFaceId 
              ? "Next time, open the app with one look instead of your password. Your face never leaves this phone."
              : "Next time, open the app with one touch instead of your password. Your fingerprint never leaves this phone."
            }
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[
              styles.primaryButton, 
              statusState === 'processing' && styles.disabledButton,
              statusState === 'success' && styles.successButtonColor
            ]} 
            onPress={handleEnrollBiometrics}
            disabled={statusState === 'processing' || statusState === 'success'}
          >
            <Text style={styles.primaryButtonText}>
              {statusState === 'processing' && "Waiting for Sensor..."}
              {statusState === 'success' && "Activated"}
              {statusState === 'default' && "Turn on"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.secondaryButton} 
            onPress={onNotNow}
            disabled={statusState === 'processing' || statusState === 'success'}
          >
            <Text style={styles.secondaryButtonText}>Not now</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainWrapper: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: 40,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E6F4F1',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D0D5DD',
  },
  iconCircleSuccess: {
    backgroundColor: '#E6F4F1',
    borderColor: '#0B6655',
    borderWidth: 2,
  },
  checkmarkScaleAnimation: {
    transform: [{ scale: 1.1 }],
  },
  contentSection: {
    alignItems: 'center',
    paddingHorizontal: 32,
    marginBottom: 48,
  },
  mainTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#101828',
    textAlign: 'center',
    marginBottom: 16,
  },
  descriptionText: {
    fontSize: 14,
    color: '#475467',
    textAlign: 'center',
    lineHeight: 22,
  },
  buttonContainer: {
    paddingHorizontal: 24,
  },
  primaryButton: {
    backgroundColor: '#0B6655', 
    borderRadius: 10,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  disabledButton: {
    backgroundColor: '#A3C7C1',
  },
  successButtonColor: {
    backgroundColor: '#0B6655',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D0D5DD',
    borderWidth: 1,
    borderRadius: 10,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#344054',
    fontSize: 16,
    fontWeight: '600',
  },
});
