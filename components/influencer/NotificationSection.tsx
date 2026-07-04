import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, ActivityIndicator, Switch } from 'react-native';
import { api } from '../../lib/api';
import { appShell, shadow } from '@/theme';

interface NotificationSectionProps {
  onUpdate?: () => void;
}

export default function NotificationSection({ onUpdate }: NotificationSectionProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [notifications, setNotifications] = useState({
    allowNotificationForCampaign: false,
    allowNotificationForApproval: false,
  });

  const loadNotificationSettings = useCallback(async () => {
    try {
      const response = await api.get('/api/influencers/notifications');
      setNotifications(response as typeof notifications);
    } catch (error) {
      console.log('Could not load notification settings:', error);
    }
  }, []);

  useEffect(() => {
    loadNotificationSettings();
  }, [loadNotificationSettings]);

  const handleToggle = async (key: keyof typeof notifications) => {
    const newSettings = {
      ...notifications,
      [key]: !notifications[key],
    };

    setIsLoading(true);
    try {
      await api.patch('/api/influencers/notifications', newSettings);
      setNotifications(newSettings);
      Alert.alert('Success', 'Notification settings updated');
      if (onUpdate) onUpdate();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update notification settings');
      // Revert the change on error
      setNotifications(notifications);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notification Preferences</Text>
        
        <View style={styles.notificationItem}>
          <View style={styles.notificationContent}>
            <Text style={styles.notificationTitle}>Campaign Notifications</Text>
            <Text style={styles.notificationDescription}>
              Receive notifications when new campaigns are available in your niche
            </Text>
          </View>
          <Switch
            value={notifications.allowNotificationForCampaign}
            onValueChange={() => handleToggle('allowNotificationForCampaign')}
            trackColor={{ false: '#d1d5db', true: appShell.cta }}
            thumbColor={notifications.allowNotificationForCampaign ? '#fff' : '#f4f3f4'}
            disabled={isLoading}
          />
        </View>

        <View style={styles.notificationItem}>
          <View style={styles.notificationContent}>
            <Text style={styles.notificationTitle}>Approval Notifications</Text>
            <Text style={styles.notificationDescription}>
              Get notified when your influencer status is approved or updated
            </Text>
          </View>
          <Switch
            value={notifications.allowNotificationForApproval}
            onValueChange={() => handleToggle('allowNotificationForApproval')}
            trackColor={{ false: '#d1d5db', true: appShell.cta }}
            thumbColor={notifications.allowNotificationForApproval ? '#fff' : '#f4f3f4'}
            disabled={isLoading}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notification Channels</Text>
        
        <View style={styles.channelItem}>
          <View style={styles.channelContent}>
            <Text style={styles.channelTitle}>Email Notifications</Text>
            <Text style={styles.channelDescription}>
              Receive important updates via email
            </Text>
          </View>
          <View style={styles.channelStatus}>
            <Text style={styles.statusText}>Always On</Text>
          </View>
        </View>

        <View style={styles.channelItem}>
          <View style={styles.channelContent}>
            <Text style={styles.channelTitle}>In-App Notifications</Text>
            <Text style={styles.channelDescription}>
              Get notifications within the app
            </Text>
          </View>
          <View style={styles.channelStatus}>
            <Text style={styles.statusText}>Always On</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notification Frequency</Text>
        
        <TouchableOpacity style={styles.frequencyItem}>
          <View style={styles.frequencyContent}>
            <Text style={styles.frequencyTitle}>Real-time</Text>
            <Text style={styles.frequencyDescription}>
              Receive notifications immediately
            </Text>
          </View>
          <View style={styles.selectedIndicator}>
            <View style={styles.selectedDot} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.frequencyItem}>
          <View style={styles.frequencyContent}>
            <Text style={styles.frequencyTitle}>Daily Digest</Text>
            <Text style={styles.frequencyDescription}>
              Receive a summary once per day
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.frequencyItem}>
          <View style={styles.frequencyContent}>
            <Text style={styles.frequencyTitle}>Weekly Summary</Text>
            <Text style={styles.frequencyDescription}>
              Receive a summary once per week
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={appShell.cta} />
          <Text style={styles.loadingText}>Updating settings...</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  section: {
    backgroundColor: appShell.card,
    marginHorizontal: 12,
    marginVertical: 6,
    padding: 12,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: appShell.cardBorder,
    ...shadow.cardLight,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  notificationContent: {
    flex: 1,
    marginRight: 16,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  notificationDescription: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 20,
  },
  channelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  channelContent: {
    flex: 1,
    marginRight: 16,
  },
  channelTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  channelDescription: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 20,
  },
  channelStatus: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#166534',
  },
  frequencyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  frequencyContent: {
    flex: 1,
    marginRight: 16,
  },
  frequencyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  frequencyDescription: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 20,
  },
  selectedIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: appShell.cta,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: appShell.cta,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 13,
    color: '#6b7280',
  },
}); 