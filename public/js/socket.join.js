import socket from './socket.client.js';
let currentRoomId = null;

const errorDisplay = document.getElementById('errorDisplay');
const errorMessage = document.getElementById('errorMessage');

export function createRoom() {
    socket.emit('createRoom');
}

export function joinRoom() {
    const roomId = document.getElementById('roomInput').value.trim();
    if (roomId) {
        socket.emit('joinRoom', roomId);
    } else {
        errorMessage.textContent = 'Please enter a roomID';
        errorDisplay.style.display = 'block';
        
        setTimeout(() => {
            errorDisplay.style.display = 'none';
        }, 3000);
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
    window.location.href = `/game?room=${roomId}`;
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
      
socket.on('playerJoined', (data) => {});

socket.on('playerLeft', (data) => {});

socket.on('error', (error) => {
    errorMessage.textContent = error.message;
    errorDisplay.style.display = 'block';

    setTimeout(() => {
        errorDisplay.style.display = 'none';
    }, 5000);

    switch(error.code) {
        case 'ROOM_NOT_FOUND':
        break;
        case 'ROOM_FULL':
        break;
        default:
        break;
    }
  });
  