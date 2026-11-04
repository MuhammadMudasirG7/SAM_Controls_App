import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
    Image,
    Platform
} from 'react-native';
import { Ionicons, Feather, MaterialIcons } from '@expo/vector-icons';

import EmployeeDetailScreen from './EmployeeDetailScreen';
import AdminNotificationsScreen from './AdminNotificationsScreen';

const PLACEHOLDER_AVATAR = 'https://via.placeholder.com/150';

export default function AdminDashboardScreen({
    onLogout,
    serverAddress = 'http://192.168.100.199:8081'
}) {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [loading, setLoading] = useState(false);

    const [usersList, setUsersList] = useState([]);
    const [locationsList, setLocationsList] = useState([]);

    const [currentAdminView, setCurrentAdminView] = useState('dashboard_main'); 
    const [selectedEmployee, setSelectedEmployee] = useState(null);

    // 🟢 Real-time Notifications State from Backend API
    const [notificationsList, setNotificationsList] = useState([]);

    const cleanBaseUrl = serverAddress.replace(/\/+$/, '');

    useEffect(() => {
        fetchUsers();
        fetchLocations();
        fetchAdminLeavesNotifications();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${cleanBaseUrl}/api/admin/users`);
            const json = await res.json();
            if (json.success) {
                setUsersList(json.users || []);
            }
        } catch (err) {
            console.log("Error loading users:", err);
        } finally { setLoading(false); }
    };

    const fetchLocations = async () => {
        try {
            const res = await fetch(`${cleanBaseUrl}/api/admin/locations`);
            const json = await res.json();
            if (json.success) setLocationsList(json.locations || []);
        } catch (err) { console.log(err); }
    };

    const fetchAdminLeavesNotifications = async () => {
        try {
            const res = await fetch(`${cleanBaseUrl}/api/admin/leaves`);
            const json = await res.json();
            if (json.success && json.leaves) {
                const liveNotifs = json.leaves.map(req => {
                    let displayName = req.name || 'Employee';
                    if (displayName.includes('(')) {
                        displayName = displayName.split('(')[0].trim();
                    }

                    return {
                        id: req._id || req.id,
                        employeeId: req.employeeId,
                        name: displayName,
                        message: `Applied for ${req.leaveTypeName || req.leaveType} (${req.totalDays} days)`,
                        time: new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        status: req.status
                    };
                });
                setNotificationsList(liveNotifs);
            }
        } catch (err) {
            console.log("Error fetching admin leave notifications:", err);
        }
    };

    const handleToggleBlock = async (userId, currentBlockedStatus, userName) => {
        Alert.alert(
            "Manage Access",
            `Are you sure you want to ${currentBlockedStatus ? 'unblock' : 'block'} ${userName}?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: currentBlockedStatus ? "Unblock" : "Block",
                    onPress: async () => {
                        try {
                            const res = await fetch(`${cleanBaseUrl}/api/admin/users`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ userId, isBlocked: !currentBlockedStatus })
                            });
                            const json = await res.json();
                            if (json.success) {
                                setUsersList(prev => (prev || []).map(u => (u._id === userId || u.id === userId) ? { ...u, isBlocked: !currentBlockedStatus } : u));
                            }
                        } catch (err) { Alert.alert("Error", "Network failed."); }
                    }
                }
            ]
        );
    };

    if (currentAdminView === 'employee_detail') {
        return (
            <EmployeeDetailScreen 
                employee={selectedEmployee} 
                onBack={() => { setCurrentAdminView('dashboard_main'); fetchAdminLeavesNotifications(); }}
                onUpdateLeaveStatus={async (empId, leaveId, status) => {
                    try {
                        const res = await fetch(`${cleanBaseUrl}/api/admin/leaves`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ leaveId, status })
                        });
                        const json = await res.json();
                        if (json.success) {
                            Alert.alert("Success", `Leave request marked as ${status}.`);
                            fetchAdminLeavesNotifications();
                            setCurrentAdminView('dashboard_main');
                        }
                    } catch (err) {
                        Alert.alert("Error", "Failed to update leave status.");
                    }
                }}
            />
        );
    }

    if (currentAdminView === 'notifications') {
        return (
            <AdminNotificationsScreen 
                notifications={notificationsList}
                onBack={() => setCurrentAdminView('dashboard_main')}
                onSelectNotificationUser={(empId) => {
                    const found = (usersList || []).find(u => u.employeeId === empId) || { employeeId: empId, name: 'Employee' };
                    setSelectedEmployee(found);
                    setCurrentAdminView('employee_detail');
                }}
            />
        );
    }

    const safeUsers = usersList || [];
    const safeLocations = locationsList || [];
    const safeNotifications = notificationsList || [];

    const totalPhonesCount = safeUsers.length;
    const activePhonesCount = safeUsers.filter(u => !u.isBlocked).length;
    const blockedPhonesCount = safeUsers.filter(u => u.isBlocked).length;

    const pendingNotifsCount = safeNotifications.filter(n => n.status === 'pending').length;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.brandSection}>
                    <View style={styles.logoBox}><Text style={styles.logoText}>S</Text></View>
                    <View>
                        <Text style={styles.brandTitle}>SAM Controls</Text>
                        <Text style={styles.brandSubtitle}>PORTAL CONTROL</Text>
                    </View>
                </View>

                <TouchableOpacity style={styles.notificationBellBtn} onPress={() => setCurrentAdminView('notifications')}>
                    <Ionicons name="notifications-outline" size={22} color="#0B6655" />
                    {pendingNotifsCount > 0 && (
                        <View style={styles.notificationBadgeDot}>
                            <Text style={styles.notificationBadgeText}>{pendingNotifsCount}</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {activeTab === 'dashboard' && (
                    <View style={{ padding: 16 }}>
                        <Text style={styles.mainTitle}>System Overview</Text>
                        <Text style={styles.subTitleText}>Real-time tracking of registered phones and system status.</Text>
                        
                        <View style={styles.statsContainerRow}>
                            <View style={[styles.statCardItem, { borderColor: '#0B6655', borderWidth: 1.5 }]}>
                                <View style={styles.statCardInner}>
                                    <View style={styles.statIconBox}><Ionicons name="phone-portrait-outline" size={16} color="#0B6655" /></View>
                                    <View style={{ marginLeft: 10 }}>
                                        <Text style={styles.statNumberText}>{totalPhonesCount}</Text>
                                        <Text style={styles.statLabelText}>Total phones</Text>
                                    </View>
                                </View>
                            </View>

                            <View style={styles.statCardItem}>
                                <View style={styles.statCardInner}>
                                    <View style={[styles.statIconBox, { backgroundColor: '#ECFDF3' }]}><Ionicons name="checkmark-circle-outline" size={16} color="#027A48" /></View>
                                    <View style={{ marginLeft: 10 }}>
                                        <Text style={styles.statNumberText}>{activePhonesCount}</Text>
                                        <Text style={styles.statLabelText}>Active</Text>
                                    </View>
                                </View>
                            </View>

                            <View style={styles.statCardItem}>
                                <View style={styles.statCardInner}>
                                    <View style={[styles.statIconBox, { backgroundColor: '#FEE4E2' }]}><Ionicons name="ban-outline" size={16} color="#B42318" /></View>
                                    <View style={{ marginLeft: 10 }}>
                                        <Text style={styles.statNumberText}>{blockedPhonesCount}</Text>
                                        <Text style={styles.statLabelText}>Blocked</Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    </View>
                )}

                {activeTab === 'users' && (
                    <View style={{ padding: 16 }}>
                        <Text style={styles.mainTitle}>Users Directory</Text>
                        <Text style={styles.subTitleText}>Tap employee card to view leaves, 8-hour duty, and salary.</Text>
                        
                        {loading ? <ActivityIndicator size="large" color="#0B6655" style={{ marginTop: 40 }} /> : (
                            <View style={{ marginTop: 15 }}>
                                {safeUsers.length === 0 ? <Text style={styles.emptyText}>No users found.</Text> : safeUsers.map((user) => (
                                    <View key={user._id || user.id} style={styles.cardItem}>
                                        <TouchableOpacity style={styles.cardHeader} onPress={() => { setSelectedEmployee(user); setCurrentAdminView('employee_detail'); }}>
                                            <Image source={{ uri: user.avatar || PLACEHOLDER_AVATAR }} style={styles.avatar} />
                                            <View style={styles.cardInfo}>
                                                <Text style={styles.cardTitle}>{user.name}</Text>
                                                <Text style={styles.cardSubText}>{user.employeeId} • Tap for Leave & Quota</Text>
                                            </View>
                                            <Ionicons name="chevron-forward" size={18} color="#667085" />
                                        </TouchableOpacity>

                                        <View style={styles.badgeRow}>
                                            <View style={[styles.statusBadge, user.isBlocked ? styles.blockedBadge : styles.activeBadge]}>
                                                <View style={[styles.badgeDot, user.isBlocked ? { backgroundColor: '#B42318' } : { backgroundColor: '#027A48' }]} />
                                                <Text style={[styles.badgeText, user.isBlocked ? styles.blockedText : styles.activeText]}>
                                                    {user.isBlocked ? 'Blocked' : 'Active (8h Capped)'}
                                                </Text>
                                            </View>

                                            <TouchableOpacity 
                                                style={[styles.quickBlockBtn, user.isBlocked ? styles.unblockBtnStyle : styles.blockBtnStyle]} 
                                                onPress={() => handleToggleBlock(user._id || user.id, user.isBlocked, user.name)}
                                            >
                                                <Text style={[styles.quickBlockText, user.isBlocked ? { color: '#027A48' } : { color: '#B42318' }]}>
                                                    {user.isBlocked ? 'Unblock' : 'Block'}
                                                </Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>
                )}

                {activeTab === 'locations' && (
                    <View style={{ padding: 16 }}>
                        <Text style={styles.mainTitle}>Geofence Locations</Text>
                        <Text style={styles.subTitleText}>Operational site boundary controls.</Text>
                        
                        <View style={{ marginTop: 20 }}>
                            {safeLocations.length === 0 ? (
                                <Text style={styles.emptyText}>No locations configured yet.</Text>
                            ) : (
                                safeLocations.map((loc) => (
                                    <View key={loc._id || loc.id} style={styles.cardItem}>
                                        <Text style={styles.cardTitle}>{loc.name} ({loc.code})</Text>
                                        <Text style={styles.cardSubText}>City: {loc.city} • Radius: {loc.boundaryRadius || 500}m</Text>
                                    </View>
                                ))
                            )}
                        </View>
                    </View>
                )}

                {activeTab === 'leaves' && (
                    <View style={{ padding: 16 }}>
                        <Text style={styles.mainTitle}>Leave Approvals Center</Text>
                        <Text style={styles.subTitleText}>Review real-time applications submitted by employees.</Text>
                        
                        <View style={{ marginTop: 20 }}>
                            {safeNotifications.length === 0 ? (
                                <Text style={styles.emptyText}>No leave requests submitted yet.</Text>
                            ) : (
                                safeNotifications.map((item) => (
                                    <TouchableOpacity 
                                        key={item.id} 
                                        style={styles.cardItem}
                                        onPress={() => {
                                            const found = safeUsers.find(u => u.employeeId === item.employeeId) || { employeeId: item.employeeId, name: item.name };
                                            setSelectedEmployee(found);
                                            setCurrentAdminView('employee_detail');
                                        }}
                                    >
                                        <Text style={styles.cardTitle}>{item.name} ({item.employeeId})</Text>
                                        <Text style={styles.cardSubText}>{item.message}</Text>
                                        <Text style={{ fontSize: 11, color: '#0B6655', marginTop: 6, fontWeight: '700' }}>Status: {item.status.toUpperCase()} • Tap to review →</Text>
                                    </TouchableOpacity>
                                ))
                            )}
                        </View>
                    </View>
                )}
            </ScrollView>

            <View style={styles.bottomNavContainer}>
                <TouchableOpacity style={styles.bottomNavTab} onPress={() => setActiveTab('dashboard')}>
                    <Ionicons name="grid-outline" size={20} color={activeTab === 'dashboard' ? '#0B6655' : '#667085'} />
                    <Text style={[styles.bottomNavText, activeTab === 'dashboard' && styles.bottomNavTextActive]}>Dashboard</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.bottomNavTab} onPress={() => setActiveTab('users')}>
                    <Ionicons name="people-outline" size={20} color={activeTab === 'users' ? '#0B6655' : '#667085'} />
                    <Text style={[styles.bottomNavText, activeTab === 'users' && styles.bottomNavTextActive]}>Users</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.bottomNavTab} onPress={() => setActiveTab('locations')}>
                    <Ionicons name="location-outline" size={20} color={activeTab === 'locations' ? '#0B6655' : '#667085'} />
                    <Text style={[styles.bottomNavText, activeTab === 'locations' && styles.bottomNavTextActive]}>Locations</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.bottomNavTab} onPress={() => setActiveTab('leaves')}>
                    <Ionicons name="calendar-outline" size={20} color={activeTab === 'leaves' ? '#0B6655' : '#667085'} />
                    <Text style={[styles.bottomNavText, activeTab === 'leaves' && styles.bottomNavTextActive]}>Leaves</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F7F9FA', paddingTop: Platform.OS === 'android' ? 24 : 0 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#EAECF0' },
    brandSection: { flexDirection: 'row', alignItems: 'center' },
    logoBox: { width: 36, height: 36, backgroundColor: '#0B6655', borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
    logoText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
    brandTitle: { fontSize: 15, fontWeight: '700', color: '#101828' },
    brandSubtitle: { fontSize: 10, color: '#667085', fontWeight: '600' },
    notificationBellBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F2F4F7', justifyContent: 'center', alignItems: 'center', position: 'relative' },
    notificationBadgeDot: { position: 'absolute', top: 6, right: 6, backgroundColor: '#B42318', width: 16, height: 16, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
    notificationBadgeText: { color: '#FFF', fontSize: 9, fontWeight: 'bold' },
    scrollContent: { paddingBottom: 90 },
    mainTitle: { fontSize: 22, fontWeight: '700', color: '#101828' },
    subTitleText: { fontSize: 13, color: '#667085', marginTop: 2 },
    statsContainerRow: { flexDirection: 'row', marginTop: 15, justifyContent: 'space-between' },
    statCardItem: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12, marginRight: 8, borderWidth: 1, borderColor: '#EAECF0', elevation: 1 },
    statCardInner: { flexDirection: 'row', alignItems: 'center' },
    statIconBox: { width: 30, height: 30, borderRadius: 6, backgroundColor: '#F2F4F7', justifyContent: 'center', alignItems: 'center' },
    statNumberText: { fontSize: 16, fontWeight: '700', color: '#101828' },
    statLabelText: { fontSize: 10, color: '#667085', fontWeight: '500' },
    cardItem: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#EAECF0', elevation: 2 },
    cardHeader: { flexDirection: 'row', alignItems: 'center' },
    avatar: { width: 44, height: 44, borderRadius: 22, marginRight: 12 },
    cardInfo: { flex: 1 },
    cardTitle: { fontSize: 15, fontWeight: '700', color: '#101828' },
    cardSubText: { fontSize: 12, color: '#667085', marginTop: 1 },
    badgeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F2F4F7' },
    statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    activeBadge: { backgroundColor: '#ECFDF3' },
    blockedBadge: { backgroundColor: '#FEE4E2' },
    badgeDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
    badgeText: { fontSize: 11, fontWeight: '600' },
    activeText: { color: '#027A48' },
    blockedText: { color: '#B42318' },
    quickBlockBtn: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, borderWidth: 1 },
    blockBtnStyle: { backgroundColor: '#FEE4E2', borderColor: '#FECDCA' },
    unblockBtnStyle: { backgroundColor: '#ECFDF3', borderColor: '#ABEFC6' },
    quickBlockText: { fontSize: 11, fontWeight: '700' },
    emptyText: { textAlign: 'center', padding: 30, color: '#667085', fontSize: 13 },
    bottomNavContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 60, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#EAECF0', flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingBottom: Platform.OS === 'ios' ? 10 : 0 },
    bottomNavTab: { alignItems: 'center', justifyContent: 'center', flex: 1 },
    bottomNavText: { fontSize: 11, color: '#667085', marginTop: 2, fontWeight: '500' },
    bottomNavTextActive: { color: '#0B6655', fontWeight: '700' }
});