import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { translations, getGlobalLang, subscribeLang } from '../../../i18n';

export default function AdminNotificationsScreen({ notifications, onBack, onSelectNotificationUser }) {
    const [currentLang, setCurrentLang] = useState(getGlobalLang());
    const [filteredNotifications, setFilteredNotifications] = useState([]);

    useEffect(() => {
        const unsubscribe = subscribeLang((newLang) => {
            setCurrentLang(newLang);
        });
        return () => unsubscribe();
    }, []);

    const t = translations[currentLang];
    const isRtl = currentLang === 'ur' || currentLang === 'ar';

    useEffect(() => {
        const safeNotifications = notifications || [];
        const now = new Date().getTime();
        const ONE_DAY_MS = 24 * 60 * 60 * 1000;

        const validNotifs = safeNotifications.filter((item) => {
            if (!item.createdAt && !item.timestamp) return true;
            const itemTime = new Date(item.createdAt || item.timestamp).getTime();
            return (now - itemTime) < ONE_DAY_MS;
        });

        setFilteredNotifications(validNotifs);
    }, [notifications]);

    return (
        <View style={[styles.container, { direction: isRtl ? 'rtl' : 'ltr' }]}>
            <View style={[styles.header, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
                <TouchableOpacity onPress={onBack} style={[styles.backBtn, { [isRtl ? 'marginLeft' : 'marginRight']: 12 }]}>
                    <Ionicons name={isRtl ? "arrow-forward" : "arrow-back"} size={22} color="#101828" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t.leaveNotifications}</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollArea} showsVerticalScrollIndicator={false}>
                {filteredNotifications.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <View style={styles.emptyIconBox}>
                            <Ionicons name="notifications-off-outline" size={28} color="#0B6655" />
                        </View>
                        <Text style={styles.emptyTitle}>{t.noLeaveAppsYet}</Text>
                        <Text style={styles.emptySubtitle}>{t.noLeaveAppsSub}</Text>
                    </View>
                ) : (
                    filteredNotifications.map((item, index) => (
                        <TouchableOpacity 
                            key={item.id || item._id || index} 
                            style={[styles.notifCard, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}
                            onPress={() => onSelectNotificationUser(item.employeeId)}
                        >
                            <View style={styles.iconBox}>
                                <Ionicons name="calendar-outline" size={20} color="#0B6655" />
                            </View>
                            <View style={{ flex: 1, [isRtl ? 'marginRight' : 'marginLeft']: 12, alignItems: isRtl ? 'flex-end' : 'flex-start' }}>
                                <Text style={styles.notifTitle}>{item.name} ({item.employeeId})</Text>
                                <Text style={[styles.notifMsg, { textAlign: isRtl ? 'right' : 'left' }]}>{item.message}</Text>
                                <Text style={styles.notifTime}>{item.time || t.justNow}</Text>
                            </View>
                            <Ionicons name={isRtl ? "chevron-back" : "chevron-forward"} size={16} color="#98A2B3" />
                        </TouchableOpacity>
                    ))
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F7F9FA', paddingTop: Platform.OS === 'android' ? 24 : 0 },
    header: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#FFF', borderBottomWidth: 1, borderColor: '#EAECF0' },
    backBtn: {},
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#101828' },
    scrollArea: { padding: 16, alignItems: 'stretch' },
    notifCard: { flexDirection: 'row', backgroundColor: '#FFF', padding: 14, borderRadius: 12, marginBottom: 10, alignItems: 'center', borderWidth: 1, borderColor: '#EAECF0', width: '100%' },
    iconBox: { width: 38, height: 38, borderRadius: 8, backgroundColor: '#E6F4F1', justifyContent: 'center', alignItems: 'center' },
    notifTitle: { fontSize: 14, fontWeight: '700', color: '#101828' },
    notifMsg: { fontSize: 12, color: '#475467', marginTop: 2 },
    notifTime: { fontSize: 10, color: '#98A2B3', marginTop: 4 },
    emptyContainer: { alignItems: 'center', marginTop: 40, paddingHorizontal: 20, width: '100%' },
    emptyIconBox: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#E6F4F1', justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
    emptyTitle: { fontSize: 16, fontWeight: '700', color: '#101828', marginBottom: 4 },
    emptySubtitle: { fontSize: 13, color: '#667085', textAlign: 'center', lineHeight: 18 }
});