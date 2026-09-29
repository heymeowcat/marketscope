import { Router } from 'express';
import { UserAdminService } from '../services/user-admin-service';
export interface UserAdminControllerDeps {
    userAdminService: UserAdminService;
}
export declare class UserAdminController {
    private router;
    private userAdminService;
    constructor(deps: UserAdminControllerDeps);
    private setupRoutes;
    private listUsers;
    private updateUserRole;
    private getAuditLogs;
    getRouter(): Router;
}
