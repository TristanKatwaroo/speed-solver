const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3000;

let leaderboard = [];

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.get('/leaderboard', (req, res) => {
    res.json(leaderboard);
});

app.post('/leaderboard', (req, res) => {
    const { name, score } = req.body;
    leaderboard.push({ name, score });
    leaderboard.sort((a, b) => b.score - a.score);
    leaderboard = leaderboard.slice(0, 5);
    res.status(200).send('Score added');
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
