import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Linking, StyleSheet, Text, Vibration, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import {
  KollabButton,
  KollabScreenHeader,
  KollabTextField,
  Screen,
  showKollabToast,
} from '@/components/ui';
import { eventsApi, type CheckInResult } from '@/lib/events-api';
import { CHECK_IN_UI } from '@/lib/events-ui';
import { font, useKollab } from '@/theme/kollab-tokens';

/** The same code is not processed twice within this window: a camera reports one QR code many times per second. */
const REPEAT_WINDOW_MS = 3000;
const RESULT_MS = 2600;

export default function EventScannerScreen() {
  const router = useRouter();
  const kollab = useKollab();
  const c = kollab.color;
  const { id } = useLocalSearchParams<{ id: string }>();
  const eventId = typeof id === 'string' ? id : '';

  const [permission, requestPermission] = useCameraPermissions();
  const [result, setResult] = useState<CheckInResult | null>(null);
  const [checkedInCount, setCheckedInCount] = useState(0);
  const [busy, setBusy] = useState(false);
  const [manual, setManual] = useState('');
  const lastScan = useRef<{ code: string; at: number } | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlight = useRef(false);

  useEffect(
    () => () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    },
    []
  );

  const process = useCallback(
    async (raw: string) => {
      if (!eventId || inFlight.current) return;
      inFlight.current = true;
      setBusy(true);
      try {
        const res = await eventsApi.checkIn(eventId, raw);
        setResult(res);
        if (res.outcome === 'checked_in') setCheckedInCount((n) => n + 1);
        Vibration.vibrate(res.outcome === 'checked_in' ? 60 : [0, 80, 60, 80]);
        if (hideTimer.current) clearTimeout(hideTimer.current);
        hideTimer.current = setTimeout(() => setResult(null), RESULT_MS);
      } catch (e) {
        showKollabToast(e instanceof Error ? e.message : 'Could not check this ticket');
      } finally {
        inFlight.current = false;
        setBusy(false);
      }
    },
    [eventId]
  );

  const onScanned = useCallback(
    ({ data }: { data: string }) => {
      const now = Date.now();
      const last = lastScan.current;
      if (last && last.code === data && now - last.at < REPEAT_WINDOW_MS) return;
      lastScan.current = { code: data, at: now };
      void process(data);
    },
    [process]
  );

  const submitManual = async () => {
    const code = manual.trim();
    if (!code) return;
    await process(code);
    setManual('');
  };

  const tone = result ? CHECK_IN_UI[result.outcome] : null;
  const toneColor = tone
    ? tone.tone === 'ok'
      ? '#15803d'
      : tone.tone === 'warn'
        ? '#b45309'
        : '#b91c1c'
    : c.ink;

  return (
    <Screen padH={0} safeAreaEdges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.head}>
        <KollabScreenHeader
          title="Scan tickets"
          subtitle={`${checkedInCount} checked in this session`}
        />
      </View>

      {!permission ? (
        <ActivityIndicator color={c.ink} style={{ marginTop: 40 }} />
      ) : !permission.granted ? (
        <View style={styles.permission}>
          <Text style={[styles.permTitle, { color: c.ink }]}>Camera access needed</Text>
          <Text style={[styles.permBody, { color: c.ink }]}>
            Allow the camera to scan the QR codes on tickets. You can also type a ticket code below.
          </Text>
          {permission.canAskAgain ? (
            <KollabButton
              label="Allow camera"
              variant="ink"
              onPress={() => void requestPermission()}
            />
          ) : (
            <KollabButton
              label="Open settings"
              variant="ink"
              onPress={() => void Linking.openSettings()}
            />
          )}
        </View>
      ) : (
        <View style={styles.cameraWrap}>
          <CameraView
            style={StyleSheet.absoluteFill}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={onScanned}
          />
          <View style={styles.frame} pointerEvents="none" />
          {busy ? (
            <View style={styles.busy}>
              <ActivityIndicator color="#fff" />
            </View>
          ) : null}
          {result && tone ? (
            <View
              style={[styles.result, { backgroundColor: toneColor }]}
              accessibilityLiveRegion="polite"
            >
              <Text style={styles.resultTitle}>{tone.label}</Text>
              {result.ticket ? (
                <>
                  <Text style={styles.resultName}>{result.ticket.attendeeName}</Text>
                  <Text style={styles.resultMeta}>{result.ticket.passName}</Text>
                </>
              ) : null}
            </View>
          ) : null}
        </View>
      )}

      <View style={styles.manual}>
        <Text style={[styles.manualLabel, { color: c.ink }]}>Or type the ticket code</Text>
        <View style={styles.manualRow}>
          <KollabTextField
            surface="card"
            value={manual}
            onChangeText={(v) => setManual(v.toUpperCase())}
            placeholder="e.g. K7M2QX9TBW"
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={64}
            style={{ flex: 1 }}
          />
          <KollabButton
            label="Check in"
            variant="ink"
            compact
            loading={busy}
            onPress={() => void submitManual()}
          />
        </View>
        <KollabButton label="Done" variant="soft" onPress={() => router.back()} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { paddingHorizontal: 22 },
  permission: { padding: 24, gap: 12 },
  permTitle: { fontFamily: font.display, fontSize: 24 },
  permBody: { fontFamily: font.body, fontSize: 14.5, opacity: 0.65, lineHeight: 21 },
  cameraWrap: {
    flex: 1,
    marginHorizontal: 16,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  frame: {
    position: 'absolute',
    top: '22%',
    left: '16%',
    right: '16%',
    aspectRatio: 1,
    borderWidth: 3,
    borderColor: '#ffffffcc',
    borderRadius: 24,
  },
  busy: { position: 'absolute', top: 14, right: 14 },
  result: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 14,
    borderRadius: 20,
    padding: 16,
    gap: 2,
  },
  resultTitle: { color: '#fff', fontFamily: font.display, fontSize: 24 },
  resultName: { color: '#fff', fontFamily: font.bold, fontSize: 17 },
  resultMeta: { color: '#ffffffd9', fontFamily: font.body, fontSize: 14 },
  manual: { padding: 16, gap: 10 },
  manualLabel: { fontFamily: font.semiBold, fontSize: 12.5, opacity: 0.7, marginLeft: 4 },
  manualRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
});
