const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const routes = require('./routes/index');

// Middleware
app.use(express.json());
app.use('/api', routes);

// Basic Route
app.get('/', (req, res) => {
    res.send('Welcome to DENTALCARE BACKEND...!');
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
