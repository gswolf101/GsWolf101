const canvas = document.getElementById('pongCanvas');
const ctx = canvas.getContext('2d');
const startScreen = document.getElementById('startScreen');
const gameScreen = document.getElementById('gameScreen');
const gameOverScreen = document.getElementById('gameOver');
const gameOverMessage = document.getElementById('gameOverMessage');
const leftLivesDisplay = document.getElementById('leftLives');
const rightLivesDisplay = document.getElementById('rightLives');
const singlePlayerBtn = document.getElementById('singlePlayerBtn');
const multiPlayerBtn = document.getElementById('multiPlayerBtn');
const restartBtn = document.getElementById('restartBtn');

// Configurações
const PADDLE_WIDTH = 15;
const PADDLE_HEIGHT = 120; // Aumentado levemente
const BALL_SIZE = 15;
const PADDLE_SPEED = 6;
const INITIAL_BALL_SPEED = 4;
const BALL_SPEED_INCREMENT = 0.2;
const MAX_BALL_SPEED = 8;

// Variáveis do jogo
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

// Controles
let keys = {};

// Escuta eventos do teclado
document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
});
document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Iniciar jogo
singlePlayerBtn.addEventListener('click', () => startGame(true));
multiPlayerBtn.addEventListener('click', () => startGame(false));
restartBtn.addEventListener('click', () => {
    gameOverScreen.style.display = 'none';
    startScreen.style.display = 'flex';
    gameScreen.style.display = 'none';
    resetGame();
});

function startGame(isSinglePlayer) {
    singlePlayer = isSinglePlayer;
    startScreen.style.display = 'none';
    gameScreen.style.display = 'block';
    rightLivesDisplay.style.display = singlePlayer ? 'none' : 'inline';
    gameStarted = true;
    resetGame();
}

// Função para desenhar os elementos
function draw() {
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'white';
    ctx.fillRect(0, leftPaddleY, PADDLE_WIDTH, PADDLE_HEIGHT);
    if (!singlePlayer) {
        ctx.fillRect(canvas.width - PADDLE_WIDTH, rightPaddleY, PADDLE_WIDTH, PADDLE_HEIGHT);
    }

    ctx.beginPath();
    ctx.arc(ballX, ballY, BALL_SIZE / 2, 0, Math.PI * 2);
    ctx.fillStyle = 'white';
    ctx.fill();
    ctx.closePath();

    ctx.setLineDash([5, 15]);
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.strokeStyle = 'white';
    ctx.stroke();
    ctx.setLineDash([]);
}

// Função para atualizar o jogo
function update() {
    if (!gameStarted || gameOver) return;

    // Movimento da raquete esquerda
    if (keys['w'] && leftPaddleY > 0) leftPaddleY -= PADDLE_SPEED;
    if (keys['s'] && leftPaddleY < canvas.height - PADDLE_HEIGHT) leftPaddleY += PADDLE_SPEED;

    // Movimento da raquete direita (apenas em multiplayer)
    if (!singlePlayer) {
        if (keys['ArrowUp'] && rightPaddleY > 0) rightPaddleY -= PADDLE_SPEED;
        if (keys['ArrowDown'] && rightPaddleY < canvas.height - PADDLE_HEIGHT) rightPaddleY += PADDLE_SPEED;
    }

    // Movimento da bola
    ballX += ballSpeedX;
    ballY += ballSpeedY;

    // Colisão com bordas superior e inferior
    if (ballY <= 0 || ballY >= canvas.height - BALL_SIZE) {
        ballSpeedY *= -1;
    }

    // Colisão com raquetes
    const leftPaddle = { x: 0, y: leftPaddleY, width: PADDLE_WIDTH, height: PADDLE_HEIGHT };
    const rightPaddle = { x: canvas.width - PADDLE_WIDTH, y: rightPaddleY, width: PADDLE_WIDTH, height: PADDLE_HEIGHT };
    const ball = { x: ballX, y: ballY, width: BALL_SIZE, height: BALL_SIZE };

    if (collides(ball, leftPaddle)) {
        ballSpeedX = Math.min(Math.abs(ballSpeedX) + BALL_SPEED_INCREMENT, MAX_BALL_SPEED);
        ballSpeedX *= -1;
    } else if (!singlePlayer && collides(ball, rightPaddle)) {
        ballSpeedX = -Math.min(Math.abs(ballSpeedX) + BALL_SPEED_INCREMENT, MAX_BALL_SPEED);
        ballSpeedX *= -1;
    } else if (singlePlayer && ballX >= canvas.width - BALL_SIZE) {
        ballSpeedX = -Math.min(Math.abs(ballSpeedX) + BALL_SPEED_INCREMENT, MAX_BALL_SPEED);
    }

    // Perda de vidas
    if (ballX <= 0) {
        if (!singlePlayer) rightLives -= 1;
        else leftLives -= 1;
        resetBall();
    } else if (ballX >= canvas.width - BALL_SIZE && !singlePlayer) {
        leftLives -= 1;
        resetBall();
    }

    // Atualiza vidas
    leftLivesDisplay.textContent = `Vidas: ${leftLives}`;
    if (!singlePlayer) rightLivesDisplay.textContent = `Vidas: ${rightLives}`;

    // Verifica fim de jogo
    if (leftLives <= 0 || (!singlePlayer && rightLives <= 0)) {
        gameOver = true;
        gameScreen.style.display = 'none';
        gameOverScreen.style.display = 'block';
        if (singlePlayer) {
            gameOverMessage.textContent = 'Você perdeu todas as vidas!';
        } else {
            gameOverMessage.textContent = leftLives <= 0 ? 'Jogador 2 venceu!' : 'Jogador 1 venceu!';
        }
    }
}

// Função para detectar colisão
function collides(ball, paddle) {
    return ball.x < paddle.x + paddle.width &&
           ball.x + ball.width > paddle.x &&
           ball.y < paddle.y + paddle.height &&
           ball.y + ball.height > paddle.y;
}

// Função para resetar a bola
function resetBall() {
    ballX = canvas.width / 2;
    ballY = canvas.height / 2;
    ballSpeedX = INITIAL_BALL_SPEED * (Math.random() > 0.5 ? 1 : -1);
    ballSpeedY = INITIAL_BALL_SPEED * (Math.random() > 0.5 ? 1 : -1);
}

// Função para resetar o jogo
function resetGame() {
    leftLives = 3;
    rightLives = 3;
    leftPaddleY = canvas.height / 2 - PADDLE_HEIGHT / 2;
    rightPaddleY = canvas.height / 2 - PADDLE_HEIGHT / 2;
    resetBall();
    leftLivesDisplay.textContent = `Vidas: ${leftLives}`;
    rightLivesDisplay.textContent = `Vidas: ${rightLives}`;
    gameOver = false;
    gameStarted = true;
}

// Loop do jogo
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Inicia o loop
gameLoop();
