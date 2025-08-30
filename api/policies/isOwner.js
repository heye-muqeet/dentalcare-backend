/**
 * isOwner policy
 */

module.exports = function(req, res, proceed) {
  if (!req.user) {
    return res.status(401).json({ 
      status: 'error',
      error: sails.config.responses.AUTH.UNAUTHORIZED 
    });
  }

  if (req.user.role !== 'owner') {
    return res.status(403).json({ 
      status: 'error',
      error: sails.config.responses.AUTH.INSUFFICIENT_PERMISSIONS 
    });
  }

  return proceed();
}; 