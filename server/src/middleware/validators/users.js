import { body, param } from 'express-validator';

export const registerValidators = [
  body('username')
    .trim()
    .notEmpty().withMessage('Username is required')
    .isLength({ min: 3, max: 30 }).withMessage('Username must be 3-30 characters')
    .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username can only contain letters, numbers, and underscores'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('display_name')
    .trim()
    .notEmpty().withMessage('Display name is required')
    .isLength({ max: 50 }).withMessage('Display name must be at most 50 characters'),
];

export const loginValidators = [
  body('username').trim().notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

export const userIdParamValidators = [
  param('id').isInt({ min: 1 }).withMessage('User ID must be a positive integer'),
];
