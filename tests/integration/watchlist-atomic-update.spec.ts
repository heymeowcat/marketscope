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

// [AC-05] Watchlist atomic updates via REST API
describe('PUT /api/v1/watchlists/:id', () => {
  let app: Express;
  let userRepository: UserRepository;
  let stockRepository: StockRepository;
  let watchlistRepository: WatchlistRepository;
  let watchlistSymbolRepository: WatchlistSymbolRepository;
  let authToken: string;
  let watchlistId: string;

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
      userId: 'customer-123',
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
      symbol: 'AAPL',
      company_name: 'Apple',
      sector: 'Technology',
      exchange: 'NASDAQ',
      status: StockStatus.ACTIVE,
      current_price: new Decimal('150.00'),
      created_at: new Date(),
      delisted_at: null
    });

    await stockRepository.create({
      symbol: 'MSFT',
      company_name: 'Microsoft',
      sector: 'Technology',
      exchange: 'NASDAQ',
      status: StockStatus.ACTIVE,
      current_price: new Decimal('300.00'),
      created_at: new Date(),
      delisted_at: null
    });

    await stockRepository.create({
      symbol: 'GOOGL',
      company_name: 'Google',
      sector: 'Technology',
      exchange: 'NASDAQ',
      status: StockStatus.ACTIVE,
      current_price: new Decimal('140.00'),
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

    // Create initial watchlist
    const createResponse = await request(app)
      .post('/api/v1/watchlists')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Old Name',
        symbols: ['AAPL', 'MSFT']
      });

    watchlistId = createResponse.body.watchlist.watchlist_id;
  });

  // [AC-05-A] Atomic success with name and symbols update
  it('[AC-05-A] should atomically update watchlist name and symbols with HTTP 200', async () => {
    const response = await request(app)
      .put(`/api/v1/watchlists/${watchlistId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Big Tech',
        symbols: ['AAPL', 'MSFT', 'GOOGL']
      });

    expect(response.status).toBe(200);
    expect(response.body.watchlist.name).toBe('Big Tech');
    expect(response.body.watchlist.symbols).toEqual(['AAPL', 'MSFT', 'GOOGL']);
  });

  // [AC-05-B] Atomic failure with invalid symbol - rollback
  it('[AC-05-B] should rollback on invalid symbol with HTTP 422', async () => {
    const response = await request(app)
      .put(`/api/v1/watchlists/${watchlistId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'New Name',
        symbols: ['GOOGL', 'INVALID_SYM_XYZ']
      });

    expect(response.status).toBe(422);
    expect(response.body.error).toBe('WATCHLIST_UPDATE_FAILED');
    expect(response.body.message).toContain('INVALID_SYM_XYZ');

    // Verify rollback: get the watchlist and verify original state
    const getResponse = await request(app)
      .get(`/api/v1/watchlists/${watchlistId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(getResponse.body.watchlist.name).toBe('Old Name');
    expect(getResponse.body.watchlist.symbols).toEqual(['AAPL', 'MSFT']);
  });

  // [AC-05-B] Should not allow update with nonexistent stock
  it('[AC-05-B] should reject update with nonexistent symbol', async () => {
    const response = await request(app)
      .put(`/api/v1/watchlists/${watchlistId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Tech',
        symbols: ['NONEXISTENT']
      });

    expect(response.status).toBe(422);
    expect(response.body.error).toBe('WATCHLIST_UPDATE_FAILED');
  });
});

// [AC-05] Watchlist deletion via REST API
describe('DELETE /api/v1/watchlists/:id', () => {
  let app: Express;
  let userRepository: UserRepository;
  let stockRepository: StockRepository;
  let watchlistRepository: WatchlistRepository;
  let watchlistSymbolRepository: WatchlistSymbolRepository;
  let authToken: string;
  let watchlistId: string;

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
      userId: 'customer-123',
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

    const createResponse = await request(app)
      .post('/api/v1/watchlists')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Tech',
        symbols: ['NVDA']
      });

    watchlistId = createResponse.body.watchlist.watchlist_id;
  });

  // [AC-05-C] Atomic deletion
  it('[AC-05-C] should atomically delete watchlist with HTTP 204', async () => {
    const response = await request(app)
      .delete(`/api/v1/watchlists/${watchlistId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(204);

    // Verify deletion
    const getResponse = await request(app)
      .get(`/api/v1/watchlists/${watchlistId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(getResponse.status).toBe(404);
  });
});

// [AC-04] Watchlist retrieval by ID
describe('GET /api/v1/watchlists/:id', () => {
  let app: Express;
  let userRepository: UserRepository;
  let stockRepository: StockRepository;
  let watchlistRepository: WatchlistRepository;
  let watchlistSymbolRepository: WatchlistSymbolRepository;
  let authToken: string;
  let watchlistId: string;

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
      userId: 'customer-123',
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

    const createResponse = await request(app)
      .post('/api/v1/watchlists')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Tech Stocks',
        symbols: ['NVDA']
      });

    watchlistId = createResponse.body.watchlist.watchlist_id;
  });

  // [AC-04] Should retrieve watchlist by ID
  it('[AC-04] should retrieve watchlist by ID with HTTP 200', async () => {
    const response = await request(app)
      .get(`/api/v1/watchlists/${watchlistId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body.watchlist.watchlist_id).toBe(watchlistId);
    expect(response.body.watchlist.name).toBe('Tech Stocks');
    expect(response.body.watchlist.symbols).toEqual(['NVDA']);
  });

  // [AC-04] Should return 404 for nonexistent watchlist
  it('[AC-04] should return HTTP 404 for nonexistent watchlist', async () => {
    const response = await request(app)
      .get(`/api/v1/watchlists/nonexistent-id`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(404);
  });
});
