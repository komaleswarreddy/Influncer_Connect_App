import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import ProfileSection from '../../components/influencer/ProfileSection';
import PasswordSection from '../../components/influencer/PasswordSection';
import { cognitoConfigured } from '../../lib/auth-config';
import { ScrollScreen, KollabScreenHeader, KollabSegmented } from '@/components/ui';
import { useKollab, space } from '@/theme/kollab-tokens';

const ALL_TABS = [
  { key: 'profile', label: 'Profile' },
  { key: 'password', label: 'Password' },
];

export default function InfluencerSettingsScreen() {
  const kollab = useKollab();
  const tabs = useMemo(
    () => (cognitoConfigured ? ALL_TABS.filter((t) => t.key !== 'password') : ALL_TABS),
    []
  );
  const [activeTab, setActiveTab] = useState('profile');

  return (
    <ScrollScreen padH={space.gutter} safeAreaEdges={['top', 'left', 'right', 'bottom']}>
      <KollabScreenHeader title="Profile settings" backTone="well" />
      {tabs.length > 1 ? (
        <View style={{ marginTop: 10, marginBottom: 18 }}>
          <KollabSegmented segments={tabs} value={activeTab} onChange={setActiveTab} />
        </View>
      ) : null}
      {activeTab === 'profile' ? <ProfileSection /> : null}
      {activeTab === 'password' ? <PasswordSection /> : null}
    </ScrollScreen>
  );
}
