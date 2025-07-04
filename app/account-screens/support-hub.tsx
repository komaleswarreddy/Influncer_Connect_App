import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, Image } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { api } from '../../lib/api';
import { useAuthStore } from '../../store/auth-store';

// Get API_URL from api.ts
const API_URL = 'http://10.126.155.236:3000'; // Keep in sync with api.ts

const FAQS = [
  { q: "How do I connect my bank account?", a: "Go to Settings > Payouts and follow the instructions to securely connect your bank account." },
  { q: "Why is my payment pending?", a: "Payments may be pending due to processing times or missing information. Check your payout settings and email for updates." },
  { q: "How does link tracking work?", a: "Each campaign provides unique tracking links. Use these links in your content to track clicks and conversions." },
  { q: "What does 'engagement rate' mean?", a: "Engagement rate measures how actively your audience interacts with your content, calculated as (likes + comments + shares) / followers." },
  { q: "How do I apply for a campaign?", a: "Browse available campaigns and click 'View & Apply' to see details and submit your application." },
  { q: "Can I update my profile information?", a: "Yes, go to Settings > Profile to update your personal and social information." },
  { q: "How do I reset my password?", a: "Go to Settings > Security and follow the instructions to reset your password." },
  { q: "What if I have a technical problem?", a: "Use the Contact Support form below to describe your issue. Our team will assist you promptly." },
  { q: "How do I check my campaign status?", a: "Go to the Campaigns page to view your applications, active, and completed campaigns." },
  { q: "How do I contact support?", a: "Use the Contact Support form below to submit a ticket. Our team will respond within 24 hours." },
];

const ISSUE_OPTIONS = [
  { value: 'payouts', label: 'Payouts' },
  { value: 'campaign', label: 'A Campaign' },
  { value: 'technical', label: 'Technical Problem' },
  { value: 'account', label: 'My Account' },
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
      // Debug: Log the user object to see what's available
      console.log('User object:', user);
      console.log('User ID:', user?.id);
      console.log('Tenant ID:', user?.tenantId);
      
      if (!user?.id || !user?.tenantId) {
        console.log('Missing user data - User:', user);
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
      
      console.log('Submitting ticket with user ID:', user.id, 'tenant ID:', user.tenantId);
      
      // Do NOT set Content-Type for multipart/form-data
      const response = await fetch(`${API_URL}/api/support/tickets`, {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'x-user-id': user.id,
          'x-tenant-id': user.tenantId,
        },
        body: formData,
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        console.log('Error response:', data);
        throw new Error(data.error || 'Failed to submit ticket');
      }
      const data = await response.json();
      console.log('Success response:', data);
      setTicketNumber(data.ticketNumber);
      setSubmitted(true);
    } catch (err: any) {
      console.log('Submit error:', err);
      setError(err.message || 'Failed to submit ticket');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#e0f2f1' }} contentContainerStyle={{ padding: 18 }}>
      <View style={styles.tabRow}>
        <TouchableOpacity style={[styles.tabBtn, tab === 'faqs' && styles.tabBtnActive]} onPress={() => setTab('faqs')}>
          <Ionicons name="help-circle" size={20} color={tab === 'faqs' ? '#14b8a6' : '#64748b'} />
          <Text style={[styles.tabBtnText, tab === 'faqs' && styles.tabBtnTextActive]}>FAQs</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabBtn, tab === 'support' && styles.tabBtnActive]} onPress={() => setTab('support')}>
          <MaterialIcons name="support-agent" size={20} color={tab === 'support' ? '#14b8a6' : '#64748b'} />
          <Text style={[styles.tabBtnText, tab === 'support' && styles.tabBtnTextActive]}>Contact Support</Text>
        </TouchableOpacity>
      </View>
      {tab === 'faqs' && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Support FAQ</Text>
          {FAQS.map((faq, idx) => (
            <View key={idx} style={styles.accordionItem}>
              <TouchableOpacity style={styles.accordionHeader} onPress={() => setActiveFaq(activeFaq === idx ? null : idx)}>
                <Ionicons name="chatbubble-ellipses" size={18} color="#14b8a6" style={{ marginRight: 8 }} />
                <Text style={styles.accordionQuestion}>{faq.q}</Text>
                <Ionicons name={activeFaq === idx ? 'chevron-up' : 'chevron-down'} size={18} color="#64748b" style={{ marginLeft: 'auto' }} />
              </TouchableOpacity>
              {activeFaq === idx && (
                <View style={styles.accordionContent}>
                  <Text style={styles.accordionAnswer}>{faq.a}</Text>
                </View>
              )}
            </View>
          ))}
        </View>
      )}
      {tab === 'support' && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Contact Support</Text>
          {submitted && ticketNumber ? (
            <View style={styles.successBox}>
              <Ionicons name="checkmark-circle" size={48} color="#14b8a6" style={{ marginBottom: 8 }} />
              <Text style={styles.successTitle}>Thank you!</Text>
              <Text style={styles.successText}>Your request <Text style={styles.ticketNumber}>#{ticketNumber}</Text> has been received.</Text>
              <Text style={styles.successText}>Our team will get back to you within 24 hours.</Text>
            </View>
          ) : (
            <>
              {error && <Text style={styles.errorText}>{error}</Text>}
              <Text style={styles.label}>What is your issue about?</Text>
              <View style={styles.issueOptionsRow}>
                {ISSUE_OPTIONS.map(opt => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[styles.issueOption, issueType === opt.value && styles.issueOptionActive]}
                    onPress={() => setIssueType(opt.value)}
                  >
                    <Text style={[styles.issueOptionText, issueType === opt.value && styles.issueOptionTextActive]}>{opt.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.label}>Subject</Text>
              <TextInput
                style={styles.input}
                value={subject}
                onChangeText={setSubject}
                maxLength={100}
                placeholder="Enter subject"
                placeholderTextColor="#94a3b8"
              />
              <Text style={styles.label}>Please describe your issue in detail.</Text>
              <TextInput
                style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                value={description}
                onChangeText={setDescription}
                multiline
                maxLength={1000}
                placeholder="Describe your issue"
                placeholderTextColor="#94a3b8"
              />
              <Text style={styles.label}>Attach a screenshot (optional)</Text>
              <TouchableOpacity style={styles.imagePickerBtn} onPress={pickImage}>
                <Ionicons name="image" size={20} color="#14b8a6" />
                <Text style={{ color: '#14b8a6', marginLeft: 6 }}>Pick Image</Text>
              </TouchableOpacity>
              {image && (
                <Image source={{ uri: image.uri }} style={{ width: 100, height: 100, borderRadius: 8, marginTop: 8 }} />
              )}
              <TouchableOpacity style={styles.saveButton} onPress={handleSubmit} disabled={submitting}>
                {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Submit Ticket</Text>}
              </TouchableOpacity>
            </>
          )}
        </View>
      )}
      <View style={{ alignItems: 'center', marginTop: 32 }}>
        <Text style={{ color: '#14b8a6', fontWeight: 'bold' }}>Powered by Zopkit</Text>
        <Text style={{ color: '#64748b', fontSize: 12 }}>Hyderabad, IT-HUB</Text>
        <Text style={{ color: '#64748b', fontSize: 12 }}>contact@zopkit.com</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  tabRow: {
    flexDirection: 'row',
    marginBottom: 18,
    gap: 8,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: '#e0f2f1',
    borderRadius: 8,
    marginRight: 6,
  },
  tabBtnActive: {
    backgroundColor: '#14b8a6',
  },
  tabBtnText: {
    marginLeft: 6,
    color: '#64748b',
    fontWeight: 'bold',
    fontSize: 15,
  },
  tabBtnTextActive: {
    color: '#fff',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 18,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e0f2f1',
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#14b8a6',
    marginBottom: 12,
  },
  accordionItem: {
    marginBottom: 8,
    borderRadius: 8,
    backgroundColor: '#e0f2f1',
    overflow: 'hidden',
  },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  accordionQuestion: {
    fontWeight: 'bold',
    color: '#14b8a6',
    fontSize: 15,
  },
  accordionContent: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#fff',
  },
  accordionAnswer: {
    color: '#0f172a',
    fontSize: 14,
  },
  label: {
    fontWeight: '600',
    color: '#0f172a',
    fontSize: 15,
    marginBottom: 2,
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0f2f1',
    borderRadius: 8,
    padding: 10,
    fontSize: 15,
    marginBottom: 4,
    backgroundColor: '#f8fafc',
    color: '#0f172a',
  },
  issueOptionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  issueOption: {
    backgroundColor: '#e0f2f1',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 14,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e0f2f1',
    marginBottom: 6,
  },
  issueOptionActive: {
    backgroundColor: '#14b8a6',
    borderColor: '#14b8a6',
  },
  issueOptionText: {
    color: '#14b8a6',
    fontWeight: 'bold',
  },
  issueOptionTextActive: {
    color: '#fff',
  },
  imagePickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0f2f1',
    borderRadius: 8,
    padding: 10,
    marginTop: 4,
    width: 150,
  },
  saveButton: {
    backgroundColor: '#14b8a6',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  successBox: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#e0f2f1',
    borderRadius: 12,
    marginBottom: 12,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#14b8a6',
    marginBottom: 4,
  },
  successText: {
    color: '#0f172a',
    fontSize: 15,
    marginBottom: 2,
    textAlign: 'center',
  },
  ticketNumber: {
    fontFamily: 'monospace',
    backgroundColor: '#bbf7d0',
    paddingHorizontal: 6,
    borderRadius: 4,
    color: '#166534',
  },
  errorText: {
    color: '#dc2626',
    marginBottom: 8,
    fontWeight: 'bold',
    textAlign: 'center',
  },
}); 