class AppError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
class ValidationError extends AppError { constructor(m){ super(400, m); } }
class NotFoundError extends AppError { constructor(m){ super(404, m); } }
class ConflictError extends AppError { constructor(m){ super(409, m); } }
class UnprocessableError extends AppError { constructor(m){ super(422, m); } }

module.exports = { AppError, ValidationError, NotFoundError, ConflictError, UnprocessableError };