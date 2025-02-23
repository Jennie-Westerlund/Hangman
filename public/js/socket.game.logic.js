const socket = io();
const urlParams = new URLSearchParams(window.location.search);
const roomId = urlParams.get('room');
let currentGameState = null;
let wrongGuessCount = 0;
const maxGuesses = 9;
const gameModal = document.getElementById('gameModal');
const wordDisplay = document.getElementById("wordDisplay");
const restartButton = document.getElementById('restartButton');
const exitButton = document.getElementById('exitButton');
const hangmanImage = document.querySelector(".hangmanImage");

function updateGameStatus(gameState) {
    const roomTitle = document.getElementById('roomTitle');
    const displayRoomId = document.getElementById('displayRoomId');
    roomTitle.innerHTML = "Room id:";
    displayRoomId.innerHTML = `${roomId}`;
    wordDisplay.innerHTML = gameState.word.split("").map(() => `<li class="letter"></li>`).join("");
    console.log('Game State:', gameState);
    currentGameState = gameState;
}

function showGameModal(isVictory, word) {
    console.log("GAME OVER TRIGGERED:", isVictory ? "Victory" : "Defeat", word);
    const modalText = isVictory ? `You found the word:` : `The correct word was:`;
    gameModal.querySelector('h4').innerText = `${isVictory ? 'You win!' : 'Game over!'}`;
    gameModal.querySelector('p').innerHTML = `${modalText} <strong>${word}</strong>`;
    gameModal.classList.add('show');
}

function resetGame() {
    wordDisplay.innerHTML = currentGameState.word.split("").map(() => `<li class="letter"></li>`).join("");

    wrongGuessCount = currentGameState.wrongGuessCount || 0;
    hangmanImage.src = `../assets/hangman-${wrongGuessCount}.svg`;
    hangmanImage.alt = `Illustration of the hanged man with ${wrongGuessCount} out of 9 wrong guesses used`;

    const allButtons = document.querySelectorAll('.letter-button');
    allButtons.forEach(button => {
        button.disabled = false;
        button.classList.remove('guessed');
    });

    gameModal.classList.remove('show');
}

// Event listeners for the buttons
restartButton.addEventListener('click', () => {
    socket.emit('restartGame', roomId);
});

exitButton.addEventListener('click', () => {
    socket.emit('exitRoom', roomId);
    window.location.href = '/';  // Redirect to index.html
});

// Add this socket listener for game restart
socket.on('gameRestarted', (gameState) => {
    currentGameState = gameState;
    resetGame();
    updateGameStatus(gameState);
});

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
    const playersList = document.getElementById('playersList');
    playersList.innerHTML = 
        `${data.playerCount}`;
});

socket.on('playerLeft', (data) => {
    console.log(`Player left. Remaining players: ${data.playerCount}`);
    const playersList = document.getElementById('playersList');
    playersList.innerHTML = 
        `${data.playerCount}`;
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

document.addEventListener('letterGuessed', (event) => {
    const letterGuess = event.detail.letter;

    if (currentGameState && currentGameState.word) {
        if (currentGameState.word.includes(letterGuess)) {
            // Correct guess logic remains the same
            [...currentGameState.word].forEach((letter, index) => {
                if(letter === letterGuess){
                    wordDisplay.querySelectorAll("li")[index].innerText = letter;
                    wordDisplay.querySelectorAll("li")[index].classList.add("guessed");
                    socket.emit('correctGuess', letterGuess);
                }
            });
            
            const correctLetters = wordDisplay.querySelectorAll("li.guessed");
            if (correctLetters.length === currentGameState.word.length) {
                socket.emit('gameOver', {
                    roomId: roomId,
                    isVictory: true,
                    word: currentGameState.word
                });
            }
        } else {
            // Wrong guess - just emit to server
            socket.emit('wrongGuess', letterGuess);
        }
    }
});

//uppdates the other players on the changes for right and wrong guesses
socket.on('receivedCorrectGuess', correctLetter => {
    [...currentGameState.word].forEach((letter, index) => {
        if(letter === correctLetter){
            wordDisplay.querySelectorAll("li")[index].innerText = letter;
            wordDisplay.querySelectorAll("li")[index].classList.add("guessed");
        }
    })
    const button = document.querySelector(`[data-letter="${correctLetter}"]`);
    button.disabled = true;
});

socket.on('receivedWrongGuess', (data) => {
    hangmanImage.src = `../assets/hangman-${data.wrongGuessCount}.svg`;
    hangmanImage.alt = `Illustration of the hanged man with ${data.wrongGuessCount} out of 9 wrong guesses used`;

    const button = document.querySelector(`[data-letter="${data.letterGuess}"]`);
    button.disabled = true;
});

socket.on('gameOverBroadcast', (data) => {
    console.log('Client received gameOver - word:', data.word);
    const gameModal = document.getElementById('gameModal');
    const modalText = data.isVictory ? `You found the word:` : `The correct word was:`;

    gameModal.querySelector('h4').innerText = `${data.isVictory ? 'You win!' : 'Game over!'}`;
    gameModal.querySelector('p').innerHTML = `${modalText} ${data.word}`;
    gameModal.classList.add('show');

    const allButtons = document.querySelectorAll('.letter-button');
    allButtons.forEach(button => {
        button.disabled = true;
    });
});
