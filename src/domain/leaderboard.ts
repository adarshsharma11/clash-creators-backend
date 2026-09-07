export type UnrankedLeaderboardRow = {
  creatorId: string;
  points: number;
  supportCount: number;
  firstSupportAt: Date | null;
  joinedAt: Date;
};

export type RankedLeaderboardRow = UnrankedLeaderboardRow & {
  rank: number;
};

export const rankLeaderboard = (rows: UnrankedLeaderboardRow[]): RankedLeaderboardRow[] => {
  const sorted = [...rows].sort((left, right) => {
    if (right.points !== left.points) {
      return right.points - left.points;
    }

    const leftSupport = left.firstSupportAt?.getTime() ?? Number.MAX_SAFE_INTEGER;
    const rightSupport = right.firstSupportAt?.getTime() ?? Number.MAX_SAFE_INTEGER;
    if (leftSupport !== rightSupport) {
      return leftSupport - rightSupport;
    }

    const joined = left.joinedAt.getTime() - right.joinedAt.getTime();
    if (joined !== 0) {
      return joined;
    }

    return left.creatorId.localeCompare(right.creatorId);
  });

  return sorted.map((row, index) => ({
    ...row,
    rank: index + 1,
  }));
};
