import { Express } from 'express';
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
export declare function createApp(deps?: AppDeps): Express;
export { UserRepository, AuditLogRepository, StockRepository, PriceHistoryRepository, WatchlistRepository, WatchlistSymbolRepository, HoldingRepository, OrderRepository, AuthService, UserAdminService, StockCatalogService, WatchlistService, PortfolioService, AnalyticsService, OrderService };
