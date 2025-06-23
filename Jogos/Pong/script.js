const canvas = document.getElementById('pongCanvas');
const ctx = canvas.getContext('2d');
const startScreen = document.getElementById('startScreen');
const singlePlayerStartScreen = document.getElementById('singlePlayerStartScreen');
const gameScreen = document.getElementById('gameScreen');
const gameOverScreen = document.getElementById('gameOver');
const gameOverMessage = document.getElementById('gameOverMessage');
const finalScoreDisplay = document.getElementById('finalScore');
const rankingSection = document.getElementById('rankingSection');
const finalRanking = document.getElementById('finalRanking');
const initialRankingList = document.getElementById('initialRankingList');
const finalRankingList = document.getElementById('finalRankingList');
const playerNameInput = document.getElementById('playerName');
const saveScoreBtn = document.getElementById('saveScoreBtn');
const leftLivesContainer = document.getElementById('leftLives');
const rightLivesContainer = document.getElementById('rightLives');
const singlePlayerBtn = document.getElementById('singlePlayerBtn');
const multiPlayerBtn = document.getElementById('multiPlayerBtn');
const startSinglePlayerGameBtn = document.getElementById('startSinglePlayerGameBtn');
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
const AI_PADDLE_SPEED = 4;

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

// Carregar ranking do localStorage
let ranking = JSON.parse(localStorage.getItem('pongRanking')) || [];

document.addEventListener('keydown', (e) => (keys[e.key] = true));
document.addEventListener('keyup', (e) => (keys[e.key] = false));

function showSinglePlayerStartScreen() {
    startScreen.style.display = 'none';
    singlePlayerStartScreen.style.display = 'flex';
    updateRankingDisplay();
}

function startGame(isSinglePlayer) {
    singlePlayer = isSinglePlayer;
    singlePlayerStartScreen.style.display = 'none';
    gameScreen.style.display = 'flex';
    rightLivesContainer.style.display = singlePlayer ? 'none' : 'flex';
    currentScoreDisplay.parentElement.style.display = singlePlayer ? 'block' : 'none';
    resetGame();
    gameLoop();
}

singlePlayerBtn.addEventListener('click', showSinglePlayerStartScreen);
multiPlayerBtn.addEventListener('click', () => startGame(false));
startSinglePlayerGameBtn.addEventListener('click', () => startGame(true));

rematchBtn.addEventListener('click', () => {
    gameOverScreen.style.display = 'none';
    gameScreen.style.display = 'flex';
    rankingSection.style.display = 'none';
    finalRanking.style.display = 'none';
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
    finalRanking.style.display = 'none';
    finalScoreDisplay.style.display = 'none';
    playerNameInput.value = '';
    saveScoreBtn.disabled = false;
});

saveScoreBtn.addEventListener('click', () => {
    const name = playerNameInput.value.trim();
    if (name) {
        ranking.push({ name, score });
        ranking.sort((a, b) => b.score - a.score); // Ordenar do maior para o menor
        ranking = ranking.slice(0, 10); // Limitar a 10 entradas
        localStorage.setItem('pongRanking', JSON.stringify(ranking));
        updateRankingDisplay();
        alert('Pontuação salva com sucesso!');
        saveScoreBtn.disabled = true;
        rankingSection.style.display = 'none';
        finalRanking.style.display = 'block';
    } else {
        alert('Digite seu nome para salvar a pontuação.');
    }
});

function updateRankingDisplay() {
    initialRankingList.innerHTML = '';
    finalRankingList.innerHTML = '';
    ranking.forEach((entry, index) => {
        const li = document.createElement('li');
        li.textContent = `${index + 1}. ${entry.name}: ${entry.score} ponto${entry.score !== 1 ? 's' : ''}`;
        initialRankingList.appendChild(li);
        finalRankingList.appendChild(li.cloneNode(true));
    });
}

function draw() {
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'white';
    ctx.fillRect(0, leftPaddleY, PADDLE_WIDTH, PADDLE_HEIGHT);
    ctx.fillRect(canvas.width - PADDLE_WIDTH, rightPaddleY, PADDLE_WIDTH, PADDLE_HEIGHT);

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

function update() {
    if (!gameStarted || gameOver) return;

    if (keys['w'] && leftPaddleY > 0) leftPaddleY -= PADDLE_SPEED;
    if (keys['s'] && leftPaddleY < canvas.height - PADDLE_HEIGHT) leftPaddleY += PADDLE_SPEED;

    if (!singlePlayer) {
        if (keys['ArrowUp'] && rightPaddleY > 0) rightPaddleY -= PADDLE_SPEED;
        if (keys['ArrowDown'] && rightPaddleY < canvas.height - PADDLE_HEIGHT) rightPaddleY += PADDLE_SPEED;
    } else {
        const paddleCenter = rightPaddleY + PADDLE_HEIGHT / 2;
        if (paddleCenter < ballY - 35) {
            rightPaddleY += AI_PADDLE_SPEED;
        } else if (paddleCenter > ballY + 35) {
            rightPaddleY -= AI_PADDLE_SPEED;
        }
        rightPaddleY = Math.max(0, Math.min(canvas.height - PADDLE_HEIGHT, rightPaddleY));
    }

    ballX += ballSpeedX;
    ballY += ballSpeedY;

    if (ballY <= BALL_SIZE / 2 || ballY >= canvas.height - BALL_SIZE / 2) {
        ballSpeedY *= -1;
    }

    const leftPaddle = { x: 0, y: leftPaddleY, width: PADDLE_WIDTH, height: PADDLE_HEIGHT };
    const rightPaddle = { x: canvas.width - PADDLE_WIDTH, y: rightPaddleY, width: PADDLE_WIDTH, height: PADDLE_HEIGHT };
    const ball = { x: ballX, y: ballY, width: BALL_SIZE, height: BALL_SIZE };

    if (ballSpeedX < 0 && collides(ball, leftPaddle)) {
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

    if (leftLives <= 0 || (!singlePlayer && rightLives <= 0)) {
        gameOver = true;
        gameScreen.style.display = 'none';
        gameOverScreen.style.display = 'flex';
        if (singlePlayer) {
            gameOverMessage.textContent = 'Você perdeu todas as vidas!';
            finalScoreDisplay.textContent = `Sua pontuação: ${score} ponto${score !== 1 ? 's' : ''}`;
            finalScoreDisplay.style.display = 'block';
            rankingSection.style.display = 'flex';
            finalRanking.style.display = 'none';
            updateRankingDisplay();
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
