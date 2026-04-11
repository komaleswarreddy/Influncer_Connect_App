import { palette, paletteExtended } from './palette';

/**
 * Premium light login canvas — reference-matched (white background, navy type, periwinkle accent).
 * Use for login hero, footer, and light-form copy. Import as `loginScreen` from `@/theme`.
 */
export const loginScreen = {
  background: '#FFFFFF',
  /** Headings & primary labels */
  textPrimary: '#0F172A',
  /** Subtitles, eyebrow, footer */
  textSecondary: '#718096',
  /** Short separator under tagline */
  accent: '#8E9EED',
  /**
   * Premium skeuomorphic pill — reference navy (`--primary-dark`).
   * Use for glossy CTAs + Paper `buttonColor` where a solid fill is needed.
   */
  primaryDark: '#141e33',
  /** Slightly lighter cap (top-lit satin) */
  primaryDarkMid: '#1a2642',
  /** Shadowed foot of the pill */
  primaryDarkDeep: '#0a1018',
  /** Label / icon on `primaryDark` surfaces */
  textOnPrimary: '#FFFFFF',
  /** Solid fill alias (same as primary pill body) */
  buttonBase: '#141e33',
  /** Soft lift shadow — pair with `premiumButton.shadowOpacity` */
  buttonShadowColor: '#000000',
  buttonShadowOpacity: 0.3,
  /** Subtle top border for footer */
  footerBorder: 'rgba(15, 23, 42, 0.06)',
  /** Text field borders (mock sign-in) */
  inputOutline: '#E2E8F0',
  inputOutlineActive: palette.primary,
} as const;

/** Login / dark-shell screens — derived from Influence Elite palette. */
export const loginPremium = {
  navyDeep: palette.secondary,
  navyMid: palette.neutral,
  navyElevated: '#162544',
  surface: palette.surfaceElevated,
  /** Cool tinted panel (replaces flat white) — top-lit → soft blue-gray → airy base. */
  cardSurfaceGradient: ['#E4EBFA', '#EEF2FA', '#F6F8FE', '#FAFCFF'] as const,
  cardSheen: ['rgba(255, 255, 255, 0.65)', 'rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0)'] as const,
  cardBorder: 'rgba(79, 110, 247, 0.22)',
  surfaceBorder: 'rgba(28, 42, 74, 0.28)',
  accent: palette.primary,
  accentBright: palette.tertiary,
  gradientStart: palette.primary,
  gradientEnd: palette.tertiary,
  textOnDark: palette.white,
  textOnDarkMuted: 'rgba(255, 255, 255, 0.62)',
  textOnLight: '#0F172A',
  textOnLightSecondary: '#64748B',
  error: palette.error,
} as const;

/**
 * Glossy navy pill — reference: `#141e33` body, `#1a2642` top cap, satin + top-half gloss,
 * faint light-blue inner bevel, shadow `0 4px 15px` @ ~30% black.
 * Use `baseGradient` + `baseLocations` + `glossGradient` + `glossLocations` + `rimLine`.
 */
export const premiumButton = {
  baseGradient: [
    loginScreen.primaryDarkMid,
    loginScreen.primaryDark,
    '#121a2e',
    loginScreen.primaryDarkDeep,
  ] as const,
  baseLocations: [0, 0.32, 0.66, 1] as const,
  /** Top-half glass: strong at crown → fade by mid (≈ `linear-gradient(..., transparent 50%)`). */
  glossGradient: [
    'rgba(255, 255, 255, 0.15)',
    'rgba(255, 255, 255, 0.07)',
    'rgba(255, 255, 255, 0)',
    'rgba(255, 255, 255, 0)',
  ] as const,
  glossLocations: [0, 0.22, 0.48, 1] as const,
  /** Subtle outer edge against white */
  rimOuter: 'rgba(26, 38, 66, 0.35)',
  /** Faint light-blue + white inner bevel along top inner edge */
  rimLine: 'rgba(186, 210, 255, 0.42)',
  shadowColor: loginScreen.buttonShadowColor,
  shadowOpacity: loginScreen.buttonShadowOpacity,
  shadowOffset: { width: 0, height: 4 } as const,
  shadowRadius: 15,
  elevation: 11,
  labelColor: loginScreen.textOnPrimary,
  iconColor: loginScreen.textOnPrimary,
  minHeight: 56,
  padH: 40,
  padV: 18,
  /** Gloss overlay covers upper cap only (reference “top half”). */
  glossHeightPercent: '50%' as const,
} as const;
