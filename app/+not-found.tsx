import { Link, Redirect, Stack, usePathname } from 'expo-router';
import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

function isOAuthDeepLinkPath(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return (
    /auth\/callback/i.test(pathname) ||
    /instagram-connected/i.test(pathname) ||
    pathname === '/callback'
  );
}

export default function NotFoundScreen() {
  const pathname = usePathname();

  // Belt-and-suspenders: never flash the Oops UI for OAuth return URLs.
  if (isOAuthDeepLinkPath(pathname)) {
    return <Redirect href={'/auth/callback' as never} />;
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <ThemedView style={styles.container}>
        <ThemedText type="title">This screen does not exist.</ThemedText>
        <Link href="/" style={styles.link}>
          <ThemedText type="link">Go to home screen!</ThemedText>
        </Link>
      </ThemedView>
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
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
});
