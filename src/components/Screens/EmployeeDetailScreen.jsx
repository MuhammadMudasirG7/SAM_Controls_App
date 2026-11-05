import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Platform, ActivityIndicator, Alert, Image } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { translations, getGlobalLang, subscribeLang } from '../../../i18n';

const PLACEHOLDER_AVATAR = 'https://via.placeholder.com/150';

export default function EmployeeDetailScreen({ 
    employee, 
    onBack, 
    onUpdateLeaveStatus, 
    serverAddress = 'http://192.168.100.199:8081' 
}) {
    if (!employee) return null;

    const [currentLang, setCurrentLang] = useState(getGlobalLang());
    const [employeeLeaves, setEmployeeLeaves] = useState([]);
    const [leaveBalances, setLeaveBalances] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = subscribeLang((newLang) => {
            setCurrentLang(newLang);
        });
        return () => unsubscribe();
    }, []);

    const t = translations[currentLang];
    const isRtl = currentLang === 'ur' || currentLang === 'ar';

    const cleanBaseUrl = serverAddress ? serverAddress.replace(/\/+$/, '') : 'http://192.168.100.199:8081';

    useEffect(() => {
        fetchEmployeeLeaveData();
    }, [employee]);

    const fetchEmployeeLeaveData = async () => {
        try {
            setLoading(true);
            const empId = employee.employeeId;
            
            const res = await fetch(`${cleanBaseUrl}/api/leave/balance?employeeId=${encodeURIComponent(empId)}`);
            const json = await res.json();
            
            if (json.success) {
                if (json.balances) setLeaveBalances(json.balances);
                if (json.requestsHistory) setEmployeeLeaves(json.requestsHistory);
            }
        } catch (err) {
            console.log("Error loading employee leave details:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (requestId, action) => {
        try {
            const validId = requestId || employee._id;
            if (!validId) {
                Alert.alert("Error", "Request ID is missing.");
                return;
            }

            const res = await fetch(`${cleanBaseUrl}/api/leave/manage`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ requestId: validId, action })
            });
            const json = await res.json();
            if (json.success) {
                Alert.alert("Success", `Leave request ${action}d successfully!`);
                fetchEmployeeLeaveData();
                if (onUpdateLeaveStatus) {
                    onUpdateLeaveStatus(employee.employeeId, validId, action === 'approve' ? 'Approved' : 'Rejected');
                }
            } else {
                Alert.alert("Error", json.message || "Failed to update status.");
            }
        } catch (err) {
            Alert.alert("Error", "Network connection failed.");
        }
    };

    return (
        <View style={[styles.container, { direction: isRtl ? 'rtl' : 'ltr' }]}>
            {/* Top Navigation Header */}
            <View style={[styles.header, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
                <TouchableOpacity onPress={onBack} style={styles.backBtn}>
                    <Ionicons name={isRtl ? "arrow-forward" : "arrow-back"} size={20} color="#101828" />
                </TouchableOpacity>
                <View style={{ alignItems: isRtl ? 'flex-end' : 'flex-start' }}>
                    <Text style={styles.headerTitle}>{t.empProfileTitle}</Text>
                    <Text style={styles.headerSubtitle}>{employee.employeeId}</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollArea} showsVerticalScrollIndicator={false}>
                {/* Executive Summary Profile Card */}
                <View style={styles.profileHeroCard}>
                    <View style={[styles.heroTopRow, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
                        <Image source={{ uri: employee.avatar || PLACEHOLDER_AVATAR }} style={styles.employeeAvatarLarge} />
                        <View style={{ flex: 1, [isRtl ? 'marginRight' : 'marginLeft']: 14, [isRtl ? 'marginLeft' : 'marginRight']: 0, alignItems: isRtl ? 'flex-end' : 'flex-start' }}>
                            <Text style={styles.heroNameText}>{employee.name}</Text>
                            <Text style={styles.heroEmailText}>{employee.email || t.noEmailSpecified}</Text>
                            <View style={styles.idBadgePill}>
                                <Text style={styles.idBadgePillText}>{employee.employeeId}</Text>
                            </View>
                        </View>
                    </View>

                    <View style={[styles.heroStatsGrid, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
                        <View style={[styles.heroStatItem, { alignItems: isRtl ? 'flex-end' : 'flex-start' }]}>
                            <Text style={styles.heroStatLabel}>{t.cappedDuty}</Text>
                            <Text style={styles.heroStatVal}>{employee.totalDutyHours || 160} <Text style={{fontSize: 11, fontWeight: '500'}}>hrs</Text></Text>
                        </View>
                        <View style={styles.heroStatDivider} />
                        <View style={[styles.heroStatItem, { alignItems: isRtl ? 'flex-end' : 'flex-start' }]}>
                            <Text style={styles.heroStatLabel}>{t.totalSalary}</Text>
                            <Text style={[styles.heroStatVal, { color: '#0B6655' }]}>Rs. {(employee.totalSalary || 136000).toLocaleString()}</Text>
                        </View>
                    </View>
                </View>

                {/* Leave Balance & Quota Section */}
                <View style={[styles.sectionHeaderRow, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
                    <Text style={styles.sectionTitle}>{t.leaveBalanceTitle}</Text>
                    <Ionicons name="pie-chart-outline" size={16} color="#667085" />
                </View>
                
                {loading ? (
                    <View style={styles.loaderContainer}>
                        <ActivityIndicator size="small" color="#0B6655" />
                    </View>
                ) : leaveBalances ? (
                    <View style={styles.balanceGridContainer}>
                        {Object.keys(leaveBalances).map((key) => {
                            const item = leaveBalances[key];
                            const titleName = key.charAt(0).toUpperCase() + key.slice(1);
                            return (
                                <View key={key} style={styles.leaveTypeCard}>
                                    <View style={[styles.leaveRowTop, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
                                        <Text style={styles.leaveTypeName}>{titleName} Leave</Text>
                                        <Text style={styles.leaveFraction}>{item.remaining} / {item.total}</Text>
                                    </View>
                                    <View style={styles.progressBarContainer}>
                                        <View style={[styles.progressBarFill, { width: `${Math.min(100, (item.remaining / item.total) * 100)}%`, [isRtl ? 'right' : 'left']: 0 }]} />
                                    </View>
                                    <View style={[styles.leaveDetailsRow, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
                                        <Text style={styles.leaveMeta}>{t.takenLabel}: <Text style={{fontWeight: '700', color: '#344054'}}>{item.taken}</Text></Text>
                                        <Text style={styles.leaveMeta}>{t.pendingLabel}: <Text style={{fontWeight: '700', color: '#D97706'}}>{item.pending}</Text></Text>
                                        <Text style={styles.leaveMeta}>{t.leftLabel}: <Text style={{fontWeight: '700', color: '#027A48'}}>{item.remaining}</Text></Text>
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                ) : null}

                {/* Submitted Leave Applications */}
                <View style={[styles.sectionHeaderRow, { marginTop: 24, flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
                    <Text style={styles.sectionTitle}>{t.submittedLeaveReqs}</Text>
                    <Text style={styles.requestCountTag}>{t.totalRequests(employeeLeaves.length)}</Text>
                </View>

                {employeeLeaves.length > 0 ? (
                    employeeLeaves.map((leave, index) => {
                        const currentStatus = (leave.status || '').toLowerCase();
                        const currentLeaveId = leave.id || leave._id;
                        const isPending = currentStatus === 'pending';
                        const isApproved = currentStatus === 'approved';

                        return (
                            <View key={currentLeaveId || index} style={styles.requestCard}>
                                <View style={[styles.requestCardTop, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
                                    <View style={[styles.reqTypeBadge, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
                                        <Ionicons name="document-text-outline" size={13} color="#0B6655" style={{[isRtl ? 'marginLeft' : 'marginRight']: 4, [isRtl ? 'marginRight' : 'marginLeft']: 0}} />
                                        <Text style={styles.reqType}>{leave.type || 'Leave'}</Text>
                                    </View>
                                    <View style={[
                                        styles.statusPillBadge,
                                        isApproved ? styles.pillApproved : (isPending ? styles.pillPending : styles.pillRejected)
                                    ]}>
                                        <Text style={[
                                            styles.statusPillText,
                                            isApproved ? styles.txtApproved : (isPending ? styles.txtPending : styles.txtRejected)
                                        ]}>
                                            {leave.status ? leave.status.toUpperCase() : 'PENDING'}
                                        </Text>
                                    </View>
                                </View>

                                <Text style={[styles.reqReason, { textAlign: isRtl ? 'right' : 'left' }]}>{leave.reason || 'No reason provided'}</Text>
                                
                                <View style={[styles.reqFooterRow, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
                                    <Text style={styles.reqDate}>
                                        <Feather name="calendar" size={11} color="#667085" /> {leave.dates}
                                    </Text>
                                    <View style={styles.durationPill}>
                                        <Text style={styles.durationText}>{leave.totalDays} {leave.totalDays > 1 ? t.daysLabel : t.dayLabel}</Text>
                                    </View>
                                </View>

                                {isPending && (
                                    <View style={[styles.actionRow, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
                                        <TouchableOpacity style={[styles.rejectBtn, { flexDirection: isRtl ? 'row-reverse' : 'row', [isRtl ? 'marginLeft' : 'marginRight']: 8, [isRtl ? 'marginRight' : 'marginLeft']: 0 }]} onPress={() => handleAction(currentLeaveId, 'reject')}>
                                            <Ionicons name="close-circle-outline" size={15} color="#B42318" style={{[isRtl ? 'marginLeft' : 'marginRight']: 4, [isRtl ? 'marginRight' : 'marginLeft']: 0}} />
                                            <Text style={styles.rejectText}>{t.rejectBtnLabel}</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={[styles.approveBtn, { flexDirection: isRtl ? 'row-reverse' : 'row' }]} onPress={() => handleAction(currentLeaveId, 'approve')}>
                                            <Ionicons name="checkmark-circle-outline" size={15} color="#027A48" style={{[isRtl ? 'marginLeft' : 'marginRight']: 4, [isRtl ? 'marginRight' : 'marginLeft']: 0}} />
                                            <Text style={styles.approveText}>{t.approveBtnLabel}</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>
                        );
                    })
                ) : (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="document-text-outline" size={32} color="#98A2B3" />
                        <Text style={styles.noLeaveText}>{t.noLeaveApplications}</Text>
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F4F6F8', paddingTop: Platform.OS === 'android' ? 24 : 0 },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, backgroundColor: '#FFF', borderBottomWidth: 1, borderColor: '#EAECF0' },
    backBtn: { width: 36, height: 36, borderRadius: 8, backgroundColor: '#F2F4F7', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    headerTitle: { fontSize: 16, fontWeight: '800', color: '#101828' },
    headerSubtitle: { fontSize: 11, color: '#667085', fontWeight: '600' },
    scrollArea: { padding: 20, paddingBottom: 40 },
    profileHeroCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 18, borderWidth: 1, borderColor: '#EAECF0', marginBottom: 20, shadowColor: '#101828', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
    heroTopRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    employeeAvatarLarge: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#F2F4F7', borderWidth: 1, borderColor: '#EAECF0' },
    heroNameText: { fontSize: 17, fontWeight: '800', color: '#101828' },
    heroEmailText: { fontSize: 12, color: '#667085', marginTop: 2 },
    idBadgePill: { backgroundColor: '#F4FBF9', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, alignSelf: 'flex-start', marginTop: 6, borderWidth: 1, borderColor: '#E6F4F1' },
    idBadgePillText: { fontSize: 10, fontWeight: '700', color: '#0B6655' },
    heroStatsGrid: { flexDirection: 'row', backgroundColor: '#F9FAFB', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#F2F4F7', alignItems: 'center' },
    heroStatItem: { flex: 1, alignItems: 'center' },
    heroStatDivider: { width: 1, height: 24, backgroundColor: '#EAECF0' },
    heroStatLabel: { fontSize: 11, color: '#667085', fontWeight: '600' },
    heroStatVal: { fontSize: 15, fontWeight: '800', color: '#101828', marginTop: 2 },
    sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    sectionTitle: { fontSize: 16, fontWeight: '800', color: '#101828' },
    requestCountTag: { fontSize: 11, fontWeight: '700', color: '#0B6655', backgroundColor: '#E6F4F1', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
    loaderContainer: { paddingVertical: 20, alignItems: 'center' },
    balanceGridContainer: { marginBottom: 10 },
    leaveTypeCard: { backgroundColor: '#FFF', borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#EAECF0', shadowColor: '#101828', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 2, elevation: 1 },
    leaveRowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    leaveTypeName: { fontSize: 14, fontWeight: '700', color: '#101828' },
    leaveFraction: { fontSize: 14, fontWeight: '800', color: '#0B6655' },
    progressBarContainer: { height: 6, backgroundColor: '#F2F4F7', borderRadius: 3, overflow: 'hidden', marginBottom: 8 },
    progressBarFill: { height: '100%', backgroundColor: '#0B6655', borderRadius: 3, position: 'absolute' },
    leaveDetailsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#F8F9FA' },
    leaveMeta: { fontSize: 11, color: '#667085' },
    requestCard: { backgroundColor: '#FFF', borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#EAECF0', shadowColor: '#101828', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 2, elevation: 1 },
    requestCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    reqTypeBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F4FBF9', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1, borderColor: '#E6F4F1' },
    reqType: { fontSize: 11, fontWeight: '700', color: '#0B6655' },
    statusPillBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
    pillPending: { backgroundColor: '#FFFAEB' },
    pillApproved: { backgroundColor: '#ECFDF3' },
    pillRejected: { backgroundColor: '#FEF3F2' },
    statusPillText: { fontSize: 10, fontWeight: '800' },
    txtPending: { color: '#B24E00' },
    txtApproved: { color: '#027A48' },
    txtRejected: { color: '#B42318' },
    reqReason: { fontSize: 14, fontWeight: '700', color: '#101828', marginBottom: 8, lineHeight: 20 },
    reqFooterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    reqDate: { fontSize: 12, color: '#667085', fontWeight: '500' },
    durationPill: { backgroundColor: '#F2F4F7', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
    durationText: { fontSize: 11, fontWeight: '700', color: '#344054' },
    actionRow: { flexDirection: 'row', justifyContent: 'flex-end', paddingTop: 12, marginTop: 10, borderTopWidth: 1, borderTopColor: '#F2F4F7' },
    rejectBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF3F2', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#FECDCA' },
    rejectText: { color: '#B42318', fontSize: 12, fontWeight: '700' },
    approveBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ECFDF3', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#ABEFC6' },
    approveText: { color: '#027A48', fontSize: 12, fontWeight: '700' },
    emptyContainer: { backgroundColor: '#FFF', borderRadius: 14, padding: 30, alignItems: 'center', borderWidth: 1, borderColor: '#EAECF0' },
    noLeaveText: { fontSize: 13, color: '#667085', textAlign: 'center', marginTop: 8, fontWeight: '500' }
});