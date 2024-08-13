const express = require('express'); // Import the Express module
// const bodyParser = require('body-parser'); // (Commented out) Middleware for parsing request bodies
const app = express(); // Create an instance of an Express application
const PORT = 3000; // Define the port number where the server will listen

let leaderboard = []; // Initialize an empty array to store leaderboard data

// app.use(bodyParser.json()); // (Commented out) Use body-parser to parse JSON bodies into JS objects
app.use(express.static('public')); // Serve static files from the 'public' directory

// Define a GET route to retrieve the leaderboard data
app.get('/leaderboard', (req, res) => {
    res.json(leaderboard); // Send the leaderboard array as a JSON response
});

// Define a POST route to add a new score to the leaderboard
app.post('/leaderboard', (req, res) => {
    const { name, score } = req.body; // Destructure 'name' and 'score' from the request body
    leaderboard.push({ name, score }); // Add the new score to the leaderboard array
    leaderboard.sort((a, b) => a.score - b.score); // Sort the leaderboard in ascending order by score
    leaderboard = leaderboard.slice(0, 10); // Keep only the top 10 scores
    res.status(200).send('Score added'); // Respond with a success message
});

// Start the server and listen on the specified port
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`); // Log a message to the console when the server starts
});
