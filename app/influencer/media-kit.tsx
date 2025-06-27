import React, { useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, StyleSheet, Image, Alert, TouchableOpacity } from 'react-native';
import { useInfluencerStore } from '../../store/influencer-store';
import { SafeAreaView } from 'react-native-safe-area-context';
import { captureRef } from 'react-native-view-shot';

export default function MediaKitScreen() {
  const {
    instagramAnalytics: insta,
    youtubeAnalytics: yt,
    twitterAnalytics: tw,
    isLoading,
    error,
    fetchInstagramAnalytics,
    fetchYouTubeAnalytics,
    fetchTwitterAnalytics,
  } = useInfluencerStore();

  const mediaKitRef = useRef(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchInstagramAnalytics();
    fetchYouTubeAnalytics();
    fetchTwitterAnalytics();
  }, []);

  const userName =
    insta?.username || yt?.username || tw?.username || 'Influencer';
  const profilePic =
    insta?.profilePictureUrl || yt?.profilePictureUrl || tw?.profilePictureUrl || 'https://unavatar.io/github/octocat';

  const connected = insta || yt || tw;

  if (isLoading && !connected) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' }}>
        <ActivityIndicator size="large" color="#14b8a6" />
      </SafeAreaView>
    );
  }
  if (error && !connected) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' }}>
        <Text style={{ color: '#dc2626', fontSize: 16, textAlign: 'center' }}>Could not load Media Kit. Please ensure your accounts are connected on the dashboard.</Text>
      </SafeAreaView>
    );
  }
  if (!connected) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' }}>
        <Text style={{ color: '#64748b', fontSize: 16, textAlign: 'center' }}>Your Media Kit is empty. Connect at least one social media account on your dashboard to view your analytics.</Text>
      </SafeAreaView>
    );
  }

  const renderAnalyticsCard = (analytics: any, platform: string) => {
    if (!analytics) return null;
    const followerCount = platform === 'YouTube' ? analytics.subscriberCount : analytics.followerCount;
    const followerLabel = platform === 'YouTube' ? 'Subscribers' : 'Followers';
    return (
      <View style={styles.analyticsCard}>
        <Text style={styles.analyticsTitle}>{platform} Analytics</Text>
        <Text style={styles.analyticsUsername}>@{analytics.username}</Text>
        <View style={styles.analyticsRow}>
          <View style={styles.analyticsStatBox}>
            <Text style={styles.analyticsStatLabel}>{followerLabel}</Text>
            <Text style={styles.analyticsStatValue}>{followerCount?.toLocaleString()}</Text>
          </View>
          <View style={styles.analyticsStatBoxEngagement}>
            <Text style={styles.analyticsStatLabelEngagement}>Engagement</Text>
            <Text style={styles.analyticsStatValueEngagement}>{parseFloat(String(analytics.averageEngagementRate || '0')).toFixed(2)}%</Text>
          </View>
        </View>
        <View style={styles.analyticsRow}>
          <View style={styles.analyticsMetaBox}>
            <Text style={styles.analyticsMetaLabel}>Top Location</Text>
            <Text style={styles.analyticsMetaValue}>{analytics.topAudienceLocation}</Text>
          </View>
          <View style={styles.analyticsMetaBox}>
            <Text style={styles.analyticsMetaLabel}>Age Range</Text>
            <Text style={styles.analyticsMetaValue}>{analytics.audienceDemographicsAgeRange}</Text>
          </View>
        </View>
        <View style={styles.analyticsRow}>
          <View style={styles.analyticsMetaBox}>
            <Text style={styles.analyticsMetaLabel}>Male %</Text>
            <Text style={styles.analyticsMetaValue}>{analytics.malePercentage}%</Text>
          </View>
          <View style={styles.analyticsMetaBox}>
            <Text style={styles.analyticsMetaLabel}>Female %</Text>
            <Text style={styles.analyticsMetaValue}>{analytics.femalePercentage}%</Text>
          </View>
        </View>
      </View>
    );
  };

  // Handler for Export as PDF
  const handleExportPdf = async () => {
    try {
      setExporting(true);
      const Print = await import('expo-print');
      // Capture the view as a base64 string
      const base64 = await captureRef(mediaKitRef, {
        format: 'png',
        quality: 1,
        result: 'base64',
      });
      // Use a data URI for the image
      const html = `<html><body style='margin:0;padding:0;background:#fff;'>
        <img src='data:image/png;base64,${base64}' 
          style='width:555px;max-width:555px;height:auto;max-height:802px;display:block;margin:20px auto 0 auto;padding:0;' 
        />
      </body></html>`;
      const { uri: pdfUri } = await Print.printToFileAsync({ html });
      await Print.printAsync({ uri: pdfUri });
      setExporting(false);
    } catch (err) {
      setExporting(false);
      Alert.alert('Export Failed', 'Could not export as PDF. Please try again.');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <ScrollView contentContainerStyle={{ padding: 18 }}>
        {/* Export as PDF Button */}
        <TouchableOpacity
          style={styles.exportButton}
          onPress={handleExportPdf}
          disabled={exporting}
        >
          <Text style={styles.exportButtonText}>{exporting ? 'Exporting...' : 'Export as PDF'}</Text>
          {exporting && <ActivityIndicator size="small" color="#14b8a6" style={{ marginLeft: 8 }} />}
        </TouchableOpacity>
        <View ref={mediaKitRef} collapsable={false}>
          <View style={styles.profileCard}>
            <Image source={{ uri: profilePic }} style={styles.avatar} />
            <Text style={styles.profileName}>{userName}</Text>
            <Text style={styles.profileSubtitle}>Influencer Media Kit</Text>
          </View>
          <View style={styles.audienceOverviewBox}>
            <Text style={styles.audienceOverviewTitle}>Audience Overview</Text>
            <Text style={styles.audienceOverviewText}>
              {`This is your combined audience overview across all connected platforms. Your primary audience hubs are in ${insta?.topAudienceLocation || yt?.topAudienceLocation || tw?.topAudienceLocation || 'N/A'}. Average engagement rate: ${(
                [insta, yt, tw].filter(Boolean).reduce((sum, a) => sum + parseFloat(String(a?.averageEngagementRate || '0')), 0) /
                ([insta, yt, tw].filter(Boolean).length || 1)
              ).toFixed(2)}%.`}
            </Text>
          </View>
          {renderAnalyticsCard(insta, 'Instagram')}
          {renderAnalyticsCard(yt, 'YouTube')}
          {renderAnalyticsCard(tw, 'Twitter')}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  profileCard: {
    alignItems: 'center',
    backgroundColor: '#e0f2f1',
    borderRadius: 16,
    padding: 24,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    marginBottom: 12,
    borderWidth: 3,
    borderColor: '#14b8a6',
  },
  profileName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#14b8a6',
    marginBottom: 2,
  },
  profileSubtitle: {
    fontSize: 15,
    color: '#64748b',
    marginBottom: 4,
  },
  audienceOverviewBox: {
    backgroundColor: '#e6f9f2',
    borderRadius: 12,
    padding: 16,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#b6f0d3',
    shadowColor: '#14b8a6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  audienceOverviewTitle: {
    fontWeight: 'bold',
    color: '#059669',
    fontSize: 16,
    marginBottom: 4,
  },
  audienceOverviewText: {
    color: '#047857',
    fontSize: 14,
  },
  analyticsCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 16,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e0f2f1',
  },
  analyticsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#14b8a6',
    marginBottom: 2,
  },
  analyticsUsername: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 8,
  },
  analyticsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  analyticsStatBox: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#d1fae5',
    borderRadius: 8,
    padding: 10,
    marginHorizontal: 4,
  },
  analyticsStatLabel: {
    color: '#14b8a6',
    fontWeight: '600',
    fontSize: 13,
    marginBottom: 2,
  },
  analyticsStatValue: {
    color: '#0f172a',
    fontWeight: 'bold',
    fontSize: 16,
  },
  analyticsStatBoxEngagement: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#ffe4e6',
    borderRadius: 8,
    padding: 10,
    marginHorizontal: 4,
  },
  analyticsStatLabelEngagement: {
    color: '#be185d',
    fontWeight: '600',
    fontSize: 13,
    marginBottom: 2,
  },
  analyticsStatValueEngagement: {
    color: '#be185d',
    fontWeight: 'bold',
    fontSize: 16,
  },
  analyticsMetaBox: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    padding: 8,
    marginHorizontal: 4,
  },
  analyticsMetaLabel: {
    color: '#64748b',
    fontWeight: '600',
    fontSize: 12,
    marginBottom: 2,
  },
  analyticsMetaValue: {
    color: '#0f172a',
    fontWeight: 'bold',
    fontSize: 13,
  },
  exportButton: {
    backgroundColor: '#14b8a6',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 18,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#14b8a6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  exportButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
}); 