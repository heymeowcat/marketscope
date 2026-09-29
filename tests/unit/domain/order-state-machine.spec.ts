import { describe, it, expect } from 'vitest';
import { OrderStateMachine } from '../../../src/domain/order-state-machine';
import { OrderStatus } from '../../../src/domain/order';
import { InvalidOrderStateException } from '../../../src/domain/exceptions';

// [AC-07] Order Lifecycle State Machine Enforcement
describe('OrderStateMachine', () => {
  describe('valid transitions', () => {
    // [AC-07-A] Valid transition: PENDING -> EXECUTED
    it('[AC-07-A] should allow transition from PENDING to EXECUTED', () => {
      const machine = new OrderStateMachine();
      machine.initialize(OrderStatus.PENDING);

      expect(() => machine.transition(OrderStatus.EXECUTED)).not.toThrow();
      expect(machine.currentState()).toBe(OrderStatus.EXECUTED);
    });

    // [AC-07] Valid transition: PENDING -> CANCELLED
    it('[AC-07] should allow transition from PENDING to CANCELLED', () => {
      const machine = new OrderStateMachine();
      machine.initialize(OrderStatus.PENDING);

      expect(() => machine.transition(OrderStatus.CANCELLED)).not.toThrow();
      expect(machine.currentState()).toBe(OrderStatus.CANCELLED);
    });

    // [AC-07] Valid transition: PENDING -> REJECTED
    it('[AC-07] should allow transition from PENDING to REJECTED', () => {
      const machine = new OrderStateMachine();
      machine.initialize(OrderStatus.PENDING);

      expect(() => machine.transition(OrderStatus.REJECTED)).not.toThrow();
      expect(machine.currentState()).toBe(OrderStatus.REJECTED);
    });
  });

  describe('illegal transitions', () => {
    // [AC-07-B] Illegal transition: EXECUTED -> CANCELLED
    it('[AC-07-B] should reject transition from EXECUTED to CANCELLED', () => {
      const machine = new OrderStateMachine();
      machine.initialize(OrderStatus.PENDING);
      machine.transition(OrderStatus.EXECUTED);

      expect(() => machine.transition(OrderStatus.CANCELLED)).toThrow(
        InvalidOrderStateException
      );
      expect(() => machine.transition(OrderStatus.CANCELLED)).toThrow(
        'Cannot transition order from EXECUTED to CANCELLED'
      );
    });

    // [AC-07-B] Illegal transition: EXECUTED -> PENDING
    it('[AC-07-B] should reject transition from EXECUTED to PENDING', () => {
      const machine = new OrderStateMachine();
      machine.initialize(OrderStatus.PENDING);
      machine.transition(OrderStatus.EXECUTED);

      expect(() => machine.transition(OrderStatus.PENDING)).toThrow(
        InvalidOrderStateException
      );
    });

    // [AC-07-B] Illegal transition: EXECUTED -> REJECTED
    it('[AC-07-B] should reject transition from EXECUTED to REJECTED', () => {
      const machine = new OrderStateMachine();
      machine.initialize(OrderStatus.PENDING);
      machine.transition(OrderStatus.EXECUTED);

      expect(() => machine.transition(OrderStatus.REJECTED)).toThrow(
        InvalidOrderStateException
      );
    });

    // [AC-07-B] Illegal transition: CANCELLED -> EXECUTED
    it('[AC-07-B] should reject transition from CANCELLED to EXECUTED', () => {
      const machine = new OrderStateMachine();
      machine.initialize(OrderStatus.PENDING);
      machine.transition(OrderStatus.CANCELLED);

      expect(() => machine.transition(OrderStatus.EXECUTED)).toThrow(
        InvalidOrderStateException
      );
    });

    // [AC-07-B] Illegal transition: CANCELLED -> PENDING
    it('[AC-07-B] should reject transition from CANCELLED to PENDING', () => {
      const machine = new OrderStateMachine();
      machine.initialize(OrderStatus.PENDING);
      machine.transition(OrderStatus.CANCELLED);

      expect(() => machine.transition(OrderStatus.PENDING)).toThrow(
        InvalidOrderStateException
      );
    });

    // [AC-07-B] Illegal transition: REJECTED -> EXECUTED
    it('[AC-07-B] should reject transition from REJECTED to EXECUTED', () => {
      const machine = new OrderStateMachine();
      machine.initialize(OrderStatus.PENDING);
      machine.transition(OrderStatus.REJECTED);

      expect(() => machine.transition(OrderStatus.EXECUTED)).toThrow(
        InvalidOrderStateException
      );
    });
  });

  describe('initialization', () => {
    // [AC-07] PENDING is only valid starting state
    it('[AC-07] should initialize in PENDING state', () => {
      const machine = new OrderStateMachine();
      machine.initialize(OrderStatus.PENDING);

      expect(machine.currentState()).toBe(OrderStatus.PENDING);
    });
  });
});
