import { TloginRequest } from './general';
import { TAdminRequest } from './admin';

declare global {
  namespace Express {
    interface Request {
      user?: TloginRequest;
      admin?: TAdminRequest;
      requestId?: string;
    }
  }
}
