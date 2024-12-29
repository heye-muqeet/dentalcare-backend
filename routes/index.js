const express = require('express');
const router = express.Router();

// Example routes
router.get('/users', (req, res) => {
    res.json({ message: 'List of users' });
});

router.post('/users', (req, res) => {
    const newUser = req.body;
    res.json({ message: 'User created', user: newUser });
});

module.exports = router;
