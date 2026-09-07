import { Request, Response, NextFunction } from 'express';

export const securityHeaders = (_request: Request, response: Response, next: NextFunction) => {
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('X-Frame-Options', 'DENY');
  response.setHeader('Referrer-Policy', 'no-referrer');
  response.setHeader('X-DNS-Prefetch-Control', 'off');
  response.setHeader('X-Download-Options', 'noopen');
  response.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  response.setHeader('Cross-Origin-Resource-Policy', 'same-site');
  response.removeHeader('X-Powered-By');
  next();
};
