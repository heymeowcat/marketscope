import { Order } from '../domain/order';

export interface IOrderRepository {
  create(order: Order): Promise<void>;
  findByCustomerId(customerId: string): Promise<Order[]>;
  findById(id: string): Promise<Order | null>;
  clear(): Promise<void>;
}

export class OrderRepository implements IOrderRepository {
  private orders: Map<string, Order> = new Map();

  async create(order: Order): Promise<void> {
    this.orders.set(order.id, order);
  }

  async findByCustomerId(customerId: string): Promise<Order[]> {
    return Array.from(this.orders.values()).filter(
      o => o.customer_id === customerId
    );
  }

  async findById(id: string): Promise<Order | null> {
    return this.orders.get(id) || null;
  }

  async clear(): Promise<void> {
    this.orders.clear();
  }
}
