import { body, param } from 'express-validator';

export const createEventValidators = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ max: 100 }).withMessage('Title must be at most 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 }).withMessage('Description must be at most 2000 characters'),
  body('event_type')
    .optional()
    .isIn(['big', 'small']).withMessage('event_type must be big or small'),
  body('start_date')
    .optional()
    .isISO8601().withMessage('start_date must be a valid ISO 8601 date'),
  body('end_date')
    .optional()
    .isISO8601().withMessage('end_date must be a valid ISO 8601 date'),
];

export const updateEventValidators = [
  param('eventId').isInt({ min: 1 }).withMessage('Event ID must be a positive integer'),
  body('status')
    .optional()
    .isIn(['proposed', 'approved', 'open', 'closed', 'rejected']).withMessage('Invalid event status'),
  body('title')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Title must be at most 100 characters'),
];
