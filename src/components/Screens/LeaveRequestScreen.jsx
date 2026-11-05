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
import { translations, getGlobalLang, subscribeLang } from '../../../i18n';

import EmployeeNotificationsScreen from './EmployeeNotificationsScreen';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

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
    const [currentLang, setCurrentLang] = useState(getGlobalLang());
    const [activeTab, setActiveTab] = useState('apply'); // 'apply', 'balance'
    const [leaveType, setLeaveType] = useState('');
    const [leaveTypeName, setLeaveTypeName] = useState('');
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
        const unsubscribe = subscribeLang((newLang) => {
            setCurrentLang(newLang);
        });
        return () => unsubscribe();
    }, []);

    const t = translations[currentLang];
    const isRtl = currentLang === 'ur' || currentLang === 'ar';

    const LEAVE_TYPES_LIST = [
        { id: 'annual', name: t.annualLeaveName, sub: t.annualLeaveSub, color: '#0B6655' },
        { id: 'sick', name: t.sickLeaveName, sub: t.sickLeaveSub, color: '#175CD3' },
        { id: 'emergency', name: t.emergencyLeaveName, sub: t.emergencyLeaveSub, color: '#B24E00' },
        { id: 'hajj', name: t.hajjLeaveName, sub: t.hajjLeaveSub, color: '#027A48' },
    ];

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
                    leaveTypeName: leaveTypeName || t.selectLeaveTypePlaceholder,
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
                setLeaveTypeName('');
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
        <View style={[styles.mainWrapper, { direction: isRtl ? 'rtl' : 'ltr' }]}>
            {/* Top Navigation Bar with Bell Button & Unread Badge Counter */}
            <View style={[styles.navTopHeaderBar, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
                <TouchableOpacity onPress={onBack} style={styles.headerBackArrowLink}>
                    <Ionicons name={isRtl ? "chevron-forward" : "chevron-back"} size={22} color="#344054" />
                </TouchableOpacity>
                <Text style={styles.navBarHeadingCenterTitle}>{t.leaveReqTitle}</Text>

                <TouchableOpacity
                    style={styles.bellIconButton}
                    onPress={() => {
                        setHasUnreadNotifs(false);
                        setCurrentView('notifications');
                    }}
                >
                    <Ionicons name="notifications-outline" size={21} color="#0B6655" />
                    {hasUnreadNotifs && updatedNotifications.length > 0 && (
                        <View style={[styles.bellBadgeDot, isRtl ? { left: 3, right: 'auto' } : { right: 3, left: 'auto' }]}>
                            <Text style={styles.bellBadgeText}>{updatedNotifications.length}</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            <View style={styles.segmentTabSelectorOuterContainer}>
                <View style={[styles.segmentTabSelectorInnerWrapperRow, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
                    <TouchableOpacity style={[styles.tabNavigationSelectionButton, activeTab === 'apply' && styles.activeTabOptionStateHighlight]} onPress={() => setActiveTab('apply')}>
                        <Text style={[styles.tabNavigationSelectionButtonText, activeTab === 'apply' && styles.activeTabOptionStateText]}>{t.applyLeaveTab}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.tabNavigationSelectionButton, activeTab === 'balance' && styles.activeTabOptionStateHighlight]} onPress={() => setActiveTab('balance')}>
                        <Text style={[styles.tabNavigationSelectionButtonText, activeTab === 'balance' && styles.activeTabOptionStateText]}>{t.leaveBalanceTab}</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContentLayoutContainer} showsVerticalScrollIndicator={false}>

                {errorMessage && (
                    <View style={styles.errorAlertInlineBanner}>
                        <Text style={[styles.errorAlertInlineBannerText, { textAlign: isRtl ? 'right' : 'left' }]}>{errorMessage}</Text>
                    </View>
                )}

                {activeTab === 'apply' ? (
                    <View style={styles.formContainerMatrix}>
                        <Text style={[styles.inputFieldSectionHeaderLabel, { textAlign: isRtl ? 'right' : 'left' }]}>{t.leaveTypeLabel} <Text style={{ color: '#D92D20' }}>*</Text></Text>
                        <TouchableOpacity style={[styles.dropdownSelectTriggerButtonField, { flexDirection: isRtl ? 'row-reverse' : 'row' }, errors.type && styles.inputFieldErrorOutlineColor]} onPress={() => setIsTypeSheetVisible(true)}>
                            <Ionicons name="document-text-outline" size={18} color="#667085" style={{ [isRtl ? 'marginLeft' : 'marginRight']: 10, [isRtl ? 'marginRight' : 'marginLeft']: 0 }} />
                            <Text style={[styles.dropdownSelectTriggerTextValue, { textAlign: isRtl ? 'right' : 'left' }, !leaveType && { color: '#98A2B3' }]}>{leaveTypeName || t.selectLeaveTypePlaceholder}</Text>
                            <Ionicons name="chevron-down" size={16} color="#667085" />
                        </TouchableOpacity>
                        {errors.type && <Text style={[styles.fieldErrorMessageDisclaimerText, { textAlign: isRtl ? 'right' : 'left' }]}>{t.chooseLeaveTypeError}</Text>}

                        <View style={[styles.doubleInputRowLayoutContainer, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
                            <View style={{ flex: 1, [isRtl ? 'marginLeft' : 'marginRight']: 6 }}>
                                <Text style={[styles.inputFieldSectionHeaderLabel, { textAlign: isRtl ? 'right' : 'left' }]}>{t.fromDateLabel} <Text style={{ color: '#D92D20' }}>*</Text></Text>
                                <TextInput style={[styles.textInputBoxNodeItem, { textAlign: isRtl ? 'right' : 'left' }, errors.from && styles.inputFieldErrorOutlineColor]} placeholder="YYYY-MM-DD" placeholderTextColor="#98A2B3" value={fromDate} onChangeText={setFromDate} />
                                {errors.from && <Text style={[styles.fieldErrorMessageDisclaimerText, { textAlign: isRtl ? 'right' : 'left' }]}>{t.chooseFromDateError}</Text>}
                            </View>
                            <View style={{ flex: 1, [isRtl ? 'marginRight' : 'marginLeft']: 6 }}>
                                <Text style={[styles.inputFieldSectionHeaderLabel, { textAlign: isRtl ? 'right' : 'left' }]}>{t.toDateLabel} <Text style={{ color: '#D92D20' }}>*</Text></Text>
                                <TextInput style={[styles.textInputBoxNodeItem, { textAlign: isRtl ? 'right' : 'left' }, errors.to && styles.inputFieldErrorOutlineColor]} placeholder="YYYY-MM-DD" placeholderTextColor="#98A2B3" value={toDate} onChangeText={setToDate} />
                                {errors.to && <Text style={[styles.fieldErrorMessageDisclaimerText, { textAlign: isRtl ? 'right' : 'left' }]}>{t.chooseToDateError}</Text>}
                            </View>
                        </View>

                        <View style={[styles.toggleRowCardBlockContainer, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
                            <View style={[styles.toggleCardLeftBlockTextContent, { alignItems: isRtl ? 'flex-end' : 'flex-start' }]}>
                                <Text style={styles.toggleCardLabelTitleText}>{t.halfDayLabel}</Text>
                                <Text style={styles.toggleCardSubDescriptionLabelText}>{leaveType ? t.halfDaySubSingle : t.halfDaySubGeneral}</Text>
                            </View>
                            <Switch trackColor={{ false: '#E4E7EC', true: '#0B6655' }} value={isHalfDay} onValueChange={setIsHalfDay} />
                        </View>

                        <View style={[styles.totalDaysCardBoxContainer, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
                            <View style={[styles.toggleCardLeftBlockTextContent, { alignItems: isRtl ? 'flex-end' : 'flex-start' }]}>
                                <Text style={styles.toggleCardLabelTitleText}>{t.totalDaysLabel}</Text>
                                <Text style={styles.toggleCardSubDescriptionLabelText}>{t.totalDaysSub}</Text>
                            </View>
                            <Text style={styles.totalDaysNumericDisplayValueValue}>{totalDaysCalculated}</Text>
                        </View>

                        <Text style={[styles.inputFieldSectionHeaderLabel, { textAlign: isRtl ? 'right' : 'left' }]}>{t.reasonLabel}</Text>
                        <View style={styles.textAreaBoxNodeContainer}>
                            <TextInput style={[styles.textAreaInputFieldElement, { textAlign: isRtl ? 'right' : 'left' }]} placeholder={t.reasonPlaceholder} placeholderTextColor="#98A2B3" multiline={true} numberOfLines={4} value={reasonText} onChangeText={setReasonText} maxLength={500} />
                            <Text style={[styles.textAreaCharacterCounterMetricLabel, { textAlign: isRtl ? 'left' : 'right' }]}>{reasonText.length}/500</Text>
                        </View>

                        <Text style={[styles.inputFieldSectionHeaderLabel, { textAlign: isRtl ? 'right' : 'left' }]}>{t.attachDocLabel} <Text style={styles.optionalMutedLabelText}>{t.optionalLabel}</Text></Text>

                        {attachedFile ? (
                            <View style={[styles.attachedFileIndicatorRowBox, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
                                <Ionicons name="document-outline" size={18} color="#475467" style={{ [isRtl ? 'marginLeft' : 'marginRight']: 10, [isRtl ? 'marginRight' : 'marginLeft']: 0 }} />
                                <Text style={[styles.attachedFileIndicatorRowBoxText, { textAlign: isRtl ? 'right' : 'left' }]} numberOfLines={1}>
                                    {attachedFile.name} <Text style={{ color: '#98A2B3', fontWeight: '400' }}>{attachedFile.size}</Text>
                                </Text>
                                <TouchableOpacity onPress={() => setAttachedFile(null)}><Ionicons name="close" size={18} color="#667085" /></TouchableOpacity>
                            </View>
                        ) : (
                            <View style={[styles.doubleButtonRowLayoutContainer, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
                                <TouchableOpacity style={[styles.mediaPickerSquareActionButton, { flexDirection: isRtl ? 'row-reverse' : 'row' }]} onPress={launchMobileCamera}>
                                    <Ionicons name="camera-outline" size={18} color="#344054" style={{ [isRtl ? 'marginLeft' : 'marginRight']: 8, [isRtl ? 'marginRight' : 'marginLeft']: 0 }} />
                                    <Text style={styles.mediaPickerSquareActionButtonText}>{t.cameraBtn}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.mediaPickerSquareActionButton, { flexDirection: isRtl ? 'row-reverse' : 'row' }]} onPress={pickMobileDocument}>
                                    <Ionicons name="cloud-upload-outline" size={18} color="#344054" style={{ [isRtl ? 'marginLeft' : 'marginRight']: 8, [isRtl ? 'marginRight' : 'marginLeft']: 0 }} />
                                    <Text style={styles.mediaPickerSquareActionButtonText}>{t.filesBtn}</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                        <Text style={[styles.mediaAttachmentFormatMutedDisclaimerNote, { textAlign: isRtl ? 'right' : 'left' }]}>{t.docFormatNote}</Text>

                        <TouchableOpacity style={styles.primaryActionButtonNodeFixedSubmit} onPress={handleFormSubmit} disabled={submitting}>
                            {submitting ? (
                                <ActivityIndicator color="#FFFFFF" size="small" />
                            ) : (
                                <Text style={styles.primaryActionButtonNodeFixedSubmitTextLabel}>{t.submitReqBtn}</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.leaveBalanceGridsListWrapperContainer}>
                        <Text style={[styles.leaveYearTimelineHeaderMutedLabel, { textAlign: isRtl ? 'right' : 'left' }]}>{t.leaveYearHeader}</Text>

                        {loadingBalance ? (
                            <ActivityIndicator size="large" color="#0B6655" style={{ marginTop: 40 }} />
                        ) : (
                            <>
                                <View style={styles.balanceDataFloatingCardContainer}>
                                    <View style={[styles.balanceCardHeaderRowLine, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
                                        <Text style={styles.balanceCardMainTitleHeader}>{t.annualLeaveName}</Text>
                                        <Text style={styles.balanceCardFractionRatioValue}>{leaveBalances.annual.remaining} <Text style={{ color: '#98A2B3', fontWeight: '500' }}>/ {leaveBalances.annual.total}</Text></Text>
                                    </View>
                                    <View style={styles.progressHorizontalTrackBarBackground}>
                                        <View style={[styles.progressHorizontalActiveIndicatorFillerColorBar, { width: `${(leaveBalances.annual.remaining / leaveBalances.annual.total) * 100}%`, backgroundColor: '#0B6655', [isRtl ? 'right' : 'left']: 0 }]} />
                                    </View>
                                    <View style={[styles.balanceCardGridFooterMetricsRow, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
                                        <View style={{ alignItems: isRtl ? 'flex-end' : 'flex-start' }}><Text style={styles.footerMetricLabel}>{t.takenLabel}</Text><Text style={styles.footerMetricValue}>{leaveBalances.annual.taken}</Text></View>
                                        <View style={{ alignItems: isRtl ? 'flex-end' : 'flex-start' }}><Text style={styles.footerMetricLabel}>{t.pendingLabel}</Text><Text style={[styles.footerMetricValue, { color: '#B24E00' }]}>{leaveBalances.annual.pending}</Text></View>
                                        <View style={{ alignItems: isRtl ? 'flex-end' : 'flex-start' }}><Text style={styles.footerMetricLabel}>{t.leftLabel}</Text><Text style={[styles.footerMetricValue, { color: '#027A48' }]}>{leaveBalances.annual.remaining}</Text></View>
                                    </View>
                                </View>

                                <View style={styles.balanceDataFloatingCardContainer}>
                                    <View style={[styles.balanceCardHeaderRowLine, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
                                        <Text style={styles.balanceCardMainTitleHeader}>{t.sickLeaveName}</Text>
                                        <Text style={styles.balanceCardFractionRatioValue}>{leaveBalances.sick.remaining} <Text style={{ color: '#98A2B3', fontWeight: '500' }}>/ {leaveBalances.sick.total}</Text></Text>
                                    </View>
                                    <View style={styles.progressHorizontalTrackBarBackground}>
                                        <View style={[styles.progressHorizontalActiveIndicatorFillerColorBar, { width: `${(leaveBalances.sick.remaining / leaveBalances.sick.total) * 100}%`, backgroundColor: '#175CD3', [isRtl ? 'right' : 'left']: 0 }]} />
                                    </View>
                                    <View style={[styles.balanceCardGridFooterMetricsRow, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
                                        <View style={{ alignItems: isRtl ? 'flex-end' : 'flex-start' }}><Text style={styles.footerMetricLabel}>{t.takenLabel}</Text><Text style={styles.footerMetricValue}>{leaveBalances.sick.taken}</Text></View>
                                        <View style={{ alignItems: isRtl ? 'flex-end' : 'flex-start' }}><Text style={styles.footerMetricLabel}>{t.pendingLabel}</Text><Text style={styles.footerMetricValue}>{leaveBalances.sick.pending}</Text></View>
                                        <View style={{ alignItems: isRtl ? 'flex-end' : 'flex-start' }}><Text style={styles.footerMetricLabel}>{t.leftLabel}</Text><Text style={[styles.footerMetricValue, { color: '#175CD3' }]}>{leaveBalances.sick.remaining}</Text></View>
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
                        <Text style={styles.bottomSheetMainHeadingTitleText}>{t.selectLeaveTypeModalTitle}</Text>

                        <View style={[styles.searchBarContainerBoxFrame, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
                            <Ionicons name="search-outline" size={16} color="#98A2B3" style={{ [isRtl ? 'marginLeft' : 'marginRight']: 8, [isRtl ? 'marginRight' : 'marginLeft']: 0 }} />
                            <TextInput
                                style={[styles.searchBarInputElementField, { textAlign: isRtl ? 'right' : 'left' }]}
                                placeholder={t.searchLeaveTypePlaceholder}
                                placeholderTextColor="#98A2B3"
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                            />
                        </View>

                        <ScrollView style={{ marginTop: 10, maxHeight: 240 }} showsVerticalScrollIndicator={false}>
                            {filteredLeaveTypes.map((item) => (
                                <TouchableOpacity
                                    key={item.id}
                                    style={[styles.leaveTypeSelectionListItemRow, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}
                                    onPress={() => {
                                        setLeaveType(item.id);
                                        setLeaveTypeName(item.name);
                                        setIsTypeSheetVisible(false);
                                        setSearchQuery('');
                                    }}
                                >
                                    <View style={[styles.colorDotBadgeIndicatorMarker, { backgroundColor: item.color, [isRtl ? 'marginLeft' : 'marginRight']: 12, [isRtl ? 'marginRight' : 'marginLeft']: 0 }]} />
                                    <View style={{ flex: 1, alignItems: isRtl ? 'flex-end' : 'flex-start' }}>
                                        <Text style={styles.leaveTypeNameStringHeader}>{item.name}</Text>
                                        <Text style={styles.leaveTypeSubMetricsDescriptionText}>{item.sub}</Text>
                                    </View>
                                    <Ionicons name={isRtl ? "chevron-back" : "chevron-forward"} size={16} color="#D0D5DD" />
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* Sticky Bottom Navigation Bar */}
            <View style={[styles.bottomTabStickyNavBarContainer, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
                <TouchableOpacity style={styles.tabBarItemActionLink} onPress={onNavigateHome}>
                    <Ionicons name="home" size={22} color="#98A2B3" />
                    <Text style={styles.tabBarItemLabelText}>{t.navHome}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.tabBarItemActionLink} onPress={onNavigateToAttendance}>
                    <Ionicons name="calendar" size={22} color="#98A2B3" />
                    <Text style={styles.tabBarItemLabelText}>{t.navAttendance}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.tabBarItemActionLink} onPress={onNavigateToLeave}>
                    <Ionicons name="document-text" size={22} color="#0B6655" />
                    <Text style={[styles.tabBarItemLabelText, { color: '#0B6655' }]}>{t.navLeave}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.tabBarItemActionLink} onPress={onNavigateToProfile}>
                    <Ionicons name="person" size={22} color="#98A2B3" />
                    <Text style={styles.tabBarItemLabelText}>{t.navProfile}</Text>
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
    bellBadgeDot: { position: 'absolute', top: 3, backgroundColor: '#B42318', width: 14, height: 14, borderRadius: 7, justifyContent: 'center', alignItems: 'center' },
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
    textAreaCharacterCounterMetricLabel: { fontSize: 11, color: '#98A2B3', marginTop: 6 },
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
    progressHorizontalTrackBarBackground: { height: 6, backgroundColor: '#F2F4F7', borderRadius: 3, overflow: 'hidden', marginBottom: 12, position: 'relative' },
    progressHorizontalActiveIndicatorFillerColorBar: { height: '100%', borderRadius: 3, position: 'absolute' },
    balanceCardGridFooterMetricsRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#F2F4F7', paddingTop: 8 },
    footerMetricLabel: { fontSize: 11, color: '#667085' },
    footerMetricValue: { fontSize: 13, fontWeight: '700', color: '#101828', marginTop: 2 },
    modalFilterOverlayDismissBackground: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    bottomSheetFilterWindowContainer: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 30 },
    bottomSheetHeaderCenterIndicatorLineBar: { width: 36, height: 4, backgroundColor: '#EAECF0', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
    bottomSheetMainHeadingTitleText: { fontSize: 16, fontWeight: '700', color: '#101828', marginBottom: 12, textAlign: 'center' },
    searchBarContainerBoxFrame: { flexDirection: 'row', backgroundColor: '#F2F4F7', borderRadius: 10, height: 40, alignItems: 'center', paddingHorizontal: 12, marginBottom: 10 },
    searchBarInputElementField: { flex: 1, fontSize: 13, color: '#101828' },
    leaveTypeSelectionListItemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F2F4F7' },
    colorDotBadgeIndicatorMarker: { width: 10, height: 10, borderRadius: 5 },
    leaveTypeNameStringHeader: { fontSize: 14, fontWeight: '600', color: '#101828' },
    leaveTypeSubMetricsDescriptionText: { fontSize: 12, color: '#667085', marginTop: 2 },
    bottomTabStickyNavBarContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 68, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderColor: '#EAECF0', flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingBottom: 10, zIndex: 100 },
    tabBarItemActionLink: { flex: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'column' },
    tabBarItemLabelText: { fontSize: 11, color: '#98A2B3', marginTop: 4, fontWeight: '600', textAlign: 'center' }
});