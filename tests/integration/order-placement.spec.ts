import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import Decimal from 'decimal.js';
import { createApp } from '../../src/app';
import { Express } from 'express';
import { UserRepository } from '../../src/repositories/user-repository';
import { StockRepository } from '../../src/repositories/stock-repository';
import { OrderRepository } from '../../src/repositories/order-repository';
import { HoldingRepository } from '../../src/repositories/holding-repository';
import { UserRole, UserStatus } from '../../src/domain/user';
import { StockStatus } from '../../src/domain/stock';
import jwt from 'jsonwebtoken';

// [AC-06] Order Placement & Initial Pending State
describe('Order Placement API - AC-06', () => {
  let app: Express;
  let userRepository: UserRepository;
  let stockRepository: StockRepository;
  let orderRepository: OrderRepository;
  let holdingRepository: HoldingRepository;
  let token: string;
  let customerId: string;

  beforeEach(async () => {
    userRepository = new UserRepository();
    stockRepository = new StockRepository();
    orderRepository = new OrderRepository();
    holdingRepository = new HoldingRepository();

    await userRepository.clear?.();
    await stockRepository.clear?.();
    await orderRepository.clear?.();
    await holdingRepository.clear?.();

    // Create test customer
    customerId = 'customer-1';
    await userRepository.create({
      id: customerId,
      email: 'customer@example.com',
      passwordHash: 'hash',
      role: UserRole.CUSTOMER,
      status: UserStatus.ACTIVE,
      cashBalance: new Decimal('10000.00'),
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Create JWT token
    const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key';
    token = jwt.sign(
      { user_id: customerId, email: 'customer@example.com', role: UserRole.CUSTOMER },
      JWT_SECRET
    );

    // Create test stocks
    await stockRepository.create({
      symbol: 'AAPL',
      company_name: 'Apple',
      sector: 'Technology',
      exchange: 'NASDAQ',
      status: StockStatus.ACTIVE,
      current_price: new Decimal('180.00'),
      created_at: new Date(),
      delisted_at: null
    });

    await stockRepository.create({
      symbol: 'MSFT',
      company_name: 'Microsoft',
      sector: 'Technology',
      exchange: 'NASDAQ',
      status: StockStatus.ACTIVE,
      current_price: new Decimal('450.00'),
      created_at: new Date(),
      delisted_at: null
    });

    // Create a holding for SELL order testing
    await holdingRepository.create({
      id: 'holding-1',
      customer_id: customerId,
      symbol: 'MSFT',
      quantity: 10,
      avg_buy_price: new Decimal('400.00'),
      created_at: new Date()
    });

    app = createApp({
      userRepository,
      stockRepository,
      orderRepository: orderRepository as any,
      holdingRepository
    });
  });

  // [AC-06-A] Market BUY order placement
  it('[AC-06-A] should place market BUY order and return 201 Created', async () => {
    const response = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        symbol: 'AAPL',
        side: 'BUY',
        order_type: 'MARKET',
        quantity: 10
      });

    expect(response.status).toBe(201);
    expect(response.body.order).toBeDefined();
    expect(response.body.order.status).toBe('PENDING');
    expect(response.body.order.symbol).toBe('AAPL');
    expect(response.body.order.customer_id).toBe(customerId);
    expect(response.body.order.created_at).toBeDefined();
  });

  // [AC-06-B] Limit SELL order placement
  it('[AC-06-B] should place limit SELL order with limit_price', async () => {
    const response = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        symbol: 'MSFT',
        side: 'SELL',
        order_type: 'LIMIT',
        quantity: 5,
        limit_price: 450.00
      });

    expect(response.status).toBe(201);
    expect(response.body.order.status).toBe('PENDING');
    expect(response.body.order.side).toBe('SELL');
    expect(response.body.order.order_type).toBe('LIMIT');
  });

  // [AC-06] Should return 401 without authentication
  it('[AC-06] should return 401 Unauthorized without token', async () => {
    const response = await request(app)
      .post('/api/v1/orders')
      .send({
        symbol: 'AAPL',
        side: 'BUY',
        order_type: 'MARKET',
        quantity: 10
      });

    expect(response.status).toBe(401);
  });
});
