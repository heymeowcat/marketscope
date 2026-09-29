import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import Decimal from 'decimal.js';
import { createApp } from '../../src/app';
import { StockRepository } from '../../src/repositories/stock-repository';
import { PriceHistoryRepository } from '../../src/repositories/price-history-repository';
import { UserRepository } from '../../src/repositories/user-repository';
import { AuditLogRepository } from '../../src/repositories/audit-log-repository';
import { UserRole, UserStatus } from '../../src/domain/user';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

// [AC-03-D] Test suite for customer stock search endpoint
describe('Stock Search Endpoints', () => {
  let app: any;
  let stockRepository: StockRepository;
  let priceHistoryRepository: PriceHistoryRepository;
  let userRepository: UserRepository;
  let auditLogRepository: AuditLogRepository;
  let adminToken: string;
  let customerToken: string;
  let adminUserId: string;
  let customerUserId: string;

  beforeEach(async () => {
    stockRepository = new StockRepository();
    priceHistoryRepository = new PriceHistoryRepository();
    userRepository = new UserRepository();
    auditLogRepository = new AuditLogRepository();

    await stockRepository.clear();
    await priceHistoryRepository.clear();
    await userRepository.clear();
    await auditLogRepository.clear();

    app = createApp({
      stockRepository,
      priceHistoryRepository,
      userRepository,
      auditLogRepository
    });

    // Create admin user
    adminUserId = uuidv4();
    await userRepository.create({
      id: adminUserId,
      email: 'admin@example.com',
      passwordHash: 'hash',
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      cashBalance: new Decimal('100000.00'),
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Create customer user
    customerUserId = uuidv4();
    await userRepository.create({
      id: customerUserId,
      email: 'customer@example.com',
      passwordHash: 'hash',
      role: UserRole.CUSTOMER,
      status: UserStatus.ACTIVE,
      cashBalance: new Decimal('50000.00'),
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Generate tokens using the same secret as middleware
    const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key';
    adminToken = jwt.sign(
      { userId: adminUserId, role: UserRole.ADMIN },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    customerToken = jwt.sign(
      { userId: customerUserId, role: UserRole.CUSTOMER },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Create test stocks
    await request(app)
      .post('/api/v1/admin/stocks')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        symbol: 'NVDA',
        company_name: 'NVIDIA Corporation',
        sector: 'Technology',
        exchange: 'NASDAQ',
        initial_price: '125.50'
      });

    await request(app)
      .post('/api/v1/admin/stocks')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        symbol: 'TSLA',
        company_name: 'Tesla Inc',
        sector: 'Consumer',
        exchange: 'NASDAQ',
        initial_price: '245.00'
      });

    await request(app)
      .post('/api/v1/admin/stocks')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        symbol: 'F',
        company_name: 'Ford Motor',
        sector: 'Consumer',
        exchange: 'NYSE',
        initial_price: '10.00'
      });
  });

  describe('GET /api/v1/stocks', () => {
    // [AC-03-D] Customer catalog search & browse
    it('[AC-03-D] should return all active stocks', async () => {
      const response = await request(app).get('/api/v1/stocks');

      expect(response.status).toBe(200);
      expect(response.body.stocks).toHaveLength(3);
      expect(response.body.count).toBe(3);
    });

    // [AC-03-D] Search by sector
    it('[AC-03-D] should filter by sector', async () => {
      const response = await request(app)
        .get('/api/v1/stocks')
        .query({ sector: 'Technology' });

      expect(response.status).toBe(200);
      expect(response.body.stocks).toHaveLength(1);
      expect(response.body.stocks[0].symbol).toBe('NVDA');
    });

    // [AC-03-D] Search by exchange
    it('[AC-03-D] should filter by exchange', async () => {
      const response = await request(app)
        .get('/api/v1/stocks')
        .query({ exchange: 'NYSE' });

      expect(response.status).toBe(200);
      expect(response.body.stocks).toHaveLength(1);
      expect(response.body.stocks[0].symbol).toBe('F');
    });

    // [AC-03-D] Search by symbol/name
    it('[AC-03-D] should search by symbol', async () => {
      const response = await request(app)
        .get('/api/v1/stocks')
        .query({ search: 'NVDA' });

      expect(response.status).toBe(200);
      expect(response.body.stocks).toHaveLength(1);
      expect(response.body.stocks[0].symbol).toBe('NVDA');
    });

    // [AC-03-D] Search by company name
    it('[AC-03-D] should search by company name', async () => {
      const response = await request(app)
        .get('/api/v1/stocks')
        .query({ search: 'NVIDIA' });

      expect(response.status).toBe(200);
      expect(response.body.stocks).toHaveLength(1);
      expect(response.body.stocks[0].symbol).toBe('NVDA');
    });

    // [AC-03-D] Combined filters
    it('[AC-03-D] should apply multiple filters', async () => {
      const response = await request(app)
        .get('/api/v1/stocks')
        .query({ sector: 'Consumer', exchange: 'NASDAQ' });

      expect(response.status).toBe(200);
      expect(response.body.stocks).toHaveLength(1);
      expect(response.body.stocks[0].symbol).toBe('TSLA');
    });

    // [AC-03-D] Exclude delisted stocks
    it('[AC-03-D] should exclude DELISTED stocks', async () => {
      // Soft-delete NVDA
      await request(app)
        .delete('/api/v1/admin/stocks/NVDA')
        .set('Authorization', `Bearer ${adminToken}`);

      const response = await request(app).get('/api/v1/stocks');

      expect(response.status).toBe(200);
      expect(response.body.stocks).toHaveLength(2);
      expect(response.body.stocks.find((s: any) => s.symbol === 'NVDA')).toBeUndefined();
    });

    // [AC-03-D] Pagination
    it('[AC-03-D] should support pagination', async () => {
      const response = await request(app)
        .get('/api/v1/stocks')
        .query({ limit: 2, offset: 0 });

      expect(response.status).toBe(200);
      expect(response.body.stocks.length).toBeLessThanOrEqual(2);
      expect(response.body.limit).toBe(2);
      expect(response.body.offset).toBe(0);
    });

    // [AC-03-D] Include current price
    it('[AC-03-D] should include current price in response', async () => {
      const response = await request(app).get('/api/v1/stocks');

      expect(response.status).toBe(200);
      expect(response.body.stocks[0].current_price).toBeDefined();
      expect(response.body.stocks[0].current_price).toBe('125.50');
    });
  });

  describe('GET /api/v1/stocks/:symbol', () => {
    // [AC-03-D] Get single stock
    it('[AC-03-D] should return stock by symbol', async () => {
      const response = await request(app).get('/api/v1/stocks/NVDA');

      expect(response.status).toBe(200);
      expect(response.body.stock).toBeDefined();
      expect(response.body.stock.symbol).toBe('NVDA');
      expect(response.body.stock.company_name).toBe('NVIDIA Corporation');
      expect(response.body.stock.current_price).toBe('125.50');
    });

    // [AC-03-D] Delisted stock not found
    it('[AC-03-D] should return 404 for delisted stock', async () => {
      // Soft-delete stock
      await request(app)
        .delete('/api/v1/admin/stocks/NVDA')
        .set('Authorization', `Bearer ${adminToken}`);

      const response = await request(app).get('/api/v1/stocks/NVDA');

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('STOCK_NOT_FOUND');
    });

    // [AC-03-D] Not found
    it('[AC-03-D] should return 404 for non-existent stock', async () => {
      const response = await request(app).get('/api/v1/stocks/INVALID');

      expect(response.status).toBe(404);
    });

    // [AC-03-D] No auth required for customers
    it('[AC-03-D] should allow anonymous access', async () => {
      const response = await request(app).get('/api/v1/stocks/NVDA');

      expect(response.status).toBe(200);
      expect(response.body.stock.symbol).toBe('NVDA');
    });

    // [AC-03-D] Customer can access
    it('[AC-03-D] should allow customer access', async () => {
      const response = await request(app)
        .get('/api/v1/stocks/NVDA')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.stock.symbol).toBe('NVDA');
    });
  });
});
