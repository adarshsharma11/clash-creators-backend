export const publicUserSelect = {
  username: true,
  fullName: true,
  avatarUrl: true,
} as const;

export const publicSocialSelect = {
  platform: true,
  username: true,
  isPrimary: true,
} as const;

export const publicCreatorSelect = {
  id: true,
  displayName: true,
  avatarUrl: true,
  status: true,
  user: { select: publicUserSelect },
  socialAccounts: {
    select: publicSocialSelect,
    orderBy: { isPrimary: 'desc' as const },
  },
} as const;

type PublicCreatorShape = {
  displayName: string;
  user?: { username?: string | null } | null;
  socialAccounts?: { username?: string | null; isPrimary?: boolean }[];
};

export const publicUsername = (creator: PublicCreatorShape): string | null =>
  creator.user?.username?.trim() ||
  creator.socialAccounts?.find((account) => account.isPrimary)?.username?.trim() ||
  creator.socialAccounts?.[0]?.username?.trim() ||
  creator.displayName?.trim() ||
  null;

export const withPublicUsername = <T extends PublicCreatorShape>(creator: T) => ({
  ...creator,
  username: publicUsername(creator),
});
