import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
  TextInput,
  Modal,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProgressStore } from '../../store/progress-store';
import { useCampaignStore } from '../../store/campaign-store';
import { usePostAnalyzerStore } from '../../store/post-analyzer-store';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { appShell, palette, radius, shadow, spacing, useAppShell } from '@/theme';
import { fonts } from '@/components/ui/typography';
import {
  parsePostUrl,
  getPlatformColor,
  getPlatformLabel,
  splitPasteIntoUrls,
} from '../../lib/post-url-parser';
import { PostMetricsCard } from '../../components/PostMetricsCard';
import { isPostAnalyzerDailyLimitError } from '../../lib/post-analyzer-api';

const MAX_URL_FIELDS = 10;

export type CampaignProgressPanelProps = {
  participationId: string;
  campaignId?: string;
  embedded?: boolean;
  headerSlot?: React.ReactNode;
};

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
  const shell = useAppShell();
  const {
    progressData,
    isLoading,
    error,
    fetchProgress,
    submitContent,
    updateSubmission,
    deleteSubmission,
  } = useProgressStore();
  const { campaigns } = useCampaignStore();
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
  const trimmedUrls = urlFields.map((u) => u.trim()).filter(Boolean);
  const isBusyAnalyzing = isAnalyzing || isBulkAnalyzing;
  const analyzeDisabled = isBusyAnalyzing || (quota != null && quota.remaining <= 0);
  const analysisQuotaExhausted = quota != null && quota.remaining <= 0;
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

  // If participationId is missing or invalid
  if (!participationId) {
    const missingBody = (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={48} color={palette.error} />
        <Text style={styles.errorText}>No campaign participation selected.</Text>
        {!embedded ? (
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => router.push('/influencer/campaigns')}
          >
            <Text style={styles.retryButtonText}>Go to Campaigns</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    );
    if (embedded) return <View style={styles.embeddedRoot}>{missingBody}</View>;
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: shell.canvas }]}>
        {missingBody}
      </SafeAreaView>
    );
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
      Alert.alert('Error', 'Enter at least one content URL to analyze.');
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
      Alert.alert('Error', 'Enter a content URL to submit.');
      return;
    }
    const firstUrl = trimmedUrls[0];
    const parsed = parsePostUrl(firstUrl);
    if (!parsed?.isValid) {
      Alert.alert('Error', parsed?.error ?? 'Enter a valid post URL.');
      return;
    }
    if (!contentType.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
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
      Alert.alert('Success', 'Content submitted successfully!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to submit content');
    }
  };

  const handleSubmitContent = async () => {
    if (!currentMetrics) {
      Alert.alert('Error', 'Please analyze the post URL before submitting.');
      return;
    }
    if (!contentType.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
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
      Alert.alert('Success', 'Content submitted successfully!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to submit content');
    }
  };

  const handleSubmitProof = async (
    url: string,
    inferredContentType?: string,
    analysisId?: string | null
  ) => {
    if (!selectedProgress?.id) {
      Alert.alert('Error', 'No requirement selected for submission.');
      return;
    }
    try {
      await submitContent(participationId, {
        progressId: selectedProgress.id,
        contentUrl: url.trim(),
        contentType: inferredContentType || contentType.trim() || 'generic_post',
        analysisId: analysisId ?? null,
      });
      Alert.alert('Success', 'URL submitted as campaign proof.');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to submit URL proof');
    }
  };

  const handleDeleteSubmission = (submission: any) => {
    Alert.alert('Delete Submission', 'Are you sure you want to delete this submission?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteSubmission(submission.id);
            Alert.alert('Success', 'Submission deleted successfully!');
          } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to delete submission');
          }
        },
      },
    ]);
  };

  const openSubmitModal = (progressItem: any) => {
    setSelectedProgress(progressItem);
    setContentType(progressItem.contentType);
    resetUrlFields();
    setShowSubmitModal(true);
  };

  const openFallbackSubmitModal = () => {
    const fallback = {
      id: '__fallback__',
      contentType: 'generic_post',
      requiredCount: 1000,
      completedCount: 0,
    };
    openSubmitModal(fallback);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return appShell.success;
      case 'rejected':
        return palette.error;
      case 'pending':
        return appShell.warning;
      default:
        return appShell.textMuted;
    }
  };

  const getStatusTextColor = (status: string) => {
    switch (status) {
      case 'approved':
        return palette.white;
      case 'rejected':
        return palette.white;
      case 'pending':
        return palette.white;
      default:
        return appShell.cta; // Brand primary on gray background
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
        <ActivityIndicator size="large" color={appShell.cta} />
        <Text style={styles.loadingText}>Loading progress...</Text>
      </View>
    );
    if (embedded) return <View style={styles.embeddedRoot}>{loadingBody}</View>;
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: shell.canvas }]}>
        {loadingBody}
      </SafeAreaView>
    );
  }

  if (error) {
    const errorBody = (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={48} color={palette.error} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => fetchProgress(participationId)}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
        {!embedded ? (
          <TouchableOpacity
            style={[styles.retryButton, { marginTop: 12, backgroundColor: appShell.canvasAlt }]}
            onPress={() => router.push('/influencer/campaigns')}
          >
            <Text style={[styles.retryButtonText, { color: appShell.cta }]}>Go to Campaigns</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    );
    if (embedded) return <View style={styles.embeddedRoot}>{errorBody}</View>;
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: shell.canvas }]}>
        {errorBody}
      </SafeAreaView>
    );
  }

  if (!progress) {
    const emptyBody = (
      <View style={styles.errorContainer}>
        <Ionicons name="information-circle" size={48} color={appShell.cta} />
        <Text style={styles.errorText}>
          No progress data found for this campaign.{'\n'}You may need to join the campaign first.
        </Text>
        {!embedded ? (
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => router.push('/influencer/campaigns')}
          >
            <Text style={styles.retryButtonText}>Go to Campaigns</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    );
    if (embedded) return <View style={styles.embeddedRoot}>{emptyBody}</View>;
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: shell.canvas }]}>
        {emptyBody}
      </SafeAreaView>
    );
  }

  const mainContent = (
    <>
      {!embedded ? (
        <View
          style={[
            styles.header,
            { backgroundColor: shell.card, borderBottomColor: shell.borderSubtle },
          ]}
        >
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={appShell.cta} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Campaign Progress</Text>
          <View style={{ width: 24 }} />
        </View>
      ) : null}

      {!embedded && campaign ? (
        <View style={[styles.campaignInfo, { backgroundColor: shell.card }]}>
          <Text style={styles.campaignName}>{campaign.name}</Text>
          <Text style={styles.campaignDesc} numberOfLines={2}>
            {campaign.description}
          </Text>
        </View>
      ) : null}

      <ScrollView
        style={styles.scrollView}
        nestedScrollEnabled={embedded}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={embedded ? styles.embeddedScrollContent : undefined}
      >
        {headerSlot}
        {/* Progress Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Overall Progress</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress.summary.percentage}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {progress.summary.totalCompleted} of {progress.summary.totalRequired} completed (
            {progress.summary.percentage}%)
          </Text>
        </View>

        {/* Content Requirements */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Content Requirements</Text>
          {progress.progress.length === 0 ? (
            <View style={styles.emptyProgressCard}>
              <Text style={styles.emptyProgressTitle}>No requirements configured yet</Text>
              <Text style={styles.emptyProgressText}>
                You can still submit your campaign URL as proof
                {analysisQuotaExhausted ? ' without analysis today.' : ' using Post Analyzer.'}
              </Text>
              <TouchableOpacity style={styles.submitButton} onPress={openFallbackSubmitModal}>
                <Ionicons name="add-circle" size={20} color="white" />
                <Text style={styles.submitButtonText}>Submit URL Proof</Text>
              </TouchableOpacity>
            </View>
          ) : null}
          {progress.progress.map((progressItem) => (
            <View
              key={progressItem.id}
              style={[
                styles.progressCard,
                { backgroundColor: shell.card, borderColor: shell.cardBorder },
              ]}
            >
              <View style={styles.progressHeader}>
                <Text style={styles.contentType}>{progressItem.contentType}</Text>
                <Text style={styles.progressCount}>
                  {progressItem.completedCount}/{progressItem.requiredCount}
                </Text>
              </View>

              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${
                        progressItem.requiredCount > 0
                          ? Math.min(
                              100,
                              (progressItem.completedCount / progressItem.requiredCount) * 100
                            )
                          : 0
                      }%`,
                    },
                  ]}
                />
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
                        <View
                          style={[
                            styles.statusBadge,
                            { backgroundColor: getStatusColor(submission.status) },
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusText,
                              { color: getStatusTextColor(submission.status) },
                            ]}
                          >
                            {getStatusText(submission.status)}
                          </Text>
                        </View>
                      </View>

                      {submission.id === selectedSubmissionId ? (
                        <View style={styles.editRow}>
                          <TextInput
                            style={[styles.textInput, { flex: 1, marginBottom: 0 }]}
                            value={editingContentUrl}
                            onChangeText={setEditingContentUrl}
                            placeholder="Enter new content URL"
                            multiline
                            autoFocus
                          />
                          <TouchableOpacity
                            style={[styles.confirmButton, { marginLeft: 4 }]}
                            onPress={async () => {
                              if (!editingContentUrl.trim()) {
                                Alert.alert('Error', 'Please enter a content URL');
                                return;
                              }
                              try {
                                await updateSubmission(submission.id, {
                                  contentUrl: editingContentUrl.trim(),
                                });
                                setSelectedSubmissionId(null);
                                setEditingContentUrl('');
                                Alert.alert('Success', 'Submission updated successfully!');
                              } catch (error: any) {
                                Alert.alert(
                                  'Error',
                                  error.message || 'Failed to update submission'
                                );
                              }
                            }}
                          >
                            <Text style={styles.confirmButtonText}>Save</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.cancelButton, { marginLeft: 4 }]}
                            onPress={() => {
                              setSelectedSubmissionId(null);
                              setEditingContentUrl('');
                            }}
                          >
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <View style={styles.readRow}>
                          <Text style={styles.contentUrl} numberOfLines={2}>
                            {submission.contentUrl}
                          </Text>
                          <View style={styles.actionsRow}>
                            <TouchableOpacity
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
                              <Ionicons name="pencil" size={16} color={appShell.cta} />
                              <Text style={styles.actionButtonText}>Edit</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[styles.actionButton, styles.deleteButton]}
                              onPress={() => handleDeleteSubmission(submission)}
                            >
                              <Ionicons name="trash" size={16} color={palette.white} />
                              <Text style={[styles.actionButtonText, styles.deleteButtonText]}>
                                Delete
                              </Text>
                            </TouchableOpacity>
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
              {progressItem.completedCount < progressItem.requiredCount && (
                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={() => openSubmitModal(progressItem)}
                >
                  <Ionicons name="add-circle" size={20} color="white" />
                  <Text style={styles.submitButtonText}>Submit Content</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
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
                        style={[
                          styles.textInput,
                          {
                            backgroundColor: shell.canvasAlt,
                            borderColor: shell.borderSubtle,
                            color: shell.textPrimary,
                          },
                        ]}
                        value={fieldValue}
                        onChangeText={(text) => handleUrlFieldChange(index, text)}
                        placeholder={
                          index === 0 ? 'Paste post URL (or multiple URLs)' : `URL ${index + 1}`
                        }
                        placeholderTextColor={shell.textMuted}
                        autoCapitalize="none"
                        autoCorrect={false}
                        multiline
                        selectionColor={shell.cta}
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
                      <TouchableOpacity
                        style={styles.removeUrlButton}
                        onPress={() => removeUrlField(index)}
                        accessibilityLabel={`Remove URL field ${index + 1}`}
                      >
                        <Ionicons name="close-circle" size={22} color={palette.error} />
                      </TouchableOpacity>
                    ) : null}
                  </View>
                );
              })}

              {urlFields.length < MAX_URL_FIELDS ? (
                <TouchableOpacity style={styles.addUrlButton} onPress={addUrlField}>
                  <Ionicons name="add" size={18} color={appShell.cta} />
                  <Text style={styles.addUrlButtonText}>
                    Add URL ({urlFields.length}/{MAX_URL_FIELDS})
                  </Text>
                </TouchableOpacity>
              ) : (
                <Text style={styles.urlCapHint}>Maximum {MAX_URL_FIELDS} URLs</Text>
              )}

              {quota ? (
                <Text style={styles.quotaHint}>
                  {analysisQuotaExhausted
                    ? 'Analysis used for today — submit your URL as proof'
                    : `${quota.remaining} of ${quota.limit} analyses left today`}
                </Text>
              ) : null}

              {analysisQuotaExhausted &&
              trimmedUrls.length > 0 &&
              !currentMetrics &&
              !bulkResults ? (
                <TouchableOpacity
                  style={[styles.analyzeButton, isLoading && styles.disabledButton]}
                  onPress={() => void handleSubmitUrlOnly()}
                  disabled={isLoading}
                >
                  <Text style={styles.analyzeButtonText}>
                    {isLoading ? 'Submitting...' : 'Submit URL'}
                  </Text>
                </TouchableOpacity>
              ) : null}

              {!analysisQuotaExhausted &&
              trimmedUrls.length > 0 &&
              !currentMetrics &&
              !bulkResults ? (
                <TouchableOpacity
                  style={[styles.analyzeButton, analyzeDisabled && styles.disabledButton]}
                  onPress={handleAnalyzeAll}
                  disabled={analyzeDisabled}
                >
                  <Text style={styles.analyzeButtonText}>
                    {isBusyAnalyzing
                      ? 'Fetching post data...'
                      : trimmedUrls.length === 1
                        ? 'Analyze Post'
                        : `Analyze all (${trimmedUrls.length})`}
                  </Text>
                </TouchableOpacity>
              ) : null}

              {(() => {
                const limitMsg =
                  dailyLimitError ||
                  (analyzeError && isPostAnalyzerDailyLimitError(analyzeError)
                    ? analyzeError
                    : null) ||
                  (bulkError && isPostAnalyzerDailyLimitError(bulkError) ? bulkError : null);
                const hardError =
                  analyzeError && !isPostAnalyzerDailyLimitError(analyzeError)
                    ? analyzeError
                    : bulkError && !isPostAnalyzerDailyLimitError(bulkError)
                      ? bulkError
                      : null;
                if (limitMsg) {
                  return (
                    <View
                      style={[
                        styles.limitNotice,
                        { backgroundColor: shell.iceBlue, borderColor: shell.cardBorder },
                      ]}
                    >
                      <Text style={[styles.limitNoticeTitle, { color: shell.textPrimary }]}>
                        Daily analysis limit reached
                      </Text>
                      <Text style={[styles.limitNoticeBody, { color: shell.textSecondary }]}>
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
                        <TouchableOpacity
                          style={styles.batchSubmitButton}
                          onPress={() =>
                            handleSubmitProof(item.url, item.contentType, item.analysisId)
                          }
                        >
                          <Text style={styles.batchSubmitButtonText}>Submit this proof</Text>
                        </TouchableOpacity>
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
                <TouchableOpacity style={styles.cancelButton} onPress={closeSubmitModal}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: shell.canvas }]}>
      {mainContent}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: appShell.canvas,
  },
  embeddedRoot: {
    flex: 1,
    minHeight: 0,
  },
  embeddedScrollContent: {
    paddingBottom: spacing.lg,
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: appShell.card,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: appShell.borderSubtle,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: appShell.cta,
  },
  campaignInfo: {
    backgroundColor: appShell.card,
    padding: spacing.md,
    marginBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: appShell.borderSubtle,
  },
  campaignName: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: appShell.textPrimary,
    marginBottom: 4,
  },
  campaignDesc: {
    fontSize: 13,
    color: appShell.textSecondary,
    lineHeight: 20,
  },
  scrollView: {
    flex: 1,
  },
  summaryCard: {
    backgroundColor: appShell.card,
    margin: spacing.md,
    padding: spacing.sm,
    borderRadius: radius.md,
    ...shadow.cardLight,
  },
  summaryTitle: {
    fontSize: 14,
    fontFamily: fonts.bold,
    color: appShell.cta,
    marginBottom: 10,
  },
  progressBar: {
    height: 8,
    backgroundColor: appShell.borderSubtle,
    borderRadius: radius.sm,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: appShell.cta,
    borderRadius: radius.sm,
  },
  progressText: {
    fontSize: 13,
    color: appShell.textSecondary,
    textAlign: 'center',
  },
  section: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: fonts.bold,
    color: appShell.cta,
    marginBottom: 10,
  },
  progressCard: {
    backgroundColor: appShell.card,
    padding: spacing.sm,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
    ...shadow.cardLight,
  },
  emptyProgressCard: {
    backgroundColor: appShell.card,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
    ...shadow.cardLight,
  },
  emptyProgressTitle: {
    fontSize: 14,
    fontFamily: fonts.bold,
    color: appShell.textPrimary,
    marginBottom: 6,
  },
  emptyProgressText: {
    fontSize: 13,
    color: appShell.textSecondary,
    marginBottom: 8,
    lineHeight: 19,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  contentType: {
    fontSize: 14,
    fontFamily: fonts.bold,
    color: appShell.textPrimary,
  },
  progressCount: {
    fontSize: 13,
    fontFamily: fonts.bold,
    color: appShell.cta,
  },
  scheduleText: {
    fontSize: 12,
    color: appShell.warning,
    marginTop: 4,
    fontFamily: fonts.semiBold,
  },
  submissionsContainer: {
    marginTop: 12,
  },
  submissionsTitle: {
    fontSize: 13,
    fontFamily: fonts.bold,
    color: appShell.cta,
    marginBottom: 8,
  },
  submissionItem: {
    backgroundColor: appShell.canvas,
    padding: 12,
    borderRadius: radius.md,
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
    fontSize: 12,
    color: appShell.textSecondary,
    fontFamily: fonts.semiBold,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 16,
    backgroundColor: appShell.canvasAlt,
    minWidth: 80,
    justifyContent: 'center',
  },
  statusText: {
    fontSize: 12,
    color: appShell.cta,
    fontFamily: fonts.bold,
    marginLeft: 4,
  },
  contentUrl: {
    fontSize: 13,
    color: appShell.cta,
    marginBottom: 2,
    fontWeight: '500',
    flexShrink: 1,
  },
  feedbackText: {
    fontSize: 12,
    color: palette.error,
    fontStyle: 'italic',
    marginBottom: 8,
    fontFamily: fonts.semiBold,
  },
  submissionActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.md,
    backgroundColor: appShell.canvasAlt,
    marginRight: 8,
    shadowColor: appShell.cta,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  actionButtonText: {
    fontSize: 13,
    color: appShell.cta,
    marginLeft: 4,
    fontFamily: fonts.bold,
  },
  deleteButton: {
    backgroundColor: palette.error,
  },
  deleteButtonText: {
    color: palette.white,
    fontFamily: fonts.bold,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: appShell.cta,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: radius.md,
    marginTop: 14,
    shadowColor: appShell.cta,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  submitButtonText: {
    color: palette.white,
    fontSize: 15,
    fontFamily: fonts.bold,
    marginLeft: 8,
    letterSpacing: 0.2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: appShell.cta,
    fontFamily: fonts.semiBold,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 14,
    color: appShell.cta,
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 16,
    fontFamily: fonts.bold,
  },
  retryButton: {
    backgroundColor: appShell.cta,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: radius.md,
    shadowColor: appShell.cta,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  retryButtonText: {
    color: palette.white,
    fontSize: 15,
    fontFamily: fonts.bold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(49,46,129,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: appShell.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    margin: spacing.md,
    width: '92%',
    maxWidth: 420,
    shadowColor: appShell.cta,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  modalScroll: {
    maxHeight: '85%',
  },
  modalScrollContent: {
    paddingBottom: 10,
  },
  modalTitle: {
    fontSize: 17,
    fontFamily: fonts.bold,
    color: appShell.cta,
    marginBottom: spacing.sm,
    letterSpacing: 0.5,
  },
  modalLabel: {
    fontSize: 13,
    fontFamily: fonts.semiBold,
    color: appShell.cta,
    marginBottom: 6,
  },
  modalValue: {
    fontSize: 13,
    color: appShell.cta,
    marginBottom: 14,
    fontFamily: fonts.semiBold,
  },
  textInput: {
    borderWidth: 1,
    borderColor: appShell.borderSubtle,
    borderRadius: radius.md,
    padding: 12,
    fontSize: 14,
    color: appShell.cta,
    backgroundColor: appShell.canvasAlt,
    marginBottom: 18,
    fontFamily: fonts.semiBold,
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
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  platformBadgeText: {
    color: palette.white,
    fontSize: 11,
    fontFamily: fonts.semiBold,
  },
  validationError: {
    color: palette.error,
    fontSize: 12,
    fontFamily: fonts.semiBold,
    marginBottom: 8,
  },
  limitNotice: {
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    marginBottom: 8,
    gap: 4,
  },
  limitNoticeTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
  },
  limitNoticeBody: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 17,
  },
  persistWarningText: {
    color: appShell.warning,
    fontSize: 12,
    fontFamily: fonts.semiBold,
    marginBottom: 8,
  },
  batchSummaryText: {
    color: appShell.textSecondary,
    fontSize: 12,
    fontFamily: fonts.semiBold,
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
    color: appShell.cta,
    fontSize: 13,
    fontFamily: fonts.semiBold,
  },
  urlCapHint: {
    color: appShell.textMuted,
    fontSize: 12,
    fontFamily: fonts.semiBold,
    marginBottom: 12,
  },
  quotaHint: {
    color: appShell.textSecondary,
    fontSize: 12,
    fontFamily: fonts.semiBold,
    marginBottom: 8,
  },
  analyzeButton: {
    backgroundColor: appShell.cta,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
    marginBottom: 12,
  },
  analyzeButtonText: {
    color: palette.white,
    fontSize: 14,
    fontFamily: fonts.semiBold,
  },
  disabledButton: {
    backgroundColor: appShell.textMuted,
  },
  useResultButton: {
    alignSelf: 'flex-start',
    backgroundColor: appShell.canvasAlt,
    borderRadius: radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 2,
  },
  useResultButtonText: {
    color: appShell.cta,
    fontSize: 12,
    fontFamily: fonts.semiBold,
  },
  batchRowActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
    flexWrap: 'wrap',
  },
  batchSubmitButton: {
    alignSelf: 'flex-start',
    backgroundColor: appShell.cta,
    borderRadius: radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 2,
  },
  batchSubmitButtonText: {
    color: palette.white,
    fontSize: 12,
    fontFamily: fonts.semiBold,
  },
  cancelButton: {
    backgroundColor: appShell.canvasAlt,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: radius.md,
    marginRight: 8,
    shadowColor: appShell.cta,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  cancelButtonText: {
    color: appShell.cta,
    fontFamily: fonts.bold,
    fontSize: 15,
  },
  confirmButton: {
    backgroundColor: appShell.cta,
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: radius.md,
    shadowColor: appShell.cta,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  confirmButtonText: {
    color: palette.white,
    fontFamily: fonts.bold,
    fontSize: 15,
  },
});
