/**
 * Shared LinearGradient presets for grand navy surfaces (hero, feed cards).
 * Use with expo-linear-gradient `colors`, `locations`, `start`, `end`.
 */
export const premiumNavy = {
  base: {
    colors: ['#1c2a4a', '#0f1a33', '#0a1128', '#050a12'] as const,
    locations: [0, 0.35, 0.72, 1] as const,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  sheen: {
    colors: ['rgba(255,255,255,0.14)', 'rgba(255,255,255,0.04)', 'transparent', 'transparent'] as const,
    locations: [0, 0.35, 0.65, 1] as const,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  bottomTint: {
    colors: ['transparent', 'rgba(120,140,200,0.06)'] as const,
    start: { x: 0.5, y: 0 },
    end: { x: 0.5, y: 1 },
  },
  imageOverlay: {
    colors: ['rgba(12, 22, 45, 0.25)', 'rgba(5, 10, 18, 0.88)'] as const,
    locations: [0, 1] as const,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
} as const;
