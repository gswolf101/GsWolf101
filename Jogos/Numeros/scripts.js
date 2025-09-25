let secretNumber = Math.floor(Math.random() * 100) + 1; // Número aleatório entre 1 e 100
let attempts = 0;
let gameActive = true;

const guessInput = document.getElementById('guessInput');
const guessButton = document.getElementById('guessButton');
const message = document.getElementById('message');
const attemptsDisplay = document.getElementById('attempts');
const restartButton = document.getElementById('restartButton');

function checkGuess() {
    if (!gameActive) return;

    const guess = Number(guessInput.value);

    if (!guess || guess < 1 || guess > 100) {
        message.textContent = "Por favor, insira um número válido entre 1 e 100!";
        message.style.color = "red";
        guessInput.value = "";
        guessInput.focus();
        return;
    }

    attempts++;
    attemptsDisplay.textContent = `Tentativas: ${attempts}`;

    if (guess === secretNumber) {
        message.textContent = `Parabéns! Você acertou o número em ${attempts} tentativas!`;
        message.style.color = "green";
        endGame();
    } else if (guess < secretNumber) {
        message.textContent = "Tente um número maior!";
        message.style.color = "red";
    } else {
        message.textContent = "Tente um número menor!";
        message.style.color = "red";
    }

    guessInput.value = "";
    guessInput.focus();
}

function endGame() {
    gameActive = false;
    guessInput.disabled = true;
    guessButton.disabled = true;
    restartButton.style.display = "block";
}

function restartGame() {
    secretNumber = Math.floor(Math.random() * 100) + 1;
    attempts = 0;
    gameActive = true;
    message.textContent = "";
    attemptsDisplay.textContent = "Tentativas: 0";
    guessInput.disabled = false;
    guessButton.disabled = false;
    restartButton.style.display = "none";
    guessInput.value = "";
    guessInput.focus();
}

// Evento para o botão
guessButton.addEventListener('click', checkGuess);

// Evento para a tecla Enter
guessInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && gameActive) {
        checkGuess();
    }
});

// Foco inicial no campo de entrada
guessInput.focus();
