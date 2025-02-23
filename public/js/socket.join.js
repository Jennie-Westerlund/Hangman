import socket from './socket.client.js';
      let currentRoomId = null;

      export function createRoom() {
          socket.emit('createRoom');
      }

      export function joinRoom() {
          const roomId = document.getElementById('roomInput').value.trim();
          if (roomId) {
              socket.emit('joinRoom', roomId);
              window.location.href = `/game?room=${roomId}`;
          } else {
              alert('Please enter a room ID');
          }
      }

      export function startGame() {
          if (currentRoomId) {
              socket.emit('startGame', currentRoomId);
            }
          }

      socket.on('roomCreated', (roomId) => {
        currentRoomId = roomId;
        document.getElementById('roomInfo').innerHTML = `
        <button class="startBtn" onclick="startGame()">Start Game</button>
        <div class="roomId">${roomId}</div>
        <P>Room created!</p>
        <p>Share the room-id with your friends</p>
          `;
          document.getElementById('menu').style.display = 'none';
        });

      socket.on('joinedRoom', (roomId) => {
          currentRoomId = roomId;
          document.getElementById('roomInfo').innerHTML = 'Joined room! Waiting for game to start...'; // Onödig?
          document.getElementById('menu').style.display = 'none'; // Igen, har vi inte en re-direct som tar en till nya sidan? 
          document.getElementById('joinForm').style.display = 'none'; // Tror inte vi har en sån längre pga mina layout-ändringar?
      });

      socket.on('gameStarted', (gameState) => {
          if (currentRoomId) {
              window.location.href = `/game?room=${currentRoomId}`;
          }
      });

      socket.on('gameState', (gameState) => {
          if (currentRoomId) {
            window.location.href = `/game?room=${currentRoomId}`;
          }
      });
      
      socket.on('playerJoined', (data) => {
          console.log(`New player joined. Total players: ${data.playerCount}`);
      });

      socket.on('playerLeft', (data) => {
          console.log(`Player left. Remaining players: ${data.playerCount}`);
      });

      socket.on('error', (message) => {
          alert(message);
      });