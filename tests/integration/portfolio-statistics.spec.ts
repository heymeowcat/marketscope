import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import Decimal from 'decimal.js';
import { createApp } from '../../src/app';
import { UserRepository } from '../../src/repositories/user-repository';
import { StockRepository } from '../../src/repositories/stock-repository';
import { HoldingRepository } from '../../src/repositories/holding-repository';
import { PriceHistoryRepository } from '../../src/repositories/price-history-repository';
import { UserRole, UserStatus } from '../../src/domain/user';
import { StockStatus } from '../../src/domain/stock';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

// [AC-09] Test suite for portfolio statistics endpoints
describe('Portfolio Statistics Endpoints', () => {
  let app: any;
  let userRepository: UserRepository;
  let stockRepository: StockRepository;
  let holdingRepository: HoldingRepository;
  let priceHistoryRepository: PriceHistoryRepository;
  let customerToken: string;
  let customerId: string;

  beforeEach(async () => {
    userRepository = new UserRepository();
    stockRepository = new StockRepository();
    holdingRepository = new HoldingRepository();
    priceHistoryRepository = new PriceHistoryRepository();

    await userRepository.clear();
    await stockRepository.clear();
    await holdingRepository.clear();
    await priceHistoryRepository.clear();

    app = createApp({
      userRepository,
      stockRepository,
      holdingRepository,
      priceHistoryRepository
    });

    // Create customer
    customerId = uuidv4();
    await userRepository.create({
      id: customerId,
      email: 'customer@example.com',
      passwordHash: 'hash',
      role: UserRole.CUSTOMER,
      status: UserStatus.ACTIVE,
      cashBalance: new Decimal('50000.00'),
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key';
    customerToken = jwt.sign(
      { userId: customerId, role: UserRole.CUSTOMER },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Create stocks
    await stockRepository.create({
      symbol: 'AAPL',
      company_name: 'Apple Inc',
      sector: 'Technology',
      exchange: 'NASDAQ',
      status: StockStatus.ACTIVE,
      current_price: new Decimal('180.00'),
      created_at: new Date(),
      delisted_at: null
    });

    await stockRepository.create({
      symbol: 'MSFT',
      company_name: 'Microsoft Corporation',
      sector: 'Technology',
      exchange: 'NASDAQ',
      status: StockStatus.ACTIVE,
      current_price: new Decimal('360.00'),
      created_at: new Date(),
      delisted_at: null
    });
  });

  describe('GET /api/v1/portfolio/stats', () => {
    // [AC-09-A] Portfolio with multiple profitable holdings
    it('[AC-09-A] should return portfolio stats with 200 status', async () => {
      // Seed holdings
      await holdingRepository.create({
        id: uuidv4(),
        customer_id: customerId,
        symbol: 'AAPL',
        quantity: 10,
        avg_buy_price: new Decimal('150.00'),
        created_at: new Date()
      });

      await holdingRepository.create({
        id: uuidv4(),
        customer_id: customerId,
        symbol: 'MSFT',
        quantity: 5,
        avg_buy_price: new Decimal('300.00'),
        created_at: new Date()
      });

      const response = await request(app)
        .get('/api/v1/portfolio/stats')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.customer_id).toBe(customerId);
      expect(response.body.total_invested).toBe('3000.00');
      expect(response.body.current_value).toBe('3600.00');
      expect(response.body.absolute_pnl).toBe('600.00');
      expect(response.body.percent_pnl).toBe('20.00');
      expect(response.body.currency).toBe('USD');
    });

    // [AC-09-B] Portfolio with zero holdings
    it('[AC-09-B] should return zero values for empty portfolio', async () => {
      const response = await request(app)
        .get('/api/v1/portfolio/stats')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.total_invested).toBe('0.00');
      expect(response.body.current_value).toBe('0.00');
      expect(response.body.absolute_pnl).toBe('0.00');
      expect(response.body.percent_pnl).toBe('0.00');
    });

    // [AC-09-B] No division by zero error
    it('[AC-09-B] should not throw division by zero error', async () => {
      const response = await request(app)
        .get('/api/v1/portfolio/stats')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.percent_pnl).toBe('0.00');
    });

    // [NFR-01] All values are strings with 2 decimal places
    it('[NFR-01] should return all financial values as strings with 2 decimal places', async () => {
      await holdingRepository.create({
        id: uuidv4(),
        customer_id: customerId,
        symbol: 'AAPL',
        quantity: 10,
        avg_buy_price: new Decimal('150.00'),
        created_at: new Date()
      });

      const response = await request(app)
        .get('/api/v1/portfolio/stats')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(typeof response.body.total_invested).toBe('string');
      expect(typeof response.body.current_value).toBe('string');
      expect(typeof response.body.absolute_pnl).toBe('string');
      expect(typeof response.body.percent_pnl).toBe('string');
      expect(response.body.total_invested).toMatch(/^\d+\.\d{2}$/);
      expect(response.body.current_value).toMatch(/^\d+\.\d{2}$/);
      expect(response.body.absolute_pnl).toMatch(/^-?\d+\.\d{2}$/);
      expect(response.body.percent_pnl).toMatch(/^-?\d+\.\d{2}$/);
    });

    // [AC-09] Negative P&L scenario
    it('[AC-09] should calculate negative P&L correctly', async () => {
      await holdingRepository.create({
        id: uuidv4(),
        customer_id: customerId,
        symbol: 'AAPL',
        quantity: 10,
        avg_buy_price: new Decimal('200.00'),
        created_at: new Date()
      });

      const response = await request(app)
        .get('/api/v1/portfolio/stats')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.total_invested).toBe('2000.00');
      expect(response.body.current_value).toBe('1800.00');
      expect(response.body.absolute_pnl).toBe('-200.00');
      expect(response.body.percent_pnl).toBe('-10.00');
    });

    // [AC-09] Unauthorized access
    it('[AC-09] should reject without authorization', async () => {
      const response = await request(app)
        .get('/api/v1/portfolio/stats');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/v1/portfolio/holdings', () => {
    // [AC-09-C] Detailed holdings breakdown
    it('[AC-09-C] should return list of holdings with individual P&L', async () => {
      await holdingRepository.create({
        id: uuidv4(),
        customer_id: customerId,
        symbol: 'AAPL',
        quantity: 10,
        avg_buy_price: new Decimal('150.00'),
        created_at: new Date()
      });

      const response = await request(app)
        .get('/api/v1/portfolio/holdings')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.holdings)).toBe(true);
      expect(response.body.holdings.length).toBe(1);

      const holding = response.body.holdings[0];
      expect(holding.symbol).toBe('AAPL');
      expect(holding.company_name).toBe('Apple Inc');
      expect(holding.quantity).toBe(10);
      expect(holding.avg_buy_price).toBe('150.00');
      expect(holding.current_price).toBe('180.00');
      expect(holding.current_value).toBe('1800.00');
      expect(holding.unrealized_pnl).toBe('300.00');
      expect(holding.unrealized_pnl_percent).toBe('20.00');
    });

    // [AC-09-C] Empty holdings list
    it('[AC-09-C] should return empty list for customer with no holdings', async () => {
      const response = await request(app)
        .get('/api/v1/portfolio/holdings')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.holdings).toEqual([]);
    });

    // [AC-09-C] Multiple holdings
    it('[AC-09-C] should return all holdings for customer', async () => {
      await holdingRepository.create({
        id: uuidv4(),
        customer_id: customerId,
        symbol: 'AAPL',
        quantity: 10,
        avg_buy_price: new Decimal('150.00'),
        created_at: new Date()
      });

      await holdingRepository.create({
        id: uuidv4(),
        customer_id: customerId,
        symbol: 'MSFT',
        quantity: 5,
        avg_buy_price: new Decimal('300.00'),
        created_at: new Date()
      });

      const response = await request(app)
        .get('/api/v1/portfolio/holdings')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.holdings.length).toBe(2);
    });
  });

  describe('GET /api/v1/portfolio/summary', () => {
    // [AC-09] Combined summary endpoint
    it('[AC-09] should return combined portfolio summary', async () => {
      await holdingRepository.create({
        id: uuidv4(),
        customer_id: customerId,
        symbol: 'AAPL',
        quantity: 10,
        avg_buy_price: new Decimal('150.00'),
        created_at: new Date()
      });

      const response = await request(app)
        .get('/api/v1/portfolio/summary')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.cash_balance).toBe('50000.00');
      expect(response.body.stats).toBeDefined();
      expect(response.body.holdings).toBeDefined();
      expect(Array.isArray(response.body.holdings)).toBe(true);
    });
  });
});
