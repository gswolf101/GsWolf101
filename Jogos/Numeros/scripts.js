let secretNumber = Math.floor(Math.random() * 100) + 1; // Número aleatório entre 1 e 100
let attempts = 0;

function checkGuess() {
    const guessInput = document.getElementById('guessInput');
    const guess = Number(guessInput.value);
    const message = document.getElementById('message');
    const attemptsDisplay = document.getElementById('attempts');
    const restartButton = document.getElementById('restartButton');

    if (isNaN(guess) || guess < 1 || guess > 100) {
        message.textContent = "Por favor, insira um número válido entre 1 e 100!";
        return;
    }

    attempts++;
    attemptsDisplay.textContent = `Tentativas: ${attempts}`;

    if (guess === secretNumber) {
        message.textContent = `Parabéns! Você acertou o número em ${attempts} tentativas!`;
        message.style.color = "green";
        guessInput.disabled = true;
        document.querySelector('button').disabled = true;
        restartButton.style.display = "block";
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

function restartGame() {
    secretNumber = Math.floor(Math.random() * 100) + 1;
    attempts = 0;
    document.getElementById('message').textContent = "";
    document.getElementById('attempts').textContent = "Tentativas: 0";
    document.getElementById('guessInput').disabled = false;
    document.querySelector('button').disabled = false;
    document.getElementById('restartButton').style.display = "none";
    document.getElementById('guessInput').focus();
}
