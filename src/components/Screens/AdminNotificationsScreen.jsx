import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function AdminNotificationsScreen({ notifications, onBack, onSelectNotificationUser }) {
    // Safe check agar notifications undefined ho
    const safeNotifications = notifications || [];

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={onBack} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={22} color="#101828" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Leave Notifications</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollArea} showsVerticalScrollIndicator={false}>
                {safeNotifications.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <View style={styles.emptyIconBox}>
                            <Ionicons name="notifications-off-outline" size={28} color="#0B6655" />
                        </View>
                        <Text style={styles.emptyTitle}>No leave applications yet</Text>
                        <Text style={styles.emptySubtitle}>When employees apply for leave, their requests will appear here instantly.</Text>
                    </View>
                ) : (
                    safeNotifications.map((item) => (
                        <TouchableOpacity 
                            key={item.id} 
                            style={styles.notifCard}
                            onPress={() => onSelectNotificationUser(item.employeeId)}
                        >
                            <View style={styles.iconBox}>
                                <Ionicons name="calendar-outline" size={20} color="#0B6655" />
                            </View>
                            <View style={{ flex: 1, marginLeft: 12 }}>
                                <Text style={styles.notifTitle}>{item.name} ({item.employeeId})</Text>
                                <Text style={styles.notifMsg}>{item.message}</Text>
                                <Text style={styles.notifTime}>{item.time}</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={16} color="#98A2B3" />
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
    backBtn: { marginRight: 12 },
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