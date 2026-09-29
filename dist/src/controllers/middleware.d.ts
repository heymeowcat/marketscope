import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../domain/user';
export interface AuthenticatedRequest extends Request {
    user?: {
        user_id?: string;
        userId?: string;
        email: string;
        role: UserRole;
    };
}
export declare const parseJwt: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
export declare const requireRole: (...roles: UserRole[]) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
export declare const errorHandler: (error: Error, req: Request, res: Response, next: NextFunction) => void;
