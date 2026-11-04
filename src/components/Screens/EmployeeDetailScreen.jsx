import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Platform, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function EmployeeDetailScreen({ 
    employee, 
    onBack, 
    onUpdateLeaveStatus, 
    serverAddress = 'http://192.168.1.12:8081' 
}) {
    if (!employee) return null;

    const [employeeLeaves, setEmployeeLeaves] = useState([]);
    const [leaveBalances, setLeaveBalances] = useState(null);
    const [loading, setLoading] = useState(true);

    const cleanBaseUrl = serverAddress.replace(/\/+$/, '');

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
            // 🟢 Safe check for request ID
            const validId = requestId || employee._id;
            if (!validId) {
                Alert.alert("Error", "Request ID is missing.");
                return;
            }

            const res = await fetch(`${cleanBaseUrl}/api/leave/manage`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ requestId: validId, action }) // action: 'approve' or 'reject'
            });
            const json = await res.json();
            if (json.success) {
                Alert.alert("Success", `Leave request ${action}d successfully!`);
                fetchEmployeeLeaveData(); // Refresh list
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
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={onBack} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={22} color="#101828" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{employee.name} — Profile</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollArea} showsVerticalScrollIndicator={false}>
                {/* Summary Box */}
                <View style={styles.summaryBox}>
                    <Text style={styles.empIdText}>Employee ID: {employee.employeeId}</Text>
                    <Text style={styles.empEmailText}>Email: {employee.email || 'N/A'}</Text>
                    <View style={styles.statsRow}>
                        <View style={styles.statCard}>
                            <Text style={styles.statLabel}>Capped Duty (8h)</Text>
                            <Text style={styles.statVal}>{employee.totalDutyHours || 160} hrs</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Text style={styles.statLabel}>Total Salary</Text>
                            <Text style={[styles.statVal, { color: '#0B6655' }]}>Rs. {(employee.totalSalary || 136000).toLocaleString()}</Text>
                        </View>
                    </View>
                </View>

                {/* Leave Balance Section */}
                <Text style={styles.sectionTitle}>Leave Balance & Quota (2026)</Text>
                
                {loading ? (
                    <ActivityIndicator size="small" color="#0B6655" style={{ marginVertical: 20 }} />
                ) : leaveBalances ? (
                    Object.keys(leaveBalances).map((key) => {
                        const item = leaveBalances[key];
                        const titleName = key.charAt(0).toUpperCase() + key.slice(1) + ' Leave';
                        return (
                            <View key={key} style={styles.leaveTypeCard}>
                                <View style={styles.leaveRowTop}>
                                    <Text style={styles.leaveTypeName}>{titleName}</Text>
                                    <Text style={styles.leaveFraction}>{item.remaining} / {item.total}</Text>
                                </View>
                                <View style={styles.leaveDetailsRow}>
                                    <Text style={styles.leaveMeta}>Taken: <Text style={{fontWeight: '700'}}>{item.taken}</Text></Text>
                                    <Text style={styles.leaveMeta}>Pending: <Text style={{fontWeight: '700', color: '#D97706'}}>{item.pending}</Text></Text>
                                    <Text style={styles.leaveMeta}>Remaining: <Text style={{fontWeight: '700', color: '#027A48'}}>{item.remaining}</Text></Text>
                                </View>
                            </View>
                        );
                    })
                ) : null}

                {/* Submitted Leave Applications */}
                <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Submitted Leave Applications</Text>
                {employeeLeaves.length > 0 ? (
                    employeeLeaves.map((leave, index) => {
                        const currentStatus = (leave.status || '').toLowerCase();
                        // 🟢 Ensure we grab the correct ID (id or _id)
                        const currentLeaveId = leave.id || leave._id;

                        return (
                            <View key={currentLeaveId || index} style={styles.requestCard}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.reqType}>{leave.type}</Text>
                                    <Text style={styles.reqReason}>{leave.reason}</Text>
                                    <Text style={styles.reqDate}>Dates: {leave.dates} ({leave.totalDays} days)</Text>
                                </View>
                                <View style={{ alignItems: 'flex-end', marginLeft: 10 }}>
                                    <Text style={[styles.statusText, { color: currentStatus === 'approved' ? '#027A48' : currentStatus === 'rejected' ? '#B42318' : '#D97706' }]}>
                                        {leave.status}
                                    </Text>
                                    {currentStatus === 'pending' && (
                                        <View style={styles.actionRow}>
                                            <TouchableOpacity style={styles.rejectBtn} onPress={() => handleAction(currentLeaveId, 'reject')}>
                                                <Text style={styles.rejectText}>Reject</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity style={styles.approveBtn} onPress={() => handleAction(currentLeaveId, 'approve')}>
                                                <Text style={styles.approveText}>Approve</Text>
                                            </TouchableOpacity>
                                        </View>
                                    )}
                                </View>
                            </View>
                        );
                    })
                ) : (
                    <Text style={styles.noLeaveText}>No leave requests found for this employee.</Text>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F7F9FA', paddingTop: Platform.OS === 'android' ? 24 : 0 },
    header: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#FFF', borderBottomWidth: 1, borderColor: '#EAECF0' },
    backBtn: { marginRight: 12 },
    headerTitle: { fontSize: 17, fontWeight: '700', color: '#101828' },
    scrollArea: { padding: 16, paddingBottom: 40 },
    summaryBox: { backgroundColor: '#FFF', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#EAECF0', marginBottom: 20 },
    empIdText: { fontSize: 13, color: '#667085', fontWeight: '600' },
    empEmailText: { fontSize: 12, color: '#667085', marginTop: 2 },
    statsRow: { flexDirection: 'row', marginTop: 12 },
    statCard: { flex: 1, backgroundColor: '#F9FAFB', padding: 10, borderRadius: 8, marginRight: 8, borderWidth: 1, borderColor: '#EAECF0' },
    statLabel: { fontSize: 11, color: '#667085' },
    statVal: { fontSize: 14, fontWeight: '700', color: '#101828', marginTop: 2 },
    sectionTitle: { fontSize: 15, fontWeight: '700', color: '#101828', marginBottom: 10 },
    leaveTypeCard: { backgroundColor: '#FFF', borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#EAECF0' },
    leaveRowTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    leaveTypeName: { fontSize: 14, fontWeight: '700', color: '#101828' },
    leaveFraction: { fontSize: 14, fontWeight: '700', color: '#0B6655' },
    leaveDetailsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6, paddingTop: 6, borderTopWidth: 1, borderTopColor: '#F2F4F7' },
    leaveMeta: { fontSize: 12, color: '#475467' },
    requestCard: { flexDirection: 'row', backgroundColor: '#FFF', padding: 14, borderRadius: 12, marginBottom: 8, alignItems: 'center', borderWidth: 1, borderColor: '#EAECF0' },
    reqType: { fontSize: 12, fontWeight: '700', color: '#0B6655', marginBottom: 2 },
    reqReason: { fontSize: 13, fontWeight: '700', color: '#101828' },
    reqDate: { fontSize: 11, color: '#667085', marginTop: 2 },
    statusText: { fontSize: 12, fontWeight: '700', marginBottom: 6 },
    actionRow: { flexDirection: 'row', marginTop: 4 },
    rejectBtn: { backgroundColor: '#FEE4E2', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, marginRight: 6 },
    rejectText: { color: '#B42318', fontSize: 11, fontWeight: '700' },
    approveBtn: { backgroundColor: '#ECFDF3', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
    approveText: { color: '#027A48', fontSize: 11, fontWeight: '700' },
    noLeaveText: { fontSize: 12, color: '#667085', textAlign: 'center', padding: 20 }
});