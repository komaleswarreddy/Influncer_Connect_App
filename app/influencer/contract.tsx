import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { api } from '../../lib/api';
import { useCampaignStore } from '../../store/campaign-store';
import * as ImagePicker from 'expo-image-picker';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { appShell, palette, premiumNavy, radius, shadow, spacing } from '@/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { fonts } from '@/components/ui/typography';
import { PremiumCard, PrimaryButton, SecondaryButton } from '@/components/ui';

type ContractRow = {
  label: string;
  value: string;
};

type ContractSection = {
  title: string;
  rows: ContractRow[];
  paragraphs: string[];
};

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
  return decodeHtml(value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim());
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
      const cells = [...rowMatch[1].matchAll(/<(td|th)[^>]*>([\s\S]*?)<\/\1>/gi)].map((x) => cleanText(x[2]));
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

export default function ContractScreen() {
  const { participationId } = useLocalSearchParams<{ participationId: string }>();
  const router = useRouter();
  const { acceptContract } = useCampaignStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contractHtml, setContractHtml] = useState('');
  const [adminSignature, setAdminSignature] = useState('');
  const [signature, setSignature] = useState('');
  const [saving, setSaving] = useState(false);
  const [signatureImageUrl, setSignatureImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [structuredSections, setStructuredSections] = useState<ContractSection[]>([]);
  const [generatingPDF, setGeneratingPDF] = useState(false);

  const contractSectionsToShow = useMemo(
    () =>
      structuredSections.filter((s) => {
        const t = s.title.trim().toLowerCase();
        if (t === 'campaign information') return false;
        return true;
      }),
    [structuredSections]
  );

  const fetchContract = useCallback(async () => {
    const id = participationId;
    if (!id) return;
    try {
      setLoading(true);
      setError(null);

      const contractResponse = await api.get(`/api/campaigns/contract/${id}`);
      const responseData = contractResponse as any;
      console.log('Contract response:', responseData);

      if (responseData && typeof responseData === 'object' && responseData.contractHtml) {
        if (typeof responseData.contractHtml === 'string') {
          setContractHtml(responseData.contractHtml);
          setStructuredSections(parseContractSections(responseData.contractHtml));
        } else {
          console.warn('Contract HTML is not a string:', typeof responseData.contractHtml);
          setContractHtml('');
          setStructuredSections([]);
        }
      } else {
        console.warn('No contract HTML in response:', responseData);
        setContractHtml('');
        setStructuredSections([]);
      }

      try {
        const adminSignatureResponse = await api.get(`/api/campaigns/contract/${id}/admin-signature`);
        const sigResponseData = adminSignatureResponse as any;
        console.log('Admin signature response:', sigResponseData);

        if (sigResponseData?.signature) {
          setAdminSignature(sigResponseData.signature);
        } else {
          console.warn('No admin signature in response:', sigResponseData);
          setAdminSignature('');
        }
      } catch (sigError: any) {
        console.warn('Admin signature not available:', sigError.response?.data?.error || 'No admin signature found');
        setAdminSignature('');
      }
    } catch (err: unknown) {
      console.error('Error in fetchContract:', err);
      const msg = err instanceof Error ? err.message : 'Failed to load contract';
      const awaiting =
        /application not approved yet|approve your application/i.test(msg);
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
      fetchContract();
    } else {
      setError('No participation ID provided');
      setLoading(false);
    }
  }, [participationId, fetchContract]);

  // Debug logging to help identify text node issues
  useEffect(() => {
    console.log('Contract HTML length:', contractHtml?.length || 0);
    console.log('Admin signature:', adminSignature ? 'Present' : 'Not present');
    console.log('User signature:', signature ? 'Present' : 'Not present');
    console.log('Signature image URL:', signatureImageUrl ? 'Present' : 'Not present');
  }, [contractHtml, adminSignature, signature, signatureImageUrl]);

  const handleSignatureUpload = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant permission to access your photo library');
        return;
      }

      // Launch image picker with correct MediaType API
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 1], // Signature aspect ratio
        quality: 0.8,
        base64: true, // Enable base64 encoding
      });

      if (!result.canceled && result.assets[0]) {
        setUploading(true);
        const base64Data = result.assets[0].base64;
        
        if (!base64Data) {
          throw new Error('Failed to encode image to base64');
        }

        // Upload base64 data to backend
        const response = await api.post('/api/campaigns/upload-signature', {
          file: `data:image/jpeg;base64,${base64Data}`,
          filename: 'signature.jpg',
          mimetype: 'image/jpeg'
        });

        // The API client already returns the parsed JSON data
        const signatureUrl = (response as any).url;
        
        if (!signatureUrl) {
          console.error('Invalid response structure:', response);
          throw new Error('No URL returned from signature upload');
        }
        
        console.log('Signature upload successful, URL:', signatureUrl);
        
        setSignatureImageUrl(signatureUrl);
        setSignature(signatureUrl);
        setUploading(false);
        Alert.alert('Success', 'Signature uploaded successfully!');
      }
    } catch (error) {
      console.error('Error uploading signature:', error);
      setUploading(false);
      Alert.alert('Error', 'Failed to upload signature. Please try again.');
    }
  };

  const handleAccept = async () => {
    if (!signature && !signatureImageUrl) {
      Alert.alert('Signature Required', 'Please upload your signature before accepting.');
      return;
    }

    try {
      setSaving(true);
      
      // Use the signature (either drawn or uploaded)
      const finalSignature = signature || signatureImageUrl;
      
      // Send signature to backend
      await acceptContract(participationId!, finalSignature);

      Alert.alert(
        'Contract Accepted',
        'Your contract has been accepted successfully!',
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate back to campaigns
              router.push('/influencer/campaigns');
            }
          }
        ]
      );
    } catch (err: unknown) {
      console.error('Error accepting contract:', err);
      const msg =
        err instanceof Error ? err.message : 'Failed to accept contract. Please try again.';
      const awaiting = /application not approved yet|approve your application/i.test(msg);
      Alert.alert(
        awaiting ? 'Awaiting brand approval' : 'Acceptance Failed',
        awaiting
          ? 'The brand still needs to approve your application before you can sign the contract.'
          : msg
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      setGeneratingPDF(true);
      
      if (!contractHtml || typeof contractHtml !== 'string') {
        Alert.alert('Error', 'No contract content available for PDF generation');
        return;
      }

      // Debug: Log signature information
      console.log('PDF Generation Debug:', {
        hasSignature: !!signature,
        hasSignatureImageUrl: !!signatureImageUrl,
        hasAdminSignature: !!adminSignature,
        signature: signature,
        signatureImageUrl: signatureImageUrl,
        adminSignature: adminSignature
      });

      // Create A4-sized PDF HTML with proper styling
      const pdfHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Contract Agreement</title>
          <style>
            @page {
              size: A4;
              margin: 12mm;
            }
            
            * {
              box-sizing: border-box;
            }
            
            body {
              font-family: 'Arial', sans-serif;
              font-size: 10px;
              line-height: 1.2;
              color: #000;
              margin: 0;
              padding: 0;
              background: white;
            }
            
            .email-container {
              max-width: 100%;
              margin: 0;
              padding: 0;
              border: none;
              background: white;
            }
            
            .header {
              text-align: center;
              padding: 8px 0;
              border-bottom: 1px solid #000;
              margin-bottom: 12px;
              background: white;
            }
            
            .header h1 {
              font-size: 14px;
              font-weight: bold;
              margin-bottom: 4px;
              color: #000;
            }
            
            .header .subtitle {
              font-size: 9px;
              color: #666;
            }
            
            .content {
              padding: 0;
              background: white;
            }
            
            .section {
              margin-bottom: 12px;
              padding: 0;
              border: none;
              page-break-inside: avoid;
              background: white;
            }
            
            .section h2 {
              font-size: 12px;
              font-weight: bold;
              color: #000;
              margin-bottom: 6px;
              padding-bottom: 3px;
              border-bottom: 1px solid #ccc;
            }
            
            .section h3 {
              font-size: 11px;
              font-weight: bold;
              color: #000;
              margin: 8px 0 5px 0;
            }
            
            .section-content h3 {
              font-size: 10px;
              font-weight: bold;
              color: #000;
              margin: 6px 0 3px 0;
            }
            
            .section-content p {
              margin: 0 0 5px 0;
              line-height: 1.2;
              color: #000;
            }
            
            .info-table, .payment-table {
              width: 100%;
              border-collapse: collapse;
              margin: 6px 0;
              font-size: 8px;
              background: white;
              page-break-inside: avoid;
              table-layout: fixed;
              display: table !important;
            }
            
            .campaign-table, .campaign-table-compact {
              width: 100%;
              border-collapse: collapse;
              margin: 6px 0;
              font-size: 8px;
              page-break-inside: avoid;
              table-layout: fixed;
              display: table !important;
            }
            
            .info-table th, .info-table td, 
            .payment-table th, .payment-table td,
            .campaign-table th, .campaign-table td,
            .campaign-table-compact th, .campaign-table-compact td {
              border: 1px solid #000;
              padding: 3px 2px;
              text-align: left;
              vertical-align: top;
              word-wrap: break-word;
              word-break: break-word;
              overflow-wrap: break-word;
              hyphens: auto;
              font-size: 8px;
              max-width: 0;
              display: table-cell !important;
            }
            
            .info-table th, .payment-table th,
            .campaign-table th, .campaign-table-compact th {
              background: #f0f0f0;
              color: #000;
              font-weight: bold;
              font-size: 8px;
            }
            
            .info-table td, .payment-table td,
            .campaign-table td, .campaign-table-compact td {
              color: #000;
              font-size: 8px;
            }
            
            .table-heading {
              font-size: 11px;
              font-weight: bold;
              margin: 12px 0 6px 0;
              color: #000;
            }
            
            .campaign-grid {
              margin-top: 8px;
            }
            
            .payment-section, .legal-section {
              margin: 12px 0;
              padding: 0;
              border: none;
              page-break-inside: avoid;
            }
            
            .payment-section h3, .legal-section h3 {
              font-size: 11px;
              font-weight: bold;
              color: #000;
              margin-bottom: 6px;
            }
            
            .footer {
              margin-top: 15px;
              padding-top: 8px;
              border-top: 1px solid #ccc;
              font-size: 8px;
              color: #666;
              text-align: center;
            }
            
            /* Signature section for PDF */
            .signature-section {
              margin-top: 15px;
              page-break-inside: avoid;
            }
            
            .signature-row {
              display: flex;
              justify-content: space-between;
              margin: 12px 0;
            }
            
            .signature-box {
              width: 45%;
              border: 1px solid #000;
              padding: 6px;
              text-align: center;
            }
            
            .signature-label {
              font-weight: bold;
              margin-bottom: 6px;
              font-size: 9px;
            }
            
            .signature-image {
              max-width: 100%;
              max-height: 40px;
              margin: 6px 0;
              display: block;
            }
            
            .signature-date {
              font-size: 8px;
              margin-top: 6px;
            }
            
            /* Ensure images are visible */
            img {
              max-width: 100%;
              height: auto;
              display: block;
            }
            
            /* Force table display */
            table {
              display: table !important;
              width: 100% !important;
            }
            
            tr {
              display: table-row !important;
            }
            
            th, td {
              display: table-cell !important;
            }
            
            /* Override any problematic styles from backend */
            .email-container {
              margin: 0 !important;
              padding: 0 !important;
              border: none !important;
            }
            
            .header {
              padding: 8px 0 !important;
              margin-bottom: 12px !important;
            }
            
            .content {
              padding: 0 !important;
            }
            
            .section {
              margin-bottom: 12px !important;
              padding: 0 !important;
            }
            
            .campaign-table-compact {
              margin-bottom: 12px !important;
            }
            
            .table-heading {
              margin-bottom: 6px !important;
            }
          </style>
        </head>
        <body>
          ${contractHtml}
          
          <!-- Add signature section if signatures are available -->
          ${(signature || signatureImageUrl || adminSignature) ? `
            <div class="signature-section">
              <h3>Digital Signatures</h3>
              <div class="signature-row">
                ${adminSignature ? `
                  <div class="signature-box">
                    <div class="signature-label">Tenant Admin Signature</div>
                    <img src="${adminSignature}" class="signature-image" alt="Admin Signature" crossorigin="anonymous" />
                    <div class="signature-date">Date: ${new Date().toLocaleDateString()}</div>
                  </div>
                ` : `
                  <div class="signature-box">
                    <div class="signature-label">Tenant Admin Signature</div>
                    <div style="height: 40px; display: flex; align-items: center; justify-content: center; color: #999; font-size: 8px;">
                      (Admin signature not yet provided)
                    </div>
                    <div class="signature-date">Date: ${new Date().toLocaleDateString()}</div>
                  </div>
                `}
                
                ${(signature || signatureImageUrl) ? `
                  <div class="signature-box">
                    <div class="signature-label">Influencer Signature</div>
                    <img src="${signature || signatureImageUrl}" class="signature-image" alt="Influencer Signature" crossorigin="anonymous" />
                    <div class="signature-date">Date: ${new Date().toLocaleDateString()}</div>
                  </div>
                ` : `
                  <div class="signature-box">
                    <div class="signature-label">Influencer Signature</div>
                    <div style="height: 40px; display: flex; align-items: center; justify-content: center; color: #999; font-size: 8px;">
                      (Please sign the contract)
                    </div>
                    <div class="signature-date">Date: ${new Date().toLocaleDateString()}</div>
                  </div>
                `}
              </div>
            </div>
          ` : ''}
          
          <div class="footer">
            <p>Generated by Zopkit AI-Powered Ecosystem | support@zopkit.com</p>
            <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
          </div>
        </body>
        </html>
      `;

      // Debug: Log the final HTML length
      console.log('PDF HTML length:', pdfHtml.length);
      console.log('Signature section included:', pdfHtml.includes('signature-section'));

      // Generate PDF using expo-print
      const { uri } = await Print.printToFileAsync({
        html: pdfHtml,
        base64: false,
        width: 595.28, // A4 width in points
        height: 841.89, // A4 height in points
      });

      console.log('PDF generated successfully:', uri);

      // Check if sharing is available
      const isSharingAvailable = await Sharing.isAvailableAsync();
      
      if (isSharingAvailable) {
        // Share the PDF file with download option
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Download Contract PDF',
          UTI: 'com.adobe.pdf'
        });
        
        // Show success message after sharing
        Alert.alert(
          'PDF Generated Successfully',
          'Contract PDF has been generated and is ready for download!',
          [{ text: 'OK' }]
        );
      } else {
        // Fallback: show success message
        Alert.alert(
          'PDF Generated',
          'Contract PDF has been generated successfully!',
          [{ text: 'OK' }]
        );
      }

    } catch (error) {
      console.error('Error generating PDF:', error);
      Alert.alert(
        'PDF Generation Failed',
        'Failed to generate PDF. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setGeneratingPDF(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={appShell.cta} />
          <Text style={styles.loadingText}>Loading contract details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Error Loading Contract</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.push('/influencer/campaigns')}
          >
            <Text style={styles.backButtonText}>Back to Campaigns</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Contract Agreement</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heroStrip}>
          <LinearGradient
            colors={[...premiumNavy.base.colors]}
            locations={[...premiumNavy.base.locations]}
            start={premiumNavy.base.start}
            end={premiumNavy.base.end}
            style={StyleSheet.absoluteFill}
          />
          <LinearGradient
            colors={[...premiumNavy.sheen.colors]}
            locations={[...premiumNavy.sheen.locations]}
            start={premiumNavy.sheen.start}
            end={premiumNavy.sheen.end}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
          <View style={styles.heroStripInner}>
            <Text style={styles.heroKicker}>Contract Review</Text>
            <Text style={styles.heroTitle}>Premium agreement flow</Text>
            <Text style={styles.heroSubtitle}>
              Verify details, upload signature, and complete contract in one clean pass.
            </Text>
          </View>
        </View>

        <PremiumCard comfortable style={styles.contractSection} padded={false}>
          {contractSectionsToShow.length > 0 ? (
            <View style={{ gap: spacing.sm }}>
              {contractSectionsToShow.map((section, idx) => (
                <View key={`${section.title}-${idx}`} style={styles.sectionCard}>
                  <LinearGradient
                    colors={['#0a1128', '#141e33', '#1e2d4a', '#2a3f66']}
                    locations={[0, 0.35, 0.72, 1]}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={styles.sectionHeadingGradient}
                  >
                    <LinearGradient
                      colors={['rgba(255,255,255,0.22)', 'rgba(255,255,255,0.06)', 'transparent']}
                      locations={[0, 0.35, 1]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={StyleSheet.absoluteFill}
                      pointerEvents="none"
                    />
                    <Text style={styles.sectionHeadingText} numberOfLines={3}>
                      {section.title}
                    </Text>
                  </LinearGradient>
                  <View style={styles.sectionCardBody}>
                    {section.rows.map((row, rowIndex) => (
                      <View key={`${row.label}-${rowIndex}`} style={styles.kvRow}>
                        <Text style={styles.kvLabel}>{row.label}</Text>
                        <Text style={styles.kvValue}>{row.value || '—'}</Text>
                      </View>
                    ))}
                    {section.paragraphs.map((p, pIndex) => (
                      <Text key={`${section.title}-p-${pIndex}`} style={styles.sectionParagraph}>
                        {p}
                      </Text>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.webViewPlaceholder}>
              <Text style={styles.placeholderText}>Contract preview is unavailable right now.</Text>
            </View>
          )}
        </PremiumCard>

        <PremiumCard comfortable style={styles.signatureSection} title="Digital Signature">
          <Text style={styles.sectionTitle}>Digital Signature</Text>
          <Text style={styles.signatureDescription}>
            Please upload your signature to accept the contract terms and conditions.
          </Text>
          
          {/* Admin Signature Status */}
          <View style={styles.signatureStatus}>
            <View style={[styles.statusDot, adminSignature ? styles.statusDotGreen : styles.statusDotYellow]} />
            <Text style={styles.statusText}>
              {adminSignature 
                ? 'Tenant Admin signature is available for PDF' 
                : 'Tenant Admin signature will be added to PDF when available'
              }
            </Text>
          </View>
          
          {/* Signature Upload */}
          <View style={styles.uploadSurface}>
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={handleSignatureUpload}
              disabled={uploading}
            >
              <Text style={styles.uploadButtonText}>
                {uploading ? 'Uploading...' : 'Upload Signature Image'}
              </Text>
            </TouchableOpacity>
          </View>

          {signatureImageUrl && (
            <View style={styles.signatureStatus}>
              <Text style={styles.statusTextGreen}>✓ Signature uploaded successfully</Text>
            </View>
          )}
        </PremiumCard>

        <View style={styles.actionButtons}>
          <SecondaryButton
            label={generatingPDF ? 'Generating PDF...' : 'Download PDF'}
            onPress={handleDownloadPDF}
            disabled={loading || generatingPDF}
          />
          
          <PrimaryButton
            label={saving ? 'Accepting...' : 'Accept & Complete'}
            onPress={handleAccept}
            disabled={(!signature && !signatureImageUrl) || saving}
          />
        </View>
      </ScrollView>
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
    padding: spacing.md,
    backgroundColor: appShell.card,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: appShell.borderSubtle,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: appShell.cta,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: appShell.cta,
    fontSize: 14,
    fontFamily: fonts.semiBold,
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  heroStrip: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    marginBottom: spacing.md,
    overflow: 'hidden',
    minHeight: 112,
    ...shadow.card,
  },
  heroStripInner: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    position: 'relative',
    zIndex: 1,
  },
  heroKicker: {
    color: 'rgba(255,255,255,0.72)',
    fontFamily: fonts.semiBold,
    fontSize: 11,
    letterSpacing: 0.9,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  heroTitle: {
    color: palette.white,
    fontFamily: fonts.bold,
    fontSize: 20,
    lineHeight: 26,
    marginBottom: 4,
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.86)',
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 19,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: appShell.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorIcon: {
    fontSize: 40,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 17,
    fontFamily: fonts.bold,
    color: palette.error,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: appShell.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  contractSection: {
    backgroundColor: palette.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(20, 30, 51, 0.1)',
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadow.card,
    minHeight: 620,
  },
  sectionCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(20, 30, 51, 0.12)',
    backgroundColor: palette.white,
    overflow: 'hidden',
    ...shadow.cardLight,
  },
  sectionHeadingGradient: {
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
  },
  sectionHeadingText: {
    color: '#ffffff',
    fontSize: 13,
    fontFamily: fonts.bold,
    textTransform: 'uppercase',
    letterSpacing: 1,
    textShadowColor: 'rgba(0,0,0,0.25)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  sectionCardBody: {
    padding: spacing.md,
    paddingTop: spacing.sm,
    gap: 0,
    backgroundColor: palette.white,
  },
  kvRow: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(20, 30, 51, 0.08)',
  },
  kvLabel: {
    color: '#64748b',
    fontSize: 11,
    fontFamily: fonts.semiBold,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  kvValue: {
    color: '#0a1128',
    fontSize: 15,
    fontFamily: fonts.semiBold,
    lineHeight: 22,
  },
  sectionParagraph: {
    color: appShell.textSecondary,
    fontSize: 13,
    lineHeight: 21,
    fontFamily: fonts.regular,
    marginTop: spacing.xs,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: appShell.cta,
    flex: 1,
  },
  switchModeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: appShell.canvasAlt,
    borderWidth: 1,
    borderColor: appShell.cta,
    borderRadius: radius.sm,
  },
  switchModeButtonText: {
    fontSize: 12,
    color: appShell.cta,
    fontFamily: fonts.semiBold,
  },
  contractContent: {
    borderWidth: 1,
    borderColor: appShell.borderSubtle,
    borderRadius: radius.md,
    overflow: 'hidden',
    flex: 1,
    minHeight: 500,
  },
  webViewPlaceholder: {
    minHeight: 500,
    backgroundColor: appShell.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: radius.md,
  },
  placeholderText: {
    fontSize: 14,
    color: appShell.textSecondary,
  },
  plainTextContent: {
    fontSize: 14,
    lineHeight: 22,
    color: appShell.textPrimary,
    padding: spacing.md,
    textAlign: 'left',
  },
  signatureSection: {
    backgroundColor: palette.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(20, 30, 51, 0.1)',
    padding: spacing.md,
    marginBottom: 16,
    ...shadow.card,
  },
  signatureDescription: {
    fontSize: 13,
    color: appShell.textSecondary,
    marginBottom: 16,
  },
  signatureStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    padding: 12,
    backgroundColor: palette.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(20, 30, 51, 0.1)',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusDotGreen: {
    backgroundColor: appShell.success,
  },
  statusDotYellow: {
    backgroundColor: appShell.warning,
  },
  statusText: {
    fontSize: 13,
    color: appShell.textPrimary,
    fontFamily: fonts.regular,
    flex: 1,
  },
  statusTextGreen: {
    fontSize: 13,
    color: appShell.success,
    fontFamily: fonts.semiBold,
  },
  uploadSurface: {
    marginTop: 2,
    backgroundColor: '#f8fafc',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(20, 30, 51, 0.08)',
    padding: spacing.xs,
  },
  uploadButton: {
    padding: 16,
    borderWidth: 2,
    borderColor: appShell.cta,
    borderStyle: 'dashed',
    borderRadius: radius.md,
    alignItems: 'center',
    backgroundColor: palette.white,
  },
  uploadButtonText: {
    color: appShell.cta,
    fontSize: 14,
    fontFamily: fonts.semiBold,
  },
  actionButtons: {
    gap: 12,
    marginBottom: 32,
    marginTop: 4,
  },
  primaryButton: {
    backgroundColor: appShell.cta,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  primaryButtonDisabled: {
    backgroundColor: appShell.textMuted,
  },
  primaryButtonText: {
    color: palette.white,
    fontSize: 15,
    fontFamily: fonts.bold,
  },
  secondaryButton: {
    backgroundColor: appShell.card,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: radius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: appShell.cta,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: appShell.cta,
    fontSize: 15,
    fontFamily: fonts.semiBold,
  },
}); 