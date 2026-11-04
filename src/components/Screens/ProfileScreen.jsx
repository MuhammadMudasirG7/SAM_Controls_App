import React, { useState, useEffect } from 'react';
import { 
    StyleSheet, 
    Text, 
    View, 
    TouchableOpacity, 
    ScrollView,
    Dimensions,
    Switch,
    Platform,
    Modal,
    ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function ProfileScreen({ 
    userProfileData, 
    serverAddress = 'http://192.168.100.199:8081',
    onNavigateToChangePassword, 
    onNavigateToPrivacy,
    onSignOut,
    onNavigateHome,
    onNavigateToAttendance,
    onNavigateToLeave,
    onNavigateToProfile 
}) {
    const [profile, setProfile] = useState(userProfileData || null);
    const [loading, setLoading] = useState(!userProfileData);
    const [isFingerprintEnabled, setIsFingerprintEnabled] = useState(true);
    const [isHourlyEnabled, setIsHourlyEnabled] = useState(true);
    const [isLanguageSheetVisible, setIsLanguageSheetVisible] = useState(false);
    const [selectedLanguage, setSelectedLanguage] = useState('English');

    const empId = profile?.employeeId || 'EMP-10482';
    const empName = profile?.name || 'Faisal Al-Harbi';

    useEffect(() => {
        loadStoredPreferences();
        if (!userProfileData) {
            fetchProfileData();
        }
    }, []);

    const loadStoredPreferences = async () => {
        try {
            const bioStatus = await SecureStore.getItemAsync('biometric_enabled_status');
            if (bioStatus !== null) {
                setIsFingerprintEnabled(bioStatus === 'true');
            }
        } catch (err) {
            console.log("Failed to load biometric preference");
        }
    };

    const handleBiometricToggle = async (val) => {
        setIsFingerprintEnabled(val);
        try {
            await SecureStore.setItemAsync('biometric_enabled_status', val ? 'true' : 'false');
            if (val) {
                // Agar enable kiya hai toh current employee ID bhi save kar lein secure storage mein
                await SecureStore.setItemAsync('saved_employee_id', empId);
            }
        } catch (err) {
            console.log("Failed to save biometric preference");
        }
        updatePreferenceSetting('isFingerprintEnabled', val);
    };

    const fetchProfileData = async () => {
        try {
            setLoading(true);
            const cleanBaseUrl = serverAddress.replace(/\/+$/, '');
            const response = await fetch(`${cleanBaseUrl}/api/auth/profile?employeeId=${encodeURIComponent(empId)}`);
            const json = await response.json();
            if (json.success && json.profile) {
                setProfile(json.profile);
            }
        } catch (err) {
            console.log("Error fetching profile data:", err);
        } finally {
            setLoading(false);
        }
    };

    const updatePreferenceSetting = async (key, value) => {
        try {
            const cleanBaseUrl = serverAddress.replace(/\/+$/, '');
            await fetch(`${cleanBaseUrl}/api/auth/profile`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    employeeId: empId,
                    preferences: { [key]: value }
                })
            });
        } catch (err) {
            console.log("Failed to sync preference:", err);
        }
    };

    const nameInitials = empName !== 'Loading Account...'
        ? empName.split(' ').filter(Boolean).map(n => n).join('').substring(0, 2).toUpperCase()
        : 'FH';

    if (loading) {
        return (
            <View style={[styles.mainWrapper, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#0B6655" />
            </View>
        );
    }

    return (
        <View style={styles.mainWrapper}>
            <View style={styles.navTopHeaderBar}>
                <View style={styles.headerBackArrowLink} />
                <View style={styles.headerRightBoxSpace} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContentLayout} showsVerticalScrollIndicator={false}>
                
                <View style={styles.profileDetailsIdentityCard}>
                    <View style={styles.avatarInitialCircleBadge}>
                        <Text style={styles.avatarInitialText}>{nameInitials}</Text>
                    </View>
                    <View style={styles.profileDetailsContentBlock}>
                        <Text style={styles.employeeNameTitle}>{empName}</Text>
                        <Text style={styles.employeeIdLabel}>{empId}</Text>
                        <Text style={styles.employeeRoleLabel}>{profile?.role || 'Site Engineer - Operations'}</Text>
                    </View>
                </View>

                <View style={styles.workSiteWhiteInformationCardBox}>
                    <View style={styles.fileIconBadgeContainerSpace}><Ionicons name="document-text-outline" size={18} color="#0B6655" /></View>
                    <View style={styles.workSiteDetailsTextContent}>
                        <Text style={styles.workSiteLabelHeader}>Work site</Text>
                        <Text style={styles.workSiteRealNameTitle}>{profile?.workSite || 'Al Olaya Operations Centre - Asia/Riyadh (UTC+3)'}</Text>
                    </View>
                </View>

                <Text style={styles.settingsSectionHeaderLabel}>SETTINGS</Text>

                <View style={styles.settingsGroupListOuterWhiteCardFrame}>
                    
                    <TouchableOpacity style={styles.settingsRowContainerItemLink} onPress={onNavigateToChangePassword}>
                        <View style={styles.innerRowLeftBlockRow}><View style={styles.innerRowIconCircleBadge}><Ionicons name="key-outline" size={18} color="#0B6655" /></View><Text style={styles.settingsRowMainLabelText}>Change password</Text></View>
                        <Ionicons name="chevron-forward" size={16} color="#98A2B3" />
                    </TouchableOpacity>

                    <View style={styles.settingsRowContainerItemLink}>
                        <View style={styles.innerRowLeftBlockRow}><View style={styles.innerRowIconCircleBadge}><Ionicons name="finger-print-outline" size={18} color="#0B6655" /></View><View><Text style={styles.settingsRowMainLabelText}>Fingerprint / Face login</Text><Text style={styles.settingsRowSubDescriptionLabelText}>Only on this phone</Text></View></View>
                        <Switch 
                            trackColor={{ false: '#E4E7EC', true: '#0B6655' }} 
                            thumbColor={Platform.OS === 'android' ? '#FFFFFF' : ''} 
                            value={isFingerprintEnabled} 
                            onValueChange={handleBiometricToggle} 
                        />
                    </View>

                    <View style={styles.settingsRowContainerItemLink}>
                        <View style={styles.innerRowLeftBlockRow}><View style={styles.innerRowIconCircleBadge}><Ionicons name="time-outline" size={18} color="#0B6655" /></View><View><Text style={styles.settingsRowMainLabelText}>Hourly Presence</Text><Text style={styles.settingsRowSubDescriptionLabelText}>Every 60 min while checked in</Text></View></View>
                        <Switch 
                            trackColor={{ false: '#E4E7EC', true: '#0B6655' }} 
                            thumbColor={Platform.OS === 'android' ? '#FFFFFF' : ''} 
                            value={isHourlyEnabled} 
                            onValueChange={(val) => { 
                                setIsHourlyEnabled(val); 
                                updatePreferenceSetting('isHourlyEnabled', val); 
                            }} 
                        />
                    </View>

                    <TouchableOpacity style={styles.settingsRowContainerItemLink} onPress={() => setIsLanguageSheetVisible(true)}>
                        <View style={styles.innerRowLeftBlockRow}><View style={styles.innerRowIconCircleBadge}><Ionicons name="globe-outline" size={18} color="#0B6655" /></View><View><Text style={styles.settingsRowMainLabelText}>Language</Text><Text style={styles.settingsRowSubDescriptionLabelText}>{selectedLanguage}</Text></View></View>
                        <Ionicons name="chevron-forward" size={16} color="#98A2B3" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.settingsRowContainerItemLink} onPress={onNavigateToPrivacy}>
                        <View style={styles.innerRowLeftBlockRow}><View style={styles.innerRowIconCircleBadge}><Ionicons name="shield-checkmark-outline" size={18} color="#0B6655" /></View><View><Text style={styles.settingsRowMainLabelText}>Privacy & location consent</Text><Text style={styles.settingsRowSubDescriptionLabelText}>Accepted {profile?.consentDate || '22 Sep 2026'} · {profile?.consentVersion || 'v1.0'}</Text></View></View>
                        <Ionicons name="chevron-forward" size={16} color="#98A2B3" />
                    </TouchableOpacity>

                    <View style={styles.settingsRowContainerItemLink}>
                        <View style={styles.innerRowLeftBlockRow}><View style={styles.innerRowIconCircleBadge}><Ionicons name="phone-portrait-outline" size={18} color="#0B6655" /></View><View><Text style={styles.settingsRowMainLabelText}>Server address</Text><Text style={styles.settingsRowSubDescriptionLabelText}>{serverAddress}</Text></View></View>
                        <Ionicons name="lock-closed" size={14} color="#98A2B3" style={{ marginRight: 4 }} />
                    </View>

                    <View style={[styles.settingsRowContainerItemLink, { borderBottomWidth: 0 }]}>
                        <View style={styles.innerRowLeftBlockRow}><View style={styles.innerRowIconCircleBadge}><Ionicons name="information-circle-outline" size={18} color="#0B6655" /></View><View><Text style={styles.settingsRowMainLabelText}>App version</Text><Text style={styles.settingsRowSubDescriptionLabelText}>1.1.0 (214) - Dev</Text></View></View>
                    </View>

                </View>

                <TouchableOpacity style={styles.signOutButtonOutlineBoxCard} onPress={onSignOut}>
                    <Ionicons name="log-out-outline" size={18} color="#B42318" style={{ marginRight: 8 }} />
                    <Text style={styles.signOutButtonOutlineBoxCardText}>Sign out</Text>
                </TouchableOpacity>

            </ScrollView>

            <Modal animationType="slide" transparent={true} visible={isLanguageSheetVisible} onRequestClose={() => setIsLanguageSheetVisible(false)}>
                <TouchableOpacity style={styles.modalOverlayDismissBackground} activeOpacity={1} onPress={() => setIsLanguageSheetVisible(false)}>
                    <View style={styles.bottomSheetFilterWindowContainer}>
                        <View style={styles.bottomSheetHeaderCenterIndicatorLineBar} />
                        <Text style={styles.bottomSheetMainHeadingTitleText}>Language</Text>
                        
                        <TouchableOpacity style={styles.languageSelectionListItemRow} onPress={() => { setSelectedLanguage('English'); setIsLanguageSheetVisible(false); updatePreferenceSetting('language', 'English'); }}>
                            <Text style={[styles.languageOptionNameText, selectedLanguage === 'English' && { color: '#0B6655' }]}>English</Text>
                            {selectedLanguage === 'English' && <Ionicons name="checkmark" size={18} color="#0B6655" />}
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.languageSelectionListItemRow} onPress={() => { setSelectedLanguage('العربية'); setIsLanguageSheetVisible(false); updatePreferenceSetting('language', 'العربية'); }}>
                            <Text style={[styles.languageOptionNameText, selectedLanguage === 'العربية' && { color: '#0B6655' }]}>العربية</Text>
                            {selectedLanguage === 'العربية' && <Ionicons name="checkmark" size={18} color="#0B6655" />}
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.languageSelectionListItemRow, { borderBottomWidth: 0 }]} onPress={() => { setSelectedLanguage('Français'); setIsLanguageSheetVisible(false); updatePreferenceSetting('language', 'Français'); }}>
                            <Text style={[styles.languageOptionNameText, selectedLanguage === 'Français' && { color: '#0B6655' }]}>Français</Text>
                            {selectedLanguage === 'Français' && <Ionicons name="checkmark" size={18} color="#0B6655" />}
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>

            <View style={styles.bottomTabStickyNavBarContainer}>
                <TouchableOpacity style={styles.tabBarItemActionLink} onPress={onNavigateHome}><Ionicons name="home" size={22} color="#98A2B3" /><Text style={styles.tabBarItemLabelText}>Home</Text></TouchableOpacity>
                <TouchableOpacity style={styles.tabBarItemActionLink} onPress={onNavigateToAttendance}><Ionicons name="calendar" size={22} color="#98A2B3" /><Text style={styles.tabBarItemLabelText}>Attendance</Text></TouchableOpacity>
                <TouchableOpacity style={styles.tabBarItemActionLink} onPress={onNavigateToLeave}><Ionicons name="document-text" size={22} color="#98A2B3" /><Text style={styles.tabBarItemLabelText}>Leave</Text></TouchableOpacity>
                <TouchableOpacity style={styles.tabBarItemActionLink} onPress={onNavigateToProfile}><Ionicons name="person" size={22} color="#0B6655" /><Text style={[styles.tabBarItemLabelText, { color: '#0B6655' }]}>Profile</Text></TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    mainWrapper: { flex: 1, backgroundColor: '#F9FAFB' },
    navTopHeaderBar: { height: 40, backgroundColor: '#FFFFFF', borderBottomWidth: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
    headerBackArrowLink: { width: 28 },
    headerRightBoxSpace: { width: 28 },
    scrollContentLayout: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 110 },
    profileDetailsIdentityCard: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 22, padding: 18, width: '100%', borderWidth: 1, borderColor: '#EEF0F2', shadowColor: '#101828', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 10, elevation: 2 },
    avatarInitialCircleBadge: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#0B6655', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
    avatarInitialText: { color: '#FFFFFF', fontSize: 20, fontWeight: '700' },
    profileDetailsContentBlock: { flex: 1, justifyContent: 'center' },
    employeeNameTitle: { fontSize: 19, fontWeight: '700', color: '#101828' },
    employeeIdLabel: { fontSize: 13, color: '#475467', marginTop: 2, fontWeight: '600' },
    employeeRoleLabel: { fontSize: 12, color: '#98A2B3', marginTop: 3, fontWeight: '500' },
    workSiteWhiteInformationCardBox: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, width: '100%', borderWidth: 1, borderColor: '#EEF0F2', marginTop: 12, alignItems: 'center' },
    fileIconBadgeContainerSpace: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#F0F9F8', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    workSiteDetailsTextContent: { flex: 1 },
    workSiteLabelHeader: { fontSize: 11, color: '#667085', fontWeight: '500' },
    workSiteRealNameTitle: { fontSize: 13, fontWeight: '600', color: '#344054', lineHeight: 18 },
    settingsSectionHeaderLabel: { fontSize: 11, fontWeight: '700', color: '#667085', letterSpacing: 0.5, marginTop: 22, marginBottom: 8, paddingLeft: 4 },
    settingsGroupListOuterWhiteCardFrame: { backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#EEF0F2', width: '100%', overflow: 'hidden' },
    settingsRowContainerItemLink: { flexDirection: 'row', padding: 14, alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderColor: '#F2F4F7' },
    innerRowLeftBlockRow: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    innerRowIconCircleBadge: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#F0F9F8', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    settingsRowMainLabelText: { fontSize: 14, fontWeight: '700', color: '#101828' },
    settingsRowSubDescriptionLabelText: { fontSize: 12, color: '#667085', marginTop: 2, fontWeight: '500' },
    signOutButtonOutlineBoxCard: { flexDirection: 'row', borderColor: '#D0D5DD', borderWidth: 1, borderRadius: 12, height: 48, width: '100%', justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF', marginTop: 16 },
    signOutButtonOutlineBoxCardText: { color: '#B42318', fontSize: 14, fontWeight: '700' },
    bottomTabStickyNavBarContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 68, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderColor: '#EAECF0', flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingBottom: 10, zIndex: 100 },
    tabBarItemActionLink: { flex: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'column' },
    tabBarItemLabelText: { fontSize: 11, color: '#98A2B3', marginTop: 4, fontWeight: '600', textAlign: 'center' },
    modalOverlayDismissBackground: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    bottomSheetFilterWindowContainer: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 34, width: '100%' },
    bottomSheetHeaderCenterIndicatorLineBar: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#EAECF0', alignSelf: 'center', marginBottom: 16 },
    bottomSheetMainHeadingTitleText: { fontSize: 16, fontWeight: '700', color: '#101828', marginBottom: 10 },
    languageSelectionListItemRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1, borderColor: '#F2F4F7' },
    languageOptionNameText: { fontSize: 14, fontWeight: '600', color: '#344054' }
});