const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = 3000;

let leaderboard = [];

app.use(cors());
app.use(bodyParser.json());

app.get('/leaderboard', (req, res) => {
    res.json(leaderboard);
});

app.post('/leaderboard', (req, res) => {
    const newEntry = req.body;
    leaderboard.push(newEntry);
    leaderboard.sort((a, b) => a.score - b.score);
    leaderboard = leaderboard.slice(0, 10); // Keep top 10 entries
    res.status(201).send('Leaderboard updated');
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
