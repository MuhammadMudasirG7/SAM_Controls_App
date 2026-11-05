import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  ScrollView,
  Dimensions 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { translations, getGlobalLang, subscribeLang } from '../../../i18n';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function LocationPrivacyScreen({ onBack }) {
  const [currentLang, setCurrentLang] = useState(getGlobalLang());

  useEffect(() => {
    const unsubscribe = subscribeLang((newLang) => {
      setCurrentLang(newLang);
    });
    return () => unsubscribe();
  }, []);

  const t = translations[currentLang];
  const isRtl = currentLang === 'ur' || currentLang === 'ar';

  return (
    <View style={[styles.mainWrapper, { direction: isRtl ? 'rtl' : 'ltr' }]}>
      <View style={[styles.navTopHeaderBar, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
        <TouchableOpacity onPress={onBack} style={styles.headerBackArrowLink}>
          <Ionicons name={isRtl ? "chevron-forward" : "chevron-back"} size={20} color="#344054" />
        </TouchableOpacity>
        <Text style={styles.navBarHeadingCenterTitle}>{t.locPrivacyTitle}</Text>
        <View style={styles.headerRightBoxSpace} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContentLayout} showsVerticalScrollIndicator={false}>
        
        <View style={styles.centerShieldIllustrationIconBadgeContainer}>
          <View style={styles.illustrationIconCircleBadge}>
            <Ionicons name="shield-checkmark-outline" size={32} color="#0B6655" />
          </View>
          <Text style={[styles.illustrationCenterSubTextTitle, { textAlign: isRtl ? 'right' : 'center' }]}>
            {t.locPrivacyHeaderSub}
          </Text>
        </View>

        {/* Informational Multi-tier Nested Audit Card Blocks Frame layout match */}
        <View style={styles.nestedInformationalStackCardBlock}>
          
          <View style={[styles.informationalNodeItemRowLine, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
            <View style={[styles.nodeItemIconCircleBadge, isRtl ? { marginLeft: 12, marginRight: 0 } : { marginRight: 12, marginLeft: 0 }]}>
              <Ionicons name="location-outline" size={18} color="#0B6655" />
            </View>
            <View style={[styles.nodeItemTextContentBlock, { alignItems: isRtl ? 'flex-end' : 'flex-start' }]}>
              <Text style={[styles.nodeItemHeaderLabelTitleText, { textAlign: isRtl ? 'right' : 'left' }]}>{t.checkInTierTitle}</Text>
              <Text style={[styles.nodeItemDescriptionParagraphText, { textAlign: isRtl ? 'right' : 'left' }]}>{t.checkInTierDesc}</Text>
            </View>
          </View>

          <View style={[styles.informationalNodeItemRowLine, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
            <View style={[styles.nodeItemIconCircleBadge, isRtl ? { marginLeft: 12, marginRight: 0 } : { marginRight: 12, marginLeft: 0 }]}>
              <Ionicons name="time-outline" size={18} color="#0B6655" />
            </View>
            <View style={[styles.nodeItemTextContentBlock, { alignItems: isRtl ? 'flex-end' : 'flex-start' }]}>
              <Text style={[styles.nodeItemHeaderLabelTitleText, { textAlign: isRtl ? 'right' : 'left' }]}>{t.hourlyTierTitle}</Text>
              <Text style={[styles.nodeItemDescriptionParagraphText, { textAlign: isRtl ? 'right' : 'left' }]}>{t.hourlyTierDesc}</Text>
            </View>
          </View>

          <View style={[styles.informationalNodeItemRowLine, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
            <View style={[styles.nodeItemIconCircleBadge, isRtl ? { marginLeft: 12, marginRight: 0 } : { marginRight: 12, marginLeft: 0 }]}>
              <Ionicons name="people-outline" size={18} color="#0B6655" />
            </View>
            <View style={[styles.nodeItemTextContentBlock, { alignItems: isRtl ? 'flex-end' : 'flex-start' }]}>
              <Text style={[styles.nodeItemHeaderLabelTitleText, { textAlign: isRtl ? 'right' : 'left' }]}>{t.whoSeesItTitle}</Text>
              <Text style={[styles.nodeItemDescriptionParagraphText, { textAlign: isRtl ? 'right' : 'left' }]}>{t.whoSeesItDesc}</Text>
            </View>
          </View>

          <View style={[styles.informationalNodeItemRowLine, { flexDirection: isRtl ? 'row-reverse' : 'row', borderBottomWidth: 0 }]}>
            <View style={[styles.nodeItemIconCircleBadge, isRtl ? { marginLeft: 12, marginRight: 0 } : { marginRight: 12, marginLeft: 0 }]}>
              <Ionicons name="calendar-outline" size={18} color="#0B6655" />
            </View>
            <View style={[styles.nodeItemTextContentBlock, { alignItems: isRtl ? 'flex-end' : 'flex-start' }]}>
              <Text style={[styles.nodeItemHeaderLabelTitleText, { textAlign: isRtl ? 'right' : 'left' }]}>{t.howLongTitle}</Text>
              <Text style={[styles.nodeItemDescriptionParagraphText, { textAlign: isRtl ? 'right' : 'left' }]}>{t.howLongDesc}</Text>
            </View>
          </View>

        </View>

        <View style={[styles.consentGreenVerifiedMetadataBadgeStripBar, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
          <Ionicons name="checkmark-circle" size={16} color="#027A48" style={[isRtl ? { marginLeft: 8 } : { marginRight: 8 }]} />
          <Text style={[styles.consentGreenVerifiedMetadataBadgeStripBarText, { textAlign: isRtl ? 'right' : 'left' }]}>
            {t.consentAcceptedText("22 Sep 2026 07:52")}
          </Text>
        </View>

        <TouchableOpacity style={styles.withdrawConsentActionButtonOutlineRow} onPress={() => alert(t.consentAlertMsg)}>
          <Text style={styles.withdrawConsentActionButtonOutlineRowText}>{t.withdrawConsentBtn}</Text>
        </TouchableOpacity>

        <Text style={styles.legalFinePrintDisclaimerNoteFooter}>{t.legalFinePrint}</Text>

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
  scrollContentLayout: { paddingHorizontal: 16, paddingTop: 24, paddingBottom: 40, alignItems: 'center' },
  centerShieldIllustrationIconBadgeContainer: { width: '100%', alignItems: 'center', marginBottom: 20 },
  illustrationIconCircleBadge: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#E6F4F1', justifyContent: 'center', alignItems: 'center' },
  illustrationCenterSubTextTitle: { fontSize: 13, color: '#475467', textAlign: 'center', marginTop: 16, paddingHorizontal: 16, lineHeight: 20, fontWeight: '500' },
  nestedInformationalStackCardBlock: { backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#EEF0F2', width: '100%', overflow: 'hidden' },
  informationalNodeItemRowLine: { flexDirection: 'row', padding: 16, borderBottomWidth: 1, borderColor: '#F2F4F7' },
  nodeItemIconCircleBadge: { width: 36, height: 36, borderRadius: 8, backgroundColor: '#F0F9F8', justifyContent: 'center', alignItems: 'center' },
  nodeItemTextContentBlock: { flex: 1 },
  nodeItemHeaderLabelTitleText: { fontSize: 14, fontWeight: '700', color: '#101828' },
  nodeItemDescriptionParagraphText: { fontSize: 12, color: '#667085', marginTop: 4, lineHeight: 18, fontWeight: '500' },
  consentGreenVerifiedMetadataBadgeStripBar: { flexDirection: 'row', backgroundColor: '#F4FBF7', borderColor: '#D1FADF', borderWidth: 1, borderRadius: 10, padding: 12, width: '100%', marginTop: 20, alignItems: 'center' },
  consentGreenVerifiedMetadataBadgeStripBarText: { color: '#027A48', fontSize: 12, fontWeight: '600' },
  withdrawConsentActionButtonOutlineRow: { borderColor: '#D0D5DD', borderWidth: 1, borderRadius: 12, height: 48, width: '100%', justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF', marginTop: 16 },
  withdrawConsentActionButtonOutlineRowText: { color: '#B42318', fontSize: 14, fontWeight: '700' },
  legalFinePrintDisclaimerNoteFooter: { fontSize: 11, color: '#98A2B3', textAlign: 'center', marginTop: 16, fontWeight: '500' }
});