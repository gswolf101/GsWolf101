const canvas = document.getElementById('pongCanvas');
const ctx = canvas.getContext('2d');
const startScreen = document.getElementById('startScreen');
const singlePlayerStartScreen = document.getElementById('singlePlayerStartScreen');
const multiplayerStartScreen = document.getElementById('multiplayerStartScreen');
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
const startMultiplayerGameBtn = document.getElementById('startMultiplayerGameBtn');
const rematchBtn = document.getElementById('rematchBtn');
const backToMenuBtn = document.getElementById('backToMenuBtn');
const backToMenuSinglePlayerBtn = document.getElementById('backToMenuSinglePlayerBtn');
const backToMenuMultiplayerBtn = document.getElementById('backToMenuMultiplayerBtn');
const currentScoreDisplay = document.getElementById('currentScore');
const currentGoalsDisplay = document.getElementById('currentGoals');
const leftPowerDisplay = document.getElementById('leftPower');
const rightPowerDisplay = document.getElementById('rightPower');

const PADDLE_WIDTH = 15;
const PADDLE_HEIGHT = 120;
const PADDLE_GROW_HEIGHT = 200; // Altura da raquete ao ativar Crescer
const BALL_SIZE = 15;
const PADDLE_SPEED = 6;
const INITIAL_BALL_SPEED = 4;
const BALL_SPEED_INCREMENT = 0.4;
const MAX_BALL_SPEED = 14;
const AI_PADDLE_SPEED = 7;
const AI_TRACKING_MARGIN = 10;
const TRAIL_LENGTH = 12;
const MYSTERY_BOX_SIZE = 30;
const MYSTERY_BOX_SPAWN_INTERVAL = 5000; // 5 segundos
const SHIELD_DURATION = 2000; // 2 segundos
const LIGHTNING_PAUSE_DURATION = 2000; // 2 segundos para Raio
const GROW_DURATION = 10000; // 10 segundos para Crescer

let ballX = canvas.width / 2;
let ballY = canvas.height / 2;
let ballSpeedX = INITIAL_BALL_SPEED * (Math.random() > 0.5 ? 1 : -1);
let ballSpeedY = INITIAL_BALL_SPEED * (Math.random() > 0.5 ? 1 : -1);
let leftPaddleY = canvas.height / 2 - PADDLE_HEIGHT / 2;
let rightPaddleY = canvas.height / 2 - PADDLE_HEIGHT / 2;
let leftPaddleHeight = PADDLE_HEIGHT; // Altura dinâmica para a raquete esquerda
let rightPaddleHeight = PADDLE_HEIGHT; // Altura dinâmica para a raquete direita
let leftLives = 3;
let rightLives = 3;
let singlePlayer = false;
let gameStarted = false;
let gameOver = false;
let score = 0;
let goals = 0;
let trail = [];
let lastPlayerTouched = null;
let mysteryBox = null;
let leftPower = null;
let rightPower = null;
let leftShieldActive = false;
let rightShieldActive = false;
let leftShieldEndTime = 0;
let rightShieldEndTime = 0;
let leftGrowActive = false;
let rightGrowActive = false;
let leftGrowEndTime = 0;
let rightGrowEndTime = 0;
let lastBoxSpawnTime = 0;
let isBallPaused = false;
let pauseStartTime = 0;
let pendingLightningLaunch = null;
let powerCounts = { shield: 0, lightning: 0, reverse: 0, grow: 0 };
let animationFrameId = null;

let keys = {};
let ranking = JSON.parse(localStorage.getItem('pongRanking')) || [];

document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    if (e.key === 'e' && leftPower && !gameOver && !isBallPaused) {
        activatePower('left');
    }
    if (e.key === 'Enter' && rightPower && !gameOver && !singlePlayer && !isBallPaused) {
        activatePower('right');
    }
});
document.addEventListener('keyup', (e) => (keys[e.key] = false));

function hideAllScreens() {
    startScreen.style.display = 'none';
    singlePlayerStartScreen.style.display = 'none';
    multiplayerStartScreen.style.display = 'none';
    gameScreen.style.display = 'none';
    gameOverScreen.style.display = 'none';
}

function showStartScreen() {
    console.log('Exibindo menu principal');
    hideAllScreens();
    startScreen.style.display = 'flex';
}

function showSinglePlayerScreen() {
    console.log('Exibindo tela de single-player');
    hideAllScreens();
    singlePlayerStartScreen.style.display = 'flex';
    updateRankingDisplay();
}

function showMultiplayerScreen() {
    console.log('Exibindo tela de multiplayer');
    hideAllScreens();
    multiplayerStartScreen.style.display = 'flex';
}

function startGame(isSinglePlayer) {
    console.log(`Iniciando jogo: ${isSinglePlayer ? 'Single Player' : 'Multiplayer'}`);
    singlePlayer = isSinglePlayer;
    hideAllScreens();
    gameScreen.style.display = 'flex';
    rightLivesContainer.style.display = singlePlayer ? 'none' : 'flex';
    currentScoreDisplay.parentElement.style.display = singlePlayer ? 'block' : 'none';
    resetGame();
    gameLoop();
}

singlePlayerBtn.addEventListener('click', showSinglePlayerScreen);
multiPlayerBtn.addEventListener('click', showMultiplayerScreen);
startSinglePlayerGameBtn.addEventListener('click', () => startGame(true));
startMultiplayerGameBtn.addEventListener('click', () => startGame(false));
backToMenuSinglePlayerBtn.addEventListener('click', showStartScreen);
backToMenuMultiplayerBtn.addEventListener('click', showStartScreen);

rematchBtn.addEventListener('click', () => {
    console.log('Revanche iniciada');
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    hideAllScreens();
    gameScreen.style.display = 'flex';
    rightLivesContainer.style.display = singlePlayer ? 'none' : 'flex';
    currentScoreDisplay.parentElement.style.display = singlePlayer ? 'block' : 'none';
    rankingSection.style.display = 'none';
    finalRanking.style.display = 'none';
    finalScoreDisplay.style.display = 'none';
    playerNameInput.value = '';
    saveScoreBtn.disabled = false;
    resetGame();
    gameOver = false;
    gameLoop();
});

backToMenuBtn.addEventListener('click', () => {
    console.log('Voltando ao menu principal');
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    showStartScreen();
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
        ranking.sort((a, b) => b.score - a.score);
        ranking = ranking.slice(0, 10);
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

    ctx.fillStyle = leftShieldActive ? '#00f' : 'white';
    ctx.fillRect(0, leftPaddleY, PADDLE_WIDTH, leftPaddleHeight);
    ctx.fillStyle = rightShieldActive ? '#00f' : 'white';
    ctx.fillRect(canvas.width - PADDLE_WIDTH, rightPaddleY, PADDLE_WIDTH, rightPaddleHeight);

    if (mysteryBox) {
        ctx.fillStyle = 'yellow';
        ctx.fillRect(mysteryBox.x, mysteryBox.y, MYSTERY_BOX_SIZE, MYSTERY_BOX_SIZE);
        ctx.fillStyle = 'black';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('?', mysteryBox.x + MYSTERY_BOX_SIZE / 2, mysteryBox.y + MYSTERY_BOX_SIZE / 2);
    }

    trail.forEach((pos, index) => {
        ctx.beginPath();
        const opacity = (index + 1) / TRAIL_LENGTH;
        ctx.globalAlpha = opacity * 0.7;
        ctx.arc(pos.x, pos.y, (BALL_SIZE / 2) * (0.6 + 0.4 * opacity), 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.closePath();
    });
    ctx.globalAlpha = 1;

    ctx.beginPath();
    ctx.arc(ballX, ballY, BALL_SIZE / 2, 0, Math.PI * 2);
    ctx.fillStyle = isBallPaused ? '#800080' : 'white';
    ctx.fill();
    ctx.closePath();

    ctx.setLineDash([5, 15]);
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.strokeStyle = 'white';
    ctx.stroke();
    ctx.setLineDash([]);

    if (isBallPaused && pauseStartTime > 0) {
        const timeLeft = Math.max(0, (LIGHTNING_PAUSE_DURATION - (Date.now() - pauseStartTime)) / 1000);
        ctx.font = '20px Arial';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.fillText(`Lançando em: ${Math.ceil(timeLeft)}s`, canvas.width / 2, 50);
    }
}

function spawnMysteryBox() {
    const possiblePositions = [
        { x: canvas.width / 4, y: canvas.height / 4 },
        { x: canvas.width / 4, y: (3 * canvas.height) / 4 },
        { x: (3 * canvas.width) / 4, y: canvas.height / 4 },
        { x: (3 * canvas.width) / 4, y: (3 * canvas.height) / 4 },
    ];
    mysteryBox = possiblePositions[Math.floor(Math.random() * possiblePositions.length)];
}

function getRandomPower() {
    const powers = ['shield', 'lightning', 'reverse', 'grow'];
    const randomIndex = Math.floor(Math.random() * powers.length);
    const selectedPower = powers[randomIndex];
    powerCounts[selectedPower]++;
    console.log(`Poder sorteado: ${selectedPower} (índice: ${randomIndex})`, powerCounts);
    return selectedPower;
}

function activatePower(player) {
    const power = player === 'left' ? leftPower : rightPower;
    if (!power) return;

    console.log(`${player} ativou poder: ${power}`);

    if (power === 'shield') {
        if (player === 'left') {
            leftShieldActive = true;
            leftShieldEndTime = Date.now() + SHIELD_DURATION;
        } else {
            rightShieldActive = true;
            rightShieldEndTime = Date.now() + SHIELD_DURATION;
        }
    } else if (power === 'lightning') {
        ballX = player === 'left' ? PADDLE_WIDTH + BALL_SIZE / 2 : canvas.width - PADDLE_WIDTH - BALL_SIZE / 2;
        ballY = (player === 'left' ? leftPaddleY : rightPaddleY) + (player === 'left' ? leftPaddleHeight : rightPaddleHeight) / 2;
        ballSpeedX = 0;
        ballSpeedY = 0;
        isBallPaused = true;
        pauseStartTime = Date.now();
        pendingLightningLaunch = {
            player: player,
            speedX: (player === 'left' ? 1 : -1) * MAX_BALL_SPEED * 1.2,
            speedY: 0
        };
        lastPlayerTouched = player;
        console.log(`Raio ativado para ${player}: Pausado em x=${ballX.toFixed(2)}, y=${ballY.toFixed(2)}`);
    } else if (power === 'reverse') {
        ballSpeedX = -ballSpeedX;
        ballSpeedY = -ballSpeedY;
        console.log(`Inversão ativada: Velocidade X=${ballSpeedX.toFixed(2)}, Y=${ballSpeedY.toFixed(2)}`);
    } else if (power === 'grow') {
        if (player === 'left') {
            leftGrowActive = true;
            leftGrowEndTime = Date.now() + GROW_DURATION;
            leftPaddleHeight = PADDLE_GROW_HEIGHT;
            leftPaddleY = Math.max(0, Math.min(canvas.height - leftPaddleHeight, leftPaddleY));
        } else {
            rightGrowActive = true;
            rightGrowEndTime = Date.now() + GROW_DURATION;
            rightPaddleHeight = PADDLE_GROW_HEIGHT;
            rightPaddleY = Math.max(0, Math.min(canvas.height - rightPaddleHeight, rightPaddleY));
        }
        console.log(`Crescer ativado para ${player}: Altura da raquete=${player === 'left' ? leftPaddleHeight : rightPaddleHeight}`);
    }

    if (player === 'left') {
        leftPower = null;
        leftPowerDisplay.textContent = 'Poder: Nenhum';
        leftPowerDisplay.className = 'power-display';
    } else {
        rightPower = null;
        rightPowerDisplay.textContent = 'Poder: Nenhum';
        rightPowerDisplay.className = 'power-display';
    }
}

function update() {
    if (!gameStarted || gameOver) return;

    if (keys['w'] && leftPaddleY > 0) leftPaddleY -= PADDLE_SPEED;
    if (keys['s'] && leftPaddleY < canvas.height - leftPaddleHeight) leftPaddleY += PADDLE_SPEED;

    if (!singlePlayer) {
        if (keys['ArrowUp'] && rightPaddleY > 0) rightPaddleY -= PADDLE_SPEED;
        if (keys['ArrowDown'] && rightPaddleY < canvas.height - rightPaddleHeight) rightPaddleY += PADDLE_SPEED;
    } else {
        const paddleCenter = rightPaddleY + rightPaddleHeight / 2;
        if (paddleCenter < ballY - AI_TRACKING_MARGIN && !isBallPaused) {
            rightPaddleY += AI_PADDLE_SPEED;
        } else if (paddleCenter > ballY + AI_TRACKING_MARGIN && !isBallPaused) {
            rightPaddleY -= AI_PADDLE_SPEED;
        }
        rightPaddleY = Math.max(0, Math.min(canvas.height - rightPaddleHeight, rightPaddleY));
    }

    if (isBallPaused) {
        if (!pendingLightningLaunch || !pauseStartTime) {
            console.error('Erro: Estado inválido do Raio', { pendingLightningLaunch, pauseStartTime });
            isBallPaused = false;
            pendingLightningLaunch = null;
            pauseStartTime = 0;
            resetBall();
            return;
        }

        if (Date.now() - pauseStartTime >= LIGHTNING_PAUSE_DURATION) {
            console.log(`Lançando bola: speedX=${pendingLightningLaunch.speedX.toFixed(2)}, speedY=${pendingLightningLaunch.speedY.toFixed(2)}`);
            ballSpeedX = pendingLightningLaunch.speedX;
            ballSpeedY = pendingLightningLaunch.speedY;
            isBallPaused = false;
            pendingLightningLaunch = null;
            pauseStartTime = 0;
            return;
        }

        if (pendingLightningLaunch.player === 'left') {
            ballY = leftPaddleY + leftPaddleHeight / 2;
        } else {
            ballY = rightPaddleY + rightPaddleHeight / 2;
        }
        trail = [];
        return;
    }

    trail.push({ x: ballX, y: ballY });
    if (trail.length > TRAIL_LENGTH) {
        trail.shift();
    }

    ballX += ballSpeedX;
    ballY += ballSpeedY;

    if (ballY <= BALL_SIZE / 2 || ballY >= canvas.height - BALL_SIZE / 2) {
        ballSpeedY = -ballSpeedY;
    }

    const leftPaddle = { x: 0, y: leftPaddleY, width: PADDLE_WIDTH, height: leftPaddleHeight };
    const rightPaddle = { x: canvas.width - PADDLE_WIDTH, y: rightPaddleY, width: PADDLE_WIDTH, height: rightPaddleHeight };
    const ball = { x: ballX, y: ballY, width: BALL_SIZE, height: BALL_SIZE };

    if (ballSpeedX < 0 && collides(ball, leftPaddle)) {
        const hitPoint = (ballY - (leftPaddle.y + leftPaddleHeight / 2)) / (leftPaddleHeight / 2);
        ballSpeedX = Math.min(Math.abs(ballSpeedX) + BALL_SPEED_INCREMENT, MAX_BALL_SPEED);
        ballSpeedY = hitPoint * (MAX_BALL_SPEED / 2);
        ballX = leftPaddle.x + leftPaddle.width + BALL_SIZE / 2;
        lastPlayerTouched = 'left';
        console.log(`Ball Speed: X=${ballSpeedX.toFixed(2)}, Y=${ballSpeedY.toFixed(2)}`);
        updateScoreDisplay();
    } else if (ballSpeedX > 0 && collides(ball, rightPaddle)) {
        const hitPoint = (ballY - (rightPaddle.y + rightPaddleHeight / 2)) / (rightPaddleHeight / 2);
        ballSpeedX = -Math.min(Math.abs(ballSpeedX) + BALL_SPEED_INCREMENT, MAX_BALL_SPEED);
        ballSpeedY = hitPoint * (MAX_BALL_SPEED / 2);
        ballX = rightPaddle.x - BALL_SIZE / 2;
        lastPlayerTouched = 'right';
        console.log(`Ball Speed: X=${ballSpeedX.toFixed(2)}, Y=${ballSpeedY.toFixed(2)}`);
        updateScoreDisplay();
    }

    if (mysteryBox) {
        const box = {
            x: mysteryBox.x,
            y: mysteryBox.y,
            width: MYSTERY_BOX_SIZE,
            height: MYSTERY_BOX_SIZE,
        };
        if (collides(ball, box)) {
            if (lastPlayerTouched) {
                const power = getRandomPower();
                console.log(`Atribuindo poder ${power} ao jogador ${lastPlayerTouched}`);
                if (lastPlayerTouched === 'left') {
                    leftPower = power;
                    leftPowerDisplay.textContent = `Poder: ${power === 'shield' ? 'Escudo' : power === 'lightning' ? 'Raio' : power === 'reverse' ? 'Inversão' : 'Crescer'}`;
                    leftPowerDisplay.className = `power-display power-${power}`;
                } else {
                    rightPower = power;
                    rightPowerDisplay.textContent = `Poder: ${power === 'shield' ? 'Escudo' : power === 'lightning' ? 'Raio' : power === 'reverse' ? 'Inversão' : 'Crescer'}`;
                    rightPowerDisplay.className = `power-display power-${power}`;
                }
            }
            mysteryBox = null;
        }
    }

    if (!mysteryBox && Date.now() - lastBoxSpawnTime > MYSTERY_BOX_SPAWN_INTERVAL && Math.random() < 0.1) {
        spawnMysteryBox();
        lastBoxSpawnTime = Date.now();
    }

    if (leftShieldActive && Date.now() > leftShieldEndTime) {
        leftShieldActive = false;
        leftPower = null;
        leftPowerDisplay.textContent = 'Poder: Nenhum';
        leftPowerDisplay.className = 'power-display';
    }
    if (rightShieldActive && Date.now() > rightShieldEndTime) {
        rightShieldActive = false;
        rightPower = null;
        rightPowerDisplay.textContent = 'Poder: Nenhum';
        rightPowerDisplay.className = 'power-display';
    }

    if (leftGrowActive && Date.now() > leftGrowEndTime) {
        leftGrowActive = false;
        leftPaddleHeight = PADDLE_HEIGHT;
        leftPaddleY = Math.max(0, Math.min(canvas.height - leftPaddleHeight, leftPaddleY));
        console.log('Crescer expirado para esquerda: Altura da raquete=', leftPaddleHeight);
    }
    if (rightGrowActive && Date.now() > rightGrowEndTime) {
        rightGrowActive = false;
        rightPaddleHeight = PADDLE_HEIGHT;
        rightPaddleY = Math.max(0, Math.min(canvas.height - rightPaddleHeight, rightPaddleY));
        console.log('Crescer expirado para direita: Altura da raquete=', rightPaddleHeight);
    }

    if (ballX <= BALL_SIZE / 2) {
        if (!leftShieldActive) {
            leftLives--;
        }
        updateLivesDisplay();
        updateScoreDisplay();
        resetBall();
    } else if (ballX >= canvas.width - BALL_SIZE / 2) {
        if (!rightShieldActive) {
            rightLives--;
            if (singlePlayer) {
                score += 10; // 10 pontos por gol no modo solo
                goals++; // Contar gol feito pelo jogador
                console.log(`Gol marcado pelo jogador! Pontos: ${score}, Gols: ${goals}`);
            }
        }
        updateLivesDisplay();
        updateScoreDisplay();
        resetBall();
    }

    if (leftLives <= 0 || (!singlePlayer && rightLives <= 0)) {
        gameOver = true;
        hideAllScreens();
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

function collides(ball, obj) {
    return (
        ball.x - BALL_SIZE / 2 < obj.x + obj.width &&
        ball.x + BALL_SIZE / 2 > obj.x &&
        ball.y - BALL_SIZE / 2 < obj.y + obj.height &&
        ball.y + BALL_SIZE / 2 > obj.y
    );
}

function updateLivesDisplay() {
    document.getElementById('leftLife1').style.display = leftLives >= 1 ? 'inline-block' : 'none';
    document.getElementById('leftLife2').style.display = leftLives >= 2 ? 'inline-block' : 'none';
    document.getElementById('leftLife3').style.display = leftLives >= 3 ? 'inline-block' : 'none';
    document.getElementById('rightLife1').style.display = rightLives >= 1 ? 'inline-block' : 'none';
    document.getElementById('rightLife2').style.display = rightLives >= 2 ? 'inline-block' : 'none';
    document.getElementById('rightLife3').style.display = rightLives >= 3 ? 'inline-block' : 'none';
}

function updateScoreDisplay() {
    if (currentScoreDisplay) {
        currentScoreDisplay.textContent = score;
    }
    if (currentGoalsDisplay) {
        currentGoalsDisplay.textContent = goals;
    }
}

function resetBall() {
    ballX = canvas.width / 2;
    ballY = canvas.height / 2;
    ballSpeedX = INITIAL_BALL_SPEED * (Math.random() > 0.5 ? 1 : -1);
    ballSpeedY = INITIAL_BALL_SPEED * (Math.random() > 0.5 ? 1 : -1);
    trail = [];
    lastPlayerTouched = null;
    isBallPaused = false;
    pendingLightningLaunch = null;
    pauseStartTime = 0;
}

function resetGame() {
    console.log('Resetando estado do jogo');
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    leftLives = 3;
    rightLives = 3;
    score = 0;
    goals = 0;
    leftPaddleY = canvas.height / 2 - PADDLE_HEIGHT / 2;
    rightPaddleY = canvas.height / 2 - PADDLE_HEIGHT / 2;
    leftPaddleHeight = PADDLE_HEIGHT;
    rightPaddleHeight = PADDLE_HEIGHT;
    ballX = canvas.width / 2;
    ballY = canvas.height / 2;
    ballSpeedX = INITIAL_BALL_SPEED * (Math.random() > 0.5 ? 1 : -1);
    ballSpeedY = INITIAL_BALL_SPEED * (Math.random() > 0.5 ? 1 : -1);
    trail = [];
    lastPlayerTouched = null;
    mysteryBox = null;
    leftPower = null;
    rightPower = null;
    leftShieldActive = false;
    rightShieldActive = false;
    leftShieldEndTime = 0;
    rightShieldEndTime = 0;
    leftGrowActive = false;
    rightGrowActive = false;
    leftGrowEndTime = 0;
    rightGrowEndTime = 0;
    lastBoxSpawnTime = 0;
    isBallPaused = false;
    pendingLightningLaunch = null;
    pauseStartTime = 0;
    powerCounts = { shield: 0, lightning: 0, reverse: 0, grow: 0 };
    leftPowerDisplay.textContent = 'Poder: Nenhum';
    leftPowerDisplay.className = 'power-display';
    rightPowerDisplay.textContent = 'Poder: Nenhum';
    rightPowerDisplay.className = 'power-display';
    updateLivesDisplay();
    updateScoreDisplay();
    gameStarted = true;
    gameOver = false;
}

function gameLoop() {
    if (!gameOver) {
        update();
        draw();
        animationFrameId = requestAnimationFrame(gameLoop);
    }
}
