const socket = io();
      let currentRoomId = null;

      function createRoom() {
          socket.emit('createRoom');
      }

      function joinRoom() {
          const roomId = document.getElementById('roomInput').value.trim();
          if (roomId) {
              socket.emit('joinRoom', roomId);
              window.location.href = `/game?room=${roomId}`;
          } else {
              alert('Please enter a room ID');
          }
      }

      function startGame() {
          if (currentRoomId) {
              socket.emit('startGame', currentRoomId);
            }
          }

      socket.on('roomCreated', (roomId) => {
        currentRoomId = roomId;
        document.getElementById('roomInfo').innerHTML = `
        Room created! Share this ID with your friends: ${roomId}
        <br>
        <button class="startBtn" onclick="startGame()">Start Game</button>
          `;
          document.getElementById('menu').style.display = 'none';
        });

      socket.on('joinedRoom', (roomId) => {
          currentRoomId = roomId;
          document.getElementById('roomInfo').innerHTML = 'Joined room! Waiting for game to start...';
          document.getElementById('menu').style.display = 'none';
          document.getElementById('joinForm').style.display = 'none';
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