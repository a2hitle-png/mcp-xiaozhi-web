const express = require('express');
const path = require('path');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, '..', 'public')));

// Existing API routes
app.get('/api/news', (req, res) => {
  res.json({
    headlines: [
      'Breaking: AI assistant enhances productivity!',
      'Weather today: Sunny with a chance of innovation.',
      'Market update: Tech stocks soar on new advancements.',
    ],
  });
});

app.get('/api/search', (req, res) => {
  const q = (req.query.q || '').toString().trim();
  if (!q) {
    return res.status(400).json({ error: 'Missing search query parameter q' });
  }

  const encoded = encodeURIComponent(q);
  const searchUrl = `https://www.google.com/search?q=${encoded}`;

  res.json({ query: q, searchUrl });
});

// New music search API route
app.get('/api/music/search', (req, res) => {
  const q = (req.query.q || '').toString().trim();
  if (!q) {
    return res.status(400).json({ error: 'Missing music search query parameter q' });
  }

  const encoded = encodeURIComponent(q);
  const searchUrl = `https://www.youtube.com/results?search_query=${encoded}`;

  res.json({ query: q, searchUrl });
});

// WebSocket handling
wss.on('connection', (ws) => {
  console.log('Client connected');

  ws.on('message', (message) => {
    console.log('received: %s', message);

    // Example: echo the message back
    ws.send(JSON.stringify({
      type: 'echo',
      payload: message.toString(),
    }));
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
