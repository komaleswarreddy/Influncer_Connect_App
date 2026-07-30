import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { CampaignProgressPanel } from '@/components/influencer/CampaignProgressPanel';

export default function CampaignProgressScreen() {
  const { participationId, campaignId } = useLocalSearchParams<{
    participationId?: string;
    campaignId?: string;
  }>();

  return (
    <CampaignProgressPanel
      participationId={String(participationId ?? '')}
      campaignId={campaignId ? String(campaignId) : undefined}
    />
  );
}
