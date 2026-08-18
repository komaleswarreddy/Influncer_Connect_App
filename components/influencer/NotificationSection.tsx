import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { api } from '../../lib/api';
import { shadow, useAppShell } from '@/theme';
import { showKollabToast } from '@/components/ui/PremiumToast';

interface NotificationSectionProps {
  onUpdate?: () => void;
}

export default function NotificationSection({ onUpdate }: NotificationSectionProps) {
  const shell = useAppShell();
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
      showKollabToast('Notification settings updated');
      if (onUpdate) onUpdate();
    } catch (error: any) {
      showKollabToast(error.message || 'Failed to update notification settings');
      // Revert the change on error
      setNotifications(notifications);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View
        style={[styles.section, { backgroundColor: shell.card, borderColor: shell.cardBorder }]}
      >
        <Text style={[styles.sectionTitle, { color: shell.textPrimary }]}>
          Notification Preferences
        </Text>

        <View style={[styles.notificationItem, { borderBottomColor: shell.borderSubtle }]}>
          <View style={styles.notificationContent}>
            <Text style={[styles.notificationTitle, { color: shell.textPrimary }]}>
              Campaign Notifications
            </Text>
            <Text style={[styles.notificationDescription, { color: shell.textSecondary }]}>
              Receive notifications when new campaigns are available in your niche
            </Text>
          </View>
          <Switch
            value={notifications.allowNotificationForCampaign}
            onValueChange={() => handleToggle('allowNotificationForCampaign')}
            trackColor={{ false: shell.borderSubtle, true: shell.cta }}
            thumbColor={notifications.allowNotificationForCampaign ? '#fff' : '#f4f3f4'}
            disabled={isLoading}
          />
        </View>

        <View style={[styles.notificationItem, { borderBottomColor: shell.borderSubtle }]}>
          <View style={styles.notificationContent}>
            <Text style={[styles.notificationTitle, { color: shell.textPrimary }]}>
              Approval Notifications
            </Text>
            <Text style={[styles.notificationDescription, { color: shell.textSecondary }]}>
              Get notified when your influencer status is approved or updated
            </Text>
          </View>
          <Switch
            value={notifications.allowNotificationForApproval}
            onValueChange={() => handleToggle('allowNotificationForApproval')}
            trackColor={{ false: shell.borderSubtle, true: shell.cta }}
            thumbColor={notifications.allowNotificationForApproval ? '#fff' : '#f4f3f4'}
            disabled={isLoading}
          />
        </View>
      </View>

      <View
        style={[styles.section, { backgroundColor: shell.card, borderColor: shell.cardBorder }]}
      >
        <Text style={[styles.sectionTitle, { color: shell.textPrimary }]}>
          Notification Channels
        </Text>

        <View style={[styles.channelItem, { borderBottomColor: shell.borderSubtle }]}>
          <View style={styles.channelContent}>
            <Text style={[styles.channelTitle, { color: shell.textPrimary }]}>
              Email Notifications
            </Text>
            <Text style={[styles.channelDescription, { color: shell.textSecondary }]}>
              Receive important updates via email
            </Text>
          </View>
          <View style={styles.channelStatus}>
            <Text style={styles.statusText}>Always On</Text>
          </View>
        </View>

        <View style={[styles.channelItem, { borderBottomColor: shell.borderSubtle }]}>
          <View style={styles.channelContent}>
            <Text style={[styles.channelTitle, { color: shell.textPrimary }]}>
              In-App Notifications
            </Text>
            <Text style={[styles.channelDescription, { color: shell.textSecondary }]}>
              Get notifications within the app
            </Text>
          </View>
          <View style={styles.channelStatus}>
            <Text style={styles.statusText}>Always On</Text>
          </View>
        </View>
      </View>

      <View
        style={[styles.section, { backgroundColor: shell.card, borderColor: shell.cardBorder }]}
      >
        <Text style={[styles.sectionTitle, { color: shell.textPrimary }]}>
          Notification Frequency
        </Text>

        <TouchableOpacity style={[styles.frequencyItem, { borderBottomColor: shell.borderSubtle }]}>
          <View style={styles.frequencyContent}>
            <Text style={[styles.frequencyTitle, { color: shell.textPrimary }]}>Real-time</Text>
            <Text style={[styles.frequencyDescription, { color: shell.textSecondary }]}>
              Receive notifications immediately
            </Text>
          </View>
          <View style={styles.selectedIndicator}>
            <View style={styles.selectedDot} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.frequencyItem, { borderBottomColor: shell.borderSubtle }]}>
          <View style={styles.frequencyContent}>
            <Text style={[styles.frequencyTitle, { color: shell.textPrimary }]}>Daily Digest</Text>
            <Text style={[styles.frequencyDescription, { color: shell.textSecondary }]}>
              Receive a summary once per day
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.frequencyItem, { borderBottomColor: shell.borderSubtle }]}>
          <View style={styles.frequencyContent}>
            <Text style={[styles.frequencyTitle, { color: shell.textPrimary }]}>
              Weekly Summary
            </Text>
            <Text style={[styles.frequencyDescription, { color: shell.textSecondary }]}>
              Receive a summary once per week
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={shell.cta} />
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
    marginHorizontal: 12,
    marginVertical: 6,
    padding: 12,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    ...shadow.cardLight,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
  },
  notificationContent: {
    flex: 1,
    marginRight: 16,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  notificationDescription: {
    fontSize: 13,
    lineHeight: 20,
  },
  channelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
  },
  channelContent: {
    flex: 1,
    marginRight: 16,
  },
  channelTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  channelDescription: {
    fontSize: 13,
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
    borderBottomColor: 'transparent',
  },
  frequencyContent: {
    flex: 1,
    marginRight: 16,
  },
  frequencyTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  frequencyDescription: {
    fontSize: 13,
    lineHeight: 20,
  },
  selectedIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#141e33',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#141e33',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(11, 18, 32, 0.72)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 13,
    color: '#94a3b8',
  },
});
