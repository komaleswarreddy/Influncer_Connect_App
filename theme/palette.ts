/**
 * Influence Elite — global brand palette (mobile).
 * Typography targets: Plus Jakarta Sans (headlines), Inter (body) when fonts are added.
 */
export const palette = {
  primary: '#4F6EF7',
  secondary: '#0F1F3D',
  tertiary: '#5C7CFA',
  neutral: '#1C2A4A',
  surface: '#F0F5FA',
  surfaceElevated: '#F8FAFC',
  white: '#FFFFFF',
  error: '#EF4444',
} as const;

/** Rich CTA depth + midnight pill (reference ~#1A233E). */
export const paletteExtended = {
  ...palette,
  secondaryHighlight: '#1E3358',
  secondaryDeep: '#0B1528',
  /** Glossy pill body — top lit → deep midnight → shadowed foot */
  midnightTop: '#2E3854',
  midnight: '#1A233E',
  midnightMid: '#172033',
  midnightDeep: '#12192C',
} as const;

export type Palette = typeof palette;
