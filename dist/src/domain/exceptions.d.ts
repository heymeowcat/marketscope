export declare class DomainException extends Error {
    readonly code: string;
    constructor(message: string, code: string);
}
export declare class RoleAccessDeniedException extends DomainException {
    constructor(message?: string);
}
export declare class InvalidUserStateException extends DomainException {
    constructor(message: string);
}
export declare class UserNotFoundException extends DomainException {
    constructor(userId: string);
}
export declare class DuplicateEmailException extends DomainException {
    constructor(email: string);
}
export declare class InvalidPasswordException extends DomainException {
    constructor(message?: string);
}
