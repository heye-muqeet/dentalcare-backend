const express = require("express");
const { addUser, getUsers } = require("../controllers/user");
const authenticate = require("../middleware/auth");

const router = express.Router();

// router.route("/").get(getUsers)
router.route("/").post(authenticate,addUser)
router.route("/").get(authenticate,getUsers)

module.exports = router;