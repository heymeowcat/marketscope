import { describe, it, expect, beforeEach } from 'vitest';
import Decimal from 'decimal.js';
import request from 'supertest';
import { createApp } from '../../src/app';
import { Express } from 'express';
import { UserRepository } from '../../src/repositories/user-repository';
import { StockRepository } from '../../src/repositories/stock-repository';
import { WatchlistRepository } from '../../src/repositories/watchlist-repository';
import { WatchlistSymbolRepository } from '../../src/repositories/watchlist-symbol-repository';
import { StockStatus } from '../../src/domain/stock';

// [AC-04] Watchlist creation via REST API
describe('POST /api/v1/watchlists', () => {
  let app: Express;
  let userRepository: UserRepository;
  let stockRepository: StockRepository;
  let watchlistRepository: WatchlistRepository;
  let watchlistSymbolRepository: WatchlistSymbolRepository;
  let authToken: string;

  beforeEach(async () => {
    userRepository = new UserRepository();
    stockRepository = new StockRepository();
    watchlistRepository = new WatchlistRepository();
    watchlistSymbolRepository = new WatchlistSymbolRepository();

    await userRepository.clear?.();
    await stockRepository.clear?.();
    await watchlistRepository.clear?.();
    await watchlistSymbolRepository.clear?.();

    // Register and login a customer
    await userRepository.create({
      user_id: 'customer-123',
      email: 'customer@example.com',
      hashed_password: 'hashed',
      role: 'CUSTOMER',
      status: 'ACTIVATED',
      created_at: new Date(),
      last_login: null,
      role_updated_at: null
    });

    // Seed stocks
    await stockRepository.create({
      symbol: 'NVDA',
      company_name: 'NVIDIA',
      sector: 'Technology',
      exchange: 'NASDAQ',
      status: StockStatus.ACTIVE,
      current_price: new Decimal('125.50'),
      created_at: new Date(),
      delisted_at: null
    });

    await stockRepository.create({
      symbol: 'TSM',
      company_name: 'Taiwan Semiconductor',
      sector: 'Technology',
      exchange: 'NYSE',
      status: StockStatus.ACTIVE,
      current_price: new Decimal('100.00'),
      created_at: new Date(),
      delisted_at: null
    });

    app = createApp({
      userRepository,
      stockRepository,
      watchlistRepository,
      watchlistSymbolRepository
    });

    // Generate JWT token for customer
    const jwtSecret = process.env.JWT_SECRET || 'dev-secret-key';
    const payload = { userId: 'customer-123', email: 'customer@example.com', role: 'CUSTOMER' };
    const token = require('jsonwebtoken').sign(payload, jwtSecret);
    authToken = token;
  });

  // [AC-04-A] Successful watchlist creation
  it('[AC-04-A] should create watchlist with HTTP 201 Created', async () => {
    const response = await request(app)
      .post('/api/v1/watchlists')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Semiconductors',
        symbols: ['NVDA', 'TSM']
      });

    expect(response.status).toBe(201);
    expect(response.body.watchlist).toBeDefined();
    expect(response.body.watchlist.name).toBe('Semiconductors');
    expect(response.body.watchlist.symbols).toEqual(['NVDA', 'TSM']);
    expect(response.body.watchlist.watchlist_id).toBeDefined();
  });

  // [AC-04-B] Reject empty symbols
  it('[AC-04-B] should reject empty symbols with HTTP 422', async () => {
    const response = await request(app)
      .post('/api/v1/watchlists')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Tech',
        symbols: []
      });

    expect(response.status).toBe(422);
    expect(response.body.error).toBeDefined();
    expect(response.body.message).toContain('at least one symbol');
  });

  // [AC-04-C] Enforce 10-watchlist limit
  it('[AC-04-C] should reject watchlist creation with HTTP 400 when limit exceeded', async () => {
    // Create 10 watchlists
    for (let i = 0; i < 10; i++) {
      await request(app)
        .post('/api/v1/watchlists')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: `Watchlist ${i}`,
          symbols: ['NVDA']
        });
    }

    // Attempt to create 11th
    const response = await request(app)
      .post('/api/v1/watchlists')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Watchlist 11',
        symbols: ['TSM']
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('WATCHLIST_LIMIT_EXCEEDED');
  });
});

// [AC-04] Watchlist retrieval via REST API
describe('GET /api/v1/watchlists', () => {
  let app: Express;
  let userRepository: UserRepository;
  let stockRepository: StockRepository;
  let watchlistRepository: WatchlistRepository;
  let watchlistSymbolRepository: WatchlistSymbolRepository;
  let authToken: string;

  beforeEach(async () => {
    userRepository = new UserRepository();
    stockRepository = new StockRepository();
    watchlistRepository = new WatchlistRepository();
    watchlistSymbolRepository = new WatchlistSymbolRepository();

    await userRepository.clear?.();
    await stockRepository.clear?.();
    await watchlistRepository.clear?.();
    await watchlistSymbolRepository.clear?.();

    await userRepository.create({
      user_id: 'customer-123',
      email: 'customer@example.com',
      hashed_password: 'hashed',
      role: 'CUSTOMER',
      status: 'ACTIVATED',
      created_at: new Date(),
      last_login: null,
      role_updated_at: null
    });

    await stockRepository.create({
      symbol: 'NVDA',
      company_name: 'NVIDIA',
      sector: 'Technology',
      exchange: 'NASDAQ',
      status: StockStatus.ACTIVE,
      current_price: new Decimal('125.50'),
      created_at: new Date(),
      delisted_at: null
    });

    app = createApp({
      userRepository,
      stockRepository,
      watchlistRepository,
      watchlistSymbolRepository
    });

    const jwtSecret = process.env.JWT_SECRET || 'dev-secret-key';
    const payload = { userId: 'customer-123', email: 'customer@example.com', role: 'CUSTOMER' };
    const token = require('jsonwebtoken').sign(payload, jwtSecret);
    authToken = token;
  });

  // [AC-04] Should list all watchlists for customer
  it('[AC-04] should list all watchlists for authenticated customer', async () => {
    await request(app)
      .post('/api/v1/watchlists')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Tech Stocks',
        symbols: ['NVDA']
      });

    const response = await request(app)
      .get('/api/v1/watchlists')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body.watchlists).toHaveLength(1);
    expect(response.body.watchlists[0].name).toBe('Tech Stocks');
  });
});
