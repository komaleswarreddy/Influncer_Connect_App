import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  TextInput,
  Modal,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProgressStore } from '../../store/progress-store';
import { useCampaignStore } from '../../store/campaign-store';
import { usePostAnalyzerStore } from '../../store/post-analyzer-store';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { useKollab, font, type as kType } from '@/theme/kollab-tokens';
import { KollabButton } from '@/components/ui/KollabButton';
import { KollabAnalyzePulse } from '@/components/ui/KollabAnalyzePulse';
import { KollabStatusChip } from '@/components/ui/KollabStatusChip';
import { KollabSectionLabel } from '@/components/ui/KollabSectionLabel';
import { KollabScreenHeader } from '@/components/ui/KollabScreenHeader';
import { Glyph } from '@/components/ui/Glyph';
import { showKollabToast } from '@/components/ui/PremiumToast';
import { showKollabConfirm } from '@/components/ui/KollabDialog';
import { formatCampaignDisplayName } from '@/lib/format-campaign-display-name';
import type { KollabTokens } from '@/theme/kollab-tokens';
import {
  parsePostUrl,
  getPlatformColor,
  getPlatformLabel,
  splitPasteIntoUrls,
} from '../../lib/post-url-parser';
import { PostMetricsCard } from '../../components/PostMetricsCard';
import { isPostAnalyzerDailyLimitError } from '../../lib/post-analyzer-api';

const MAX_URL_FIELDS = 10;

/** Static panel-track colors — the summary card is always a dark panel regardless of the
 *  app's own light/dark theme (panelInk is fixed to #F5F3ED in both themes). */
const MILESTONE_TRACK = 'rgba(245,243,237,0.2)';
const MILESTONE_LABEL_MUTED = 'rgba(245,243,237,0.45)';
const SUMMARY_MILESTONES = ['Contract signed', 'Content live', 'Payout'] as const;

export type CampaignProgressPanelProps = {
  participationId: string;
  campaignId?: string;
  embedded?: boolean;
  headerSlot?: React.ReactNode;
};

function submissionStatusTone(status: string): keyof KollabTokens['statusChip'] {
  switch (status) {
    case 'approved':
      return 'live';
    case 'rejected':
      return 'warn';
    default:
      return 'neutral';
  }
}

export function CampaignProgressPanel({
  participationId,
  campaignId,
  embedded = false,
  headerSlot,
}: CampaignProgressPanelProps) {
  const closeSubmitModal = () => {
    setShowSubmitModal(false);
    setUrlFields(['']);
    setContentType('');
    setAnalyzedUrl('');
    setSelectedProgress(null);
    clearCurrentMetrics();
    clearBulkResults();
  };

  const router = useRouter();
  const kollab = useKollab();
  const {
    progressData,
    isLoading,
    error,
    fetchProgress,
    submitContent,
    updateSubmission,
    deleteSubmission,
  } = useProgressStore();
  const { campaigns, participations } = useCampaignStore();
  const [refreshing, setRefreshing] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [selectedProgress, setSelectedProgress] = useState<any>(null);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);
  const [editingContentUrl, setEditingContentUrl] = useState('');
  const [urlFields, setUrlFields] = useState<string[]>(['']);
  const [contentType, setContentType] = useState('');
  const [analyzedUrl, setAnalyzedUrl] = useState('');
  const {
    analyzeUrls,
    isAnalyzing,
    isBulkAnalyzing,
    currentMetrics,
    currentAnalysisId,
    currentPersistError,
    analyzeError,
    bulkResults,
    bulkError,
    dailyLimitError,
    quota,
    fetchQuota,
    clearCurrentMetrics,
    clearBulkResults,
  } = usePostAnalyzerStore();

  const progress = participationId ? progressData[participationId] : undefined;
  const campaign = campaigns.find((c) => c.id === campaignId);
  const participation = participations.find((p) => p.id === participationId);
  const promotionalLinks = participation?.promotionalLinks ?? [];
  const promotionalCodes = participation?.promotionalCodes ?? [];
  const hasPromoAssets = promotionalLinks.length > 0 || promotionalCodes.length > 0;
  const trimmedUrls = urlFields.map((u) => u.trim()).filter(Boolean);
  const isBusyAnalyzing = isAnalyzing || isBulkAnalyzing;
  const hitDailyLimit =
    Boolean(dailyLimitError) ||
    Boolean(analyzeError && isPostAnalyzerDailyLimitError(analyzeError)) ||
    Boolean(bulkError && isPostAnalyzerDailyLimitError(bulkError));
  const analyzeDisabled = isBusyAnalyzing;
  const didBackfillRefetch = React.useRef(false);

  useEffect(() => {
    if (participationId) fetchProgress(participationId);
    void fetchQuota();
  }, [participationId, fetchProgress, fetchQuota]);

  // One-shot refetch when summary is 0/0 but campaign still has content requirements
  useEffect(() => {
    if (!participationId || !progress) return;
    if (didBackfillRefetch.current) return;
    if (progress.summary.totalRequired !== 0) return;
    const reqs = campaign?.contentRequirements;
    if (!Array.isArray(reqs) || reqs.length === 0) return;
    didBackfillRefetch.current = true;
    void fetchProgress(participationId);
  }, [participationId, progress, campaign?.contentRequirements, fetchProgress]);

  useEffect(() => {
    const joined = trimmedUrls.join('\n');
    if (joined !== analyzedUrl) {
      clearCurrentMetrics();
      clearBulkResults();
    }
  }, [trimmedUrls.join('\n'), analyzedUrl, clearCurrentMetrics, clearBulkResults]);

  const styles = useKollabStyles(kollab);

  // If participationId is missing or invalid
  if (!participationId) {
    const missingBody = (
      <View style={styles.errorContainer}>
        <Glyph name="help" size={48} color={kollab.color.heat} />
        <Text style={styles.errorText}>No campaign participation selected.</Text>
        {!embedded ? (
          <KollabButton
            label="Go to Campaigns"
            onPress={() => router.push('/influencer/campaigns')}
          />
        ) : null}
      </View>
    );
    if (embedded) return <View style={styles.embeddedRoot}>{missingBody}</View>;
    return <SafeAreaView style={styles.container}>{missingBody}</SafeAreaView>;
  }

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProgress(participationId);
    setRefreshing(false);
  };

  const resetUrlFields = () => {
    setUrlFields(['']);
    setAnalyzedUrl('');
    clearCurrentMetrics();
    clearBulkResults();
  };

  const handleUrlFieldChange = (index: number, text: string) => {
    const pasted = splitPasteIntoUrls(text);
    if (pasted.length > 1) {
      setUrlFields((prev) => {
        const before = prev.slice(0, index);
        const after = prev.slice(index + 1).filter((u) => u.trim().length > 0);
        const merged = [...before, ...pasted, ...after];
        const deduped: string[] = [];
        const seen = new Set<string>();
        for (const u of merged) {
          const key = u.trim();
          if (!key) {
            if (deduped.length === 0) deduped.push('');
            continue;
          }
          if (seen.has(key)) continue;
          seen.add(key);
          deduped.push(u);
          if (deduped.length >= MAX_URL_FIELDS) break;
        }
        return deduped.length > 0 ? deduped.slice(0, MAX_URL_FIELDS) : [''];
      });
      clearCurrentMetrics();
      clearBulkResults();
      setAnalyzedUrl('');
      return;
    }
    setUrlFields((prev) => {
      const next = [...prev];
      next[index] = text;
      return next;
    });
  };

  const addUrlField = () => {
    setUrlFields((prev) => (prev.length < MAX_URL_FIELDS ? [...prev, ''] : prev));
  };

  const removeUrlField = (index: number) => {
    setUrlFields((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleAnalyzeAll = async () => {
    if (trimmedUrls.length === 0) {
      showKollabToast('Paste a post URL to analyze');
      return;
    }
    const outcome = await analyzeUrls(trimmedUrls, campaignId);
    const limitHit =
      dailyLimitError ||
      (analyzeError && isPostAnalyzerDailyLimitError(analyzeError)) ||
      (bulkError && isPostAnalyzerDailyLimitError(bulkError)) ||
      Boolean(usePostAnalyzerStore.getState().dailyLimitError);
    // Clear URL fields after a successful analyze or a quota notice.
    if (
      limitHit ||
      (outcome.mode === 'single' && outcome.metrics) ||
      (outcome.mode === 'bulk' && outcome.result && outcome.result.results.length > 0)
    ) {
      resetUrlFields();
    }
    if (limitHit) {
      void fetchQuota();
      return;
    }
    if (outcome.mode === 'single' && outcome.metrics) {
      setAnalyzedUrl(trimmedUrls.join('\n'));
    } else if (outcome.mode === 'bulk' && outcome.result && outcome.result.results.length > 0) {
      setAnalyzedUrl(trimmedUrls.join('\n'));
    }
  };

  const handleSubmitUrlOnly = async () => {
    if (trimmedUrls.length === 0) {
      showKollabToast('Enter a content URL to submit.');
      return;
    }
    const firstUrl = trimmedUrls[0];
    const parsed = parsePostUrl(firstUrl);
    if (!parsed?.isValid) {
      showKollabToast(parsed?.error ?? 'Enter a valid post URL.');
      return;
    }
    if (!contentType.trim()) {
      showKollabToast('Please fill in all fields');
      return;
    }
    try {
      await submitContent(participationId, {
        progressId: selectedProgress.id,
        contentUrl: firstUrl.trim(),
        contentType: contentType.trim(),
        analysisId: null,
      });
      closeSubmitModal();
      showKollabToast('Content submitted successfully!');
    } catch (error: any) {
      showKollabToast(error.message || 'Failed to submit content');
    }
  };

  const handleSubmitContent = async () => {
    if (!currentMetrics) {
      showKollabToast('Please analyze the post URL before submitting.');
      return;
    }
    if (!contentType.trim()) {
      showKollabToast('Please fill in all fields');
      return;
    }

    try {
      await submitContent(participationId, {
        progressId: selectedProgress.id,
        contentUrl: currentMetrics.url.trim(),
        contentType: currentMetrics.contentType || contentType.trim(),
        analysisId: currentAnalysisId,
      });
      closeSubmitModal();
      showKollabToast('Content submitted successfully!');
    } catch (error: any) {
      showKollabToast(error.message || 'Failed to submit content');
    }
  };

  const handleSubmitProof = async (
    url: string,
    inferredContentType?: string,
    analysisId?: string | null
  ) => {
    if (!selectedProgress?.id) {
      showKollabToast('No requirement selected for submission.');
      return;
    }
    try {
      await submitContent(participationId, {
        progressId: selectedProgress.id,
        contentUrl: url.trim(),
        contentType: inferredContentType || contentType.trim() || 'generic_post',
        analysisId: analysisId ?? null,
      });
      showKollabToast('URL submitted as campaign proof.');
    } catch (error: any) {
      showKollabToast(error.message || 'Failed to submit URL proof');
    }
  };

  const handleDeleteSubmission = (submission: any) => {
    void showKollabConfirm({
      title: 'Delete submission?',
      message: 'Are you sure you want to delete this submission?',
      confirmLabel: 'Delete',
      destructive: true,
    }).then((ok) => {
      if (!ok) return;
      void deleteSubmission(submission.id)
        .then(() => showKollabToast('Submission deleted successfully!'))
        .catch((error: any) => showKollabToast(error.message || 'Failed to delete submission'));
    });
  };

  const openSubmitModal = (progressItem: any) => {
    setSelectedProgress(progressItem);
    setContentType(progressItem.contentType);
    resetUrlFields();
    setShowSubmitModal(true);
  };

  const handleCopyPromoLink = async (value: string) => {
    try {
      await Clipboard.setStringAsync(value);
      showKollabToast('Link copied');
    } catch {
      showKollabToast('Failed to copy tracking link.');
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      case 'pending':
        return 'Pending Review';
      default:
        return status;
    }
  };

  if (isLoading && !progress) {
    const loadingBody = (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={kollab.color.ink} />
        <Text style={styles.loadingText}>Loading progress...</Text>
      </View>
    );
    if (embedded) return <View style={styles.embeddedRoot}>{loadingBody}</View>;
    return <SafeAreaView style={styles.container}>{loadingBody}</SafeAreaView>;
  }

  if (error) {
    const errorBody = (
      <View style={styles.errorContainer}>
        <Glyph name="help" size={48} color={kollab.color.heat} />
        <Text style={styles.errorText}>{error}</Text>
        <KollabButton label="Retry" onPress={() => fetchProgress(participationId)} />
        {!embedded ? (
          <KollabButton
            label="Go to Campaigns"
            variant="soft"
            style={{ marginTop: 12 }}
            onPress={() => router.push('/influencer/campaigns')}
          />
        ) : null}
      </View>
    );
    if (embedded) return <View style={styles.embeddedRoot}>{errorBody}</View>;
    return <SafeAreaView style={styles.container}>{errorBody}</SafeAreaView>;
  }

  if (!progress) {
    const emptyBody = (
      <View style={styles.errorContainer}>
        <Glyph name="layers" size={48} color={kollab.color.violet} />
        <Text style={styles.errorText}>
          No progress data found for this campaign.{'\n'}You may need to join the campaign first.
        </Text>
        {!embedded ? (
          <KollabButton
            label="Go to Campaigns"
            onPress={() => router.push('/influencer/campaigns')}
          />
        ) : null}
      </View>
    );
    if (embedded) return <View style={styles.embeddedRoot}>{emptyBody}</View>;
    return <SafeAreaView style={styles.container}>{emptyBody}</SafeAreaView>;
  }

  const summaryPct = progress.summary.percentage;
  const milestoneFills = [summaryPct > 0, summaryPct >= 50, summaryPct >= 100];
  const doneReqCount = progress.progress.filter((r) => r.completedCount >= r.requiredCount).length;
  const campaignTitle = formatCampaignDisplayName(campaign?.name);
  const brandName = campaign?.tenant?.tenantName || 'Brand';

  const mainContent = (
    <>
      {!embedded ? (
        <View style={{ paddingHorizontal: 22 }}>
          <KollabScreenHeader
            title="Collab progress"
            subtitle={`${campaignTitle} · ${brandName}`}
            backTone="card"
          />
        </View>
      ) : null}

      <ScrollView
        style={styles.scrollView}
        nestedScrollEnabled={embedded}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={embedded ? styles.embeddedScrollContent : styles.scrollContent}
      >
        {headerSlot}
        <View style={styles.summaryCard}>
          <View style={styles.summaryTopRow}>
            <View style={styles.summaryTopRowBody}>
              <Text style={styles.summaryLabel}>submitted</Text>
              <Text style={styles.summaryBig}>
                {progress.summary.totalCompleted}
                <Text style={styles.summaryBigMuted}> / {progress.summary.totalRequired}</Text>
              </Text>
              <Text style={styles.summaryDoneLine}>
                {doneReqCount} of {progress.progress.length} deliverables done
              </Text>
            </View>
            <View style={styles.summaryPctPill}>
              <Text style={styles.summaryPctPillText}>{progress.summary.percentage}%</Text>
            </View>
          </View>

          <View style={styles.summaryProgressBar}>
            <View
              style={[styles.summaryProgressFill, { width: `${progress.summary.percentage}%` }]}
            />
          </View>

          <View style={styles.milestoneRow}>
            {SUMMARY_MILESTONES.map((label, index) => {
              const isFilled = milestoneFills[index];
              return (
                <View key={label} style={styles.milestoneSegment}>
                  <View
                    style={[
                      styles.milestoneBar,
                      { backgroundColor: isFilled ? kollab.color.chartreuse : MILESTONE_TRACK },
                    ]}
                  />
                  <Text
                    style={[
                      styles.milestoneLabel,
                      { color: isFilled ? kollab.color.chartreuse : MILESTONE_LABEL_MUTED },
                    ]}
                  >
                    {label}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Content Requirements */}
        <View style={styles.section}>
          <KollabSectionLabel label="requirements" />
          {progress.progress.length === 0 ? (
            <View style={styles.emptyProgressCard}>
              <Text style={styles.emptyProgressTitle}>No requirements configured yet</Text>
              <Text style={styles.emptyProgressText}>
                You can still submit your campaign URL as proof
                {hitDailyLimit ? ' without analysis today.' : ' using Post Analyzer.'}
              </Text>
            </View>
          ) : null}
          {progress.progress.map((progressItem) => {
            const isRequirementDone = progressItem.completedCount >= progressItem.requiredCount;
            const requirementPct =
              progressItem.requiredCount > 0
                ? Math.min(100, (progressItem.completedCount / progressItem.requiredCount) * 100)
                : 0;
            return (
              <View key={progressItem.id} style={styles.progressCard}>
                <View style={styles.requirementRow}>
                  <View
                    style={[
                      styles.requirementWell,
                      {
                        backgroundColor: isRequirementDone
                          ? kollab.color.tealTint
                          : kollab.color.well,
                      },
                    ]}
                  >
                    <Glyph
                      name={isRequirementDone ? 'check' : 'schedule'}
                      size={18}
                      color={isRequirementDone ? kollab.color.teal : kollab.color.heat}
                    />
                  </View>
                  <View style={styles.requirementBody}>
                    <Text
                      style={[
                        styles.contentType,
                        isRequirementDone ? styles.contentTypeDone : null,
                      ]}
                    >
                      {progressItem.contentType}
                    </Text>
                    <Text style={styles.requirementMeta}>
                      {progressItem.completedCount} of {progressItem.requiredCount}
                      {progressItem.schedule ? ` · ${progressItem.schedule}` : ''}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.reqChip,
                      { color: isRequirementDone ? kollab.color.teal : kollab.color.heat },
                    ]}
                  >
                    {isRequirementDone ? 'Done' : 'Pending'}
                  </Text>
                </View>

                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${requirementPct}%` }]} />
                </View>

                {progressItem.schedule ? (
                  <Text style={styles.scheduleText}>Schedule: {progressItem.schedule}</Text>
                ) : null}

                {/* Submissions */}
                {progressItem.submissions && progressItem.submissions.length > 0 ? (
                  <View style={styles.submissionsContainer}>
                    <Text style={styles.submissionsTitle}>Submissions:</Text>
                    {progressItem.submissions.map((submission) => (
                      <View key={submission.id} style={styles.submissionItem}>
                        <View style={styles.submissionHeader}>
                          <Text style={styles.submissionDate}>
                            {new Date(submission.submissionDate).toLocaleDateString()}
                          </Text>
                          <KollabStatusChip
                            tone={submissionStatusTone(submission.status)}
                            label={getStatusText(submission.status)}
                          />
                        </View>

                        {submission.id === selectedSubmissionId ? (
                          <View style={styles.editRow}>
                            <TextInput
                              style={[styles.textInput, { flex: 1, marginBottom: 0 }]}
                              value={editingContentUrl}
                              onChangeText={setEditingContentUrl}
                              placeholder="Enter new content URL"
                              placeholderTextColor={
                                kollab.isDark ? kollab.color.inkMuted : kollab.color.inkFaint
                              }
                              multiline
                              autoFocus
                            />
                            <KollabButton
                              label="Save"
                              compact
                              style={{ marginLeft: 4 }}
                              onPress={async () => {
                                if (!editingContentUrl.trim()) {
                                  showKollabToast('Please enter a content URL');
                                  return;
                                }
                                try {
                                  await updateSubmission(submission.id, {
                                    contentUrl: editingContentUrl.trim(),
                                  });
                                  setSelectedSubmissionId(null);
                                  setEditingContentUrl('');
                                  showKollabToast('Submission updated successfully!');
                                } catch (error: any) {
                                  showKollabToast(error.message || 'Failed to update submission');
                                }
                              }}
                            />
                            <KollabButton
                              label="Cancel"
                              variant="soft"
                              compact
                              style={{ marginLeft: 4 }}
                              onPress={() => {
                                setSelectedSubmissionId(null);
                                setEditingContentUrl('');
                              }}
                            />
                          </View>
                        ) : (
                          <View style={styles.readRow}>
                            <Text style={styles.contentUrl} numberOfLines={2}>
                              {submission.contentUrl}
                            </Text>
                            <View style={styles.actionsRow}>
                              <Pressable
                                style={styles.actionButton}
                                onPress={() => {
                                  setSelectedSubmissionId(submission.id);
                                  setEditingContentUrl(submission.contentUrl);
                                }}
                                disabled={
                                  selectedSubmissionId !== null &&
                                  selectedSubmissionId !== submission.id
                                }
                              >
                                <Text style={styles.actionButtonText}>Edit</Text>
                              </Pressable>
                              <Pressable
                                style={[styles.actionButton, styles.deleteButton]}
                                onPress={() => handleDeleteSubmission(submission)}
                              >
                                <Text style={[styles.actionButtonText, styles.deleteButtonText]}>
                                  Delete
                                </Text>
                              </Pressable>
                            </View>
                          </View>
                        )}

                        {submission.feedback ? (
                          <Text style={styles.feedbackText}>Feedback: {submission.feedback}</Text>
                        ) : null}
                      </View>
                    ))}
                  </View>
                ) : null}

                {/* Submit Button */}
                {progressItem.completedCount < progressItem.requiredCount ? (
                  <KollabButton
                    label="Submit content"
                    variant="ink"
                    onPress={() => openSubmitModal(progressItem)}
                    style={{ marginTop: 14 }}
                  />
                ) : null}
              </View>
            );
          })}
        </View>

        {/* Promo Assets */}
        <View style={styles.section}>
          <KollabSectionLabel label="Promo assets" />
          {hasPromoAssets ? (
            <View style={styles.promoList}>
              {promotionalLinks.map((link, index) => (
                <View key={`promo-link-${index}`} style={styles.promoRow}>
                  <View style={styles.promoRowBody}>
                    <Text style={styles.promoRowLabel}>Tracking link</Text>
                    <Text style={styles.promoRowValue} numberOfLines={1}>
                      {link}
                    </Text>
                  </View>
                  <Pressable
                    style={styles.promoCopyButton}
                    onPress={() => handleCopyPromoLink(link)}
                  >
                    <Text style={styles.promoCopyButtonText}>Copy</Text>
                  </Pressable>
                </View>
              ))}
              {promotionalCodes.map((code, index) => (
                <View key={`promo-code-${index}`} style={styles.promoRow}>
                  <View style={styles.promoRowBody}>
                    <Text style={styles.promoRowLabel}>Promo code</Text>
                    <Text style={styles.promoCodeValue}>{code}</Text>
                  </View>
                  <View style={styles.promoActiveChip}>
                    <Text style={styles.promoActiveChipText}>Active</Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.promoEmptyCard}>
              <Text style={styles.promoEmptyText}>
                No tracking link or promo code yet. The brand issues these once the contract is
                signed.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Submit Content Modal */}
      <Modal
        visible={showSubmitModal}
        animationType="slide"
        transparent
        onRequestClose={closeSubmitModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView
              style={styles.modalScroll}
              contentContainerStyle={styles.modalScrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.modalTitle}>Submit Content</Text>

              <Text style={styles.modalLabel}>Content Type</Text>
              <Text style={styles.modalValue}>{contentType}</Text>

              <Text style={styles.modalLabel}>Content URL(s) *</Text>
              {urlFields.map((fieldValue, index) => {
                const fieldParsed = fieldValue.trim() ? parsePostUrl(fieldValue) : null;
                return (
                  <View key={`url-field-${index}`} style={styles.urlFieldRow}>
                    <View style={styles.urlFieldInputWrap}>
                      <TextInput
                        style={styles.textInput}
                        value={fieldValue}
                        onChangeText={(text) => handleUrlFieldChange(index, text)}
                        placeholder={
                          index === 0 ? 'Paste post URL (or multiple URLs)' : `URL ${index + 1}`
                        }
                        placeholderTextColor={
                          kollab.isDark ? kollab.color.inkMuted : kollab.color.inkFaint
                        }
                        autoCapitalize="none"
                        autoCorrect={false}
                        multiline
                        selectionColor={kollab.color.ink}
                      />
                      {fieldValue.trim() ? (
                        <View style={styles.validationWrap}>
                          {fieldParsed?.isValid ? (
                            <View
                              style={[
                                styles.platformBadge,
                                { backgroundColor: getPlatformColor(fieldParsed.platform) },
                              ]}
                            >
                              <Text style={styles.platformBadgeText}>
                                {getPlatformLabel(fieldParsed.platform)}
                              </Text>
                            </View>
                          ) : (
                            <Text style={styles.validationError}>
                              {fieldParsed?.error ?? 'Invalid URL'}
                            </Text>
                          )}
                        </View>
                      ) : null}
                    </View>
                    {urlFields.length > 1 ? (
                      <Pressable
                        style={styles.removeUrlButton}
                        onPress={() => removeUrlField(index)}
                        accessibilityLabel={`Remove URL field ${index + 1}`}
                      >
                        <Text
                          style={{ color: kollab.color.heat, fontSize: 18, fontFamily: font.bold }}
                        >
                          ×
                        </Text>
                      </Pressable>
                    ) : null}
                  </View>
                );
              })}

              {urlFields.length < MAX_URL_FIELDS ? (
                <Pressable style={styles.addUrlButton} onPress={addUrlField}>
                  <Text style={styles.addUrlButtonText}>
                    + Add URL ({urlFields.length}/{MAX_URL_FIELDS})
                  </Text>
                </Pressable>
              ) : (
                <Text style={styles.urlCapHint}>Maximum {MAX_URL_FIELDS} URLs</Text>
              )}

              {quota && !hitDailyLimit ? (
                <Text style={styles.quotaHint}>
                  {`${quota.remaining} of ${quota.limit} analyses left today`}
                </Text>
              ) : null}

              {hitDailyLimit && trimmedUrls.length > 0 && !currentMetrics && !bulkResults ? (
                <KollabButton
                  label={isLoading ? 'Submitting...' : 'Submit URL'}
                  disabled={isLoading}
                  onPress={() => void handleSubmitUrlOnly()}
                  style={{ marginBottom: 12 }}
                />
              ) : null}

              {isBusyAnalyzing ? (
                <View style={{ marginBottom: 12 }}>
                  <KollabAnalyzePulse />
                </View>
              ) : !hitDailyLimit && trimmedUrls.length > 0 && !currentMetrics && !bulkResults ? (
                <KollabButton
                  label={
                    trimmedUrls.length === 1
                      ? 'Analyze Post'
                      : `Analyze all (${trimmedUrls.length})`
                  }
                  disabled={analyzeDisabled}
                  onPress={handleAnalyzeAll}
                  style={{ marginBottom: 12 }}
                />
              ) : null}

              {(() => {
                const limitMsg = hitDailyLimit;
                const hardError =
                  analyzeError && !isPostAnalyzerDailyLimitError(analyzeError)
                    ? analyzeError
                    : bulkError && !isPostAnalyzerDailyLimitError(bulkError)
                      ? bulkError
                      : null;
                if (limitMsg && !isBusyAnalyzing) {
                  return (
                    <View style={styles.limitNotice}>
                      <Text style={styles.limitNoticeTitle}>Daily analysis limit reached</Text>
                      <Text style={styles.limitNoticeBody}>
                        Your free analysis resets at midnight (UTC). You can still submit the URL as
                        campaign proof without a new analysis.
                      </Text>
                    </View>
                  );
                }
                if (hardError) {
                  return <Text style={styles.validationError}>{hardError}</Text>;
                }
                return null;
              })()}
              {currentPersistError ? (
                <Text style={styles.persistWarningText}>
                  Analysis fetched successfully, but history save had an issue (
                  {currentPersistError}).
                </Text>
              ) : null}

              {currentMetrics ? (
                <PostMetricsCard
                  metrics={currentMetrics}
                  onSubmit={handleSubmitContent}
                  submitLabel="Submit as Campaign Proof"
                  isSubmitting={isLoading}
                  showAuthenticitySignals={false}
                />
              ) : null}

              {bulkResults ? (
                <View style={{ marginBottom: 8 }}>
                  <Text style={styles.batchSummaryText}>
                    Results: {bulkResults.summary.successful}/{bulkResults.summary.total} successful
                  </Text>
                  {bulkResults.results.map((item, idx) => (
                    <View key={`${item.url}-${idx}`} style={{ marginBottom: 8 }}>
                      <PostMetricsCard metrics={item} compact />
                      <View style={styles.batchRowActions}>
                        <KollabButton
                          label="Submit this proof"
                          compact
                          onPress={() =>
                            handleSubmitProof(item.url, item.contentType, item.analysisId)
                          }
                        />
                      </View>
                    </View>
                  ))}
                  {bulkResults.errors.length > 0 ? (
                    <Text style={styles.validationError}>
                      {bulkResults.errors.length} URL(s) failed. Fix and retry those URLs.
                    </Text>
                  ) : null}
                </View>
              ) : null}

              <View
                style={[
                  styles.modalActions,
                  currentMetrics || bulkResults ? { marginTop: 0 } : null,
                ]}
              >
                <KollabButton label="Cancel" variant="soft" onPress={closeSubmitModal} />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );

  if (embedded) {
    return <View style={styles.embeddedRoot}>{mainContent}</View>;
  }

  return <SafeAreaView style={styles.container}>{mainContent}</SafeAreaView>;
}

function useKollabStyles(kollab: KollabTokens) {
  return React.useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: kollab.color.screen,
        },
        embeddedRoot: {
          flex: 1,
          minHeight: 0,
        },
        embeddedScrollContent: {
          paddingBottom: 60,
          paddingHorizontal: 22,
        },
        scrollContent: {
          paddingHorizontal: 22,
          paddingBottom: 60,
        },
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: kollab.space.md,
          paddingVertical: kollab.space.sm,
          backgroundColor: kollab.color.screen,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: kollab.color.hairline,
        },
        backButton: {
          padding: 4,
        },
        headerTitle: {
          ...kType.sectionTitle,
          color: kollab.color.ink,
        },
        campaignInfo: {
          backgroundColor: kollab.color.card,
          padding: kollab.space.md,
          marginBottom: 8,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: kollab.color.hairline,
        },
        campaignName: {
          fontFamily: kollab.font.bold,
          fontSize: 16,
          color: kollab.color.ink,
          marginBottom: 4,
        },
        campaignDesc: {
          fontFamily: kollab.font.body,
          fontSize: 13,
          color: kollab.color.inkMuted,
          lineHeight: 20,
        },
        scrollView: {
          flex: 1,
        },
        summaryCard: {
          backgroundColor: kollab.color.panel,
          marginBottom: 14,
          padding: 22,
          borderRadius: 24,
        },
        summaryTopRow: {
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: kollab.space.sm,
        },
        summaryTopRowBody: {
          flex: 1,
        },
        summaryLabel: {
          fontFamily: kollab.font.body,
          fontSize: 12,
          color: kollab.color.panelInk,
          opacity: 0.6,
        },
        summaryBig: {
          fontFamily: kollab.font.display,
          fontSize: 40,
          color: kollab.color.panelInk,
          marginVertical: 2,
        },
        summaryBigMuted: {
          fontFamily: kollab.font.display,
          fontSize: 26,
          color: kollab.color.panelInk,
          opacity: 0.5,
        },
        summaryDoneLine: {
          fontFamily: kollab.font.body,
          fontSize: 12,
          color: kollab.color.panelInk,
          opacity: 0.6,
          marginTop: 2,
        },
        summaryPctPill: {
          backgroundColor: kollab.color.chartreuse,
          borderRadius: kollab.radius.pill,
          paddingHorizontal: 15,
          paddingVertical: 9,
          flexShrink: 0,
        },
        summaryPctPillText: {
          fontFamily: kollab.font.display,
          fontSize: 17,
          color: kollab.color.onChartreuse,
        },
        summaryProgressBar: {
          height: 7,
          borderRadius: kollab.radius.pill,
          backgroundColor: 'rgba(245,243,237,0.18)',
          overflow: 'hidden',
          marginTop: 16,
        },
        summaryProgressFill: {
          height: '100%',
          borderRadius: kollab.radius.pill,
          backgroundColor: kollab.color.chartreuse,
        },
        milestoneRow: {
          flexDirection: 'row',
          gap: 6,
          marginTop: 14,
        },
        milestoneSegment: {
          flex: 1,
        },
        milestoneBar: {
          height: 5,
          borderRadius: kollab.radius.pill,
        },
        milestoneLabel: {
          fontFamily: kollab.font.semiBold,
          fontSize: 10,
          marginTop: 5,
        },
        progressBar: {
          height: 7,
          backgroundColor: kollab.color.hairline,
          borderRadius: 999,
          overflow: 'hidden',
          marginBottom: 8,
        },
        progressFill: {
          height: '100%',
          backgroundColor: kollab.color.chartreuse,
          borderRadius: 999,
        },
        section: {
          marginBottom: 18,
        },
        progressCard: {
          backgroundColor: kollab.color.card,
          paddingVertical: 13,
          paddingHorizontal: 15,
          borderRadius: kollab.radius.row,
          marginBottom: kollab.space.sm,
          ...kollab.shadow.card,
        },
        emptyProgressCard: {
          backgroundColor: kollab.color.card,
          padding: kollab.space.md,
          borderRadius: kollab.radius.tile,
          marginBottom: kollab.space.sm,
          ...kollab.shadow.card,
        },
        emptyProgressTitle: {
          fontFamily: kollab.font.bold,
          fontSize: 14,
          color: kollab.color.ink,
          marginBottom: 6,
        },
        emptyProgressText: {
          fontFamily: kollab.font.body,
          fontSize: 13,
          color: kollab.color.inkMuted,
          marginBottom: 8,
          lineHeight: 19,
        },
        requirementRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          marginBottom: 10,
        },
        requirementWell: {
          width: 38,
          height: 38,
          borderRadius: 999,
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        },
        requirementBody: {
          flex: 1,
          minWidth: 0,
        },
        reqChip: {
          fontFamily: kollab.font.bold,
          fontSize: 10.5,
          letterSpacing: 0.8,
          textTransform: 'uppercase',
          flexShrink: 0,
        },
        requirementMeta: {
          fontFamily: kollab.font.body,
          fontSize: 12,
          color: kollab.color.inkMuted,
          marginTop: 2,
        },
        contentType: {
          fontFamily: kollab.font.bold,
          fontSize: 14,
          color: kollab.color.ink,
          textTransform: 'capitalize',
        },
        contentTypeDone: {
          textDecorationLine: 'line-through',
          opacity: 0.6,
        },
        promoList: {
          gap: kollab.space.sm,
        },
        promoRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          backgroundColor: kollab.color.card,
          borderRadius: kollab.radius.row,
          paddingVertical: 13,
          paddingHorizontal: 15,
          ...kollab.shadow.card,
        },
        promoRowBody: {
          flex: 1,
          minWidth: 0,
        },
        promoRowLabel: {
          fontFamily: kollab.font.body,
          fontSize: 11.5,
          color: kollab.color.inkMuted,
        },
        promoRowValue: {
          fontFamily: kollab.font.bold,
          fontSize: 12.5,
          color: kollab.color.ink,
          marginTop: 2,
        },
        promoCodeValue: {
          ...kType.sectionTitle,
          color: kollab.color.ink,
          marginTop: 1,
        },
        promoCopyButton: {
          backgroundColor: kollab.color.tint,
          borderRadius: kollab.radius.pill,
          paddingHorizontal: 12,
          paddingVertical: 6,
          flexShrink: 0,
        },
        promoCopyButtonText: {
          fontFamily: kollab.font.bold,
          fontSize: 11,
          color: kollab.color.violetDeep,
        },
        promoActiveChip: {
          backgroundColor: kollab.color.chartreuse,
          borderRadius: kollab.radius.pill,
          paddingHorizontal: 11,
          paddingVertical: 5,
          flexShrink: 0,
        },
        promoActiveChipText: {
          fontFamily: kollab.font.bold,
          fontSize: 11,
          color: kollab.color.onChartreuse,
        },
        promoEmptyCard: {
          borderRadius: kollab.radius.tile,
          borderWidth: 1.5,
          borderStyle: 'dashed',
          borderColor: kollab.color.hairline,
          padding: kollab.space.lg,
        },
        promoEmptyText: {
          fontFamily: kollab.font.body,
          fontSize: 13,
          color: kollab.color.inkMuted,
          textAlign: 'center',
          lineHeight: 19,
        },
        scheduleText: {
          fontFamily: kollab.font.semiBold,
          fontSize: 12,
          color: kollab.color.heat,
          marginTop: 4,
        },
        submissionsContainer: {
          marginTop: 12,
        },
        submissionsTitle: {
          fontFamily: kollab.font.bold,
          fontSize: 13,
          color: kollab.color.ink,
          marginBottom: 8,
        },
        submissionItem: {
          backgroundColor: kollab.color.well,
          padding: 12,
          borderRadius: kollab.radius.tile,
          marginBottom: 8,
        },
        submissionHeader: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 8,
        },
        readRow: {
          width: '100%',
        },
        editRow: {
          width: '100%',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          flexWrap: 'wrap',
        },
        actionsRow: {
          marginTop: 6,
          flexDirection: 'row',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 8,
        },
        submissionDate: {
          fontFamily: kollab.font.semiBold,
          fontSize: 12,
          color: kollab.color.inkMuted,
        },
        contentUrl: {
          fontFamily: kollab.font.medium,
          fontSize: 13,
          color: kollab.color.violet,
          marginBottom: 2,
          flexShrink: 1,
        },
        feedbackText: {
          fontFamily: kollab.font.semiBold,
          fontSize: 12,
          color: kollab.color.heat,
          fontStyle: 'italic',
          marginBottom: 8,
        },
        actionButton: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 10,
          paddingVertical: 6,
          borderRadius: kollab.radius.row,
          backgroundColor: kollab.color.card,
          marginRight: 8,
        },
        actionButtonText: {
          fontFamily: kollab.font.bold,
          fontSize: 13,
          color: kollab.color.ink,
          marginLeft: 4,
        },
        deleteButton: {
          backgroundColor: kollab.color.heat,
        },
        deleteButtonText: {
          color: kollab.color.inkOn,
        },
        loadingContainer: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
        },
        loadingText: {
          fontFamily: kollab.font.semiBold,
          marginTop: 12,
          fontSize: 14,
          color: kollab.color.ink,
        },
        errorContainer: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          padding: 32,
          gap: 12,
        },
        errorText: {
          fontFamily: kollab.font.bold,
          fontSize: 14,
          color: kollab.color.ink,
          textAlign: 'center',
          marginBottom: 4,
        },
        modalOverlay: {
          flex: 1,
          backgroundColor: 'rgba(11,9,6,0.5)',
          justifyContent: 'center',
          alignItems: 'center',
        },
        modalContent: {
          backgroundColor: kollab.color.card,
          borderRadius: kollab.radius.cardM,
          padding: kollab.space.md,
          margin: kollab.space.md,
          width: '92%',
          maxWidth: 420,
          ...kollab.shadow.card,
        },
        modalScroll: {
          maxHeight: '85%',
        },
        modalScrollContent: {
          paddingBottom: 10,
        },
        modalTitle: {
          ...kType.sectionTitle,
          color: kollab.color.ink,
          marginBottom: kollab.space.sm,
        },
        modalLabel: {
          fontFamily: kollab.font.semiBold,
          fontSize: 13,
          color: kollab.color.ink,
          marginBottom: 6,
        },
        modalValue: {
          fontFamily: kollab.font.semiBold,
          fontSize: 13,
          color: kollab.color.inkMuted,
          marginBottom: 14,
          textTransform: 'capitalize',
        },
        textInput: {
          borderWidth: 1,
          borderColor: kollab.color.hairline,
          borderRadius: kollab.radius.row,
          padding: 12,
          fontFamily: kollab.font.semiBold,
          fontSize: 14,
          color: kollab.color.ink,
          backgroundColor: kollab.color.well,
          marginBottom: 18,
          width: '100%',
          minHeight: 48,
        },
        modalActions: {
          flexDirection: 'row',
          justifyContent: 'flex-end',
          marginTop: 10,
          gap: 12,
        },
        validationWrap: {
          marginTop: -8,
          marginBottom: 12,
        },
        platformBadge: {
          alignSelf: 'flex-start',
          borderRadius: 999,
          paddingHorizontal: 10,
          paddingVertical: 5,
        },
        platformBadgeText: {
          fontFamily: kollab.font.semiBold,
          color: kollab.color.inkOn,
          fontSize: 11,
        },
        validationError: {
          fontFamily: kollab.font.semiBold,
          color: kollab.color.heat,
          fontSize: 12,
          marginBottom: 8,
        },
        limitNotice: {
          borderRadius: kollab.radius.tile,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: kollab.color.hairline,
          backgroundColor: kollab.color.tint,
          paddingHorizontal: kollab.space.sm,
          paddingVertical: kollab.space.sm,
          marginBottom: 8,
          gap: 4,
        },
        limitNoticeTitle: {
          fontFamily: kollab.font.semiBold,
          fontSize: 13,
          color: kollab.color.ink,
        },
        limitNoticeBody: {
          fontFamily: kollab.font.body,
          fontSize: 12,
          lineHeight: 17,
          color: kollab.color.inkMuted,
        },
        persistWarningText: {
          fontFamily: kollab.font.semiBold,
          color: kollab.color.heat,
          fontSize: 12,
          marginBottom: 8,
        },
        batchSummaryText: {
          fontFamily: kollab.font.semiBold,
          color: kollab.color.inkMuted,
          fontSize: 12,
          marginBottom: 8,
        },
        urlFieldRow: {
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: 8,
          marginBottom: 4,
        },
        urlFieldInputWrap: {
          flex: 1,
        },
        removeUrlButton: {
          paddingTop: 12,
          paddingHorizontal: 2,
        },
        addUrlButton: {
          flexDirection: 'row',
          alignItems: 'center',
          alignSelf: 'flex-start',
          gap: 4,
          marginBottom: 12,
          paddingVertical: 6,
          paddingHorizontal: 4,
        },
        addUrlButtonText: {
          fontFamily: kollab.font.semiBold,
          color: kollab.color.ink,
          fontSize: 13,
        },
        urlCapHint: {
          fontFamily: kollab.font.semiBold,
          color: kollab.color.inkFaint,
          fontSize: 12,
          marginBottom: 12,
        },
        quotaHint: {
          fontFamily: kollab.font.semiBold,
          color: kollab.color.inkMuted,
          fontSize: 12,
          marginBottom: 8,
        },
        batchRowActions: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          marginTop: 4,
          flexWrap: 'wrap',
        },
      }),
    [kollab]
  );
}
