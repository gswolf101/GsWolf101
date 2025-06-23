const canvas = document.getElementById('pongCanvas');
const ctx = canvas.getContext('2d');
const startScreen = document.getElementById('startScreen');
const gameScreen = document.getElementById('gameScreen');
const gameOverScreen = document.getElementById('gameOver');
const gameOverMessage = document.getElementById('gameOverMessage');
const finalScoreDisplay = document.getElementById('finalScore');
const rankingSection = document.getElementById('rankingSection');
const playerNameInput = document.getElementById('playerName');
const saveScoreBtn = document.getElementById('saveScoreBtn');
const leftLivesContainer = document.getElementById('leftLives');
const rightLivesContainer = document.getElementById('rightLives');
const singlePlayerBtn = document.getElementById('singlePlayerBtn');
const multiPlayerBtn = document.getElementById('multiPlayerBtn');
const rematchBtn = document.getElementById('rematchBtn');
const backToMenuBtn = document.getElementById('backToMenuBtn');
const currentScoreDisplay = document.getElementById('currentScore');

const leftLife1 = document.getElementById('leftLife1');
const leftLife2 = document.getElementById('leftLife2');
const leftLife3 = document.getElementById('leftLife3');
const rightLife1 = document.getElementById('rightLife1');
const rightLife2 = document.getElementById('rightLife2');
const rightLife3 = document.getElementById('rightLife3');

const PADDLE_WIDTH = 15;
const PADDLE_HEIGHT = 120;
const BALL_SIZE = 15;
const PADDLE_SPEED = 6;
const INITIAL_BALL_SPEED = 4;
const BALL_SPEED_INCREMENT = 0.2;
const MAX_BALL_SPEED = 8;
const AI_PADDLE_SPEED = 4; // Velocidade da IA no modo single-player

let ballX = canvas.width / 2;
let ballY = canvas.height / 2;
let ballSpeedX = INITIAL_BALL_SPEED * (Math.random() > 0.5 ? 1 : -1);
let ballSpeedY = INITIAL_BALL_SPEED * (Math.random() > 0.5 ? 1 : -1);
let leftPaddleY = canvas.height / 2 - PADDLE_HEIGHT / 2;
let rightPaddleY = canvas.height / 2 - PADDLE_HEIGHT / 2;
let leftLives = 3;
let rightLives = 3;
let singlePlayer = false;
let gameStarted = false;
let gameOver = false;
let score = 0;

let keys = {};

document.addEventListener('keydown', (e) => (keys[e.key] = true));
document.addEventListener('keyup', (e) => (keys[e.key] = false));

function startGame(isSinglePlayer) {
    singlePlayer = isSinglePlayer;
    startScreen.style.display = 'none';
    gameScreen.style.display = 'block';
    rightLivesContainer.style.display = singlePlayer ? 'none' : 'flex';
    currentScoreDisplay.parentElement.style.display = singlePlayer ? 'block' : 'none';
    resetGame();
    gameLoop();
}

singlePlayerBtn.addEventListener('click', () => startGame(true));
multiPlayerBtn.addEventListener('click', () => startGame(false));

rematchBtn.addEventListener('click', () => {
    gameOverScreen.style.display = 'none';
    gameScreen.style.display = 'block';
    rankingSection.style.display = 'none';
    finalScoreDisplay.style.display = 'none';
    playerNameInput.value = '';
    saveScoreBtn.disabled = false;
    resetGame();
});

backToMenuBtn.addEventListener('click', () => {
    gameOverScreen.style.display = 'none';
    startScreen.style.display = 'flex';
    gameScreen.style.display = 'none';
    rankingSection.style.display = 'none';
    finalScoreDisplay.style.display = 'none';
    playerNameInput.value = '';
    saveScoreBtn.disabled = false;
});

saveScoreBtn.addEventListener('click', () => {
    const name = playerNameInput.value.trim();
    if (name) {
        console.log(`Pontuação salva: ${name} - ${score} pontos`);
        alert('Pontuação salva com sucesso!');
        saveScoreBtn.disabled = true;
    } else {
        alert('Digite seu nome para salvar a pontuação.');
    }
});

function draw() {
    // Limpar o canvas
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Desenhar raquetes
    ctx.fillStyle = 'white';
    ctx.fillRect(0, leftPaddleY, PADDLE_WIDTH, PADDLE_HEIGHT);
    if (!singlePlayer) {
        ctx.fillRect(canvas.width - PADDLE_WIDTH, rightPaddleY, PADDLE_WIDTH, PADDLE_HEIGHT);
    } else {
        // Desenhar raquete da IA no modo single-player
        ctx.fillRect(canvas.width - PADDLE_WIDTH, rightPaddleY, PADDLE_WIDTH, PADDLE_HEIGHT);
    }

    // Desenhar bola
    ctx.beginPath();
    ctx.arc(ballX, ballY, BALL_SIZE / 2, 0, Math.PI * 2);
    ctx.fillStyle = 'white';
    ctx.fill();
    ctx.closePath();

    // Desenhar linha central
    ctx.setLineDash([5, 15]);
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.strokeStyle = 'white';
    ctx.stroke();
    ctx.setLineDash([]);
}

function update() {
    if (!gameStarted || gameOver) return;

    // Movimento do paddle esquerdo (jogador 1)
    if (keys['w'] && leftPaddleY > 0) leftPaddleY -= PADDLE_SPEED;
    if (keys['s'] && leftPaddleY < canvas.height - PADDLE_HEIGHT) leftPaddleY += PADDLE_SPEED;

    // Movimento do paddle direito (jogador 2 ou IA)
    if (!singlePlayer) {
        if (keys['ArrowUp'] && rightPaddleY > 0) rightPaddleY -= PADDLE_SPEED;
        if (keys['ArrowDown'] && rightPaddleY < canvas.height - PADDLE_HEIGHT) rightPaddleY += PADDLE_SPEED;
    } else {
        // IA para o paddle direito no modo single-player
        const paddleCenter = rightPaddleY + PADDLE_HEIGHT / 2;
        if (paddleCenter < ballY - 35) {
            rightPaddleY += AI_PADDLE_SPEED;
        } else if (paddleCenter > ballY + 35) {
            rightPaddleY -= AI_PADDLE_SPEED;
        }
        // Garantir que o paddle da IA não saia do canvas
        rightPaddleY = Math.max(0, Math.min(canvas.height - PADDLE_HEIGHT, rightPaddleY));
    }

    // Atualizar posição da bola
    ballX += ballSpeedX;
    ballY += ballSpeedY;

    // Colisão com as bordas superior e inferior
    if (ballY <= BALL_SIZE / 2 || ballY >= canvas.height - BALL_SIZE / 2) {
        ballSpeedY *= -1;
    }

    // Definir objetos para colisão
    const leftPaddle = { x: 0, y: leftPaddleY, width: PADDLE_WIDTH, height: PADDLE_HEIGHT };
    const rightPaddle = { x: canvas.width - PADDLE_WIDTH, y: rightPaddleY, width: PADDLE_WIDTH, height: PADDLE_HEIGHT };
    const ball = { x: ballX, y: ballY, width: BALL_SIZE, height: BALL_SIZE };

    // Colisão com paddles
    if (ballSpeedX < 0 && collides(ball, leftPaddle)) {
        // Calcular o ângulo de reflexão com base na posição de impacto
        const hitPoint = (ballY - (leftPaddle.y + PADDLE_HEIGHT / 2)) / (PADDLE_HEIGHT / 2);
        ballSpeedX = Math.min(Math.abs(ballSpeedX) + BALL_SPEED_INCREMENT, MAX_BALL_SPEED);
        ballSpeedY = hitPoint * (MAX_BALL_SPEED / 2);
        ballX = leftPaddle.x + leftPaddle.width + BALL_SIZE / 2;
        if (singlePlayer) score++;
        updateScoreDisplay();
    } else if (ballSpeedX > 0 && collides(ball, rightPaddle)) {
        const hitPoint = (ballY - (rightPaddle.y + PADDLE_HEIGHT / 2)) / (PADDLE_HEIGHT / 2);
        ballSpeedX = -Math.min(Math.abs(ballSpeedX) + BALL_SPEED_INCREMENT, MAX_BALL_SPEED);
        ballSpeedY = hitPoint * (MAX_BALL_SPEED / 2);
        ballX = rightPaddle.x - BALL_SIZE / 2;
    }

    // Perda de vida
    if (ballX <= BALL_SIZE / 2) {
        if (!singlePlayer) rightLives--;
        else leftLives--;
        updateLivesDisplay();
        resetBall();
    } else if (ballX >= canvas.width - BALL_SIZE / 2) {
        if (!singlePlayer) leftLives--;
        updateLivesDisplay();
        resetBall();
    }

    // Fim de jogo
    if (leftLives <= 0 || (!singlePlayer && rightLives <= 0)) {
        gameOver = true;
        gameScreen.style.display = 'none';
        gameOverScreen.style.display = 'block';
        if (singlePlayer) {
            gameOverMessage.textContent = 'Você perdeu todas as vidas!';
            finalScoreDisplay.textContent = `Sua pontuação: ${score} ponto${score !== 1 ? 's' : ''}`;
            finalScoreDisplay.style.display = 'block';
            rankingSection.style.display = 'flex';
        } else {
            gameOverMessage.textContent = leftLives <= 0 ? 'Jogador 2 venceu!' : 'Jogador 1 venceu!';
        }
    }
}

function collides(ball, paddle) {
    return (
        ball.x - BALL_SIZE / 2 < paddle.x + paddle.width &&
        ball.x + BALL_SIZE / 2 > paddle.x &&
        ball.y - BALL_SIZE / 2 < paddle.y + paddle.height &&
        ball.y + BALL_SIZE / 2 > paddle.y
    );
}

function updateLivesDisplay() {
    leftLife1.style.display = leftLives >= 1 ? 'inline-block' : 'none';
    leftLife2.style.display = leftLives >= 2 ? 'inline-block' : 'none';
    leftLife3.style.display = leftLives >= 3 ? 'inline-block' : 'none';
    rightLife1.style.display = rightLives >= 1 ? 'inline-block' : 'none';
    rightLife2.style.display = rightLives >= 2 ? 'inline-block' : 'none';
    rightLife3.style.display = rightLives >= 3 ? 'inline-block' : 'none';
}

function updateScoreDisplay() {
    if (currentScoreDisplay) {
        currentScoreDisplay.textContent = score;
    }
}

function resetBall() {
    ballX = canvas.width / 2;
    ballY = canvas.height / 2;
    ballSpeedX = INITIAL_BALL_SPEED * (Math.random() > 0.5 ? 1 : -1);
    ballSpeedY = INITIAL_BALL_SPEED * (Math.random() > 0.5 ? 1 : -1);
}

function resetGame() {
    leftLives = 3;
    rightLives = 3;
    score = 0;
    leftPaddleY = canvas.height / 2 - PADDLE_HEIGHT / 2;
    rightPaddleY = canvas.height / 2 - PADDLE_HEIGHT / 2;
    resetBall();
    updateLivesDisplay();
    updateScoreDisplay();
    gameOver = false;
    gameStarted = true;
}

function gameLoop() {
    if (!gameOver) {
        update();
        draw();
        requestAnimationFrame(gameLoop);
    }
}

