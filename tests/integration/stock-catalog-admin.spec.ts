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

// [AC-03] Test suite for admin stock catalog endpoints
describe('Stock Catalog Admin Endpoints', () => {
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
  });

  describe('POST /api/v1/admin/stocks', () => {
    // [AC-03-A] Admin creates stock symbol
    it('[AC-03-A] should create stock with 201 status', async () => {
      const response = await request(app)
        .post('/api/v1/admin/stocks')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          symbol: 'NVDA',
          company_name: 'NVIDIA Corporation',
          sector: 'Technology',
          exchange: 'NASDAQ',
          initial_price: '125.50'
        });

      expect(response.status).toBe(201);
      expect(response.body.stock).toBeDefined();
      expect(response.body.stock.symbol).toBe('NVDA');
      expect(response.body.stock.status).toBe('ACTIVE');
      expect(response.body.stock.current_price).toBe('125.50');
    });

    // [AC-03-A] Price should use Decimal precision
    it('[AC-03-A] should store price with Decimal precision (NFR-01)', async () => {
      const response = await request(app)
        .post('/api/v1/admin/stocks')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          symbol: 'TSLA',
          company_name: 'Tesla Inc',
          sector: 'Consumer',
          exchange: 'NASDAQ',
          initial_price: '245.6789'
        });

      expect(response.status).toBe(201);
      expect(response.body.stock.current_price).toMatch(/^\d+\.\d{1,4}$/);
    });

    // [AC-03-A] Missing required fields
    it('[AC-03-A] should reject with 400 if required fields missing', async () => {
      const response = await request(app)
        .post('/api/v1/admin/stocks')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          symbol: 'AAPL'
          // Missing other required fields
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    // [AC-03-A] Duplicate symbol
    it('[AC-03-A] should reject duplicate symbol with 409', async () => {
      await request(app)
        .post('/api/v1/admin/stocks')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          symbol: 'MSFT',
          company_name: 'Microsoft',
          sector: 'Technology',
          exchange: 'NASDAQ',
          initial_price: '300.00'
        });

      const response = await request(app)
        .post('/api/v1/admin/stocks')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          symbol: 'MSFT',
          company_name: 'Microsoft Duplicate',
          sector: 'Technology',
          exchange: 'NASDAQ',
          initial_price: '300.00'
        });

      expect(response.status).toBe(409);
      expect(response.body.error.code).toBe('STOCK_ALREADY_EXISTS');
    });

    // [AC-03-A] Customer cannot create
    it('[AC-03-A] should reject customer with 403', async () => {
      const response = await request(app)
        .post('/api/v1/admin/stocks')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          symbol: 'GOOG',
          company_name: 'Google',
          sector: 'Technology',
          exchange: 'NASDAQ',
          initial_price: '140.00'
        });

      expect(response.status).toBe(403);
    });

    // [AC-03-A] No auth
    it('[AC-03-A] should reject without auth with 401', async () => {
      const response = await request(app)
        .post('/api/v1/admin/stocks')
        .send({
          symbol: 'FB',
          company_name: 'Meta',
          sector: 'Technology',
          exchange: 'NASDAQ',
          initial_price: '200.00'
        });

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/v1/admin/stocks/:symbol', () => {
    beforeEach(async () => {
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
    });

    // [AC-03] Update stock metadata
    it('[AC-03] should update stock metadata with 200', async () => {
      const response = await request(app)
        .put('/api/v1/admin/stocks/NVDA')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          company_name: 'NVIDIA Corp Updated',
          sector: 'AI Computing'
        });

      expect(response.status).toBe(200);
      expect(response.body.stock.company_name).toBe('NVIDIA Corp Updated');
      expect(response.body.stock.sector).toBe('AI Computing');
    });

    // [AC-03] Not found
    it('[AC-03] should return 404 for non-existent stock', async () => {
      const response = await request(app)
        .put('/api/v1/admin/stocks/INVALID')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          company_name: 'Test'
        });

      expect(response.status).toBe(404);
    });

    // [AC-03] At least one field required
    it('[AC-03] should reject if no fields provided', async () => {
      const response = await request(app)
        .put('/api/v1/admin/stocks/NVDA')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /api/v1/admin/stocks/:symbol', () => {
    beforeEach(async () => {
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
    });

    // [AC-03-B] Admin soft-deletes stock
    it('[AC-03-B] should soft-delete stock with 200', async () => {
      const response = await request(app)
        .delete('/api/v1/admin/stocks/NVDA')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Stock delisted successfully');
      expect(response.body.status).toBe('DELISTED');
    });

    // [AC-03-B] Stock should still exist (no hard delete)
    it('[AC-03-B] should not physically remove stock', async () => {
      await request(app)
        .delete('/api/v1/admin/stocks/NVDA')
        .set('Authorization', `Bearer ${adminToken}`);

      const stock = await stockRepository.findBySymbol('NVDA');
      expect(stock).not.toBeNull();
      expect(stock!.status).toBe('DELISTED');
      expect(stock!.delisted_at).not.toBeNull();
    });

    // [AC-03-B] Not found
    it('[AC-03-B] should return 404 for non-existent stock', async () => {
      const response = await request(app)
        .delete('/api/v1/admin/stocks/INVALID')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });

    // [AC-03-B] Customer cannot delete
    it('[AC-03-B] should reject customer with 403', async () => {
      const response = await request(app)
        .delete('/api/v1/admin/stocks/NVDA')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(403);
    });
  });
});
