import { useMemo } from 'react';
import { useThemeStore } from '@/store/theme-store';

/**
 * Home screen palette, ported verbatim from the "Final Home Screen" design-system mock.
 * Deliberately separate from `appShell` tokens: the mock's values diverge from the rest of
 * the app, and this screen must match it exactly without shifting every other screen.
 */
export const homeFonts = {
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semiBold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
  extraBold: 'PlusJakartaSans_800ExtraBold',
  displaySemiBold: 'Sora_600SemiBold',
  displayBold: 'Sora_700Bold',
} as const;

export type HomeDesignTokens = {
  bg: string;
  surf: string;
  ink: string;
  onInk: string;
  mut: string;
  line: string;
  tint: string;
  tintSoft: string;
  warn: string;
  dot: string;
  washLine: string;
  pillBg: string;
  pillFg: string;
  pillBgIdle: string;
  pillFgIdle: string;
  /** 3-stop gradients — consumed directly by expo-linear-gradient. */
  cardA: readonly [string, string, string];
  cardB: readonly [string, string, string];
  orb: readonly [string, string, string];
  hair: string;
  hairB: string;
  shadowColor: string;
  shadowOpacity: number;
  navShadowOpacity: number;
  isDark: boolean;
};

const light: Omit<HomeDesignTokens, 'isDark'> = {
  bg: '#F2F3F8',
  surf: '#FFFFFF',
  ink: '#111827',
  onInk: '#FFFFFF',
  mut: '#6B7280',
  line: '#DFE3EE',
  tint: '#E8EAF3',
  tintSoft: '#F5F6FB',
  warn: '#B4700F',
  dot: '#F59E0B',
  washLine: '#C7CEE0',
  pillBg: '#E3F4E9',
  pillFg: '#15803D',
  pillBgIdle: '#EDEFF6',
  pillFgIdle: '#4B5563',
  cardA: ['#FFFFFF', '#FBFCFE', '#F4F6FB'] as const,
  cardB: ['#F2F5FC', '#E9EDF6', '#DFE5F1'] as const,
  orb: ['#2A3549', '#111827', '#0A0F19'] as const,
  hair: 'rgba(17,24,39,0.07)',
  hairB: 'rgba(17,24,39,0.09)',
  shadowColor: '#111827',
  shadowOpacity: 0.09,
  navShadowOpacity: 0.07,
};

const dark: Omit<HomeDesignTokens, 'isDark'> = {
  bg: '#0B0F17',
  surf: '#161C27',
  ink: '#E9ECF4',
  onInk: '#0B0F17',
  mut: '#8A94A6',
  line: '#28313F',
  tint: '#222A38',
  tintSoft: '#1B222E',
  warn: '#E0A85C',
  dot: '#F59E0B',
  washLine: '#313D54',
  pillBg: '#14301F',
  pillFg: '#4ADE80',
  pillBgIdle: '#222A38',
  pillFgIdle: '#9CA3AF',
  cardA: ['#1B222E', '#171E29', '#131924'] as const,
  cardB: ['#232C3D', '#1E2637', '#19202E'] as const,
  orb: ['#33415A', '#1B2434', '#10161F'] as const,
  hair: 'rgba(255,255,255,0.07)',
  hairB: 'rgba(255,255,255,0.08)',
  shadowColor: '#000000',
  shadowOpacity: 0.4,
  navShadowOpacity: 0.5,
};

export function useHomeDesign(): HomeDesignTokens {
  const appearance = useThemeStore((s) => s.appearance);
  return useMemo(() => {
    const isDark = appearance === 'dark';
    return { ...(isDark ? dark : light), isDark };
  }, [appearance]);
}
