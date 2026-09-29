"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = exports.UserStatus = exports.UserRole = void 0;
const decimal_js_1 = __importDefault(require("decimal.js"));
var UserRole;
(function (UserRole) {
    UserRole["CUSTOMER"] = "CUSTOMER";
    UserRole["ADMIN"] = "ADMIN";
    UserRole["SUSPENDED"] = "SUSPENDED";
})(UserRole || (exports.UserRole = UserRole = {}));
var UserStatus;
(function (UserStatus) {
    UserStatus["ACTIVE"] = "ACTIVE";
    UserStatus["INACTIVE"] = "INACTIVE";
})(UserStatus || (exports.UserStatus = UserStatus = {}));
class User {
    id;
    email;
    passwordHash;
    role;
    status;
    cashBalance;
    createdAt;
    updatedAt;
    constructor(props) {
        this.id = props.id;
        this.email = props.email;
        this.passwordHash = props.passwordHash;
        this.role = props.role;
        this.status = props.status;
        this.cashBalance = props.cashBalance instanceof decimal_js_1.default
            ? props.cashBalance
            : new decimal_js_1.default(props.cashBalance);
        this.createdAt = props.createdAt;
        this.updatedAt = props.updatedAt;
    }
}
exports.User = User;
//# sourceMappingURL=user.js.map