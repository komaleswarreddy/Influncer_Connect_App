/**
 * Client-side pay labels (mirrors server/utils/campaign-pay-summary.ts).
 * Prefer API `paySummary` when present.
 */

import { formatInr } from './currency';

export type CompensationModel = 'fixed' | 'performance' | 'hybrid';

export type CampaignPaymentModel = {
  compensationModel?: string | null;
  fixedBasePay?: number | string | null;
  variablePayRate?: number | string | null;
  roiCommissionRate?: number | string | null;
};

export type CampaignPaySummary = {
  model: CompensationModel | 'unknown';
  primaryLabel: string;
  secondaryLabel: string;
  pillLabel: string;
};

function toNum(v: unknown): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function formatPct(n: number): string {
  const rounded = Number.isInteger(n) ? String(n) : n.toFixed(1).replace(/\.0$/, '');
  return `${rounded}%`;
}

export function buildCampaignPaySummary(
  paymentModel: CampaignPaymentModel | null | undefined,
  commissionRate?: string | number | null
): CampaignPaySummary {
  const modelRaw = String(paymentModel?.compensationModel || '')
    .trim()
    .toLowerCase();
  const model: CompensationModel | 'unknown' =
    modelRaw === 'fixed' || modelRaw === 'performance' || modelRaw === 'hybrid'
      ? modelRaw
      : 'unknown';

  const fixed = toNum(paymentModel?.fixedBasePay) ?? 0;
  const variable = toNum(paymentModel?.variablePayRate) ?? 0;
  const rateFallback = toNum(commissionRate);

  if (model === 'fixed' && fixed > 0) {
    return {
      model,
      primaryLabel: formatInr(fixed),
      secondaryLabel: 'Fixed pay',
      pillLabel: 'Fixed',
    };
  }

  if (model === 'performance') {
    if (variable > 0) {
      return {
        model,
        primaryLabel: variable <= 100 ? formatPct(variable) : formatInr(variable),
        secondaryLabel: 'Performance',
        pillLabel: 'Performance',
      };
    }
    if (rateFallback != null && rateFallback > 0) {
      return {
        model,
        primaryLabel: formatPct(rateFallback),
        secondaryLabel: 'Performance',
        pillLabel: 'Performance',
      };
    }
  }

  if (model === 'hybrid') {
    const parts: string[] = [];
    if (fixed > 0) parts.push(formatInr(fixed));
    if (variable > 0) parts.push(variable <= 100 ? formatPct(variable) : formatInr(variable));
    if (parts.length > 0) {
      return {
        model,
        primaryLabel: parts.join(' + '),
        secondaryLabel: 'Hybrid',
        pillLabel: 'Hybrid',
      };
    }
  }

  if (rateFallback != null && rateFallback > 0) {
    return {
      model: model === 'unknown' ? 'unknown' : model,
      primaryLabel: formatPct(rateFallback),
      secondaryLabel: 'Commission',
      pillLabel:
        model === 'fixed'
          ? 'Fixed'
          : model === 'performance'
            ? 'Performance'
            : model === 'hybrid'
              ? 'Hybrid'
              : 'Commission',
    };
  }

  return { model: 'unknown', primaryLabel: '—', secondaryLabel: 'Pay TBD', pillLabel: 'Pay' };
}

export function resolveCampaignPaySummary(campaign: {
  paySummary?: CampaignPaySummary | null;
  paymentModel?: CampaignPaymentModel | null;
  commissionRate?: string | number | null;
}): CampaignPaySummary {
  if (campaign.paySummary?.primaryLabel) return campaign.paySummary;
  return buildCampaignPaySummary(campaign.paymentModel, campaign.commissionRate);
}
