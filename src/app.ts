import express, { Express } from 'express';
import cors from 'cors';
import { UserRepository, IUserRepository } from './repositories/user-repository';
import { AuditLogRepository, IAuditLogRepository } from './repositories/audit-log-repository';
import { AuthService } from './services/auth-service';
import { UserAdminService } from './services/user-admin-service';
import { AuthController } from './controllers/auth-controller';
import { UserAdminController } from './controllers/user-admin-controller';
import { errorHandler } from './controllers/middleware';

export interface AppDeps {
  userRepository?: IUserRepository;
  auditLogRepository?: IAuditLogRepository;
}

export function createApp(deps?: AppDeps): Express {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());

  // Initialize repositories
  const userRepository = deps?.userRepository || new UserRepository();
  const auditLogRepository = deps?.auditLogRepository || new AuditLogRepository();

  // Initialize services
  const authService = new AuthService({ userRepository });
  const userAdminService = new UserAdminService({ userRepository, auditLogRepository });

  // Initialize controllers
  const authController = new AuthController({ authService });
  const userAdminController = new UserAdminController({ userAdminService });

  // Routes
  app.use('/api/v1/auth', authController.getRouter());
  app.use('/api/v1/admin', userAdminController.getRouter());

  // Health check
  app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  // Error handling
  app.use(errorHandler);

  return app;
}

export { UserRepository, AuditLogRepository, AuthService, UserAdminService };
