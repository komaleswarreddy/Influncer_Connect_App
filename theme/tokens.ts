import { Platform } from 'react-native';
import { palette } from './palette';
import { loginScreen } from './semantic';

/** 4px grid */
export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
} as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 20,
  /** Reference: premium creator cards ~24px */
  xl: 24,
  xxl: 28,
  pill: 999,
} as const;

/**
 * Premium app shell — aligned with `loginScreen` (navy CTA `#141e33`, copy `#0F172A` / `#718096`, periwinkle accent).
 * Use for screens, tab bar, cards, and primary buttons end-to-end.
 */
export const appShell = {
  canvas: '#F4F6FC',
  canvasAlt: '#EEF1F8',
  dot: 'rgba(20, 30, 51, 0.07)',
  card: palette.white,
  cardBorder: 'rgba(20, 30, 51, 0.08)',
  borderSubtle: loginScreen.inputOutline,
  /** Premium creator dashboard reference (#0A1128 / #6B7280) */
  textPrimary: '#0A1128',
  textSecondary: '#6B7280',
  textMuted: '#94A3B8',
  /** Decorative accent bar / soft highlights */
  accent: loginScreen.accent,
  /** Filled CTAs, nav active state, key icons */
  cta: loginScreen.primaryDark,
  /** Brand blue for links & focus that need extra contrast (optional) */
  link: palette.primary,
  iceBlue: 'rgba(142, 158, 237, 0.16)',
  iceBlueStrong: 'rgba(142, 158, 237, 0.22)',
  tabBarBg: palette.white,
  tabInactive: loginScreen.textSecondary,
  tabActive: loginScreen.primaryDark,
  success: '#22C55E',
  warning: '#F59E0B',
  secondaryButtonBg: 'rgba(142, 158, 237, 0.2)',
  secondaryButtonText: loginScreen.textPrimary,
} as const;

export const shadow = {
  /** ~0 10px 30px rgba(0,0,0,0.05) — premium creator cards */
  card: Platform.select({
    ios: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.05,
      shadowRadius: 30,
    },
    android: { elevation: 6 },
    default: {},
  }),
  cardLight: Platform.select({
    ios: {
      shadowColor: loginScreen.primaryDark,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.06,
      shadowRadius: 14,
    },
    android: { elevation: 4 },
    default: {},
  }),
  fab: Platform.select({
    ios: {
      shadowColor: loginScreen.primaryDark,
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.28,
      shadowRadius: 18,
    },
    android: { elevation: 12 },
    default: {},
  }),
} as const;
