import { Request, Response, NextFunction } from 'express'
import { validationResult, type ValidationError as ExpressValidationError } from 'express-validator'
import { ValidationError } from '../utils/errors.js'

export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req)

    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map((error: ExpressValidationError) => ({
        field: error.type === 'field' ? error.path : error.type,
        message: error.msg || 'Invalid value',
        value: error.type === 'field' ? error.value : undefined,
        location: error.type === 'field' ? error.location : undefined,
      }))

      throw new ValidationError('Validation failed', errorMessages)
    }

    next()
  } catch (error) {
    next(error)
  }
}

export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  try {
    const sanitizeValue = (value: unknown): unknown => {
      if (typeof value === 'string') {
        return value
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/javascript:/gi, '')
          .replace(/on\w+\s*=/gi, '')
          .replace(/data:/gi, '')
          .replace(/vbscript:/gi, '')
          .trim()
      }

      if (Array.isArray(value)) {
        return value.map(sanitizeValue)
      }

      if (value && typeof value === 'object') {
        const sanitizedObj: Record<string, unknown> = {}
        for (const key in value) {
          if (Object.prototype.hasOwnProperty.call(value, key)) {
            sanitizedObj[key] = sanitizeValue((value as Record<string, unknown>)[key])
          }
        }
        return sanitizedObj
      }

      return value
    }

    if (req.body && typeof req.body === 'object') {
      req.body = sanitizeValue(req.body)
    }

    if (req.query && typeof req.query === 'object') {
      req.query = sanitizeValue(req.query) as typeof req.query
    }

    if (req.params && typeof req.params === 'object') {
      req.params = sanitizeValue(req.params) as typeof req.params
    }

    next()
  } catch (error) {
    next(error)
  }
}

export const validateRequest = (validations: { run: (req: Request) => Promise<unknown> }[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await Promise.all(validations.map(validation => validation.run(req)))
      handleValidationErrors(req, res, next)
    } catch (error) {
      next(error)
    }
  }
}