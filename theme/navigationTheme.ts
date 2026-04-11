import { DefaultTheme, DarkTheme, Theme } from '@react-navigation/native';
import { palette } from './palette';
import { appShell } from './tokens';

export const appNavigationLight: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: appShell.cta,
    background: appShell.canvas,
    card: appShell.card,
    text: appShell.textPrimary,
    border: appShell.borderSubtle,
    notification: appShell.cta,
  },
};

export const appNavigationDark: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: palette.primary,
    background: palette.secondary,
    card: '#1a2338',
    text: palette.white,
    border: 'rgba(255,255,255,0.1)',
    notification: palette.tertiary,
  },
};
