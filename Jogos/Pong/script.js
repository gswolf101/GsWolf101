// Seleção de elementos DOM
const canvas = document.getElementById('pongCanvas');
const ctx = canvas.getContext('2d');
const startScreen = document.getElementById('startScreen');
const gameScreen = document.getElementById('gameScreen');
const gameOverScreen = document.getElementById('gameOver');
const gameOverMessage = document.getElementById('gameOverMessage');
const leftLivesContainer = document.getElementById('leftLives');
const rightLivesContainer = document.getElementById('rightLives');
const singlePlayerBtn = document.getElementById('singlePlayerBtn');
const multiPlayerBtn = document.getElementById('multiPlayerBtn');
const restartBtn = document.getElementById('restartBtn');

// Seleção das bolas de vida
const leftLife1 = document.getElementById('leftLife1');
const leftLife2 = document.getElementById('leftLife2');
const leftLife3 = document.getElementById('leftLife3');
const rightLife1 = document.getElementById('rightLife1');
const rightLife2 = document.getElementById('rightLife2');
const rightLife3 = document.getElementById('rightLife3');

// Verifica se todos os elementos foram encontrados
if (!canvas || !ctx || !startScreen || !gameScreen || !gameOverScreen || 
    !gameOverMessage || !leftLivesContainer || !rightLivesContainer || 
    !singlePlayerBtn || !multiPlayerBtn || !restartBtn ||
    !leftLife1 || !leftLife2 || !leftLife3 || !rightLife1 || !rightLife2 || !rightLife3) {
    console.error('Um ou mais elementos DOM não foram encontrados.');
}

// Configurações
const PADDLE_WIDTH = 15;
const PADDLE_HEIGHT = 120;
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

// Função para iniciar o jogo
function startGame(isSinglePlayer) {
    singlePlayer = isSinglePlayer;
    startScreen.style.display = 'none';
    gameScreen.style.display = 'block';
    rightLivesContainer.style.display = singlePlayer ? 'none' : 'flex';
    gameStarted = true;
    resetGame();
    console.log(`Jogo iniciado no modo: ${singlePlayer ? 'Single-player' : 'Multiplayer'}`);
}

// Associa eventos aos botões
singlePlayerBtn.addEventListener('click', () => startGame(true));
multiPlayerBtn.addEventListener('click', () => startGame(false));
restartBtn.addEventListener('click', () => {
    gameOverScreen.style.display = 'none';
    startScreen.style.display = 'flex';
    gameScreen.style.display = 'none';
    resetGame();
});

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
    if (ballY <= BALL_SIZE / 2 || ballY >= canvas.height - BALL_SIZE / 2) {
        ballSpeedY *= -1;
    }

    // Colisão com raquetes
    const leftPaddle = { x: 0, y: leftPaddleY, width: PADDLE_WIDTH, height: PADDLE_HEIGHT };
    const rightPaddle = { x: canvas.width - PADDLE_WIDTH, y: rightPaddleY, width: PADDLE_WIDTH, height: PADDLE_HEIGHT };
    const ball = { x: ballX, y: ballY, width: BALL_SIZE, height: BALL_SIZE };

    // Ajuste na colisão para garantir que a bola não passe pela raquete
    if (ballSpeedX < 0 && collides(ball, leftPaddle)) {
        ballSpeedX = Math.min(Math.abs(ballSpeedX) + BALL_SPEED_INCREMENT, MAX_BALL_SPEED);
        ballX = leftPaddle.x + leftPaddle.width + BALL_SIZE / 2; // Evita "afundar" na raquete
    } else if (!singlePlayer && ballSpeedX > 0 && collides(ball, rightPaddle)) {
        ballSpeedX = -Math.min(Math.abs(ballSpeedX) + BALL_SPEED_INCREMENT, MAX_BALL_SPEED);
        ballX = rightPaddle.x - BALL_SIZE / 2; // Evita "afundar" na raquete
    } else if (singlePlayer && ballX >= canvas.width - BALL_SIZE / 2) {
        ballSpeedX = -Math.min(Math.abs(ballSpeedX) + BALL_SPEED_INCREMENT, MAX_BALL_SPEED);
        ballX = canvas.width - BALL_SIZE / 2; // Rebate na parede
    }

    // Perda de vidas
    if (ballX <= BALL_SIZE / 2) {
        if (!singlePlayer) rightLives -= 1;
        else leftLives -= 1;
        updateLivesDisplay();
        resetBall();
    } else if (ballX >= canvas.width - BALL_SIZE / 2 && !singlePlayer) {
        leftLives -= 1;
        updateLivesDisplay();
        resetBall();
    }

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
    return ball.x - BALL_SIZE / 2 < paddle.x + paddle.width &&
           ball.x + BALL_SIZE / 2 > paddle.x &&
           ball.y - BALL_SIZE / 2 < paddle.y + paddle.height &&
           ball.y + BALL_SIZE / 2 > paddle.y;
}

// Função para atualizar a exibição das vidas
function updateLivesDisplay() {
    leftLife1.style.display = leftLives >= 1 ? 'inline-block' : 'none';
    leftLife2.style.display = leftLives >= 2 ? 'inline-block' : 'none';
    leftLife3.style.display = leftLives >= 3 ? 'inline-block' : 'none';
    rightLife1.style.display = rightLives >= 1 ? 'inline-block' : 'none';
    rightLife2.style.display = rightLives >= 2 ? 'inline-block' : 'none';
    rightLife3.style.display = rightLives >= 3 ? 'inline-block' : 'none';
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
    updateLivesDisplay();
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

