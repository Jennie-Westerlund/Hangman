const socket = io();
        const urlParams = new URLSearchParams(window.location.search);
        const roomId = urlParams.get('room');
        let currentGameState = null;
        let wrongGuessCount = 0;
        const maxGuesses = 9;
        const gameModal = document.getElementById('gameModal')
        const wordDisplay = document.getElementById("wordDisplay");

        function updateGameStatus(gameState) {
            const gameStatus = document.getElementById('gameStatus');
            gameStatus.innerHTML = `Game is active - Room: ${roomId}`;
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
            const correctLetters = wordDisplay.querySelectorAll("li.guessed");
            console.log(`Correct letters: ${correctLetters.length}, Word length: ${currentGameState.word.length}`);
            if (correctLetters.length === currentGameState.word.length) {
                socket.emit('gameOver', {
                    roomId: roomId,
                    isVictory: true,
                    word: currentGameState.word
        });
      }
        } else {
            //Wrong guesses add to the count and uppdates the picture and alt-text
            wrongGuessCount++;
            const hangmanImage = document.querySelector(".hangmanImage");
            hangmanImage.src = `../assets/hangman-${wrongGuessCount}.svg`;
            hangmanImage.alt = `Illustration of the hanged man with ${wrongGuessCount} out of 9 wrong guesses used`;
            socket.emit('wrongGuess', wrongGuessCount);
            
      if (wrongGuessCount === maxGuesses) {
        socket.emit('gameOver', {
            roomId: roomId,
            isVictory: false,
            word: currentGameState.word
        });
      }
        }

    } else {
        console.log("Game state or word not available yet");
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
})

socket.on('receivedWrongGuess', wrongGuessCount => {
    const hangmanImage = document.querySelector(".hangmanImage")
    hangmanImage.src = `../assets/hangman-${wrongGuessCount}.svg`;
    hangmanImage.alt = `Illustration of the hanged man with ${wrongGuessCount} out of 9 wrong guesses used`;
})

socket.on('gameOverBroadcast', (data) => {
    const gameModal = document.getElementById('gameModal');
    const modalText = data.isVictory ? `You found the word:` : `The correct word was:`;
    
    gameModal.querySelector('h4').innerText = `${data.isVictory ? 'You win!' : 'Game over!'}`;
    gameModal.querySelector('p').innerHTML = `${modalText} ${data.word}`;
    gameModal.classList.add('show');
});
