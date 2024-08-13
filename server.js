const express = require('express');
// const bodyParser = require('body-parser');
const app = express();
const PORT = 3000;

let leaderboard = [];

// app.use(bodyParser.json());
app.use(express.static('public'));

app.get('/leaderboard', (req, res) => {
    res.json(leaderboard);
});

app.post('/leaderboard', (req, res) => {
    const { name, score } = req.body;
    leaderboard.push({ name, score });
    leaderboard.sort((a, b) => a.score - b.score);
    leaderboard = leaderboard.slice(0, 10); // Keep top 10
    res.status(200).send('Score added');
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
