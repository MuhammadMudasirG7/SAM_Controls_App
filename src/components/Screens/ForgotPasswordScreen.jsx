import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  ScrollView 
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';

export default function ForgotPasswordScreen({ onBackToLogin, onNavigateToOtp, serverAddress }) {
  const [employeeId, setEmployeeId] = useState('');
  const [errorState, setErrorState] = useState('default');

  const handleSendCode = async () => {
    if (!employeeId) {
      alert("Please enter your Employee ID.");
      return;
    }

    try {
      setErrorState('default'); 

      const cleanBaseUrl = serverAddress || 'http://192.168.100.199:8081';
      const response = await fetch(`${cleanBaseUrl}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId }),
      });

      const jsonResponse = await response.json();

      if (response.ok && jsonResponse.success) {
        if (onNavigateToOtp) onNavigateToOtp(employeeId);
      } else {
        setErrorState('server_error');
      }
    } catch (err) {
      const mockEmpId = "EMP-10482";
      if (employeeId === mockEmpId) {
        if (onNavigateToOtp) onNavigateToOtp(employeeId);
      } else {
        setErrorState('server_error');
      }
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      
      <View style={styles.navBar}>
        <TouchableOpacity onPress={onBackToLogin} style={styles.backArrowButton}>
          <Ionicons name="chevron-back" size={20} color="#1D2939" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Forgot password</Text>
        <View style={styles.navRightPlaceholder} />
      </View>

      <View style={styles.iconContainer}>
        <View style={styles.iconCircle}>
          <Feather name="lock" size={32} color="#0B6655" />
        </View>
      </View>

      <View style={styles.contentSection}>
        <Text style={styles.mainTitle}>Reset password</Text>
        <Text style={styles.descriptionText}>
          Enter your Employee ID. If it has an email on file, we'll send you a 6-digit code.
        </Text>
      </View>

      {errorState === 'server_error' && (
        <View style={styles.serverErrorBanner}>
          <Ionicons name="warning-outline" size={18} color="#B42318" style={styles.errorIconSpace} />
          <Text style={styles.serverErrorText}>
            We couldn't send a code right now. Try again in a few minutes.
          </Text>
        </View>
      )}

      <View style={styles.formContainer}>
        <Text style={styles.inputLabel}>Employee ID</Text>
        <View style={[styles.inputWrapper, errorState === 'server_error' && styles.inputErrorBorder]}>
          <Feather name="user" size={18} color="#667085" style={styles.inputIcon} />
          <TextInput 
            style={styles.textInput} 
            placeholder="EMP-10482" 
            placeholderTextColor="#98A2B3"
            value={employeeId}
            onChangeText={(text) => setEmployeeId(text)}
          />
        </View>

        <TouchableOpacity style={styles.sendCodeButton} onPress={handleSendCode}>
          <Text style={styles.sendCodeButtonText}>Send code</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.backRedirectLink} onPress={onBackToLogin}>
          <Ionicons name="chevron-back" size={14} color="#0B6655" style={styles.backIconSpace} />
          <Text style={styles.backRedirectText}>Back to login</Text>
        </TouchableOpacity>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: '#FFFFFF', 
    paddingBottom: 40,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 56,
    borderBottomWidth: 1,
    borderColor: '#EAECF0',
    marginTop: 10,
  },
  backArrowButton: {
    padding: 8,
  },
  navTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#101828',
  },
  navRightPlaceholder: {
    width: 40,
  },
  iconContainer: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 20,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E6F4F1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentSection: {
    alignItems: 'center',
    paddingHorizontal: 32,
    marginBottom: 20,
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0B6655', 
    textAlign: 'center',
  },
  descriptionText: {
    fontSize: 14,
    color: '#667085',
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 10,
  },
  serverErrorBanner: {
    flexDirection: 'row',
    backgroundColor: '#FEF3F2', 
    borderColor: '#FECDCA',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 24,
    marginBottom: 20,
    alignItems: 'center',
  },
  errorIconSpace: {
    marginRight: 10,
    alignSelf: 'flex-start',
    marginTop: 1,
  },
  serverErrorText: {
    color: '#B42318', 
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
    lineHeight: 18,
  },
  formContainer: {
    paddingHorizontal: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#344054',
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D0D5DD',
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 48,
    marginBottom: 20,
  },
  inputErrorBorder: {
    borderColor: '#D92D20',
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    color: '#1D2939',
    fontSize: 15,
  },
  sendCodeButton: {
    backgroundColor: '#0B6655', 
    borderRadius: 10,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  sendCodeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  backRedirectLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    padding: 8,
  },
  backIconSpace: {
    marginRight: 4,
  },
  backRedirectText: {
    color: '#0B6655',
    fontSize: 14,
    fontWeight: '600',
  },
});
