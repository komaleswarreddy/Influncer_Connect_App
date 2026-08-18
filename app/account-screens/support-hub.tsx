import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '../../store/auth-store';
import { getApiBaseUrl } from '../../lib/api';
import { ScrollScreen, KollabScreenHeader, KollabTextField, KollabButton } from '@/components/ui';
import { useKollab, font, type as kType } from '@/theme/kollab-tokens';

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
];

export default function SupportHub() {
  const kollab = useKollab();
  const { token, user } = useAuthStore();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [ticketNumber, setTicketNumber] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.canceled && result.assets?.[0]) {
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
      formData.append('issueType', 'technical');
      formData.append('subject', subject);
      formData.append('description', description);
      if (image) {
        // @ts-expect-error RN FormData file
        formData.append('file', {
          uri: image.uri,
          name: image.fileName || 'screenshot.jpg',
          type: image.mimeType || 'image/jpeg',
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
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to submit ticket');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollScreen safeAreaEdges={['top', 'left', 'right', 'bottom']}>
      <KollabScreenHeader title="Support" subtitle="FAQs and direct help" />

      <Text style={[styles.fieldLabel, { color: kollab.color.ink }]}>Common questions</Text>
      <View style={[styles.faqCard, { backgroundColor: kollab.color.card }, kollab.shadow.card]}>
        {FAQS.map((faq, idx) => {
          const open = openFaq === idx;
          const last = idx === FAQS.length - 1;
          return (
            <Pressable
              key={faq.q}
              onPress={() => setOpenFaq(open ? null : idx)}
              style={[
                styles.faqRow,
                { borderBottomColor: last ? 'transparent' : kollab.color.hairline },
              ]}
            >
              <View style={styles.faqHead}>
                <Text style={[styles.faqQ, { color: kollab.color.ink }]}>{faq.q}</Text>
                <Text style={[styles.faqMark, { color: kollab.color.ink }]}>
                  {open ? '−' : '+'}
                </Text>
              </View>
              {open ? (
                <Text style={[styles.faqA, { color: kollab.color.ink }]}>{faq.a}</Text>
              ) : null}
            </Pressable>
          );
        })}
      </View>

      <View
        style={[styles.contactCard, { backgroundColor: kollab.color.card }, kollab.shadow.card]}
      >
        <Text style={[styles.contactTitle, { color: kollab.color.ink }]}>Contact Support</Text>
        {submitted && ticketNumber ? (
          <Text style={[styles.success, { color: kollab.color.ink }]}>
            Ticket #{ticketNumber} received. We’ll get back to you within 24 hours.
          </Text>
        ) : (
          <>
            {error ? <Text style={[styles.err, { color: kollab.color.heat }]}>{error}</Text> : null}
            <KollabTextField
              surface="well"
              placeholder="Enter subject"
              value={subject}
              onChangeText={setSubject}
              style={styles.field}
            />
            <KollabTextField
              surface="well"
              multiline
              placeholder="Describe your issue"
              value={description}
              onChangeText={setDescription}
              style={styles.area}
            />
            <View style={styles.contactActions}>
              <KollabButton
                label={image ? 'Image picked' : 'Pick Image'}
                variant="hairline"
                compact
                onPress={() => void pickImage()}
                style={styles.pickBtn}
              />
              <KollabButton
                label={submitting ? 'Submitting…' : 'Submit Ticket'}
                variant="ink"
                compact
                disabled={submitting}
                onPress={() => void handleSubmit()}
                style={styles.submitBtn}
              />
            </View>
            {image ? <Image source={{ uri: image.uri }} style={styles.preview} /> : null}
          </>
        )}
      </View>

      <View style={styles.powered}>
        <Text style={[styles.poweredTitle, { color: kollab.color.violet }]}>Powered by Zopkit</Text>
        <Text style={[styles.poweredSub, { color: kollab.color.ink }]}>Hyderabad, IT-HUB</Text>
      </View>
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  fieldLabel: {
    fontFamily: font.semiBold,
    fontSize: 12.5,
    opacity: 0.62,
    marginBottom: 7,
  },
  faqCard: { borderRadius: 24, paddingHorizontal: 18, marginBottom: 20 },
  faqRow: { paddingVertical: 15, borderBottomWidth: 1 },
  faqHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  faqQ: { flex: 1, fontFamily: font.semiBold, fontSize: 13.5 },
  faqMark: { fontSize: 16, opacity: 0.4 },
  faqA: { fontFamily: font.body, fontSize: 13, lineHeight: 20, opacity: 0.6, marginTop: 8 },
  contactCard: { borderRadius: 24, padding: 18 },
  contactTitle: { ...kType.rowTitle, marginBottom: 12 },
  field: { marginBottom: 10 },
  area: { marginBottom: 10 },
  contactActions: { flexDirection: 'row', gap: 9 },
  pickBtn: { paddingHorizontal: 18 },
  submitBtn: { flex: 1 },
  preview: { width: 100, height: 100, borderRadius: 12, marginTop: 10 },
  success: { fontFamily: font.body, fontSize: 13, lineHeight: 20, opacity: 0.7 },
  err: { fontFamily: font.semiBold, fontSize: 13, marginBottom: 8 },
  powered: { alignItems: 'center', marginTop: 20 },
  poweredTitle: { fontFamily: font.bold, fontSize: 13 },
  poweredSub: { fontFamily: font.body, fontSize: 12, opacity: 0.5, marginTop: 2 },
});
