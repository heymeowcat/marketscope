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

// [AC-08] Insufficient Funds Guard for BUY Orders
describe('Order Cash Validation API - AC-08', () => {
  let app: Express;
  let userRepository: UserRepository;
  let stockRepository: StockRepository;
  let orderRepository: OrderRepository;
  let holdingRepository: HoldingRepository;
  let stockPriceToken: string;
  let insufficientFundsToken: string;
  let stockPriceCustomerId: string;
  let insufficientFundsCustomerId: string;

  beforeEach(async () => {
    userRepository = new UserRepository();
    stockRepository = new StockRepository();
    orderRepository = new OrderRepository();
    holdingRepository = new HoldingRepository();

    await userRepository.clear?.();
    await stockRepository.clear?.();
    await orderRepository.clear?.();
    await holdingRepository.clear?.();

    // Create customer with sufficient funds
    stockPriceCustomerId = 'customer-rich';
    await userRepository.create({
      id: stockPriceCustomerId,
      email: 'rich@example.com',
      passwordHash: 'hash',
      role: UserRole.CUSTOMER,
      status: UserStatus.ACTIVE,
      cashBalance: new Decimal('5000.00'),
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Create customer with insufficient funds
    insufficientFundsCustomerId = 'customer-poor';
    await userRepository.create({
      id: insufficientFundsCustomerId,
      email: 'poor@example.com',
      passwordHash: 'hash',
      role: UserRole.CUSTOMER,
      status: UserStatus.ACTIVE,
      cashBalance: new Decimal('1000.00'),
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key';
    stockPriceToken = jwt.sign(
      { user_id: stockPriceCustomerId, email: 'rich@example.com', role: UserRole.CUSTOMER },
      JWT_SECRET
    );
    insufficientFundsToken = jwt.sign(
      { user_id: insufficientFundsCustomerId, email: 'poor@example.com', role: UserRole.CUSTOMER },
      JWT_SECRET
    );

    // Create AAPL stock at $180
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

    app = createApp({
      userRepository,
      stockRepository,
      orderRepository: orderRepository as any,
      holdingRepository
    });
  });

  // [AC-08-A] Insufficient funds failure with 400 Bad Request
  it('[AC-08-A] should reject BUY order with insufficient funds and return 400 Bad Request', async () => {
    // Try to buy 10 shares at $180 = $1800, but customer only has $1000
    const response = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${insufficientFundsToken}`)
      .send({
        symbol: 'AAPL',
        side: 'BUY',
        order_type: 'MARKET',
        quantity: 10
      });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('INSUFFICIENT_FUNDS');
    expect(response.body.error.required).toBe('1800.00');
    expect(response.body.error.available).toBe('1000.00');
  });

  // [AC-08-B] Sufficient funds success with order placement
  it('[AC-08-B] should accept BUY order with sufficient funds', async () => {
    // Buy 10 shares at $180 = $1800, customer has $5000
    const response = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${stockPriceToken}`)
      .send({
        symbol: 'AAPL',
        side: 'BUY',
        order_type: 'MARKET',
        quantity: 10
      });

    expect(response.status).toBe(201);
    expect(response.body.order.status).toBe('PENDING');
    expect(response.body.order.symbol).toBe('AAPL');
  });

  // [AC-08-A] No order created on insufficient funds
  it('[AC-08-A] should not create order when funds are insufficient', async () => {
    // Try to buy 10 shares at $180 = $1800
    const response = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${insufficientFundsToken}`)
      .send({
        symbol: 'AAPL',
        side: 'BUY',
        order_type: 'MARKET',
        quantity: 10
      });

    expect(response.status).toBe(400);

    // Verify no order was created
    const listResponse = await request(app)
      .get('/api/v1/orders')
      .set('Authorization', `Bearer ${insufficientFundsToken}`);

    expect(listResponse.body.orders).toHaveLength(0);
  });

  // [AC-08] SELL orders should not require cash balance check
  it('[AC-08] SELL order should not check cash balance', async () => {
    // Create a holding for the poor customer
    await holdingRepository.create({
      id: 'holding-1',
      customer_id: insufficientFundsCustomerId,
      symbol: 'AAPL',
      quantity: 5,
      avg_buy_price: new Decimal('150.00'),
      created_at: new Date()
    });

    // SELL order should succeed despite low cash
    const response = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${insufficientFundsToken}`)
      .send({
        symbol: 'AAPL',
        side: 'SELL',
        order_type: 'MARKET',
        quantity: 5
      });

    expect(response.status).toBe(201);
    expect(response.body.order.status).toBe('PENDING');
  });

  // [AC-08-A] Cash balance should not change on failed order
  it('[AC-08-A] cash balance should remain unchanged on order rejection', async () => {
    // Get initial cash
    const initialUser = await userRepository.findById(insufficientFundsCustomerId);
    const initialCash = initialUser?.cashBalance || new Decimal('0');

    // Try to buy
    await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${insufficientFundsToken}`)
      .send({
        symbol: 'AAPL',
        side: 'BUY',
        order_type: 'MARKET',
        quantity: 10
      });

    // Get final cash
    const finalUser = await userRepository.findById(insufficientFundsCustomerId);
    const finalCash = finalUser?.cashBalance || new Decimal('0');

    // Should be equal
    expect(finalCash.equals(initialCash)).toBe(true);
  });
});
