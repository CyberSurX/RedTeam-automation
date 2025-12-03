export class AppError extends Error {
  statusCode: number
  constructor(message: string, statusCode = 500) {
    super(message)
    this.statusCode = statusCode
  }
}

export class ValidationError extends AppError {
  details: any
  constructor(message: string, details: any) {
    super(message, 400)
    this.details = details
  }
}