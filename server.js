const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 5000;

let leaderboard = [];

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Route to handle GET requests to '/leaderboard'
// This returns the current leaderboard as a JSON response
app.get('/leaderboard', (req, res) => {
    res.json(leaderboard); // Respond with the current leaderboard array in JSON format
});

// Route to handle POST requests to '/leaderboard'
// This route accepts a new leaderboard entry, adds it to the leaderboard, sorts the leaderboard, and trims it to the top 5 entries
app.post('/leaderboard', (req, res) => {
    const { name, score } = req.body; // Extracting the 'name' and 'score' from the request body
    leaderboard.push({ name, score }); // Adding the new entry to the leaderboard array
    leaderboard.sort((a, b) => b.score - a.score); // Sorting the leaderboard in descending order
    leaderboard = leaderboard.slice(0, 5); // Trimming the leaderboard to keep only the top 5 scores
    res.status(200).json({ message: 'Score added' }); // Responding with a success message in JSON format
});

// Starting the Express server and making it listen on the specified port
// The callback function logs a message to the console when the server starts successfully
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
