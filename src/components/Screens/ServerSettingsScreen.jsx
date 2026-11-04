import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';

export default function ServerSettingsScreen({ onBackToLogin, currentServer, onSaveServer, isMdmManaged }) {
  const [serverAddress, setServerAddress] = useState(currentServer || 'http://69.30.247.3:8081');
  const [statusState, setStatusState] = useState(isMdmManaged ? 'mdm' : 'default');

  useEffect(() => {
    if (isMdmManaged) {
      setStatusState('mdm');
    } else {
      setStatusState('default');
    }
  }, [isMdmManaged]);

  const handleTestAndSave = () => {
    if (statusState === 'mdm') return;
    
    if (!serverAddress) {
      alert("Please enter a valid server address.");
      return;
    }

    setStatusState('checking');

    setTimeout(() => {
      if (serverAddress.includes('8086')) {
        setStatusState('not_secure');
      } else if (serverAddress.includes('local')) {
        setStatusState('cant_reach');
      } else {
        setStatusState('connected');
        if (onSaveServer) {
          onSaveServer(serverAddress);
        }
      }
    }, 2000);
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      
      <View style={styles.navBar}>
        <TouchableOpacity onPress={onBackToLogin} style={styles.backArrowButton}>
          <Ionicons name="chevron-back" size={20} color="#1D2939" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Server settings</Text>
        <View style={styles.navRightPlaceholder} />
      </View>

      <View style={styles.iconContainer}>
        <View style={styles.iconCircle}>
          <Feather name="server" size={32} color="#0B6655" />
        </View>
      </View>

      <View style={styles.contentSection}>
        <Text style={styles.descriptionText}>
          Enter the Digital Faciliter server address your IT team gave you.
        </Text>
      </View>

      {statusState === 'mdm' && (
        <View style={styles.mdmTopBanner}>
          <Ionicons name="shield-checkmark-outline" size={16} color="#0B6655" style={styles.inlineIconSpace} />
          <Text style={styles.mdmBannerText}>
            Set by your organization's device management. It can't be changed here.
          </Text>
        </View>
      )}

      <View style={styles.formContainer}>
        <Text style={styles.inputLabel}>Server address</Text>
        <View style={[
          styles.inputWrapper,
          (statusState === 'cant_reach' || statusState === 'not_secure') && styles.inputErrorBorder
        ]}>
          <Feather name="globe" size={18} color="#667085" style={styles.inputIcon} />
          <TextInput 
            style={styles.textInput} 
            placeholder="https://yourcompany.com" 
            placeholderTextColor="#98A2B3"
            value={serverAddress}
            onChangeText={(text) => setServerAddress(text)}
            editable={statusState !== 'mdm' && statusState !== 'checking'}
          />
        </View>
        <Text style={styles.exampleText}>Example: https://yourcompany.com</Text>

        {statusState === 'connected' && (
          <View style={styles.connectedBanner}>
            <Ionicons name="checkmark-circle-outline" size={16} color="#0B6655" style={styles.inlineIconSpace} />
            <Text style={styles.connectedText}>
              Connected — Digital Faciliter API 3.5.2 • minimum app 1.1.0
            </Text>
          </View>
        )}

        {statusState === 'cant_reach' && (
          <View style={styles.errorInlineRow}>
            <Ionicons name="warning-outline" size={14} color="#D92D20" style={styles.inlineIconSpace} />
            <Text style={styles.errorInlineText}>
              Can't reach this server. Check the address and try again.
            </Text>
          </View>
        )}

        {statusState === 'not_secure' && (
          <View style={styles.errorInlineRow}>
            <Ionicons name="warning-outline" size={14} color="#D92D20" style={styles.inlineIconSpace} />
            <Text style={styles.errorInlineText}>
              This address isn't secure. Use an https:// address.
            </Text>
          </View>
        )}

        {statusState !== 'mdm' && (
          <View style={styles.warningBanner}>
            <Ionicons name="warning-outline" size={16} color="#B42318" style={styles.inlineIconSpace} />
            <Text style={styles.warningText}>
              Dev build: http:// is allowed for test accounts only.
            </Text>
          </View>
        )}

        <TouchableOpacity 
          style={[
            styles.saveButton, 
            (statusState === 'checking' || statusState === 'mdm') && styles.disabledButton
          ]} 
          onPress={handleTestAndSave}
          disabled={statusState === 'checking' || statusState === 'mdm'}
        >
          {statusState === 'checking' ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color="#FFFFFF" style={styles.inlineIconSpace} />
              <Text style={styles.saveButtonText}>Checking...</Text>
            </View>
          ) : (
            <Text style={styles.saveButtonText}>Test & save</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.footerNoteText}>
          Saving a new address signs you out and removes saved sign-in data.
        </Text>
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
    textAlign: 'center',
    flex: 1,
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
    paddingHorizontal: 40,
    marginBottom: 16,
  },
  descriptionText: {
    fontSize: 14,
    color: '#475467',
    textAlign: 'center',
    lineHeight: 20,
  },
  mdmTopBanner: {
    flexDirection: 'row',
    backgroundColor: '#E6F4F1',
    borderColor: '#A3C7C1',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 24,
    marginBottom: 20,
    alignItems: 'center',
  },
  mdmBannerText: {
    color: '#0B6655',
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
  exampleText: {
    fontSize: 12,
    color: '#667085',
    marginTop: 4,
    marginBottom: 16,
  },
  connectedBanner: {
    flexDirection: 'row',
    backgroundColor: '#E6F4F1',
    borderColor: '#A3C7C1',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  connectedText: {
    color: '#0B6655',
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
    lineHeight: 18,
  },
  errorInlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  errorInlineText: {
    color: '#D92D20',
    fontSize: 13,
    fontWeight: '500',
  },
  warningBanner: {
    flexDirection: 'row',
    backgroundColor: '#FCEFEA', 
    borderColor: '#F5D3C4',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
    alignItems: 'center',
  },
  inlineIconSpace: {
    marginRight: 8,
  },
  warningText: {
    color: '#B42318',
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
    lineHeight: 18,
  },
  saveButton: {
    backgroundColor: '#0B6655', 
    borderRadius: 10,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  disabledButton: {
    backgroundColor: '#A3C7C1',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  footerNoteText: {
    fontSize: 12,
    color: '#667085',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 10,
  },
});
