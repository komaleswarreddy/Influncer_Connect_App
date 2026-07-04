/** Sampled from hero_stats.png left edge so the canvas matches the artwork. */
export const HERO_STATS_CANVAS = {
  solid: '#000827',
  rgb: '0, 8, 39',
  gradient: ['#000518', '#000827', '#00092e'] as const,
  gradientLocations: [0, 0.55, 1] as const,
} as const;

/** Design baseline: iPhone 14/15 content width at 16px horizontal padding. */
export const HOME_DESIGN = {
  screenWidth: 393,
  horizontalPad: 16,
  cardWidth: 361,
  heroHeight: 268,
  heroStatsAspect: 1326 / 1186,
  inviteAspect: 2036 / 772,
} as const;

export function scaleX(cardWidth: number, designPx: number): number {
  return (designPx / HOME_DESIGN.cardWidth) * cardWidth;
}

export function heroCardHeight(cardWidth: number): number {
  return (HOME_DESIGN.heroHeight / HOME_DESIGN.cardWidth) * cardWidth;
}

export function invitesCardHeight(cardWidth: number): number {
  return cardWidth / HOME_DESIGN.inviteAspect;
}

/** Invites card is taller than native aspect so left copy fits without clipping. */
export const HOME_INVITES_MIN_HEIGHT = 148;
export const HOME_INVITES_TEXT_MAX_RATIO = 0.54;
