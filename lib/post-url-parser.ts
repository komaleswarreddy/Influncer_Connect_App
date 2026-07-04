export type SupportedPlatform = 'youtube' | 'instagram' | 'tiktok' | 'twitter' | 'unknown';

export interface ParsedUrl {
  platform: SupportedPlatform;
  isValid: boolean;
  contentType?: string;
  error?: string;
}

export function parsePostUrl(url: string): ParsedUrl {
  try {
    const trimmed = url.trim();
    if (!trimmed) return { platform: 'unknown', isValid: false, error: 'Empty URL' };

    if (/youtube\.com\/watch|youtu\.be\/|youtube\.com\/shorts/i.test(trimmed)) {
      return { platform: 'youtube', isValid: true, contentType: 'video' };
    }
    if (/instagram\.com\/(p|reel)\//i.test(trimmed)) {
      const type = /\/reel\//i.test(trimmed) ? 'reel' : 'post';
      return { platform: 'instagram', isValid: true, contentType: type };
    }
    if (/tiktok\.com\/@.+\/video\/|vm\.tiktok\.com/i.test(trimmed)) {
      return { platform: 'tiktok', isValid: true, contentType: 'video' };
    }
    if (/(twitter|x)\.com\/.+\/status\//i.test(trimmed)) {
      return { platform: 'twitter', isValid: true, contentType: 'tweet' };
    }

    return {
      platform: 'unknown',
      isValid: false,
      error: 'Unsupported platform. Use YouTube, Instagram, TikTok, or Twitter/X',
    };
  } catch {
    return { platform: 'unknown', isValid: false, error: 'Invalid URL format' };
  }
}

export function getPlatformColor(platform: SupportedPlatform): string {
  switch (platform) {
    case 'youtube':
      return '#FF0000';
    case 'instagram':
      return '#E1306C';
    case 'tiktok':
      return '#000000';
    case 'twitter':
      return '#1DA1F2';
    default:
      return '#6B7280';
  }
}

export function getPlatformLabel(platform: SupportedPlatform): string {
  switch (platform) {
    case 'youtube':
      return 'YouTube';
    case 'instagram':
      return 'Instagram';
    case 'tiktok':
      return 'TikTok';
    case 'twitter':
      return 'Twitter/X';
    default:
      return 'Unknown';
  }
}
