/**
 * Semantic colors — aligned with `@/theme` (Influence Elite).
 * Prefer importing `palette`, `appShell` from `@/theme` in new code.
 */
import { palette, appShell } from '@/theme';

export const Colors = {
  light: {
    text: appShell.textPrimary,
    background: appShell.canvas,
    tint: appShell.cta,
    icon: appShell.textSecondary,
    tabIconDefault: appShell.textMuted,
    tabIconSelected: appShell.cta,
  },
  dark: {
    text: '#ECEDEE',
    background: palette.secondary,
    tint: appShell.cta,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: appShell.cta,
  },
};
