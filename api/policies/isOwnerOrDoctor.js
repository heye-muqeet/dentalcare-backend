/**
 * isOwnerOrDoctor policy
 * 
 * This policy checks if the authenticated user has one of the following roles:
 * - owner
 * - doctor
 */

module.exports = async function (req, res, proceed) {
  // Check if user is authenticated first
  if (!req.user) {
    return res.status(401).json({
      status: 'error',
      error: sails.config.responses.AUTH.UNAUTHORIZED
    });
  }

  const role = req.user.role;
  if (role === 'owner' || role === 'doctor') {
    return proceed();
  }

  return res.status(403).json({
    status: 'error',
    error: sails.config.responses.AUTH.INSUFFICIENT_PERMISSIONS
  });
}; 