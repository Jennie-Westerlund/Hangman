const socket = io();
        const urlParams = new URLSearchParams(window.location.search);
        const roomId = urlParams.get('room');

        function updateGameStatus(gameState) {
            const gameStatus = document.getElementById('gameStatus');
            gameStatus.innerHTML = `Game is active - Room: ${roomId}`;
            console.log('Game State:', gameState);
        }

        socket.on('connect', () => {
            if (roomId) {
                socket.emit('joinRoom', roomId);
            }
        });

        socket.on('gameState', (gameState) => {
            updateGameStatus(gameState);
        });

        // In game.html, modify the redirect handling:
        socket.on('gameStarted', (gameState) => {
        // Store the room ID in localStorage before redirecting
        localStorage.setItem('currentRoomId', roomId);
        window.location.href = `/game?room=${roomId}`;
        });

        socket.on('playerJoined', (data) => {
            console.log(`New player joined. Total players: ${data.playerCount}`);
            document.getElementById('playersList').innerHTML = 
                `Number of players: ${data.playerCount}`;
        });

        socket.on('playerLeft', (data) => {
            console.log(`Player left. Remaining players: ${data.playerCount}`);
            document.getElementById('playersList').innerHTML = 
                `Number of players: ${data.playerCount}`;
        });

        socket.on('error', (message) => {
            alert(message);
        });

        // Add reconnection logic in game.html
window.onload = function() {
  const storedRoomId = localStorage.getItem('currentRoomId');
  if (storedRoomId) {
      socket.emit('joinRoom', storedRoomId);
  }
};