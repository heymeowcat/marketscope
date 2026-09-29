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

// [AC-10] Integration tests for daily gainers and losers endpoint
describe('GET /api/v1/analytics/daily-stats', () => {
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
  });

  // [AC-10-B] Zero holdings
  it('[AC-10-B] should return empty arrays when customer has no holdings', async () => {
    const response = await request(app)
      .get('/api/v1/analytics/daily-stats')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(response.status).toBe(200);
    expect(response.body.gainers).toEqual([]);
    expect(response.body.losers).toEqual([]);
  });

  // [AC-10-A] Full scenario with multiple holdings
  it('[AC-10-A] should return top 5 gainers and 3 losers correctly', async () => {
    // Create stocks with current prices
    const stocks = [
      { symbol: 'NVDA', price: '145.20', buyPrice: '100.00', expected: 45.20 },
      { symbol: 'AAPL', price: '180.00', buyPrice: '150.00', expected: 20.00 },
      { symbol: 'GOOGL', price: '172.65', buyPrice: '150.00', expected: 15.10 },
      { symbol: 'MSFT', price: '337.20', buyPrice: '300.00', expected: 12.40 },
      { symbol: 'AMZN', price: '194.40', buyPrice: '180.00', expected: 8.00 },
      { symbol: 'META', price: '208.40', buyPrice: '200.00', expected: 4.20 },
      { symbol: 'TSLA', price: '233.75', buyPrice: '250.00', expected: -6.50 },
      { symbol: 'INTC', price: '24.54', buyPrice: '30.00', expected: -18.20 },
      { symbol: 'AMD', price: '116.25', buyPrice: '150.00', expected: -22.50 }
    ];

    for (const stock of stocks) {
      await stockRepository.create({
        symbol: stock.symbol,
        company_name: stock.symbol,
        sector: 'Technology',
        exchange: 'NASDAQ',
        status: StockStatus.ACTIVE,
        current_price: new Decimal(stock.price),
        created_at: new Date(),
        delisted_at: null
      });

      await holdingRepository.create({
        id: uuidv4(),
        customer_id: customerId,
        symbol: stock.symbol,
        quantity: 10,
        avg_buy_price: new Decimal(stock.buyPrice),
        created_at: new Date()
      });
    }

    const response = await request(app)
      .get('/api/v1/analytics/daily-stats')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(response.status).toBe(200);
    expect(response.body.customer_id).toBe(customerId);
    expect(response.body.timestamp).toBeDefined();

    // Verify gainers
    expect(response.body.gainers).toHaveLength(5);
    expect(response.body.gainers[0].symbol).toBe('NVDA');
    expect(response.body.gainers[0].gain_percent).toBe('45.20');
    expect(response.body.gainers[0].current_price).toBe('145.20');
    expect(response.body.gainers[0].avg_buy_price).toBe('100.00');

    expect(response.body.gainers[1].symbol).toBe('AAPL');
    expect(response.body.gainers[1].gain_percent).toBe('20.00');

    expect(response.body.gainers[4].symbol).toBe('AMZN');
    expect(response.body.gainers[4].gain_percent).toBe('8.00');

    // Verify losers
    expect(response.body.losers).toHaveLength(3);
    expect(response.body.losers[0].symbol).toBe('AMD');
    expect(response.body.losers[0].gain_percent).toBe('-22.50');

    expect(response.body.losers[1].symbol).toBe('INTC');
    expect(response.body.losers[1].gain_percent).toBe('-18.20');

    expect(response.body.losers[2].symbol).toBe('TSLA');
    expect(response.body.losers[2].gain_percent).toBe('-6.50');
  });

  // [AC-10] Unauthorized access without token
  it('[AC-10] should reject without authorization token', async () => {
    const response = await request(app)
      .get('/api/v1/analytics/daily-stats');

    expect(response.status).toBe(401);
  });

  // [NFR-01] All financial values are strings with 2 decimal precision
  it('[NFR-01] should return all financial values as strings with proper decimal precision', async () => {
    await stockRepository.create({
      symbol: 'TEST',
      company_name: 'Test Inc',
      sector: 'Technology',
      exchange: 'NASDAQ',
      status: StockStatus.ACTIVE,
      current_price: new Decimal('145.678'),
      created_at: new Date(),
      delisted_at: null
    });

    await holdingRepository.create({
      id: uuidv4(),
      customer_id: customerId,
      symbol: 'TEST',
      quantity: 1,
      avg_buy_price: new Decimal('100.333'),
      created_at: new Date()
    });

    const response = await request(app)
      .get('/api/v1/analytics/daily-stats')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(response.status).toBe(200);
    expect(typeof response.body.gainers[0].current_price).toBe('string');
    expect(typeof response.body.gainers[0].avg_buy_price).toBe('string');
    expect(typeof response.body.gainers[0].gain_percent).toBe('string');

    // Verify 2 decimal precision
    expect(response.body.gainers[0].current_price).toMatch(/^\d+\.\d{2}$/);
    expect(response.body.gainers[0].avg_buy_price).toMatch(/^\d+\.\d{2}$/);
    expect(response.body.gainers[0].gain_percent).toMatch(/^-?\d+\.\d{2}$/);
  });

  // [AC-10] Mixed gainers and losers
  it('[AC-10] should correctly handle mixed gainers and losers', async () => {
    const testData = [
      { symbol: 'UP1', price: '120.00', buy: '100.00' },
      { symbol: 'UP2', price: '115.00', buy: '100.00' },
      { symbol: 'DOWN1', price: '80.00', buy: '100.00' },
      { symbol: 'DOWN2', price: '90.00', buy: '100.00' }
    ];

    for (const data of testData) {
      await stockRepository.create({
        symbol: data.symbol,
        company_name: data.symbol,
        sector: 'Technology',
        exchange: 'NASDAQ',
        status: StockStatus.ACTIVE,
        current_price: new Decimal(data.price),
        created_at: new Date(),
        delisted_at: null
      });

      await holdingRepository.create({
        id: uuidv4(),
        customer_id: customerId,
        symbol: data.symbol,
        quantity: 1,
        avg_buy_price: new Decimal(data.buy),
        created_at: new Date()
      });
    }

    const response = await request(app)
      .get('/api/v1/analytics/daily-stats')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(response.status).toBe(200);
    expect(response.body.gainers.length).toBe(2);
    expect(response.body.losers.length).toBe(2);

    expect(response.body.gainers[0].symbol).toBe('UP1');
    expect(response.body.gainers[1].symbol).toBe('UP2');
    expect(response.body.losers[0].symbol).toBe('DOWN1');
    expect(response.body.losers[1].symbol).toBe('DOWN2');
  });
});
