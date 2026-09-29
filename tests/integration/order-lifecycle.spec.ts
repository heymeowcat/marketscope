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
import { OrderStatus, OrderType } from '../../src/domain/order';
import jwt from 'jsonwebtoken';

// [AC-07] Order Lifecycle State Machine Enforcement
describe('Order Lifecycle API - AC-07', () => {
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

    const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key';
    token = jwt.sign(
      { user_id: customerId, email: 'customer@example.com', role: UserRole.CUSTOMER },
      JWT_SECRET
    );

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

  // [AC-07-A] Valid execution transition
  it('[AC-07-A] valid order execution should transition PENDING -> EXECUTED', async () => {
    // Place order
    const placeResponse = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        symbol: 'AAPL',
        side: 'BUY',
        order_type: 'MARKET',
        quantity: 10
      });

    expect(placeResponse.status).toBe(201);
    const orderId = placeResponse.body.order.id;

    // Execute order (internal endpoint)
    const executeResponse = await request(app)
      .post(`/api/v1/orders/${orderId}/execute`)
      .send({ executed_price: 180.00 });

    expect(executeResponse.status).toBe(200);
    expect(executeResponse.body.order.status).toBe('EXECUTED');
    expect(executeResponse.body.order.executed_price).toBeDefined();
    expect(executeResponse.body.order.executed_at).toBeDefined();
  });

  // [AC-07-B] Illegal cancellation of executed order
  it('[AC-07-B] should reject cancellation of executed order with 409 Conflict', async () => {
    // Place order
    const placeResponse = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        symbol: 'AAPL',
        side: 'BUY',
        order_type: 'MARKET',
        quantity: 10
      });

    const orderId = placeResponse.body.order.id;

    // Execute order
    await request(app)
      .post(`/api/v1/orders/${orderId}/execute`)
      .send({ executed_price: 180.00 });

    // Try to cancel executed order
    const cancelResponse = await request(app)
      .post(`/api/v1/orders/${orderId}/cancel`)
      .set('Authorization', `Bearer ${token}`);

    expect(cancelResponse.status).toBe(409);
    expect(cancelResponse.body.error.code).toBe('INVALID_ORDER_STATE');
    expect(cancelResponse.body.error.message).toContain('Cannot transition order from EXECUTED to CANCELLED');
  });

  // [AC-07] Valid cancellation of pending order
  it('[AC-07] should allow cancellation of pending order', async () => {
    // Place order
    const placeResponse = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        symbol: 'AAPL',
        side: 'BUY',
        order_type: 'MARKET',
        quantity: 10
      });

    const orderId = placeResponse.body.order.id;

    // Cancel pending order
    const cancelResponse = await request(app)
      .post(`/api/v1/orders/${orderId}/cancel`)
      .set('Authorization', `Bearer ${token}`);

    expect(cancelResponse.status).toBe(200);
    expect(cancelResponse.body.order.status).toBe('CANCELLED');
  });

  // [AC-07] Get order should return current state
  it('[AC-07] GET order should return current order state', async () => {
    // Place order
    const placeResponse = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        symbol: 'AAPL',
        side: 'BUY',
        order_type: 'MARKET',
        quantity: 10
      });

    const orderId = placeResponse.body.order.id;

    // Get order
    const getResponse = await request(app)
      .get(`/api/v1/orders/${orderId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(getResponse.status).toBe(200);
    expect(getResponse.body.order.status).toBe('PENDING');
  });

  // [AC-07] List orders should show all orders
  it('[AC-07] GET /api/v1/orders should list customer orders', async () => {
    // Place two orders
    await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        symbol: 'AAPL',
        side: 'BUY',
        order_type: 'MARKET',
        quantity: 10
      });

    await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        symbol: 'AAPL',
        side: 'BUY',
        order_type: 'MARKET',
        quantity: 5
      });

    // List orders
    const listResponse = await request(app)
      .get('/api/v1/orders')
      .set('Authorization', `Bearer ${token}`);

    expect(listResponse.status).toBe(200);
    expect(listResponse.body.orders).toHaveLength(2);
  });
});
