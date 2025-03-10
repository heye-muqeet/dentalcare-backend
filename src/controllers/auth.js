const { User } = require("../models/index");
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ where: { email } });

        if (!user) res.status(404).send({ error: "User Does Not exist" });
        
        const match = await bcrypt.compare(password, user.password)
        if (match) {
            const token = jwt.sign({
                id: user.id,
                email: user.email,
                role: user.role,
                branchId: user.branchId, // Added branch ID
            }, "maibhirozayrakhunga")
            res.send(token)
        }
        else {
            res.status(401).send("Invalid Credentials")
        }
    } catch (error) {
        console.log(error);
        res.status(500).send(error)
    }
}

module.exports = { login }