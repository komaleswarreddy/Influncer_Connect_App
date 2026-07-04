/** Sampled from post.png left edge so the canvas matches the artwork. */
export const POST_HERO_CANVAS = {
  solid: '#000922',
  rgb: '0, 9, 34',
  gradient: ['#000510', '#000922', '#000a2e'] as const,
  gradientLocations: [0, 0.55, 1] as const,
} as const;

/** Design baseline: iPhone 14/15 content width at 16px horizontal padding. */
export const MY_STATS_DESIGN = {
  screenWidth: 393,
  horizontalPad: 16,
  cardWidth: 361,
  heroHeight: 228,
  postAspect: 1734 / 907,
} as const;

export const MY_STATS_HERO_TEXT_RATIO = 0.52;

export function myStatsScaleX(cardWidth: number, designPx: number): number {
  return (designPx / MY_STATS_DESIGN.cardWidth) * cardWidth;
}

export function myStatsHeroHeight(cardWidth: number): number {
  return (MY_STATS_DESIGN.heroHeight / MY_STATS_DESIGN.cardWidth) * cardWidth;
}

export function myStatsHeroTextWidth(cardWidth: number): number {
  return cardWidth * MY_STATS_HERO_TEXT_RATIO;
}
