"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvalidPasswordException = exports.DuplicateEmailException = exports.UserNotFoundException = exports.InvalidUserStateException = exports.RoleAccessDeniedException = exports.DomainException = void 0;
class DomainException extends Error {
    code;
    constructor(message, code) {
        super(message);
        this.code = code;
        this.name = this.constructor.name;
        Object.setPrototypeOf(this, DomainException.prototype);
    }
}
exports.DomainException = DomainException;
class RoleAccessDeniedException extends DomainException {
    constructor(message = 'Role access denied') {
        super(message, 'ROLE_ACCESS_DENIED');
        Object.setPrototypeOf(this, RoleAccessDeniedException.prototype);
    }
}
exports.RoleAccessDeniedException = RoleAccessDeniedException;
class InvalidUserStateException extends DomainException {
    constructor(message) {
        super(message, 'INVALID_USER_STATE');
        Object.setPrototypeOf(this, InvalidUserStateException.prototype);
    }
}
exports.InvalidUserStateException = InvalidUserStateException;
class UserNotFoundException extends DomainException {
    constructor(userId) {
        super(`User ${userId} not found`, 'USER_NOT_FOUND');
        Object.setPrototypeOf(this, UserNotFoundException.prototype);
    }
}
exports.UserNotFoundException = UserNotFoundException;
class DuplicateEmailException extends DomainException {
    constructor(email) {
        super(`Email ${email} already exists`, 'EMAIL_ALREADY_EXISTS');
        Object.setPrototypeOf(this, DuplicateEmailException.prototype);
    }
}
exports.DuplicateEmailException = DuplicateEmailException;
class InvalidPasswordException extends DomainException {
    constructor(message = 'Invalid password') {
        super(message, 'INVALID_PASSWORD');
        Object.setPrototypeOf(this, InvalidPasswordException.prototype);
    }
}
exports.InvalidPasswordException = InvalidPasswordException;
//# sourceMappingURL=exceptions.js.map