import { SocialPlatform } from '../generated/prisma';

export const JOIN_PLATFORMS = ['INSTAGRAM', 'YOUTUBE', 'TIKTOK', 'X', 'FACEBOOK', 'TWITCH'] as const;

export type JoinPlatform = (typeof JOIN_PLATFORMS)[number];

export const normalizeJoinUsername = (value: string): string => value.trim().replace(/^@+/, '').trim();

export const isJoinPlatform = (value: string): value is JoinPlatform =>
  (JOIN_PLATFORMS as readonly string[]).includes(value);

export const socialProfileUrl = (platform: JoinPlatform, username: string): string => {
  switch (platform) {
    case 'INSTAGRAM':
      return `https://instagram.com/${username}`;
    case 'YOUTUBE':
      return `https://youtube.com/@${username}`;
    case 'TIKTOK':
      return `https://tiktok.com/@${username}`;
    case 'X':
      return `https://x.com/${username}`;
    case 'FACEBOOK':
      return `https://facebook.com/${username}`;
    case 'TWITCH':
      return `https://twitch.tv/${username}`;
    default: {
      const _exhaustive: never = platform;
      return _exhaustive;
    }
  }
};

export const toSocialPlatform = (platform: JoinPlatform): SocialPlatform => platform;
