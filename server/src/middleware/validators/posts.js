import { body, param } from 'express-validator';

export const createPostValidators = [
  body('content')
    .trim()
    .notEmpty().withMessage('Content is required')
    .isLength({ max: 5000 }).withMessage('Content must be at most 5000 characters'),
  body('image_url')
    .optional()
    .isURL().withMessage('image_url must be a valid URL'),
];

export const createCommentValidators = [
  param('postId').isInt({ min: 1 }).withMessage('Post ID must be a positive integer'),
  body('content')
    .trim()
    .notEmpty().withMessage('Content is required')
    .isLength({ max: 2000 }).withMessage('Comment must be at most 2000 characters'),
];

export const createAnnouncementValidators = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ max: 150 }).withMessage('Title must be at most 150 characters'),
  body('content')
    .trim()
    .notEmpty().withMessage('Content is required')
    .isLength({ max: 5000 }).withMessage('Content must be at most 5000 characters'),
];

export const updatePostValidators = [
  param('postId').isInt({ min: 1 }).withMessage('Post ID must be a positive integer'),
  body('content')
    .trim()
    .notEmpty().withMessage('Content is required')
    .isLength({ max: 5000 }).withMessage('Content must be at most 5000 characters'),
];
