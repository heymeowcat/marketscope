import { OrderStatus } from './order';
import { InvalidOrderStateException } from './exceptions';

export class OrderStateMachine {
  private state: OrderStatus | null = null;

  // Valid transitions map
  private readonly validTransitions: Map<OrderStatus, OrderStatus[]> = new Map([
    [OrderStatus.PENDING, [OrderStatus.EXECUTED, OrderStatus.CANCELLED, OrderStatus.REJECTED]],
    [OrderStatus.EXECUTED, []],
    [OrderStatus.CANCELLED, []],
    [OrderStatus.REJECTED, []]
  ]);

  initialize(initialState: OrderStatus): void {
    this.state = initialState;
  }

  currentState(): OrderStatus {
    if (this.state === null) {
      throw new Error('State machine not initialized');
    }
    return this.state;
  }

  transition(targetState: OrderStatus): void {
    if (this.state === null) {
      throw new Error('State machine not initialized');
    }

    const allowed = this.validTransitions.get(this.state) || [];

    if (!allowed.includes(targetState)) {
      throw new InvalidOrderStateException(
        `Cannot transition order from ${this.state} to ${targetState}`
      );
    }

    this.state = targetState;
  }
}
