import jwt, { SignOptions, JwtPayload, Secret } from 'jsonwebtoken';
import { env } from '../config/env';

export type TTokenType = 'user' | 'admin';

export type TPayload = {
  id: string;
  typ?: TTokenType;
};

const sign = (payload: TPayload, secret: Secret, expiresIn: SignOptions['expiresIn']): string => {
  return jwt.sign(payload, secret, { expiresIn } as SignOptions);
};

export const generateToken = (payload: TPayload, expiresIn: string = env.jwtExpiresIn): string => {
  const secret = payload.typ === 'admin' ? env.adminJwtSecret : env.jwtSecret;
  return sign(payload, secret, expiresIn as SignOptions['expiresIn']);
};

export const verifyUserToken = (token: string): TPayload => {
  const decoded = jwt.verify(token, env.jwtSecret) as JwtPayload & TPayload;
  if (decoded.typ === 'admin') {
    throw new jwt.JsonWebTokenError('Admin token cannot access user APIs');
  }
  return { id: decoded.id, typ: decoded.typ ?? 'user' };
};

export const verifyAdminToken = (token: string): TPayload => {
  const decoded = jwt.verify(token, env.adminJwtSecret) as JwtPayload & TPayload;
  if (decoded.typ !== 'admin') {
    throw new jwt.JsonWebTokenError('User token cannot access admin APIs');
  }
  return { id: decoded.id, typ: 'admin' };
};

/** @deprecated Use verifyUserToken or verifyAdminToken */
export const verifyToken = (token: string): TPayload => {
  try {
    return verifyAdminToken(token);
  } catch {
    return verifyUserToken(token);
  }
};
