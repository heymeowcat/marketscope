import { describe, it, expect, beforeEach } from 'vitest';
import Decimal from 'decimal.js';
import { OrderService } from '../../../src/services/order-service';
import { OrderRepository } from '../../../src/repositories/order-repository';
import { UserRepository } from '../../../src/repositories/user-repository';
import { StockRepository } from '../../../src/repositories/stock-repository';
import { HoldingRepository } from '../../../src/repositories/holding-repository';
import { UserRole, UserStatus } from '../../../src/domain/user';
import { StockStatus } from '../../../src/domain/stock';
import { OrderStatus, OrderType, OrderSide } from '../../../src/domain/order';
import {
  InvalidOrderStateException,
  InsufficientFundsException,
  StockNotFoundException
} from '../../../src/domain/exceptions';

// [AC-06][AC-07][AC-08] Order CRUD and validation
describe('OrderService', () => {
  let orderService: OrderService;
  let orderRepository: OrderRepository;
  let userRepository: UserRepository;
  let stockRepository: StockRepository;
  let holdingRepository: HoldingRepository;
  let customerId: string;

  beforeEach(async () => {
    orderRepository = new OrderRepository();
    userRepository = new UserRepository();
    stockRepository = new StockRepository();
    holdingRepository = new HoldingRepository();

    await orderRepository.clear?.();
    await userRepository.clear?.();
    await stockRepository.clear?.();
    await holdingRepository.clear?.();

    // Create a test customer with sufficient cash
    await userRepository.create({
      id: 'customer-1',
      email: 'customer@example.com',
      passwordHash: 'hash',
      role: UserRole.CUSTOMER,
      status: UserStatus.ACTIVE,
      cashBalance: new Decimal('10000.00'),
      createdAt: new Date(),
      updatedAt: new Date()
    });

    customerId = 'customer-1';

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

    orderService = new OrderService({
      orderRepository,
      userRepository,
      stockRepository,
      holdingRepository
    });
  });

  describe('placeOrder', () => {
    // [AC-06-A] Market BUY order placement with sufficient funds
    it('[AC-06-A] should place market BUY order with sufficient cash', async () => {
      const result = await orderService.placeOrder(customerId, 'AAPL', OrderSide.BUY, OrderType.MARKET, 10, null);

      expect(result.id).toBeDefined();
      expect(result.customer_id).toBe(customerId);
      expect(result.symbol).toBe('AAPL');
      expect(result.side).toBe(OrderSide.BUY);
      expect(result.quantity).toBe(10);
      expect(result.status).toBe(OrderStatus.PENDING);
      expect(result.created_at).toBeInstanceOf(Date);
    });

    // [AC-06-B] Limit SELL order placement
    it('[AC-06-B] should place limit SELL order for owned shares', async () => {
      const result = await orderService.placeOrder(customerId, 'MSFT', OrderSide.SELL, OrderType.LIMIT, 5, new Decimal('450.00'));

      expect(result.id).toBeDefined();
      expect(result.customer_id).toBe(customerId);
      expect(result.symbol).toBe('MSFT');
      expect(result.side).toBe(OrderSide.SELL);
      expect(result.quantity).toBe(5);
      expect(result.status).toBe(OrderStatus.PENDING);
    });

    // [AC-08-A] Insufficient funds failure
    it('[AC-08-A] should reject BUY order with insufficient funds', async () => {
      expect(async () => {
        // 10 shares * 180 = 1800, but customer only has 10000, so this should fail
        // Let me create a customer with low balance
        await userRepository.create({
          id: 'poor-customer',
          email: 'poor@example.com',
          passwordHash: 'hash',
          role: UserRole.CUSTOMER,
          status: UserStatus.ACTIVE,
          cashBalance: new Decimal('1000.00'),
          createdAt: new Date(),
          updatedAt: new Date()
        });

        await orderService.placeOrder('poor-customer', 'AAPL', OrderSide.BUY, OrderType.MARKET, 10, null);
      }).rejects.toThrow(InsufficientFundsException);
    });

    // [AC-06] Stock not found error
    it('[AC-06] should reject order for non-existent stock', async () => {
      expect(async () => {
        await orderService.placeOrder(customerId, 'NONEXIST', OrderSide.BUY, OrderType.MARKET, 10, null);
      }).rejects.toThrow(StockNotFoundException);
    });
  });

  describe('cancelOrder', () => {
    // [AC-07-B] Cannot cancel executed order
    it('[AC-07-B] should reject cancellation of executed order', async () => {
      const order = await orderService.placeOrder(customerId, 'AAPL', OrderSide.BUY, OrderType.MARKET, 10, null);

      // Execute the order
      await orderService.executeOrder(order.id, new Decimal('180.00'));

      // Try to cancel executed order
      expect(async () => {
        await orderService.cancelOrder(order.id);
      }).rejects.toThrow(InvalidOrderStateException);
    });

    // [AC-07] Can cancel pending order
    it('[AC-07] should allow cancellation of pending order', async () => {
      const order = await orderService.placeOrder(customerId, 'AAPL', OrderSide.BUY, OrderType.MARKET, 10, null);

      const cancelled = await orderService.cancelOrder(order.id);

      expect(cancelled.status).toBe(OrderStatus.CANCELLED);
    });
  });

  describe('executeOrder', () => {
    // [AC-07-A] Valid execution transition
    it('[AC-07-A] should execute pending order and update status', async () => {
      const order = await orderService.placeOrder(customerId, 'AAPL', OrderSide.BUY, OrderType.MARKET, 10, null);

      const executed = await orderService.executeOrder(order.id, new Decimal('180.00'));

      expect(executed.status).toBe(OrderStatus.EXECUTED);
      expect(executed.executed_price).toEqual(new Decimal('180.00'));
      expect(executed.executed_at).toBeInstanceOf(Date);
    });
  });

  describe('getOrder', () => {
    it('[AC-06] should retrieve order by ID', async () => {
      const created = await orderService.placeOrder(customerId, 'AAPL', OrderSide.BUY, OrderType.MARKET, 10, null);

      const retrieved = await orderService.getOrder(created.id);

      expect(retrieved).not.toBeNull();
      expect(retrieved!.id).toBe(created.id);
      expect(retrieved!.symbol).toBe('AAPL');
      expect(retrieved!.customer_id).toBe(customerId);
    });

    it('[AC-06] should return null for non-existent order', async () => {
      const result = await orderService.getOrder('nonexistent-id');

      expect(result).toBeNull();
    });
  });

  describe('listOrdersByCustomerId', () => {
    it('[AC-06] should list all customer orders', async () => {
      await orderService.placeOrder(customerId, 'AAPL', OrderSide.BUY, OrderType.MARKET, 10, null);
      await orderService.placeOrder(customerId, 'MSFT', OrderSide.SELL, OrderType.LIMIT, 5, new Decimal('450.00'));

      const orders = await orderService.listOrdersByCustomerId(customerId);

      expect(orders).toHaveLength(2);
      expect(orders[0].symbol).toBe('AAPL');
      expect(orders[1].symbol).toBe('MSFT');
    });

    it('[AC-06] should return empty array for customer with no orders', async () => {
      const orders = await orderService.listOrdersByCustomerId('nonexistent-customer');

      expect(orders).toEqual([]);
    });
  });
});
