import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Dimensions, ActivityIndicator, Linking, AppState, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// 🎯 Target Office Location: Madni Park, Gulshan Town, Multan
const TARGET_SITE = {
    latitude: 30.20323,
    longitude: 71.51481,
    name: "Madni Park, Gulshan Town",
    address: "New Multan, Multan, Pakistan"
};

const ALLOWED_RADIUS = 500;

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3;
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;
    const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) + Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

export default function CheckOutScreen({ onBack, employeeId, serverAddress }) {
    const [viewState, setViewState] = useState('loading');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [distanceAway, setDistanceAway] = useState(0);
    const [gpsAccuracy, setGpsAccuracy] = useState(0);
    const [punchTime, setPunchTime] = useState('--:--');
    const [currentCoordinates, setCurrentCoordinates] = useState(null);

    const appStateRef = useRef(AppState.currentState);
    const radarPulse = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const pulseAnimation = Animated.loop(
            Animated.sequence([
                Animated.timing(radarPulse, { toValue: 1, duration: 1200, useNativeDriver: true }),
                Animated.timing(radarPulse, { toValue: 0, duration: 1200, useNativeDriver: true }),
            ])
        );
        pulseAnimation.start();
        return () => pulseAnimation.stop();
    }, [radarPulse]);

    const initLocationCheck = async () => {
        setViewState('loading');
        try {
            let { status } = await Location.getForegroundPermissionsAsync();
            if (status !== 'granted') {
                const askPermission = await Location.requestForegroundPermissionsAsync();
                if (askPermission.status !== 'granted') {
                    setViewState('no_permission');
                    return;
                }
            }
            const isGpsEnabled = await Location.hasServicesEnabledAsync();
            if (!isGpsEnabled) {
                setViewState('gps_off');
                return;
            }
            const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
            const coords = location.coords;
            setCurrentCoordinates(coords);
            setGpsAccuracy(coords.accuracy || 0);

            const distance = calculateDistance(coords.latitude, coords.longitude, TARGET_SITE.latitude, TARGET_SITE.longitude);
            setDistanceAway(distance);

            if (distance <= ALLOWED_RADIUS) {
                setViewState('within_range');
            } else {
                setViewState('low_accuracy');
            }
        } catch (err) {
            setViewState('network_error');
        }
    };

    useEffect(() => {
        const subscription = AppState.addEventListener('change', (nextAppState) => {
            if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
                initLocationCheck();
            }
            appStateRef.current = nextAppState;
        });
        initLocationCheck();
        return () => subscription.remove();
    }, []);

    const triggerCheckOutSubmit = async () => {
        if (!currentCoordinates || distanceAway > ALLOWED_RADIUS || isSubmitting) return;
        setIsSubmitting(true);
        const now = new Date();
        const formattedTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
        const formattedDate = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

        try {
            const cleanBaseUrl = (serverAddress || 'http://192.168.100.199:8081').replace(/\/+$/, '');
            const response = await fetch(`${cleanBaseUrl}/api/attendance/punch`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    employeeId: employeeId || 'EMP-10482',
                    action: 'OUT',
                    date: formattedDate,
                    time: formattedTime,
                    coordinates: {
                        latitude: currentCoordinates.latitude,
                        longitude: currentCoordinates.longitude
                    }
                })
            });
            const responseText = await response.text();
            let json = {};
            try { json = JSON.parse(responseText); } catch (e) { }

            if (response.ok && json.success === true) {
                setPunchTime(formattedTime);
                setViewState('success');
            } else {
                setViewState('network_error');
            }
        } catch (err) {
            setViewState('network_error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const outerScale = radarPulse.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1.12] });
    const midScale = radarPulse.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1.08] });
    const currentButtonTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });

    return (
        <View style={styles.mainWrapper}>
            <View style={styles.navTopHeaderBar}>
                <TouchableOpacity onPress={onBack} style={styles.headerBackArrowLink}>
                    <Ionicons name="chevron-back" size={20} color="#344054" />
                </TouchableOpacity>
                <Text style={styles.navBarHeadingCenterTitle}>Check-out</Text>
                <View style={styles.headerRightBoxSpace} />
            </View>

            {(viewState === 'within_range' || viewState === 'success') && (
                <View style={styles.topGreenStatusAlertInlineStrip}>
                    <Text style={styles.topGreenStatusAlertInlineStripText}>You are inside the site boundary</Text>
                    <Ionicons name="checkmark-circle" size={16} color="#0B6655" />
                </View>
            )}

            <ScrollView contentContainerStyle={styles.scrollContentLayout} scrollEnabled={false}>
                <View style={styles.centralRippleGraphicsContainer}>
                    {viewState === 'loading' && (
                        <View style={[styles.solidCircleBadgeIcon, { backgroundColor: '#ECEFEF' }]}>
                            <Ionicons name="location" size={32} color="#0B6655" />
                        </View>
                    )}
                    {viewState === 'no_permission' && (
                        <View style={[styles.solidCircleBadgeIcon, { backgroundColor: '#ECEFEF' }]}>
                            <Ionicons name="lock-closed" size={32} color="#475467" />
                        </View>
                    )}
                    {viewState === 'gps_off' && (
                        <View style={[styles.solidCircleBadgeIcon, { backgroundColor: '#ECEFEF' }]}>
                            <Ionicons name="locate-outline" size={32} color="#475467" />
                        </View>
                    )}
                    {viewState === 'low_accuracy' && (
                        <Animated.View style={[styles.outerRadarRingOrangeLayer, { transform: [{ scale: outerScale }] }]}>
                            <Animated.View style={[styles.midRadarRingOrangeLayer, { transform: [{ scale: midScale }] }]}>
                                <View style={[styles.solidCircleBadgeIcon, { backgroundColor: '#B24E00' }]}>
                                    <Ionicons name="location" size={32} color="#FFFFFF" />
                                </View>
                            </Animated.View>
                        </Animated.View>
                    )}
                    {viewState === 'network_error' && (
                        <View style={[styles.solidCircleBadgeIcon, { backgroundColor: '#FEF3F2' }]}>
                            <Ionicons name="wifi-outline" size={32} color="#D92D20" />
                        </View>
                    )}
                    {(viewState === 'within_range') && (
                        <Animated.View style={[styles.outerRadarRingGreenLayer, { transform: [{ scale: outerScale }] }]}>
                            <Animated.View style={[styles.midRadarRingGreenLayer, { transform: [{ scale: midScale }] }]}>
                                <View style={[styles.solidCircleBadgeIcon, { backgroundColor: '#0B6655' }]}>
                                    <Ionicons name="location" size={32} color="#FFFFFF" />
                                </View>
                            </Animated.View>
                        </Animated.View>
                    )}
                    {viewState === 'success' && (
                        <Animated.View style={[styles.outerRadarRingGreenLayer, { transform: [{ scale: outerScale }] }]}>
                            <Animated.View style={[styles.midRadarRingGreenLayer, { transform: [{ scale: midScale }] }]}>
                                <View style={[styles.solidCircleBadgeIcon, { backgroundColor: '#0B6655' }]}>
                                    <Ionicons name="checkmark" size={32} color="#FFFFFF" />
                                </View>
                            </Animated.View>
                        </Animated.View>
                    )}
                </View>

                <View style={styles.statusDescriptionTextArea}>
                    {viewState === 'loading' && <Text style={styles.mainStatusAlertTitleText}>Loading location...</Text>}
                    {viewState === 'no_permission' && (
                        <>
                            <Text style={styles.mainStatusAlertTitleText}>Location permission needed</Text>
                            <Text style={styles.subStatusInstructionBodyText}>Allow location permissions to check out at site.</Text>
                        </>
                    )}
                    {viewState === 'gps_off' && (
                        <>
                            <Text style={styles.mainStatusAlertTitleText}>Location services are off</Text>
                            <Text style={styles.subStatusInstructionBodyText}>Turn on location (GPS) in your phone settings, then try again.</Text>
                        </>
                    )}
                    {viewState === 'low_accuracy' && (
                        <>
                            <Text style={[styles.mainStatusAlertTitleText, { color: '#B24E00' }]}>Outside site boundary</Text>
                            <Text style={styles.subStatusInstructionBodyText}>You are {Math.round(distanceAway)}m away. Move within {ALLOWED_RADIUS}m and try again.</Text>
                        </>
                    )}
                    {viewState === 'network_error' && (
                        <>
                            <Text style={[styles.mainStatusAlertTitleText, { color: '#D92D20' }]}>Not recorded</Text>
                            <Text style={styles.subStatusInstructionBodyText}>Check your connection and try again.</Text>
                        </>
                    )}
                    {viewState === 'within_range' && (
                        <>
                            <Text style={[styles.mainStatusAlertTitleText, { color: '#0B6655' }]}>Within range</Text>
                            <Text style={styles.subStatusInstructionBodyText}>You can check out now</Text>
                        </>
                    )}
                    {viewState === 'success' && (
                        <>
                            <Text style={[styles.mainStatusAlertTitleText, { color: '#0B6655' }]}>Checked out</Text>
                            <Text style={styles.clockBigTickingText}>{punchTime}</Text>
                            <Text style={styles.serverInfoMetaTagsSubtext}>Check-out recorded · Source: Mobile App</Text>
                        </>
                    )}
                </View>

                <View style={styles.workSiteWhiteInformationCardBox}>
                    <View style={styles.workSiteCardLeftBlockRow}>
                        <View style={styles.fileIconBadgeContainerSpace}>
                            <Ionicons name="document-text-outline" size={20} color="#0B6655" />
                        </View>
                        <View style={styles.workSiteDetailsTextContent}>
                            <Text style={styles.workSiteLabelHeader}>Work site</Text>
                            <Text style={styles.workSiteRealNameTitle}>{TARGET_SITE.name}</Text>
                            <Text style={styles.workSiteAddressStringLabel}>{TARGET_SITE.address}</Text>
                            <Text style={styles.gpsAccuracyRealTimeMetricsMetaText}>{Math.round(distanceAway)}m away · ±{Math.round(gpsAccuracy)}m accuracy</Text>
                        </View>
                    </View>
                    <Ionicons name="navigate-outline" size={18} color="#0B6655" style={styles.navigationArrowCompassIcon} />
                </View>

                <View style={styles.actionFixedFooterButtonsContainer}>
                    {viewState === 'within_range' && (
                        <TouchableOpacity style={styles.primaryActionButtonNode} onPress={triggerCheckOutSubmit} disabled={isSubmitting}>
                            {isSubmitting ? (
                                <View style={styles.buttonLoaderRow}>
                                    <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
                                    <Text style={styles.primaryActionButtonTextLabel}>Checking out...</Text>
                                </View>
                            ) : (
                                <>
                                    <Text style={styles.primaryActionButtonTextLabel}>Check-out</Text>
                                    <Text style={styles.buttonInlineTimeTrackerText}>{currentButtonTime}</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    )}
                    {(viewState === 'no_permission' || viewState === 'gps_off') && (
                        <TouchableOpacity style={styles.primaryActionButtonNode} onPress={() => Linking.openSettings()}>
                            <Text style={styles.primaryActionButtonTextLabel}>Open Settings</Text>
                        </TouchableOpacity>
                    )}
                    {viewState === 'low_accuracy' && (
                        <>
                            <TouchableOpacity style={[styles.primaryActionButtonNode, { backgroundColor: '#BCD6D1' }]} disabled>
                                <Text style={styles.primaryActionButtonTextLabel}>Check-out</Text>
                                <Text style={styles.buttonInlineTimeTrackerText}>{currentButtonTime}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.secondaryButtonOutlineRow} onPress={initLocationCheck}>
                                <Ionicons name="navigate-outline" size={16} color="#344054" style={{ marginRight: 6 }} />
                                <Text style={styles.secondaryButtonOutlineRowText}>Check location again</Text>
                            </TouchableOpacity>
                        </>
                    )}
                    {viewState === 'network_error' && (
                        <TouchableOpacity style={styles.primaryActionButtonNode} onPress={initLocationCheck}>
                            <Text style={styles.primaryActionButtonTextLabel}>Try again</Text>
                        </TouchableOpacity>
                    )}
                    {viewState === 'success' && (
                        <TouchableOpacity style={styles.primaryActionButtonNode} onPress={onBack}>
                            <Text style={styles.primaryActionButtonTextLabel}>Done</Text>
                        </TouchableOpacity>
                    )}
                    <View style={styles.hourlyPresenceStickyBannerBox}>
                        <Ionicons name="time-outline" size={16} color="#0B6655" style={{ marginRight: 6 }} />
                        <Text style={styles.hourlyPresenceBannerLabelText}>Hourly presence is on — it stops when you check out.</Text>
                    </View>
                    <Text style={styles.bottomLegalInstructionDisclaimerNote}>The server checks your location and records the time. The on-screen "within range" is guidance only.</Text>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    mainWrapper: { flex: 1, backgroundColor: '#F9FAFB' },
    navTopHeaderBar: { height: 56, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderColor: '#EAECF0', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
    headerBackArrowLink: { padding: 4 },
    navBarHeadingCenterTitle: { fontSize: 16, fontWeight: '700', color: '#101828' },
    headerRightBoxSpace: { width: 28 },
    topGreenStatusAlertInlineStrip: { flexDirection: 'row', backgroundColor: '#F4FBF7', height: 40, width: '100%', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20 },
    topGreenStatusAlertInlineStripText: { color: '#027A48', fontSize: 13, fontWeight: '600' },
    scrollContentLayout: { height: SCREEN_HEIGHT - 56, justifyContent: 'flex-start', alignItems: 'center', paddingHorizontal: 20 },
    centralRippleGraphicsContainer: { height: 180, width: '100%', justifyContent: 'center', alignItems: 'center', marginTop: 14 },
    solidCircleBadgeIcon: { width: 72, height: 72, borderRadius: 36, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
    outerRadarRingGreenLayer: { width: 170, height: 170, borderRadius: 85, backgroundColor: '#E6F4F1', justifyContent: 'center', alignItems: 'center' },
    midRadarRingGreenLayer: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#CCEBE7', justifyContent: 'center', alignItems: 'center' },
    outerRadarRingOrangeLayer: { width: 170, height: 170, borderRadius: 85, backgroundColor: '#FFE6CC', justifyContent: 'center', alignItems: 'center' },
    midRadarRingOrangeLayer: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#FFCC99', justifyContent: 'center', alignItems: 'center' },
    statusDescriptionTextArea: { width: '100%', alignItems: 'center', marginTop: 12, paddingHorizontal: 10, minHeight: 70 },
    mainStatusAlertTitleText: { fontSize: 18, fontWeight: '700', textAlign: 'center', color: '#101828' },
    subStatusInstructionBodyText: { fontSize: 13, color: '#475467', textAlign: 'center', marginTop: 6, lineHeight: 18, fontWeight: '500' },
    clockBigTickingText: { fontSize: 34, fontWeight: '800', color: '#101828', marginTop: 8, letterSpacing: 1 },
    serverInfoMetaTagsSubtext: { fontSize: 12, color: '#667085', marginTop: 6, textAlign: 'center', fontWeight: '500' },
    workSiteWhiteInformationCardBox: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, width: '100%', borderWidth: 1, borderColor: '#EEF0F2', marginTop: 16, justifyContent: 'space-between', alignItems: 'flex-start' },
    workSiteCardLeftBlockRow: { flexDirection: 'row', flex: 1 },
    fileIconBadgeContainerSpace: { width: 36, height: 36, borderRadius: 8, backgroundColor: '#F0F9F8', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    workSiteDetailsTextContent: { flex: 1 },
    workSiteLabelHeader: { fontSize: 11, color: '#667085', fontWeight: '500' },
    workSiteRealNameTitle: { fontSize: 14, fontWeight: '700', color: '#101828', marginTop: 2 },
    workSiteAddressStringLabel: { fontSize: 12, color: '#475467', marginTop: 2 },
    gpsAccuracyRealTimeMetricsMetaText: { fontSize: 12, color: '#98A2B3', marginTop: 6, fontWeight: '500' },
    navigationArrowCompassIcon: { marginTop: 2, marginRight: 2 },
    actionFixedFooterButtonsContainer: { width: '100%', position: 'absolute', bottom: 24, paddingHorizontal: 0 },
    primaryActionButtonNode: { backgroundColor: '#0B6655', height: 48, borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', width: '100%' },
    buttonLoaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
    primaryActionButtonTextLabel: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
    buttonInlineTimeTrackerText: { color: '#A3C7C1', fontSize: 13, fontWeight: '500', marginLeft: 8 },
    secondaryButtonOutlineRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 10, paddingVertical: 8 },
    secondaryButtonOutlineRowText: { color: '#344054', fontSize: 13, fontWeight: '600' },
    hourlyPresenceStickyBannerBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 14, backgroundColor: '#F0F9F8', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
    hourlyPresenceBannerLabelText: { fontSize: 12, color: '#0B6655', fontWeight: '500' },
    bottomLegalInstructionDisclaimerNote: { fontSize: 11, color: '#98A2B3', textAlign: 'center', marginTop: 8, lineHeight: 15 }
});