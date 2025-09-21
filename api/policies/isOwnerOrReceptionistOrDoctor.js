/**
 * isOwnerOrReceptionistOrDoctor policy
 * 
 * This policy checks if the authenticated user has one of the following roles:
 * - owner
 * - receptionist
 * - doctor
 */

module.exports = async function (req, res, proceed) {
  // Check if user is authenticated first
  if (!req.user) {
    return res.status(401).json({
      status: 'error',
      error: sails.config.responses.GENERIC.UNAUTHORIZED
    });
  }

  // Check if user has one of the required roles
  const allowedRoles = ['owner', 'receptionist', 'doctor'];
  if (allowedRoles.includes(req.user.role)) {
    return proceed();
  }

  // If user doesn't have required role
  return res.status(403).json({
    status: 'error',
    error: sails.config.responses.GENERIC.FORBIDDEN
  });
}; 