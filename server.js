const express = require('express');
const app = express();
const sqlite3 = require('sqlite3').verbose();

const http = require('http');



const db = new sqlite3.Database("./mnt/highscores/production.sqlite");

// Create a highscores table if it doesn't exist
db.serialize(() => {
  db.run('CREATE TABLE IF NOT EXISTS highscores (id INTEGER PRIMARY KEY AUTOINCREMENT, playerName TEXT, score INTEGER)');
});

app.use(express.json());
app.use(express.static('public'));

// Serve the index.html file
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// Handle high score submission
app.post('/highscore', (req, res) => {
  const highscore = req.body;

  const query = 'INSERT INTO highscores (playerName, score) VALUES (?, ?)';
  db.run(query, [highscore.playerName, highscore.score], (err) => {
    if (err) {
      console.error(err);
      res.status(500).send('Error saving high score');
    } else {
      res.status(200).send('High score saved successfully');
    }
  });
});

// Retrieve highscores
app.get('/highscores', (req, res) => {
  const query = 'SELECT * FROM highscores ORDER BY score DESC';

  db.all(query, (err, rows) => {
    if (err) {
      console.error(err);
      res.status(500).send('Error retrieving high scores');
    } else {
      res.status(200).json(rows);
    }
  });
});

// Start the server
const port = 8080;
app.listen(port, () => {
  console.log('Server is running on port 8080');
});
