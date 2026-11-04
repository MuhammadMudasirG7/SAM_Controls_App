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

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// 📄 Dedicated Screen for Leave Request Details
export function LeaveRequestDetailsScreen({ record, onBack }) {
    if (!record) return null;

    return (
        <View style={styles.mainWrapper}>
            <View style={styles.navTopHeaderBar}>
                <TouchableOpacity onPress={onBack} style={styles.headerBackArrowLink}>
                    <Ionicons name="chevron-back" size={20} color="#344054" />
                </TouchableOpacity>
                <Text style={styles.navBarHeadingCenterTitle}>Request details</Text>
                <View style={styles.headerRightBoxSpace} />
            </View>

            <ScrollView 
                contentContainerStyle={styles.scrollContentLayoutContainerDetails} 
                showsVerticalScrollIndicator={true}
            >
                <View style={styles.detailsMainWhiteBlockContainerCard}>
                    <View style={styles.listItemFloatingCardHeaderLineRow}>
                        <Text style={styles.detailsMainBlockCardHeaderTitle}>{record.type}</Text>
                        <View style={[styles.listItemStatusCapsuleBadge, { backgroundColor: record.bg }]}>
                            <Text style={[styles.listItemStatusCapsuleBadgeText, { color: record.color }]}>{record.status}</Text>
                        </View>
                    </View>
                    <Text style={styles.detailsMainBlockCardCodeMetaString}>{record.code}</Text>

                    <View style={styles.detailsMatrixDataGridRow}><Text style={styles.detailsMatrixGridLabel}>Dates</Text><Text style={styles.detailsMatrixGridValue}>{record.dates}</Text></View>
                    <View style={styles.detailsMatrixDataGridRow}><Text style={styles.detailsMatrixGridLabel}>Total days</Text><Text style={styles.detailsMatrixGridValue}>{record.totalDays}</Text></View>
                    <View style={styles.detailsMatrixDataGridRow}><Text style={styles.detailsMatrixGridLabel}>Applied on</Text><Text style={styles.detailsMatrixGridValue}>{record.appliedOn}</Text></View>
                    <View style={styles.detailsMatrixDataGridRow}><Text style={styles.detailsMatrixGridLabel}>Reason</Text><Text style={styles.detailsMatrixGridValue}>{record.reason}</Text></View>
                    <View style={styles.detailsMatrixDataGridRow}><Text style={styles.detailsMatrixGridLabel}>Attachment</Text><Text style={styles.detailsMatrixGridValue}>—</Text></View>
                </View>

                {record.status === 'Rejected' && record.mgrComment && (
                    <View style={styles.inlineCommentAlertCardBoxRedContainer}>
                        <Ionicons name="information-circle" size={16} color="#B42318" style={{ marginRight: 8, marginTop: 1 }} />
                        <Text style={styles.inlineCommentAlertCardBoxRedText}>
                            <Text style={{ fontWeight: '700' }}>Manager Note:</Text> {record.mgrComment}
                        </Text>
                    </View>
                )}

                <Text style={styles.approvalHistoryTreeHeaderLabelSection}>APPROVAL HISTORY</Text>

                <View style={styles.verticalTimelineOuterFrameContainer}>
                    <View style={styles.timelineRowItemNode}>
                        <View style={[styles.timelineStatusMarkerCircleNode, { backgroundColor: '#027A48' }]} />
                        <View style={styles.timelineVerticalConnectingTrackBarLine} />
                        <View style={styles.timelineDetailsTextContentBlockBox}>
                            <Text style={styles.timelineDetailsNodeTitleHeader}>Submitted</Text>
                            <Text style={styles.timelineDetailsNodeMetaSubText}>Employee · {record.subTime || record.appliedOn}</Text>
                        </View>
                    </View>

                    <View style={styles.timelineRowItemNode}>
                        <View style={[styles.timelineStatusMarkerCircleNode, { backgroundColor: record.status === 'Rejected' ? '#B42318' : record.status === 'Approved' ? '#027A48' : '#B24E00' }]} />
                        <View style={styles.timelineVerticalConnectingTrackBarLine} />
                        <View style={styles.timelineDetailsTextContentBlockBox}>
                            <Text style={styles.timelineDetailsNodeTitleHeader}>
                                {record.status === 'Rejected' ? 'Rejected by Manager' : record.status === 'Approved' ? 'Approved by Manager' : 'Pending Manager Review'}
                            </Text>
                            <Text style={styles.timelineDetailsNodeMetaSubText}>Management Status</Text>
                        </View>
                    </View>

                    <View style={[styles.timelineRowItemNode, { paddingBottom: 0 }]}>
                        <View style={[styles.timelineStatusMarkerCircleNode, { backgroundColor: record.status === 'Approved' ? '#027A48' : '#EAECF0' }]} />
                        <View style={styles.timelineDetailsTextContentBlockBox}>
                            <Text style={styles.timelineDetailsNodeTitleHeader}>HR Recorded</Text>
                            <Text style={styles.timelineDetailsNodeMetaSubText}>
                                {record.status === 'Approved' ? 'System HR · Recorded' : 'Waiting for approval'}
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
    const [activeFilter, setActiveFilter] = useState('all'); 
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [requestsList, setRequestsList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

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

    // 🟢 Manage Leave Action (Approve / Reject) for Testing
    const handleManageLeave = async (requestId, actionType) => {
        try {
            const cleanBaseUrl = serverAddress.replace(/\/+$/, '');
            const response = await fetch(`${cleanBaseUrl}/api/leave/manage`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    requestId: requestId,
                    action: actionType, // 'approve' or 'reject'
                    managerComment: actionType === 'approve' ? 'Approved by manager test' : 'Rejected by manager test'
                })
            });

            const json = await response.json();
            if (json.success) {
                alert(`✅ Leave request successfully ${actionType}d!`);
                fetchLeaveRequests(); // Refresh list
            } else {
                alert("❌ Error: " + json.message);
            }
        } catch (err) {
            console.log("Action error:", err);
            alert("Network error during action.");
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
        <View style={styles.mainWrapper}>
            <View style={styles.navTopHeaderBar}>
                <TouchableOpacity onPress={onBack} style={styles.headerBackArrowLink}><Ionicons name="chevron-back" size={20} color="#344054" /></TouchableOpacity>
                <Text style={styles.navBarHeadingCenterTitle}>My leave requests</Text>
                <TouchableOpacity style={styles.headerRightAddButton} onPress={onNavigateToApply}><Ionicons name="add" size={22} color="#344054" /></TouchableOpacity>
            </View>

            <View style={styles.horizontalFilterScrollWrapper}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, alignItems: 'center', height: 44 }}>
                    <TouchableOpacity style={[styles.filterBadgeCapsule, activeFilter === 'all' && styles.filterBadgeCapsuleActive]} onPress={() => setActiveFilter('all')}><Text style={[styles.filterBadgeCapsuleText, activeFilter === 'all' && styles.filterBadgeCapsuleTextActive]}>All &nbsp;<Text style={styles.badgeCountMutedStyle}>{requestsList.length}</Text></Text></TouchableOpacity>
                    <TouchableOpacity style={[styles.filterBadgeCapsule, activeFilter === 'pending' && styles.filterBadgeCapsuleActive]} onPress={() => setActiveFilter('pending')}><Text style={[styles.filterBadgeCapsuleText, activeFilter === 'pending' && styles.filterBadgeCapsuleTextActive]}>Pending &nbsp;<Text style={styles.badgeCountMutedStyle}>{pendingCount}</Text></Text></TouchableOpacity>
                    <TouchableOpacity style={[styles.filterBadgeCapsule, activeFilter === 'approved' && styles.filterBadgeCapsuleActive]} onPress={() => setActiveFilter('approved')}><Text style={[styles.filterBadgeCapsuleText, activeFilter === 'approved' && styles.filterBadgeCapsuleTextActive]}>Approved &nbsp;<Text style={styles.badgeCountMutedStyle}>{approvedCount}</Text></Text></TouchableOpacity>
                    <TouchableOpacity style={[styles.filterBadgeCapsule, activeFilter === 'rejected' && styles.filterBadgeCapsuleActive]} onPress={() => setActiveFilter('rejected')}><Text style={[styles.filterBadgeCapsuleText, activeFilter === 'rejected' && styles.filterBadgeCapsuleTextActive]}>Rejected &nbsp;<Text style={styles.badgeCountMutedStyle}>{rejectedCount}</Text></Text></TouchableOpacity>
                </ScrollView>
            </View>

            <View style={styles.updatedTimeBannerStripBar}>
                <Ionicons name="refresh-outline" size={14} color="#667085" style={{ marginRight: 6 }} />
                <Text style={styles.updatedTimeBannerStripBarText}>Pull down to refresh requests</Text>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#0B6655" style={{ marginTop: 40 }} />
            ) : filteredRequestsList.length === 0 ? (
                <View style={styles.centerFeedbackScreenContainer}>
                    <View style={styles.centerFeedbackIconOuterCircle}><Ionicons name="document-text-outline" size={24} color="#0B6655" /></View>
                    <Text style={styles.centerFeedbackHeadingTitleText}>No leave requests yet</Text>
                    <Text style={styles.centerFeedbackParagraphSubText}>Requests you send appear here with their status.</Text>
                    <TouchableOpacity style={styles.primaryActionButtonNodeFixedInline} onPress={onNavigateToApply}><Text style={styles.primaryActionButtonTextLabel}>+ Apply Leave</Text></TouchableOpacity>
                </View>
            ) : (
                <ScrollView 
                    contentContainerStyle={styles.scrollContentLayoutContainer} 
                    showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchLeaveRequests(); }} />}
                >
                    {filteredRequestsList.map((item) => (
                        <TouchableOpacity key={item.id} style={styles.leaveRequestListItemFloatingCard} activeOpacity={0.9} onPress={() => setSelectedRequest(item)}>
                            <View style={styles.listItemFloatingCardHeaderLineRow}>
                                <Text style={styles.leaveRequestListItemTitleHeader}>{item.type}</Text>
                                <View style={[styles.listItemStatusCapsuleBadge, { backgroundColor: item.bg }]}><Text style={[styles.listItemStatusCapsuleBadgeText, { color: item.color }]}>{item.status}</Text></View>
                            </View>
                            <Text style={styles.listItemFloatingCardDateDurationString}>{item.dates}</Text>
                            <View style={styles.listItemFloatingCardFooterLineRow}>
                                <Text style={styles.listItemFloatingCardAppliedDateMetaText}>Applied on: {item.appliedOn}</Text>
                                <Text style={styles.listItemFloatingCardTotalDaysDurationText}>{item.totalDays} {item.totalDays === 1 ? 'day' : 'days'}</Text>
                                <Ionicons name="chevron-forward" size={14} color="#D0D5DD" style={{ marginLeft: 4 }} />
                            </View>

                            {/* 🛠️ Admin Action Buttons for Pending Requests */}
                            {item.status === 'Pending' && (
                                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12, borderTopWidth: 1, borderColor: '#F2F4F7', paddingTop: 10 }}>
                                    <TouchableOpacity 
                                        style={{ backgroundColor: '#FEE4E2', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, marginRight: 8 }}
                                        onPress={(e) => { e.stopPropagation(); handleManageLeave(item.id, 'reject'); }}
                                    >
                                        <Text style={{ color: '#B42318', fontSize: 12, fontWeight: '700' }}>Reject</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity 
                                        style={{ backgroundColor: '#ECFDF3', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }}
                                        onPress={(e) => { e.stopPropagation(); handleManageLeave(item.id, 'approve'); }}
                                    >
                                        <Text style={{ color: '#027A48', fontSize: 12, fontWeight: '700' }}>Approve</Text>
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
    listItemFloatingCardTotalDaysDurationText: { fontSize: 13, fontWeight: '700', color: '#344054', flex: 1, textAlign: 'right' },
    detailsMainWhiteBlockContainerCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#EEF0F2', width: '100%' },
    detailsMainBlockCardHeaderTitle: { fontSize: 16, fontWeight: '700', color: '#101828' },
    detailsMainBlockCardCodeMetaString: { fontSize: 12, color: '#98A2B3', fontWeight: '500', marginTop: 2, marginBottom: 12 },
    detailsMatrixDataGridRow: { flexDirection: 'row', paddingVertical: 6, width: '100%' },
    detailsMatrixGridLabel: { fontSize: 13, color: '#667085', fontWeight: '500', width: 90 },
    detailsMatrixGridValue: { fontSize: 13, color: '#101828', fontWeight: '600', flex: 1 },
    inlineCommentAlertCardBoxRedContainer: { flexDirection: 'row', backgroundColor: '#FEF3F2', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#FECDCA', marginTop: 14, width: '100%' },
    inlineCommentAlertCardBoxRedText: { color: '#B42318', fontSize: 12, fontWeight: '500', lineHeight: 16, flex: 1 },
    approvalHistoryTreeHeaderLabelSection: { fontSize: 11, fontWeight: '700', color: '#667085', letterSpacing: 0.5, marginTop: 20, marginBottom: 10, paddingLeft: 2 },
    verticalTimelineOuterFrameContainer: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#EEF0F2', width: '100%' },
    timelineRowItemNode: { flexDirection: 'row', position: 'relative', paddingBottom: 24, width: '100%' },
    timelineStatusMarkerCircleNode: { width: 10, height: 10, borderRadius: 5, marginTop: 4, zIndex: 10, position: 'absolute', left: 0 },
    timelineVerticalConnectingTrackBarLine: { position: 'absolute', left: 4, top: 12, bottom: -4, width: 1, backgroundColor: '#EAECF0', zIndex: 1 },
    timelineDetailsTextContentBlockBox: { flex: 1, paddingLeft: 24 },
    timelineDetailsNodeTitleHeader: { fontSize: 14, fontWeight: '700', color: '#101828' },
    timelineDetailsNodeMetaSubText: { fontSize: 11, color: '#667085', marginTop: 3, fontWeight: '500' },
    centerFeedbackScreenContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24, height: SCREEN_HEIGHT - 180 },
    centerFeedbackIconOuterCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#F2F4F5', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
    centerFeedbackHeadingTitleText: { fontSize: 15, fontWeight: '700', color: '#101828', textAlign: 'center' },
    centerFeedbackParagraphSubText: { fontSize: 13, color: '#667085', marginTop: 4, textAlign: 'center', fontWeight: '500', lineHeight: 18 },
    primaryActionButtonNodeFixedInline: { backgroundColor: '#0B6655', borderRadius: 12, height: 46, justifyContent: 'center', alignItems: 'center', width: '100%', marginTop: 24 },
    primaryActionButtonTextLabel: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});