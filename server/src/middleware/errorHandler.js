export const errorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  // Known application errors
  if (err.statusCode && err.errorCode) {
    return res.status(err.statusCode).json({
      error: err.errorCode,
      message: err.message,
      ...(err.details && { details: err.details }),
    });
  }

  // SQLite unique constraint violation
  if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
    return res.status(409).json({
      error: 'CONFLICT',
      message: 'A resource with this value already exists.',
    });
  }

  // JWT errors surfaced from auth middleware
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'UNAUTHORIZED',
      message: 'Invalid or expired token.',
    });
  }

  // Unhandled errors — do not leak internals
  const isDev = process.env.NODE_ENV === 'development';
  res.status(500).json({
    error: 'INTERNAL_ERROR',
    message: 'An unexpected error occurred.',
    ...(isDev && { stack: err.stack }),
  });
};
