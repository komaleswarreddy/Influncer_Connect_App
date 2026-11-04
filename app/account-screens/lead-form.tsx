import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  KollabButton,
  KollabScreenHeader,
  KollabTextField,
  ScrollScreen,
  showKollabToast,
} from '@/components/ui';
import { leadsApi } from '@/lib/leads-api';
import { isValidEmail } from '@/lib/invoice-math';
import { font, useKollab } from '@/theme/kollab-tokens';

/** Add a lead by hand, or edit one you added by hand. (Enquiries from the media kit are read-only; edit their notes instead.) */
export default function LeadFormScreen() {
  const router = useRouter();
  const kollab = useKollab();
  const c = kollab.color;
  const { id } = useLocalSearchParams<{ id?: string }>();
  const leadId = typeof id === 'string' ? id : undefined;

  const [loading, setLoading] = useState(Boolean(leadId));
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [budget, setBudget] = useState('');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    if (!leadId) return;
    try {
      const { lead } = await leadsApi.get(leadId);
      if (lead.source !== 'manual') {
        showKollabToast('Enquiries from your kit can’t be edited. Add a note instead.');
        router.back();
        return;
      }
      setName(lead.name);
      setCompany(lead.company ?? '');
      setEmail(lead.email ?? '');
      setPhone(lead.phone ?? '');
      setBudget(lead.budgetText ?? '');
      setMessage(lead.message ?? '');
    } catch (e) {
      showKollabToast(e instanceof Error ? e.message : 'Could not load this lead');
      router.back();
    } finally {
      setLoading(false);
    }
  }, [leadId, router]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = 'Enter who this lead is';
    if (email.trim() && !isValidEmail(email)) next.email = 'Enter a valid email';
    setErrors(next);
    if (Object.keys(next).length) {
      showKollabToast(Object.values(next)[0]);
      return;
    }
    const body = {
      name: name.trim(),
      company: company.trim(),
      email: email.trim(),
      phone: phone.trim(),
      budgetText: budget.trim(),
      message: message.trim(),
    };
    setSaving(true);
    try {
      if (leadId) {
        await leadsApi.update(leadId, body);
        showKollabToast('Lead updated');
        router.back();
      } else {
        const { lead } = await leadsApi.create(body);
        showKollabToast('Lead added');
        router.replace(`/account-screens/lead-detail?id=${lead.id}` as never);
      }
    } catch (e) {
      showKollabToast(e instanceof Error ? e.message : 'Could not save this lead');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollScreen
      safeAreaEdges={['top', 'left', 'right', 'bottom']}
      scrollProps={{ keyboardShouldPersistTaps: 'handled' }}
    >
      <KollabScreenHeader
        title={leadId ? 'Edit lead' : 'Add a lead'}
        subtitle="Someone you may work with"
      />
      {loading ? (
        <ActivityIndicator color={c.ink} style={{ marginTop: 32 }} />
      ) : (
        <View style={styles.form}>
          <Field label="Name" required error={errors.name}>
            <KollabTextField
              surface="card"
              value={name}
              onChangeText={setName}
              placeholder="Contact person"
              maxLength={120}
            />
          </Field>
          <Field label="Company">
            <KollabTextField
              surface="card"
              value={company}
              onChangeText={setCompany}
              placeholder="Brand or agency"
              maxLength={200}
            />
          </Field>
          <Field label="Email" error={errors.email}>
            <KollabTextField
              surface="card"
              value={email}
              onChangeText={setEmail}
              placeholder="name@company.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={255}
            />
          </Field>
          <Field label="Phone">
            <KollabTextField
              surface="card"
              value={phone}
              onChangeText={setPhone}
              placeholder="+91 98765 43210"
              keyboardType="phone-pad"
              maxLength={32}
            />
          </Field>
          <Field label="Budget">
            <KollabTextField
              surface="card"
              value={budget}
              onChangeText={setBudget}
              placeholder="e.g. ₹50,000"
              maxLength={60}
            />
          </Field>
          <Field label="What they need">
            <KollabTextField
              surface="card"
              value={message}
              onChangeText={setMessage}
              placeholder="Deliverables, dates, context"
              multiline
              maxLength={2000}
            />
          </Field>
          <KollabButton
            label={leadId ? 'Save changes' : 'Add lead'}
            variant="ink"
            loading={saving}
            onPress={() => void save()}
          />
        </View>
      )}
    </ScrollScreen>
  );
}

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  const kollab = useKollab();
  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: kollab.color.ink }]}>
        {label}
        {required ? <Text style={{ color: '#EF4444' }}> *</Text> : null}
      </Text>
      {children}
      {error ? <Text style={[styles.error, { color: kollab.color.heat }]}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: 12 },
  field: { gap: 6 },
  label: { fontFamily: font.semiBold, fontSize: 12.5, opacity: 0.7, marginLeft: 4 },
  error: { fontFamily: font.medium, fontSize: 12, marginLeft: 4 },
});
