/**
 * Policy to check if user can update another user
 * Owner can update any user
 * Users can only update their own information
 */

module.exports = async function (req, res, proceed) {
  // If user is not authenticated
  if (!req.user) {
    return res.status(401).json({ error: sails.config.responses.AUTH.NOT_AUTHENTICATED });
  }

  const { id } = req.params;

  // Owner can update any user
  if (req.user.role === 'owner') {
    return proceed();
  }
  console.log(req.user.id, id);
  console.log(req.user.id === id);
  // Users can only update their own information
  if (req.user.id === id) {
    return proceed();
  }

  // If none of the above conditions are met, deny access
  return res.status(403).json({ error: sails.config.responses.AUTH.UNAUTHORIZED });
}; 