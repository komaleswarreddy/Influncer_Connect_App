/** Human-friendly campaign title — underscores become spaces so long slugs wrap naturally. */
export function formatCampaignDisplayName(name: string | null | undefined): string {
  const raw = String(name ?? '').trim();
  if (!raw) return 'Untitled Campaign';
  return raw.replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
}
