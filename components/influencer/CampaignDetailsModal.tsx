import React from 'react';
import { Modal, View } from 'react-native';
import { useKollab } from '@/theme/kollab-tokens';
import CampaignDetailsScreen from './CampaignDetails';

type Props = {
  campaignId: string | null;
  onClose: () => void;
  onBrowseMore?: () => void;
  onApplySuccess?: () => void;
};

export function CampaignDetailsModal({ campaignId, onClose, onBrowseMore, onApplySuccess }: Props) {
  const kollab = useKollab();
  return (
    <Modal
      visible={Boolean(campaignId)}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, backgroundColor: kollab.color.screen }}>
        {campaignId ? (
          <CampaignDetailsScreen
            campaignId={campaignId}
            onClose={onClose}
            onBrowseMore={() => {
              onClose();
              onBrowseMore?.();
            }}
            onApplySuccess={() => {
              onClose();
              onApplySuccess?.();
            }}
          />
        ) : null}
      </View>
    </Modal>
  );
}
