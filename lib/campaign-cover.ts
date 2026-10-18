import type { ImageSource } from 'expo-image';
import { nicheCoverSource } from '@/lib/niche-cover';
import { optimizeCloudinaryUrl, usableImageUrl } from '@/lib/cloudinary-url';

type CoverInput =
  | {
      brandLogoUrl?: string | null;
      requiredInfluencerNiche?: string | null;
      type?: string | null;
    }
  | null
  | undefined;

/**
 * The picture for a campaign card: the image the brand uploaded with the campaign, when there is one, otherwise the bundled
 * photo for the campaign's niche. Pass `width` for the size the card is drawn at so the CDN sends a small file.
 */
export function campaignCoverSource(campaign: CoverInput, width = 900): ImageSource | number {
  const url = usableImageUrl(campaign?.brandLogoUrl);
  if (url) return { uri: optimizeCloudinaryUrl(url, width) };
  return nicheCoverSource(campaign?.requiredInfluencerNiche || campaign?.type);
}

export function hasUploadedCover(campaign: CoverInput): boolean {
  return usableImageUrl(campaign?.brandLogoUrl) !== null;
}

/**
 * The picture for a UGC brief card: the cover the brand uploaded with the brief, otherwise the stock photo for its niche or
 * content type. Briefs arrive as loosely typed API objects, so every field is read defensively.
 */
export function ugcCoverSource(
  brief: Record<string, unknown> | null | undefined,
  width = 900
): ImageSource | number {
  const url = usableImageUrl(brief?.coverImageUrl);
  if (url) return { uri: optimizeCloudinaryUrl(url, width) };
  return nicheCoverSource(
    String(brief?.niche ?? brief?.category ?? brief?.contentType ?? '') || undefined
  );
}

export function hasUgcCover(brief: Record<string, unknown> | null | undefined): boolean {
  return usableImageUrl(brief?.coverImageUrl) !== null;
}
