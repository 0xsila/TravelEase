// File: middleware/errorHandler.js
const { ValidationError } = require('express-validator');
const mongoose = require('mongoose');

// Error types
const ERROR_TYPES = {
  VALIDATION: 'ValidationError',
  DB: 'DatabaseError',
  AUTH: 'AuthenticationError',
  FORBIDDEN: 'ForbiddenError',
  NOT_FOUND: 'NotFoundError',
  SERVER: 'ServerError'
};

// Custom error class
class AppError extends Error {
  constructor(message, type, statusCode, details = null) {
    super(message);
    this.type = type;
    this.statusCode = statusCode;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Error handler middleware
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);
  
  // Default error object
  let error = {
    success: false,
    message: err.message || 'Internal Server Error',
    type: err.type || ERROR_TYPES.SERVER,
    statusCode: err.statusCode || 500
  };
  
  // Add details in development mode
  if (process.env.NODE_ENV === 'development') {
    error.stack = err.stack;
    if (err.details) error.details = err.details;
  }
  
  // Handle mongoose validation errors
  if (err instanceof mongoose.Error.ValidationError) {
    error.type = ERROR_TYPES.VALIDATION;
    error.statusCode = 400;
    error.message = 'Validation failed';
    error.details = Object.values(err.errors).map(e => ({
      field: e.path,
      message: e.message
    }));
  }
  
  // Handle mongoose duplicate key errors
  if (err.code === 11000) {
    error.type = ERROR_TYPES.VALIDATION;
    error.statusCode = 400;
    error.message = 'Duplicate field value entered';
    const field = Object.keys(err.keyValue)[0];
    error.details = [{
      field,
      message: `${field} already exists`
    }];
  }
  
  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    error.type = ERROR_TYPES.AUTH;
    error.statusCode = 401;
    error.message = 'Invalid token';
  }
  
  // Handle token expired error
  if (err.name === 'TokenExpiredError') {
    error.type = ERROR_TYPES.AUTH;
    error.statusCode = 401;
    error.message = 'Token expired';
  }
  
  // Send response
  res.status(error.statusCode).json({
    success: false,
    message: error.message,
    type: error.type,
    ...(error.details && { errors: error.details }),
    ...(error.stack && { stack: error.stack })
  });
};

// Error factory functions
const createValidationError = (message, details) => new AppError(message, ERROR_TYPES.VALIDATION, 400, details);
const createAuthError = (message) => new AppError(message, ERROR_TYPES.AUTH, 401);
const createForbiddenError = (message) => new AppError(message, ERROR_TYPES.FORBIDDEN, 403);
const createNotFoundError = (message) => new AppError(message, ERROR_TYPES.NOT_FOUND, 404);
const createServerError = (message) => new AppError(message, ERROR_TYPES.SERVER, 500);

module.exports = {
  errorHandler,
  AppError,
  ERROR_TYPES,
  createValidationError,
  createAuthError,
  createForbiddenError,
  createNotFoundError,
  createServerError
};