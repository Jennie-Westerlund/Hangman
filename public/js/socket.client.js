import { createRoom, joinRoom, startGame } from '../js/socket.join.js';
const io = window.io;
const socket = io();

function displayWord(gameRoom) {
  const wordDisplay = document.getElementById("wordDisplay");
  wordDisplay.innerHTML = gameRoom.word.split("").map(() => `<li class="letter"></li>`).join("");
}

window.createRoom = createRoom;
window.joinRoom = joinRoom;
window.startGame = startGame;


export default socket;
/*
const form = document.getElementById('form');
const input = document.getElementById('input');
const messages = document.getElementById('messages');

form.addEventListener('submit', (e) => {
  e.preventDefault();
  if (input.value) {
    socket.emit('chat message', input.value);
    input.value = '';
  }
});

socket.on('chat message', (msg) => {
  const item = document.createElement('li');
  item.textContent = msg;
  messages.appendChild(item);
  window.scrollTo(0, document.body.scrollHeight);
});
*/
