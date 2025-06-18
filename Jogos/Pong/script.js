const canvas = document.getElementById('pongCanvas');
const ctx = canvas.getContext('2d');
const leftScoreDisplay = document.getElementById('leftScore');
const rightScoreDisplay = document.getElementById('rightScore');
const hitScoreDisplay = document.getElementById('hitScore');
const modeDisplay = document.getElementById('mode');

// Configurações
const PADDLE_WIDTH = 15;
const PADDLE_HEIGHT = 90;
const BALL_SIZE = 15;
const PADDLE_SPEED = 6;
const BALL_SPEED = 7;

// Variáveis do jogo
let ballX = canvas.width / 2;
let ballY = canvas.height / 2;
let ballSpeedX = BALL_SPEED * (Math.random() > 0.5 ? 1 : -1);
let ballSpeedY = BALL_SPEED * (Math.random() > 0.5 ? 1 : -1);
let leftPaddleY = canvas.height / 2 - PADDLE_HEIGHT / 2;
let rightPaddleY = canvas.height / 2 - PADDLE_HEIGHT / 2;
let leftScore = 0;
let rightScore = 0;
let hitScore = 0;
let singlePlayer = true;

// Controles
let keys = {};

// Escuta eventos do teclado
document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    if (e.key === 'm' || e.key === 'M') {
        singlePlayer = !singlePlayer;
        hitScore = 0;
        hitScoreDisplay.style.display = singlePlayer ? 'inline' : 'none';
        modeDisplay.textContent = `Modo: ${singlePlayer ? 'Single-player' : 'Dois jogadores'} (Pressione 'M' para alternar)`;
    }
});
document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Função para desenhar os elementos
function draw() {
    // Limpa o canvas
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Desenha as raquetes
    ctx.fillStyle = 'white';
    ctx.fillRect(0, leftPaddleY, PADDLE_WIDTH, PADDLE_HEIGHT);
    ctx.fillRect(canvas.width - PADDLE_WIDTH, rightPaddleY, PADDLE_WIDTH, PADDLE_HEIGHT);

    // Desenha a bola
    ctx.beginPath();
    ctx.arc(ballX, ballY, BALL_SIZE / 2, 0, Math.PI * 2);
    ctx.fillStyle = 'white';
    ctx.fill();
    ctx.closePath();

    // Desenha a linha central
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
    // Movimento da raquete esquerda (W e S)
    if (keys['w'] && leftPaddleY > 0) leftPaddleY -= PADDLE_SPEED;
    if (keys['s'] && leftPaddleY < canvas.height - PADDLE_HEIGHT) leftPaddleY += PADDLE_SPEED;

    // Movimento da raquete direita
    if (singlePlayer) {
        // IA simples para single-player
        if (rightPaddleY + PADDLE_HEIGHT / 2 < ballY) rightPaddleY += PADDLE_SPEED;
        else if (rightPaddleY + PADDLE_HEIGHT / 2 > ballY) rightPaddleY -= PADDLE_SPEED;
        rightPaddleY = Math.max(0, Math.min(canvas.height - PADDLE_HEIGHT, rightPaddleY));
    } else {
        // Controles para dois jogadores (setas para cima e para baixo)
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

    if (collides(ball, leftPaddle) || collides(ball, rightPaddle)) {
        ballSpeedX *= -1;
        if (singlePlayer && collides(ball, leftPaddle)) {
            hitScore += 1;
            hitScoreDisplay.textContent = `Acertos: ${hitScore}`;
        }
    }

    // Pontuação e reset da bola
    if (ballX <= 0) {
        if (!singlePlayer) rightScore += 1;
        resetBall();
    } else if (ballX >= canvas.width - BALL_SIZE) {
        if (!singlePlayer) leftScore += 1;
        resetBall();
    }

    // Atualiza placar
    leftScoreDisplay.textContent = leftScore;
    rightScoreDisplay.textContent = rightScore;
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
    ballSpeedX = BALL_SPEED * (Math.random() > 0.5 ? 1 : -1);
    ballSpeedY = BALL_SPEED * (Math.random() > 0.5 ? 1 : -1);
}

// Loop do jogo
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Inicia o jogo
hitScoreDisplay.style.display = 'inline';
gameLoop();
