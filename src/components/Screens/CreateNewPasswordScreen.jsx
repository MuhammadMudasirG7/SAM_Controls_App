import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  ScrollView 
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { translations, getGlobalLang, subscribeLang } from '../../../i18n';

export default function CreateNewPasswordScreen({ onBackToOtp, onResetSuccess }) {
  const [currentLang, setCurrentLang] = useState(getGlobalLang());
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeLang((newLang) => {
      setCurrentLang(newLang);
    });
    return () => unsubscribe();
  }, []);

  const t = translations[currentLang];
  const isRtl = currentLang === 'ur' || currentLang === 'ar';

  const hasMinLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSymbol = /[^A-Za-z0-9]/.test(newPassword);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;

  const isFormValid = hasMinLength && hasUppercase && hasNumber && hasSymbol && passwordsMatch;

  const handleResetPassword = () => {
    if (!isFormValid) {
      alert("Please fulfill all password requirements.");
      return;
    }

    setShowToast(true);

    setTimeout(() => {
      setShowToast(false);
      if (onResetSuccess) {
        onResetSuccess();
      }
    }, 2000);
  };

  return (
    <View style={[styles.mainWrapper, { direction: isRtl ? 'rtl' : 'ltr' }]}>
      
      {showToast && (
        <View style={[styles.toastNotification, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
          <Ionicons name="checkmark-circle" size={18} color="#0B6655" style={[styles.toastIconSpace, { [isRtl ? 'marginLeft' : 'marginRight']: 12, [isRtl ? 'marginRight' : 'marginLeft']: 0 }]} />
          <View style={[styles.toastContent, { alignItems: isRtl ? 'flex-end' : 'flex-start' }]}>
            <Text style={[styles.toastTitleText, { textAlign: isRtl ? 'right' : 'left' }]}>{t.passResetSuccessTitle}</Text>
            <Text style={[styles.toastBodyText, { textAlign: isRtl ? 'right' : 'left' }]}>
              {t.passResetSuccessBody}
            </Text>
          </View>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        
        <View style={[styles.navBar, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
          <TouchableOpacity onPress={onBackToOtp} style={styles.backArrowButton}>
            <Ionicons name={isRtl ? "chevron-forward" : "chevron-back"} size={20} color="#1D2939" />
          </TouchableOpacity>
          <Text style={styles.navTitle}>{t.createNewPassTitle}</Text>
          <View style={styles.navRightPlaceholder} />
        </View>

        <View style={[styles.contentSection, { alignItems: isRtl ? 'flex-end' : 'flex-start' }]}>
          <Text style={styles.mainTitle}>{t.newPasswordHeading}</Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={[styles.inputLabel, { textAlign: isRtl ? 'right' : 'left' }]}>{t.newPasswordLabel}</Text>
          <View style={[styles.inputWrapper, { flexDirection: isRtl ? 'row-reverse' : 'row' }, hasMinLength && styles.inputSuccessBorder]}>
            <Feather name="lock" size={18} color="#667085" style={[styles.inputIcon, { [isRtl ? 'marginLeft' : 'marginRight']: 10, [isRtl ? 'marginRight' : 'marginLeft']: 0 }]} />
            <TextInput 
              style={[styles.textInput, { textAlign: isRtl ? 'right' : 'left' }]} 
              placeholder="••••••••" 
              placeholderTextColor="#98A2B3"
              secureTextEntry
              value={newPassword}
              onChangeText={(text) => setNewPassword(text)}
            />
          </View>

          <Text style={[styles.inputLabel, { textAlign: isRtl ? 'right' : 'left' }]}>{t.confirmPasswordLabel}</Text>
          <View style={[styles.inputWrapper, { flexDirection: isRtl ? 'row-reverse' : 'row' }, passwordsMatch && styles.inputSuccessBorder]}>
            <Feather name="lock" size={18} color="#667085" style={[styles.inputIcon, { [isRtl ? 'marginLeft' : 'marginRight']: 10, [isRtl ? 'marginRight' : 'marginLeft']: 0 }]} />
            <TextInput 
              style={[styles.textInput, { textAlign: isRtl ? 'right' : 'left' }]} 
              placeholder="••••••••" 
              placeholderTextColor="#98A2B3"
              secureTextEntry
              value={confirmPassword}
              onChangeText={(text) => setConfirmPassword(text)}
            />
          </View>

          <View style={styles.validationContainer}>
            <View style={[styles.validationRow, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
              <Ionicons 
                name={hasMinLength ? "checkmark-circle" : "ellipse-outline"} 
                size={16} 
                color={hasMinLength ? "#0B6655" : "#667085"} 
                style={[styles.checkIcon, { [isRtl ? 'marginLeft' : 'marginRight']: 8, [isRtl ? 'marginRight' : 'marginLeft']: 0 }]} 
              />
              <Text style={[styles.validationText, { textAlign: isRtl ? 'right' : 'left' }, hasMinLength && styles.validationTextSuccess]}>
                {t.reqMinChars}
              </Text>
            </View>

            <View style={[styles.validationRow, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
              <Ionicons 
                name={hasUppercase ? "checkmark-circle" : "ellipse-outline"} 
                size={16} 
                color={hasUppercase ? "#0B6655" : "#667085"} 
                style={[styles.checkIcon, { [isRtl ? 'marginLeft' : 'marginRight']: 8, [isRtl ? 'marginRight' : 'marginLeft']: 0 }]} 
              />
              <Text style={[styles.validationText, { textAlign: isRtl ? 'right' : 'left' }, hasUppercase && styles.validationTextSuccess]}>
                {t.reqUppercase}
              </Text>
            </View>

            <View style={[styles.validationRow, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
              <Ionicons 
                name={hasNumber ? "checkmark-circle" : "ellipse-outline"} 
                size={16} 
                color={hasNumber ? "#0B6655" : "#667085"} 
                style={[styles.checkIcon, { [isRtl ? 'marginLeft' : 'marginRight']: 8, [isRtl ? 'marginRight' : 'marginLeft']: 0 }]} 
              />
              <Text style={[styles.validationText, { textAlign: isRtl ? 'right' : 'left' }, hasNumber && styles.validationTextSuccess]}>
                {t.reqNumber}
              </Text>
            </View>

            <View style={[styles.validationRow, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
              <Ionicons 
                name={hasSymbol ? "checkmark-circle" : "ellipse-outline"} 
                size={16} 
                color={hasSymbol ? "#0B6655" : "#667085"} 
                style={[styles.checkIcon, { [isRtl ? 'marginLeft' : 'marginRight']: 8, [isRtl ? 'marginRight' : 'marginLeft']: 0 }]} 
              />
              <Text style={[styles.validationText, { textAlign: isRtl ? 'right' : 'left' }, hasSymbol && styles.validationTextSuccess]}>
                {t.reqSymbol}
              </Text>
            </View>

            <View style={[styles.validationRow, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
              <Ionicons 
                name={passwordsMatch ? "checkmark-circle" : "ellipse-outline"} 
                size={16} 
                color={passwordsMatch ? "#0B6655" : "#667085"} 
                style={[styles.checkIcon, { [isRtl ? 'marginLeft' : 'marginRight']: 8, [isRtl ? 'marginRight' : 'marginLeft']: 0 }]} 
              />
              <Text style={[styles.validationText, { textAlign: isRtl ? 'right' : 'left' }, passwordsMatch && styles.validationTextSuccess]}>
                {t.reqMatch}
              </Text>
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.resetButton, !isFormValid && styles.disabledResetButton]} 
            onPress={handleResetPassword}
            disabled={!isFormValid}
          >
            <Text style={styles.resetButtonText}>{t.createNewPassTitle}</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainWrapper: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  toastNotification: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EAECF0',
    zIndex: 9999,
    shadowColor: '#101828',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 5,
  },
  toastIconSpace: {
    marginTop: 2,
  },
  toastContent: {
    flex: 1,
  },
  toastTitleText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#101828',
  },
  toastBodyText: {
    fontSize: 13,
    color: '#475467',
    marginTop: 4,
    lineHeight: 18,
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
    textAlign: 'center',
    flex: 1,
  },
  navRightPlaceholder: {
    width: 40,
  },
  contentSection: {
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    marginTop: 30,
    marginBottom: 20,
  },
  mainTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#101828',
  },
  formContainer: {
    paddingHorizontal: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#344054',
    marginBottom: 6,
    marginTop: 12,
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
  },
  inputSuccessBorder: {
    borderColor: '#0B6655',
  },
  inputIcon: {},
  textInput: {
    flex: 1,
    color: '#1D2939',
    fontSize: 15,
  },
  validationContainer: {
    marginTop: 16,
    marginBottom: 24,
  },
  validationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  checkIcon: {},
  validationText: {
    fontSize: 14,
    color: '#667085',
  },
  validationTextSuccess: {
    color: '#0B6655',
  },
  resetButton: {
    backgroundColor: '#0B6655', 
    borderRadius: 10,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledResetButton: {
    backgroundColor: '#A3C7C1',
  },
  resetButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});