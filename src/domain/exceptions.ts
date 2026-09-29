export class DomainException extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, DomainException.prototype);
  }
}

export class RoleAccessDeniedException extends DomainException {
  constructor(message: string = 'Role access denied') {
    super(message, 'ROLE_ACCESS_DENIED');
    Object.setPrototypeOf(this, RoleAccessDeniedException.prototype);
  }
}

export class InvalidUserStateException extends DomainException {
  constructor(message: string) {
    super(message, 'INVALID_USER_STATE');
    Object.setPrototypeOf(this, InvalidUserStateException.prototype);
  }
}

export class UserNotFoundException extends DomainException {
  constructor(userId: string) {
    super(`User ${userId} not found`, 'USER_NOT_FOUND');
    Object.setPrototypeOf(this, UserNotFoundException.prototype);
  }
}

export class DuplicateEmailException extends DomainException {
  constructor(email: string) {
    super(`Email ${email} already exists`, 'EMAIL_ALREADY_EXISTS');
    Object.setPrototypeOf(this, DuplicateEmailException.prototype);
  }
}

export class InvalidPasswordException extends DomainException {
  constructor(message: string = 'Invalid password') {
    super(message, 'INVALID_PASSWORD');
    Object.setPrototypeOf(this, InvalidPasswordException.prototype);
  }
}
