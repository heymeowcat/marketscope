"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserAdminController = void 0;
const express_1 = require("express");
const user_1 = require("../domain/user");
const exceptions_1 = require("../domain/exceptions");
const middleware_1 = require("./middleware");
class UserAdminController {
    router;
    userAdminService;
    constructor(deps) {
        this.userAdminService = deps.userAdminService;
        this.router = (0, express_1.Router)();
        this.setupRoutes();
    }
    setupRoutes() {
        this.router.get('/users', middleware_1.parseJwt, (0, middleware_1.requireRole)(user_1.UserRole.ADMIN), this.listUsers.bind(this));
        this.router.patch('/users/:id/role', middleware_1.parseJwt, (0, middleware_1.requireRole)(user_1.UserRole.ADMIN), this.updateUserRole.bind(this));
        this.router.get('/audit-logs', middleware_1.parseJwt, (0, middleware_1.requireRole)(user_1.UserRole.ADMIN), this.getAuditLogs.bind(this));
    }
    async listUsers(req, res) {
        try {
            const limit = req.query.limit ? parseInt(req.query.limit, 10) : 100;
            const offset = req.query.offset ? parseInt(req.query.offset, 10) : 0;
            // In a real implementation, this would call userRepository
            // For now, we return empty list
            res.status(200).json({
                users: [],
                limit,
                offset
            });
        }
        catch (error) {
            res.status(500).json({
                error: {
                    code: 'INTERNAL_SERVER_ERROR',
                    message: error.message || 'An unexpected error occurred'
                }
            });
        }
    }
    async updateUserRole(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({
                    error: {
                        code: 'UNAUTHORIZED',
                        message: 'User not authenticated'
                    }
                });
                return;
            }
            const { id } = req.params;
            const { role, reason } = req.body;
            if (!id || !role) {
                res.status(400).json({
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'User ID and role are required'
                    }
                });
                return;
            }
            // Validate role value
            if (!Object.values(user_1.UserRole).includes(role)) {
                res.status(400).json({
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: `Invalid role. Must be one of: ${Object.values(user_1.UserRole).join(', ')}`
                    }
                });
                return;
            }
            const updatedUser = await this.userAdminService.updateUserRole(id, req.user.userId, {
                role,
                reason
            });
            res.status(200).json({
                user: {
                    id: updatedUser.id,
                    email: updatedUser.email,
                    role: updatedUser.role,
                    status: updatedUser.status,
                    cashBalance: updatedUser.cashBalance.toString()
                }
            });
        }
        catch (error) {
            if (error instanceof exceptions_1.UserNotFoundException) {
                res.status(404).json({
                    error: {
                        code: error.code,
                        message: error.message
                    }
                });
                return;
            }
            if (error instanceof exceptions_1.InvalidUserStateException) {
                res.status(400).json({
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
        }
    }
    async getAuditLogs(req, res) {
        try {
            const limit = req.query.limit ? parseInt(req.query.limit, 10) : 100;
            const offset = req.query.offset ? parseInt(req.query.offset, 10) : 0;
            const logs = await this.userAdminService.getAuditLogs(limit, offset);
            res.status(200).json({
                auditLogs: logs,
                limit,
                offset
            });
        }
        catch (error) {
            res.status(500).json({
                error: {
                    code: 'INTERNAL_SERVER_ERROR',
                    message: error.message || 'An unexpected error occurred'
                }
            });
        }
    }
    getRouter() {
        return this.router;
    }
}
exports.UserAdminController = UserAdminController;
//# sourceMappingURL=user-admin-controller.js.map