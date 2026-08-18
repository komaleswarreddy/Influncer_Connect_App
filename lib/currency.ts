/**
 * Single shared INR formatter — the app is 100% ₹ end to end (confirmed against the real
 * backend), so every money display uses this instead of a per-screen private copy or a raw
 * `.toLocaleString()` that forgets the 'en-IN' locale (which silently breaks lakh/crore
 * grouping, e.g. showing "1,50,000" as "150,000").
 */
export function formatInr(amount: number, opts?: { decimals?: number }): string {
  const decimals = opts?.decimals ?? 0;
  return `₹${amount.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}
