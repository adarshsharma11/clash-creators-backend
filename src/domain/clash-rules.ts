import { ClashStatus } from '../generated/prisma';

export const canAdminAddParticipant = (input: {
  clashStatus: ClashStatus;
  maxParticipants: number | null;
  participantCount: number;
}): { ok: true } | { ok: false; reason: string; code: 'CLASH_NOT_ACTIVE' | 'CLASH_FULL' } => {
  if (input.clashStatus !== ClashStatus.UPCOMING && input.clashStatus !== ClashStatus.LIVE) {
    return { ok: false, reason: 'This clash is not available for joining', code: 'CLASH_NOT_ACTIVE' };
  }
  if (input.maxParticipants !== null && input.participantCount >= input.maxParticipants) {
    return { ok: false, reason: 'This clash is full', code: 'CLASH_FULL' };
  }
  return { ok: true };
};

export const canJoinClash = (input: {
  clashStatus: ClashStatus;
  endsAt: Date;
  now: Date;
  maxParticipants: number | null;
  participantCount: number;
}): { ok: true } | { ok: false; reason: string; code: 'CLASH_NOT_ACTIVE' | 'CLASH_FULL' } => {
  if (input.clashStatus !== ClashStatus.UPCOMING) {
    return { ok: false, reason: 'This clash is not available for joining', code: 'CLASH_NOT_ACTIVE' };
  }
  if (input.endsAt.getTime() <= input.now.getTime()) {
    return { ok: false, reason: 'This clash is not available for joining', code: 'CLASH_NOT_ACTIVE' };
  }
  if (input.maxParticipants !== null && input.participantCount >= input.maxParticipants) {
    return { ok: false, reason: 'This clash is full', code: 'CLASH_FULL' };
  }
  return { ok: true };
};

export const canSupportClash = (input: {
  clashStatus: ClashStatus;
  startsAt: Date;
  endsAt: Date;
  now: Date;
}): { ok: true } | { ok: false; reason: string } => {
  if (input.clashStatus === ClashStatus.COMPLETED) {
    return { ok: false, reason: 'Completed clashes cannot accept support' };
  }
  if (input.clashStatus === ClashStatus.CANCELLED) {
    return { ok: false, reason: 'Cancelled clashes cannot accept support' };
  }
  if (input.clashStatus === ClashStatus.DRAFT) {
    return { ok: false, reason: 'Draft clashes cannot accept support' };
  }
  if (input.clashStatus !== ClashStatus.LIVE) {
    return { ok: false, reason: 'Support is only accepted while a clash is live' };
  }
  if (input.now.getTime() < input.startsAt.getTime() || input.now.getTime() > input.endsAt.getTime()) {
    return { ok: false, reason: 'Support is only accepted during the clash window' };
  }
  return { ok: true };
};

export const isValidClashTransition = (from: ClashStatus, to: ClashStatus): boolean => {
  if (from === to) {
    return true;
  }

  const allowed: Record<ClashStatus, ClashStatus[]> = {
    DRAFT: [ClashStatus.UPCOMING, ClashStatus.CANCELLED],
    UPCOMING: [ClashStatus.LIVE, ClashStatus.CANCELLED, ClashStatus.DRAFT],
    LIVE: [ClashStatus.CANCELLED],
    COMPLETED: [],
    CANCELLED: [ClashStatus.DRAFT, ClashStatus.UPCOMING],
  };

  return allowed[from].includes(to);
};

export const canCompleteClash = (status: ClashStatus): boolean => status === ClashStatus.LIVE;
