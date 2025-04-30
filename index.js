import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { customAlphabet } from 'nanoid';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';
import words from './src/models/database.js';
import { getRandomWord } from './src/helpers/word.functions.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const nanoid = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ', 5);
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

    socket.on('createRoom', () => {
        const roomId = nanoid(5);
        
        rooms.set(roomId, {
            players: [socket.id],
            gameState: {
                word: '',
                guessedLetters: [],
                gameStarted: false,
                disconnectedPlayers: new Set(),
                wrongGuessCount: 0
            },
        });

        socket.join(roomId);
        socket.emit('roomCreated', roomId);
    });

    socket.on('joinRoom', (roomId) => {
        const room = rooms.get(roomId);

        if (!room) {
            socket.emit('error', {
                message: 'Room not found',
                code: 'ROOM_NOT_FOUND'
            });
            return;
        }

        const activePlayers = room.players.filter(id => !room.gameState.disconnectedPlayers.has(id));
        
        if (activePlayers.length >= 6) {
            socket.emit('error', {
                message: 'Room is full',
                code: 'ROOM_FULL'
            });
            return;
        }

        room.gameState.disconnectedPlayers.delete(socket.id);

        if (!room.players.includes(socket.id)) {
            room.players.push(socket.id);
        }
        
        socket.join(roomId);

        if (room.gameState.gameStarted) {
            socket.emit('gameState', room.gameState);
            socket.emit('joinedRoom', roomId);
        }

        io.to(roomId).emit('playerJoined', {
            playerCount: room.players.length - room.gameState.disconnectedPlayers.size,
            playerId: socket.id
        });
    });

    socket.on('startGame', (roomId) => {
        const room = rooms.get(roomId);
        
        if (room) {
            room.gameState.gameStarted = true;
            room.gameState.word = getRandomWord(words);
            io.to(roomId).emit('gameStarted', room.gameState);
        } else {
            socket.emit('error', {
                message: 'Room not found',
                code: 'ROOM_NOT_FOUND'
            });
            return;
        }
    });

    // Game-logic server-side
    socket.on('correctGuess', correctLetter => {
        socket.broadcast.emit('receivedCorrectGuess', correctLetter);
    });

    socket.on('wrongGuess', (letterGuess) => {
        const room = [...rooms.values()].find(r => r.players.includes(socket.id));
        
        if (room) {
            room.gameState.wrongGuessCount++;
            io.to([...socket.rooms][1]).emit('receivedWrongGuess', {
                wrongGuessCount: room.gameState.wrongGuessCount,
                letterGuess: letterGuess
            });

            if (room.gameState.wrongGuessCount === 9) {
                io.to([...socket.rooms][1]).emit('gameOverBroadcast', {
                    isVictory: false,
                    word: room.gameState.word
                });
            }
        }
    });

    socket.on('gameOver', (data) => {
        io.to(data.roomId).emit('gameOverBroadcast', {
          isVictory: data.isVictory,
          word: data.word
        });
      });
    
	socket.on('restartGame', (roomId) => {
        const room = rooms.get(roomId);
        if (room) {
            // Reset game state with new word
            room.gameState.word = getRandomWord(words);
            room.gameState.guessedLetters = [];
            room.gameState.gameStarted = true;
            room.gameState.wrongGuessCount = 0;
            
            // Broadcast new game state to all players in room
            io.to(roomId).emit('gameRestarted', room.gameState);
        }
    });

    socket.on('exitRoom', (roomId) => {
        const room = rooms.get(roomId);
        if (room) {
            const playerIndex = room.players.indexOf(socket.id);
            if (playerIndex !== -1) {
                room.players.splice(playerIndex, 1);
                socket.leave(roomId);
                
                // Notify remaining players
                io.to(roomId).emit('playerLeft', {
                    playerCount: room.players.length - room.gameState.disconnectedPlayers.size,
                    playerId: socket.id
                });
            }
        }
    });

    socket.on('disconnect', () => {
      for (const [roomId, room] of rooms.entries()) {
          const playerIndex = room.players.indexOf(socket.id);
          if (playerIndex !== -1) {
              // Instead of removing the player, mark them as disconnected
              room.gameState.disconnectedPlayers.add(socket.id);

              // Only delete room if all players have been disconnected for more than 5 minutes
              const activePlayersCount = room.players.length - room.gameState.disconnectedPlayers.size;
              
              if (activePlayersCount === 0) {
                  // Set a timeout to delete the room after 5 minutes if no one rejoins
                  setTimeout(() => {
                      const currentRoom = rooms.get(roomId);
                      if (currentRoom && 
                          currentRoom.players.length - currentRoom.gameState.disconnectedPlayers.size === 0) {
                          rooms.delete(roomId);
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

const PORT = process.env.PORT || 3002;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});