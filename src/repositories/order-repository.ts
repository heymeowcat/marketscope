import { Order, OrderEntity } from '../domain/order';

export interface IOrderRepository {
  create(order: Order): Promise<Order>;
  findByCustomerId(customerId: string): Promise<Order[]>;
  findById(id: string): Promise<Order | null>;
  update(id: string, updates: Partial<OrderEntity>): Promise<Order>;
  clear?(): Promise<void>;
}

export class OrderRepository implements IOrderRepository {
  private orders: Map<string, Order> = new Map();

  async create(order: Order): Promise<Order> {
    this.orders.set(order.id, order);
    return order;
  }

  async findByCustomerId(customerId: string): Promise<Order[]> {
    return Array.from(this.orders.values()).filter(
      o => o.customer_id === customerId
    );
  }

  async findById(id: string): Promise<Order | null> {
    const order = this.orders.get(id);
    return order || null;
  }

  async update(id: string, updates: Partial<OrderEntity>): Promise<Order> {
    const order = this.orders.get(id);
    if (!order) {
      throw new Error(`Order ${id} not found`);
    }

    const updated = new Order({
      ...order,
      ...updates,
      id: order.id,
      customer_id: order.customer_id,
      created_at: order.created_at
    });

    this.orders.set(id, updated);
    return updated;
  }

  async clear(): Promise<void> {
    this.orders.clear();
  }
}
