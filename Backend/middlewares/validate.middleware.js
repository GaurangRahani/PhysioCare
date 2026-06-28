export const validate = (schema) => (req, res, next) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (error) {
    if (error.errors) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: error.errors.map(err => ({
          path: err.path ? err.path.join('.') : 'unknown',
          message: err.message
        }))
      });
    }

    return res.status(400).json({
      success: false,
      message: 'Invalid request data',
      error: error.message
    });
  }
};
