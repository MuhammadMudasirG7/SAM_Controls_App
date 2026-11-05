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
    Platform,
    RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import EmployeeDetailScreen from './EmployeeDetailScreen';
import AdminNotificationsScreen from './AdminNotificationsScreen';
import { translations, getGlobalLang, subscribeLang } from '../../../i18n';

const PLACEHOLDER_AVATAR = 'https://via.placeholder.com/150';

export default function AdminDashboardScreen({
    onLogout,
    serverAddress
}) {
    const [currentLang, setCurrentLang] = useState(getGlobalLang());
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const [usersList, setUsersList] = useState([]);
    const [locationsList, setLocationsList] = useState([]);
    const [notificationsList, setNotificationsList] = useState([]);

    const [currentAdminView, setCurrentAdminView] = useState('dashboard_main'); 
    const [selectedEmployee, setSelectedEmployee] = useState(null);

    const cleanBaseUrl = serverAddress ? serverAddress.replace(/\/+$/, '') : 'http://192.168.100.199:8081';

    useEffect(() => {
        const unsubscribe = subscribeLang((newLang) => {
            setCurrentLang(newLang);
        });
        return () => unsubscribe();
    }, []);

    const t = translations[currentLang];
    const isRtl = currentLang === 'ur' || currentLang === 'ar';

    useEffect(() => {
        fetchAllAdminData();
    }, []);

    const fetchAllAdminData = async () => {
        setLoading(true);
        await Promise.all([
            fetchUsers(),
            fetchLocations(),
            fetchAdminLeavesNotifications()
        ]);
        setLoading(false);
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchAllAdminData();
        setRefreshing(false);
    };

    const fetchUsers = async () => {
        try {
            const res = await fetch(`${cleanBaseUrl}/api/admin/users`);
            const json = await res.json();
            if (json.success) setUsersList(json.users || []);
        } catch (err) {
            console.log("Error loading users:", err);
        }
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
                        leaveType: req.leaveTypeName || req.leaveType || 'Annual',
                        totalDays: req.totalDays || 1,
                        message: `Applied for ${req.leaveTypeName || req.leaveType} (${req.totalDays} days)`,
                        time: new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        status: req.status || 'pending',
                        createdAt: req.createdAt
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
            "Manage Access Control",
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
                        } catch (err) { Alert.alert("Error", "Network connection failed."); }
                    }
                }
            ]
        );
    };

    if (currentAdminView === 'employee_detail') {
        return (
            <EmployeeDetailScreen 
                employee={selectedEmployee} 
                serverAddress={serverAddress}
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
    const pendingLeavesCount = safeNotifications.filter(n => n.status === 'pending').length;

    return (
        <View style={[styles.container, { direction: isRtl ? 'rtl' : 'ltr' }]}>
            {/* Top Header */}
            <View style={[styles.header, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
                <View style={[styles.brandSection, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
                    <View style={styles.logoBox}><Text style={styles.logoText}>S</Text></View>
                    <View style={{ alignItems: isRtl ? 'flex-end' : 'flex-start', [isRtl ? 'marginRight' : 'marginLeft']: 12 }}>
                        <Text style={styles.brandTitle}>SAM Controls</Text>
                        <Text style={styles.brandSubtitle}>{t.adminPortal}</Text>
                    </View>
                </View>

                <View style={[styles.headerActions, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
                    <TouchableOpacity style={[styles.notificationBellBtn, { [isRtl ? 'marginLeft' : 'marginRight']: 8 }]} onPress={() => setCurrentAdminView('notifications')}>
                        <Ionicons name="notifications-outline" size={22} color="#101828" />
                        {pendingLeavesCount > 0 && (
                            <View style={styles.notificationBadgeDot}>
                                <Text style={styles.notificationBadgeText}>{pendingLeavesCount}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
                        <Ionicons name="log-out-outline" size={20} color="#101828" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Custom Tab Bar */}
            <View style={styles.tabsWrapper}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.tabsScrollContent, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
                    <TouchableOpacity style={[styles.tabButton, activeTab === 'overview' && styles.tabButtonActive, { flexDirection: isRtl ? 'row-reverse' : 'row' }]} onPress={() => setActiveTab('overview')}>
                        <Ionicons name="layers-outline" size={16} color={activeTab === 'overview' ? '#1A332C' : '#667085'} style={{ [isRtl ? 'marginLeft' : 'marginRight']: 6 }} />
                        <Text style={[styles.tabButtonText, activeTab === 'overview' && styles.tabButtonTextActive]}>{t.overview}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.tabButton, activeTab === 'users' && styles.tabButtonActive]} onPress={() => setActiveTab('users')}>
                        <Text style={[styles.tabButtonText, activeTab === 'users' && styles.tabButtonTextActive]}>{t.employees} ({totalPhonesCount})</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.tabButton, activeTab === 'locations' && styles.tabButtonActive]} onPress={() => setActiveTab('locations')}>
                        <Text style={[styles.tabButtonText, activeTab === 'locations' && styles.tabButtonTextActive]}>{t.geofences}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.tabButton, activeTab === 'leaves' && styles.tabButtonActive]} onPress={() => setActiveTab('leaves')}>
                        <Text style={[styles.tabButtonText, activeTab === 'leaves' && styles.tabButtonTextActive]}>{t.leaves}</Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>

            {/* Main Content */}
            <ScrollView 
                style={styles.mainContent} 
                contentContainerStyle={{ paddingBottom: 40 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0B6655']} />}
            >
                {loading && !refreshing && (
                    <View style={styles.loadingOverlay}>
                        <ActivityIndicator size="large" color="#0B6655" />
                    </View>
                )}

                {/* OVERVIEW TAB */}
                {activeTab === 'overview' && (
                    <View style={[styles.tabContentContainer, { alignItems: isRtl ? 'flex-end' : 'flex-start' }]}>
                        <Text style={[styles.sectionHeaderTitle, { textAlign: isRtl ? 'right' : 'left' }]}>{t.systemMetrics}</Text>
                        <Text style={[styles.sectionHeaderSubtitle, { textAlign: isRtl ? 'right' : 'left' }]}>{t.systemMetricsSub}</Text>

                        <View style={styles.metricsGridContainer}>
                            <View style={[styles.metricsGridRow, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
                                <View style={[styles.metricCard, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
                                    <View style={[styles.metricIconBox, { backgroundColor: '#E2E8F0' }]}>
                                        <Ionicons name="phone-portrait-outline" size={22} color="#334155" />
                                    </View>
                                    <View style={[styles.metricTextData, { alignItems: isRtl ? 'flex-end' : 'flex-start', [isRtl ? 'marginRight' : 'marginLeft']: 12 }]}>
                                        <Text style={styles.metricCardValue}>{totalPhonesCount}</Text>
                                        <Text style={styles.metricCardLabel}>{t.totalDevices}</Text>
                                    </View>
                                </View>

                                <View style={[styles.metricCard, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
                                    <View style={[styles.metricIconBox, { backgroundColor: '#D1FAE5' }]}>
                                        <Ionicons name="checkmark-circle-outline" size={22} color="#059669" />
                                    </View>
                                    <View style={[styles.metricTextData, { alignItems: isRtl ? 'flex-end' : 'flex-start', [isRtl ? 'marginRight' : 'marginLeft']: 12 }]}>
                                        <Text style={styles.metricCardValue}>{activePhonesCount}</Text>
                                        <Text style={styles.metricCardLabel}>{t.activeOnline}</Text>
                                    </View>
                                </View>
                            </View>

                            <View style={[styles.metricsGridRow, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
                                <View style={[styles.metricCard, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
                                    <View style={[styles.metricIconBox, { backgroundColor: '#FEE2E2' }]}>
                                        <Ionicons name="ban-outline" size={22} color="#DC2626" />
                                    </View>
                                    <View style={[styles.metricTextData, { alignItems: isRtl ? 'flex-end' : 'flex-start', [isRtl ? 'marginRight' : 'marginLeft']: 12 }]}>
                                        <Text style={styles.metricCardValue}>{blockedPhonesCount}</Text>
                                        <Text style={styles.metricCardLabel}>{t.restrictedAccess}</Text>
                                    </View>
                                </View>

                                <View style={[styles.metricCard, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
                                    <View style={[styles.metricIconBox, { backgroundColor: '#FEE2E2' }]}>
                                        <Ionicons name="time-outline" size={22} color="#DC2626" />
                                    </View>
                                    <View style={[styles.metricTextData, { alignItems: isRtl ? 'flex-end' : 'flex-start', [isRtl ? 'marginRight' : 'marginLeft']: 12 }]}>
                                        <Text style={styles.metricCardValue}>{pendingLeavesCount}</Text>
                                        <Text style={styles.metricCardLabel}>{t.pendingLeaves}</Text>
                                    </View>
                                </View>
                            </View>
                        </View>

                        <Text style={[styles.sectionHeaderTitle, { marginTop: 24, textAlign: isRtl ? 'right' : 'left' }]}>{t.quickLinks}</Text>
                        <Text style={[styles.sectionHeaderSubtitle, { textAlign: isRtl ? 'right' : 'left' }]}>{t.quickLinksSub}</Text>

                        <View style={[styles.quickActionCardsRow, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
                            <TouchableOpacity style={styles.quickActionBoxDark} onPress={() => setActiveTab('users')}>
                                <View style={[styles.actionButtonInnerContent, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
                                    <Ionicons name="people-outline" size={20} color="#FFFFFF" style={{ [isRtl ? 'marginLeft' : 'marginRight']: 8 }} />
                                    <Text style={styles.quickActionTitleDark}>{t.employees}</Text>
                                </View>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.quickActionBoxGreen} onPress={() => setActiveTab('leaves')}>
                                <View style={[styles.actionButtonInnerContent, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
                                    <Ionicons name="document-text-outline" size={20} color="#FFFFFF" style={{ [isRtl ? 'marginLeft' : 'marginRight']: 8 }} />
                                    <Text style={styles.quickActionTitleDark}>{t.leaveApprovals}</Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* EMPLOYEES TAB */}
                {activeTab === 'users' && (
                    <View style={[styles.tabContentContainer, { alignItems: isRtl ? 'flex-end' : 'flex-start' }]}>
                        <Text style={[styles.sectionHeaderTitle, { textAlign: isRtl ? 'right' : 'left' }]}>{t.empDirectory}</Text>
                        <Text style={[styles.sectionHeaderSubtitle, { textAlign: isRtl ? 'right' : 'left' }]}>{t.empDirectorySub}</Text>

                        {safeUsers.length === 0 ? (
                            <View style={styles.emptyStateContainer}>
                                <Ionicons name="people-outline" size={36} color="#98A2B3" />
                                <Text style={styles.emptyStateText}>{t.noEmployees}</Text>
                            </View>
                        ) : (
                            safeUsers.map((user) => (
                                <View key={user._id || user.id} style={styles.employeeCardBox}>
                                    <TouchableOpacity 
                                        style={[styles.employeeCardMain, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}
                                        onPress={() => { setSelectedEmployee(user); setCurrentAdminView('employee_detail'); }}
                                    >
                                        <Image source={{ uri: user.avatar || PLACEHOLDER_AVATAR }} style={styles.employeeAvatar} />
                                        <View style={{ flex: 1, [isRtl ? 'marginRight' : 'marginLeft']: 12, alignItems: isRtl ? 'flex-end' : 'flex-start' }}>
                                            <Text style={styles.employeeNameText}>{user.name}</Text>
                                            <Text style={styles.employeeSubText}>{user.employeeId} · {t.tapForDetails}</Text>
                                        </View>
                                        <Ionicons name={isRtl ? "chevron-back" : "chevron-forward"} size={18} color="#667085" />
                                    </TouchableOpacity>

                                    <View style={[styles.employeeCardFooter, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
                                        <View style={[styles.statusCapsuleBadge, user.isBlocked ? styles.badgeBlockedBg : styles.badgeActiveBg, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
                                            <View style={[styles.statusDotMarker, user.isBlocked ? { backgroundColor: '#B42318' } : { backgroundColor: '#027A48' }, { [isRtl ? 'marginLeft' : 'marginRight']: 6 }]} />
                                            <Text style={[styles.statusCapsuleText, user.isBlocked ? { color: '#B42318' } : { color: '#027A48' }]}>
                                                {user.isBlocked ? t.blockedAccess : t.activeCapped}
                                            </Text>
                                        </View>

                                        <TouchableOpacity 
                                            style={[styles.actionToggleButton, user.isBlocked ? styles.unblockBtnStyle : styles.blockBtnStyle]}
                                            onPress={() => handleToggleBlock(user._id || user.id, user.isBlocked, user.name)}
                                        >
                                            <Text style={[styles.actionToggleText, user.isBlocked ? { color: '#027A48' } : { color: '#B42318' }]}>
                                                {user.isBlocked ? t.unblock : t.block}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))
                        )}
                    </View>
                )}

                {/* GEOFENCES TAB */}
                {activeTab === 'locations' && (
                    <View style={[styles.tabContentContainer, { alignItems: isRtl ? 'flex-end' : 'flex-start' }]}>
                        <Text style={[styles.sectionHeaderTitle, { textAlign: isRtl ? 'right' : 'left' }]}>{t.geoWorkLocations}</Text>
                        <Text style={[styles.sectionHeaderSubtitle, { textAlign: isRtl ? 'right' : 'left' }]}>{t.geoWorkSub}</Text>

                        {safeLocations.length === 0 ? (
                            <View style={styles.emptyStateContainer}>
                                <Ionicons name="location-outline" size={36} color="#98A2B3" />
                                <Text style={styles.emptyStateText}>{t.noLocations}</Text>
                            </View>
                        ) : (
                            safeLocations.map((loc) => (
                                <View key={loc._id || loc.id} style={styles.locationItemCard}>
                                    <View style={[styles.locationHeaderRow, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
                                        <View style={styles.locationIconFrame}>
                                            <Ionicons name="business-outline" size={18} color="#0B6655" />
                                        </View>
                                        <View style={{ flex: 1, [isRtl ? 'marginRight' : 'marginLeft']: 12, alignItems: isRtl ? 'flex-end' : 'flex-start' }}>
                                            <Text style={styles.locationNameText}>{loc.name} ({loc.code})</Text>
                                            <Text style={styles.locationCoordinatesText}>City: {loc.city || 'Multan'}</Text>
                                        </View>
                                        <View style={styles.radiusTag}>
                                            <Text style={styles.radiusTagText}>{loc.boundaryRadius || 500}m</Text>
                                        </View>
                                    </View>
                                </View>
                            ))
                        )}
                    </View>
                )}

                {/* LEAVES TAB */}
                {activeTab === 'leaves' && (
                    <View style={[styles.tabContentContainer, { alignItems: isRtl ? 'flex-end' : 'flex-start' }]}>
                        <Text style={[styles.sectionHeaderTitle, { textAlign: isRtl ? 'right' : 'left' }]}>{t.leaveApprovalsCenter}</Text>
                        <Text style={[styles.sectionHeaderSubtitle, { textAlign: isRtl ? 'right' : 'left' }]}>{t.leaveApprovalsSub}</Text>

                        {safeNotifications.length === 0 ? (
                            <View style={styles.emptyStateContainer}>
                                <Ionicons name="document-text-outline" size={36} color="#98A2B3" />
                                <Text style={styles.emptyStateText}>{t.noLeaveRequests}</Text>
                            </View>
                        ) : (
                            safeNotifications.map((item) => (
                                <TouchableOpacity 
                                    key={item.id} 
                                    style={styles.locationItemCard}
                                    onPress={() => {
                                        const matchedUser = safeUsers.find(u => u.employeeId === item.employeeId) || { employeeId: item.employeeId, name: item.name };
                                        setSelectedEmployee(matchedUser);
                                        setCurrentAdminView('employee_detail');
                                    }}
                                >
                                    <View style={[styles.locationHeaderRow, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
                                        <View style={[styles.locationIconFrame, { backgroundColor: '#FFFAEB' }]}>
                                            <Ionicons name="calendar-outline" size={18} color="#B24E00" />
                                        </View>
                                        <View style={{ flex: 1, [isRtl ? 'marginRight' : 'marginLeft']: 12, alignItems: isRtl ? 'flex-end' : 'flex-start' }}>
                                            <Text style={styles.locationNameText}>{item.name} <Text style={{ fontSize: 12, color: '#667085' }}>({item.employeeId})</Text></Text>
                                            <Text style={styles.locationCoordinatesText}>{item.message}</Text>
                                        </View>
                                        <View style={[
                                            styles.statusCapsuleBadge,
                                            item.status === 'approved' ? styles.badgeActiveBg :
                                            item.status === 'rejected' ? styles.badgeBlockedBg : styles.badgePendingBg
                                        ]}>
                                            <Text style={[
                                                styles.statusCapsuleText,
                                                item.status === 'approved' ? { color: '#027A48' } :
                                                item.status === 'rejected' ? { color: '#B42318' } : { color: '#B24E00' }
                                            ]}>
                                                {item.status.toUpperCase()}
                                            </Text>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            ))
                        )}
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FAF7F2' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 54 : 36, paddingBottom: 16, backgroundColor: '#FAF7F2', borderBottomWidth: 1, borderBottomColor: '#EAE5DF' },
    brandSection: { flexDirection: 'row', alignItems: 'center' },
    logoBox: { width: 38, height: 38, borderRadius: 10, backgroundColor: '#1A332C', justifyContent: 'center', alignItems: 'center' },
    logoText: { color: '#FFFFFF', fontSize: 20, fontWeight: 'bold' },
    brandTitle: { fontSize: 16, fontWeight: '700', color: '#101828' },
    brandSubtitle: { fontSize: 10, fontWeight: '600', color: '#667085', letterSpacing: 0.5 },
    headerActions: { flexDirection: 'row', alignItems: 'center' },
    notificationBellBtn: { width: 38, height: 38, borderRadius: 10, backgroundColor: '#EAE5DF', justifyContent: 'center', alignItems: 'center', position: 'relative' },
    notificationBadgeDot: { position: 'absolute', top: -4, right: -4, backgroundColor: '#D92D20', borderRadius: 9, minWidth: 18, height: 18, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4, borderWidth: 1.5, borderColor: '#FFFFFF' },
    notificationBadgeText: { color: '#FFFFFF', fontSize: 9, fontWeight: '700' },
    logoutButton: { width: 38, height: 38, borderRadius: 10, backgroundColor: '#EAE5DF', justifyContent: 'center', alignItems: 'center' },
    tabsWrapper: { backgroundColor: '#FAF7F2', borderBottomWidth: 1, borderBottomColor: '#EAE5DF' },
    tabsScrollContent: { paddingHorizontal: 16, paddingVertical: 12 },
    tabButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: 'transparent', marginHorizontal: 4 },
    tabButtonActive: { backgroundColor: '#C8DDD7', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 1 },
    tabButtonText: { fontSize: 13, fontWeight: '600', color: '#667085' },
    tabButtonTextActive: { color: '#1A332C', fontWeight: '700' },
    mainContent: { flex: 1 },
    loadingOverlay: { paddingVertical: 12, alignItems: 'center' },
    tabContentContainer: { padding: 20, width: '100%' },
    sectionHeaderTitle: { fontSize: 20, fontWeight: '800', color: '#101828' },
    sectionHeaderSubtitle: { fontSize: 13, color: '#667085', marginTop: 4, marginBottom: 20, lineHeight: 18 },
    metricsGridContainer: { width: '100%' },
    metricsGridRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    metricCard: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', marginHorizontal: 4, borderWidth: 1, borderColor: '#EAE5DF', shadowColor: '#101828', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 2, elevation: 1 },
    metricIconBox: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    metricTextData: { flex: 1 },
    metricCardValue: { fontSize: 22, fontWeight: '800', color: '#101828' },
    metricCardLabel: { fontSize: 11, fontWeight: '600', color: '#667085', marginTop: 2 },
    quickActionCardsRow: { flexDirection: 'row', justifyContent: 'space-between', marginHorizontal: -4, width: '100%' },
    quickActionBoxDark: { flex: 1, backgroundColor: '#2C4A42', borderRadius: 16, paddingVertical: 18, paddingHorizontal: 16, marginHorizontal: 4, justifyContent: 'center', alignItems: 'center', shadowColor: '#101828', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
    quickActionBoxGreen: { flex: 1, backgroundColor: '#7C9A8E', borderRadius: 16, paddingVertical: 18, paddingHorizontal: 16, marginHorizontal: 4, justifyContent: 'center', alignItems: 'center', shadowColor: '#101828', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
    actionButtonInnerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
    quickActionTitleDark: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
    emptyStateContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#EAE5DF', width: '100%' },
    emptyStateText: { fontSize: 14, color: '#667085', fontWeight: '500', marginTop: 12 },
    employeeCardBox: { backgroundColor: '#FFFFFF', borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#EAE5DF', overflow: 'hidden', width: '100%' },
    employeeCardMain: { flexDirection: 'row', alignItems: 'center', padding: 16 },
    employeeAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F2F4F7' },
    employeeNameText: { fontSize: 15, fontWeight: '700', color: '#101828' },
    employeeSubText: { fontSize: 12, color: '#667085', marginTop: 2 },
    employeeCardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FAF7F2', borderTopWidth: 1, borderTopColor: '#EAE5DF' },
    statusCapsuleBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    badgeActiveBg: { backgroundColor: '#ECFDF3' },
    badgeBlockedBg: { backgroundColor: '#FEF3F2' },
    badgePendingBg: { backgroundColor: '#FFFAEB' },
    statusDotMarker: { width: 6, height: 6, borderRadius: 3 },
    statusCapsuleText: { fontSize: 11, fontWeight: '700' },
    actionToggleButton: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 6, backgroundColor: '#FFFFFF', borderWidth: 1 },
    blockBtnStyle: { borderColor: '#FECDCA' },
    unblockBtnStyle: { borderColor: '#A3E635' },
    actionToggleText: { fontSize: 12, fontWeight: '700' },
    locationItemCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#EAE5DF', width: '100%' },
    locationHeaderRow: { flexDirection: 'row', alignItems: 'center' },
    locationIconFrame: { width: 38, height: 38, borderRadius: 8, backgroundColor: '#F4FBF9', justifyContent: 'center', alignItems: 'center' },
    locationNameText: { fontSize: 15, fontWeight: '700', color: '#101828' },
    locationCoordinatesText: { fontSize: 12, color: '#667085', marginTop: 2 },
    radiusTag: { backgroundColor: '#F4FBF9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: '#E6F4F1' },
    radiusTagText: { fontSize: 11, fontWeight: '700', color: '#0B6655' }
});