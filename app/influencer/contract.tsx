import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { api } from '../../lib/api';
import { useCampaignStore } from '../../store/campaign-store';
import * as ImagePicker from 'expo-image-picker';
import { useKollab, font, type as kType } from '@/theme/kollab-tokens';
import { showKollabToast } from '@/components/ui/PremiumToast';
import type { KollabTokens } from '@/theme/kollab-tokens';
import { KollabButton } from '@/components/ui/KollabButton';
import { KollabScreenHeader } from '@/components/ui/KollabScreenHeader';
import { Glyph } from '@/components/ui/Glyph';
import { isParticipationEnrolled } from '@/lib/campaign-participation-ui';
import { formatCampaignDisplayName } from '@/lib/format-campaign-display-name';
import { resolveCampaignPaySummary } from '@/lib/campaign-pay-summary';
import { campaignCoverSource } from '@/lib/campaign-cover';
import { CoverImage } from '@/components/ui';

type ContractRow = {
  label: string;
  value: string;
};

type ContractSection = {
  title: string;
  rows: ContractRow[];
  paragraphs: string[];
};

const SHORT_MONTH_DAY = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });

function decodeHtml(value: string): string {
  return value
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function cleanText(value: string): string {
  return decodeHtml(
    value
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  );
}

function parseContractSections(html: string): ContractSection[] {
  if (!html || !html.trim()) return [];
  const safe = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
  const sections: ContractSection[] = [];
  const sectionRegex = /<h[23][^>]*>([\s\S]*?)<\/h[23]>([\s\S]*?)(?=<h[23][^>]*>|$)/gi;
  let sectionMatch: RegExpExecArray | null;
  while ((sectionMatch = sectionRegex.exec(safe)) !== null) {
    const title = cleanText(sectionMatch[1]);
    const body = sectionMatch[2] || '';
    if (!title) continue;
    const rows: ContractRow[] = [];
    const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
    let rowMatch: RegExpExecArray | null;
    while ((rowMatch = rowRegex.exec(body)) !== null) {
      const cells = [...rowMatch[1].matchAll(/<(td|th)[^>]*>([\s\S]*?)<\/\1>/gi)].map((x) =>
        cleanText(x[2])
      );
      if (cells.length >= 2) {
        rows.push({ label: cells[0], value: cells.slice(1).join(' · ') });
      }
    }
    const paragraphs = [...body.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
      .map((x) => cleanText(x[1]))
      .filter(Boolean);
    sections.push({ title, rows, paragraphs });
  }
  return sections;
}

function isJunkContractLabel(label: string): boolean {
  const t = label.trim().toLowerCase();
  return (
    t.includes('age') ||
    t === 'target audience' ||
    t === 'description' ||
    t === 'start date' ||
    t === 'end date' ||
    t === 'campaign type' ||
    t === 'start' ||
    t === 'end' ||
    t === 'type' ||
    // The brand's internal workspace address (for example wrapper-1234.wrapper.local) means nothing to a creator.
    t === 'domain' ||
    t === 'website'
  );
}

function prettyType(value?: string | null): string {
  const raw = String(value ?? '')
    .replace(/_/g, ' ')
    .trim();
  if (!raw) return '—';
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

export default function ContractScreen() {
  const kollab = useKollab();
  const styles = useKollabStyles(kollab);
  const { participationId } = useLocalSearchParams<{ participationId: string }>();
  const router = useRouter();
  const {
    acceptContract,
    participations,
    applications,
    campaigns,
    fetchParticipations,
    fetchMyApplications,
    fetchCampaigns,
  } = useCampaignStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [signature, setSignature] = useState('');
  const [saving, setSaving] = useState(false);
  const [signatureImageUrl, setSignatureImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [structuredSections, setStructuredSections] = useState<ContractSection[]>([]);

  const participation = useMemo(
    () => (participations || []).find((p) => String(p.id) === String(participationId)),
    [participations, participationId]
  );

  const relatedApplication = useMemo(() => {
    if (!participation?.campaignId) return null;
    const cid = String(participation.campaignId);
    return (
      (applications || []).find((a) => String(a.campaignId ?? a.campaign?.id ?? '') === cid) ?? null
    );
  }, [applications, participation]);

  const contractAlreadyComplete = useMemo(
    () => isParticipationEnrolled(participation, relatedApplication?.status),
    [participation, relatedApplication]
  );

  const fetchContract = useCallback(async () => {
    const id = participationId;
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const contractResponse = await api.get(`/api/campaigns/contract/${id}`);
      const responseData = contractResponse as { contractHtml?: unknown };
      if (typeof responseData?.contractHtml === 'string') {
        setStructuredSections(parseContractSections(responseData.contractHtml));
      } else {
        setStructuredSections([]);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load contract';
      const awaiting = /application not approved yet|approve your application/i.test(msg);
      setError(
        awaiting
          ? 'The brand still needs to approve your application before you can view or sign this contract.'
          : msg
      );
    } finally {
      setLoading(false);
    }
  }, [participationId]);

  useEffect(() => {
    if (participationId) {
      void fetchContract();
      void fetchParticipations();
      void fetchMyApplications();
      void fetchCampaigns();
    } else {
      setError('No participation ID provided');
      setLoading(false);
    }
  }, [participationId, fetchContract, fetchParticipations, fetchMyApplications, fetchCampaigns]);

  const handleSignatureUpload = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showKollabToast('Please grant permission to access your photo library');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 1],
        quality: 0.8,
        base64: true,
      });
      if (result.canceled || !result.assets[0]) return;
      setUploading(true);
      const base64Data = result.assets[0].base64;
      if (!base64Data) throw new Error('Failed to encode image to base64');
      const response = await api.post('/api/campaigns/upload-signature', {
        file: `data:image/jpeg;base64,${base64Data}`,
        filename: 'signature.jpg',
        mimetype: 'image/jpeg',
      });
      const signatureUrl = (response as { url?: string }).url;
      if (!signatureUrl) throw new Error('No URL returned from signature upload');
      setSignatureImageUrl(signatureUrl);
      setSignature(signatureUrl);
    } catch {
      showKollabToast('Failed to upload signature. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleAccept = async () => {
    if (!signature && !signatureImageUrl) {
      showKollabToast('Please upload your signature before accepting.');
      return;
    }
    try {
      setSaving(true);
      await acceptContract(participationId!, signature || signatureImageUrl);
      showKollabToast('Contract signed');
      router.replace('/influencer/campaigns' as never);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Failed to accept contract. Please try again.';
      const awaiting = /application not approved yet|approve your application/i.test(msg);
      showKollabToast(
        awaiting
          ? 'The brand still needs to approve your application before you can sign the contract.'
          : msg
      );
    } finally {
      setSaving(false);
    }
  };

  const liveCampaign = useMemo(() => {
    const cid = participation?.campaignId ?? participation?.campaign?.id;
    if (!cid) return null;
    return campaigns.find((c) => String(c.id) === String(cid)) ?? null;
  }, [campaigns, participation]);

  const campaignTitle = formatCampaignDisplayName(
    liveCampaign?.name ?? participation?.campaign?.name
  );
  const brandName =
    liveCampaign?.tenant?.tenantName ?? participation?.campaign?.tenant?.tenantName ?? 'Brand';
  const pay = resolveCampaignPaySummary(liveCampaign ?? participation?.campaign ?? {});
  const start = liveCampaign?.startDate ?? participation?.campaign?.startDate;
  const end = liveCampaign?.endDate ?? participation?.campaign?.endDate;
  const startD = start ? new Date(start) : null;
  const endD = end ? new Date(end) : null;
  const dateRange =
    startD && !Number.isNaN(startD.getTime()) && endD && !Number.isNaN(endD.getTime())
      ? `${SHORT_MONTH_DAY.format(startD)} – ${SHORT_MONTH_DAY.format(endD)}`
      : startD && !Number.isNaN(startD.getTime())
        ? `Starts ${SHORT_MONTH_DAY.format(startD)}`
        : 'TBD';
  const description = String(
    liveCampaign?.description ?? participation?.campaign?.description ?? ''
  ).trim();
  const campaignType = prettyType(liveCampaign?.type ?? participation?.campaign?.type);

  const termSections = useMemo(() => {
    const skippedTitles = new Set(['campaign information', 'influencer details']);
    const rows = structuredSections
      .filter((s) => !skippedTitles.has(s.title.trim().toLowerCase()))
      .flatMap((s) => s.rows.filter((r) => !isJunkContractLabel(r.label) && r.value.trim()))
      .slice(0, 8);
    const paragraphs = structuredSections
      .filter((s) => !skippedTitles.has(s.title.trim().toLowerCase()))
      .flatMap((s) => s.paragraphs)
      .filter(Boolean)
      .slice(0, 6);
    return { rows, paragraphs };
  }, [structuredSections]);

  const hasSignature = Boolean(signature || signatureImageUrl);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={kollab.color.ink} />
          <Text style={styles.loadingText}>Loading contract details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={{ paddingHorizontal: 22 }}>
          <KollabScreenHeader title="Contract agreement" backTone="well" />
        </View>
        <View style={styles.errorContainer}>
          <Glyph name="help" size={40} color={kollab.color.heat} />
          <Text style={styles.errorTitle}>Error Loading Contract</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <KollabButton
            label="Back to My collabs"
            onPress={() => router.push('/influencer/campaigns')}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={{ paddingHorizontal: 22 }}>
        <KollabScreenHeader title="Contract agreement" backTone="well" />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View style={styles.photoHero}>
          <CoverImage source={campaignCoverSource(liveCampaign)} />
          <View style={styles.photoScrim} />
          <View style={styles.photoCopy}>
            <Text style={styles.photoKicker}>contract review</Text>
            <Text style={styles.photoTitle}>{campaignTitle}</Text>
          </View>
        </View>

        <View style={styles.bodyPad}>
          <View style={styles.surfaceCard}>
            <Text style={styles.cardTitle}>Overview</Text>
            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Brand</Text>
                <Text style={styles.infoValue}>{brandName}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Pay</Text>
                <Text style={styles.infoValue}>{pay.primaryLabel}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Runs</Text>
                <Text style={styles.infoValue}>{dateRange}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Type</Text>
                <Text style={styles.infoValue}>{campaignType}</Text>
              </View>
            </View>
          </View>

          {description ? (
            <View style={styles.surfaceCard}>
              <Text style={styles.cardTitle}>Description</Text>
              <Text style={styles.bodyCopy}>{description}</Text>
            </View>
          ) : null}

          {termSections.rows.length + termSections.paragraphs.length > 0 ? (
            <View style={styles.surfaceCard}>
              <Text style={styles.cardTitle}>Terms</Text>
              {termSections.rows.map((row, i) => (
                <View
                  key={`${row.label}-${i}`}
                  style={[styles.termRow, i > 0 && styles.termRowDivider]}
                >
                  <Text style={styles.termLabel}>{row.label}</Text>
                  <Text style={styles.termValue} selectable>
                    {row.value}
                  </Text>
                </View>
              ))}
              {termSections.paragraphs.map((p) => (
                <Text
                  key={p}
                  style={[styles.bodyCopy, termSections.rows.length > 0 && { marginTop: 10 }]}
                >
                  {p}
                </Text>
              ))}
            </View>
          ) : null}

          <Text style={styles.signEyebrow}>Digital signature</Text>
          {contractAlreadyComplete ? (
            <View style={styles.signedWell}>
              <Text style={styles.signedTitle}>Contract signed</Text>
              <Text style={styles.signedSub}>This agreement is complete.</Text>
            </View>
          ) : (
            <>
              <Pressable
                style={styles.dashedSign}
                onPress={() => void handleSignatureUpload()}
                disabled={uploading}
                accessibilityRole="button"
                accessibilityLabel="Upload signature"
              >
                <Text style={styles.dashedSignText}>
                  {uploading
                    ? 'Uploading...'
                    : hasSignature
                      ? 'Signature uploaded · Replace'
                      : 'Upload signature'}
                </Text>
              </Pressable>
              {signatureImageUrl ? (
                <Image
                  source={{ uri: signatureImageUrl }}
                  style={styles.signaturePreviewImage}
                  resizeMode="contain"
                />
              ) : null}
              <KollabButton
                label={
                  saving ? 'Accepting...' : hasSignature ? 'Accept contract' : 'Signature required'
                }
                variant={hasSignature ? 'primary' : 'ink'}
                onPress={() => void handleAccept()}
                disabled={!hasSignature || saving}
              />
              <Text
                style={{
                  color: kollab.color.inkMuted,
                  fontFamily: font.body,
                  fontSize: 12.5,
                  textAlign: 'center',
                  marginTop: 12,
                }}
              >
                You can leave this collab until you submit content.
              </Text>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function useKollabStyles(kollab: KollabTokens) {
  return useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: kollab.color.screen,
        },
        content: { flex: 1 },
        loadingContainer: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
        },
        loadingText: {
          marginTop: 16,
          fontSize: 14,
          fontFamily: font.body,
          color: kollab.color.inkMuted,
        },
        errorContainer: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          padding: 32,
          gap: 12,
        },
        errorTitle: {
          fontSize: 17,
          fontFamily: font.bold,
          color: kollab.color.heat,
          marginBottom: 8,
        },
        errorMessage: {
          fontSize: 14,
          fontFamily: font.body,
          color: kollab.color.inkMuted,
          textAlign: 'center',
          marginBottom: 24,
        },
        photoHero: {
          marginHorizontal: 18,
          marginTop: 8,
          marginBottom: 16,
          borderRadius: 26,
          overflow: 'hidden',
          height: 150,
          backgroundColor: kollab.color.imgBg,
        },
        photoScrim: {
          ...StyleSheet.absoluteFillObject,
          backgroundColor: 'rgba(11,9,6,0.45)',
        },
        photoCopy: {
          position: 'absolute',
          left: 18,
          right: 18,
          bottom: 15,
        },
        photoKicker: {
          fontFamily: font.bold,
          fontSize: 11,
          letterSpacing: 0.88,
          textTransform: 'uppercase',
          color: '#fff',
          opacity: 0.8,
        },
        photoTitle: {
          fontFamily: font.display,
          fontSize: 23,
          lineHeight: 25,
          color: '#fff',
          marginTop: 3,
        },
        bodyPad: {
          paddingHorizontal: 22,
        },
        surfaceCard: {
          backgroundColor: kollab.color.card,
          borderRadius: 22,
          padding: 18,
          marginBottom: 12,
          ...kollab.shadow.card,
        },
        cardTitle: {
          ...kType.sectionTitle,
          color: kollab.color.ink,
          marginBottom: 12,
        },
        infoGrid: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 16,
        },
        infoItem: {
          flexGrow: 1,
          flexBasis: '42%',
          minWidth: '40%',
        },
        infoLabel: {
          color: kollab.color.inkMuted,
          fontSize: 11.5,
          fontFamily: font.body,
        },
        infoValue: {
          color: kollab.color.ink,
          fontSize: 15,
          fontFamily: font.bold,
          marginTop: 3,
        },
        termRow: {
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: 14,
          paddingVertical: 11,
        },
        termRowDivider: {
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: kollab.color.hairline,
        },
        // The label is the part the eye scans, so it carries the accent colour; the value stays plain and readable.
        termLabel: {
          width: '38%',
          fontFamily: font.bold,
          fontSize: 12,
          letterSpacing: 0.4,
          textTransform: 'uppercase',
          color: kollab.color.violetDeep,
          paddingTop: 2,
        },
        termValue: {
          flex: 1,
          fontFamily: font.semiBold,
          fontSize: 14.5,
          lineHeight: 21,
          color: kollab.color.ink,
        },
        bodyCopy: {
          fontFamily: font.body,
          fontSize: 14,
          lineHeight: 22,
          color: kollab.color.ink,
          marginBottom: 8,
        },
        signEyebrow: {
          fontFamily: font.semiBold,
          fontSize: 12.5,
          color: kollab.color.ink,
          opacity: 0.62,
          marginBottom: 7,
          marginTop: 8,
        },
        signedWell: {
          backgroundColor: kollab.color.well,
          borderRadius: 18,
          paddingVertical: 16,
          paddingHorizontal: 16,
        },
        signedTitle: {
          fontFamily: font.semiBold,
          fontSize: 14,
          color: kollab.color.ink,
        },
        signedSub: {
          fontFamily: font.body,
          fontSize: 12.5,
          color: kollab.color.ink,
          opacity: 0.55,
          marginTop: 3,
        },
        dashedSign: {
          width: '100%',
          borderWidth: 1.5,
          borderStyle: 'dashed',
          borderColor: kollab.color.outline,
          backgroundColor: kollab.color.well,
          borderRadius: 18,
          padding: 22,
          alignItems: 'center',
          marginBottom: 16,
        },
        dashedSignText: {
          fontFamily: font.semiBold,
          fontSize: 13.5,
          color: kollab.color.ink,
        },
        signaturePreviewImage: {
          width: '100%',
          height: 90,
          borderRadius: 14,
          backgroundColor: kollab.color.well,
          marginBottom: 12,
        },
      }),
    [kollab]
  );
}
