import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { nanoid } from 'nanoid';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/views/index.html'));
});

app.get('/game', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/views/game.html'));
});

const rooms = new Map();

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('createRoom', () => {
        const roomId = nanoid(6);
        console.log('Creating new room:', roomId);
        
        rooms.set(roomId, {
            players: [socket.id],
            gameState: {
                word: '',
                guessedLetters: [],
                currentTurn: socket.id,
                gameStarted: false,
                disconnectedPlayers: new Set(),
            },
        });

        console.log('Current rooms:', Array.from(rooms.keys()));
        socket.join(roomId);
        socket.emit('roomCreated', roomId);
    });

    socket.on('joinRoom', (roomId) => {
        console.log('Attempt to join room:', roomId);
        const room = rooms.get(roomId);

        if (!room) {
            console.log('Room not found:', roomId);
            socket.emit('error', 'Room not found');
            return;
        }

        if (room.players.length >= 6) {
          // Don't count disconnected players in the limit
          const activePlayers = room.players.filter(id => !room.gameState.disconnectedPlayers.has(id));
          if (activePlayers.length >= 6) {
              console.log('Room is full');
              socket.emit('error', 'Room is full');
              return;
          }
        }

        room.gameState.disconnectedPlayers.delete(socket.id);

        if (!room.players.includes(socket.id)) {
            room.players.push(socket.id);
            console.log(`Player ${socket.id} joined room ${roomId}`);
        }
        
        socket.join(roomId);

        if (room.gameState.gameStarted) {
            socket.emit('gameState', room.gameState);
        } else {
            socket.emit('joinedRoom', roomId);
        }

        io.to(roomId).emit('playerJoined', {
            playerCount: room.players.length - room.gameState.disconnectedPlayers.size,
            playerId: socket.id
        });
    });

    socket.on('startGame', (roomId) => {
        console.log('Starting game in room:', roomId);
        const room = rooms.get(roomId);
        
        if (room) {
            room.gameState.gameStarted = true;
            room.gameState.word = 'WORD'; // Set your word here
            console.log('Game started in room:', roomId);
            io.to(roomId).emit('gameStarted', room.gameState);
        } else {
            console.log('Room not found when starting game:', roomId);
            socket.emit('error', 'Room not found');
        }
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
      for (const [roomId, room] of rooms.entries()) {
          const playerIndex = room.players.indexOf(socket.id);
          if (playerIndex !== -1) {
              // Instead of removing the player, mark them as disconnected
              room.gameState.disconnectedPlayers.add(socket.id);
              
              console.log(`Player ${socket.id} temporarily disconnected from room ${roomId}`);

              // Only delete room if all players have been disconnected for more than 5 minutes
              const activePlayersCount = room.players.length - room.gameState.disconnectedPlayers.size;
              
              if (activePlayersCount === 0) {
                  // Set a timeout to delete the room after 5 minutes if no one rejoins
                  setTimeout(() => {
                      const currentRoom = rooms.get(roomId);
                      if (currentRoom && 
                          currentRoom.players.length - currentRoom.gameState.disconnectedPlayers.size === 0) {
                          rooms.delete(roomId);
                          console.log(`Room ${roomId} deleted - no players rejoined after timeout`);
                      }
                  }, 5 * 60 * 1000); // 5 minutes
              }

              io.to(roomId).emit('playerLeft', {
                  playerCount: activePlayersCount,
                  playerId: socket.id
              });
          }
      }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});