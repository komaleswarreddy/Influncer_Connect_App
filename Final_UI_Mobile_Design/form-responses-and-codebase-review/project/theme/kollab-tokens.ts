/**
 * Kollab identity — the single source of truth for the creator app.
 *
 * Replaces `theme/tokens.ts` (appShellLight / appShellDark), `theme/homeDesign.ts`
 * and every per-screen local palette. ONE light theme: there is no dark variant and
 * no appearance toggle. Values are measured from the Kollab reference, not approximated.
 *
 * Rule: no screen file may contain a hex value or a font family name. Import from here.
 */

export const color = {
  /** Page behind the device / scroll overscroll */
  canvas: '#E8E4DB',
  /** Default screen surface */
  screen: '#F5F3ED',
  /** Raised card on screen */
  card: '#FFFFFF',
  /** Sunken well inside a white card (inputs, chips, inline panels) */
  well: '#F5F3ED',

  ink: '#171410',
  inkOn: '#F5F3ED',
  /** Secondary copy — apply as opacity on ink, not a separate grey */
  inkMuted: 'rgba(23,20,16,0.55)',
  inkFaint: 'rgba(23,20,16,0.45)',
  hairline: 'rgba(23,20,16,0.07)',
  rule: 'rgba(23,20,16,0.14)',
  outline: 'rgba(23,20,16,0.16)',

  /** Primary accent */
  violet: '#5B4FE9',
  /** Violet on light tint — links, inline actions (contrast-safe on #EFEDFE) */
  violetDeep: '#4438C9',
  /** Lavender tint — secondary pills, informational tiles */
  tint: '#EFEDFE',

  /** Highlight — money, live, primary CTA fill */
  chartreuse: '#DDE96A',

  /** Success / paid / complete */
  teal: '#0F7B6C',
  tealTint: '#E7F3EE',

  /** Warning / heat / not-connected */
  heat: '#B4530A',

  /** Neutral status chip */
  neutralChipBg: '#F0EFEA',
  neutralChipFg: '#6B675E',

  /** Bottom nav */
  navBg: '#FFFFFF',
  navActive: '#171410',
  navIdle: '#A9A59D',
} as const;

/** FAB body — a vertical graphite gradient, not flat ink. */
export const fabGradient = ['#413C33', '#141210'] as const;

export const font = {
  /** Instrument Serif — screen titles, large numbers, photo-card titles. Italic for the emphasis word. */
  display: 'InstrumentSerif_400Regular',
  displayItalic: 'InstrumentSerif_400Regular_Italic',
  /** Instrument Sans — all interface text, buttons, labels, inputs. */
  body: 'InstrumentSans_400Regular',
  medium: 'InstrumentSans_500Medium',
  semiBold: 'InstrumentSans_600SemiBold',
  bold: 'InstrumentSans_700Bold',
} as const;

/** Type ramp. `display` sizes are serif; the rest are Instrument Sans. */
export const type = {
  displayXL: { fontFamily: font.display, fontSize: 46, lineHeight: 47, letterSpacing: -1.5 },
  displayL: { fontFamily: font.display, fontSize: 34, lineHeight: 36, letterSpacing: -1 },
  displayM: { fontFamily: font.display, fontSize: 28, lineHeight: 30, letterSpacing: -0.5 },
  displayS: { fontFamily: font.display, fontSize: 22, lineHeight: 25 },
  /** Big metric inside a stat tile */
  metric: { fontFamily: font.display, fontSize: 29 },
  metricXL: { fontFamily: font.display, fontSize: 44 },
  /** Card title floating over a photo */
  cardTitle: { fontFamily: font.display, fontSize: 25, lineHeight: 27 },

  body: { fontFamily: font.body, fontSize: 14, lineHeight: 22 },
  bodyStrong: { fontFamily: font.semiBold, fontSize: 14.5 },
  sub: { fontFamily: font.body, fontSize: 13 },
  meta: { fontFamily: font.body, fontSize: 12 },
  chip: { fontFamily: font.bold, fontSize: 11 },
  /** Section-label eyebrow — pair with a hairline rule */
  eyebrow: {
    fontFamily: font.bold,
    fontSize: 12,
    letterSpacing: 0.72,
    textTransform: 'uppercase' as const,
    opacity: 0.55,
  },
  button: { fontFamily: font.semiBold, fontSize: 16 },
} as const;

/** 4px grid. 22 is the screen gutter; 18 is the gutter for edge-to-edge card lists. */
export const space = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  cardGutter: 18,
  gutter: 22,
  lg: 24,
  xl: 32,
} as const;

export const radius = {
  /** Every button, tag, tab and segmented control. No exceptions. */
  pill: 999,
  /** Large photo-forward card */
  cardL: 26,
  /** Standard card / rail card */
  cardM: 22,
  /** Panel or grid tile */
  tile: 20,
  /** Small stat tile, inline panel */
  tileSm: 18,
  /** List row */
  row: 17,
  /** Thumbnail, brand mark */
  thumb: 14,
  /** Chat bubble — asymmetric, see chatBubble */
  bubble: 18,
} as const;

/**
 * Bottom scrim over a cover photo, for text-over-image legibility.
 * Three variants by how much top chrome sits on the image.
 */
export const scrim = {
  /** Rail card — text only at the bottom */
  rail: 'linear-gradient(180deg, rgba(0,0,0,0) 34%, rgba(11,9,6,0.82))',
  /** List card — badge top-left + top-right, title bottom */
  card: 'linear-gradient(180deg, rgba(0,0,0,0.18), rgba(0,0,0,0) 34%, rgba(11,9,6,0.86))',
  /** Detail hero fading into a white sheet */
  hero: 'linear-gradient(180deg, rgba(0,0,0,0.25), rgba(0,0,0,0) 45%, rgba(255,255,255,1) 98%)',
  /** Full-bleed screen (onboarding) */
  fullBleed:
    'linear-gradient(180deg, rgba(11,9,6,0.55), rgba(11,9,6,0.12) 34%, rgba(11,9,6,0.4) 58%, rgba(11,9,6,0.9) 88%)',
  /** Small tile — price/duration chip at the bottom */
  tile: 'linear-gradient(180deg, rgba(0,0,0,0) 55%, rgba(11,9,6,0.7))',
} as const;

/** expo-linear-gradient stop pairs for the same scrims. */
export const scrimStops = {
  rail: { colors: ['rgba(0,0,0,0)', 'rgba(11,9,6,0.82)'], locations: [0.34, 1] },
  card: {
    colors: ['rgba(0,0,0,0.18)', 'rgba(0,0,0,0)', 'rgba(11,9,6,0.86)'],
    locations: [0, 0.34, 1],
  },
  hero: {
    colors: ['rgba(0,0,0,0.25)', 'rgba(0,0,0,0)', 'rgba(255,255,255,1)'],
    locations: [0, 0.45, 0.98],
  },
  fullBleed: {
    colors: ['rgba(11,9,6,0.55)', 'rgba(11,9,6,0.12)', 'rgba(11,9,6,0.4)', 'rgba(11,9,6,0.9)'],
    locations: [0, 0.34, 0.58, 0.88],
  },
  tile: { colors: ['rgba(0,0,0,0)', 'rgba(11,9,6,0.7)'], locations: [0.55, 1] },
} as const;

export const shadow = {
  /** Resting card — barely there */
  card: {
    shadowColor: '#171410',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  /** Photo-forward card */
  photoCard: {
    shadowColor: '#171410',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 28,
    elevation: 6,
  },
  /** Bottom nav shell — drop-shadow on the SVG, not the container */
  nav: {
    shadowColor: '#171410',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.16,
    shadowRadius: 26,
    elevation: 10,
  },
  fab: {
    shadowColor: '#171410',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.32,
    shadowRadius: 18,
    elevation: 12,
  },
} as const;

/**
 * Bottom nav shell — one SVG path with a center notch cutout.
 * Render at viewBox "0 0 374 88", preserveAspectRatio="none", fill color.navBg.
 * The 60px FAB floats at top: -32 from the shell, horizontally centered.
 * Shell insets: left/right 14, bottom 30. Tab row padding: 18 top, 6 sides.
 * Reserve a 78px-wide spacer between the left and right tab pairs.
 */
export const navShellPath =
  'M 32 0 H 121 C 144 0 149 5 156 15 C 164 27 174 35 187 35 C 200 35 210 27 218 15 C 225 5 230 0 253 0 H 342 Q 374 0 374 32 V 56 Q 374 88 342 88 H 32 Q 0 88 0 56 V 32 Q 0 0 32 0 Z';

export const nav = {
  insetX: 14,
  insetBottom: 30,
  height: 88,
  fabSize: 60,
  fabOffsetY: -32,
  notchSpacer: 78,
  iconSize: 23,
  labelSize: 12,
} as const;

/** Asymmetric chat bubble corners — the tail corner drops to 5. */
export const chatBubble = {
  sent: {
    backgroundColor: color.ink,
    color: color.inkOn,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomRightRadius: 5,
    borderBottomLeftRadius: 18,
  },
  received: {
    backgroundColor: color.well,
    color: color.ink,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomRightRadius: 18,
    borderBottomLeftRadius: 5,
  },
  maxWidth: '76%',
  paddingVertical: 11,
  paddingHorizontal: 14,
  fontSize: 13.5,
  gap: 9,
} as const;

/** Status chips — solid fills only, never bare outlines. */
export const statusChip = {
  live: { bg: color.tealTint, fg: color.teal },
  money: { bg: color.chartreuse, fg: color.ink },
  info: { bg: color.tint, fg: color.violetDeep },
  neutral: { bg: color.neutralChipBg, fg: color.neutralChipFg },
  warn: { bg: '#FBEFE4', fg: color.heat },
} as const;

/** Button fills. Outline-only buttons are not part of this system. */
export const button = {
  primary: { bg: color.chartreuse, fg: color.ink },
  ink: { bg: color.ink, fg: color.chartreuse },
  soft: { bg: color.tint, fg: color.violetDeep },
  /** Only for a paired secondary next to a filled primary */
  hairline: { bg: 'transparent', fg: color.ink, borderWidth: 1.5, borderColor: color.ink },
  paddingVertical: 17,
  borderRadius: radius.pill,
} as const;

/**
 * Card shapes. Pick by the cover image's real orientation — do not force one
 * crop ratio across a mixed image set.
 *
 * wide   → landscape covers (cover-fashion-beauty, cover-fitness,
 *          cover-tech-gaming, cover-music — 1402×1122)
 * square → cover-food (1254×1254)
 * tall   → cover-travel, cover-lifestyle (portrait)
 */
export const cardShape = {
  wide: { listHeight: 200, railWidth: 250, railHeight: 176, borderRadius: radius.cardL },
  square: { listHeight: 260, railWidth: 200, railHeight: 200, borderRadius: radius.cardL },
  tall: { listHeight: 300, railWidth: 158, railHeight: 224, borderRadius: radius.cardM },
} as const;

/** Niche → cover asset, mirroring Kollab's COVERS-by-niche model. */
export const nicheCover = {
  fashion: require('../assets/Only_Use_these_images_assests/cover-fashion-beauty.png'),
  beauty: require('../assets/Only_Use_these_images_assests/cover-fashion-beauty.png'),
  fitness: require('../assets/Only_Use_these_images_assests/cover-fitness.png'),
  food: require('../assets/Only_Use_these_images_assests/cover-food.png'),
  travel: require('../assets/Only_Use_these_images_assests/cover-travel.png'),
  technology: require('../assets/Only_Use_these_images_assests/cover-tech-gaming.png'),
  lifestyle: require('../assets/Only_Use_these_images_assests/cover-lifestyle.png'),
  music: require('../assets/Only_Use_these_images_assests/cover-music.png'),
} as const;

export const nicheCoverShape: Record<keyof typeof nicheCover, keyof typeof cardShape> = {
  fashion: 'wide',
  beauty: 'wide',
  fitness: 'wide',
  food: 'square',
  travel: 'tall',
  technology: 'wide',
  lifestyle: 'tall',
  music: 'wide',
};

export const asset = {
  onboardingHero: require('../assets/Only_Use_these_images_assests/hero-onboarding.png'),
  contentThumbA: require('../assets/Only_Use_these_images_assests/thumb-content-a.png'),
  contentThumbB: require('../assets/Only_Use_these_images_assests/thumb-content-b.png'),
} as const;

export const kollab = {
  color,
  font,
  type,
  space,
  radius,
  scrim,
  scrimStops,
  shadow,
  nav,
  navShellPath,
  fabGradient,
  chatBubble,
  statusChip,
  button,
  cardShape,
  nicheCover,
  nicheCoverShape,
  asset,
} as const;

export default kollab;
