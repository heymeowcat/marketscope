"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderService = exports.AnalyticsService = exports.PortfolioService = exports.WatchlistService = exports.StockCatalogService = exports.UserAdminService = exports.AuthService = exports.OrderRepository = exports.HoldingRepository = exports.WatchlistSymbolRepository = exports.WatchlistRepository = exports.PriceHistoryRepository = exports.StockRepository = exports.AuditLogRepository = exports.UserRepository = void 0;
exports.createApp = createApp;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const user_repository_1 = require("./repositories/user-repository");
Object.defineProperty(exports, "UserRepository", { enumerable: true, get: function () { return user_repository_1.UserRepository; } });
const audit_log_repository_1 = require("./repositories/audit-log-repository");
Object.defineProperty(exports, "AuditLogRepository", { enumerable: true, get: function () { return audit_log_repository_1.AuditLogRepository; } });
const stock_repository_1 = require("./repositories/stock-repository");
Object.defineProperty(exports, "StockRepository", { enumerable: true, get: function () { return stock_repository_1.StockRepository; } });
const price_history_repository_1 = require("./repositories/price-history-repository");
Object.defineProperty(exports, "PriceHistoryRepository", { enumerable: true, get: function () { return price_history_repository_1.PriceHistoryRepository; } });
const watchlist_repository_1 = require("./repositories/watchlist-repository");
Object.defineProperty(exports, "WatchlistRepository", { enumerable: true, get: function () { return watchlist_repository_1.WatchlistRepository; } });
const watchlist_symbol_repository_1 = require("./repositories/watchlist-symbol-repository");
Object.defineProperty(exports, "WatchlistSymbolRepository", { enumerable: true, get: function () { return watchlist_symbol_repository_1.WatchlistSymbolRepository; } });
const holding_repository_1 = require("./repositories/holding-repository");
Object.defineProperty(exports, "HoldingRepository", { enumerable: true, get: function () { return holding_repository_1.HoldingRepository; } });
const order_repository_1 = require("./repositories/order-repository");
Object.defineProperty(exports, "OrderRepository", { enumerable: true, get: function () { return order_repository_1.OrderRepository; } });
const auth_service_1 = require("./services/auth-service");
Object.defineProperty(exports, "AuthService", { enumerable: true, get: function () { return auth_service_1.AuthService; } });
const user_admin_service_1 = require("./services/user-admin-service");
Object.defineProperty(exports, "UserAdminService", { enumerable: true, get: function () { return user_admin_service_1.UserAdminService; } });
const stock_catalog_service_1 = require("./services/stock-catalog-service");
Object.defineProperty(exports, "StockCatalogService", { enumerable: true, get: function () { return stock_catalog_service_1.StockCatalogService; } });
const watchlist_service_1 = require("./services/watchlist-service");
Object.defineProperty(exports, "WatchlistService", { enumerable: true, get: function () { return watchlist_service_1.WatchlistService; } });
const portfolio_service_1 = require("./services/portfolio-service");
Object.defineProperty(exports, "PortfolioService", { enumerable: true, get: function () { return portfolio_service_1.PortfolioService; } });
const analytics_service_1 = require("./services/analytics-service");
Object.defineProperty(exports, "AnalyticsService", { enumerable: true, get: function () { return analytics_service_1.AnalyticsService; } });
const order_service_1 = require("./services/order-service");
Object.defineProperty(exports, "OrderService", { enumerable: true, get: function () { return order_service_1.OrderService; } });
const auth_controller_1 = require("./controllers/auth-controller");
const user_admin_controller_1 = require("./controllers/user-admin-controller");
const stock_catalog_controller_1 = require("./controllers/stock-catalog-controller");
const stock_admin_controller_1 = require("./controllers/stock-admin-controller");
const watchlist_controller_1 = require("./controllers/watchlist-controller");
const portfolio_controller_1 = require("./controllers/portfolio-controller");
const analytics_controller_1 = require("./controllers/analytics-controller");
const order_controller_1 = require("./controllers/order-controller");
const middleware_1 = require("./controllers/middleware");
function createApp(deps) {
    const app = (0, express_1.default)();
    // Middleware
    app.use((0, cors_1.default)());
    app.use(express_1.default.json());
    // Initialize repositories
    const userRepository = deps?.userRepository || new user_repository_1.UserRepository();
    const auditLogRepository = deps?.auditLogRepository || new audit_log_repository_1.AuditLogRepository();
    const stockRepository = deps?.stockRepository || new stock_repository_1.StockRepository();
    const priceHistoryRepository = deps?.priceHistoryRepository || new price_history_repository_1.PriceHistoryRepository();
    const watchlistRepository = deps?.watchlistRepository || new watchlist_repository_1.WatchlistRepository();
    const watchlistSymbolRepository = deps?.watchlistSymbolRepository || new watchlist_symbol_repository_1.WatchlistSymbolRepository();
    const holdingRepository = deps?.holdingRepository || new holding_repository_1.HoldingRepository();
    const orderRepository = deps?.orderRepository || new order_repository_1.OrderRepository();
    // Initialize services
    const authService = new auth_service_1.AuthService({ userRepository });
    const userAdminService = new user_admin_service_1.UserAdminService({ userRepository, auditLogRepository });
    const stockCatalogService = new stock_catalog_service_1.StockCatalogService({ stockRepository, priceHistoryRepository });
    const watchlistService = new watchlist_service_1.WatchlistService({
        watchlistRepository,
        watchlistSymbolRepository,
        stockRepository
    });
    const portfolioService = new portfolio_service_1.PortfolioService({
        holdingRepository,
        stockRepository
    });
    const analyticsService = new analytics_service_1.AnalyticsService({
        holdingRepository,
        stockRepository
    });
    const orderService = new order_service_1.OrderService({
        orderRepository,
        userRepository,
        stockRepository,
        holdingRepository
    });
    // Initialize controllers
    const authController = new auth_controller_1.AuthController({ authService });
    const userAdminController = new user_admin_controller_1.UserAdminController({ userAdminService });
    const stockCatalogController = new stock_catalog_controller_1.StockCatalogController({ stockCatalogService });
    const stockAdminController = new stock_admin_controller_1.StockAdminController({ stockCatalogService });
    const watchlistController = new watchlist_controller_1.WatchlistController({ watchlistService });
    const portfolioController = new portfolio_controller_1.PortfolioController({ portfolioService, userRepository });
    const analyticsController = new analytics_controller_1.AnalyticsController({ analyticsService });
    const orderController = new order_controller_1.OrderController({ orderService });
    // Routes
    app.use('/api/v1/auth', authController.getRouter());
    app.use('/api/v1/admin', userAdminController.getRouter());
    app.use('/api/v1/stocks', stockCatalogController.getRouter());
    app.use('/api/v1/admin/stocks', stockAdminController.getRouter());
    app.use('/api/v1/watchlists', watchlistController.getRouter());
    app.use('/api/v1/portfolio', portfolioController.getRouter());
    app.use('/api/v1/analytics', analyticsController.getRouter());
    app.use('/api/v1/orders', orderController.getRouter());
    // Health check
    app.get('/api/health', (req, res) => {
        res.status(200).json({ status: 'ok' });
    });
    // Error handling
    app.use(middleware_1.errorHandler);
    return app;
}
//# sourceMappingURL=app.js.map