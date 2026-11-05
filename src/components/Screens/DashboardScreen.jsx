import React, { useState, useEffect, useRef } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    ScrollView,
    Dimensions,
    StatusBar,
    Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { translations, getGlobalLang, subscribeLang, setGlobalLang } from '../../../i18n';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

let globalDashboardCache = {
    state: 'default',
    totalHours: '00h 00m',
    lastCheckIn: '--:--',
    lastCheckOut: '--:--'
};

let hasToastBeenShown = false;

export default function DashboardScreen({
    userProfileData,
    serverAddress,
    justCheckedIn = false,
    onNavigateToCheckIn,
    onNavigateToCheckOut,
    onNavigateToHourly,
    onNavigateToAttendance,
    onNavigateToLeave,
    onNavigateToMyLeaveRequests,
    onNavigateToProfile,
    onNavigateHome
}) {
    const [currentLang, setCurrentScreenLang] = useState(getGlobalLang());
    const [isLangModalVisible, setIsLangModalVisible] = useState(false);

    const [dashboardState, setDashboardState] = useState(globalDashboardCache.state);
    const [totalHours, setTotalHours] = useState(globalDashboardCache.totalHours);
    const [lastCheckIn, setLastCheckIn] = useState(globalDashboardCache.lastCheckIn);
    const [lastCheckOut, setLastCheckOut] = useState(globalDashboardCache.lastCheckOut);
    
    const [showToast, setShowToast] = useState(justCheckedIn && !hasToastBeenShown);

    const [leaveAlertModal, setLeaveAlertModal] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [alertStatus, setAlertStatus] = useState('');

    const isMounted = useRef(true);
    const isFetchingStatus = useRef(false);

    useEffect(() => {
        const unsubscribe = subscribeLang((newLang) => {
            setCurrentScreenLang(newLang);
        });
        return () => unsubscribe();
    }, []);

    const t = translations[currentLang] || translations.en;
    const isRtl = currentLang === 'ur' || currentLang === 'ar';

    const empId = userProfileData?.employeeId || 'EMP-10482';
    const empName = userProfileData?.name || 'Muhammad Ali';

    const nameInitials = empName !== 'Loading Account...'
        ? empName.split(' ').filter(Boolean).map(n => n[0]).join('').substring(0, 2).toUpperCase()
        : 'MA';

    const isCheckedIn = dashboardState === 'checked_in';

    const getFormattedTodayDate = () => {
        const localeMap = { en: 'en-US', ur: 'ur-PK', ar: 'ar-SA' };
        const selectedLocale = localeMap[currentLang] || 'en-US';
        const now = new Date();

        return now.toLocaleDateString(selectedLocale, {
            weekday: 'short',
            day: 'numeric',
            month: 'short'
        });
    };

    const fetchLiveStatus = async () => {
        if (isFetchingStatus.current) return;
        isFetchingStatus.current = true;

        try {
            const cleanBaseUrl = (serverAddress || 'http://192.168.100.199:8081').replace(/\/+$/, '');
            const url = `${cleanBaseUrl}/api/attendance/status?employeeId=${encodeURIComponent(empId)}`;

            const response = await fetch(url);
            const responseText = await response.text();

            let json;
            try { json = JSON.parse(responseText); } catch { return; }

            if (!response.ok || !json.success || !isMounted.current) return;

            const newState = json.state || 'checked_out';

            globalDashboardCache = {
                state: newState,
                totalHours: json.totalHours || '00h 00m',
                lastCheckIn: json.lastCheckIn || '--:--',
                lastCheckOut: json.lastCheckOut || '--:--'
            };

            setDashboardState(newState);
            if (json.totalHours) setTotalHours(json.totalHours);
            if (json.lastCheckIn) setLastCheckIn(json.lastCheckIn);
            if (json.lastCheckOut) setLastCheckOut(json.lastCheckOut);

        } catch (err) {
            console.log("Error loading status:", err);
        } finally {
            isFetchingStatus.current = false;
        }
    };

    const checkAdminLeaveActions = async () => {
        try {
            const cleanBaseUrl = (serverAddress || 'http://192.168.100.199:8081').replace(/\/+$/, '');
            const res = await fetch(`${cleanBaseUrl}/api/leave/requests?employeeId=${encodeURIComponent(empId)}`);
            const json = await res.json();

            const requestsList = json.requests || json.requestsHistory || [];
            
            const handledLeave = requestsList.find(req => {
                const status = (req.status || '').toLowerCase();
                return status === 'approved' || status === 'rejected';
            });

            if (handledLeave) {
                const leaveId = handledLeave._id || handledLeave.id;
                const statusLower = (handledLeave.status || '').toLowerCase();
                const isApproved = statusLower === 'approved';

                if (globalThis.lastNotifiedLeaveId !== leaveId) {
                    globalThis.lastNotifiedLeaveId = leaveId;

                    setAlertStatus(isApproved ? 'approved' : 'rejected');
                    setAlertMessage(
                        isApproved 
                            ? `Aapki ${handledLeave.type || handledLeave.leaveType || 'leave'} request approve ho gayi hai!`
                            : `Aapki ${handledLeave.type || handledLeave.leaveType || 'leave'} request reject kar di gayi hai.`
                    );
                    setLeaveAlertModal(true);

                    setTimeout(() => {
                        if (isMounted.current) {
                            setLeaveAlertModal(false);
                        }
                    }, 3500);
                }
            }
        } catch (err) {
            console.log("Error checking leave status:", err);
        }
    };

    useEffect(() => {
        isMounted.current = true;

        fetchLiveStatus();
        checkAdminLeaveActions();

        if (justCheckedIn && !hasToastBeenShown) {
            hasToastBeenShown = true;
            setShowToast(true);
            const timer = setTimeout(() => {
                if (isMounted.current) setShowToast(false);
            }, 3000);
            return () => clearTimeout(timer);
        }

        return () => {
            isMounted.current = false;
        };
    }, [empId, serverAddress, justCheckedIn]);

    const handleLanguageChange = (langCode) => {
        setGlobalLang(langCode);
        setIsLangModalVisible(false);
    };

    return (
        <View style={[styles.mainWrapper, { direction: isRtl ? 'rtl' : 'ltr' }]}>
            <StatusBar barStyle="light-content" backgroundColor="#0B6655" translucent={false} />

            {showToast && (
                <View style={[styles.toastContainer, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
                    <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" style={{ [isRtl ? 'marginLeft' : 'marginRight']: 8 }} />
                    <Text style={styles.toastText}>{t.toastCheckInSuccess}</Text>
                </View>
            )}

            <ScrollView contentContainerStyle={styles.scrollContainer} scrollEnabled={false} bounces={false}>

                <View style={styles.topHeaderBackground}>
                    <TouchableOpacity
                        style={styles.languageSelectionFloatingIconBtn}
                        onPress={() => setIsLangModalVisible(true)}
                    >
                        <Ionicons name="globe-outline" size={24} color="#FFFFFF" />
                    </TouchableOpacity>

                    <View style={[styles.profileWhiteCardFloating, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
                        <View style={[styles.avatarInitialCircleBadge, isRtl ? { marginLeft: 0, marginRight: 14 } : { marginRight: 14 }]}>
                            <Text style={styles.avatarInitialText}>{nameInitials}</Text>
                        </View>
                        <View style={[styles.profileDetailsContentBlock, { alignItems: isRtl ? 'flex-end' : 'flex-start' }]}>
                            <Text style={styles.employeeNameTitle}>{t.hello || 'Hello'}, {empName}</Text>
                            <Text style={styles.employeeIdLabel}>{empId}</Text>
                            <Text style={[styles.employeeRoleLabel, { textAlign: isRtl ? 'right' : 'left' }]}>{t.siteEngineerRole}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.spacerPaddingBlock} />

                <View style={[styles.statusGridRowContainer, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
                    <View style={[styles.statusMiniDataCardBox, { alignItems: isRtl ? 'flex-end' : 'flex-start' }]}>
                        <Text style={styles.cardSectionLabel}>{t.todayStatus}</Text>
                        {(!dashboardState || dashboardState === 'default' || dashboardState === 'checked_out') && <Text style={[styles.statusMainValueText, { color: '#D92D20' }]}>{t.statusCheckedOut}</Text>}
                        {dashboardState === 'checked_in' && <Text style={[styles.statusMainValueText, { color: '#0B6655' }]}>{t.statusCheckedIn}</Text>}
                        {dashboardState === 'on_leave' && <Text style={[styles.statusMainValueText, { color: '#175CD3' }]}>{t.statusOnLeave}</Text>}
                        {dashboardState === 'weekly_off' && <Text style={[styles.statusMainValueText, { color: '#344054' }]}>{t.statusWeeklyOff}</Text>}
                        <Text style={styles.cardFooterSubtext}>{getFormattedTodayDate()}</Text>
                    </View>

                    <View style={[styles.statusMiniDataCardBox, { alignItems: isRtl ? 'flex-end' : 'flex-start' }]}>
                        <Text style={styles.cardSectionLabel}>{t.totalHoursLabel}</Text>
                        <Text style={styles.statusMainValueText}>{totalHours}</Text>
                        <Text style={styles.cardFooterSubtext}>{t.timeToday}</Text>
                    </View>
                </View>

                <View style={[styles.statusGridRowContainer, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
                    <View style={[styles.statusMiniDataCardBox, { alignItems: isRtl ? 'flex-end' : 'flex-start' }]}>
                        <Text style={styles.cardSectionLabel}>{t.lastCheckInLabel}</Text>
                        <Text style={styles.statusMainValueText}>{lastCheckIn}</Text>
                        <Text style={styles.cardFooterSubtext}>{dashboardState === 'checked_in' ? t.timeToday : t.timeYesterday}</Text>
                    </View>

                    <View style={[styles.statusMiniDataCardBox, { alignItems: isRtl ? 'flex-end' : 'flex-start' }]}>
                        <Text style={styles.cardSectionLabel}>{t.lastCheckOutLabel}</Text>
                        <Text style={styles.statusMainValueText}>{lastCheckOut}</Text>
                        <Text style={styles.cardFooterSubtext}>{t.timeYesterday}</Text>
                    </View>
                </View>

                <View style={styles.navigationGridPanelSection}>
                    <View style={[styles.gridActionInteractiveButtonsRow, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
                        <TouchableOpacity
                            style={[styles.squareActionButtonCard, isCheckedIn && styles.disabledActionBtnState]}
                            disabled={isCheckedIn}
                            onPress={onNavigateToCheckIn}
                            activeOpacity={isCheckedIn ? 1 : 0.7}
                        >
                            <View style={[styles.actionIconCircleBadge, { backgroundColor: isCheckedIn ? '#F2F4F7' : '#E6F4F1' }]}>
                                <Ionicons name="location" size={24} color={isCheckedIn ? '#98A2B3' : '#0B6655'} />
                            </View>
                            <Text style={[styles.actionBtnLabelText, isCheckedIn && { color: '#98A2B3' }]}>{t.navCheckIn}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.squareActionButtonCard, !isCheckedIn && styles.disabledActionBtnState]}
                            disabled={!isCheckedIn}
                            onPress={onNavigateToCheckOut}
                            activeOpacity={!isCheckedIn ? 1 : 0.7}
                        >
                            <View style={[styles.actionIconCircleBadge, { backgroundColor: !isCheckedIn ? '#F2F4F7' : '#FEF3F2' }]}>
                                <Ionicons name="log-out" size={24} color={!isCheckedIn ? '#98A2B3' : '#D92D20'} />
                            </View>
                            <Text style={[styles.actionBtnLabelText, !isCheckedIn && { color: '#98A2B3' }]}>{t.navCheckOut}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.squareActionButtonCard} onPress={onNavigateToHourly}>
                            <View style={[styles.actionIconCircleBadge, { backgroundColor: '#F4F5F7' }]}><Ionicons name="time" size={24} color="#475467" /></View>
                            <Text style={styles.actionBtnLabelText}>{t.navHourly}</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={[styles.gridActionInteractiveButtonsRow, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
                        <TouchableOpacity style={styles.squareActionButtonCard} onPress={onNavigateToAttendance}>
                            <View style={[styles.actionIconCircleBadge, { backgroundColor: '#EFF8FF' }]}><Ionicons name="calendar-outline" size={24} color="#175CD3" /></View>
                            <Text style={styles.actionBtnLabelText}>{t.navAttendance}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.squareActionButtonCard} onPress={onNavigateToLeave}>
                            <View style={[styles.actionIconCircleBadge, { backgroundColor: '#FDF2FA' }]}><Ionicons name="document-text" size={24} color="#C11574" /></View>
                            <Text style={styles.actionBtnLabelText}>{t.navLeaveReq}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.squareActionButtonCard} onPress={onNavigateToMyLeaveRequests}>
                            <View style={[styles.actionIconCircleBadge, { backgroundColor: '#F0F9FF' }]}><Ionicons name="list" size={24} color="#026AA2" /></View>
                            <Text style={styles.actionBtnLabelText}>{t.navMyReq}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>

            <Modal animationType="fade" transparent={true} visible={isLangModalVisible} onRequestClose={() => setIsLangModalVisible(false)}>
                <TouchableOpacity style={styles.modalOverlayDismissBackground} activeOpacity={1} onPress={() => setIsLangModalVisible(false)}>
                    <View style={styles.modalLanguageCardContainer}>
                        <Text style={styles.modalLanguageCardHeadingTitle}>{t.selectLangTitle || "Select Language"}</Text>
                        <TouchableOpacity style={[styles.langSelectRowOption, currentLang === 'en' && styles.activeLangOptionHighlight]} onPress={() => handleLanguageChange('en')}><Text style={styles.langSelectRowOptionText}>English</Text></TouchableOpacity>
                        <TouchableOpacity style={[styles.langSelectRowOption, currentLang === 'ur' && styles.activeLangOptionHighlight]} onPress={() => handleLanguageChange('ur')}><Text style={styles.langSelectRowOptionText}>اردو (Urdu)</Text></TouchableOpacity>
                        <TouchableOpacity style={[styles.langSelectRowOption, currentLang === 'ar' && styles.activeLangOptionHighlight]} onPress={() => handleLanguageChange('ar')}><Text style={styles.langSelectRowOptionText}>العربية (Arabic)</Text></TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>

            <Modal animationType="fade" transparent={true} visible={leaveAlertModal}>
                <View style={styles.modalOverlayBlack}>
                    <View style={styles.alertCardContent}>
                        <View style={[styles.alertIconFrame, { backgroundColor: alertStatus === 'approved' ? '#ECFDF3' : '#FEF3F2' }]}>
                            <Ionicons name={alertStatus === 'approved' ? 'checkmark-circle' : 'close-circle'} size={32} color={alertStatus === 'approved' ? '#027A48' : '#B42318'} />
                        </View>
                        <Text style={styles.alertTitleText}>{alertStatus === 'approved' ? t.leaveApprovedTitle : t.leaveRejectedTitle}</Text>
                        <Text style={styles.alertBodyText}>{alertMessage}</Text>
                    </View>
                </View>
            </Modal>

            <View style={[styles.bottomTabStickyNavBarContainer, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
                <TouchableOpacity style={styles.tabBarItemActionLink} onPress={onNavigateHome}><Ionicons name="home" size={22} color="#0B6655" /><Text style={[styles.tabBarItemLabelText, { color: '#0B6655' }]}>{t.navHome}</Text></TouchableOpacity>
                <TouchableOpacity style={styles.tabBarItemActionLink} onPress={onNavigateToAttendance}><Ionicons name="calendar" size={22} color="#98A2B3" /><Text style={styles.tabBarItemLabelText}>{t.navAttendance}</Text></TouchableOpacity>
                <TouchableOpacity style={styles.tabBarItemActionLink} onPress={onNavigateToLeave}><Ionicons name="document-text" size={22} color="#98A2B3" /><Text style={styles.tabBarItemLabelText}>{t.navLeave}</Text></TouchableOpacity>
                <TouchableOpacity style={styles.tabBarItemActionLink} onPress={onNavigateToProfile}><Ionicons name="person" size={22} color="#98A2B3" /><Text style={styles.tabBarItemLabelText}>{t.navProfile}</Text></TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    mainWrapper: { flex: 1, backgroundColor: '#F9FAFB' },
    toastContainer: { position: 'absolute', top: 50, left: 20, right: 20, backgroundColor: '#0B6655', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', zIndex: 999, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 10 },
    toastText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
    scrollContainer: { height: SCREEN_HEIGHT, justifyContent: 'flex-start' },
    topHeaderBackground: { backgroundColor: '#0B6655', paddingTop: 16, paddingBottom: 68, paddingHorizontal: 16, borderBottomLeftRadius: 36, borderBottomRightRadius: 36, alignItems: 'flex-end', position: 'relative', width: '100%' },
    languageSelectionFloatingIconBtn: { padding: 6, marginRight: -4, marginBottom: 10 },
    profileWhiteCardFloating: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 22, padding: 22, width: '100%', shadowColor: '#101828', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.1, shadowRadius: 16, elevation: 6, position: 'absolute', bottom: -42, left: 16, zIndex: 10 },
    avatarInitialCircleBadge: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#0B6655', justifyContent: 'center', alignItems: 'center' },
    avatarInitialText: { color: '#FFFFFF', fontSize: 20, fontWeight: '700' },
    profileDetailsContentBlock: { flex: 1, justifyContent: 'center' },
    employeeNameTitle: { fontSize: 19, fontWeight: '700', color: '#101828' },
    employeeIdLabel: { fontSize: 13, color: '#475467', marginTop: 2, fontWeight: '600' },
    employeeRoleLabel: { fontSize: 12, color: '#98A2B3', marginTop: 3, fontWeight: '500' },
    spacerPaddingBlock: { height: 52 },
    statusGridRowContainer: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, marginTop: 14 },
    statusMiniDataCardBox: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16, marginHorizontal: 5, borderWidth: 1, borderColor: '#EEF0F2' },
    cardSectionLabel: { fontSize: 12, color: '#667085', fontWeight: '500' },
    statusMainValueText: { fontSize: 17, fontWeight: '700', color: '#101828', marginTop: 4 },
    cardFooterSubtext: { fontSize: 11, color: '#98A2B3', marginTop: 4 },
    navigationGridPanelSection: { paddingHorizontal: 16, marginTop: 22, flex: 1, justifyContent: 'flex-start' },
    gridActionInteractiveButtonsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
    squareActionButtonCard: { width: '31%', backgroundColor: '#FFFFFF', borderRadius: 18, padding: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#EEF0F2', height: 104, shadowColor: '#101828', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.02, shadowRadius: 6 },
    disabledActionBtnState: { opacity: 0.35, backgroundColor: '#F9FAFB' },
    actionIconCircleBadge: { width: 46, height: 46, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
    actionBtnLabelText: { fontSize: 12, fontWeight: '600', color: '#344054', textAlign: 'center' },
    bottomTabStickyNavBarContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 68, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderColor: '#EAECF0', flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingBottom: 10, zIndex: 100 },
    tabBarItemActionLink: { flex: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'column' },
    tabBarItemLabelText: { fontSize: 11, color: '#98A2B3', marginTop: 4, fontWeight: '600', textAlign: 'center' },
    modalOverlayDismissBackground: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
    modalLanguageCardContainer: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, width: '80%', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
    modalLanguageCardHeadingTitle: { fontSize: 16, fontWeight: '700', color: '#101828', marginBottom: 16, textAlign: 'center' },
    langSelectRowOption: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 8, marginBottom: 8, backgroundColor: '#F9FAFB' },
    activeLangOptionHighlight: { backgroundColor: '#E6F4F1', borderWidth: 1, borderColor: '#0B6655' },
    langSelectRowOptionText: { fontSize: 14, fontWeight: '600', color: '#344054', textAlign: 'center' },
    modalOverlayBlack: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.75)', justifyContent: 'center', alignItems: 'center', padding: 24 },
    alertCardContent: { width: '100%', maxWidth: 320, backgroundColor: '#1A332C', borderRadius: 20, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: '#2C4A42', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
    alertIconFrame: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
    alertTitleText: { fontSize: 18, fontWeight: '800', color: '#FFFFFF', textAlign: 'center', marginBottom: 8 },
    alertBodyText: { fontSize: 13, color: '#C8DDD7', textAlign: 'center', lineHeight: 18 }
});