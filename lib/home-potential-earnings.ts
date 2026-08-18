/**
 * Potential earnings from active campaigns.
 * Includes fixed pay plus a rupee estimate for performance/hybrid campaigns
 * (commission % of campaign revenue/target) so the home tile is not stuck at ₹0
 * when only performance collabs exist.
 */

import { formatInr } from './currency';

function toNum(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export type PotentialCampaign = {
  id?: string;
  status?: string | null;
  commissionRate?: number | string | null;
  paymentModel?: {
    fixedBasePay?: number | string | null;
    variablePayRate?: number | string | null;
    roiCommissionRate?: number | string | null;
  } | null;
  metrics?: { revenue?: number | string | null } | null;
  targets?: { revenue?: number | string | null } | null;
};

function commissionPct(campaign: PotentialCampaign): number {
  const variable = toNum(campaign.paymentModel?.variablePayRate);
  const roi = toNum(campaign.paymentModel?.roiCommissionRate);
  const rate = toNum(campaign.commissionRate);
  if (variable > 0 && variable <= 100) return variable;
  if (roi > 0 && roi <= 100) return roi;
  if (rate > 0 && rate <= 100) return rate;
  return 0;
}

/** Rupee estimate for one campaign: fixed base + rupee variable + % of tracked/target revenue. */
export function estimateCampaignPotentialPay(campaign: PotentialCampaign): number {
  const fixed = toNum(campaign.paymentModel?.fixedBasePay);
  const variable = toNum(campaign.paymentModel?.variablePayRate);
  const pct = commissionPct(campaign);
  const revenue = toNum(campaign.metrics?.revenue) || toNum(campaign.targets?.revenue);

  let total = 0;
  if (fixed > 0) total += fixed;
  if (variable > 100) total += variable;
  if (pct > 0 && revenue > 0) total += (revenue * pct) / 100;
  return total;
}

/** @deprecated use `estimateCampaignPotentialPay` — kept for existing callers. */
export function estimateCampaignFixedPay(campaign: PotentialCampaign): number {
  return estimateCampaignPotentialPay(campaign);
}

export function sumPotentialEarningsFromEligible(args: {
  campaigns: PotentialCampaign[];
  enrolledCampaignIds: Set<string>;
}): number {
  void args.enrolledCampaignIds;
  let total = 0;
  for (const c of args.campaigns) {
    const id = String(c.id ?? '').trim();
    if (!id) continue;
    if (String(c.status ?? '').toLowerCase() !== 'active') continue;
    total += estimateCampaignPotentialPay(c);
  }
  return total;
}

/** @deprecated use `formatInr` from `@/lib/currency` directly — kept as an alias for existing callers. */
export const formatHomeInr = formatInr;
