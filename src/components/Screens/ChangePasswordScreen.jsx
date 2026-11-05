import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  TextInput, 
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Alert 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { translations, getGlobalLang, subscribeLang } from '../../../i18n';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function ChangePasswordScreen({ 
  onBack, 
  serverAddress = 'http://192.168.100.199:8081', 
  employeeId = 'EMP-10482' 
}) {
  const [currentLang, setCurrentLang] = useState(getGlobalLang());
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isCurrentWrong, setIsCurrentWrong] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeLang((newLang) => {
      setCurrentLang(newLang);
    });
    return () => unsubscribe();
  }, []);

  const t = translations[currentLang];
  const isRtl = currentLang === 'ur' || currentLang === 'ar';

  const satisfiesLength = newPassword.length >= 8;
  const satisfiesUppercase = /[A-Z]/.test(newPassword);
  const satisfiesNumber = /[0-9]/.test(newPassword);
  const satisfiesSymbol = /[^A-Za-z0-9]/.test(newPassword);
  const satisfiesMatch = newPassword === confirmPassword && confirmPassword.length > 0;

  const handleSavePassword = async () => {
    setIsCurrentWrong(false);

    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert("Required", "Please fill all required password fields.");
      return;
    }

    if (!satisfiesLength || !satisfiesUppercase || !satisfiesNumber || !satisfiesSymbol || !satisfiesMatch) {
      Alert.alert("Complexity Requirement", "Please satisfy all password complexity criteria.");
      return;
    }

    setLoading(true);

    try {
      const cleanBaseUrl = serverAddress.replace(/\/+$/, '');
      const response = await fetch(`${cleanBaseUrl}/api/auth/update-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId,
          currentPassword,
          newPassword
        }),
      });

      const json = await response.json();

      if (response.ok && json.success) {
        Alert.alert("Success", "✅ Password changed successfully!");
        if (onBack) onBack();
      } else {
        if (json.message && json.message.toLowerCase().includes('current password')) {
          setIsCurrentWrong(true);
        } else {
          Alert.alert("Error", json.message || "Failed to update password.");
        }
      }
    } catch (err) {
      console.log("Password update exception:", err);
      Alert.alert("Network Error", "Unable to reach server. Check connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.mainWrapper, { direction: isRtl ? 'rtl' : 'ltr' }]}>
      <View style={[styles.navTopHeaderBar, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
        <TouchableOpacity onPress={onBack} style={styles.headerBackArrowLink}>
          <Ionicons name={isRtl ? "chevron-forward" : "chevron-back"} size={20} color="#344054" />
        </TouchableOpacity>
        <Text style={styles.navBarHeadingCenterTitle}>{t.changePasswordTitle}</Text>
        <View style={styles.headerRightBoxSpace} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContentLayout} showsVerticalScrollIndicator={false}>
        
        <Text style={[styles.inputFieldSectionHeaderLabel, { textAlign: isRtl ? 'right' : 'left' }]}>
          {t.currentPasswordLabel} <Text style={{ color: '#D92D20' }}>*</Text>
        </Text>
        <View style={[styles.textInputBoxNodeItemRow, { flexDirection: isRtl ? 'row-reverse' : 'row' }, isCurrentWrong && styles.inputFieldErrorOutlineColor]}>
          <Ionicons name="lock-closed-outline" size={18} color="#667085" style={{ [isRtl ? 'marginLeft' : 'marginRight']: 10 }} />
          <TextInput 
            style={[styles.textInputInputElement, { textAlign: isRtl ? 'right' : 'left' }]} 
            placeholder={t.enterCurrentPassPlaceholder} 
            secureTextEntry 
            placeholderTextColor="#98A2B3" 
            value={currentPassword} 
            onChangeText={(txt) => { setCurrentPassword(txt); setIsCurrentWrong(false); }} 
          />
        </View>
        {isCurrentWrong && (
          <View style={[styles.errorInlineTextContainerRow, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
            <Ionicons name="alert-circle-outline" size={14} color="#D92D20" style={{ [isRtl ? 'marginLeft' : 'marginRight']: 4, marginTop: 1 }} />
            <Text style={styles.errorTextLabel}>{t.currentPasswordError}</Text>
          </View>
        )}

        <Text style={[styles.inputFieldSectionHeaderLabel, { textAlign: isRtl ? 'right' : 'left' }]}>
          {t.newPasswordLabel} <Text style={{ color: '#D92D20' }}>*</Text>
        </Text>
        <View style={[styles.textInputBoxNodeItemRow, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
          <Ionicons name="key-outline" size={18} color="#667085" style={{ [isRtl ? 'marginLeft' : 'marginRight']: 10 }} />
          <TextInput 
            style={[styles.textInputInputElement, { textAlign: isRtl ? 'right' : 'left' }]} 
            placeholder={t.enterNewPassPlaceholder} 
            secureTextEntry 
            placeholderTextColor="#98A2B3" 
            value={newPassword} 
            onChangeText={setNewPassword} 
          />
        </View>

        <Text style={[styles.inputFieldSectionHeaderLabel, { textAlign: isRtl ? 'right' : 'left' }]}>
          {t.confirmPasswordLabel} <Text style={{ color: '#D92D20' }}>*</Text>
        </Text>
        <View style={[styles.textInputBoxNodeItemRow, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
          <Ionicons name="key-outline" size={18} color="#667085" style={{ [isRtl ? 'marginLeft' : 'marginRight']: 10 }} />
          <TextInput 
            style={[styles.textInputInputElement, { textAlign: isRtl ? 'right' : 'left' }]} 
            placeholder={t.confirmNewPassPlaceholder} 
            secureTextEntry 
            placeholderTextColor="#98A2B3" 
            value={confirmPassword} 
            onChangeText={setConfirmPassword} 
          />
        </View>

        <View style={styles.checklistCriteriaContainerColumn}>
          <View style={[styles.checklistRowLine, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
            <Ionicons name={satisfiesLength ? "checkmark-circle" : "radio-button-off"} size={16} color={satisfiesLength ? "#0B6655" : "#98A2B3"} style={{ [isRtl ? 'marginLeft' : 'marginRight']: 8 }} />
            <Text style={[styles.checklistLabelText, { textAlign: isRtl ? 'right' : 'left' }, satisfiesLength && { color: '#101828', fontWeight: '600' }]}>{t.reqMinChars}</Text>
          </View>
          <View style={[styles.checklistRowLine, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
            <Ionicons name={satisfiesUppercase ? "checkmark-circle" : "radio-button-off"} size={16} color={satisfiesUppercase ? "#0B6655" : "#98A2B3"} style={{ [isRtl ? 'marginLeft' : 'marginRight']: 8 }} />
            <Text style={[styles.checklistLabelText, { textAlign: isRtl ? 'right' : 'left' }, satisfiesUppercase && { color: '#101828', fontWeight: '600' }]}>{t.reqUppercase}</Text>
          </View>
          <View style={[styles.checklistRowLine, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
            <Ionicons name={satisfiesNumber ? "checkmark-circle" : "radio-button-off"} size={16} color={satisfiesNumber ? "#0B6655" : "#98A2B3"} style={{ [isRtl ? 'marginLeft' : 'marginRight']: 8 }} />
            <Text style={[styles.checklistLabelText, { textAlign: isRtl ? 'right' : 'left' }, satisfiesNumber && { color: '#101828', fontWeight: '600' }]}>{t.reqNumber}</Text>
          </View>
          <View style={[styles.checklistRowLine, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
            <Ionicons name={satisfiesSymbol ? "checkmark-circle" : "radio-button-off"} size={16} color={satisfiesSymbol ? "#0B6655" : "#98A2B3"} style={{ [isRtl ? 'marginLeft' : 'marginRight']: 8 }} />
            <Text style={[styles.checklistLabelText, { textAlign: isRtl ? 'right' : 'left' }, satisfiesSymbol && { color: '#101828', fontWeight: '600' }]}>{t.reqSymbol}</Text>
          </View>
          <View style={[styles.checklistRowLine, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
            <Ionicons name={satisfiesMatch ? "checkmark-circle" : "radio-button-off"} size={16} color={satisfiesMatch ? "#0B6655" : "#98A2B3"} style={{ [isRtl ? 'marginLeft' : 'marginRight']: 8 }} />
            <Text style={[styles.checklistLabelText, { textAlign: isRtl ? 'right' : 'left' }, satisfiesMatch && { color: '#101828', fontWeight: '600' }]}>{t.reqMatch}</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.primaryActionButtonNodeFixedSubmit, loading && { opacity: 0.7 }]} 
          onPress={handleSavePassword}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.primaryActionButtonNodeFixedSubmitTextLabel}>{t.saveBtn}</Text>
          )}
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainWrapper: { flex: 1, backgroundColor: '#F9FAFB' },
  navTopHeaderBar: { height: 56, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderColor: '#EAECF0', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
  headerBackArrowLink: { padding: 4 },
  navBarHeadingCenterTitle: { fontSize: 16, fontWeight: '700', color: '#101828' },
  headerRightBoxSpace: { width: 28 },
  scrollContentLayout: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 },
  inputFieldSectionHeaderLabel: { fontSize: 13, fontWeight: '700', color: '#344054', marginBottom: 6, marginTop: 14 },
  textInputBoxNodeItemRow: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D0D5DD', borderRadius: 10, height: 46, paddingHorizontal: 14, alignItems: 'center', width: '100%' },
  textInputInputElement: { flex: 1, fontSize: 14, color: '#101828', fontWeight: '500', padding: 0 },
  inputFieldErrorOutlineColor: { borderColor: '#D92D20', backgroundColor: '#FFFDFD' },
  errorInlineTextContainerRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6, paddingHorizontal: 2 },
  errorTextLabel: { fontSize: 12, color: '#D92D20', fontWeight: '600' },
  checklistCriteriaContainerColumn: { marginTop: 20, paddingHorizontal: 2 },
  checklistRowLine: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  checklistLabelText: { fontSize: 13, color: '#667085', fontWeight: '500' },
  primaryActionButtonNodeFixedSubmit: { backgroundColor: '#0B6655', borderRadius: 12, height: 48, justifyContent: 'center', alignItems: 'center', width: '100%', marginTop: 24 },
  primaryActionButtonNodeFixedSubmitTextLabel: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' }
});