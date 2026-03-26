const ApiError = require('../utils/ApiError');

const authorizeRoles = (...roles) => (req, _res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(new ApiError('Access denied for this role.', 403));
  }

  return next();
};

module.exports = {
  authorizeRoles,
};
