const express = require('express');
const app = express();
const port = 3000;

// Set up static folder to serve static files (Bootstrap CSS and other assets)
app.use(express.static('public'));

// Middleware to parse request body as JSON
app.use(express.json());

app.get('/edit', (req, res) => {
  res.sendFile(__dirname + '/public/edit.html');
});

app.get('/daily', (req, res) => {
  res.sendFile(__dirname + '/public/daily.html');
});

app.get('/monthly', (req, res) => {
  res.sendFile(__dirname + '/public/monthly.html');
});

app.get('/yearly', (req, res) => {
  res.sendFile(__dirname + '/public/yearly.html');
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
