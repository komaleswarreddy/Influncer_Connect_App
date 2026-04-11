import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import { palette } from './palette';
import { appShell } from './tokens';

/** MD3 theme aligned with Influence Elite — use for PaperProvider */
export const appPaperLight = {
  ...MD3LightTheme,
  roundness: 14,
  colors: {
    ...MD3LightTheme.colors,
    primary: appShell.cta,
    primaryContainer: 'rgba(142, 158, 237, 0.22)',
    secondary: palette.secondary,
    secondaryContainer: '#E2E8F0',
    tertiary: palette.tertiary,
    tertiaryContainer: '#EEF2FF',
    surface: appShell.card,
    surfaceVariant: '#F1F5F9',
    background: appShell.canvas,
    error: palette.error,
    onPrimary: palette.white,
    onPrimaryContainer: appShell.textPrimary,
    onSecondary: palette.white,
    onSurface: appShell.textPrimary,
    onSurfaceVariant: appShell.textSecondary,
    onBackground: appShell.textPrimary,
    outline: 'rgba(28, 42, 74, 0.22)',
    outlineVariant: appShell.borderSubtle,
    inverseSurface: palette.secondary,
    inverseOnSurface: palette.white,
    inversePrimary: palette.tertiary,
    elevation: MD3LightTheme.colors.elevation,
  },
};

export const appPaperDark = {
  ...MD3DarkTheme,
  roundness: 14,
  colors: {
    ...MD3DarkTheme.colors,
    primary: palette.primary,
    primaryContainer: '#1E3358',
    secondary: palette.neutral,
    surface: '#1a2338',
    background: palette.secondary,
    onPrimary: palette.white,
    onSurface: palette.white,
    onSurfaceVariant: 'rgba(255,255,255,0.7)',
    onBackground: palette.white,
  },
};
