import React, { useState, useEffect, useRef } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    ScrollView,
    Dimensions,
    Modal,
    ActivityIndicator,
    Animated,
    Easing
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { translations, getGlobalLang, subscribeLang } from '../../../i18n';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function AttendanceScreen({
    onBack,
    employeeId = 'EMP-10482',
    serverAddress = 'http://192.168.100.199:8081',
    userCity = 'Multan',
    onNavigateHome,
    onNavigateToAttendance,
    onNavigateToLeave,
    onNavigateToProfile
}) {
    const [currentLang, setCurrentLang] = useState(getGlobalLang());
    const [activeTab, setActiveTab] = useState('daily');
    const [monthOffset, setMonthOffset] = useState(0); 
    const [isFilterVisible, setIsFilterVisible] = useState(false);
    const [selectedFilters, setSelectedFilters] = useState([]);

    const [allLogs, setAllLogs] = useState([]);
    const [displayLogs, setDisplayLogs] = useState([]);
    const [todaySessions, setTodaySessions] = useState([]);
    const [liveElapsedTime, setLiveElapsedTime] = useState({ formatted: '00h 00m', percentage: 0 });
    const [loading, setLoading] = useState(true);

    const [monthlyStats, setMonthlyStats] = useState({
        present: 0, absent: 0, halfDay: 0, workingDays: 0, totalHours: '00h 00m'
    });

    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        const unsubscribe = subscribeLang((newLang) => {
            setCurrentLang(newLang);
        });
        return () => unsubscribe();
    }, []);

    const t = translations[currentLang];
    const isRtl = currentLang === 'ur' || currentLang === 'ar';

    const FILTER_TYPES = [
        { id: 'Present', label: t.present, bg: '#ECFDF3', txt: '#027A48' },
        { id: 'Absent', label: t.absent, bg: '#FEE4E2', txt: '#B42318' },
        { id: 'Half day', label: t.halfDay, bg: '#FFFAEB', txt: '#B24E00' },
        { id: 'Weekly off', label: t.weeklyOff, bg: '#F2F4F7', txt: '#344054' },
    ];

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.35,
                    duration: 900,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 900,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                })
            ])
        ).start();
    }, [pulseAnim]);

    const cleanCityName = userCity.replace(/\s+Town|\s+Gulshan/gi, '').trim();

    useEffect(() => {
        fetchAttendanceLogs();
    }, [employeeId, serverAddress]);

    useEffect(() => {
        const interval = setInterval(() => {
            if (todaySessions && todaySessions.length > 0) {
                calculateLiveShiftMetrics(todaySessions);
            }
        }, 10000);
        return () => clearInterval(interval);
    }, [todaySessions]);

    const fetchAttendanceLogs = async () => {
        try {
            const cleanBaseUrl = serverAddress.replace(/\/+$/, '');
            const response = await fetch(`${cleanBaseUrl}/api/attendance/logs?employeeId=${encodeURIComponent(employeeId)}`);
            const json = await response.json();

            if (json.success) {
                const logsData = json.logs || [];
                setAllLogs(logsData);
                if (json.stats) setMonthlyStats(json.stats);

                const todayStr = new Date().toDateString();
                const todayLog = logsData.find(l => new Date(l.rawDate || l.date).toDateString() === todayStr);

                if (todayLog && todayLog.sessions) {
                    setTodaySessions(todayLog.sessions);
                    calculateLiveShiftMetrics(todayLog.sessions);
                } else {
                    setTodaySessions([]);
                    setLiveElapsedTime({ formatted: '00h 00m', percentage: 0 });
                }
            }
        } catch (err) {
            console.log("Error querying attendance logs:", err);
        } finally {
            setLoading(false);
        }
    };

    const calculateLiveShiftMetrics = (sessions) => {
        let totalMinutesWorked = 0;
        const now = new Date();

        sessions.forEach(session => {
            if (session.checkInTime) {
                const [inH, inM] = session.checkInTime.split(':').map(Number);
                let sessionMins = 0;
                if (session.checkOutTime) {
                    const [outH, outM] = session.checkOutTime.split(':').map(Number);
                    sessionMins = (outH * 60 + outM) - (inH * 60 + inM);
                } else {
                    sessionMins = (now.getHours() * 60 + now.getMinutes()) - (inH * 60 + inM);
                }
                if (sessionMins < 0) sessionMins = 0;
                totalMinutesWorked += sessionMins;
            }
        });

        const hrs = Math.floor(totalMinutesWorked / 60);
        const mins = totalMinutesWorked % 60;
        const formatted = `${hrs.toString().padStart(2, '0')}h ${mins.toString().padStart(2, '0')}m`;
        const targetMins = 8 * 60;
        const percentage = Math.min(100, Math.round((totalMinutesWorked / targetMins) * 100));

        setLiveElapsedTime({ formatted, percentage });
    };

    const hasPreviousMonthData = allLogs.some(log => {
        const logDate = new Date(log.rawDate || log.date);
        const now = new Date();
        return logDate < new Date(now.getFullYear(), now.getMonth(), 1);
    });

    const handleMonthChange = (direction) => {
        if (direction === 'next' && monthOffset < 0) {
            setMonthOffset(monthOffset + 1);
        } else if (direction === 'prev' && monthOffset > -1 && hasPreviousMonthData) {
            setMonthOffset(monthOffset - 1);
        }
    };

    const getHeaderDateTitle = () => {
        const localeMap = { en: 'en-US', ur: 'ur-PK', ar: 'ar-SA' };
        const selLocale = localeMap[currentLang] || 'en-US';
        const d = new Date();
        if (activeTab === 'monthly') {
            d.setMonth(d.getMonth() + monthOffset);
            return d.toLocaleDateString(selLocale, { month: 'short', year: 'numeric' });
        } else if (activeTab === 'weekly') {
            d.setDate(d.getDate() + (monthOffset * 7));
            const day = d.getDay();
            const diffToMon = d.getDate() - day + (day === 0 ? -6 : 1);
            const monday = new Date(d.setDate(diffToMon));
            const sunday = new Date(monday);
            sunday.setDate(monday.getDate() + 6);
            return `${monday.getDate()} ${monday.toLocaleDateString(selLocale, { month: 'short' })} – ${sunday.getDate()} ${sunday.toLocaleDateString(selLocale, { month: 'short' })}`;
        } else {
            d.setDate(d.getDate() + monthOffset);
            return d.toLocaleDateString(selLocale, { weekday: 'short', day: 'numeric', month: 'short' });
        }
    };

    useEffect(() => {
        const now = new Date();
        let targetList = [];

        if (activeTab === 'monthly') {
            const targetDate = new Date();
            targetDate.setMonth(targetDate.getMonth() + monthOffset);
            const targetMonth = targetDate.getMonth();
            const targetYear = targetDate.getFullYear();

            const daysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
            for (let i = daysInMonth; i >= 1; i--) {
                const loopDate = new Date(targetYear, targetMonth, i);
                if (loopDate <= new Date()) {
                    const dateStringFormatted = loopDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
                    const dayStringFormatted = loopDate.toLocaleDateString('en-US', { weekday: 'short' });
                    const isToday = loopDate.toDateString() === now.toDateString();
                    const isWeekend = loopDate.getDay() === 0 || loopDate.getDay() === 6;

                    const matchedLog = allLogs.find(l => new Date(l.rawDate || l.date).toDateString() === loopDate.toDateString());

                    targetList.push({
                        id: loopDate.toISOString(),
                        date: dateStringFormatted,
                        day: dayStringFormatted,
                        status: isToday ? 'Today' : (matchedLog ? matchedLog.status : (isWeekend ? t.weeklyOff : '—')),
                        hours: matchedLog?.hours || '—',
                        isToday
                    });
                }
            }
        } else if (activeTab === 'weekly') {
            const baseDate = new Date();
            baseDate.setDate(baseDate.getDate() + (monthOffset * 7));
            const day = baseDate.getDay();
            const diffToMon = baseDate.getDate() - day + (day === 0 ? -6 : 1);
            
            for (let i = 6; i >= 0; i--) {
                const loopDate = new Date(baseDate.setDate(diffToMon + i));
                if (loopDate <= new Date()) {
                    const dateStringFormatted = loopDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
                    const dayStringFormatted = loopDate.toLocaleDateString('en-US', { weekday: 'short' });
                    const isToday = loopDate.toDateString() === now.toDateString();
                    const isWeekend = loopDate.getDay() === 0 || loopDate.getDay() === 6;

                    const matchedLog = allLogs.find(l => new Date(l.rawDate || l.date).toDateString() === loopDate.toDateString());

                    targetList.push({
                        id: loopDate.toISOString(),
                        date: dateStringFormatted,
                        day: dayStringFormatted,
                        status: isToday ? 'Today' : (matchedLog ? matchedLog.status : (isWeekend ? t.weeklyOff : '—')),
                        hours: matchedLog?.hours || '—',
                        isToday
                    });
                }
            }
        }

        if (selectedFilters.length > 0) {
            targetList = targetList.filter(item => selectedFilters.includes(item.status));
        }

        setDisplayLogs(targetList);
    }, [allLogs, monthOffset, selectedFilters, activeTab, currentLang]);

    return (
        <View style={[styles.mainWrapper, { direction: isRtl ? 'rtl' : 'ltr' }]}>
            <View style={[styles.navTopHeaderBar, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
                <TouchableOpacity onPress={onBack} style={styles.headerBackArrowLink}>
                    <Ionicons name={isRtl ? "chevron-forward" : "chevron-back"} size={20} color="#344054" />
                </TouchableOpacity>
                <Text style={styles.navBarHeadingCenterTitle}>{t.attendanceScreenTitle}</Text>
                <TouchableOpacity style={styles.headerRightFilterIconButton} onPress={() => setIsFilterVisible(true)}>
                    <Ionicons name="filter-outline" size={20} color="#344054" />
                </TouchableOpacity>
            </View>

            <View style={styles.segmentTabSelectorOuterContainer}>
                <View style={[styles.segmentTabSelectorInnerWrapperRow, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
                    <TouchableOpacity style={[styles.tabNavigationSelectionButton, activeTab === 'daily' && styles.activeTabOptionStateHighlight]} onPress={() => { setActiveTab('daily'); setMonthOffset(0); }}><Text style={[styles.tabNavigationSelectionButtonText, activeTab === 'daily' && styles.activeTabOptionStateText]}>{t.daily}</Text></TouchableOpacity>
                    <TouchableOpacity style={[styles.tabNavigationSelectionButton, activeTab === 'weekly' && styles.activeTabOptionStateHighlight]} onPress={() => { setActiveTab('weekly'); setMonthOffset(0); }}><Text style={[styles.tabNavigationSelectionButtonText, activeTab === 'weekly' && styles.activeTabOptionStateText]}>{t.weekly}</Text></TouchableOpacity>
                    <TouchableOpacity style={[styles.tabNavigationSelectionButton, activeTab === 'monthly' && styles.activeTabOptionStateHighlight]} onPress={() => { setActiveTab('monthly'); setMonthOffset(0); }}><Text style={[styles.tabNavigationSelectionButtonText, activeTab === 'monthly' && styles.activeTabOptionStateText]}>{t.monthly}</Text></TouchableOpacity>
                </View>
            </View>

            <View style={[styles.dateDurationNavigationHeaderStripRow, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
                <TouchableOpacity onPress={() => handleMonthChange(isRtl ? 'next' : 'prev')} disabled={(isRtl ? monthOffset >= 0 : monthOffset <= -1) || !hasPreviousMonthData} style={((isRtl ? monthOffset >= 0 : monthOffset <= -1) || !hasPreviousMonthData) && { opacity: 0.3 }}>
                    <Ionicons name={isRtl ? "chevron-forward" : "chevron-back"} size={16} color="#98A2B3" />
                </TouchableOpacity>
                <Text style={styles.dateDurationHeadingTitleText}>{getHeaderDateTitle()}</Text>
                <TouchableOpacity onPress={() => handleMonthChange(isRtl ? 'prev' : 'next')} disabled={isRtl ? (monthOffset <= -1 || !hasPreviousMonthData) : monthOffset >= 0} style={(isRtl ? (monthOffset <= -1 || !hasPreviousMonthData) : monthOffset >= 0) && { opacity: 0.3 }}>
                    <Ionicons name={isRtl ? "chevron-back" : "chevron-forward"} size={16} color="#98A2B3" />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContentLayoutContainer} showsVerticalScrollIndicator={false}>
                {loading ? (
                    <ActivityIndicator size="large" color="#0B6655" style={{ marginTop: 40 }} />
                ) : (
                    <>
                        {activeTab === 'daily' && (
                            <View style={styles.dailyCoreTrackingWrapperBox}>
                                <View style={styles.shiftProgressBarContainerMatrix}>
                                    <View style={[styles.progressBarHeaderLabelRow, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
                                        <Text style={styles.progressBarMainTitleText}>{t.workingHours}</Text>
                                        <Text style={styles.progressBarValueNumericText}>{liveElapsedTime.formatted}<Text style={styles.progressBarTargetMutedText}> / 08h 00m</Text></Text>
                                    </View>
                                    <View style={styles.progressTrackHorizontalBackgroundLine}>
                                        <View style={[styles.progressActiveFillerIndicatorLine, { width: `${liveElapsedTime.percentage}%`, [isRtl ? 'right' : 'left']: 0 }]} />
                                    </View>
                                </View>

                                {todaySessions.length === 0 ? (
                                    <View style={styles.emptySessionsCardContainer}>
                                        <Ionicons name="location-outline" size={24} color="#667085" />
                                        <Text style={styles.emptySessionsCardText}>{t.noPresenceLogs}</Text>
                                    </View>
                                ) : (
                                    <View style={styles.unifiedSingleSessionCardBoxContainer}>
                                        {todaySessions.map((session, idx) => {
                                            const hasCheckedOut = !!session.checkOutTime;
                                            return (
                                                <View key={session.id || idx}>
                                                    {/* Check-In Row */}
                                                    <View style={[styles.timelineTimelineRowBlockNode, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
                                                        <View style={[styles.vectorVerticalLineTrackColumnAxis, { [isRtl ? 'marginLeft' : 'marginRight']: 12, [isRtl ? 'marginRight' : 'marginLeft']: 0 }]}>
                                                            <View style={styles.vectorStatusMarkerCircleNodeElement}>
                                                                <Animated.View style={[styles.innerGlowingDotGreen, { transform: [{ scale: pulseAnim }] }]} />
                                                            </View>
                                                            <View style={styles.vectorConnectingVerticalTrackBarLine} />
                                                        </View>
                                                        <View style={[styles.sessionDetailsHorizontalContentBlock, { alignItems: isRtl ? 'flex-end' : 'flex-start' }]}>
                                                            <View style={[styles.sessionRowLabelsHeaderLineRow, { flexDirection: isRtl ? 'row-reverse' : 'row', width: '100%' }]}>
                                                                <Text style={styles.sessionPunchStateActionLabelText}>{t.checkIn}</Text>
                                                                <Text style={styles.sessionPunchStateTimeTimestampValue}>{session.checkInTime}</Text>
                                                            </View>
                                                            <Text style={styles.sessionPunchStateSubLocationLabelText}>{cleanCityName} · Mobile App 📱</Text>
                                                        </View>
                                                    </View>

                                                    {/* Check-Out Row */}
                                                    <View style={[styles.timelineTimelineRowBlockNode, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
                                                        <View style={[styles.vectorVerticalLineTrackColumnAxis, { [isRtl ? 'marginLeft' : 'marginRight']: 12, [isRtl ? 'marginRight' : 'marginLeft']: 0 }]}>
                                                            <View style={styles.vectorStatusMarkerCircleNodeElement}>
                                                                {hasCheckedOut ? (
                                                                    <Animated.View style={[styles.innerGlowingDotRed, { transform: [{ scale: pulseAnim }] }]} />
                                                                ) : (
                                                                    <View style={styles.innerDotGray} />
                                                                )}
                                                            </View>
                                                            {idx !== todaySessions.length - 1 && <View style={styles.vectorConnectingVerticalTrackBarLine} />}
                                                        </View>
                                                        <View style={[styles.sessionDetailsHorizontalContentBlock, { paddingBottom: idx === todaySessions.length - 1 ? 4 : 16, alignItems: isRtl ? 'flex-end' : 'flex-start' }]}>
                                                            <View style={[styles.sessionRowLabelsHeaderLineRow, { flexDirection: isRtl ? 'row-reverse' : 'row', width: '100%' }]}>
                                                                <Text style={[styles.sessionPunchStateActionLabelText, !hasCheckedOut && { color: '#98A2B3' }]}>{t.checkOut}</Text>
                                                                <Text style={[styles.sessionPunchStateTimeTimestampValue, !hasCheckedOut && { color: '#98A2B3' }]}>{session.checkOutTime || '-- : --'}</Text>
                                                            </View>
                                                            {hasCheckedOut ? (
                                                                <Text style={styles.sessionPunchStateSubLocationLabelText}>{cleanCityName} · Mobile App</Text>
                                                            ) : null}
                                                        </View>
                                                    </View>
                                                </View>
                                            );
                                        })}
                                    </View>
                                )}
                            </View>
                        )}

                        {activeTab === 'monthly' && (
                            <View style={{ marginBottom: 14 }}>
                                <View style={[styles.statusGridRowContainerGridMatrix, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
                                    <View style={[styles.miniStatsBoxContainer, { alignItems: isRtl ? 'flex-end' : 'flex-start' }]}><Text style={styles.miniStatsBoxHeaderLabel}>{t.present}</Text><Text style={[styles.miniStatsBoxValueLargeMain, { color: '#027A48' }]}>{monthlyStats.present}</Text></View>
                                    <View style={[styles.miniStatsBoxContainer, { alignItems: isRtl ? 'flex-end' : 'flex-start' }]}><Text style={styles.miniStatsBoxHeaderLabel}>{t.absent}</Text><Text style={[styles.miniStatsBoxValueLargeMain, { color: '#B42318' }]}>{monthlyStats.absent}</Text></View>
                                    <View style={[styles.miniStatsBoxContainer, { alignItems: isRtl ? 'flex-end' : 'flex-start' }]}><Text style={styles.miniStatsBoxHeaderLabel}>{t.halfDay}</Text><Text style={[styles.miniStatsBoxValueLargeMain, { color: '#B24E00' }]}>{monthlyStats.halfDay}</Text></View>
                                </View>
                                <View style={[styles.statusGridRowContainerGridMatrix, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
                                    <View style={[styles.miniStatsBoxContainer, { flex: 1.5, alignItems: isRtl ? 'flex-end' : 'flex-start' }]}><Text style={styles.miniStatsBoxHeaderLabel}>{t.workingDays}</Text><Text style={styles.miniStatsBoxValueLargeMain}>{monthlyStats.workingDays}</Text></View>
                                    <View style={[styles.miniStatsBoxContainer, { flex: 1.5, alignItems: isRtl ? 'flex-end' : 'flex-start' }]}><Text style={styles.miniStatsBoxHeaderLabel}>{t.totalHours}</Text><Text style={styles.miniStatsBoxValueLargeMain}>{monthlyStats.totalHours}</Text></View>
                                </View>
                            </View>
                        )}

                        {activeTab !== 'daily' && (
                            <View style={styles.attendanceLogsListMainBlockFrame}>
                                {displayLogs.map((item, idx) => (
                                    <View key={item.id || idx} style={[styles.attendanceLogListItemRowNode, { flexDirection: isRtl ? 'row-reverse' : 'row' }, idx === displayLogs.length - 1 && { borderBottomWidth: 0 }]}>
                                        <View style={[styles.listItemLeftLabelsBlockColumn, { alignItems: isRtl ? 'flex-end' : 'flex-start' }]}>
                                            <Text style={styles.listItemDateStringLabelText}>{item.date}</Text>
                                            <Text style={styles.listItemDayStringLabelText}>{item.day}</Text>
                                        </View>
                                        <View style={[styles.listItemRightBadgesBlockRow, { alignItems: isRtl ? 'flex-start' : 'flex-end' }]}>
                                            <View style={[styles.listItemStatusCapsuleBadge, item.isToday && { backgroundColor: '#E0F2FE' }]}>
                                                <Text style={[styles.listItemStatusCapsuleBadgeText, item.isToday && { color: '#0369A1' }]}>{item.status}</Text>
                                            </View>
                                            <Text style={styles.listItemTotalHoursDurationTextValue}>{item.hours}</Text>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        )}
                    </>
                )}
            </ScrollView>

            <Modal animationType="slide" transparent={true} visible={isFilterVisible} onRequestClose={() => setIsFilterVisible(false)}>
                <TouchableOpacity style={styles.modalFilterOverlayDismissBackground} activeOpacity={1} onPress={() => setIsFilterVisible(false)}>
                    <View style={styles.bottomSheetFilterWindowContainer}>
                        <View style={styles.bottomSheetHeaderCenterIndicatorLineBar} />
                        <Text style={[styles.bottomSheetMainHeadingTitleText, { textAlign: isRtl ? 'right' : 'left' }]}>{t.filter}</Text>
                        <ScrollView style={{ marginTop: 10 }}>
                            {FILTER_TYPES.map(type => (
                                <TouchableOpacity key={type.id} style={[styles.checkboxFilterRowOptionLink, { flexDirection: isRtl ? 'row-reverse' : 'row' }]} onPress={() => {
                                    setSelectedFilters(selectedFilters.includes(type.label) ? selectedFilters.filter(f => f !== type.label) : [...selectedFilters, type.label]);
                                }}>
                                    <View style={[styles.checkboxSquareBoxBorderOutline, { [isRtl ? 'marginLeft' : 'marginRight']: 12, [isRtl ? 'marginRight' : 'marginLeft']: 0 }, selectedFilters.includes(type.label) && styles.checkboxSquareBoxActiveStateColor]} />
                                    <Text style={{ fontSize: 14, color: '#344054', fontWeight: '500' }}>{type.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </TouchableOpacity>
            </Modal>

            <View style={[styles.bottomTabStickyNavBarContainer, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
                <TouchableOpacity style={styles.tabBarItemActionLink} onPress={onNavigateHome}>
                    <Ionicons name="home" size={22} color="#98A2B3" />
                    <Text style={styles.tabBarItemLabelText}>Home</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.tabBarItemActionLink} onPress={onNavigateToAttendance}>
                    <Ionicons name="calendar" size={22} color="#0B6655" />
                    <Text style={[styles.tabBarItemLabelText, { color: '#0B6655' }]}>Attendance</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.tabBarItemActionLink} onPress={onNavigateToLeave}>
                    <Ionicons name="document-text" size={22} color="#98A2B3" />
                    <Text style={styles.tabBarItemLabelText}>Leave</Text>
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
    headerRightFilterIconButton: { padding: 4 },
    segmentTabSelectorOuterContainer: { paddingHorizontal: 16, marginTop: 14 },
    segmentTabSelectorInnerWrapperRow: { flexDirection: 'row', backgroundColor: '#E4E7EC', borderRadius: 10, padding: 3 },
    tabNavigationSelectionButton: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
    activeTabOptionStateHighlight: { backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
    tabNavigationSelectionButtonText: { fontSize: 13, fontWeight: '600', color: '#475467' },
    activeTabOptionStateText: { color: '#101828' },
    dateDurationNavigationHeaderStripRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, marginTop: 14 },
    dateDurationHeadingTitleText: { fontSize: 14, fontWeight: '700', color: '#101828' },
    scrollContentLayoutContainer: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 100 },
    dailyCoreTrackingWrapperBox: { width: '100%' },
    shiftProgressBarContainerMatrix: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#EEF0F2', marginBottom: 16 },
    progressBarHeaderLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    progressBarMainTitleText: { fontSize: 14, fontWeight: '700', color: '#101828' },
    progressBarValueNumericText: { fontSize: 14, fontWeight: '700', color: '#0B6655' },
    progressBarTargetMutedText: { color: '#98A2B3', fontWeight: '500' },
    progressTrackHorizontalBackgroundLine: { height: 8, backgroundColor: '#F2F4F7', borderRadius: 4, overflow: 'hidden' },
    progressActiveFillerIndicatorLine: { height: '100%', backgroundColor: '#0B6655', borderRadius: 4, position: 'absolute' },
    emptySessionsCardContainer: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 30, alignItems: 'center', borderWidth: 1, borderColor: '#EEF0F2' },
    emptySessionsCardText: { fontSize: 13, color: '#667085', marginTop: 8, fontWeight: '500', textAlign: 'center' },
    unifiedSingleSessionCardBoxContainer: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#EEF0F2' },
    timelineTimelineRowBlockNode: { flexDirection: 'row' },
    vectorVerticalLineTrackColumnAxis: { width: 20, alignItems: 'center' },
    vectorStatusMarkerCircleNodeElement: { width: 14, height: 14, borderRadius: 7, justifyContent: 'center', alignItems: 'center', marginTop: 2 },
    innerGlowingDotGreen: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#027A48', shadowColor: '#027A48', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 4, elevation: 4 },
    innerGlowingDotRed: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#D92D20', shadowColor: '#D92D20', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 4, elevation: 4 },
    innerDotGray: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#D0D5DD' },
    vectorConnectingVerticalTrackBarLine: { width: 2, flex: 1, backgroundColor: '#EAECF0', marginVertical: 4, minHeight: 28 },
    sessionDetailsHorizontalContentBlock: { flex: 1, paddingBottom: 16 },
    sessionRowLabelsHeaderLineRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    sessionPunchStateActionLabelText: { fontSize: 13, fontWeight: '600', color: '#344054' },
    sessionPunchStateTimeTimestampValue: { fontSize: 13, fontWeight: '700', color: '#101828' },
    sessionPunchStateSubLocationLabelText: { fontSize: 11, color: '#98A2B3', marginTop: 2, fontWeight: '500' },
    statusGridRowContainerGridMatrix: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    miniStatsBoxContainer: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16, marginHorizontal: 4, borderWidth: 1, borderColor: '#EEF0F2' },
    miniStatsBoxHeaderLabel: { fontSize: 12, color: '#667085', fontWeight: '500' },
    miniStatsBoxValueLargeMain: { fontSize: 18, fontWeight: '700', color: '#101828', marginTop: 4 },
    attendanceLogsListMainBlockFrame: { backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#EEF0F2', overflow: 'hidden' },
    attendanceLogListItemRowNode: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderColor: '#F2F4F7' },
    listItemLeftLabelsBlockColumn: {},
    listItemDateStringLabelText: { fontSize: 14, fontWeight: '700', color: '#101828' },
    listItemDayStringLabelText: { fontSize: 12, color: '#667085', marginTop: 2 },
    listItemRightBadgesBlockRow: { alignItems: 'flex-end' },
    listItemStatusCapsuleBadge: { backgroundColor: '#ECFDF3', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginBottom: 4 },
    listItemStatusCapsuleBadgeText: { fontSize: 11, fontWeight: '600', color: '#027A48' },
    listItemTotalHoursDurationTextValue: { fontSize: 12, color: '#475467', fontWeight: '600' },
    modalFilterOverlayDismissBackground: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    bottomSheetFilterWindowContainer: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: 400 },
    bottomSheetHeaderCenterIndicatorLineBar: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#D0D5DD', alignSelf: 'center', marginBottom: 16 },
    bottomSheetMainHeadingTitleText: { fontSize: 18, fontWeight: '700', color: '#101828', marginBottom: 12 },
    checkboxFilterRowOptionLink: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
    checkboxSquareBoxBorderOutline: { width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: '#D0D5DD' },
    checkboxSquareBoxActiveStateColor: { backgroundColor: '#0B6655', borderColor: '#0B6655' },
    bottomTabStickyNavBarContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 60, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#EAECF0', flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
    tabBarItemActionLink: { alignItems: 'center', justifyContent: 'center' },
    tabBarItemLabelText: { fontSize: 10, color: '#98A2B3', marginTop: 2, fontWeight: '500' }
});