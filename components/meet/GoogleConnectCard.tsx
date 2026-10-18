import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { Ionicons } from '@expo/vector-icons';
import { KollabButton, showKollabConfirm, showKollabToast } from '@/components/ui';
import { meetsApi, type MeetGoogleStatus } from '@/lib/meets-api';
import { font, useKollab } from '@/theme/kollab-tokens';

/** Must match MEET_MOBILE_DEEP_LINK on the server (default affiliateplatform://google-connected). */
const RETURN_URL = 'affiliateplatform://google-connected';

/** React Native's URL.searchParams is not fully implemented, so read the query string by hand. */
function queryOf(url: string): Record<string, string> {
  const out: Record<string, string> = {};
  const q = url.split('?')[1]?.split('#')[0] ?? '';
  for (const pair of q.split('&')) {
    if (!pair) continue;
    const [k, v = ''] = pair.split('=');
    try {
      out[decodeURIComponent(k)] = decodeURIComponent(v.replace(/\+/g, ' '));
    } catch {
      out[k] = v;
    }
  }
  return out;
}

type Props = {
  status: MeetGoogleStatus;
  onChange: (next: MeetGoogleStatus) => void;
};

/**
 * Connects the creator's Google account so every booking gets a calendar event with a Meet link and busy times are hidden.
 * The OAuth round trip happens in the system browser; the server redirects back to the app with success=1|0.
 */
export function GoogleConnectCard({ status, onChange }: Props) {
  const kollab = useKollab();
  const c = kollab.color;
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    try {
      onChange(await meetsApi.googleStatus());
    } catch {
      /* keep what we have */
    }
  };

  const connect = async () => {
    setBusy(true);
    try {
      const { url } = await meetsApi.googleConnect();
      const result = await WebBrowser.openAuthSessionAsync(url, RETURN_URL);
      if (result.type === 'success' && result.url) {
        const params = queryOf(result.url);
        if (params.success === '1')
          showKollabToast(`Connected ${params.email ?? 'Google Calendar'}`);
        else showKollabToast(params.error || 'Could not connect Google Calendar');
      }
      // Whatever happened, the server is the source of truth (the browser may have closed before the redirect).
      await refresh();
    } catch (e) {
      showKollabToast(e instanceof Error ? e.message : 'Could not start the Google sign-in');
    } finally {
      setBusy(false);
    }
  };

  const disconnect = async () => {
    const ok = await showKollabConfirm({
      title: 'Disconnect Google Calendar?',
      message:
        'New bookings will no longer get a Meet link or calendar event. Existing ones are not changed.',
      confirmLabel: 'Disconnect',
      destructive: true,
    });
    if (!ok) return;
    setBusy(true);
    try {
      await meetsApi.googleDisconnect();
      await refresh();
    } catch (e) {
      showKollabToast(e instanceof Error ? e.message : 'Could not disconnect');
    } finally {
      setBusy(false);
    }
  };

  if (!status.configured) {
    return (
      <View style={[styles.card, { backgroundColor: c.card }, kollab.shadow.card]}>
        <Row
          icon="alert-circle-outline"
          tint={c.violetDeep}
          bg={c.well}
          title="Google Meet is not set up yet"
          sub="Google sign-in is not configured on the server. Bookings still work, but you will need to share the joining link yourself."
        />
      </View>
    );
  }

  return (
    <View style={[styles.card, { backgroundColor: c.card }, kollab.shadow.card]}>
      {status.connected ? (
        <>
          <Row
            icon="checkmark-circle"
            tint={c.teal}
            bg={c.well}
            title="Google Calendar connected"
            sub={`Meet links are created on ${status.email ?? 'your account'}.`}
          />
          <KollabButton
            label="Disconnect"
            variant="soft"
            compact
            onPress={() => void disconnect()}
            loading={busy}
          />
        </>
      ) : (
        <>
          <Row
            icon={status.needsReconnect ? 'warning-outline' : 'logo-google'}
            tint={c.violetDeep}
            bg={c.well}
            title={status.needsReconnect ? 'Reconnect Google Calendar' : 'Connect Google Calendar'}
            sub={
              status.needsReconnect
                ? 'Google access was removed. Reconnect so bookings get a Meet link again.'
                : 'Get a Google Meet link on every booking and hide times you are already busy.'
            }
          />
          <KollabButton
            label={status.needsReconnect ? 'Reconnect' : 'Connect Google'}
            variant="primary"
            compact
            onPress={() => void connect()}
            loading={busy}
          />
        </>
      )}
    </View>
  );
}

function Row({
  icon,
  tint,
  bg,
  title,
  sub,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  tint: string;
  bg: string;
  title: string;
  sub: string;
}) {
  const kollab = useKollab();
  return (
    <View style={styles.row}>
      <View style={[styles.icon, { backgroundColor: bg }]}>
        <Ionicons name={icon} size={22} color={tint} />
      </View>
      <View style={styles.flex}>
        <Text style={[styles.title, { color: kollab.color.ink }]}>{title}</Text>
        <Text style={[styles.sub, { color: kollab.color.ink }]}>{sub}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 22, padding: 16, gap: 12 },
  row: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  flex: { flex: 1, gap: 2 },
  icon: { width: 44, height: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: font.bold, fontSize: 15 },
  sub: { fontFamily: font.body, fontSize: 12.5, opacity: 0.6, lineHeight: 17 },
});
