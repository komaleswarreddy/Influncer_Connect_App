import { DefaultTheme, DarkTheme, Theme } from '@react-navigation/native';
import { appShellDark, appShellLight } from './tokens';

export const appNavigationLight: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: appShellLight.cta,
    background: appShellLight.canvas,
    card: appShellLight.card,
    text: appShellLight.textPrimary,
    border: appShellLight.borderSubtle,
    notification: appShellLight.cta,
  },
};

export const appNavigationDark: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: appShellDark.cta,
    background: appShellDark.canvas,
    card: appShellDark.card,
    text: appShellDark.textPrimary,
    border: appShellDark.borderSubtle,
    notification: appShellDark.cta,
  },
};
