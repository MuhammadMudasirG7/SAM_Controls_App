import React from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  ScrollView,
  Dimensions 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function LocationPrivacyScreen({ onBack }) {
  return (
    <View style={styles.mainWrapper}>
      <View style={styles.navTopHeaderBar}>
        <TouchableOpacity onPress={onBack} style={styles.headerBackArrowLink}>
          <Ionicons name="chevron-back" size={20} color="#344054" />
        </TouchableOpacity>
        <Text style={styles.navBarHeadingCenterTitle}>Location & privacy</Text>
        <View style={styles.headerRightBoxSpace} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContentLayout} showsVerticalScrollIndicator={false}>
        
        <View style={styles.centerShieldIllustrationIconBadgeContainer}>
          <View style={styles.illustrationIconCircleBadge}>
            <Ionicons name="shield-checkmark-outline" size={32} color="#0B6655" />
          </View>
          <Text style={styles.illustrationCenterSubTextTitle}>Before your first check-in, here's what the app collects and why.</Text>
        </View>

        {/* Informational Multi-tier Nested Audit Card Blocks Frame layout match */}
        <View style={styles.nestedInformationalStackCardBlock}>
          
          <View style={styles.informationalNodeItemRowLine}>
            <View style={styles.nodeItemIconCircleBadge}><Ionicons name="location-outline" size={18} color="#0B6655" /></View>
            <View style={styles.nodeItemTextContentBlock}>
              <Text style={styles.nodeItemHeaderLabelTitleText}>At check-in and check-out</Text>
              <Text style={styles.nodeItemDescriptionParagraphText}>Your location once, so the server can confirm you're inside your site.</Text>
            </View>
          </View>

          <View style={styles.informationalNodeItemRowLine}>
            <View style={styles.nodeItemIconCircleBadge}><Ionicons name="time-outline" size={18} color="#0B6655" /></View>
            <View style={styles.nodeItemTextContentBlock}>
              <Text style={styles.nodeItemHeaderLabelTitleText}>Hourly presence (only if you turn it on)</Text>
              <Text style={styles.nodeItemDescriptionParagraphText}>Location during your shift only — between check-in and check-out.</Text>
            </View>
          </View>

          <View style={styles.informationalNodeItemRowLine}>
            <View style={styles.nodeItemIconCircleBadge}><Ionicons name="people-outline" size={18} color="#0B6655" /></View>
            <View style={styles.nodeItemTextContentBlock}>
              <Text style={styles.nodeItemHeaderLabelTitleText}>Who sees it</Text>
              <Text style={styles.nodeItemDescriptionParagraphText}>Your HR team in Digital Faciliter. It stays in your company's own system.</Text>
            </View>
          </View>

          <View style={[styles.informationalNodeItemRowLine, { borderBottomWidth: 0 }]}>
            <View style={styles.nodeItemIconCircleBadge}><Ionicons name="calendar-outline" size={18} color="#0B6655" /></View>
            <View style={styles.nodeItemTextContentBlock}>
              <Text style={styles.nodeItemHeaderLabelTitleText}>How long it's kept</Text>
              <Text style={styles.nodeItemDescriptionParagraphText}>13 months, then deleted.</Text>
            </View>
          </View>

        </View>

        <View style={styles.consentGreenVerifiedMetadataBadgeStripBar}>
          <Ionicons name="checkmark-circle" size={16} color="#027A48" style={{ marginRight: 8 }} />
          <Text style={styles.consentGreenVerifiedMetadataBadgeStripBarText}>Accepted 22 Sep 2026 07:52 - consent version 1.0</Text>
        </View>

        <TouchableOpacity style={styles.withdrawConsentActionButtonOutlineRow} onPress={() => alert("Consent preferences configuration requested.")}>
          <Text style={styles.withdrawConsentActionButtonOutlineRowText}>Withdraw consent</Text>
        </TouchableOpacity>

        <Text style={styles.legalFinePrintDisclaimerNoteFooter}>Consent text v1.0 · PDPL (KSA) · Canadian privacy law</Text>

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
  nodeItemIconCircleBadge: { width: 36, height: 36, borderRadius: 8, backgroundColor: '#F0F9F8', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  nodeItemTextContentBlock: { flex: 1 },
  nodeItemHeaderLabelTitleText: { fontSize: 14, fontWeight: '700', color: '#101828' },
  nodeItemDescriptionParagraphText: { fontSize: 12, color: '#667085', marginTop: 4, lineHeight: 18, fontWeight: '500' },
  consentGreenVerifiedMetadataBadgeStripBar: { flexDirection: 'row', backgroundColor: '#F4FBF7', borderColor: '#D1FADF', borderWidth: 1, borderRadius: 10, padding: 12, width: '100%', marginTop: 20, alignItems: 'center' },
  consentGreenVerifiedMetadataBadgeStripBarText: { color: '#027A48', fontSize: 12, fontWeight: '600' },
  withdrawConsentActionButtonOutlineRow: { borderColor: '#D0D5DD', borderWidth: 1, borderRadius: 12, height: 48, width: '100%', justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF', marginTop: 16 },
  withdrawConsentActionButtonOutlineRowText: { color: '#B42318', fontSize: 14, fontWeight: '700' },
  legalFinePrintDisclaimerNoteFooter: { fontSize: 11, color: '#98A2B3', textAlign: 'center', marginTop: 16, fontWeight: '500' }
});
