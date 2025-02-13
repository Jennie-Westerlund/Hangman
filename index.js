import express from 'express';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { Server } from 'socket.io';

const app = express();
const server = createServer(app);
const io = new Server(server);

const __dirname = dirname(fileURLToPath(import.meta.url));

// Serve index.html correctly
app.get('/', (req, res) => {
  res.sendFile(join(__dirname, './public/views/index.html'));
});

io.on('connection', (socket) => {
    socket.on('chat message', (msg) => {
      io.emit('chat message', msg);
    });
  });

// Serve static files (CSS, JS, images) if needed
app.use(express.static(join(__dirname, 'public')));

server.listen(3000, () => {
  console.log('Server running at http://localhost:3000');
});
