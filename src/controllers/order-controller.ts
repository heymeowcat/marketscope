import { Router, Response } from 'express';
import Decimal from 'decimal.js';
import { OrderService } from '../services/order-service';
import { OrderSide, OrderType, OrderStatus } from '../domain/order';
import {
  InvalidOrderStateException,
  InsufficientFundsException,
  StockNotFoundException
} from '../domain/exceptions';
import { AuthenticatedRequest, parseJwt } from './middleware';

export interface OrderControllerDeps {
  orderService: OrderService;
}

export class OrderController {
  private router: Router;
  private orderService: OrderService;

  constructor(deps: OrderControllerDeps) {
    this.orderService = deps.orderService;
    this.router = Router();
    this.setupRoutes();
  }

  private setupRoutes(): void {
    this.router.get('/', parseJwt, this.listOrders.bind(this));
    this.router.get('/:id', parseJwt, this.getOrder.bind(this));
    this.router.post('/', parseJwt, this.placeOrder.bind(this));
    this.router.post('/:id/cancel', parseJwt, this.cancelOrder.bind(this));
    this.router.post('/:id/execute', this.executeOrder.bind(this)); // Internal endpoint
  }

  getRouter(): Router {
    return this.router;
  }

  private async listOrders(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const customerId = req.user?.user_id || req.user?.userId;
      if (!customerId) {
        res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required'
          }
        });
        return;
      }

      const orders = await this.orderService.listOrdersByCustomerId(customerId);
      res.status(200).json({
        orders: orders.map(o => this.orderService.toResponse(o))
      });
    } catch (error) {
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: (error as Error).message || 'An unexpected error occurred'
        }
      });
    }
  }

  private async getOrder(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Order ID is required'
          }
        });
        return;
      }

      const order = await this.orderService.getOrder(id);
      if (!order) {
        res.status(404).json({
          error: {
            code: 'ORDER_NOT_FOUND',
            message: `Order ${id} not found`
          }
        });
        return;
      }

      res.status(200).json({
        order: this.orderService.toResponse(order)
      });
    } catch (error) {
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: (error as Error).message || 'An unexpected error occurred'
        }
      });
    }
  }

  private async placeOrder(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const customerId = req.user?.user_id || req.user?.userId;
      if (!customerId) {
        res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required'
          }
        });
        return;
      }

      const { symbol, side, order_type, quantity, limit_price } = req.body;

      // Validate input
      if (!symbol || typeof symbol !== 'string') {
        res.status(422).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Symbol is required and must be a string'
          }
        });
        return;
      }

      if (!side || !Object.values(OrderSide).includes(side)) {
        res.status(422).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: `Side must be one of: ${Object.values(OrderSide).join(', ')}`
          }
        });
        return;
      }

      if (!order_type || !Object.values(OrderType).includes(order_type)) {
        res.status(422).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: `Order type must be one of: ${Object.values(OrderType).join(', ')}`
          }
        });
        return;
      }

      if (typeof quantity !== 'number' || quantity <= 0) {
        res.status(422).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Quantity must be a positive number'
          }
        });
        return;
      }

      if (order_type === OrderType.LIMIT && !limit_price) {
        res.status(422).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'limit_price is required for LIMIT orders'
          }
        });
        return;
      }

      const limitPriceDecimal = limit_price ? new Decimal(limit_price) : null;

      const order = await this.orderService.placeOrder(
        customerId,
        symbol,
        side as OrderSide,
        order_type as OrderType,
        quantity,
        limitPriceDecimal
      );

      res.status(201).json({
        order: this.orderService.toResponse(order)
      });
    } catch (error) {
      if (error instanceof InsufficientFundsException) {
        res.status(400).json({
          error: {
            code: error.code,
            message: error.message,
            required: error.required,
            available: error.available
          }
        });
        return;
      }

      if (error instanceof StockNotFoundException) {
        res.status(404).json({
          error: {
            code: error.code,
            message: error.message
          }
        });
        return;
      }

      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: (error as Error).message || 'An unexpected error occurred'
        }
      });
    }
  }

  private async cancelOrder(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Order ID is required'
          }
        });
        return;
      }

      const order = await this.orderService.cancelOrder(id);
      res.status(200).json({
        order: this.orderService.toResponse(order)
      });
    } catch (error) {
      if (error instanceof InvalidOrderStateException) {
        res.status(409).json({
          error: {
            code: error.code,
            message: error.message
          }
        });
        return;
      }

      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: (error as Error).message || 'An unexpected error occurred'
        }
      });
    }
  }

  private async executeOrder(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { executed_price } = req.body;

      if (!id) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Order ID is required'
          }
        });
        return;
      }

      if (!executed_price) {
        res.status(422).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'executed_price is required'
          }
        });
        return;
      }

      const executedPriceDecimal = new Decimal(executed_price);
      const order = await this.orderService.executeOrder(id, executedPriceDecimal);

      res.status(200).json({
        order: this.orderService.toResponse(order)
      });
    } catch (error) {
      if (error instanceof InvalidOrderStateException) {
        res.status(409).json({
          error: {
            code: error.code,
            message: error.message
          }
        });
        return;
      }

      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: (error as Error).message || 'An unexpected error occurred'
        }
      });
    }
  }
}
