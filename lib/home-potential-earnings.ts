/**
 * Potential earnings estimate from eligible (not enrolled) active campaigns.
 * Fixed-base only for v1 — performance % is not convertible to a rupee total.
 */

function toNum(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export function estimateCampaignFixedPay(campaign: {
  paymentModel?: {
    fixedBasePay?: number | string | null;
  } | null;
}): number {
  return toNum(campaign.paymentModel?.fixedBasePay);
}

export function sumPotentialEarningsFromEligible(args: {
  campaigns: {
    id?: string;
    status?: string | null;
    paymentModel?: { fixedBasePay?: number | string | null } | null;
  }[];
  enrolledCampaignIds: Set<string>;
}): number {
  let total = 0;
  for (const c of args.campaigns) {
    const id = String(c.id ?? '').trim();
    if (!id) continue;
    if (String(c.status ?? '').toLowerCase() !== 'active') continue;
    if (args.enrolledCampaignIds.has(id.toLowerCase())) continue;
    total += estimateCampaignFixedPay(c);
  }
  return total;
}

export function formatHomeInr(amount: number): string {
  return `₹${Math.round(amount).toLocaleString('en-IN')}`;
}
