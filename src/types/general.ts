import type { UserRole } from '../generated/prisma';

export type TloginRead = {
  id: string;
  email: string;
  username: string;
  fullName: string;
  passwordHash: string | null;
  avatarUrl: string | null;
  role: UserRole;
  isActive: boolean;
};

export type TloginRequest = Omit<TloginRead, 'passwordHash'>;
export type TUserRegisterWrite = TloginRead;
