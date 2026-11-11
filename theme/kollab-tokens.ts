import { useMemo } from 'react';
import { useThemeStore } from '@/store/theme-store';

/**
 * Kollab identity — the single source of truth for the creator app.
 *
 * Replaces `theme/tokens.ts` (appShellLight / appShellDark), `theme/homeDesign.ts` and every
 * per-screen local palette. Reactive to the app's existing light/dark toggle — both palettes
 * below are lifted verbatim from `Creator App.dc.html`'s `:root` / `[data-theme="dark"]` CSS
 * custom properties, which is the primary, authoritative design file (per the handoff README),
 * not from the token bundle's own doc comment, which incorrectly claimed no dark variant exists.
 *
 * Rule: no screen file may contain a hex value or a font name. Import from here via useKollab().
 */

export type KollabColor = {
  canvas: string;
  screen: string;
  card: string;
  cardSoft: string;
  well: string;
  ink: string;
  inkOn: string;
  inkMuted: string;
  inkFaint: string;
  hairline: string;
  rule: string;
  outline: string;
  violet: string;
  violetDeep: string;
  tint: string;
  chartreuse: string;
  onChartreuse: string;
  teal: string;
  tealTint: string;
  heat: string;
  heatTint: string;
  neutralChipBg: string;
  neutralChipFg: string;
  imgBg: string;
  navBg: string;
  navActive: string;
  navIdle: string;
  /** Panel — dark-ink card fill (earnings tile, FAB popover header). Same as ink; kept as an
   *  alias so screen code reads `color.panel` the way Creator App.dc.html reads `var(--panel)`. */
  panel: string;
  panelInk: string;
  shadowColor: string;
  /** Subtle dot-grid canvas texture (Screen/ScrollScreen's optional dotBackground prop).
   *  Not part of the Kollab mockup's own look — kept only so existing screens that opt in
   *  don't regress to an undefined color; new Kollab screens should leave dotBackground off. */
  dot: string;
};

export const lightColor: KollabColor = {
  canvas: '#E8E4DB',
  /** Page fill — Lens staging `mkt-paper` (#FFFBF8). Cards, wells, and chips stay on their own tokens. */
  screen: '#FFFBF8',
  card: '#FFFFFF',
  cardSoft: 'rgba(255,255,255,0.6)',
  well: '#F5F3ED',
  ink: '#171410',
  inkOn: '#F5F3ED',
  inkMuted: 'rgba(23,20,16,0.55)',
  inkFaint: 'rgba(23,20,16,0.45)',
  hairline: 'rgba(23,20,16,0.07)',
  rule: 'rgba(23,20,16,0.14)',
  outline: 'rgba(23,20,16,0.16)',
  violet: '#5B4FE9',
  violetDeep: '#4438C9',
  tint: '#EFEDFE',
  chartreuse: '#DDE96A',
  onChartreuse: '#171410',
  teal: '#0F7B6C',
  tealTint: '#E7F3EE',
  heat: '#B4530A',
  heatTint: '#FBEFE4',
  neutralChipBg: '#F0EFEA',
  neutralChipFg: '#6B675E',
  imgBg: '#DDD8CE',
  navBg: '#FFFBF8',
  navActive: '#171410',
  navIdle: 'rgba(23,20,16,0.42)',
  panel: '#171410',
  panelInk: '#F5F3ED',
  shadowColor: '#171410',
  dot: 'rgba(23,20,16,0.07)',
};

export const darkColor: KollabColor = {
  canvas: '#0F0D0B',
  screen: '#17140F',
  card: '#221E18',
  cardSoft: 'rgba(255,255,255,0.07)',
  well: '#17140F',
  ink: '#F3EFE7',
  inkOn: '#F5F3ED',
  inkMuted: 'rgba(243,239,231,0.55)',
  inkFaint: 'rgba(243,239,231,0.45)',
  hairline: 'rgba(243,239,231,0.07)',
  rule: 'rgba(243,239,231,0.14)',
  outline: 'rgba(243,239,231,0.16)',
  violet: '#A79CFF',
  violetDeep: '#C3BBFF',
  tint: '#272144',
  chartreuse: '#DDE96A',
  onChartreuse: '#171410',
  teal: '#5CCBB4',
  tealTint: '#14332C',
  heat: '#EE9B4A',
  heatTint: '#31231A',
  neutralChipBg: '#221E18',
  neutralChipFg: '#A69F93',
  imgBg: '#2C271F',
  navBg: '#221E18',
  navActive: '#F3EFE7',
  navIdle: 'rgba(243,239,231,0.42)',
  panel: '#2C271F',
  panelInk: '#F5F3ED',
  shadowColor: '#000000',
  dot: 'rgba(243,239,231,0.06)',
};

/** FAB body — a vertical graphite gradient, constant across both themes (Creator App.dc.html
 *  never overrides `--well` under `[data-theme="dark"]`). */
export const fabGradient = ['#413C33', '#141210'] as const;

export const font = {
  /** Bricolage Grotesque — screen titles, large numbers, photo-card titles. Matches Lens display. */
  display: 'BricolageGrotesque_600SemiBold',
  /** Heavier Bricolage for the emphasis word (Lens display has no italic cut). */
  displayItalic: 'BricolageGrotesque_700Bold',
  /** Instrument Sans — all interface text, buttons, labels, inputs. */
  body: 'InstrumentSans_400Regular',
  medium: 'InstrumentSans_500Medium',
  semiBold: 'InstrumentSans_600SemiBold',
  bold: 'InstrumentSans_700Bold',
} as const;

/** Type ramp. `display` sizes are Bricolage Grotesque; the rest are Instrument Sans. Theme-invariant. */
export const type = {
  displayXL: { fontFamily: font.display, fontSize: 46, lineHeight: 47, letterSpacing: -1.6 },
  displayL: { fontFamily: font.display, fontSize: 34, lineHeight: 36, letterSpacing: -1.2 },
  displayM: { fontFamily: font.display, fontSize: 28, lineHeight: 30, letterSpacing: -1 },
  displayS: { fontFamily: font.display, fontSize: 20, lineHeight: 24, letterSpacing: -0.6 },
  metric: { fontFamily: font.display, fontSize: 29, letterSpacing: -1 },
  metricXL: { fontFamily: font.display, fontSize: 44, letterSpacing: -1.5 },
  cardTitle: { fontFamily: font.display, fontSize: 25, lineHeight: 27, letterSpacing: -0.9 },
  /** In-page section titles (Fresh collabs, Account) — display, but not hero. */
  sectionTitle: { fontFamily: font.display, fontSize: 20, lineHeight: 24, letterSpacing: -0.6 },
  /** Tile / list-row / tool-card labels. Sans — Bricolage is too heavy at this density. */
  rowTitle: {
    fontFamily: font.semiBold,
    fontSize: 16,
    lineHeight: 20,
    letterSpacing: -0.2,
  },
  body: { fontFamily: font.body, fontSize: 14, lineHeight: 22 },
  bodyStrong: { fontFamily: font.semiBold, fontSize: 14.5 },
  sub: { fontFamily: font.body, fontSize: 13 },
  meta: { fontFamily: font.body, fontSize: 12 },
  chip: { fontFamily: font.bold, fontSize: 11 },
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
  pill: 999,
  cardL: 26,
  cardM: 22,
  tile: 20,
  tileSm: 18,
  row: 17,
  thumb: 14,
  bubble: 18,
} as const;

/** Bottom scrim over a cover photo — theme-invariant (always a dark scrim on top of a photo,
 *  regardless of the app's own light/dark mode). */
export const scrim = {
  rail: 'linear-gradient(180deg, rgba(0,0,0,0) 34%, rgba(11,9,6,0.82))',
  card: 'linear-gradient(180deg, rgba(0,0,0,0.18), rgba(0,0,0,0) 34%, rgba(11,9,6,0.86))',
  hero: 'linear-gradient(180deg, rgba(0,0,0,0.25), rgba(0,0,0,0) 45%, rgba(255,255,255,1) 98%)',
  fullBleed:
    'linear-gradient(180deg, rgba(11,9,6,0.55), rgba(11,9,6,0.12) 34%, rgba(11,9,6,0.4) 58%, rgba(11,9,6,0.9) 88%)',
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

function buildShadow(shadowColor: string) {
  return {
    card: {
      shadowColor,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
      elevation: 1,
    },
    photoCard: {
      shadowColor,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.12,
      shadowRadius: 28,
      elevation: 6,
    },
    nav: {
      shadowColor,
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.16,
      shadowRadius: 26,
      elevation: 10,
    },
    fab: {
      shadowColor,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.32,
      shadowRadius: 18,
      elevation: 12,
    },
  } as const;
}

/**
 * Bottom nav shell — one SVG path with a center notch cutout.
 * Render at viewBox "0 0 374 88", preserveAspectRatio="none", fill color.navBg.
 * The 60px FAB floats at top: -32 from the shell, horizontally centered.
 * Shell insets: left/right 14, bottom 30 + safe-area. Tab row padding: 18 top, 6 sides.
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

/** Card shapes. Pick by the cover image's real orientation — do not force one crop ratio
 *  across a mixed image set.
 *  wide   → landscape covers (cover-fashion-beauty, cover-fitness, cover-tech-gaming, cover-music — 1402×1122)
 *  square → cover-food (1254×1254)
 *  tall   → cover-travel, cover-lifestyle (portrait) */
export const cardShape = {
  wide: { listHeight: 200, railWidth: 250, railHeight: 176, borderRadius: radius.cardL },
  square: { listHeight: 260, railWidth: 200, railHeight: 200, borderRadius: radius.cardL },
  tall: { listHeight: 300, railWidth: 158, railHeight: 224, borderRadius: radius.cardM },
} as const;

/** One size per context so Fresh collabs / My collabs / catalog grids never mix tall+wide cells. */
export const uniformCard = {
  railWidth: 220,
  railHeight: 220,
  /** HTML list cards are 350–405px; one equal height so mixed niches don't stagger. */
  listHeight: 350,
  catalogThumb: 168,
  borderRadius: 22,
  listBorderRadius: 26,
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

/** Asymmetric chat bubble corners — the tail corner drops to 5. Colors resolved per-theme by useKollab(). */
function buildChatBubble(color: KollabColor, isDark: boolean) {
  return {
    sent: {
      backgroundColor: color.ink,
      // `ink` flips to a light tone in dark mode but `inkOn` stays light, which made sent text invisible there.
      color: isDark ? color.canvas : color.inkOn,
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
    maxWidth: '76%' as const,
    paddingVertical: 11,
    paddingHorizontal: 14,
    fontSize: 13.5,
    gap: 9,
  };
}

/** Status chips — solid fills only, never bare outlines. */
function buildStatusChip(color: KollabColor) {
  return {
    live: { bg: color.tealTint, fg: color.teal },
    money: { bg: color.chartreuse, fg: color.onChartreuse },
    info: { bg: color.tint, fg: color.violetDeep },
    neutral: { bg: color.neutralChipBg, fg: color.neutralChipFg },
    warn: { bg: color.heatTint, fg: color.heat },
  };
}

/** Choice pills — Creator App.dc.html `pill(on)`: selected fg is `--canvas`, never `--inkOn`. */
function buildChoiceChip(color: KollabColor) {
  return {
    selectedBg: color.ink,
    selectedFg: color.canvas,
    selectedBorder: color.ink,
    idleBg: color.card,
    idleFg: color.inkMuted,
    idleBorder: color.outline,
  };
}

/** Button fills. Outline-only buttons are not part of this system. */
function buildButton(color: KollabColor, isDark: boolean) {
  return {
    primary: { bg: color.chartreuse, fg: color.onChartreuse },
    // In dark mode `ink` is the cream colour, so chartreuse text on it is ~1.15:1 (invisible) —
    // use the near-black `onChartreuse` for the label there. Light mode keeps chartreuse-on-ink.
    ink: { bg: color.ink, fg: isDark ? color.onChartreuse : color.chartreuse },
    soft: { bg: color.tint, fg: color.violetDeep },
    /** Only for a paired secondary next to a filled primary */
    hairline: { bg: 'transparent', fg: color.ink, borderWidth: 1.5, borderColor: color.ink },
    /** Dark-mode disabled look: a flat muted fill with a still-legible label. A plain opacity fade
     *  turns the bright fills into washed-out slabs against the dark surface. Light mode uses a flat
     *  light gray the same way, so a disabled button reads as gray (not a faded black slab). */
    disabled: isDark
      ? { bg: '#2E2923', fg: 'rgba(243,239,231,0.62)', borderColor: 'rgba(243,239,231,0.28)' }
      : { bg: '#E2DED6', fg: 'rgba(23,20,16,0.45)', borderColor: 'rgba(23,20,16,0.10)' },
    paddingVertical: 17,
    borderRadius: radius.pill,
  };
}

export type KollabTokens = {
  isDark: boolean;
  color: KollabColor;
  fabGradient: typeof fabGradient;
  font: typeof font;
  type: typeof type;
  space: typeof space;
  radius: typeof radius;
  scrim: typeof scrim;
  scrimStops: typeof scrimStops;
  shadow: ReturnType<typeof buildShadow>;
  nav: typeof nav;
  navShellPath: typeof navShellPath;
  chatBubble: ReturnType<typeof buildChatBubble>;
  statusChip: ReturnType<typeof buildStatusChip>;
  choiceChip: ReturnType<typeof buildChoiceChip>;
  button: ReturnType<typeof buildButton>;
  cardShape: typeof cardShape;
  uniformCard: typeof uniformCard;
  nicheCover: typeof nicheCover;
  nicheCoverShape: typeof nicheCoverShape;
  asset: typeof asset;
};

export function choiceChipColors(
  kollab: Pick<KollabTokens, 'choiceChip'>,
  on: boolean
): { backgroundColor: string; borderColor: string; color: string } {
  const spec = kollab.choiceChip;
  return {
    backgroundColor: on ? spec.selectedBg : spec.idleBg,
    borderColor: on ? spec.selectedBorder : spec.idleBorder,
    color: on ? spec.selectedFg : spec.idleFg,
  };
}

/** The one hook every screen uses for color, type, space, radius and shared component specs.
 *  Reactive to the app's existing theme toggle — see kollab-tokens.ts's module doc for why this
 *  is a hook rather than the design bundle's original static export. */
export function useKollab(): KollabTokens {
  const appearance = useThemeStore((s) => s.appearance);
  return useMemo(() => {
    const isDark = appearance === 'dark';
    const color = isDark ? darkColor : lightColor;
    return {
      isDark,
      color,
      fabGradient,
      font,
      type,
      space,
      radius,
      scrim,
      scrimStops,
      shadow: buildShadow(color.shadowColor),
      nav,
      navShellPath,
      chatBubble: buildChatBubble(color, isDark),
      statusChip: buildStatusChip(color),
      choiceChip: buildChoiceChip(color),
      button: buildButton(color, isDark),
      cardShape,
      uniformCard,
      nicheCover,
      nicheCoverShape,
      asset,
    };
  }, [appearance]);
}
