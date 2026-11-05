import React, { useState, useEffect } from 'react';
import { 
    StyleSheet, 
    Text, 
    View, 
    TouchableOpacity, 
    ScrollView,
    Dimensions,
    ActivityIndicator,
    RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { translations, getGlobalLang, subscribeLang } from '../../../i18n';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// 📄 Dedicated Screen for Leave Request Details
export function LeaveRequestDetailsScreen({ record, onBack }) {
    const [currentLang, setCurrentLang] = useState(getGlobalLang());

    useEffect(() => {
        const unsubscribe = subscribeLang((newLang) => {
            setCurrentLang(newLang);
        });
        return () => unsubscribe();
    }, []);

    const t = translations[currentLang];
    const isRtl = currentLang === 'ur' || currentLang === 'ar';

    if (!record) return null;

    return (
        <View style={[styles.mainWrapper, { direction: isRtl ? 'rtl' : 'ltr' }]}>
            <View style={[styles.navTopHeaderBar, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
                <TouchableOpacity onPress={onBack} style={styles.headerBackArrowLink}>
                    <Ionicons name={isRtl ? "chevron-forward" : "chevron-back"} size={20} color="#344054" />
                </TouchableOpacity>
                <Text style={styles.navBarHeadingCenterTitle}>{t.requestDetailsTitle}</Text>
                <View style={styles.headerRightBoxSpace} />
            </View>

            <ScrollView 
                contentContainerStyle={styles.scrollContentLayoutContainerDetails} 
                showsVerticalScrollIndicator={true}
            >
                <View style={styles.detailsMainWhiteBlockContainerCard}>
                    <View style={[styles.listItemFloatingCardHeaderLineRow, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
                        <Text style={styles.detailsMainBlockCardHeaderTitle}>{record.type}</Text>
                        <View style={[styles.listItemStatusCapsuleBadge, { backgroundColor: record.bg }]}>
                            <Text style={[styles.listItemStatusCapsuleBadgeText, { color: record.color }]}>{record.status}</Text>
                        </View>
                    </View>
                    <Text style={[styles.detailsMainBlockCardCodeMetaString, { textAlign: isRtl ? 'right' : 'left' }]}>{record.code}</Text>

                    <View style={[styles.detailsMatrixDataGridRow, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}><Text style={[styles.detailsMatrixGridLabel, { textAlign: isRtl ? 'right' : 'left' }]}>{t.datesLabel}</Text><Text style={[styles.detailsMatrixGridValue, { textAlign: isRtl ? 'right' : 'left' }]}>{record.dates}</Text></View>
                    <View style={[styles.detailsMatrixDataGridRow, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}><Text style={[styles.detailsMatrixGridLabel, { textAlign: isRtl ? 'right' : 'left' }]}>{t.totalDaysLabel}</Text><Text style={[styles.detailsMatrixGridValue, { textAlign: isRtl ? 'right' : 'left' }]}>{record.totalDays}</Text></View>
                    <View style={[styles.detailsMatrixDataGridRow, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}><Text style={[styles.detailsMatrixGridLabel, { textAlign: isRtl ? 'right' : 'left' }]}>{t.appliedOnLabel}</Text><Text style={[styles.detailsMatrixGridValue, { textAlign: isRtl ? 'right' : 'left' }]}>{record.appliedOn}</Text></View>
                    <View style={[styles.detailsMatrixDataGridRow, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}><Text style={[styles.detailsMatrixGridLabel, { textAlign: isRtl ? 'right' : 'left' }]}>{t.reasonLabel}</Text><Text style={[styles.detailsMatrixGridValue, { textAlign: isRtl ? 'right' : 'left' }]}>{record.reason}</Text></View>
                    <View style={[styles.detailsMatrixDataGridRow, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}><Text style={[styles.detailsMatrixGridLabel, { textAlign: isRtl ? 'right' : 'left' }]}>{t.attachmentLabel}</Text><Text style={[styles.detailsMatrixGridValue, { textAlign: isRtl ? 'right' : 'left' }]}>—</Text></View>
                </View>

                {record.status === 'Rejected' && record.mgrComment && (
                    <View style={[styles.inlineCommentAlertCardBoxRedContainer, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
                        <Ionicons name="information-circle" size={16} color="#B42318" style={[isRtl ? { marginLeft: 8 } : { marginRight: 8 }, { marginTop: 1 }]} />
                        <Text style={[styles.inlineCommentAlertCardBoxRedText, { textAlign: isRtl ? 'right' : 'left' }]}>
                            <Text style={{ fontWeight: '700' }}>{t.managerNoteLabel}</Text> {record.mgrComment}
                        </Text>
                    </View>
                )}

                <Text style={[styles.approvalHistoryTreeHeaderLabelSection, { textAlign: isRtl ? 'right' : 'left' }]}>{t.approvalHistoryHeader}</Text>

                <View style={styles.verticalTimelineOuterFrameContainer}>
                    <View style={[styles.timelineRowItemNode, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
                        <View style={[styles.timelineStatusMarkerCircleNode, { backgroundColor: '#027A48', [isRtl ? 'right' : 'left']: 0 }]} />
                        <View style={[styles.timelineVerticalConnectingTrackBarLine, isRtl ? { right: 4, left: 'auto' } : { left: 4, right: 'auto' }]} />
                        <View style={[styles.timelineDetailsTextContentBlockBox, { [isRtl ? 'paddingRight' : 'paddingLeft']: 24, [isRtl ? 'paddingLeft' : 'paddingRight']: 0, alignItems: isRtl ? 'flex-end' : 'flex-start' }]}>
                            <Text style={[styles.timelineDetailsNodeTitleHeader, { textAlign: isRtl ? 'right' : 'left' }]}>{t.timelineSubmitted}</Text>
                            <Text style={[styles.timelineDetailsNodeMetaSubText, { textAlign: isRtl ? 'right' : 'left' }]}>{t.timelineSubmittedSub('Employee', record.subTime || record.appliedOn)}</Text>
                        </View>
                    </View>

                    <View style={[styles.timelineRowItemNode, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
                        <View style={[styles.timelineStatusMarkerCircleNode, { backgroundColor: record.status === 'Rejected' ? '#B42318' : record.status === 'Approved' ? '#027A48' : '#B24E00', [isRtl ? 'right' : 'left']: 0 }]} />
                        <View style={[styles.timelineVerticalConnectingTrackBarLine, isRtl ? { right: 4, left: 'auto' } : { left: 4, right: 'auto' }]} />
                        <View style={[styles.timelineDetailsTextContentBlockBox, { [isRtl ? 'paddingRight' : 'paddingLeft']: 24, [isRtl ? 'paddingLeft' : 'paddingRight']: 0, alignItems: isRtl ? 'flex-end' : 'flex-start' }]}>
                            <Text style={[styles.timelineDetailsNodeTitleHeader, { textAlign: isRtl ? 'right' : 'left' }]}>
                                {record.status === 'Rejected' ? t.timelineRejectedManager : record.status === 'Approved' ? t.timelineApprovedManager : t.timelinePendingReview}
                            </Text>
                            <Text style={[styles.timelineDetailsNodeMetaSubText, { textAlign: isRtl ? 'right' : 'left' }]}>{t.timelineManagementStatus}</Text>
                        </View>
                    </View>

                    <View style={[styles.timelineRowItemNode, { flexDirection: isRtl ? 'row-reverse' : 'row', paddingBottom: 0 }]}>
                        <View style={[styles.timelineStatusMarkerCircleNode, { backgroundColor: record.status === 'Approved' ? '#027A48' : '#EAECF0', [isRtl ? 'right' : 'left']: 0 }]} />
                        <View style={[styles.timelineDetailsTextContentBlockBox, { [isRtl ? 'paddingRight' : 'paddingLeft']: 24, [isRtl ? 'paddingLeft' : 'paddingRight']: 0, alignItems: isRtl ? 'flex-end' : 'flex-start' }]}>
                            <Text style={[styles.timelineDetailsNodeTitleHeader, { textAlign: isRtl ? 'right' : 'left' }]}>{t.timelineHrRecorded}</Text>
                            <Text style={[styles.timelineDetailsNodeMetaSubText, { textAlign: isRtl ? 'right' : 'left' }]}>
                                {record.status === 'Approved' ? t.timelineHrSuccess : t.timelineHrWaiting}
                            </Text>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

export default function MyLeaveRequestsScreen({ 
    onBack, 
    employeeId = 'EMP-10482',
    serverAddress = 'http://192.168.100.199:8081',
    onNavigateToApply 
}) {
    const [currentLang, setCurrentLang] = useState(getGlobalLang());
    const [activeFilter, setActiveFilter] = useState('all'); 
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [requestsList, setRequestsList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        const unsubscribe = subscribeLang((newLang) => {
            setCurrentLang(newLang);
        });
        return () => unsubscribe();
    }, []);

    const t = translations[currentLang];
    const isRtl = currentLang === 'ur' || currentLang === 'ar';

    useEffect(() => {
        fetchLeaveRequests();
    }, [employeeId]);

    const fetchLeaveRequests = async () => {
        try {
            setLoading(true);
            const cleanBaseUrl = serverAddress.replace(/\/+$/, '');
            const response = await fetch(`${cleanBaseUrl}/api/leave/requests?employeeId=${encodeURIComponent(employeeId)}`);
            const json = await response.json();
            if (json.success && json.requests) {
                setRequestsList(json.requests);
            }
        } catch (err) {
            console.log("Error fetching leave requests:", err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleManageLeave = async (requestId, actionType) => {
        try {
            const cleanBaseUrl = serverAddress.replace(/\/+$/, '');
            const response = await fetch(`${cleanBaseUrl}/api/leave/manage`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    requestId: requestId,
                    action: actionType,
                    managerComment: actionType === 'approve' ? 'Approved by manager test' : 'Rejected by manager test'
                })
            });

            const json = await response.json();
            if (json.success) {
                alert(t.leaveActionSuccess(actionType));
                fetchLeaveRequests();
            } else {
                alert(t.leaveActionError + json.message);
            }
        } catch (err) {
            console.log("Action error:", err);
            alert(t.networkActionError);
        }
    };

    const pendingCount = requestsList.filter(r => r.status === 'Pending').length;
    const approvedCount = requestsList.filter(r => r.status === 'Approved').length;
    const rejectedCount = requestsList.filter(r => r.status === 'Rejected').length;

    const filteredRequestsList = requestsList.filter(item => {
        if (activeFilter === 'pending') return item.status === 'Pending';
        if (activeFilter === 'approved') return item.status === 'Approved';
        if (activeFilter === 'rejected') return item.status === 'Rejected';
        return true;
    });

    if (selectedRequest) {
        return <LeaveRequestDetailsScreen record={selectedRequest} onBack={() => setSelectedRequest(null)} />;
    }

    return (
        <View style={[styles.mainWrapper, { direction: isRtl ? 'rtl' : 'ltr' }]}>
            <View style={[styles.navTopHeaderBar, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
                <TouchableOpacity onPress={onBack} style={styles.headerBackArrowLink}>
                    <Ionicons name={isRtl ? "chevron-forward" : "chevron-back"} size={20} color="#344054" />
                </TouchableOpacity>
                <Text style={styles.navBarHeadingCenterTitle}>{t.myLeaveRequestsTitle}</Text>
                <TouchableOpacity style={styles.headerRightAddButton} onPress={onNavigateToApply}>
                    <Ionicons name="add" size={22} color="#344054" />
                </TouchableOpacity>
            </View>

            <View style={styles.horizontalFilterScrollWrapper}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, alignItems: 'center', height: 44, flexDirection: isRtl ? 'row-reverse' : 'row' }}>
                    <TouchableOpacity style={[styles.filterBadgeCapsule, activeFilter === 'all' && styles.filterBadgeCapsuleActive]} onPress={() => setActiveFilter('all')}>
                        <Text style={[styles.filterBadgeCapsuleText, activeFilter === 'all' && styles.filterBadgeCapsuleTextActive]}>
                            {t.filterAll} &nbsp;<Text style={styles.badgeCountMutedStyle}>{requestsList.length}</Text>
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.filterBadgeCapsule, activeFilter === 'pending' && styles.filterBadgeCapsuleActive]} onPress={() => setActiveFilter('pending')}>
                        <Text style={[styles.filterBadgeCapsuleText, activeFilter === 'pending' && styles.filterBadgeCapsuleTextActive]}>
                            {t.filterPending} &nbsp;<Text style={styles.badgeCountMutedStyle}>{pendingCount}</Text>
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.filterBadgeCapsule, activeFilter === 'approved' && styles.filterBadgeCapsuleActive]} onPress={() => setActiveFilter('approved')}>
                        <Text style={[styles.filterBadgeCapsuleText, activeFilter === 'approved' && styles.filterBadgeCapsuleTextActive]}>
                            {t.filterApproved} &nbsp;<Text style={styles.badgeCountMutedStyle}>{approvedCount}</Text>
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.filterBadgeCapsule, activeFilter === 'rejected' && styles.filterBadgeCapsuleActive]} onPress={() => setActiveFilter('rejected')}>
                        <Text style={[styles.filterBadgeCapsuleText, activeFilter === 'rejected' && styles.filterBadgeCapsuleTextActive]}>
                            {t.filterRejected} &nbsp;<Text style={styles.badgeCountMutedStyle}>{rejectedCount}</Text>
                        </Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>

            <View style={[styles.updatedTimeBannerStripBar, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
                <Ionicons name="refresh-outline" size={14} color="#667085" style={[isRtl ? { marginLeft: 6 } : { marginRight: 6 }]} />
                <Text style={[styles.updatedTimeBannerStripBarText, { textAlign: isRtl ? 'right' : 'left' }]}>{t.pullToRefreshText}</Text>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#0B6655" style={{ marginTop: 40 }} />
            ) : filteredRequestsList.length === 0 ? (
                <View style={styles.centerFeedbackScreenContainer}>
                    <View style={styles.centerFeedbackIconOuterCircle}><Ionicons name="document-text-outline" size={24} color="#0B6655" /></View>
                    <Text style={[styles.centerFeedbackHeadingTitleText, { textAlign: isRtl ? 'right' : 'center' }]}>{t.noLeaveRequestsTitle}</Text>
                    <Text style={[styles.centerFeedbackParagraphSubText, { textAlign: isRtl ? 'right' : 'center' }]}>{t.noLeaveRequestsSubtitle}</Text>
                    <TouchableOpacity style={styles.primaryActionButtonNodeFixedInline} onPress={onNavigateToApply}>
                        <Text style={styles.primaryActionButtonTextLabel}>{t.applyLeaveBtnText}</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <ScrollView 
                    contentContainerStyle={styles.scrollContentLayoutContainer} 
                    showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchLeaveRequests(); }} />}
                >
                    {filteredRequestsList.map((item) => (
                        <TouchableOpacity key={item.id} style={styles.leaveRequestListItemFloatingCard} activeOpacity={0.9} onPress={() => setSelectedRequest(item)}>
                            <View style={[styles.listItemFloatingCardHeaderLineRow, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
                                <Text style={[styles.leaveRequestListItemTitleHeader, { textAlign: isRtl ? 'right' : 'left' }]}>{item.type}</Text>
                                <View style={[styles.listItemStatusCapsuleBadge, { backgroundColor: item.bg }]}>
                                    <Text style={[styles.listItemStatusCapsuleBadgeText, { color: item.color }]}>{item.status}</Text>
                                </View>
                            </View>
                            <Text style={[styles.listItemFloatingCardDateDurationString, { textAlign: isRtl ? 'right' : 'left' }]}>{item.dates}</Text>
                            <View style={[styles.listItemFloatingCardFooterLineRow, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
                                <Text style={[styles.listItemFloatingCardAppliedDateMetaText, { textAlign: isRtl ? 'right' : 'left' }]}>Applied on: {item.appliedOn}</Text>
                                <View style={{ flexDirection: isRtl ? 'row-reverse' : 'row', alignItems: 'center' }}>
                                    <Text style={[styles.listItemFloatingCardTotalDaysDurationText, { textAlign: isRtl ? 'right' : 'left' }]}>{item.totalDays} {item.totalDays === 1 ? t.dayUnitSingular : t.dayUnitPlural}</Text>
                                    <Ionicons name={isRtl ? "chevron-back" : "chevron-forward"} size={14} color="#D0D5DD" style={[isRtl ? { marginRight: 4 } : { marginLeft: 4 }]} />
                                </View>
                            </View>

                            {item.status === 'Pending' && (
                                <View style={[styles.adminActionRow, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
                                    <TouchableOpacity 
                                        style={[styles.adminRejectBtn, isRtl ? { marginLeft: 8, marginRight: 0 } : { marginRight: 8, marginLeft: 0 }]}
                                        onPress={(e) => { e.stopPropagation(); handleManageLeave(item.id, 'reject'); }}
                                    >
                                        <Text style={styles.adminRejectText}>{t.rejectBtnText}</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity 
                                        style={styles.adminApproveBtn}
                                        onPress={(e) => { e.stopPropagation(); handleManageLeave(item.id, 'approve'); }}
                                    >
                                        <Text style={styles.adminApproveText}>{t.approveBtnText}</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    mainWrapper: { flex: 1, backgroundColor: '#F9FAFB' },
    navTopHeaderBar: { height: 56, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderColor: '#EAECF0', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
    headerBackArrowLink: { padding: 4 },
    navBarHeadingCenterTitle: { fontSize: 16, fontWeight: '700', color: '#101828' },
    headerRightAddButton: { padding: 4 },
    headerRightBoxSpace: { width: 28 },
    horizontalFilterScrollWrapper: { height: 44, borderBottomWidth: 1, borderColor: '#EAECF0', backgroundColor: '#FFFFFF' },
    filterBadgeCapsule: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: '#F2F4F7', marginRight: 8, flexDirection: 'row', alignItems: 'center' },
    filterBadgeCapsuleActive: { backgroundColor: '#0B6655' },
    filterBadgeCapsuleText: { fontSize: 13, fontWeight: '600', color: '#475467' },
    filterBadgeCapsuleTextActive: { color: '#FFFFFF' },
    badgeCountMutedStyle: { color: '#98A2B3', fontWeight: '400' },
    updatedTimeBannerStripBar: { flexDirection: 'row', backgroundColor: '#F9FAFB', paddingHorizontal: 20, paddingVertical: 10, alignItems: 'center', width: '100%', height: 36, borderBottomWidth: 1, borderColor: '#F2F4F7' },
    updatedTimeBannerStripBarText: { fontSize: 12, color: '#667085', fontWeight: '500' },
    scrollContentLayoutContainer: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 40 },
    scrollContentLayoutContainerDetails: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 60 },
    leaveRequestListItemFloatingCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#EEF0F2', width: '100%', marginBottom: 12, shadowColor: '#101828', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.02, shadowRadius: 6, elevation: 1 },
    listItemFloatingCardHeaderLineRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' },
    leaveRequestListItemTitleHeader: { fontSize: 15, fontWeight: '700', color: '#101828' },
    listItemStatusCapsuleBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
    listItemStatusCapsuleBadgeText: { fontSize: 11, fontWeight: '700' },
    listItemFloatingCardDateDurationString: { fontSize: 13, color: '#475467', fontWeight: '500', marginTop: 4 },
    listItemFloatingCardFooterLineRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, borderTopWidth: 1, borderColor: '#F2F4F7', paddingTop: 10 },
    listItemFloatingCardAppliedDateMetaText: { fontSize: 11, color: '#98A2B3', fontWeight: '500' },
    listItemFloatingCardTotalDaysDurationText: { fontSize: 13, fontWeight: '700', color: '#344054' },
    detailsMainWhiteBlockContainerCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#EEF0F2', width: '100%' },
    detailsMainBlockCardHeaderTitle: { fontSize: 16, fontWeight: '700', color: '#101828' },
    detailsMainBlockCardCodeMetaString: { fontSize: 12, color: '#98A2B3', fontWeight: '500', marginTop: 2, marginBottom: 12 },
    detailsMatrixDataGridRow: { flexDirection: 'row', paddingVertical: 6, width: '100%' },
    detailsMatrixGridLabel: { fontSize: 13, color: '#667085', fontWeight: '500', width: 90 },
    detailsMatrixGridValue: { fontSize: 13, color: '#101828', fontWeight: '600', flex: 1 },
    inlineCommentAlertCardBoxRedContainer: { flexDirection: 'row', backgroundColor: '#FEF3F2', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#FECDCA', marginTop: 14, width: '100%', alignItems: 'center' },
    inlineCommentAlertCardBoxRedText: { color: '#B42318', fontSize: 12, fontWeight: '500', lineHeight: 16, flex: 1 },
    approvalHistoryTreeHeaderLabelSection: { fontSize: 11, fontWeight: '700', color: '#667085', letterSpacing: 0.5, marginTop: 20, marginBottom: 10, paddingLeft: 2 },
    verticalTimelineOuterFrameContainer: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#EEF0F2', width: '100%' },
    timelineRowItemNode: { flexDirection: 'row', position: 'relative', paddingBottom: 24, width: '100%' },
    timelineStatusMarkerCircleNode: { width: 10, height: 10, borderRadius: 5, marginTop: 4, zIndex: 10, position: 'absolute' },
    timelineVerticalConnectingTrackBarLine: { position: 'absolute', top: 12, bottom: -4, width: 1, backgroundColor: '#EAECF0', zIndex: 1 },
    timelineDetailsTextContentBlockBox: { flex: 1 },
    timelineDetailsNodeTitleHeader: { fontSize: 14, fontWeight: '700', color: '#101828' },
    timelineDetailsNodeMetaSubText: { fontSize: 11, color: '#667085', marginTop: 3, fontWeight: '500' },
    centerFeedbackScreenContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24, height: SCREEN_HEIGHT - 180 },
    centerFeedbackIconOuterCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#F2F4F5', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
    centerFeedbackHeadingTitleText: { fontSize: 15, fontWeight: '700', color: '#101828', textAlign: 'center' },
    centerFeedbackParagraphSubText: { fontSize: 13, color: '#667085', marginTop: 4, textAlign: 'center', fontWeight: '500', lineHeight: 18 },
    primaryActionButtonNodeFixedInline: { backgroundColor: '#0B6655', borderRadius: 12, height: 46, justifyContent: 'center', alignItems: 'center', width: '100%', marginTop: 24 },
    primaryActionButtonTextLabel: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
    adminActionRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12, borderTopWidth: 1, borderColor: '#F2F4F7', paddingTop: 10 },
    adminRejectBtn: { backgroundColor: '#FEE4E2', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
    adminRejectText: { color: '#B42318', fontSize: 12, fontWeight: '700' },
    adminApproveBtn: { backgroundColor: '#ECFDF3', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
    adminApproveText: { color: '#027A48', fontSize: 12, fontWeight: '700' }
});