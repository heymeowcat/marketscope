import { v4 as uuidv4 } from 'uuid';
import Decimal from 'decimal.js';
import { Order, OrderEntity, OrderStatus, OrderType, OrderSide } from '../domain/order';
import { OrderStateMachine } from '../domain/order-state-machine';
import {
  InsufficientFundsException,
  InvalidOrderStateException,
  StockNotFoundException,
  UserNotFoundException
} from '../domain/exceptions';
import { IOrderRepository } from '../repositories/order-repository';
import { IUserRepository } from '../repositories/user-repository';
import { IStockRepository } from '../repositories/stock-repository';
import { IHoldingRepository } from '../repositories/holding-repository';

export interface OrderServiceDeps {
  orderRepository: IOrderRepository;
  userRepository: IUserRepository;
  stockRepository: IStockRepository;
  holdingRepository: IHoldingRepository;
}

export interface OrderResponse {
  id: string;
  customer_id: string;
  symbol: string;
  side: OrderSide;
  type?: OrderType;
  order_type?: OrderType;
  quantity: number;
  limit_price: string | null;
  status: OrderStatus;
  executed_price: string | null;
  created_at: string;
  executed_at: string | null;
}

export class OrderService {
  private orderRepository: IOrderRepository;
  private userRepository: IUserRepository;
  private stockRepository: IStockRepository;
  private holdingRepository: IHoldingRepository;

  constructor(deps: OrderServiceDeps) {
    this.orderRepository = deps.orderRepository;
    this.userRepository = deps.userRepository;
    this.stockRepository = deps.stockRepository;
    this.holdingRepository = deps.holdingRepository;
  }

  async placeOrder(
    customerId: string,
    symbol: string,
    side: OrderSide,
    orderType: OrderType,
    quantity: number,
    limitPrice: Decimal | null
  ): Promise<Order> {
    // Verify customer exists
    const customer = await this.userRepository.findById(customerId);
    if (!customer) {
      throw new UserNotFoundException(customerId);
    }

    // Verify stock exists
    const stock = await this.stockRepository.findBySymbolActive(symbol);
    if (!stock) {
      throw new StockNotFoundException(symbol);
    }

    // For BUY orders, verify sufficient cash using fixed-point math (NFR-01)
    if (side === OrderSide.BUY) {
      // Get the quote price - for MARKET orders use current price, for LIMIT use limit_price
      const quotePrice = orderType === OrderType.MARKET
        ? stock.current_price
        : limitPrice || stock.current_price;

      const requiredCash = new Decimal(quotePrice).times(quantity).toDecimalPlaces(2);
      const availableCash = customer.cashBalance instanceof Decimal
        ? customer.cashBalance
        : new Decimal(customer.cashBalance);

      if (requiredCash.greaterThan(availableCash)) {
        throw new InsufficientFundsException(
          `Required cash $${requiredCash.toString()} exceeds available balance $${availableCash.toString()}`,
          requiredCash.toFixed(2),
          availableCash.toFixed(2)
        );
      }
    }

    // Create order in PENDING state
    const orderId = uuidv4();
    const now = new Date();

    const order = new Order({
      id: orderId,
      customer_id: customerId,
      symbol,
      side,
      type: orderType,
      quantity,
      limit_price: limitPrice,
      status: OrderStatus.PENDING,
      executed_price: null,
      created_at: now,
      executed_at: null
    });

    await this.orderRepository.create(order);
    return order;
  }

  async executeOrder(orderId: string, executedPrice: Decimal): Promise<Order> {
    // Get current order
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }

    // Validate state transition with state machine
    const machine = new OrderStateMachine();
    machine.initialize(order.status);

    try {
      machine.transition(OrderStatus.EXECUTED);
    } catch (error) {
      if (error instanceof InvalidOrderStateException) {
        throw error;
      }
      throw new InvalidOrderStateException(
        `Cannot execute order in ${order.status} state`
      );
    }

    // Update order with execution details
    const executedOrder = await this.orderRepository.update(orderId, {
      status: OrderStatus.EXECUTED,
      executed_price: executedPrice,
      executed_at: new Date()
    });

    return executedOrder;
  }

  async cancelOrder(orderId: string): Promise<Order> {
    // Get current order
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }

    // Validate state transition with state machine
    const machine = new OrderStateMachine();
    machine.initialize(order.status);

    try {
      machine.transition(OrderStatus.CANCELLED);
    } catch (error) {
      if (error instanceof InvalidOrderStateException) {
        throw error;
      }
      throw new InvalidOrderStateException(
        `Cannot cancel order in ${order.status} state`
      );
    }

    // Update order status
    const cancelledOrder = await this.orderRepository.update(orderId, {
      status: OrderStatus.CANCELLED
    });

    return cancelledOrder;
  }

  async getOrder(orderId: string): Promise<Order | null> {
    return this.orderRepository.findById(orderId);
  }

  async listOrdersByCustomerId(customerId: string): Promise<Order[]> {
    return this.orderRepository.findByCustomerId(customerId);
  }

  toResponse(order: Order): OrderResponse {
    return {
      id: order.id,
      customer_id: order.customer_id,
      symbol: order.symbol,
      side: order.side,
      type: order.type,
      order_type: order.type,
      quantity: order.quantity,
      limit_price: order.limit_price ? order.limit_price.toString() : null,
      status: order.status,
      executed_price: order.executed_price ? order.executed_price.toString() : null,
      created_at: order.created_at.toISOString(),
      executed_at: order.executed_at ? order.executed_at.toISOString() : null
    };
  }
}
