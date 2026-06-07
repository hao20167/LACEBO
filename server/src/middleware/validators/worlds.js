import { body, param } from 'express-validator';

export const createWorldValidators = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ max: 100 }).withMessage('Title must be at most 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Description must be at most 1000 characters'),
  body('is_public')
    .optional()
    .isBoolean().withMessage('is_public must be a boolean'),
];

export const updateMemberValidators = [
  param('id').isInt({ min: 1 }).withMessage('World ID must be a positive integer'),
  param('memberId').isInt({ min: 1 }).withMessage('Member ID must be a positive integer'),
  body('status')
    .notEmpty().withMessage('Status is required')
    .isIn(['approved', 'rejected']).withMessage('Status must be approved or rejected'),
];
