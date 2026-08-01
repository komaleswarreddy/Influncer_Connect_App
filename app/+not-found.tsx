import { Link, Redirect, Stack, usePathname } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { fonts } from '@/components/ui/typography';
import { useAppShell } from '@/theme';

// Mirrors app/+native-intent.ts's redirectSystemPath — same patterns, same
// destinations. This only runs as a fallback when native-intent didn't
// intercept the link first, so it must send each pattern to the same place
// native-intent would, not collapse everything onto /auth/callback.
function oauthDeepLinkRedirect(pathname: string | null | undefined): string | null {
  if (!pathname) return null;
  if (/instagram-connected/i.test(pathname)) return '/account-screens/dm-automation';
  if (/auth\/callback/i.test(pathname) || pathname === '/callback') return '/auth/callback';
  return null;
}

export default function NotFoundScreen() {
  const pathname = usePathname();
  const shell = useAppShell();

  // Belt-and-suspenders: never flash the Oops UI for OAuth return URLs.
  const redirectTo = oauthDeepLinkRedirect(pathname);
  if (redirectTo) {
    return <Redirect href={redirectTo as never} />;
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View style={[styles.container, { backgroundColor: shell.canvas }]}>
        <Text style={[styles.title, { color: shell.textPrimary }]}>
          This screen does not exist.
        </Text>
        <Link href="/" style={styles.link}>
          <Text style={[styles.linkText, { color: shell.cta }]}>Go to home screen!</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 20,
    textAlign: 'center',
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
  linkText: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
  },
});
