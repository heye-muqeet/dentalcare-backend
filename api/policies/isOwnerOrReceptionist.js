module.exports = async function (req, res, proceed) {
    const role = req.user?.role;
    if (role === 'owner' || role === 'receptionist') {
        return proceed();
    }
    return res.status(403).json({
        status: 'error',
        error: sails.config.responses.AUTH.INSUFFICIENT_PERMISSIONS
    });
};
