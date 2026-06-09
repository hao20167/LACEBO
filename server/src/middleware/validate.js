import { validationResult } from 'express-validator';

export const validate = (validations) => {
  return async (req, res, next) => {
    for (const validation of validations) {
      await validation.run(req);
    }
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Input validation failed',
        details: errors.array().map((e) => ({ field: e.path, message: e.msg })),
      });
    }
    next();
  };
};
