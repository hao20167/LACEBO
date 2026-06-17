import { body, param } from 'express-validator';

export const createPostValidators = [
  body('content')
    .trim()
    .notEmpty()
    .withMessage('Content is required')
    .isLength({ max: 5000 })
    .withMessage('Content must be at most 5000 characters'),
  body('image_url')
    .optional()
    .isURL()
    .withMessage('image_url must be a valid URL'),
];

export const createCommentValidators = [
  param('postId')
    .isInt({ min: 1 })
    .withMessage('Post ID must be a positive integer'),
  body('content')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Comment must be at most 2000 characters'),
  body('image_url')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 2048 })
    .withMessage('image_url must be at most 2048 characters'),
  body('parent_id')
    .optional({ nullable: true, checkFalsy: true })
    .isInt({ min: 1 })
    .withMessage('parent_id must be a positive integer'),
];

export const createAnnouncementValidators = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ max: 150 })
    .withMessage('Title must be at most 150 characters'),
  body('content')
    .trim()
    .notEmpty()
    .withMessage('Content is required')
    .isLength({ max: 5000 })
    .withMessage('Content must be at most 5000 characters'),
];

export const updatePostValidators = [
  param('postId')
    .isInt({ min: 1 })
    .withMessage('Post ID must be a positive integer'),
  body('content')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Content cannot be empty')
    .isLength({ max: 5000 })
    .withMessage('Content must be at most 5000 characters'),
  body('image_url')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('image_url cannot be empty')
    .isLength({ max: 2048 })
    .withMessage('image_url must be at most 2048 characters'),
];
