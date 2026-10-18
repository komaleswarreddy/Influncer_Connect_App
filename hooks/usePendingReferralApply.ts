import { useEffect, useRef } from 'react';
import { referralsApi } from '@/lib/referrals-api';
import { clearPendingReferral, getPendingReferral } from '@/lib/pending-referral';
import { showKollabToast } from '@/components/ui';

/** A dropped connection should be retried next launch; any answer from the server (even "invalid code") is final. */
const RETRYABLE = /network|timed out|timeout|failed to fetch|connection/i;

/**
 * Applies a referral code saved at signup once the creator is signed in. Runs at most once per mount, never blocks the UI and
 * never throws: a bad or already-used code just clears itself, and the creator can still enter one on the Referral screen.
 */
export function usePendingReferralApply(enabled: boolean): void {
  const attempted = useRef(false);

  useEffect(() => {
    if (!enabled || attempted.current) return;
    attempted.current = true;
    let cancelled = false;
    void (async () => {
      const code = await getPendingReferral();
      if (!code || cancelled) return;
      try {
        await referralsApi.apply(code);
        await clearPendingReferral();
        if (!cancelled) showKollabToast('Referral code applied');
      } catch (e) {
        const message = e instanceof Error ? e.message : '';
        if (RETRYABLE.test(message)) {
          attempted.current = false;
          return;
        }
        await clearPendingReferral();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [enabled]);
}
