import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    ScrollView,
    Dimensions,
    TextInput,
    Switch,
    Modal,
    ActivityIndicator,
    Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';

import EmployeeNotificationsScreen from './EmployeeNotificationsScreen'; // 🟢 New Screen Imported

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const LEAVE_TYPES_LIST = [
    { id: 'annual', name: 'Annual Leave', sub: '13 of 21 days left · half day allowed', color: '#0B6655' },
    { id: 'sick', name: 'Sick Leave', sub: '29 of 30 days left', color: '#175CD3' },
    { id: 'emergency', name: 'Emergency Leave', sub: '4 of 5 days left · half day allowed', color: '#B24E00' },
    { id: 'hajj', name: 'Hajj Leave', sub: '10 of 10 days left', color: '#027A48' },
];

export default function LeaveRequestScreen({
    onBack,
    employeeId = 'EMP-10482',
    serverAddress = 'http://192.168.100.199:8081',
    hasEntitlement = true,
    onNavigateHome,
    onNavigateToAttendance,
    onNavigateToLeave,
    onNavigateToProfile
}) {
    const [activeTab, setActiveTab] = useState('apply'); // 'apply', 'balance'
    const [leaveType, setLeaveType] = useState('');
    const [leaveTypeName, setLeaveTypeName] = useState('Select leave type');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [isHalfDay, setIsHalfDay] = useState(false);
    const [reasonText, setReasonText] = useState('');
    const [errorMessage, setErrorMessage] = useState(null);
    const [loadingBalance, setLoadingBalance] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Navigation View State ('main' or 'notifications')
    const [currentView, setCurrentView] = useState('main');

    // Dynamic Balances State from Backend
    const [leaveBalances, setLeaveBalances] = useState({
        annual: { total: 21, taken: 0, pending: 0, remaining: 21 },
        sick: { total: 30, taken: 0, pending: 0, remaining: 30 },
        emergency: { total: 5, taken: 0, pending: 0, remaining: 5 },
        hajj: { total: 10, taken: 0, pending: 0, remaining: 10 },
    });

    // Real-time User Notifications & Unread Badge State
    const [userNotifications, setUserNotifications] = useState([]);
    const [hasUnreadNotifs, setHasUnreadNotifs] = useState(true);

    // Sheet & Attachment States
    const [isTypeSheetVisible, setIsTypeSheetVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [attachedFile, setAttachedFile] = useState(null);
    const [errors, setErrors] = useState({ type: false, from: false, to: false });

    useEffect(() => {
        fetchLeaveData();
    }, [activeTab, employeeId]);

    const fetchLeaveData = async () => {
        try {
            setLoadingBalance(true);
            const cleanBaseUrl = serverAddress.replace(/\/+$/, '');

            const resBalance = await fetch(`${cleanBaseUrl}/api/leave/balance?employeeId=${encodeURIComponent(employeeId)}`);
            const jsonBalance = await resBalance.json();
            if (jsonBalance.success && jsonBalance.balances) {
                setLeaveBalances(jsonBalance.balances);
            }

            const resReqs = await fetch(`${cleanBaseUrl}/api/leave/requests?employeeId=${encodeURIComponent(employeeId)}`);
            const jsonReqs = await resReqs.json();
            if (jsonReqs.success && jsonReqs.requests) {
                setUserNotifications(jsonReqs.requests);
            }
        } catch (err) {
            console.log("Error fetching leave data:", err);
        } finally {
            setLoadingBalance(false);
        }
    };

    const calculateTotalDays = () => {
        if (!fromDate || !toDate) return 0;
        if (isHalfDay) return 0.5;
        try {
            const start = new Date(fromDate);
            const end = new Date(toDate);
            const diffTime = Math.abs(end - start);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
            return isNaN(diffDays) ? 0 : diffDays;
        } catch (e) { return 0; }
    };

    const totalDaysCalculated = calculateTotalDays();

    const launchMobileCamera = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            alert('🔒 Camera Permission Required: Please turn on camera access inside your device settings.');
            return;
        }
        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ['images'],
            quality: 0.8,
        });
        if (!result.canceled && result.assets && result.assets.length > 0) {
            const fileUri = result.assets[0].uri;
            const fileName = fileUri.split('/').pop();
            setAttachedFile({ name: fileName, size: 'Approx 1.2 MB', uri: fileUri });
        }
    };

    const pickMobileDocument = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['application/pdf', 'image/*'],
                copyToCacheDirectory: true
            });
            if (!result.canceled && result.assets && result.assets.length > 0) {
                const file = result.assets[0];
                const sizeInKb = file.size ? `${(file.size / 1024).toFixed(0)} KB` : '842 KB';
                setAttachedFile({ name: file.name, size: sizeInKb, uri: file.uri });
            }
        } catch (err) {
            console.log("Document retrieval exception handled.");
        }
    };

    const handleFormSubmit = async () => {
        setErrors({ type: false, from: false, to: false });
        setErrorMessage(null);
        let hasIssues = false;
        let newErrors = { type: false, from: false, to: false };

        if (!leaveType) { newErrors.type = true; hasIssues = true; }
        if (!fromDate) { newErrors.from = true; hasIssues = true; }
        if (!toDate) { newErrors.to = true; hasIssues = true; }

        if (hasIssues) { setErrors(newErrors); return; }

        try {
            setSubmitting(true);
            const cleanBaseUrl = serverAddress.replace(/\/+$/, '');
            const response = await fetch(`${cleanBaseUrl}/api/leave/apply`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    employeeId,
                    leaveType,
                    leaveTypeName,
                    fromDate,
                    toDate,
                    isHalfDay,
                    totalDays: totalDaysCalculated,
                    reason: reasonText,
                    attachedFile
                })
            });

            const json = await response.json();
            if (json.success) {
                alert("✅ Leave request submitted successfully & sent to Admin Portal!");
                setReasonText('');
                setFromDate('');
                setToDate('');
                setLeaveType('');
                setLeaveTypeName('Select leave type');
                setAttachedFile(null);
                fetchLeaveData();
                if (onBack) onBack();
            } else {
                setErrorMessage(json.message || 'Failed to submit leave request.');
            }
        } catch (err) {
            console.log("Error submitting leave:", err);
            setErrorMessage("Network error. Please check server connection.");
        } finally {
            setSubmitting(false);
        }
    };

    const filteredLeaveTypes = LEAVE_TYPES_LIST.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const updatedNotifications = (userNotifications || []).filter(n => n.status && n.status.toLowerCase() !== 'pending');

    // 🟢 Render separate Notifications Screen if toggled
    if (currentView === 'notifications') {
        return (
            <EmployeeNotificationsScreen
                notifications={updatedNotifications}
                onBack={() => setCurrentView('main')}
                currentEmployeeId={employeeId}
            />
        );
    }

    return (
        <View style={styles.mainWrapper}>
            {/* Top Navigation Bar with Bell Button & Unread Badge Counter */}
            <View style={styles.navTopHeaderBar}>
                <TouchableOpacity onPress={onBack} style={styles.headerBackArrowLink}>
                    <Ionicons name="chevron-back" size={22} color="#344054" />
                </TouchableOpacity>
                <Text style={styles.navBarHeadingCenterTitle}>Leave Request & Status</Text>

                <TouchableOpacity
                    style={styles.bellIconButton}
                    onPress={() => {
                        setHasUnreadNotifs(false); // 🟢 Clears the red badge when opened
                        setCurrentView('notifications'); // 🟢 Opens the new screen
                    }}
                >
                    <Ionicons name="notifications-outline" size={21} color="#0B6655" />
                    {hasUnreadNotifs && updatedNotifications.length > 0 && (
                        <View style={styles.bellBadgeDot}>
                            <Text style={styles.bellBadgeText}>{updatedNotifications.length}</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            <View style={styles.segmentTabSelectorOuterContainer}>
                <View style={styles.segmentTabSelectorInnerWrapperRow}>
                    <TouchableOpacity style={[styles.tabNavigationSelectionButton, activeTab === 'apply' && styles.activeTabOptionStateHighlight]} onPress={() => setActiveTab('apply')}>
                        <Text style={[styles.tabNavigationSelectionButtonText, activeTab === 'apply' && styles.activeTabOptionStateText]}>Apply Leave</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.tabNavigationSelectionButton, activeTab === 'balance' && styles.activeTabOptionStateHighlight]} onPress={() => setActiveTab('balance')}>
                        <Text style={[styles.tabNavigationSelectionButtonText, activeTab === 'balance' && styles.activeTabOptionStateText]}>Leave Balance</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContentLayoutContainer} showsVerticalScrollIndicator={false}>

                {errorMessage && (
                    <View style={styles.errorAlertInlineBanner}>
                        <Text style={styles.errorAlertInlineBannerText}>{errorMessage}</Text>
                    </View>
                )}

                {activeTab === 'apply' ? (
                    <View style={styles.formContainerMatrix}>
                        <Text style={styles.inputFieldSectionHeaderLabel}>Leave type <Text style={{ color: '#D92D20' }}>*</Text></Text>
                        <TouchableOpacity style={[styles.dropdownSelectTriggerButtonField, errors.type && styles.inputFieldErrorOutlineColor]} onPress={() => setIsTypeSheetVisible(true)}>
                            <Ionicons name="document-text-outline" size={18} color="#667085" style={{ marginRight: 10 }} />
                            <Text style={[styles.dropdownSelectTriggerTextValue, !leaveType && { color: '#98A2B3' }]}>{leaveTypeName}</Text>
                            <Ionicons name="chevron-down" size={16} color="#667085" />
                        </TouchableOpacity>
                        {errors.type && <Text style={styles.fieldErrorMessageDisclaimerText}>⚠ Choose a leave type.</Text>}

                        <View style={styles.doubleInputRowLayoutContainer}>
                            <View style={{ flex: 1, marginRight: 6 }}>
                                <Text style={styles.inputFieldSectionHeaderLabel}>From date <Text style={{ color: '#D92D20' }}>*</Text></Text>
                                <TextInput style={[styles.textInputBoxNodeItem, errors.from && styles.inputFieldErrorOutlineColor]} placeholder="YYYY-MM-DD" placeholderTextColor="#98A2B3" value={fromDate} onChangeText={setFromDate} />
                                {errors.from && <Text style={styles.fieldErrorMessageDisclaimerText}>⚠ Choose a start date.</Text>}
                            </View>
                            <View style={{ flex: 1, marginLeft: 6 }}>
                                <Text style={styles.inputFieldSectionHeaderLabel}>To date <Text style={{ color: '#D92D20' }}>*</Text></Text>
                                <TextInput style={[styles.textInputBoxNodeItem, errors.to && styles.inputFieldErrorOutlineColor]} placeholder="YYYY-MM-DD" placeholderTextColor="#98A2B3" value={toDate} onChangeText={setToDate} />
                                {errors.to && <Text style={styles.fieldErrorMessageDisclaimerText}>⚠ Choose an end date.</Text>}
                            </View>
                        </View>

                        <View style={styles.toggleRowCardBlockContainer}>
                            <View style={styles.toggleCardLeftBlockTextContent}>
                                <Text style={styles.toggleCardLabelTitleText}>Half day</Text>
                                <Text style={styles.toggleCardSubDescriptionLabelText}>{leaveType ? "Only for a one-day request" : "Counts as 0.5 day"}</Text>
                            </View>
                            <Switch trackColor={{ false: '#E4E7EC', true: '#0B6655' }} value={isHalfDay} onValueChange={setIsHalfDay} />
                        </View>

                        <View style={styles.totalDaysCardBoxContainer}>
                            <View style={styles.toggleCardLeftBlockTextContent}>
                                <Text style={styles.toggleCardLabelTitleText}>Total days</Text>
                                <Text style={styles.toggleCardSubDescriptionLabelText}>Calculated by the server · weekly off days excluded</Text>
                            </View>
                            <Text style={styles.totalDaysNumericDisplayValueValue}>{totalDaysCalculated}</Text>
                        </View>

                        <Text style={styles.inputFieldSectionHeaderLabel}>Reason</Text>
                        <View style={styles.textAreaBoxNodeContainer}>
                            <TextInput style={styles.textAreaInputFieldElement} placeholder="Why do you need this leave?" placeholderTextColor="#98A2B3" multiline={true} numberOfLines={4} value={reasonText} onChangeText={setReasonText} maxLength={500} />
                            <Text style={styles.textAreaCharacterCounterMetricLabel}>{reasonText.length}/500</Text>
                        </View>

                        <Text style={styles.inputFieldSectionHeaderLabel}>Attach document <Text style={styles.optionalMutedLabelText}>(optional)</Text></Text>

                        {attachedFile ? (
                            <View style={styles.attachedFileIndicatorRowBox}>
                                <Ionicons name="document-outline" size={18} color="#475467" style={{ marginRight: 10 }} />
                                <Text style={styles.attachedFileIndicatorRowBoxText} numberOfLines={1}>
                                    {attachedFile.name} <Text style={{ color: '#98A2B3', fontWeight: '400' }}>{attachedFile.size}</Text>
                                </Text>
                                <TouchableOpacity onPress={() => setAttachedFile(null)}><Ionicons name="close" size={18} color="#667085" /></TouchableOpacity>
                            </View>
                        ) : (
                            <View style={styles.doubleButtonRowLayoutContainer}>
                                <TouchableOpacity style={styles.mediaPickerSquareActionButton} onPress={launchMobileCamera}>
                                    <Ionicons name="camera-outline" size={18} color="#344054" style={{ marginRight: 8 }} />
                                    <Text style={styles.mediaPickerSquareActionButtonText}>Camera</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.mediaPickerSquareActionButton} onPress={pickMobileDocument}>
                                    <Ionicons name="cloud-upload-outline" size={18} color="#344054" style={{ marginRight: 8 }} />
                                    <Text style={styles.mediaPickerSquareActionButtonText}>Files</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                        <Text style={styles.mediaAttachmentFormatMutedDisclaimerNote}>PDF, JPG or PNG · up to 5 MB</Text>

                        <TouchableOpacity style={styles.primaryActionButtonNodeFixedSubmit} onPress={handleFormSubmit} disabled={submitting}>
                            {submitting ? (
                                <ActivityIndicator color="#FFFFFF" size="small" />
                            ) : (
                                <Text style={styles.primaryActionButtonNodeFixedSubmitTextLabel}>Submit request</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.leaveBalanceGridsListWrapperContainer}>
                        <Text style={styles.leaveYearTimelineHeaderMutedLabel}>Leave year 2026 · 1 Jan – 31 Dec</Text>

                        {loadingBalance ? (
                            <ActivityIndicator size="large" color="#0B6655" style={{ marginTop: 40 }} />
                        ) : (
                            <>
                                <View style={styles.balanceDataFloatingCardContainer}>
                                    <View style={styles.balanceCardHeaderRowLine}>
                                        <Text style={styles.balanceCardMainTitleHeader}>Annual Leave</Text>
                                        <Text style={styles.balanceCardFractionRatioValue}>{leaveBalances.annual.remaining} <Text style={{ color: '#98A2B3', fontWeight: '500' }}>/ {leaveBalances.annual.total}</Text></Text>
                                    </View>
                                    <View style={styles.progressHorizontalTrackBarBackground}>
                                        <View style={[styles.progressHorizontalActiveIndicatorFillerColorBar, { width: `${(leaveBalances.annual.remaining / leaveBalances.annual.total) * 100}%`, backgroundColor: '#0B6655' }]} />
                                    </View>
                                    <View style={styles.balanceCardGridFooterMetricsRow}>
                                        <View><Text style={styles.footerMetricLabel}>Taken</Text><Text style={styles.footerMetricValue}>{leaveBalances.annual.taken}</Text></View>
                                        <View><Text style={styles.footerMetricLabel}>Pending</Text><Text style={[styles.footerMetricValue, { color: '#B24E00' }]}>{leaveBalances.annual.pending}</Text></View>
                                        <View><Text style={styles.footerMetricLabel}>Remaining</Text><Text style={[styles.footerMetricValue, { color: '#027A48' }]}>{leaveBalances.annual.remaining}</Text></View>
                                    </View>
                                </View>

                                <View style={styles.balanceDataFloatingCardContainer}>
                                    <View style={styles.balanceCardHeaderRowLine}>
                                        <Text style={styles.balanceCardMainTitleHeader}>Sick Leave</Text>
                                        <Text style={styles.balanceCardFractionRatioValue}>{leaveBalances.sick.remaining} <Text style={{ color: '#98A2B3', fontWeight: '500' }}>/ {leaveBalances.sick.total}</Text></Text>
                                    </View>
                                    <View style={styles.progressHorizontalTrackBarBackground}>
                                        <View style={[styles.progressHorizontalActiveIndicatorFillerColorBar, { width: `${(leaveBalances.sick.remaining / leaveBalances.sick.total) * 100}%`, backgroundColor: '#175CD3' }]} />
                                    </View>
                                    <View style={styles.balanceCardGridFooterMetricsRow}>
                                        <View><Text style={styles.footerMetricLabel}>Taken</Text><Text style={styles.footerMetricValue}>{leaveBalances.sick.taken}</Text></View>
                                        <View><Text style={styles.footerMetricLabel}>Pending</Text><Text style={styles.footerMetricValue}>{leaveBalances.sick.pending}</Text></View>
                                        <View><Text style={styles.footerMetricLabel}>Remaining</Text><Text style={[styles.footerMetricValue, { color: '#175CD3' }]}>{leaveBalances.sick.remaining}</Text></View>
                                    </View>
                                </View>
                            </>
                        )}
                    </View>
                )}
            </ScrollView>

            {/* Leave Type Selector Bottom Sheet Modal */}
            <Modal animationType="slide" transparent={true} visible={isTypeSheetVisible} onRequestClose={() => setIsTypeSheetVisible(false)}>
                <TouchableOpacity style={styles.modalFilterOverlayDismissBackground} activeOpacity={1} onPress={() => setIsTypeSheetVisible(false)}>
                    <View style={styles.bottomSheetFilterWindowContainer}>
                        <View style={styles.bottomSheetHeaderCenterIndicatorLineBar} />
                        <Text style={styles.bottomSheetMainHeadingTitleText}>Select Leave Type</Text>

                        <View style={styles.searchBarContainerBoxFrame}>
                            <Ionicons name="search-outline" size={16} color="#98A2B3" style={{ marginRight: 8 }} />
                            <TextInput
                                style={styles.searchBarInputElementField}
                                placeholder="Search leave type..."
                                placeholderTextColor="#98A2B3"
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                            />
                        </View>

                        <ScrollView style={{ marginTop: 10, maxHeight: 240 }} showsVerticalScrollIndicator={false}>
                            {filteredLeaveTypes.map((item) => (
                                <TouchableOpacity
                                    key={item.id}
                                    style={styles.leaveTypeSelectionListItemRow}
                                    onPress={() => {
                                        setLeaveType(item.id);
                                        setLeaveTypeName(item.name);
                                        setIsTypeSheetVisible(false);
                                        setSearchQuery('');
                                    }}
                                >
                                    <View style={[styles.colorDotBadgeIndicatorMarker, { backgroundColor: item.color }]} />
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.leaveTypeNameStringHeader}>{item.name}</Text>
                                        <Text style={styles.leaveTypeSubMetricsDescriptionText}>{item.sub}</Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={16} color="#D0D5DD" />
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* Sticky Bottom Navigation Bar */}
            <View style={styles.bottomTabStickyNavBarContainer}>
                <TouchableOpacity style={styles.tabBarItemActionLink} onPress={onNavigateHome}>
                    <Ionicons name="home" size={22} color="#98A2B3" />
                    <Text style={styles.tabBarItemLabelText}>Home</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.tabBarItemActionLink} onPress={onNavigateToAttendance}>
                    <Ionicons name="calendar" size={22} color="#98A2B3" />
                    <Text style={styles.tabBarItemLabelText}>Attendance</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.tabBarItemActionLink} onPress={onNavigateToLeave}>
                    <Ionicons name="document-text" size={22} color="#0B6655" />
                    <Text style={[styles.tabBarItemLabelText, { color: '#0B6655' }]}>Leave</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.tabBarItemActionLink} onPress={onNavigateToProfile}>
                    <Ionicons name="person" size={22} color="#98A2B3" />
                    <Text style={styles.tabBarItemLabelText}>Profile</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    mainWrapper: { flex: 1, backgroundColor: '#F9FAFB' },
    navTopHeaderBar: { height: 56, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderColor: '#EAECF0', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
    headerBackArrowLink: { padding: 4 },
    navBarHeadingCenterTitle: { fontSize: 16, fontWeight: '700', color: '#101828' },
    bellIconButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F2F4F7', justifyContent: 'center', alignItems: 'center', position: 'relative' },
    bellBadgeDot: { position: 'absolute', top: 3, right: 3, backgroundColor: '#B42318', width: 14, height: 14, borderRadius: 7, justifyContent: 'center', alignItems: 'center' },
    bellBadgeText: { color: '#FFF', fontSize: 8, fontWeight: 'bold' },
    segmentTabSelectorOuterContainer: { paddingHorizontal: 16, paddingTop: 14 },
    segmentTabSelectorInnerWrapperRow: { flexDirection: 'row', backgroundColor: '#F2F4F7', borderRadius: 10, padding: 4, width: '100%' },
    tabNavigationSelectionButton: { flex: 1, paddingVertical: 8, alignItems: 'center', justifyContent: 'center', borderRadius: 8 },
    activeTabOptionStateHighlight: { backgroundColor: '#0B6655' },
    tabNavigationSelectionButtonText: { fontSize: 13, fontWeight: '600', color: '#475467' },
    activeTabOptionStateText: { color: '#FFFFFF' },
    scrollContentLayoutContainer: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 100 },
    errorAlertInlineBanner: { backgroundColor: '#FEF3F2', borderColor: '#FECDCA', borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 14, width: '100%' },
    errorAlertInlineBannerText: { color: '#B42318', fontSize: 12, fontWeight: '600', lineHeight: 16 },
    formContainerMatrix: { width: '100%' },
    inputFieldSectionHeaderLabel: { fontSize: 13, fontWeight: '700', color: '#344054', marginBottom: 6, marginTop: 12 },
    optionalMutedLabelText: { color: '#667085', fontWeight: '500' },
    dropdownSelectTriggerButtonField: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D0D5DD', borderRadius: 10, height: 46, alignItems: 'center', paddingHorizontal: 14, justifyContent: 'space-between' },
    dropdownSelectTriggerTextValue: { flex: 1, fontSize: 14, fontWeight: '500', color: '#101828' },
    inputFieldErrorOutlineColor: { borderColor: '#D92D20' },
    fieldErrorMessageDisclaimerText: { color: '#D92D20', fontSize: 11, fontWeight: '600', marginTop: 4, paddingLeft: 2 },
    doubleInputRowLayoutContainer: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: 2 },
    textInputBoxNodeItem: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D0D5DD', borderRadius: 10, height: 46, paddingHorizontal: 14, fontSize: 14, fontWeight: '500', color: '#101828', width: '100%' },
    toggleRowCardBlockContainer: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#EEF0F2', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 },
    toggleCardLeftBlockTextContent: { flex: 1, paddingRight: 10 },
    toggleCardLabelTitleText: { fontSize: 14, fontWeight: '700', color: '#101828' },
    toggleCardSubDescriptionLabelText: { fontSize: 12, color: '#667085', marginTop: 3, fontWeight: '500' },
    totalDaysCardBoxContainer: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#EEF0F2', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
    totalDaysNumericDisplayValueValue: { fontSize: 16, fontWeight: '800', color: '#101828', width: 24, textAlign: 'right' },
    textAreaBoxNodeContainer: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D0D5DD', borderRadius: 12, padding: 12, minHeight: 90 },
    textAreaInputFieldElement: { fontSize: 14, fontWeight: '500', color: '#101828', textAlignVertical: 'top', padding: 0 },
    textAreaCharacterCounterMetricLabel: { fontSize: 11, color: '#98A2B3', textAlign: 'right', marginTop: 6 },
    attachedFileIndicatorRowBox: { flexDirection: 'row', backgroundColor: '#F2F4F7', borderRadius: 10, padding: 12, alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
    attachedFileIndicatorRowBoxText: { flex: 1, fontSize: 13, fontWeight: '600', color: '#344054', marginRight: 8 },
    doubleButtonRowLayoutContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
    mediaPickerSquareActionButton: { flex: 1, flexDirection: 'row', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D0D5DD', borderRadius: 10, height: 44, justifyContent: 'center', alignItems: 'center', marginHorizontal: 4 },
    mediaPickerSquareActionButtonText: { fontSize: 13, fontWeight: '600', color: '#344054' },
    mediaAttachmentFormatMutedDisclaimerNote: { fontSize: 11, color: '#667085', marginTop: 6 },
    primaryActionButtonNodeFixedSubmit: { backgroundColor: '#0B6655', borderRadius: 10, height: 48, justifyContent: 'center', alignItems: 'center', marginTop: 22 },
    primaryActionButtonNodeFixedSubmitTextLabel: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
    leaveBalanceGridsListWrapperContainer: { width: '100%' },
    leaveYearTimelineHeaderMutedLabel: { fontSize: 12, color: '#667085', fontWeight: '500', marginBottom: 12 },
    balanceDataFloatingCardContainer: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#EAECF0' },
    balanceCardHeaderRowLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    balanceCardMainTitleHeader: { fontSize: 14, fontWeight: '700', color: '#101828' },
    balanceCardFractionRatioValue: { fontSize: 14, fontWeight: '700', color: '#0B6655' },
    progressHorizontalTrackBarBackground: { height: 6, backgroundColor: '#F2F4F7', borderRadius: 3, overflow: 'hidden', marginBottom: 12 },
    progressHorizontalActiveIndicatorFillerColorBar: { height: '100%', borderRadius: 3 },
    balanceCardGridFooterMetricsRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#F2F4F7', paddingTop: 8 },
    footerMetricLabel: { fontSize: 11, color: '#667085' },
    footerMetricValue: { fontSize: 13, fontWeight: '700', color: '#101828', marginTop: 2 },
    modalFilterOverlayDismissBackground: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    bottomSheetFilterWindowContainer: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16 },
    bottomSheetHeaderCenterIndicatorLineBar: { width: 36, height: 4, backgroundColor: '#EAECF0', borderRadius: 2, alignSelf: 'center', marginBottom: 12 },
    bottomSheetMainHeadingTitleText: { fontSize: 16, fontWeight: '700', color: '#101828', marginBottom: 12 },
    searchBarContainerBoxFrame: { flexDirection: 'row', backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#D0D5DD', borderRadius: 10, paddingHorizontal: 10, height: 40, alignItems: 'center' },
    searchBarInputElementField: { flex: 1, fontSize: 13, color: '#101828' },
    leaveTypeSelectionListItemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F2F4F7' },
    colorDotBadgeIndicatorMarker: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
    leaveTypeNameStringHeader: { fontSize: 14, fontWeight: '700', color: '#101828' },
    leaveTypeSubMetricsDescriptionText: { fontSize: 11, color: '#667085', marginTop: 2 },
    bottomTabStickyNavBarContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 60, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#EAECF0', flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
    tabBarItemActionLink: { alignItems: 'center', justifyContent: 'center' },
    tabBarItemLabelText: { fontSize: 10, color: '#98A2B3', marginTop: 2, fontWeight: '500' }
});