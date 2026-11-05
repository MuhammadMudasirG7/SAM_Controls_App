import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Animated,
  Easing,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { translations, getGlobalLang, subscribeLang } from '../../../i18n';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function HourlyPresenceScreen({
  onBack,
  employeeId = 'EMP-10482',
  serverAddress = 'http://192.168.100.199:8081',
  isSiteSupported = true,
  isUserCheckedIn = false
}) {
  const [currentLang, setCurrentLang] = useState(getGlobalLang());
  const [isEnabled, setIsEnabled] = useState(false);
  const [userCheckedIn, setUserCheckedIn] = useState(isUserCheckedIn);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [confirmationLogs, setConfirmationLogs] = useState([]);

  // Modals state
  const [showTurnOffModal, setShowTurnOffModal] = useState(false);
  const [showTurnOnModal, setShowTurnOnModal] = useState(false);

  const slideAnim = useRef(new Animated.Value(isUserCheckedIn && isEnabled ? 1 : 0)).current;
  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const unsubscribe = subscribeLang((newLang) => {
      setCurrentLang(newLang);
    });
    return () => unsubscribe();
  }, []);

  const t = translations[currentLang];
  const isRtl = currentLang === 'ur' || currentLang === 'ar';

  useEffect(() => {
    let spinAnimation;
    if (isEnabled && userCheckedIn) {
      spinValue.setValue(0);
      spinAnimation = Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 3000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      spinAnimation.start();
    } else {
      spinValue.setValue(0);
    }
    return () => spinAnimation?.stop();
  }, [isEnabled, userCheckedIn]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  useEffect(() => {
    fetchHourlyPresenceStatus();
  }, [serverAddress, employeeId]);

  const fetchHourlyPresenceStatus = async () => {
    try {
      const cleanBaseUrl = serverAddress.replace(/\/+$/, '');

      const statusRes = await fetch(`${cleanBaseUrl}/api/attendance/status?employeeId=${encodeURIComponent(employeeId)}`);
      const statusJson = await statusRes.json();
      const isCheckedInLive = statusJson.success && statusJson.state === 'checked_in';
      setUserCheckedIn(isCheckedInLive);

      const response = await fetch(`${cleanBaseUrl}/api/attendance/hourly-presence?employeeId=${encodeURIComponent(employeeId)}`);
      const json = await response.json();

      if (json.success) {
        const activeState = isCheckedInLive ? (json.enabled || false) : false;
        setIsEnabled(activeState);
        setConfirmationLogs(json.logs || []);

        Animated.timing(slideAnim, {
          toValue: activeState ? 1 : 0,
          duration: 200,
          easing: Easing.out(Easing.ease),
          useNativeDriver: false,
        }).start();
      }
    } catch (err) {
      console.log('Error fetching hourly presence:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePress = () => {
    if (!userCheckedIn) return;
    if (isEnabled) {
      setShowTurnOffModal(true);
    } else {
      setShowTurnOnModal(true);
    }
  };

  const executeToggle = async (newState) => {
    setIsUpdating(true);
    const cleanBaseUrl = serverAddress.replace(/\/+$/, '');

    Animated.timing(slideAnim, {
      toValue: newState ? 1 : 0,
      duration: 200,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();

    try {
      const response = await fetch(
        `${cleanBaseUrl}/api/attendance/hourly-presence`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ employeeId, enabled: newState }),
        }
      );

      const json = await response.json();
      if (response.ok && json.success) {
        setIsEnabled(newState);
        if (json.logs) setConfirmationLogs(json.logs);
      } else {
        setIsEnabled(!newState);
        Animated.timing(slideAnim, {
          toValue: !newState ? 1 : 0,
          duration: 200,
          useNativeDriver: false,
        }).start();
      }
    } catch (err) {
      console.log('Error updating toggle:', err);
      setIsEnabled(!newState);
    } finally {
      setIsUpdating(false);
      setShowTurnOffModal(false);
      setShowTurnOnModal(false);
    }
  };

  const translateX = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [2, 22]
  });

  if (!isSiteSupported) {
    return (
      <View style={[styles.mainWrapper, { direction: isRtl ? 'rtl' : 'ltr' }]}>
        <View style={[styles.navTopHeaderBar, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
          <TouchableOpacity onPress={onBack} style={styles.headerBackArrowLink}>
            <Ionicons name={isRtl ? "chevron-forward" : "chevron-back"} size={22} color="#1D2939" />
          </TouchableOpacity>
          <Text style={styles.navBarHeadingCenterTitle}>{t.hourlyPresenceTitle}</Text>
          <View style={styles.headerRightBoxSpace} />
        </View>
        <View style={styles.disabledScreenCenterContainer}>
          <View style={styles.disabledIconOuterCircle}>
            <Ionicons name="ban-outline" size={32} color="#F04438" />
          </View>
          <Text style={[styles.disabledMainHeadingText, { textAlign: isRtl ? 'right' : 'center' }]}>{t.notAvailableSiteTitle}</Text>
          <Text style={[styles.disabledSubParagraphText, { textAlign: isRtl ? 'right' : 'center' }]}>
            {t.notAvailableSiteDesc}
          </Text>
          <TouchableOpacity style={styles.fallbackHomeActionButtonNode} onPress={onBack}>
            <Text style={styles.fallbackHomeActionButtonText}>{t.goBackBtn}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.mainWrapper, { direction: isRtl ? 'rtl' : 'ltr' }]}>
      <View style={[styles.navTopHeaderBar, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
        <TouchableOpacity onPress={onBack} style={styles.headerBackArrowLink}>
          <Ionicons name={isRtl ? "chevron-forward" : "chevron-back"} size={22} color="#1D2939" />
        </TouchableOpacity>
        <Text style={styles.navBarHeadingCenterTitle}>{t.hourlyPresenceTitle}</Text>
        <View style={styles.headerRightBoxSpace} />
      </View>

      {loading ? (
        <View style={styles.loadingStateContainer}>
          <ActivityIndicator size="large" color="#0B6655" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContentLayout} showsVerticalScrollIndicator={false}>

          <View style={styles.headerStateIllustrationContainer}>
            <View style={[styles.illustrationIconCircleBadge, (!isEnabled || !userCheckedIn) && styles.illustrationIconCircleBadgeOff]}>
              <Animated.View style={isEnabled && userCheckedIn ? { transform: [{ rotate: spin }] } : {}}>
                <Ionicons name="time-outline" size={40} color={isEnabled && userCheckedIn ? "#0B6655" : "#667085"} />
              </Animated.View>
              <View style={[styles.miniArrowIndicatorBadge, isRtl ? { left: 2, right: 'auto' } : { right: 2, left: 'auto' }, (!isEnabled || !userCheckedIn) && { backgroundColor: '#667085' }]}>
                <Ionicons name="flash" size={10} color="#FFFFFF" />
              </View>
            </View>
            <Text style={[styles.mainStatusStateHeadingTitleText, { textAlign: isRtl ? 'right' : 'center' }]}>
              {!userCheckedIn ? t.hourlyPaused : (isEnabled ? t.hourlyActive : t.hourlyInactive)}
            </Text>
            <Text style={[styles.subStatusInstructionParagraphBodyText, { textAlign: isRtl ? 'right' : 'center' }]}>
              {!userCheckedIn ? t.notCheckedInNotice : t.checkedInNotice}
            </Text>
          </View>

          <View style={[styles.toggleSelectionMainCardBox, { flexDirection: isRtl ? 'row-reverse' : 'row' }, !userCheckedIn && styles.toggleSelectionMainCardBoxDisabled]}>
            <View style={[styles.toggleCardLeftBlockRow, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
              <View style={[styles.innerToggleIconBadgeContainer, isRtl ? { marginLeft: 12, marginRight: 0 } : { marginRight: 12, marginLeft: 0 }]}>
                <Ionicons name="locate-outline" size={20} color="#0B6655" />
              </View>
              <View style={[styles.toggleLabelsContentContainer, { alignItems: isRtl ? 'flex-end' : 'flex-start' }]}>
                <Text style={[styles.toggleMainLabelTitleText, { textAlign: isRtl ? 'right' : 'left' }]}>{t.hourlyPresenceTitle}</Text>
                <Text style={[styles.toggleSubLabelDescriptionText, { textAlign: isRtl ? 'right' : 'left' }]}>{t.everyHourTracking}</Text>
              </View>
            </View>

            {isUpdating ? (
              <ActivityIndicator size="small" color="#0B6655" style={{ [isRtl ? 'marginLeft' : 'marginRight']: 8 }} />
            ) : (
              <TouchableOpacity activeOpacity={0.8} onPress={handleTogglePress} disabled={!userCheckedIn}>
                <View style={[styles.customSwitchTrackFrame, isEnabled && styles.customSwitchTrackFrameOn]}>
                  <Animated.View style={[styles.customSwitchThumbCircle, { transform: [{ translateX }] }]} />
                </View>
              </TouchableOpacity>
            )}
          </View>

          {isEnabled && userCheckedIn && confirmationLogs.length > 0 && (
            <View style={styles.historyLogSectionWrapper}>
              <Text style={[styles.historySectionLabelHeader, { textAlign: isRtl ? 'right' : 'left' }]}>{t.todayConfirmations(confirmationLogs.length)}</Text>
              <View style={styles.historyListOuterWhiteCardFrame}>
                {confirmationLogs.map((item, index) => (
                  <View key={item._id || index} style={[styles.logRowContainerItem, { flexDirection: isRtl ? 'row-reverse' : 'row' }, index === confirmationLogs.length - 1 && { borderBottomWidth: 0 }]}>
                    <Text style={[styles.logTimestampText, { textAlign: isRtl ? 'right' : 'left' }]}>{item.time || '00:00'}</Text>
                    <View style={[styles.logDetailsCenterContentBlock, { alignItems: isRtl ? 'flex-end' : 'flex-start' }]}>
                      <Text style={[styles.logMainTitleText, { textAlign: isRtl ? 'right' : 'left' }]}>{item.title || t.insideSiteTitle}</Text>
                      <Text style={[styles.logSubTitleText, { textAlign: isRtl ? 'right' : 'left' }]}>
                        {t.distanceBadge(item.distance || 9)}
                      </Text>
                    </View>
                    <View style={styles.statusBadgeCapsuleContainer}>
                      <Text style={styles.statusBadgeCapsuleText}>{item.badge || t.badgeInside}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          <View style={[styles.infoBannerStickyNoticeBox, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
            <Ionicons name="information-circle" size={18} color="#065F46" style={{ [isRtl ? 'marginLeft' : 'marginRight']: 8, [isRtl ? 'marginRight' : 'marginLeft']: 0 }} />
            <Text style={[styles.infoBannerTextContentColorGreen, { textAlign: isRtl ? 'right' : 'left' }]}>
              {t.attendanceSeparateNotice}
            </Text>
          </View>

        </ScrollView>
      )}

      <Modal animationType="slide" transparent={true} visible={showTurnOffModal} onRequestClose={() => setShowTurnOffModal(false)}>
        <TouchableOpacity style={styles.modalOverlayDismissBackground} activeOpacity={1} onPress={() => !isUpdating && setShowTurnOffModal(false)}>
          <View style={styles.bottomSheetFilterWindowContainer}>
            <View style={styles.bottomSheetHeaderCenterIndicatorLineBar} />
            <View style={styles.modalIconHeaderWrapper}>
              <Ionicons name="alert-circle" size={28} color="#D92D20" />
            </View>
            <Text style={styles.bottomSheetMainHeadingTitleText}>{t.turnOffModalTitle}</Text>
            <Text style={styles.bottomSheetParagraphSubDescriptionText}>
              {t.turnOffModalDesc}
            </Text>

            <View style={[styles.modalActionButtonsGroupRow, { flexDirection: isRtl ? 'row' : 'row-reverse' }]}>
              <TouchableOpacity
                style={[styles.modalActionButtonBase, styles.modalActionButtonDestructive]}
                onPress={() => executeToggle(false)}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalActionButtonTextWhite}>{t.turnOffBtn}</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalActionButtonBase, styles.modalActionButtonSecondary]}
                onPress={() => setShowTurnOffModal(false)}
                disabled={isUpdating}
              >
                <Text style={styles.modalActionButtonTextDark}>{t.cancelBtn}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal animationType="slide" transparent={true} visible={showTurnOnModal} onRequestClose={() => setShowTurnOnModal(false)}>
        <TouchableOpacity style={styles.modalOverlayDismissBackground} activeOpacity={1} onPress={() => !isUpdating && setShowTurnOnModal(false)}>
          <View style={styles.bottomSheetFilterWindowContainer}>
            <View style={styles.bottomSheetHeaderCenterIndicatorLineBar} />
            <View style={[styles.modalIconHeaderWrapper, { backgroundColor: '#ECFDF3' }]}>
              <Ionicons name="checkmark-circle" size={28} color="#039855" />
            </View>
            <Text style={styles.bottomSheetMainHeadingTitleText}>{t.turnOnModalTitle}</Text>
            <Text style={styles.bottomSheetParagraphSubDescriptionText}>
              {t.turnOnModalDesc}
            </Text>

            <View style={[styles.modalActionButtonsGroupRow, { flexDirection: isRtl ? 'row' : 'row-reverse' }]}>
              <TouchableOpacity
                style={[styles.modalActionButtonBase, styles.modalActionButtonPrimary]}
                onPress={() => executeToggle(true)}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalActionButtonTextWhite}>{t.turnOnBtn}</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalActionButtonBase, styles.modalActionButtonSecondary]}
                onPress={() => setShowTurnOnModal(false)}
                disabled={isUpdating}
              >
                <Text style={styles.modalActionButtonTextDark}>{t.cancelBtn}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  mainWrapper: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  navTopHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 64,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F2F4F7',
    elevation: 1,
    shadowColor: '#101828',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  headerBackArrowLink: {
    padding: 4,
  },
  navBarHeadingCenterTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1D2939',
  },
  headerRightBoxSpace: {
    width: 28,
  },
  loadingStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContentLayout: {
    padding: 16,
  },
  headerStateIllustrationContainer: {
    alignItems: 'center',
    marginVertical: 24,
    paddingHorizontal: 8,
  },
  illustrationIconCircleBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E6F4F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  illustrationIconCircleBadgeOff: {
    backgroundColor: '#F2F4F7',
  },
  miniArrowIndicatorBadge: {
    position: 'absolute',
    bottom: 2,
    backgroundColor: '#0B6655',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  mainStatusStateHeadingTitleText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1D2939',
    marginBottom: 8,
  },
  subStatusInstructionParagraphBodyText: {
    fontSize: 14,
    color: '#475467',
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  toggleSelectionMainCardBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F2F4F7',
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#101828',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  toggleSelectionMainCardBoxDisabled: {
    opacity: 0.6,
    backgroundColor: '#F9FAFB',
  },
  toggleCardLeftBlockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  innerToggleIconBadgeContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#E6F4F1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleLabelsContentContainer: {
    flex: 1,
  },
  toggleMainLabelTitleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D2939',
    marginBottom: 2,
  },
  toggleSubLabelDescriptionText: {
    fontSize: 13,
    color: '#667085',
  },
  customSwitchTrackFrame: {
    width: 52,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EAECF0',
    padding: 2,
    justifyContent: 'center',
  },
  customSwitchTrackFrameOn: {
    backgroundColor: '#0B6655',
  },
  customSwitchThumbCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#101828',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },
  historyLogSectionWrapper: {
    marginBottom: 20,
  },
  historySectionLabelHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: '#667085',
    letterSpacing: 0.6,
    marginBottom: 8,
    paddingLeft: 4,
  },
  historyListOuterWhiteCardFrame: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F2F4F7',
    overflow: 'hidden',
  },
  logRowContainerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F4F7',
  },
  logTimestampText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#344054',
    width: 54,
  },
  logDetailsCenterContentBlock: {
    flex: 1,
    paddingHorizontal: 8,
  },
  logMainTitleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1D2939',
    marginBottom: 2,
  },
  logSubTitleText: {
    fontSize: 12,
    color: '#667085',
  },
  statusBadgeCapsuleContainer: {
    backgroundColor: '#ECFDF3',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgeCapsuleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#027A48',
  },
  infoBannerStickyNoticeBox: {
    flexDirection: 'row',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#DCFCE7',
    borderRadius: 10,
    padding: 12,
    alignItems: 'flex-start',
  },
  infoBannerTextContentColorGreen: {
    fontSize: 13,
    color: '#15803D',
    flex: 1,
    lineHeight: 18,
  },
  disabledScreenCenterContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#FFFFFF',
  },
  disabledIconOuterCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FEF3F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  disabledMainHeadingText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1D2939',
    marginBottom: 8,
  },
  disabledSubParagraphText: {
    fontSize: 14,
    color: '#667085',
    lineHeight: 20,
    marginBottom: 24,
  },
  fallbackHomeActionButtonNode: {
    backgroundColor: '#1D2939',
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  fallbackHomeActionButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  modalOverlayDismissBackground: {
    flex: 1,
    backgroundColor: 'rgba(16, 24, 40, 0.4)',
    justifyContent: 'flex-end',
  },
  bottomSheetFilterWindowContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  bottomSheetHeaderCenterIndicatorLineBar: {
    width: 36,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#EAECF0',
    marginBottom: 20,
  },
  modalIconHeaderWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FEE4E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  bottomSheetMainHeadingTitleText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1D2939',
    marginBottom: 8,
    textAlign: 'center',
  },
  bottomSheetParagraphSubDescriptionText: {
    fontSize: 14,
    color: '#475467',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  modalActionButtonsGroupRow: {
    width: '100%',
    justifyContent: 'space-between',
  },
  modalActionButtonBase: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 6,
  },
  modalActionButtonPrimary: {
    backgroundColor: '#0B6655',
  },
  modalActionButtonDestructive: {
    backgroundColor: '#D92D20',
  },
  modalActionButtonSecondary: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D0D5DD',
  },
  modalActionButtonTextWhite: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  modalActionButtonTextDark: {
    color: '#344054',
    fontSize: 15,
    fontWeight: '600',
  },
});