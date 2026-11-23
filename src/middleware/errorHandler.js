const { AppError } = require('../utils/errors');

function notFound(req, res) {
  res.status(404).json({ error: 'Route not found' });
}

function errorHandler(err, req, res, next) { // eslint-disable-line
  if (err instanceof AppError) {
    return res.status(err.status).json({ error: err.message });
  }
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({ error: 'Duplicate entry — slot already taken' });
  }
  if (err.code === 'ER_ROW_IS_REFERENCED_2') {
    return res.status(409).json({ error: 'Cannot delete: record has appointments' });
  }
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
}

module.exports = { notFound, errorHandler };