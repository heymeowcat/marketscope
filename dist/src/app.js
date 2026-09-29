"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserAdminService = exports.AuthService = exports.AuditLogRepository = exports.UserRepository = void 0;
exports.createApp = createApp;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const user_repository_1 = require("./repositories/user-repository");
Object.defineProperty(exports, "UserRepository", { enumerable: true, get: function () { return user_repository_1.UserRepository; } });
const audit_log_repository_1 = require("./repositories/audit-log-repository");
Object.defineProperty(exports, "AuditLogRepository", { enumerable: true, get: function () { return audit_log_repository_1.AuditLogRepository; } });
const auth_service_1 = require("./services/auth-service");
Object.defineProperty(exports, "AuthService", { enumerable: true, get: function () { return auth_service_1.AuthService; } });
const user_admin_service_1 = require("./services/user-admin-service");
Object.defineProperty(exports, "UserAdminService", { enumerable: true, get: function () { return user_admin_service_1.UserAdminService; } });
const auth_controller_1 = require("./controllers/auth-controller");
const user_admin_controller_1 = require("./controllers/user-admin-controller");
const middleware_1 = require("./controllers/middleware");
function createApp(deps) {
    const app = (0, express_1.default)();
    // Middleware
    app.use((0, cors_1.default)());
    app.use(express_1.default.json());
    // Initialize repositories
    const userRepository = deps?.userRepository || new user_repository_1.UserRepository();
    const auditLogRepository = deps?.auditLogRepository || new audit_log_repository_1.AuditLogRepository();
    // Initialize services
    const authService = new auth_service_1.AuthService({ userRepository });
    const userAdminService = new user_admin_service_1.UserAdminService({ userRepository, auditLogRepository });
    // Initialize controllers
    const authController = new auth_controller_1.AuthController({ authService });
    const userAdminController = new user_admin_controller_1.UserAdminController({ userAdminService });
    // Routes
    app.use('/api/v1/auth', authController.getRouter());
    app.use('/api/v1/admin', userAdminController.getRouter());
    // Health check
    app.get('/api/health', (req, res) => {
        res.status(200).json({ status: 'ok' });
    });
    // Error handling
    app.use(middleware_1.errorHandler);
    return app;
}
//# sourceMappingURL=app.js.map