import express, { Express } from 'express';
import cors from 'cors';
import { UserRepository, IUserRepository } from './repositories/user-repository';
import { AuditLogRepository, IAuditLogRepository } from './repositories/audit-log-repository';
import { StockRepository, IStockRepository } from './repositories/stock-repository';
import { PriceHistoryRepository, IPriceHistoryRepository } from './repositories/price-history-repository';
import { WatchlistRepository, IWatchlistRepository } from './repositories/watchlist-repository';
import { WatchlistSymbolRepository, IWatchlistSymbolRepository } from './repositories/watchlist-symbol-repository';
import { HoldingRepository, IHoldingRepository } from './repositories/holding-repository';
import { OrderRepository, IOrderRepository } from './repositories/order-repository';
import { AuthService } from './services/auth-service';
import { UserAdminService } from './services/user-admin-service';
import { StockCatalogService } from './services/stock-catalog-service';
import { WatchlistService } from './services/watchlist-service';
import { PortfolioService } from './services/portfolio-service';
import { AnalyticsService } from './services/analytics-service';
import { OrderService } from './services/order-service';
import { AuthController } from './controllers/auth-controller';
import { UserAdminController } from './controllers/user-admin-controller';
import { StockCatalogController } from './controllers/stock-catalog-controller';
import { StockAdminController } from './controllers/stock-admin-controller';
import { WatchlistController } from './controllers/watchlist-controller';
import { PortfolioController } from './controllers/portfolio-controller';
import { AnalyticsController } from './controllers/analytics-controller';
import { OrderController } from './controllers/order-controller';
import { errorHandler } from './controllers/middleware';

export interface AppDeps {
  userRepository?: IUserRepository;
  auditLogRepository?: IAuditLogRepository;
  stockRepository?: IStockRepository;
  priceHistoryRepository?: IPriceHistoryRepository;
  watchlistRepository?: IWatchlistRepository;
  watchlistSymbolRepository?: IWatchlistSymbolRepository;
  holdingRepository?: IHoldingRepository;
  orderRepository?: IOrderRepository;
}

export function createApp(deps?: AppDeps): Express {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());

  // Initialize repositories
  const userRepository = deps?.userRepository || new UserRepository();
  const auditLogRepository = deps?.auditLogRepository || new AuditLogRepository();
  const stockRepository = deps?.stockRepository || new StockRepository();
  const priceHistoryRepository = deps?.priceHistoryRepository || new PriceHistoryRepository();
  const watchlistRepository = deps?.watchlistRepository || new WatchlistRepository();
  const watchlistSymbolRepository = deps?.watchlistSymbolRepository || new WatchlistSymbolRepository();
  const holdingRepository = deps?.holdingRepository || new HoldingRepository();
  const orderRepository = deps?.orderRepository || new OrderRepository();

  // Initialize services
  const authService = new AuthService({ userRepository });
  const userAdminService = new UserAdminService({ userRepository, auditLogRepository });
  const stockCatalogService = new StockCatalogService({ stockRepository, priceHistoryRepository });
  const watchlistService = new WatchlistService({
    watchlistRepository,
    watchlistSymbolRepository,
    stockRepository
  });
  const portfolioService = new PortfolioService({
    holdingRepository,
    stockRepository
  });
  const analyticsService = new AnalyticsService({
    holdingRepository,
    stockRepository
  });
  const orderService = new OrderService({
    orderRepository,
    userRepository,
    stockRepository,
    holdingRepository
  });

  // Initialize controllers
  const authController = new AuthController({ authService });
  const userAdminController = new UserAdminController({ userAdminService });
  const stockCatalogController = new StockCatalogController({ stockCatalogService });
  const stockAdminController = new StockAdminController({ stockCatalogService });
  const watchlistController = new WatchlistController({ watchlistService });
  const portfolioController = new PortfolioController({ portfolioService, userRepository });
  const analyticsController = new AnalyticsController({ analyticsService });
  const orderController = new OrderController({ orderService });

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
  app.use(errorHandler);

  return app;
}

export {
  UserRepository,
  AuditLogRepository,
  StockRepository,
  PriceHistoryRepository,
  WatchlistRepository,
  WatchlistSymbolRepository,
  HoldingRepository,
  OrderRepository,
  AuthService,
  UserAdminService,
  StockCatalogService,
  WatchlistService,
  PortfolioService,
  AnalyticsService,
  OrderService
};
