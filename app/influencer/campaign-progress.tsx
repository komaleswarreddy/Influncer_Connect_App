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
import { useLocalSearchParams, useRouter } from 'expo-router';
import { appShell, palette, radius, shadow, spacing } from '@/theme';
import { fonts } from '@/components/ui/typography';
import { parsePostUrl, getPlatformColor, getPlatformLabel } from '../../lib/post-url-parser';
import { PostMetricsCard } from '../../components/PostMetricsCard';

export default function CampaignProgressScreen() {
  const closeSubmitModal = () => {
    setShowSubmitModal(false);
    setContentUrl('');
    setContentType('');
    setAnalyzedUrl('');
    setBulkUrlsInput('');
    setSelectedProgress(null);
    clearCurrentMetrics();
    clearBulkResults();
  };

  const { participationId, campaignId } = useLocalSearchParams();
  const router = useRouter();
  const { progressData, isLoading, error, fetchProgress, submitContent, updateSubmission, deleteSubmission } = useProgressStore();
  const { campaigns } = useCampaignStore();
  const [refreshing, setRefreshing] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [selectedProgress, setSelectedProgress] = useState<any>(null);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);
  const [editingContentUrl, setEditingContentUrl] = useState('');
  const [contentUrl, setContentUrl] = useState('');
  const [contentType, setContentType] = useState('');
  const [analyzedUrl, setAnalyzedUrl] = useState('');
  const {
    analyzeUrl,
    analyzeBulkUrls,
    isAnalyzing,
    isBulkAnalyzing,
    currentMetrics,
    currentAnalysisId,
    currentPersistError,
    analyzeError,
    bulkResults,
    bulkError,
    clearCurrentMetrics,
    clearBulkResults,
  } = usePostAnalyzerStore();
  const [bulkUrlsInput, setBulkUrlsInput] = useState('');

  const progress = participationId ? progressData[participationId as string] : undefined;
  const campaign = campaigns.find(c => c.id === campaignId);
  const parsedUrl = contentUrl ? parsePostUrl(contentUrl) : null;
  const isPlatformValid = parsedUrl?.isValid ?? false;

  useEffect(() => {
    if (participationId) fetchProgress(participationId as string);
  }, [participationId, fetchProgress]);

  useEffect(() => {
    if (contentUrl !== analyzedUrl) {
      clearCurrentMetrics();
      clearBulkResults();
    }
  }, [contentUrl, analyzedUrl, clearCurrentMetrics, clearBulkResults]);

  // If participationId is missing or invalid
  if (!participationId) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={palette.error} />
          <Text style={styles.errorText}>No campaign participation selected.</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => router.push('/influencer/campaigns')}>
            <Text style={styles.retryButtonText}>Go to Campaigns</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProgress(participationId as string);
    setRefreshing(false);
  };

  const handleSubmitContent = async () => {
    if (!currentMetrics) {
      Alert.alert('Error', 'Please analyze the post URL before submitting.');
      return;
    }
    if (!contentUrl.trim() || !contentType.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      await submitContent(participationId as string, {
        progressId: selectedProgress.id,
        contentUrl: analyzedUrl.trim(),
        contentType: currentMetrics.contentType || contentType.trim(),
        analysisId: currentAnalysisId,
      });
      setShowSubmitModal(false);
      setContentUrl('');
      setContentType('');
      setAnalyzedUrl('');
      setBulkUrlsInput('');
      setSelectedProgress(null);
      clearCurrentMetrics();
      clearBulkResults();
      Alert.alert('Success', 'Content submitted successfully!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to submit content');
    }
  };

  const handleSubmitBatchProof = async (url: string, inferredContentType?: string) => {
    if (!selectedProgress?.id) {
      Alert.alert('Error', 'No requirement selected for submission.');
      return;
    }
    try {
      await submitContent(participationId as string, {
        progressId: selectedProgress.id,
        contentUrl: url.trim(),
        contentType: inferredContentType || contentType.trim() || 'generic_post',
      });
      Alert.alert('Success', 'Batch URL submitted as campaign proof.');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to submit batch URL proof');
    }
  };

  const handleDeleteSubmission = (submission: any) => {
    Alert.alert(
      'Delete Submission',
      'Are you sure you want to delete this submission?',
      [
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
      ]
    );
  };

  const openSubmitModal = (progressItem: any) => {
    setSelectedProgress(progressItem);
    setContentType(progressItem.contentType);
    setContentUrl('');
    setAnalyzedUrl('');
    clearCurrentMetrics();
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
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={appShell.cta} />
          <Text style={styles.loadingText}>Loading progress...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={palette.error} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => fetchProgress(participationId as string)}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.retryButton, { marginTop: 12, backgroundColor: appShell.canvasAlt }]} onPress={() => router.push('/influencer/campaigns')}>
            <Text style={[styles.retryButtonText, { color: appShell.cta }]}>Go to Campaigns</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!progress) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="information-circle" size={48} color={appShell.cta} />
          <Text style={styles.errorText}>No progress data found for this campaign.{'\n'}You may need to join the campaign first.</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => router.push('/influencer/campaigns')}>
            <Text style={styles.retryButtonText}>Go to Campaigns</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={appShell.cta} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Campaign Progress</Text>
        <View style={{ width: 24 }} />
      </View>

      {campaign && (
        <View style={styles.campaignInfo}>
          <Text style={styles.campaignName}>{campaign.name}</Text>
          <Text style={styles.campaignDesc} numberOfLines={2}>{campaign.description}</Text>
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Progress Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Overall Progress</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress.summary.percentage}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {progress.summary.totalCompleted} of {progress.summary.totalRequired} completed ({progress.summary.percentage}%)
          </Text>
        </View>

        {/* Content Requirements */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Content Requirements</Text>
          {progress.progress.length === 0 ? (
            <View style={styles.emptyProgressCard}>
              <Text style={styles.emptyProgressTitle}>No requirements configured yet</Text>
              <Text style={styles.emptyProgressText}>
                You can still submit your campaign URL proof using Post Analyzer.
              </Text>
              <TouchableOpacity style={styles.submitButton} onPress={openFallbackSubmitModal}>
                <Ionicons name="add-circle" size={20} color="white" />
                <Text style={styles.submitButtonText}>Submit URL Proof</Text>
              </TouchableOpacity>
            </View>
          ) : null}
          {progress.progress.map((progressItem) => (
            <View key={progressItem.id} style={styles.progressCard}>
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
                    { width: `${(progressItem.completedCount / progressItem.requiredCount) * 100}%` }
                  ]} 
                />
              </View>

              {progressItem.schedule && (
                <Text style={styles.scheduleText}>Schedule: {progressItem.schedule}</Text>
              )}

              {/* Submissions */}
              {progressItem.submissions && progressItem.submissions.length > 0 && (
                <View style={styles.submissionsContainer}>
                  <Text style={styles.submissionsTitle}>Submissions:</Text>
                  {progressItem.submissions.map((submission) => (
                    <View key={submission.id} style={styles.submissionItem}>
                      <View style={styles.submissionHeader}>
                        <Text style={styles.submissionDate}>
                          {new Date(submission.submissionDate).toLocaleDateString()}
                        </Text>
                        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(submission.status) }]}>
                          <Text style={[styles.statusText, { color: getStatusTextColor(submission.status) }]}>{getStatusText(submission.status)}</Text>
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
                                await updateSubmission(submission.id, { contentUrl: editingContentUrl.trim() });
                                setSelectedSubmissionId(null);
                                setEditingContentUrl('');
                                Alert.alert('Success', 'Submission updated successfully!');
                              } catch (error: any) {
                                Alert.alert('Error', error.message || 'Failed to update submission');
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
                          <Text style={styles.contentUrl} numberOfLines={2}>{submission.contentUrl}</Text>
                          <View style={styles.actionsRow}>
                            <TouchableOpacity
                              style={styles.actionButton}
                              onPress={() => {
                                setSelectedSubmissionId(submission.id);
                                setEditingContentUrl(submission.contentUrl);
                              }}
                              disabled={selectedSubmissionId !== null && selectedSubmissionId !== submission.id}
                            >
                              <Ionicons name="pencil" size={16} color={appShell.cta} />
                              <Text style={styles.actionButtonText}>Edit</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[styles.actionButton, styles.deleteButton]}
                              onPress={() => handleDeleteSubmission(submission)}
                            >
                              <Ionicons name="trash" size={16} color={palette.white} />
                              <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Delete</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      )}
                      
                      {submission.feedback && (
                        <Text style={styles.feedbackText}>Feedback: {submission.feedback}</Text>
                      )}
                    </View>
                  ))}
                </View>
              )}

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
      <Modal visible={showSubmitModal} animationType="slide" transparent onRequestClose={closeSubmitModal}>
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
            
            <Text style={styles.modalLabel}>Content URL *</Text>
            <TextInput
              style={styles.textInput}
              value={contentUrl}
              onChangeText={setContentUrl}
              placeholder="Enter content URL (Instagram, YouTube, etc.)"
              multiline
            />
            {contentUrl ? (
              <View style={styles.validationWrap}>
                {isPlatformValid && parsedUrl ? (
                  <View
                    style={[
                      styles.platformBadge,
                      { backgroundColor: getPlatformColor(parsedUrl.platform) },
                    ]}
                  >
                    <Text style={styles.platformBadgeText}>
                      {getPlatformLabel(parsedUrl.platform)}
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.validationError}>
                    {parsedUrl?.error ?? 'Invalid URL'}
                  </Text>
                )}
              </View>
            ) : null}

            {contentUrl && !currentMetrics ? (
              <TouchableOpacity
                style={[
                  styles.analyzeButton,
                  (!isPlatformValid || isAnalyzing) && styles.disabledButton,
                ]}
                onPress={async () => {
                  if (!isPlatformValid) return;
                  const metrics = await analyzeUrl(contentUrl.trim(), campaignId as string | undefined);
                  if (metrics) {
                    setAnalyzedUrl(contentUrl.trim());
                  }
                }}
                disabled={!isPlatformValid || isAnalyzing}
              >
                <Text style={styles.analyzeButtonText}>
                  {isAnalyzing ? 'Fetching post data...' : 'Analyze Post'}
                </Text>
              </TouchableOpacity>
            ) : null}

            {analyzeError ? <Text style={styles.validationError}>{analyzeError}</Text> : null}
            {currentPersistError ? (
              <Text style={styles.persistWarningText}>
                Analysis fetched successfully, but history save had an issue ({currentPersistError}).
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

            <Text style={styles.modalLabel}>Analyze Multiple URLs (Batch)</Text>
            <TextInput
              style={[styles.textInput, { minHeight: 90 }]}
              value={bulkUrlsInput}
              onChangeText={setBulkUrlsInput}
              placeholder="Paste one URL per line"
              multiline
            />
            <TouchableOpacity
              style={[styles.analyzeButton, (!bulkUrlsInput.trim() || isBulkAnalyzing) && styles.disabledButton]}
              onPress={async () => {
                const urls = bulkUrlsInput
                  .split(/\r?\n/)
                  .map((u) => u.trim())
                  .filter(Boolean);
                if (urls.length === 0) return;
                await analyzeBulkUrls(urls, campaignId as string | undefined);
              }}
              disabled={!bulkUrlsInput.trim() || isBulkAnalyzing}
            >
              <Text style={styles.analyzeButtonText}>
                {isBulkAnalyzing ? 'Analyzing batch...' : 'Analyze Batch URLs'}
              </Text>
            </TouchableOpacity>
            {bulkError ? <Text style={styles.validationError}>{bulkError}</Text> : null}
            {bulkResults ? (
              <View style={{ marginBottom: 8 }}>
                <Text style={styles.batchSummaryText}>
                  Batch results: {bulkResults.summary.successful}/{bulkResults.summary.total} successful
                </Text>
                {bulkResults.results.slice(0, 5).map((item, idx) => (
                  <View key={`${item.url}-${idx}`} style={{ marginBottom: 8 }}>
                    <PostMetricsCard metrics={item} compact />
                    <View style={styles.batchRowActions}>
                      <TouchableOpacity
                        style={styles.useResultButton}
                        onPress={() => {
                          setContentUrl(item.url);
                          setAnalyzedUrl('');
                          clearCurrentMetrics();
                        }}
                      >
                        <Text style={styles.useResultButtonText}>Use in single analyzer</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.batchSubmitButton}
                        onPress={() => handleSubmitBatchProof(item.url, item.contentType)}
                      >
                        <Text style={styles.batchSubmitButtonText}>Submit this proof</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
                {bulkResults.errors.length > 0 ? (
                  <Text style={styles.validationError}>
                    {bulkResults.errors.length} URL(s) failed in batch. Fix and retry those URLs.
                  </Text>
                ) : null}
              </View>
            ) : null}

            <View style={[styles.modalActions, currentMetrics ? { marginTop: 0 } : null]}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={closeSubmitModal}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: appShell.canvas,
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