import React, { useEffect, useState, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { api } from '../../lib/api';
import { useCampaignStore } from '../../store/campaign-store';
import { WebView } from 'react-native-webview';
import * as ImagePicker from 'expo-image-picker';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import ViewShot from 'react-native-view-shot';
import { appShell, palette, radius, shadow, spacing } from '@/theme';
import { fonts } from '@/components/ui/typography';

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
  const [useTextFallback, setUseTextFallback] = useState(false);
  const [webViewHeight, setWebViewHeight] = useState(500);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const webViewRef = useRef<WebView>(null);

  useEffect(() => {
    if (participationId) {
      fetchContract();
    } else {
      setError('No participation ID provided');
      setLoading(false);
    }
  }, [participationId]);

  // Debug logging to help identify text node issues
  useEffect(() => {
    console.log('Contract HTML length:', contractHtml?.length || 0);
    console.log('Admin signature:', adminSignature ? 'Present' : 'Not present');
    console.log('User signature:', signature ? 'Present' : 'Not present');
    console.log('Signature image URL:', signatureImageUrl ? 'Present' : 'Not present');
  }, [contractHtml, adminSignature, signature, signatureImageUrl]);

  const fetchContract = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch contract HTML
      const contractResponse = await api.get(`/api/campaigns/contract/${participationId}`);
      const responseData = contractResponse as any;
      console.log('Contract response:', responseData);
      
      // The backend returns { contractHtml: "..." }
      if (responseData && typeof responseData === 'object' && responseData.contractHtml) {
        // Validate that contractHtml is a string
        if (typeof responseData.contractHtml === 'string') {
          setContractHtml(responseData.contractHtml);
        } else {
          console.warn('Contract HTML is not a string:', typeof responseData.contractHtml);
          setContractHtml('');
        }
      } else {
        console.warn('No contract HTML in response:', responseData);
        setContractHtml('');
      }
      
      // Try to fetch admin signature (optional)
      try {
        const adminSignatureResponse = await api.get(`/api/campaigns/contract/${participationId}/admin-signature`);
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
    } catch (err: any) {
      console.error('Error in fetchContract:', err);
      setError(err.response?.data?.error || 'Failed to load contract');
    } finally {
      setLoading(false);
    }
  };

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
        const imageUri = result.assets[0].uri;
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
    } catch (err: any) {
      console.error('Error accepting contract:', err);
      Alert.alert(
        'Acceptance Failed',
        err.response?.data?.error || 'Failed to accept contract. Please try again.'
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
        {/* Contract Content */}
        <View style={styles.contractSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Campaign Contract Details</Text>
            {contractHtml && typeof contractHtml === 'string' && contractHtml.trim() && (
              <TouchableOpacity 
                style={styles.switchModeButton}
                onPress={() => setUseTextFallback(!useTextFallback)}
              >
                <Text style={styles.switchModeButtonText}>
                  {useTextFallback ? 'Show HTML' : 'Show Text'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.contractContent}>
            {(() => {
              try {
                if (contractHtml && typeof contractHtml === 'string' && contractHtml.trim() && !useTextFallback) {
                  // Sanitize the HTML content to prevent any potential issues
                  const sanitizedHtml = contractHtml
                    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
                    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, ''); // Remove iframe tags
                  
                  return (
                    <WebView
                      ref={webViewRef}
                      source={{ 
                        html: `
                          <!DOCTYPE html>
                          <html>
                          <head>
                            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
                            <meta charset="UTF-8">
                            <style>
                              * {
                                box-sizing: border-box;
                                margin: 0;
                                padding: 0;
                              }
                              
                              body { 
                                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                                margin: 0; 
                                padding: 20px; 
                                font-size: 16px; 
                                line-height: 1.6;
                                color: #333;
                                background-color: #fff;
                                max-width: 100%;
                                overflow-x: hidden;
                                word-wrap: break-word;
                                overflow-wrap: break-word;
                              }
                              
                              .email-container {
                                max-width: 100%;
                                margin: 0;
                                padding: 0;
                                border: none;
                              }
                              
                              .header {
                                text-align: center;
                                padding: 20px 0;
                                border-bottom: 2px solid #333;
                                margin-bottom: 20px;
                              }
                              
                              .header h1 {
                                font-size: 24px;
                                font-weight: bold;
                                margin-bottom: 10px;
                                color: #333;
                              }
                              
                              .header .subtitle {
                                font-size: 14px;
                                color: #666;
                              }
                              
                              .content {
                                padding: 0;
                              }
                              
                              .section {
                                margin-bottom: 25px;
                                padding: 0;
                                border: none;
                              }
                              
                              .section h2 {
                                font-size: 20px;
                                font-weight: bold;
                                color: #333;
                                margin-bottom: 15px;
                                padding-bottom: 8px;
                                border-bottom: 1px solid #eee;
                              }
                              
                              .section h3 {
                                font-size: 18px;
                                font-weight: bold;
                                color: #333;
                                margin: 20px 0 10px 0;
                              }
                              
                              .section-content h3 {
                                font-size: 16px;
                                font-weight: bold;
                                color: #333;
                                margin: 15px 0 8px 0;
                              }
                              
                              .section-content p {
                                margin: 0 0 10px 0;
                                line-height: 1.6;
                                color: #333;
                              }
                              
                              .info-table, .payment-table {
                                width: 100%;
                                border-collapse: collapse;
                                margin: 15px 0;
                                font-size: 14px;
                                background: white;
                                table-layout: fixed;
                                overflow: hidden;
                              }
                              
                              .campaign-table, .campaign-table-compact {
                                width: 100%;
                                border-collapse: collapse;
                                margin: 15px 0;
                                font-size: 14px;
                                table-layout: fixed;
                                overflow: hidden;
                              }
                              
                              .info-table th, .info-table td, 
                              .payment-table th, .payment-table td,
                              .campaign-table th, .campaign-table td,
                              .campaign-table-compact th, .campaign-table-compact td {
                                border: 1px solid #ddd;
                                padding: 12px 8px;
                                text-align: left;
                                vertical-align: top;
                                word-wrap: break-word;
                                word-break: break-word;
                                overflow-wrap: break-word;
                                hyphens: auto;
                                max-width: 50%;
                              }
                              
                              .info-table th, .payment-table th,
                              .campaign-table th, .campaign-table-compact th {
                                background: #f8f9fa;
                                color: #333;
                                font-weight: bold;
                                font-size: 14px;
                              }
                              
                              .info-table td, .payment-table td,
                              .campaign-table td, .campaign-table-compact td {
                                color: #333;
                                font-size: 14px;
                                word-break: break-all;
                                overflow-wrap: break-word;
                              }
                              
                              .table-heading {
                                font-size: 18px;
                                font-weight: bold;
                                margin: 25px 0 15px 0;
                                color: #333;
                              }
                              
                              .campaign-grid {
                                margin-top: 20px;
                              }
                              
                              .payment-section, .legal-section {
                                margin: 25px 0;
                                padding: 0;
                                border: none;
                              }
                              
                              .payment-section h3, .legal-section h3 {
                                font-size: 18px;
                                font-weight: bold;
                                color: #333;
                                margin-bottom: 15px;
                              }
                              
                              .footer {
                                margin-top: 30px;
                                padding-top: 20px;
                                border-top: 1px solid #eee;
                                font-size: 12px;
                                color: #666;
                                text-align: center;
                              }
                              
                              /* Special handling for long text in table cells */
                              .info-table td, .payment-table td,
                              .campaign-table td, .campaign-table-compact td {
                                word-break: break-all;
                                overflow-wrap: break-word;
                                hyphens: auto;
                              }
                              
                              @media (max-width: 480px) {
                                body {
                                  padding: 15px;
                                  font-size: 15px;
                                }
                                
                                .header h1 {
                                  font-size: 22px;
                                }
                                
                                .section h2 {
                                  font-size: 18px;
                                }
                                
                                .section h3 {
                                  font-size: 16px;
                                }
                                
                                .info-table, .payment-table, .campaign-table, .campaign-table-compact {
                                  font-size: 13px;
                                  table-layout: fixed;
                                  width: 100%;
                                }
                                
                                .info-table th, .info-table td, 
                                .payment-table th, .payment-table td,
                                .campaign-table th, .campaign-table td,
                                .campaign-table-compact th, .campaign-table-compact td {
                                  padding: 8px 4px;
                                  font-size: 12px;
                                  word-wrap: break-word;
                                  word-break: break-all;
                                  overflow-wrap: break-word;
                                  hyphens: auto;
                                  max-width: none;
                                  width: 50%;
                                  vertical-align: top;
                                }
                                
                                .info-table th, .payment-table th,
                                .campaign-table th, .campaign-table-compact th {
                                  font-size: 12px;
                                  font-weight: bold;
                                  background: #f8f9fa;
                                  width: 40%;
                                }
                                
                                .info-table td, .payment-table td,
                                .campaign-table td, .campaign-table-compact td {
                                  width: 60%;
                                  font-size: 12px;
                                }
                              }
                              
                              @media (max-width: 360px) {
                                body {
                                  padding: 10px;
                                  font-size: 14px;
                                }
                                
                                .info-table th, .info-table td, 
                                .payment-table th, .payment-table td,
                                .campaign-table th, .campaign-table td,
                                .campaign-table-compact th, .campaign-table-compact td {
                                  padding: 6px 3px;
                                  font-size: 11px;
                                  word-break: break-all;
                                }
                                
                                .info-table th, .payment-table th,
                                .campaign-table th, .campaign-table-compact th {
                                  width: 35%;
                                  font-size: 11px;
                                }
                                
                                .info-table td, .payment-table td,
                                .campaign-table td, .campaign-table-compact td {
                                  width: 65%;
                                  font-size: 11px;
                                }
                              }
                            </style>
                            <script>
                              function sendHeight() {
                                const height = document.body.scrollHeight;
                                window.ReactNativeWebView.postMessage(JSON.stringify({
                                  type: 'height',
                                  height: height
                                }));
                              }
                              
                              // Send height after content loads
                              window.addEventListener('load', sendHeight);
                              document.addEventListener('DOMContentLoaded', sendHeight);
                              
                              // Also send height after a short delay to ensure all content is rendered
                              setTimeout(sendHeight, 500);
                            </script>
                          </head>
                          <body>
                            ${sanitizedHtml}
                          </body>
                          </html>
                        `
                      }}
                      style={[styles.webView, { height: webViewHeight }]}
                      scrollEnabled={true}
                      showsVerticalScrollIndicator={true}
                      onMessage={(event) => {
                        // Handle any messages from the webview if needed
                        try {
                          const data = JSON.parse(event.nativeEvent.data);
                          if (data.type === 'height' && data.height) {
                            setWebViewHeight(Math.max(500, data.height + 50));
                          }
                        } catch (error) {
                          // Ignore parsing errors
                        }
                      }}
                      onError={(syntheticEvent) => {
                        const { nativeEvent } = syntheticEvent;
                        console.warn('WebView error:', nativeEvent);
                        // Fallback to text display if WebView fails
                        setUseTextFallback(true);
                      }}
                      javaScriptEnabled={true}
                      domStorageEnabled={false}
                      mixedContentMode="compatibility"
                      allowsInlineMediaPlayback={false}
                      mediaPlaybackRequiresUserAction={true}
                      scalesPageToFit={true}
                      bounces={false}
                    />
                  );
                } else if (contractHtml && typeof contractHtml === 'string' && contractHtml.trim()) {
                  // Text fallback - strip HTML tags and show as plain text with better formatting
                  const plainText = contractHtml
                    .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '\n\n$1\n') // Convert h1 to double line breaks
                    .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '\n\n$1\n') // Convert h2 to double line breaks
                    .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '\n\n$1\n') // Convert h3 to double line breaks
                    .replace(/<br\s*\/?>/gi, '\n') // Convert br to line breaks
                    .replace(/<p[^>]*>(.*?)<\/p>/gi, '\n$1\n') // Convert p to line breaks
                    .replace(/<tr[^>]*>(.*?)<\/tr>/gi, '\n$1\n') // Convert table rows to line breaks
                    .replace(/<td[^>]*>(.*?)<\/td>/gi, (match, content) => {
                      // Handle long content in table cells by wrapping at 40 characters
                      const maxLength = 40;
                      if (content.length > maxLength) {
                        const words = content.split(' ');
                        let result = '';
                        let currentLine = '';
                        
                        words.forEach((word: string) => {
                          if ((currentLine + word).length <= maxLength) {
                            currentLine += (currentLine ? ' ' : '') + word;
                          } else {
                            result += (result ? '\n' : '') + currentLine;
                            currentLine = word;
                          }
                        });
                        
                        if (currentLine) {
                          result += (result ? '\n' : '') + currentLine;
                        }
                        
                        return ' | ' + result;
                      }
                      return ' | ' + content;
                    }) // Convert table cells to pipe-separated with wrapping
                    .replace(/<th[^>]*>(.*?)<\/th>/gi, '**$1**') // Convert table headers to bold
                    .replace(/<[^>]*>/g, '') // Remove all remaining HTML tags
                    .replace(/&nbsp;/g, ' ') // Replace &nbsp; with spaces
                    .replace(/&amp;/g, '&') // Replace &amp; with &
                    .replace(/&lt;/g, '<') // Replace &lt; with <
                    .replace(/&gt;/g, '>') // Replace &gt; with >
                    .replace(/&quot;/g, '"') // Replace &quot; with "
                    .replace(/\n\s*\n\s*\n/g, '\n\n') // Remove excessive line breaks
                    .trim();
                  
                  return (
                    <ScrollView style={styles.webView} showsVerticalScrollIndicator={true}>
                      <Text style={styles.plainTextContent}>
                        {plainText}
                      </Text>
                    </ScrollView>
                  );
                } else {
                  return (
                    <View style={styles.webViewPlaceholder}>
                      <Text style={styles.placeholderText}>
                        {contractHtml ? 'Contract content is empty or invalid' : 'Loading contract content...'}
                      </Text>
                    </View>
                  );
                }
              } catch (error) {
                console.error('Error rendering WebView:', error);
                return (
                  <View style={styles.webViewPlaceholder}>
                    <Text style={styles.placeholderText}>
                      Error loading contract content
                    </Text>
                  </View>
                );
              }
            })()}
          </View>
        </View>

        {/* Signature Section */}
        <View style={styles.signatureSection}>
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
          <TouchableOpacity 
            style={styles.uploadButton}
            onPress={handleSignatureUpload}
            disabled={uploading}
          >
            <Text style={styles.uploadButtonText}>
              {uploading ? 'Uploading...' : 'Upload Signature Image'}
            </Text>
          </TouchableOpacity>

          {signatureImageUrl && (
            <View style={styles.signatureStatus}>
              <Text style={styles.statusTextGreen}>✓ Signature uploaded successfully</Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleDownloadPDF}
            disabled={loading || generatingPDF}
          >
            {generatingPDF ? (
              <View style={styles.buttonContent}>
                <ActivityIndicator size="small" color={appShell.cta} style={{ marginRight: 8 }} />
                <Text style={styles.secondaryButtonText}>Generating PDF...</Text>
              </View>
            ) : (
              <Text style={styles.secondaryButtonText}>Download PDF</Text>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.primaryButton,
              (!signature && !signatureImageUrl) && styles.primaryButtonDisabled
            ]}
            onPress={handleAccept}
            disabled={!signature && !signatureImageUrl || saving}
          >
            <Text style={styles.primaryButtonText}>
              {saving ? 'Accepting...' : 'Accept & Complete'}
            </Text>
          </TouchableOpacity>
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
    backgroundColor: appShell.card,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadow.cardLight,
    minHeight: 600,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
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
  webView: {
    minHeight: 500,
    backgroundColor: appShell.card,
    borderRadius: radius.md,
    overflow: 'hidden',
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
    backgroundColor: appShell.card,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: 16,
    ...shadow.cardLight,
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
    backgroundColor: appShell.canvas,
    borderRadius: 8,
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
  uploadButton: {
    marginTop: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: appShell.cta,
    borderStyle: 'dashed',
    borderRadius: radius.md,
    alignItems: 'center',
    backgroundColor: appShell.canvasAlt,
  },
  uploadButtonText: {
    color: appShell.cta,
    fontSize: 14,
    fontFamily: fonts.semiBold,
  },
  actionButtons: {
    gap: 12,
    marginBottom: 32,
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