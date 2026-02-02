export class AppError extends Error {
  statusCode: number
  constructor(message: string, statusCode = 500) {
    super(message)
    this.statusCode = statusCode
  }
}

export class ValidationError extends AppError {
  details: Record<string, unknown>
  constructor(message: string, details: Record<string, unknown>) {
    super(message, 400)
    this.details = details
  }
}