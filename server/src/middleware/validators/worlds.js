import { body, param } from 'express-validator';

export const worldIdParamValidators = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('World ID must be a positive integer'),
];

export const createWorldValidators = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ max: 100 })
    .withMessage('Title must be at most 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must be at most 1000 characters'),
  body('is_public')
    .optional()
    .isBoolean()
    .withMessage('is_public must be a boolean'),
];

export const updateWorldValidators = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('World ID must be a positive integer'),
  body('title')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Title cannot be empty')
    .isLength({ max: 100 })
    .withMessage('Title must be at most 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must be at most 1000 characters'),
  body('cover_image')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('cover_image cannot be empty')
    .isLength({ max: 2048 })
    .withMessage('cover_image must be at most 2048 characters'),
  body('is_public')
    .optional()
    .isBoolean()
    .withMessage('is_public must be a boolean'),
];

export const updateMemberValidators = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('World ID must be a positive integer'),
  param('memberId')
    .isInt({ min: 1 })
    .withMessage('Member ID must be a positive integer'),
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['approved', 'rejected'])
    .withMessage('Status must be approved or rejected'),
];
