import { useMemo } from 'react';
import { appShellDark, appShellLight } from './tokens';
import { useThemeStore } from '@/store/theme-store';

export function useAppShell() {
  const appearance = useThemeStore((s) => s.appearance);

  return useMemo(() => {
    if (appearance === 'dark') {
      return {
        ...appShellDark,
        showDotBackground: true,
        isDark: true as const,
      };
    }
    return {
      ...appShellLight,
      showDotBackground: true,
      isDark: false as const,
    };
  }, [appearance]);
}

export type ResolvedAppShell = ReturnType<typeof useAppShell>;
