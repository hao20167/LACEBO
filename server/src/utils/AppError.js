export class AppError extends Error {
  constructor(statusCode, errorCode, message, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
  }
}

export const ErrorCodes = {
  // 400
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_STATUS: 'INVALID_STATUS',
  EVENT_NOT_OPEN: 'EVENT_NOT_OPEN',
  POST_NOT_PENDING: 'POST_NOT_PENDING',
  // 401
  UNAUTHORIZED: 'UNAUTHORIZED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  // 403
  FORBIDDEN: 'FORBIDDEN',
  DEV_ONLY: 'DEV_ONLY',
  NOT_MEMBER: 'NOT_MEMBER',
  // 404
  NOT_FOUND: 'NOT_FOUND',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  WORLD_NOT_FOUND: 'WORLD_NOT_FOUND',
  EVENT_NOT_FOUND: 'EVENT_NOT_FOUND',
  POST_NOT_FOUND: 'POST_NOT_FOUND',
  // 409
  CONFLICT: 'CONFLICT',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  // 429
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  // 500
  INTERNAL_ERROR: 'INTERNAL_ERROR',
};
