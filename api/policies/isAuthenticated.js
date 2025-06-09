/**
 * isAuthenticated policy
 */

const jwt = require('jsonwebtoken');

module.exports = async function (req, res, proceed) {
  try {
    // Get token from header
    const token = req.cookies.token; // instead of req.headers.authorization
    if (!token) {
      return res.status(401).json({
        status: 'error',
        error: sails.config.responses.AUTH.NOT_AUTHENTICATED,
        message: 'No token provided'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, sails.config.jwt.secret);

    // Find user
    const user = await User.findOne({ 
      id: decoded.id,
      status: 'active',
      deletedAt: 0
    });

    if (!user) {
      return res.status(401).json({
        status: 'error',
        error: sails.config.responses.AUTH.NOT_AUTHENTICATED,
        message: 'User not found or inactive'
      });
    }

    // Attach user to request
    req.user = user;
    return proceed();
  } catch (err) {
    sails.log.error('Token verification error:', err);

    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        status: 'error',
        error: sails.config.responses.AUTH.TOKEN_EXPIRED,
        message: 'Token has expired',
        expiredAt: err.expiredAt
      });
    }

    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({
        status: 'error',
        error: sails.config.responses.AUTH.INVALID_TOKEN,
        message: 'Invalid token'
      });
    }

    return res.status(401).json({
      status: 'error',
      error: sails.config.responses.AUTH.NOT_AUTHENTICATED,
      message: 'Authentication failed'
    });
  }
}; 