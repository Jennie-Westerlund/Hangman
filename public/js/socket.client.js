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