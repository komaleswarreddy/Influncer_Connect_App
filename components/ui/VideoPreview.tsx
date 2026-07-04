import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Image, Text } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';
import { appShell, radius, spacing } from '@/theme';
import { fonts } from './typography';

const SKIP_SECONDS = 5;

type Props = {
  uri: string;
  thumbnailUri?: string | null;
  aspectRatio?: number;
  autoPlay?: boolean;
};

export function VideoPreview({ uri, thumbnailUri, aspectRatio = 9 / 16, autoPlay = false }: Props) {
  const [failed, setFailed] = useState(false);
  const [playing, setPlaying] = useState(autoPlay);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const player = useVideoPlayer(uri, (p) => {
    p.loop = true;
    if (autoPlay) p.play();
  });

  useEffect(() => {
    const timeSub = player.addListener('timeUpdate', (payload) => {
      setCurrentTime(payload.currentTime);
      if (payload.duration > 0) setDuration(payload.duration);
    });
    const statusSub = player.addListener('playingChange', (payload) => {
      setPlaying(payload.isPlaying);
    });
    const sourceSub = player.addListener('sourceLoad', (payload) => {
      if (payload.duration > 0) setDuration(payload.duration);
    });
    const statusChangeSub = player.addListener('statusChange', (payload) => {
      if (payload.status === 'error') setFailed(true);
    });

    return () => {
      timeSub.remove();
      statusSub.remove();
      sourceSub.remove();
      statusChangeSub.remove();
    };
  }, [player]);

  const togglePlay = () => {
    if (player.playing) player.pause();
    else player.play();
  };

  const seekBy = (delta: number) => {
    const next = Math.min(Math.max(0, player.currentTime + delta), duration || player.duration || 0);
    player.currentTime = next;
    setCurrentTime(next);
  };

  if (failed) {
    return (
      <Image
        source={{ uri: thumbnailUri || uri }}
        style={[styles.media, { aspectRatio }]}
        resizeMode="cover"
      />
    );
  }

  const canRewind = currentTime > 0.25;
  const maxDuration = duration || player.duration || 0;
  const canForward = maxDuration > 0 && currentTime < maxDuration - 0.25;

  return (
    <View style={[styles.wrap, { aspectRatio }]}>
      <VideoView
        style={styles.media}
        player={player}
        nativeControls={false}
        contentFit="cover"
      />
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.controlBtn, !canRewind && styles.controlBtnDisabled]}
          onPress={() => seekBy(-SKIP_SECONDS)}
          disabled={!canRewind}
          activeOpacity={0.85}
          accessibilityLabel="Rewind 5 seconds"
        >
          <Ionicons name="play-back" size={22} color="#fff" />
          <Text style={styles.controlHint}>5s</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.playBtn}
          onPress={togglePlay}
          activeOpacity={0.85}
          accessibilityLabel={playing ? 'Pause' : 'Play'}
        >
          <Ionicons name={playing ? 'pause' : 'play'} size={28} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlBtn, !canForward && styles.controlBtnDisabled]}
          onPress={() => seekBy(SKIP_SECONDS)}
          disabled={!canForward}
          activeOpacity={0.85}
          accessibilityLabel="Forward 5 seconds"
        >
          <Ionicons name="play-forward" size={22} color="#fff" />
          <Text style={styles.controlHint}>5s</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: appShell.iceBlue,
  },
  media: {
    width: '100%',
    height: '100%',
  },
  controls: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  controlBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 44,
    opacity: 1,
  },
  controlBtnDisabled: {
    opacity: 0.35,
  },
  controlHint: {
    fontFamily: fonts.semiBold,
    fontSize: 9,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 2,
  },
  playBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
