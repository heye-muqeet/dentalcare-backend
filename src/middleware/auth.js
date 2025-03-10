const jwt = require("jsonwebtoken");
const { User } = require("../models/index");

const authenticate = async (req, res, next) => {
    try {
        const token = req.header("Authorization")?.split(" ")[1]; // Extract token

        if (!token) {
            return res.status(401).json({ error: "Access denied. No token provided." });
        }

        const decoded = jwt.verify(token, "maibhirozayrakhunga");
        console.log(decoded);
        req.user = decoded;
        next(); 
    } catch (error) {
        res.status(401).json({ error: "Invalid or expired token." });
    }
};

module.exports = authenticate;
