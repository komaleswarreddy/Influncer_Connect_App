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
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';

export default function CampaignProgressScreen() {
  const { participationId, campaignId } = useLocalSearchParams();
  const router = useRouter();
  const { progressData, isLoading, error, fetchProgress, submitContent, updateSubmission, deleteSubmission, clearError } = useProgressStore();
  const { campaigns } = useCampaignStore();
  const [refreshing, setRefreshing] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProgress, setSelectedProgress] = useState<any>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [contentUrl, setContentUrl] = useState('');
  const [contentType, setContentType] = useState('');

  const progress = progressData[participationId as string];
  const campaign = campaigns.find(c => c.id === campaignId);

  useEffect(() => {
    if (participationId) fetchProgress(participationId as string);
  }, [participationId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProgress(participationId as string);
    setRefreshing(false);
  };

  const handleSubmitContent = async () => {
    if (!contentUrl.trim() || !contentType.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      await submitContent(participationId as string, {
        progressId: selectedProgress.id,
        contentUrl: contentUrl.trim(),
        contentType: contentType.trim(),
      });
      setShowSubmitModal(false);
      setContentUrl('');
      setContentType('');
      setSelectedProgress(null);
      Alert.alert('Success', 'Content submitted successfully!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to submit content');
    }
  };

  const handleUpdateSubmission = async () => {
    if (!contentUrl.trim()) {
      Alert.alert('Error', 'Please enter a content URL');
      return;
    }

    try {
      await updateSubmission(selectedSubmission.id, {
        contentUrl: contentUrl.trim(),
      });
      setShowEditModal(false);
      setContentUrl('');
      setSelectedSubmission(null);
      Alert.alert('Success', 'Submission updated successfully!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update submission');
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
    setShowSubmitModal(true);
  };

  const openEditModal = (submission: any) => {
    setSelectedSubmission(submission);
    setContentUrl(submission.contentUrl);
    setShowEditModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return '#10b981';
      case 'rejected':
        return '#ef4444';
      case 'pending':
        return '#f59e0b';
      default:
        return '#6b7280';
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
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading progress...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#ef4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => fetchProgress(participationId as string)}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!progress) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="information-circle" size={48} color="#6b7280" />
          <Text style={styles.errorText}>No progress data found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#3b82f6" />
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
                          <Text style={styles.statusText}>{getStatusText(submission.status)}</Text>
                        </View>
                      </View>
                      
                      <Text style={styles.contentUrl} numberOfLines={2}>
                        {submission.contentUrl}
                      </Text>
                      
                      {submission.feedback && (
                        <Text style={styles.feedbackText}>Feedback: {submission.feedback}</Text>
                      )}

                      <View style={styles.submissionActions}>
                        <TouchableOpacity 
                          style={styles.actionButton}
                          onPress={() => openEditModal(submission)}
                        >
                          <Ionicons name="pencil" size={16} color="#3b82f6" />
                          <Text style={styles.actionButtonText}>Edit</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                          style={[styles.actionButton, styles.deleteButton]}
                          onPress={() => handleDeleteSubmission(submission)}
                        >
                          <Ionicons name="trash" size={16} color="#ef4444" />
                          <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Delete</Text>
                        </TouchableOpacity>
                      </View>
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
      <Modal visible={showSubmitModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
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

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => {
                  setShowSubmitModal(false);
                  setContentUrl('');
                  setSelectedProgress(null);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.confirmButton}
                onPress={handleSubmitContent}
              >
                <Text style={styles.confirmButtonText}>Submit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Submission Modal */}
      <Modal visible={showEditModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Submission</Text>
            
            <Text style={styles.modalLabel}>Content URL *</Text>
            <TextInput
              style={styles.textInput}
              value={contentUrl}
              onChangeText={setContentUrl}
              placeholder="Enter new content URL"
              multiline
            />

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => {
                  setShowEditModal(false);
                  setContentUrl('');
                  setSelectedSubmission(null);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.confirmButton}
                onPress={handleUpdateSubmission}
              >
                <Text style={styles.confirmButtonText}>Update</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  campaignInfo: {
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 8,
  },
  campaignName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  campaignDesc: {
    fontSize: 14,
    color: '#6b7280',
  },
  scrollView: {
    flex: 1,
  },
  summaryCard: {
    backgroundColor: 'white',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  progressCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  contentType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  progressCount: {
    fontSize: 14,
    color: '#6b7280',
  },
  scheduleText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  submissionsContainer: {
    marginTop: 12,
  },
  submissionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  submissionItem: {
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
  submissionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  submissionDate: {
    fontSize: 12,
    color: '#6b7280',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    color: 'white',
    fontWeight: '600',
  },
  contentUrl: {
    fontSize: 12,
    color: '#374151',
    marginBottom: 4,
  },
  feedbackText: {
    fontSize: 11,
    color: '#ef4444',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  submissionActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#f3f4f6',
  },
  actionButtonText: {
    fontSize: 12,
    color: '#3b82f6',
    marginLeft: 4,
  },
  deleteButton: {
    backgroundColor: '#fef2f2',
  },
  deleteButtonText: {
    color: '#ef4444',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginTop: 12,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 6,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    margin: 32,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 4,
  },
  modalValue: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    padding: 12,
    fontSize: 14,
    color: '#1f2937',
    marginBottom: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  cancelButtonText: {
    fontSize: 14,
    color: '#6b7280',
  },
  confirmButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  confirmButtonText: {
    fontSize: 14,
    color: 'white',
    fontWeight: '600',
  },
}); 