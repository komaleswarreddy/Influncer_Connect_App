import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '../../store/auth-store';
import { getApiBaseUrl } from '../../lib/api';
import {
  PremiumCard,
  PremiumTextInput,
  PrimaryButton,
  ScrollScreen,
  PremiumSegmentedControl,
  type PremiumSegment,
} from '@/components/ui';
import { appShell, palette, premiumNavy, radius, spacing } from '@/theme';
import { fonts } from '@/components/ui/typography';

const FAQS = [
  {
    q: 'How do I connect my bank account?',
    a: 'Go to Settings > Payouts and follow the instructions to securely connect your bank account.',
  },
  {
    q: 'Why is my payment pending?',
    a: 'Payments may be pending due to processing times or missing information. Check your payout settings and email for updates.',
  },
  {
    q: 'How does link tracking work?',
    a: 'Each campaign provides unique tracking links. Use these links in your content to track clicks and conversions.',
  },
  {
    q: "What does 'engagement rate' mean?",
    a: 'Engagement rate measures how actively your audience interacts with your content, calculated as (likes + comments + shares) / followers.',
  },
  {
    q: 'How do I apply for a campaign?',
    a: "Browse available campaigns and click 'View & Apply' to see details and submit your application.",
  },
  {
    q: 'Can I update my profile information?',
    a: 'Yes, go to Settings > Profile to update your personal and social information.',
  },
  {
    q: 'How do I reset my password?',
    a: 'Go to Settings > Security and follow the instructions to reset your password.',
  },
  {
    q: 'What if I have a technical problem?',
    a: 'Use the Contact Support form below to describe your issue. Our team will assist you promptly.',
  },
  {
    q: 'How do I check my campaign status?',
    a: 'Go to the Campaigns page to view your applications, active, and completed campaigns.',
  },
  {
    q: 'How do I contact support?',
    a: 'Use the Contact Support form below to submit a ticket. Our team will respond within 24 hours.',
  },
];

const ISSUE_OPTIONS = [
  { value: 'payouts', label: 'Payouts' },
  { value: 'campaign', label: 'A Campaign' },
  { value: 'technical', label: 'Technical Problem' },
  { value: 'account', label: 'My Account' },
];

const SUPPORT_SEGMENTS: PremiumSegment[] = [
  {
    key: 'faqs',
    label: 'FAQs',
    icon: <Ionicons name="help-circle" size={18} color={appShell.textSecondary} />,
  },
  {
    key: 'support',
    label: 'Contact Support',
    icon: <MaterialIcons name="support-agent" size={18} color={appShell.textSecondary} />,
  },
];

export default function SupportHub() {
  const { token, user } = useAuthStore();
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [tab, setTab] = useState<'faqs' | 'support'>('faqs');
  const [issueType, setIssueType] = useState('payouts');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [ticketNumber, setTicketNumber] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImage(result.assets[0]);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      if (!user?.id || !user?.tenantId) {
        setError('User or tenant information missing. Please log out and log in again.');
        setSubmitting(false);
        return;
      }

      const formData = new FormData();
      formData.append('issueType', issueType);
      formData.append('subject', subject);
      formData.append('description', description);
      if (image) {
        // @ts-ignore
        formData.append('file', {
          uri: image.uri,
          name: image.fileName || 'screenshot.jpg',
          type: image.type || 'image/jpeg',
        });
      }

      const response = await fetch(`${getApiBaseUrl()}/api/support/tickets`, {
        method: 'POST',
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
          'x-user-id': user.id,
          'x-tenant-id': user.tenantId,
        },
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to submit ticket');
      }
      const data = await response.json();
      setTicketNumber(data.ticketNumber);
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Failed to submit ticket');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollScreen
      safeAreaEdges={['left', 'right', 'bottom']}
      padH={spacing.md}
      scrollProps={{ showsVerticalScrollIndicator: false }}
    >
      <PremiumSegmentedControl
        segments={SUPPORT_SEGMENTS}
        value={tab}
        onChange={(key) => setTab(key as 'faqs' | 'support')}
        style={styles.segmentWrap}
      />
      {tab === 'faqs' && (
        <PremiumCard style={{ marginBottom: spacing.sm }}>
          <Text style={styles.cardTitle}>Support FAQ</Text>
          {FAQS.map((faq, idx) => (
            <View key={idx} style={styles.accordionItem}>
              <TouchableOpacity
                style={styles.accordionHeader}
                onPress={() => setActiveFaq(activeFaq === idx ? null : idx)}
              >
                <Ionicons
                  name="chatbubble-ellipses"
                  size={18}
                  color={appShell.cta}
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.accordionQuestion}>{faq.q}</Text>
                <Ionicons
                  name={activeFaq === idx ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={appShell.textSecondary}
                  style={{ marginLeft: 'auto' }}
                />
              </TouchableOpacity>
              {activeFaq === idx && (
                <LinearGradient
                  colors={[...premiumNavy.base.colors]}
                  locations={[...premiumNavy.base.locations]}
                  start={premiumNavy.base.start}
                  end={premiumNavy.base.end}
                  style={styles.accordionContent}
                >
                  <LinearGradient
                    colors={[...premiumNavy.sheen.colors]}
                    locations={[...premiumNavy.sheen.locations]}
                    start={premiumNavy.sheen.start}
                    end={premiumNavy.sheen.end}
                    style={StyleSheet.absoluteFill}
                    pointerEvents="none"
                  />
                  <Text style={styles.accordionAnswer}>{faq.a}</Text>
                </LinearGradient>
              )}
            </View>
          ))}
        </PremiumCard>
      )}
      {tab === 'support' && (
        <PremiumCard style={{ marginBottom: spacing.sm }}>
          <Text style={styles.cardTitle}>Contact Support</Text>
          {submitted && ticketNumber ? (
            <View style={styles.successBox}>
              <Ionicons
                name="checkmark-circle"
                size={48}
                color={appShell.cta}
                style={{ marginBottom: 8 }}
              />
              <Text style={styles.successTitle}>Thank you!</Text>
              <Text style={styles.successText}>
                Your request <Text style={styles.ticketNumber}>#{ticketNumber}</Text> has been
                received.
              </Text>
              <Text style={styles.successText}>Our team will get back to you within 24 hours.</Text>
            </View>
          ) : (
            <>
              {error && <Text style={styles.errorText}>{error}</Text>}
              <Text style={styles.label}>What is your issue about?</Text>
              <View style={styles.issueOptionsRow}>
                {ISSUE_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[
                      styles.issueOption,
                      issueType === opt.value && styles.issueOptionActive,
                    ]}
                    onPress={() => setIssueType(opt.value)}
                  >
                    <Text
                      style={[
                        styles.issueOptionText,
                        issueType === opt.value && styles.issueOptionTextActive,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.label}>Subject</Text>
              <PremiumTextInput
                style={styles.input}
                value={subject}
                onChangeText={setSubject}
                maxLength={100}
                placeholder="Enter subject"
              />
              <Text style={styles.label}>Please describe your issue in detail.</Text>
              <PremiumTextInput
                style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                value={description}
                onChangeText={setDescription}
                multiline
                maxLength={1000}
                placeholder="Describe your issue"
              />
              <Text style={styles.label}>Attach a screenshot (optional)</Text>
              <TouchableOpacity style={styles.imagePickerBtn} onPress={pickImage}>
                <Ionicons name="image" size={20} color={appShell.cta} />
                <Text style={{ color: appShell.cta, marginLeft: 6 }}>Pick Image</Text>
              </TouchableOpacity>
              {image && (
                <Image
                  source={{ uri: image.uri }}
                  style={{ width: 100, height: 100, borderRadius: 8, marginTop: 8 }}
                />
              )}
              <PrimaryButton
                style={styles.saveButton}
                onPress={handleSubmit}
                disabled={submitting}
                loading={submitting}
                label="Submit Ticket"
              />
            </>
          )}
        </PremiumCard>
      )}
      <View style={{ alignItems: 'center', marginTop: 32 }}>
        <Text style={{ color: appShell.cta, fontFamily: fonts.bold }}>Powered by Zopkit</Text>
        <Text style={{ color: appShell.textSecondary, fontSize: 12 }}>Hyderabad, IT-HUB</Text>
        <Text style={{ color: appShell.textSecondary, fontSize: 12 }}>contact@zopkit.com</Text>
      </View>
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  segmentWrap: {
    marginBottom: spacing.sm,
  },
  cardTitle: {
    fontSize: 15,
    fontFamily: fonts.bold,
    color: appShell.cta,
    marginBottom: spacing.sm,
  },
  accordionItem: {
    marginBottom: 8,
    borderRadius: 8,
    backgroundColor: appShell.iceBlue,
    overflow: 'hidden',
  },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
  },
  accordionQuestion: {
    fontFamily: fonts.bold,
    color: appShell.cta,
    fontSize: 13,
    flex: 1,
  },
  accordionContent: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255, 255, 255, 0.12)',
  },
  accordionAnswer: {
    color: 'rgba(241, 245, 249, 0.96)',
    fontSize: 12,
    lineHeight: 19,
    fontFamily: fonts.regular,
  },
  label: {
    fontFamily: fonts.semiBold,
    color: appShell.textPrimary,
    fontSize: 13,
    marginBottom: 2,
    marginTop: 8,
  },
  input: {
    fontSize: 14,
    marginBottom: 4,
  },
  issueOptionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  issueOption: {
    backgroundColor: appShell.iceBlue,
    borderRadius: radius.pill,
    paddingVertical: 6,
    paddingHorizontal: 14,
    marginRight: 8,
    borderWidth: 1,
    borderColor: appShell.borderSubtle,
    marginBottom: 6,
  },
  issueOptionActive: {
    backgroundColor: appShell.cta,
    borderColor: appShell.cta,
  },
  issueOptionText: {
    color: appShell.cta,
    fontFamily: fonts.bold,
  },
  issueOptionTextActive: {
    color: palette.white,
  },
  imagePickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: appShell.iceBlue,
    borderRadius: radius.md,
    padding: 10,
    marginTop: 4,
    width: 150,
  },
  saveButton: {
    marginTop: 16,
  },
  successBox: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: appShell.iceBlue,
    borderRadius: radius.md,
    marginBottom: 12,
  },
  successTitle: {
    fontSize: 17,
    fontFamily: fonts.bold,
    color: appShell.cta,
    marginBottom: 4,
  },
  successText: {
    color: appShell.textPrimary,
    fontSize: 13,
    marginBottom: 2,
    textAlign: 'center',
  },
  ticketNumber: {
    fontFamily: 'monospace',
    backgroundColor: appShell.iceBlueStrong,
    paddingHorizontal: 6,
    borderRadius: 4,
    color: appShell.cta,
  },
  errorText: {
    color: palette.error,
    marginBottom: 8,
    fontFamily: fonts.bold,
    textAlign: 'center',
  },
});
