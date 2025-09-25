let score = 0;
let timeLeft = 30;
let gameActive = false;
let targetInterval;
let timer;

const gameArea = document.getElementById('gameArea');
const scoreDisplay = document.getElementById('score');
const timeDisplay = document.getElementById('time');
const startButton = document.getElementById('startButton');

function startGame() {
    if (gameActive) return;
    gameActive = true;
    score = 0;
    timeLeft = 30;
    scoreDisplay.textContent = score;
    timeDisplay.textContent = timeLeft;
    startButton.disabled = true;
    gameArea.innerHTML = '';

    // Iniciar o temporizador
    timer = setInterval(() => {
        timeLeft--;
        timeDisplay.textContent = timeLeft;
        if (timeLeft <= 0) {
            endGame();
        }
    }, 1000);

    // Gerar alvos
    spawnTarget();
    targetInterval = setInterval(spawnTarget, 1000);
}

function spawnTarget() {
    if (!gameActive) return;

    const target = document.createElement('div');
    target.classList.add('target');

    // Posição aleatória dentro da área do jogo
    const maxX = gameArea.offsetWidth - 40; // 40 é o tamanho do alvo
    const maxY = gameArea.offsetHeight - 40;
    const posX = Math.random() * maxX;
    const posY = Math.random() * maxY;
    target.style.left = `${posX}px`;
    target.style.top = `${posY}px`;

    // Adicionar evento de clique
    target.addEventListener('click', () => {
        score++;
        scoreDisplay.textContent = score;
        target.remove();
    });

    // Remover alvo após 1 segundo se não for clicado
    setTimeout(() => {
        if (target.isConnected) target.remove();
    }, 1000);

    gameArea.appendChild(target);
}

function endGame() {
    gameActive = false;
    clearInterval(timer);
    clearInterval(targetInterval);
    gameArea.innerHTML = '';
    startButton.disabled = false;
    alert(`Fim do jogo! Sua pontuação: ${score}`);
}

function restartGame() {
    startGame();
}
