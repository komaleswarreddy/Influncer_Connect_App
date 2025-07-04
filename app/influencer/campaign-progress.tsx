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
    // Soft multi-stop gradient background (simulate with solid fallback)
    backgroundColor: '#e0e7ff', // fallback for gradient
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 18,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderBottomWidth: 0,
    borderBottomColor: 'transparent',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#312e81',
    letterSpacing: 0.5,
  },
  campaignInfo: {
    backgroundColor: 'rgba(255,255,255,0.85)',
    padding: 18,
    marginBottom: 12,
    borderRadius: 18,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  campaignName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#312e81',
    marginBottom: 4,
  },
  campaignDesc: {
    fontSize: 15,
    color: '#6366f1',
  },
  scrollView: {
    flex: 1,
  },
  summaryCard: {
    backgroundColor: 'rgba(255,255,255,0.85)',
    margin: 16,
    padding: 20,
    borderRadius: 22,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    alignItems: 'center',
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4f46e5',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  progressBar: {
    height: 16,
    backgroundColor: '#e0e7ff',
    borderRadius: 8,
    marginBottom: 12,
    width: '100%',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: 'linear-gradient(90deg, #6366f1 0%, #a5b4fc 100%)', // fallback for gradient
    backgroundColor: '#6366f1',
    borderRadius: 8,
  },
  progressText: {
    fontSize: 16,
    color: '#6366f1',
    textAlign: 'center',
    fontWeight: '600',
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4f46e5',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  progressCard: {
    backgroundColor: 'rgba(255,255,255,0.85)',
    padding: 18,
    borderRadius: 18,
    marginBottom: 16,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 10,
    elevation: 5,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  contentType: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#312e81',
  },
  progressCount: {
    fontSize: 15,
    color: '#6366f1',
    fontWeight: 'bold',
  },
  scheduleText: {
    fontSize: 13,
    color: '#6366f1',
    marginTop: 6,
    fontWeight: '500',
  },
  submissionsContainer: {
    marginTop: 14,
  },
  submissionsTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#4f46e5',
    marginBottom: 8,
  },
  submissionItem: {
    backgroundColor: 'rgba(236, 239, 255, 0.7)',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  submissionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  submissionDate: {
    fontSize: 13,
    color: '#6366f1',
    fontWeight: '500',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 16,
    backgroundColor: '#e0e7ff',
    minWidth: 80,
    justifyContent: 'center',
  },
  statusText: {
    fontSize: 12,
    color: '#312e81',
    fontWeight: 'bold',
    marginLeft: 4,
  },
  contentUrl: {
    fontSize: 13,
    color: '#312e81',
    marginBottom: 4,
    fontWeight: '500',
  },
  feedbackText: {
    fontSize: 12,
    color: '#ef4444',
    fontStyle: 'italic',
    marginBottom: 8,
    fontWeight: '500',
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
    borderRadius: 8,
    backgroundColor: '#e0e7ff',
    marginRight: 8,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 2,
  },
  actionButtonText: {
    fontSize: 13,
    color: '#4f46e5',
    marginLeft: 4,
    fontWeight: 'bold',
  },
  deleteButton: {
    backgroundColor: '#fee2e2',
  },
  deleteButtonText: {
    color: '#ef4444',
    fontWeight: 'bold',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366f1',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 10,
    marginTop: 14,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 6,
    elevation: 3,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
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
    fontSize: 16,
    color: '#6366f1',
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 16,
    color: '#6366f1',
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 16,
    fontWeight: 'bold',
  },
  retryButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 4,
    elevation: 2,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(49,46,129,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderRadius: 18,
    padding: 28,
    margin: 32,
    width: '92%',
    maxWidth: 420,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4f46e5',
    marginBottom: 18,
    letterSpacing: 0.5,
  },
  modalLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#312e81',
    marginBottom: 6,
  },
  modalValue: {
    fontSize: 15,
    color: '#6366f1',
    marginBottom: 14,
    fontWeight: '500',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#a5b4fc',
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    color: '#312e81',
    backgroundColor: '#f1f5f9',
    marginBottom: 18,
    fontWeight: '500',
    width: '100%',
    minHeight: 48,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
    gap: 12,
  },
  cancelButton: {
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
    marginRight: 8,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 2,
  },
  cancelButtonText: {
    color: '#4f46e5',
    fontWeight: 'bold',
    fontSize: 15,
  },
  confirmButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 8,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  confirmButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 15,
  },
}); 