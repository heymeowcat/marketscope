"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const express_1 = require("express");
const exceptions_1 = require("../domain/exceptions");
const middleware_1 = require("./middleware");
class AuthController {
    router;
    authService;
    constructor(deps) {
        this.authService = deps.authService;
        this.router = (0, express_1.Router)();
        this.setupRoutes();
    }
    setupRoutes() {
        this.router.post('/register', this.register.bind(this));
        this.router.post('/login', this.login.bind(this));
        this.router.get('/me', middleware_1.parseJwt, this.getCurrentUser.bind(this));
    }
    async register(req, res) {
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                res.status(400).json({
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Email and password are required'
                    }
                });
                return;
            }
            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                res.status(400).json({
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Invalid email format'
                    }
                });
                return;
            }
            const result = await this.authService.register({ email, password });
            res.status(201).json(result);
        }
        catch (error) {
            if (error instanceof exceptions_1.DuplicateEmailException) {
                res.status(409).json({
                    error: {
                        code: error.code,
                        message: error.message
                    }
                });
                return;
            }
            if (error instanceof exceptions_1.InvalidPasswordException) {
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
    async login(req, res) {
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                res.status(400).json({
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Email and password are required'
                    }
                });
                return;
            }
            const result = await this.authService.login({ email, password });
            res.status(200).json(result);
        }
        catch (error) {
            if (error instanceof exceptions_1.InvalidPasswordException) {
                res.status(401).json({
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
    getCurrentUser(req, res) {
        if (!req.user) {
            res.status(401).json({
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'User not authenticated'
                }
            });
            return;
        }
        res.status(200).json({
            user: req.user
        });
    }
    getRouter() {
        return this.router;
    }
}
exports.AuthController = AuthController;
//# sourceMappingURL=auth-controller.js.map