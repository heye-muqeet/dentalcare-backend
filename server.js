import express, { json } from 'express';
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(json());

// Basic Route
app.get('/', (req, res) => {
    res.send('Welcome to DENTALCARE BACKEND...!');
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
