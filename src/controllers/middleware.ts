import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole, UserStatus } from '../domain/user';
import {
  RoleAccessDeniedException,
  DomainException,
  WatchlistLimitExceededException,
  WatchlistUpdateException,
  WatchlistNotFoundException,
  StockNotFoundException,
  InvalidOrderStateException,
  InsufficientFundsException
} from '../domain/exceptions';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key';

export interface AuthenticatedRequest extends Request {
  user?: {
    user_id?: string;
    userId?: string;
    email: string;
    role: UserRole;
  };
}

export const parseJwt = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Missing authentication token'
      }
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = {
      user_id: decoded.user_id || decoded.userId,
      userId: decoded.user_id || decoded.userId,
      email: decoded.email,
      role: decoded.role
    };
    next();
  } catch (error) {
    res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid authentication token'
      }
    });
  }
};

export const requireRole = (...roles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        error: {
          code: 'ROLE_ACCESS_DENIED',
          message: `This action requires one of the following roles: ${roles.join(', ')}`
        }
      });
      return;
    }

    next();
  };
};

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (error instanceof RoleAccessDeniedException) {
    res.status(403).json({
      error: {
        code: error.code,
        message: error.message
      }
    });
    return;
  }

  if (error instanceof WatchlistUpdateException) {
    res.status(422).json({
      error: {
        code: error.code,
        message: error.message
      }
    });
    return;
  }

  if (error instanceof WatchlistLimitExceededException) {
    res.status(400).json({
      error: {
        code: error.code,
        message: error.message
      }
    });
    return;
  }

  if (error instanceof WatchlistNotFoundException) {
    res.status(404).json({
      error: {
        code: error.code,
        message: error.message
      }
    });
    return;
  }

  if (error instanceof StockNotFoundException) {
    res.status(404).json({
      error: {
        code: error.code,
        message: error.message
      }
    });
    return;
  }

  if (error instanceof InvalidOrderStateException) {
    res.status(409).json({
      error: {
        code: error.code,
        message: error.message
      }
    });
    return;
  }

  if (error instanceof InsufficientFundsException) {
    res.status(400).json({
      error: {
        code: error.code,
        message: error.message
      }
    });
    return;
  }

  if (error instanceof DomainException) {
    res.status(500).json({
      error: {
        code: error.code,
        message: error.message
      }
    });
    return;
  }

  res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: error.message || 'An unexpected error occurred'
    }
  });
};
