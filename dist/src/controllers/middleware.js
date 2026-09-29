"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.requireRole = exports.parseJwt = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const exceptions_1 = require("../domain/exceptions");
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key';
const parseJwt = (req, res, next) => {
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
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        req.user = {
            user_id: decoded.user_id || decoded.userId,
            userId: decoded.user_id || decoded.userId,
            email: decoded.email,
            role: decoded.role
        };
        next();
    }
    catch (error) {
        res.status(401).json({
            error: {
                code: 'UNAUTHORIZED',
                message: 'Invalid authentication token'
            }
        });
    }
};
exports.parseJwt = parseJwt;
const requireRole = (...roles) => {
    return (req, res, next) => {
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
exports.requireRole = requireRole;
const errorHandler = (error, req, res, next) => {
    if (error instanceof exceptions_1.RoleAccessDeniedException) {
        res.status(403).json({
            error: {
                code: error.code,
                message: error.message
            }
        });
        return;
    }
    if (error instanceof exceptions_1.WatchlistUpdateException) {
        res.status(422).json({
            error: {
                code: error.code,
                message: error.message
            }
        });
        return;
    }
    if (error instanceof exceptions_1.WatchlistLimitExceededException) {
        res.status(400).json({
            error: {
                code: error.code,
                message: error.message
            }
        });
        return;
    }
    if (error instanceof exceptions_1.WatchlistNotFoundException) {
        res.status(404).json({
            error: {
                code: error.code,
                message: error.message
            }
        });
        return;
    }
    if (error instanceof exceptions_1.StockNotFoundException) {
        res.status(404).json({
            error: {
                code: error.code,
                message: error.message
            }
        });
        return;
    }
    if (error instanceof exceptions_1.InvalidOrderStateException) {
        res.status(409).json({
            error: {
                code: error.code,
                message: error.message
            }
        });
        return;
    }
    if (error instanceof exceptions_1.InsufficientFundsException) {
        res.status(400).json({
            error: {
                code: error.code,
                message: error.message
            }
        });
        return;
    }
    if (error instanceof exceptions_1.DomainException) {
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
exports.errorHandler = errorHandler;
//# sourceMappingURL=middleware.js.map