import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Platform, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { translations, getGlobalLang, subscribeLang } from '../../../i18n';

const PLACEHOLDER_AVATAR = 'https://via.placeholder.com/150';

export default function EmployeeNotificationsScreen({ 
    notifications, 
    onBack, 
    currentEmployeeId, 
    currentEmployeeName 
}) {
    const [currentLang, setCurrentLang] = useState(getGlobalLang());
    const [safeNotifications, setSafeNotifications] = useState(notifications || []);
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState([]);

    useEffect(() => {
        const unsubscribe = subscribeLang((newLang) => {
            setCurrentLang(newLang);
        });
        return () => unsubscribe();
    }, []);

    const t = translations[currentLang];
    const isRtl = currentLang === 'ur' || currentLang === 'ar';

    const handleLongPress = (id) => {
        setIsSelectionMode(true);
        setSelectedIds([id]);
    };

    const handleCardPress = (id) => {
        if (isSelectionMode) {
            if (selectedIds.includes(id)) {
                const updated = selectedIds.filter(item => item !== id);
                setSelectedIds(updated);
                if (updated.length === 0) setIsSelectionMode(false);
            } else {
                setSelectedIds([...selectedIds, id]);
            }
        }
    };

    const handleSelectAll = () => {
        if (selectedIds.length === safeNotifications.length) {
            setSelectedIds([]);
            setIsSelectionMode(false);
        } else {
            const allIds = safeNotifications.map(item => item.id || item._id);
            setSelectedIds(allIds);
        }
    };

    const handleDeleteSelected = () => {
        Alert.alert(
            t.deleteModalTitle,
            t.deleteModalMsg(selectedIds.length),
            [
                { text: t.cancelBtn, style: "cancel" },
                {
                    text: t.deleteBtn,
                    style: "destructive",
                    onPress: () => {
                        const remaining = safeNotifications.filter(item => !selectedIds.includes(item.id || item._id));
                        setSafeNotifications(remaining);
                        setSelectedIds([]);
                        setIsSelectionMode(false);
                    }
                }
            ]
        );
    };

    return (
        <View style={[styles.container, { direction: isRtl ? 'rtl' : 'ltr' }]}>
            <View style={[styles.header, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
                <TouchableOpacity onPress={onBack} style={styles.backBtn}>
                    <Ionicons name={isRtl ? "arrow-forward" : "arrow-back"} size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>
                    {isSelectionMode ? t.selectedCount(selectedIds.length) : t.notificationsTitle}
                </Text>

                {isSelectionMode ? (
                    <View style={{ flexDirection: isRtl ? 'row-reverse' : 'row', alignItems: 'center' }}>
                        <TouchableOpacity onPress={handleSelectAll} style={{ [isRtl ? 'marginLeft' : 'marginRight']: 15, [isRtl ? 'marginRight' : 'marginLeft']: 0 }}>
                            <Text style={{ color: '#FFF', fontSize: 13, fontWeight: '700' }}>{t.selectAllBtn}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleDeleteSelected} style={styles.deleteHeaderBtn}>
                            <Ionicons name="trash-outline" size={20} color="#B42318" />
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={{ width: 48 }} />
                )}
            </View>

            <ScrollView contentContainerStyle={styles.scrollArea} showsVerticalScrollIndicator={false}>
                {safeNotifications.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <View style={styles.emptyIconBox}>
                            <Ionicons name="notifications-off-outline" size={48} color="#98A2B3" />
                        </View>
                        <Text style={styles.emptyTitle}>{t.noNotificationsTitle}</Text>
                        <Text style={styles.emptySubtitle}>{t.noNotificationsSubtitle}</Text>
                    </View>
                ) : (
                    safeNotifications.map((item, index) => {
                        const itemId = item.id || item._id || index;
                        const isSelected = selectedIds.includes(itemId);
                        const statusLowerCase = (item.status || '').toLowerCase();
                        let accentColor = '#D0D5DD'; 
                        let statusBgColor = '#F2F4F7'; 
                        let statusTxtColor = '#344054'; 
                        let iconName = 'clock-outline'; 
                        let statusText = item.status;

                        if (statusLowerCase === 'approved') {
                            accentColor = '#0B6655'; 
                            statusBgColor = '#E6F4F1';
                            statusTxtColor = '#0B6655';
                            iconName = 'checkmark-circle-outline';
                        } else if (statusLowerCase === 'rejected') {
                            accentColor = '#B42318'; 
                            statusBgColor = '#FEE4E2';
                            statusTxtColor = '#B42318';
                            iconName = 'close-circle-outline';
                        } else if (statusLowerCase === 'pending') {
                            accentColor = '#D97706'; 
                            statusBgColor = '#FFFAEB';
                            statusTxtColor = '#D97706';
                            iconName = 'time-outline';
                        }

                        const timeAgo = item.time || '1h ago';
                        
                        let rawLeaveType = item.leaveTypeName || item.type || 'Leave';
                        let cleanLeaveTitle = rawLeaveType.replace(/leave/gi, '').trim();
                        const finalLeaveHeaderTitle = `${cleanLeaveTitle} Leave ${statusText}`.toUpperCase();

                        const displayName = currentEmployeeName || item.name || 'User';
                        const displayId = currentEmployeeId || item.employeeId || 'EMP-10482';

                        return (
                            <TouchableOpacity
                                key={itemId}
                                activeOpacity={0.9}
                                onLongPress={() => handleLongPress(itemId)}
                                onPress={() => handleCardPress(itemId)}
                                style={[
                                    styles.notifCard, 
                                    isRtl ? { borderRightWidth: 6, borderLeftWidth: 0, borderRightColor: accentColor } : { borderLeftWidth: 6, borderLeftColor: accentColor },
                                    isSelected && styles.selectedCardStyle
                                ]}
                            >
                                <View style={[styles.cardHeaderRow, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
                                    <View style={[styles.headerLeft, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
                                        {isSelectionMode ? (
                                            <View style={[styles.checkboxCircle, isSelected && styles.checkedCircle, { [isRtl ? 'marginLeft' : 'marginRight']: 10, [isRtl ? 'marginRight' : 'marginLeft']: 0 }]}>
                                                {isSelected && <Ionicons name="checkmark" size={12} color="#FFF" />}
                                            </View>
                                        ) : (
                                            <Ionicons name={iconName} size={20} color={statusTxtColor} style={{ [isRtl ? 'marginLeft' : 'marginRight']: 10, [isRtl ? 'marginRight' : 'marginLeft']: 0 }} />
                                        )}
                                        <Text style={[styles.notifTitle, { textAlign: isRtl ? 'right' : 'left' }]}>{finalLeaveHeaderTitle}</Text>
                                    </View>
                                    <View style={[styles.statusBadge, { backgroundColor: statusBgColor }]}>
                                        <Text style={[styles.statusBadgeText, { color: statusTxtColor }]}>{statusText}</Text>
                                    </View>
                                </View>

                                <View style={[styles.userInfoRow, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
                                    <Image source={{ uri: item.avatar || PLACEHOLDER_AVATAR }} style={[styles.avatar, { [isRtl ? 'marginLeft' : 'marginRight']: 12, [isRtl ? 'marginRight' : 'marginLeft']: 0 }]} />
                                    <View style={[styles.userInfoText, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
                                        <Text style={[styles.userNameText, { [isRtl ? 'marginLeft' : 'marginRight']: 6, [isRtl ? 'marginRight' : 'marginLeft']: 0 }]}>{displayName}</Text>
                                        <Text style={styles.empIdText}>({displayId})</Text>
                                    </View>
                                </View>

                                <View style={[styles.detailsRow, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
                                    <View style={[styles.detailItem, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
                                        <Ionicons name="calendar-outline" size={14} color="#667085" style={{ [isRtl ? 'marginLeft' : 'marginRight']: 6, [isRtl ? 'marginRight' : 'marginLeft']: 0 }} />
                                        <Text style={styles.detailText}>{t.datesLabel} {item.fromDate || item.dates || 'N/A'}</Text>
                                    </View>
                                    <Text style={styles.timeAgoText}>{timeAgo}</Text>
                                </View>
                            </TouchableOpacity>
                        );
                    })
                )}
                <View style={{ height: 90 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: Platform.OS === 'android' ? 36 : 16, paddingBottom: 16, backgroundColor: '#0B6655', borderBottomLeftRadius: 16, borderBottomRightRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 4 },
    backBtn: { width: 48, height: 48, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 20, fontWeight: '700', color: '#FFFFFF', flex: 1, textAlign: 'center' },
    deleteHeaderBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#FEE4E2', justifyContent: 'center', alignItems: 'center' },
    scrollArea: { padding: 16, alignItems: 'stretch' },
    notifCard: { backgroundColor: '#FFFFFF', borderRadius: 12, marginBottom: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
    selectedCardStyle: { backgroundColor: '#F0FDF4', borderColor: '#0B6655', borderWidth: 1 },
    checkboxCircle: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#D0D5DD', justifyContent: 'center', alignItems: 'center' },
    checkedCircle: { backgroundColor: '#0B6655', borderColor: '#0B6655' },
    cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    notifTitle: { fontSize: 13, fontWeight: '700', color: '#101828' },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    statusBadgeText: { fontSize: 11, fontWeight: '700' },
    userInfoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#EAECF0' },
    avatar: { width: 38, height: 38, borderRadius: 19 },
    userInfoText: { flex: 1, flexDirection: 'row', alignItems: 'center' },
    userNameText: { fontSize: 14, fontWeight: '600', color: '#101828' },
    empIdText: { fontSize: 12, color: '#667085', fontWeight: '500' },
    detailsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    detailItem: { flexDirection: 'row', alignItems: 'center' },
    detailText: { fontSize: 12, color: '#667085', fontWeight: '500' },
    timeAgoText: { fontSize: 11, color: '#98A2B3', fontWeight: '500' },
    emptyContainer: { alignItems: 'center', marginTop: 100, paddingHorizontal: 30 },
    emptyIconBox: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#E6F4F1', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: '#101828', marginBottom: 8 },
    emptySubtitle: { fontSize: 14, color: '#667085', textAlign: 'center', lineHeight: 20 }
});