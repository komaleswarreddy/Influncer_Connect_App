import { Redirect, Stack, usePathname, useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { KollabButton } from '@/components/ui/KollabButton';
import { useKollab, font } from '@/theme/kollab-tokens';

function oauthDeepLinkRedirect(pathname: string | null | undefined): string | null {
  if (!pathname) return null;
  if (/instagram-connected/i.test(pathname)) return '/account-screens/dm-automation';
  if (/auth\/callback/i.test(pathname) || pathname === '/callback') return '/auth/callback';
  return null;
}

export default function NotFoundScreen() {
  const pathname = usePathname();
  const router = useRouter();
  const kollab = useKollab();

  const redirectTo = oauthDeepLinkRedirect(pathname);
  if (redirectTo) {
    return <Redirect href={redirectTo as never} />;
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.container, { backgroundColor: kollab.color.screen }]}>
        <Text style={[styles.code, { color: kollab.color.ink }]}>404</Text>
        <Text style={[styles.body, { color: kollab.color.ink }]}>This screen doesn’t exist.</Text>
        <KollabButton
          label="Go to home screen"
          onPress={() => router.replace('/')}
          style={styles.cta}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 32,
  },
  code: {
    fontFamily: font.display,
    fontSize: 58,
    lineHeight: 58,
  },
  body: {
    fontFamily: font.body,
    fontSize: 14,
    opacity: 0.55,
    textAlign: 'center',
  },
  cta: {
    marginTop: 14,
    paddingHorizontal: 26,
    paddingVertical: 15,
    alignSelf: 'center',
  },
});
