const socket = io();
        const urlParams = new URLSearchParams(window.location.search);
        const roomId = urlParams.get('room');
        let currentGameState = null;

        function updateGameStatus(gameState) {
            const gameStatus = document.getElementById('gameStatus');
            const wordDisplay = document.getElementById("wordDisplay");
            gameStatus.innerHTML = `Game is active - Room: ${roomId}`;
            wordDisplay.innerHTML = gameState.word.split("").map(() => `<li class="letter"></li>`).join("");
            console.log('Game State:', gameState);
            currentGameState = gameState;
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

// Listen for the custom event and emit to socket
document.addEventListener('letterGuessed', (event) => {
    socket.emit('letterGuess', {
        letter: event.detail.letter,
        roomId: roomId
    });
    console.log('Letter emitted to socket:', event.detail.letter, 'Room:', roomId);
    
    const messages = document.getElementById("messages");
    const letterGuess = event.detail.letter;
    
    // Check if we have a game state
    if (currentGameState && currentGameState.word) {
        if (currentGameState.word.includes(letterGuess)) {
            //Showing all correct letters on the word display
            [...currentGameState.word].forEach((letter, index) => {
                if(letter === letterGuess){
                    wordDisplay.querySelectorAll("li")[index].innerText = letter;
                    wordDisplay.querySelectorAll("li")[index].classList.add("guessed");
                    socket.emit('correctGuess', letterGuess);
                }
            })
        } else {
            const wrongLetter = `${letterGuess} does not exist in the word ${currentGameState.word}`;
            messages.textContent = wrongLetter;
            socket.emit('wrongGuess', wrongLetter);
        }

    } else {
        console.log("Game state or word not available yet");
    }
});

socket.on('receivedCorrectGuess', correctLetter => {
    [...currentGameState.word].forEach((letter, index) => {
        if(letter === correctLetter){
            wordDisplay.querySelectorAll("li")[index].innerText = letter;
            wordDisplay.querySelectorAll("li")[index].classList.add("guessed");
        }
    })
})

socket.on('receivedWrongGuess', wrongLetter => {
    messages.textContent = wrongLetter;
})
