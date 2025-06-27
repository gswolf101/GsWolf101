// Verificação inicial de elementos críticos
const canvas = document.getElementById('pongCanvas');
const ctx = canvas ? canvas.getContext('2d') : null;
if (!canvas || !ctx) {
    console.error('Erro: Canvas ou contexto 2D não encontrado', { canvas: !!canvas, ctx: !!ctx });
    alert('Erro ao carregar o jogo: Canvas não encontrado. Verifique o HTML.');
    throw new Error('Canvas não encontrado');
}

// Carregar imagem da bola
const ballImage = new Image();
ballImage.src = 'imagens/Bola-de-fogo.png';
let ballImageLoaded = false;
ballImage.onload = () => {
    ballImageLoaded = true;
    console.log('Imagem da bola carregada com sucesso');
};
ballImage.onerror = () => {
    console.error('Erro ao carregar a imagem da bola');
    alert('Erro ao carregar a imagem da bola. Usando círculo padrão.');
};

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
const backToStartScreenSinglePlayerBtn = document.getElementById('backToStartScreenSinglePlayerBtn');
const backToStartScreenMultiplayerBtn = document.getElementById('backToStartScreenMultiplayerBtn');
const backToCentralBtn = document.getElementById('backToCentralBtn');
const backToCentralBtnSingle = document.getElementById('backToCentralBtnSingle');
const backToCentralBtnMulti = document.getElementById('backToCentralBtnMulti');
const rematchBtn = document.getElementById('rematchBtn');
const backToMenuBtn = document.getElementById('backToMenuBtn');
const currentScoreDisplay = document.getElementById('currentScore');
const currentGoalsDisplay = document.getElementById('currentGoals');
const leftPowerDisplay = document.getElementById('leftPower');
const rightPowerDisplay = document.getElementById('rightPower');

if (!startScreen || !singlePlayerStartScreen || !multiplayerStartScreen || !gameScreen) {
    console.error('Erro: Elementos DOM essenciais não encontrados', {
        startScreen: !!startScreen,
        singlePlayerStartScreen: !!singlePlayerStartScreen,
        multiplayerStartScreen: !!multiplayerStartScreen,
        gameScreen: !!gameScreen
    });
    alert('Erro: Elementos DOM essenciais não encontrados. Verifique o HTML.');
}

const PADDLE_WIDTH = 15;
const PADDLE_HEIGHT = 120;
const PADDLE_GROW_HEIGHT = 200;
const BALL_SIZE = 22; // 75% de 30 = 22.5, arredondado para 22
const PADDLE_SPEED = 360;
const INITIAL_BALL_SPEED = 240;
const BALL_SPEED_INCREMENT = 24;
const MAX_BALL_SPEED = 840;
const MAX_BALL_SPEED_GROWBALL = 1050; // 840 + (840 * 0.25)
const AI_PADDLE_SPEED = 420;
const AI_TRACKING_MARGIN = 10;
const TRAIL_LENGTH = 12;
const TRAIL_SPACING = 5;
const MYSTERY_BOX_SIZE = 30;
const MYSTERY_BOX_SPAWN_INTERVAL = 5000;
const MYSTERY_BOX_DURATION = 10000;
const SHIELD_DURATION = 2000;
const LIGHTNING_PAUSE_DURATION = 2000;
const GROW_DURATION = 10000;
const GROWBALL_DURATION = 15000; // 15 segundos
const BORDER_THICKNESS = 5;

let ballX = canvas ? canvas.width / 2 : 400;
let ballY = canvas ? canvas.height / 2 : 300;
let ballSpeedX = INITIAL_BALL_SPEED * (Math.random() > 0.5 ? 1 : -1);
let ballSpeedY = INITIAL_BALL_SPEED * (Math.random() > 0.5 ? 1 : -1);
let leftPaddleY = canvas ? canvas.height / 2 - PADDLE_HEIGHT / 2 : 240;
let rightPaddleY = canvas ? canvas.height / 2 - PADDLE_HEIGHT / 2 : 240;
let leftPaddleHeight = PADDLE_HEIGHT;
let rightPaddleHeight = PADDLE_HEIGHT;
let leftLives = 3;
let rightLives = 3;
let singlePlayer = false;
let gameStarted = false;
let gameOver = false;
let paused = false;
let score = 0;
let goals = 0;
let trail = [];
let lastPlayerTouched = null;
let mysteryBox = null;
let mysteryBoxEndTime = 0;
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
let growBallActive = false;
let growBallEndTime = 0;
let currentBallSize = BALL_SIZE; // 22 normal, 33 com growBall
let currentMaxBallSpeed = MAX_BALL_SPEED; // 840 normal, 1050 com growBall
let lastBoxSpawnTime = 0;
let isBallPaused = false;
let pauseStartTime = 0;
let pendingLightningLaunch = null;
let powerCounts = { shield: 0, lightning: 0, reverse: 0, grow: 0, growBall: 0 };
let animationFrameId = null;
let lastLeftPaddleCollision = false;
let lastTime = performance.now();
let lastTrailPosition = { x: ballX, y: ballY };

let keys = {};
let ranking = JSON.parse(localStorage.getItem('pongRanking')) || [];

// Função para inicializar o jogo
function initGame() {
    console.log('Inicializando o jogo...');
    resizeCanvas();
    resetGame();
    if (ctx) {
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        console.log('Canvas inicializado com fundo preto');
    }
}

// Ajustar canvas para responsividade
function resizeCanvas() {
    if (!canvas) return;
    canvas.width = Math.min(window.innerWidth * 0.8, 800);
    canvas.height = Math.min(window.innerHeight * 0.8, 600);
    ballX = canvas.width / 2;
    ballY = canvas.height / 2;
    leftPaddleY = canvas.height / 2 - leftPaddleHeight / 2;
    rightPaddleY = canvas.height / 2 - rightPaddleHeight / 2;
    console.log(`Canvas redimensionado: ${canvas.width}x${canvas.height}`);
}
window.addEventListener('resize', resizeCanvas);

// Controles de toque
canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const touchY = (touch.clientY - rect.top) * (canvas.height / rect.height);
    if (touch.clientX < rect.width / 2) {
        leftPaddleY = Math.max(0, Math.min(canvas.height - leftPaddleHeight, touchY - leftPaddleHeight / 2));
        console.log(`Toque: Movendo raquete esquerda para y=${leftPaddleY.toFixed(2)}`);
    } else if (!singlePlayer) {
        rightPaddleY = Math.max(0, Math.min(canvas.height - rightPaddleHeight, touchY - rightPaddleHeight / 2));
        console.log(`Toque: Movendo raquete direita para y=${rightPaddleY.toFixed(2)}`);
    }
});

// Controles de teclado
document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    console.log(`Tecla pressionada: ${e.key}`);
    if (e.key === 'e' && leftPower && !gameOver && !isBallPaused && !paused) {
        activatePower('left');
    }
    if (e.key === 'Enter' && rightPower && !gameOver && !singlePlayer && !isBallPaused && !paused) {
        activatePower('right');
    }
    if (e.key === 'Escape' && gameStarted && !gameOver) {
        paused = !paused;
        console.log(`Jogo ${paused ? 'pausado' : 'retomado'}`);
        if (!paused) gameLoop();
    }
});
document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
    console.log(`Tecla solta: ${e.key}`);
});

function hideAllScreens() {
    console.log('Escondendo todas as telas');
    if (startScreen) startScreen.style.display = 'none';
    if (singlePlayerStartScreen) singlePlayerStartScreen.style.display = 'none';
    if (multiplayerStartScreen) multiplayerStartScreen.style.display = 'none';
    if (gameScreen) gameScreen.style.display = 'none';
    if (gameOverScreen) gameOverScreen.style.display = 'none';
}

function showStartScreen() {
    console.log('Exibindo menu principal');
    hideAllScreens();
    if (startScreen) startScreen.style.display = 'flex';
}

function showSinglePlayerScreen() {
    console.log('Exibindo tela de single-player');
    hideAllScreens();
    if (singlePlayerStartScreen) {
        singlePlayerStartScreen.style.display = 'flex';
        updateRankingDisplay();
    } else {
        console.error('Erro: singlePlayerStartScreen não encontrado');
    }
}

function showMultiplayerScreen() {
    console.log('Exibindo tela de multiplayer');
    hideAllScreens();
    if (multiplayerStartScreen) {
        multiplayerStartScreen.style.display = 'flex';
    } else {
        console.error('Erro: multiplayerStartScreen não encontrado');
    }
}

function startGame(isSinglePlayer) {
    console.log(`Iniciando jogo: ${isSinglePlayer ? 'Single Player' : 'Multiplayer'}`);
    singlePlayer = isSinglePlayer;
    hideAllScreens();
    if (!gameScreen || !rightLivesContainer || !currentScoreDisplay) {
        console.error('Erro: Elementos do gameScreen não encontrados', {
            gameScreen: !!gameScreen,
            rightLivesContainer: !!rightLivesContainer,
            currentScoreDisplay: !!currentScoreDisplay
        });
        alert('Erro: Elementos do jogo não encontrados. Verifique o HTML.');
        return;
    }
    gameScreen.style.display = 'block';
    rightLivesContainer.style.display = singlePlayer ? 'none' : 'flex';
    if (currentScoreDisplay.parentElement?.parentElement) {
        currentScoreDisplay.parentElement.parentElement.style.display = singlePlayer ? 'flex' : 'none';
    }
    initGame();
    lastTime = performance.now();
    gameStarted = true;
    gameOver = false;
    paused = false;
    console.log('Iniciando gameLoop');
    gameLoop();
}

// Event listeners para botões
if (singlePlayerBtn) singlePlayerBtn.addEventListener('click', showSinglePlayerScreen);
if (multiPlayerBtn) multiPlayerBtn.addEventListener('click', showMultiplayerScreen);
if (startSinglePlayerGameBtn) startSinglePlayerGameBtn.addEventListener('click', () => startGame(true));
if (startMultiplayerGameBtn) startMultiplayerGameBtn.addEventListener('click', () => startGame(false));
if (backToStartScreenSinglePlayerBtn) backToStartScreenSinglePlayerBtn.addEventListener('click', showStartScreen);
if (backToStartScreenMultiplayerBtn) backToStartScreenMultiplayerBtn.addEventListener('click', showStartScreen);
if (backToCentralBtn) {
    backToCentralBtn.addEventListener('click', () => {
        console.log('Redirecionando para Central de Jogos');
        window.location.href = 'https://gswolf101.github.io/GsWolf101/Jogos/CentralJogos.html';
    });
}
if (backToCentralBtnSingle) {
    backToCentralBtnSingle.addEventListener('click', () => {
        console.log('Redirecionando para Central de Jogos (Single Player)');
        window.location.href = 'https://gswolf101.github.io/GsWolf101/Jogos/CentralJogos.html';
    });
}
if (backToCentralBtnMulti) {
    backToCentralBtnMulti.addEventListener('click', () => {
        console.log('Redirecionando para Central de Jogos (Multiplayer)');
        window.location.href = 'https://gswolf101.github.io/GsWolf101/Jogos/CentralJogos.html';
    });
}

if (rematchBtn) {
    rematchBtn.addEventListener('click', () => {
        console.log('Revanche iniciada');
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
        hideAllScreens();
        if (gameScreen && rightLivesContainer && currentScoreDisplay) {
            gameScreen.style.display = 'block';
            rightLivesContainer.style.display = singlePlayer ? 'none' : 'flex';
            if (currentScoreDisplay.parentElement?.parentElement) {
                currentScoreDisplay.parentElement.parentElement.style.display = singlePlayer ? 'flex' : 'none';
            }
            rankingSection.style.display = 'none';
            finalRanking.style.display = 'none';
            finalScoreDisplay.style.display = 'none';
            playerNameInput.value = '';
            saveScoreBtn.disabled = false;
            initGame();
            lastTime = performance.now();
            gameStarted = true;
            gameOver = false;
            paused = false;
            console.log('Iniciando gameLoop para revanche');
            gameLoop();
        }
    });
}

if (backToMenuBtn) {
    backToMenuBtn.addEventListener('click', () => {
        console.log('Voltando ao menu principal');
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
        showStartScreen();
        if (rankingSection) rankingSection.style.display = 'none';
        if (finalRanking) finalRanking.style.display = 'none';
        if (finalScoreDisplay) finalScoreDisplay.style.display = 'none';
        if (playerNameInput) playerNameInput.value = '';
        if (saveScoreBtn) saveScoreBtn.disabled = false;
    });
}

if (saveScoreBtn) {
    saveScoreBtn.addEventListener('click', () => {
        const name = playerNameInput?.value.trim();
        if (name) {
            ranking.push({ name, score });
            ranking.sort((a, b) => b.score - a.score);
            ranking = ranking.slice(0, 10);
            localStorage.setItem('pongRanking', JSON.stringify(ranking));
            updateRankingDisplay();
            alert('Pontuação salva com sucesso!');
            saveScoreBtn.disabled = true;
            if (rankingSection) rankingSection.style.display = 'none';
            if (finalRanking) finalRanking.style.display = 'block';
        } else {
            alert('Digite seu nome para salvar a pontuação.');
        }
    });
}

function updateRankingDisplay() {
    if (initialRankingList && finalRankingList) {
        initialRankingList.innerHTML = '';
        finalRankingList.innerHTML = '';
        ranking.forEach((entry, index) => {
            const li = document.createElement('li');
            li.textContent = `${index + 1}. ${entry.name}: ${entry.score} ponto${entry.score !== 1 ? 's' : ''}`;
            initialRankingList.appendChild(li);
            finalRankingList.appendChild(li.cloneNode(true));
        });
    }
}

function draw() {
    if (!ctx) {
        console.error('Erro: Contexto do canvas não disponível');
        return;
    }
    console.log('Desenhando quadro');
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Desenhar bordas
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, BORDER_THICKNESS);
    ctx.fillRect(0, canvas.height - BORDER_THICKNESS, canvas.width, BORDER_THICKNESS);

    // Desenhar raquetes com animação de escudo
    ctx.fillStyle = leftShieldActive ? `rgba(0, 0, 255, ${1 - Math.sin(Date.now() / 100) * 0.5})` : 'white';
    ctx.fillRect(0, leftPaddleY, PADDLE_WIDTH, leftPaddleHeight);
    ctx.fillStyle = rightShieldActive ? `rgba(0, 0, 255, ${1 - Math.sin(Date.now() / 100) * 0.5})` : 'white';
    ctx.fillRect(canvas.width - PADDLE_WIDTH, rightPaddleY, PADDLE_WIDTH, rightPaddleHeight);

    // Desenhar caixa misteriosa
    if (mysteryBox) {
        ctx.fillStyle = 'yellow';
        ctx.fillRect(mysteryBox.x, mysteryBox.y, MYSTERY_BOX_SIZE, MYSTERY_BOX_SIZE);
        ctx.fillStyle = 'black';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('?', mysteryBox.x + MYSTERY_BOX_SIZE / 2, mysteryBox.y + MYSTERY_BOX_SIZE / 2);
    }

    // Desenhar rastro laranja
    trail.forEach((pos, index) => {
        ctx.beginPath();
        const opacity = (index + 1) / TRAIL_LENGTH;
        ctx.globalAlpha = opacity * 0.7;
        ctx.arc(pos.x, pos.y, (currentBallSize / 2) * (0.6 + 0.4 * opacity), 0, Math.PI * 2);
        ctx.fillStyle = '#FF4500';
        ctx.fill();
        ctx.closePath();
    });
    ctx.globalAlpha = 1;

    // Desenhar bola (imagem ou círculo de fallback)
    if (ballImageLoaded) {
        ctx.drawImage(ballImage, ballX - currentBallSize / 2, ballY - currentBallSize / 2, currentBallSize, currentBallSize);
    } else {
        ctx.beginPath();
        ctx.arc(ballX, ballY, currentBallSize / 2, 0, Math.PI * 2);
        ctx.fillStyle = isBallPaused ? '#800080' : 'white';
        ctx.fill();
        ctx.closePath();
    }

    // Linha central
    ctx.setLineDash([5, 15]);
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.strokeStyle = 'white';
    ctx.stroke();
    ctx.setLineDash([]);

    // Indicador de pausa do raio
    if (isBallPaused && pauseStartTime > 0) {
        const timeLeft = Math.max(0, (LIGHTNING_PAUSE_DURATION - (Date.now() - pauseStartTime)) / 1000);
        ctx.font = '20px Arial';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.fillText(`Lançando em: ${Math.ceil(timeLeft)}s`, canvas.width / 2, 50);
    }

    // Indicador de pausa do jogo
    if (paused) {
        ctx.font = '30px Arial';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.fillText('PAUSADO', canvas.width / 2, canvas.height / 2);
    }

    // Modo de depuração
    if (keys['d']) {
        ctx.font = '14px Arial';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'left';
        ctx.fillText(`Ball: x=${ballX.toFixed(0)}, y=${ballY.toFixed(0)}, speedX=${ballSpeedX.toFixed(0)}, size=${currentBallSize}, maxSpeed=${currentMaxBallSpeed}`, 10, 20);
        ctx.fillText(`Left Paddle: y=${leftPaddleY.toFixed(0)}`, 10, 40);
        ctx.fillText(`Right Paddle: y=${rightPaddleY.toFixed(0)}`, 10, 60);
        ctx.fillText(`Game State: started=${gameStarted}, over=${gameOver}, paused=${paused}`, 10, 80);
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
    mysteryBoxEndTime = Date.now() + MYSTERY_BOX_DURATION;
    console.log(`Caixa misteriosa gerada em x=${mysteryBox.x}, y=${mysteryBox.y}, expira em ${mysteryBoxEndTime}`);
}

function getRandomPower() {
    const powers = ['shield', 'lightning', 'reverse', 'grow', 'growBall'];
    const randomIndex = Math.floor(Math.random() * powers.length);
    const selectedPower = powers[randomIndex];
    powerCounts[selectedPower]++;
    console.log(`Poder sorteado: ${selectedPower} (índice: ${randomIndex})`, powerCounts);
    return selectedPower;
}

function activatePower(player) {
    const power = player === 'left' ? leftPower : rightPower;
    if (!power) {
        console.log(`Nenhum poder disponível para ${player}`);
        return;
    }

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
        ballX = player === 'left' ? PADDLE_WIDTH + currentBallSize / 2 : canvas.width - PADDLE_WIDTH - currentBallSize / 2;
        ballY = (player === 'left' ? leftPaddleY : rightPaddleY) + (player === 'left' ? leftPaddleHeight : rightPaddleHeight) / 2;
        ballSpeedX = 0;
        ballSpeedY = 0;
        isBallPaused = true;
        pauseStartTime = Date.now();
        pendingLightningLaunch = {
            player: player,
            speedX: (player === 'left' ? 1 : -1) * currentMaxBallSpeed,
            speedY: 0
        };
        lastPlayerTouched = player;
        trail = [];
    } else if (power === 'reverse') {
        ballSpeedX = -ballSpeedX;
        ballSpeedY = -ballSpeedY;
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
    } else if (power === 'growBall') {
        growBallActive = true;
        growBallEndTime = Date.now() + GROWBALL_DURATION;
        currentBallSize = BALL_SIZE * 1.5; // Aumenta 50% (22 -> 33 pixels)
        currentMaxBallSpeed = MAX_BALL_SPEED_GROWBALL; // 1050 pixels/segundo
        console.log('Poder growBall ativado: bola aumentada para 33 pixels, velocidade máxima 1050');
    }

    if (player === 'left') {
        leftPower = null;
        if (leftPowerDisplay) leftPowerDisplay.textContent = 'Poder: Nenhum';
        if (leftPowerDisplay) leftPowerDisplay.className = 'power-display';
    } else {
        rightPower = null;
        if (rightPowerDisplay) rightPowerDisplay.textContent = 'Poder: Nenhum';
        if (rightPowerDisplay) rightPowerDisplay.className = 'power-display';
    }
}

function update() {
    console.log('Atualizando estado do jogo');
    if (!gameStarted || gameOver || paused || !ctx) {
        console.log(`Update interrompido: gameStarted=${gameStarted}, gameOver=${gameOver}, paused=${paused}, ctx=${!!ctx}`);
        return;
    }

    const currentTime = performance.now();
    const deltaTime = Math.min((currentTime - lastTime) / 1000, 0.033);
    lastTime = currentTime;

    // Movimento das raquetes
    if (keys['w'] && leftPaddleY > 0) {
        leftPaddleY -= PADDLE_SPEED * deltaTime;
    }
    if (keys['s'] && leftPaddleY < canvas.height - leftPaddleHeight) {
        leftPaddleY += PADDLE_SPEED * deltaTime;
    }

    if (!singlePlayer) {
        if (keys['ArrowUp'] && rightPaddleY > 0) {
            rightPaddleY -= PADDLE_SPEED * deltaTime;
        }
        if (keys['ArrowDown'] && rightPaddleY < canvas.height - rightPaddleHeight) {
            rightPaddleY += PADDLE_SPEED * deltaTime;
        }
    } else {
        const paddleCenter = rightPaddleY + rightPaddleHeight / 2;
        if (paddleCenter < ballY - AI_TRACKING_MARGIN && !isBallPaused) {
            rightPaddleY += AI_PADDLE_SPEED * deltaTime;
        } else if (paddleCenter > ballY + AI_TRACKING_MARGIN && !isBallPaused) {
            rightPaddleY -= AI_PADDLE_SPEED * deltaTime;
        }
        rightPaddleY = Math.max(0, Math.min(canvas.height - rightPaddleHeight, rightPaddleY));
    }

    if (isBallPaused) {
        if (!pendingLightningLaunch || !pauseStartTime) {
            isBallPaused = false;
            pendingLightningLaunch = null;
            pauseStartTime = 0;
            resetBall();
            return;
        }

        if (Date.now() - pauseStartTime >= LIGHTNING_PAUSE_DURATION) {
            ballSpeedX = pendingLightningLaunch.speedX;
            ballSpeedY = pendingLightningLaunch.speedY;
            isBallPaused = false;
            pendingLightningLaunch = null;
            pauseStartTime = 0;
            lastTrailPosition = { x: ballX, y: ballY };
            return;
        }

        if (pendingLightningLaunch.player === 'left') {
            ballY = leftPaddleY + leftPaddleHeight / 2;
        } else {
            ballY = rightPaddleY + rightPaddleHeight / 2;
        }
        return;
    }

    // Atualizar rastro
    const distanceMoved = Math.sqrt((ballX - lastTrailPosition.x) ** 2 + (ballY - lastTrailPosition.y) ** 2);
    if (distanceMoved >= TRAIL_SPACING) {
        trail.push({ x: ballX, y: ballY });
        lastTrailPosition = { x: ballX, y: ballY };
        if (trail.length > TRAIL_LENGTH) {
            trail.shift();
        }
    }

    // Movimento da bola
    ballX += ballSpeedX * deltaTime;
    ballY += ballSpeedY * deltaTime;

    // Colisão com bordas
    if (ballY <= currentBallSize / 2) {
        ballY = currentBallSize / 2;
        ballSpeedY = Math.abs(ballSpeedY);
    } else if (ballY >= canvas.height - currentBallSize / 2) {
        ballY = canvas.height - currentBallSize / 2;
        ballSpeedY = -Math.abs(ballSpeedY);
    }

    // Colisão com raquetes
    const leftPaddle = { x: 0, y: leftPaddleY, width: PADDLE_WIDTH, height: leftPaddleHeight };
    const rightPaddle = { x: canvas.width - PADDLE_WIDTH, y: rightPaddleY, width: PADDLE_WIDTH, height: rightPaddleHeight };
    const ball = { x: ballX, y: ballY, radius: currentBallSize / 2 };

    if (ballSpeedX < 0 && !lastLeftPaddleCollision && collides(ball, leftPaddle)) {
        const hitPoint = (ballY - (leftPaddle.y + leftPaddleHeight / 2)) / (leftPaddleHeight / 2);
        ballSpeedX = Math.min(Math.abs(ballSpeedX) + BALL_SPEED_INCREMENT, currentMaxBallSpeed);
        ballSpeedY = hitPoint * (currentMaxBallSpeed / 2);
        ballX = leftPaddle.x + leftPaddle.width + currentBallSize / 2;
        lastPlayerTouched = 'left';
        lastLeftPaddleCollision = true;
        if (singlePlayer) score += 1;
        updateScoreDisplay();
    } else if (ballSpeedX >= 0) {
        lastLeftPaddleCollision = false;
    }

    if (ballSpeedX > 0 && collides(ball, rightPaddle)) {
        const hitPoint = (ballY - (rightPaddle.y + rightPaddleHeight / 2)) / (rightPaddleHeight / 2);
        ballSpeedX = -Math.min(Math.abs(ballSpeedX) + BALL_SPEED_INCREMENT, currentMaxBallSpeed);
        ballSpeedY = hitPoint * (currentMaxBallSpeed / 2);
        ballX = rightPaddle.x - currentBallSize / 2;
        lastPlayerTouched = 'right';
        updateScoreDisplay();
    }

    // Colisão com caixa misteriosa
    if (mysteryBox) {
        const box = {
            x: mysteryBox.x,
            y: mysteryBox.y,
            width: MYSTERY_BOX_SIZE,
            height: MYSTERY_BOX_SIZE,
        };
        if (collides(ball, box)) {
            const power = getRandomPower();
            const powerEmojis = {
                shield: '🛡️',
                lightning: '⚡️',
                reverse: '🔄',
                grow: '📈',
                growBall: '📏'
            };
            if (lastPlayerTouched) {
                if (lastPlayerTouched === 'left') {
                    leftPower = power;
                    if (leftPowerDisplay) {
                        leftPowerDisplay.textContent = `Poder: ${power === 'shield' ? 'Escudo' : power === 'lightning' ? 'Raio' : power === 'reverse' ? 'Inversão' : power === 'grow' ? 'Crescer' : 'Aumentar Bola'} ${powerEmojis[power]}`;
                        leftPowerDisplay.className = `power-display power-${power}`;
                    }
                    console.log(`Poder ${power} coletado pelo Jogador 1`);
                } else {
                    rightPower = power;
                    if (rightPowerDisplay) {
                        rightPowerDisplay.textContent = `Poder: ${power === 'shield' ? 'Escudo' : power === 'lightning' ? 'Raio' : power === 'reverse' ? 'Inversão' : power === 'grow' ? 'Crescer' : 'Aumentar Bola'} ${powerEmojis[power]}`;
                        rightPowerDisplay.className = `power-display power-${power}`;
                    }
                    console.log(`Poder ${power} coletado pelo Jogador 2`);
                }
            }
            mysteryBox = null;
            mysteryBoxEndTime = 0;
        } else if (Date.now() > mysteryBoxEndTime) {
            mysteryBox = null;
            console.log('Caixa misteriosa expirou');
        }
    }

    // Gerar caixa misteriosa
    if (!mysteryBox && Date.now() - lastBoxSpawnTime > MYSTERY_BOX_SPAWN_INTERVAL) {
        if (Math.random() < 0.5) {
            spawnMysteryBox();
            lastBoxSpawnTime = Date.now();
        }
    }

    // Expirar poderes
    if (leftShieldActive && Date.now() > leftShieldEndTime) {
        leftShieldActive = false;
        if (leftPowerDisplay) leftPowerDisplay.textContent = 'Poder: Nenhum';
        if (leftPowerDisplay) leftPowerDisplay.className = 'power-display';
    }
    if (rightShieldActive && Date.now() > rightShieldEndTime) {
        rightShieldActive = false;
        if (rightPowerDisplay) rightPowerDisplay.textContent = 'Poder: Nenhum';
        if (rightPowerDisplay) rightPowerDisplay.className = 'power-display';
    }
    if (leftGrowActive && Date.now() > leftGrowEndTime) {
        leftGrowActive = false;
        leftPaddleHeight = PADDLE_HEIGHT;
        leftPaddleY = Math.max(0, Math.min(canvas.height - leftPaddleHeight, leftPaddleY));
    }
    if (rightGrowActive && Date.now() > rightGrowEndTime) {
        rightGrowActive = false;
        rightPaddleHeight = PADDLE_HEIGHT;
        rightPaddleY = Math.max(0, Math.min(canvas.height - rightPaddleHeight, rightPaddleY));
    }
    if (growBallActive && Date.now() > growBallEndTime) {
        growBallActive = false;
        currentBallSize = BALL_SIZE;
        currentMaxBallSpeed = MAX_BALL_SPEED;
        console.log('Poder growBall expirou: bola voltou ao tamanho normal (22 pixels), velocidade máxima 840');
    }

    // Verificar gol
    if (ballX <= currentBallSize / 2) {
        if (!leftShieldActive) {
            leftLives--;
        }
        updateLivesDisplay();
        updateScoreDisplay();
        resetBall();
    } else if (ballX >= canvas.width - currentBallSize / 2) {
        if (!rightShieldActive) {
            rightLives--;
            if (singlePlayer) {
                score += 10;
                goals++;
            }
        }
        updateLivesDisplay();
        updateScoreDisplay();
        resetBall();
    }

    // Verificar fim de jogo
    if (leftLives <= 0 || (!singlePlayer && rightLives <= 0)) {
        gameOver = true;
        gameStarted = false;
        hideAllScreens();
        if (gameOverScreen && gameOverMessage && finalScoreDisplay && rankingSection && finalRanking) {
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
        } else {
            console.error('Erro: Elementos da tela de game over não encontrados');
        }
    }
}

function collides(ball, obj) {
    const closestX = Math.max(obj.x, Math.min(ball.x, obj.x + obj.width));
    const closestY = Math.max(obj.y, Math.min(ball.y, obj.y + obj.height));
    const distance = Math.sqrt((ball.x - closestX) ** 2 + (ball.y - closestY) ** 2);
    return distance < ball.radius;
}

function updateLivesDisplay() {
    if (document.getElementById('leftLife1')) document.getElementById('leftLife1').style.display = leftLives >= 1 ? 'inline-block' : 'none';
    if (document.getElementById('leftLife2')) document.getElementById('leftLife2').style.display = leftLives >= 2 ? 'inline-block' : 'none';
    if (document.getElementById('leftLife3')) document.getElementById('leftLife3').style.display = leftLives >= 3 ? 'inline-block' : 'none';
    if (document.getElementById('rightLife1')) document.getElementById('rightLife1').style.display = rightLives >= 1 ? 'inline-block' : 'none';
    if (document.getElementById('rightLife2')) document.getElementById('rightLife2').style.display = rightLives >= 2 ? 'inline-block' : 'none';
    if (document.getElementById('rightLife3')) document.getElementById('rightLife3').style.display = rightLives >= 3 ? 'inline-block' : 'none';
}

function updateScoreDisplay() {
    if (currentScoreDisplay) currentScoreDisplay.textContent = score;
    if (currentGoalsDisplay) currentGoalsDisplay.textContent = goals;
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
    lastLeftPaddleCollision = false;
    lastTrailPosition = { x: ballX, y: ballY };
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
    mysteryBoxEndTime = 0;
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
    growBallActive = false;
    growBallEndTime = 0;
    currentBallSize = BALL_SIZE; // 22 pixels
    currentMaxBallSpeed = MAX_BALL_SPEED; // 840 pixels/segundo
    lastBoxSpawnTime = 0;
    isBallPaused = false;
    pendingLightningLaunch = null;
    pauseStartTime = 0;
    powerCounts = { shield: 0, lightning: 0, reverse: 0, grow: 0, growBall: 0 };
    lastLeftPaddleCollision = false;
    lastTrailPosition = { x: ballX, y: ballY };
    keys = {};
    if (leftPowerDisplay) leftPowerDisplay.textContent = 'Poder: Nenhum';
    if (leftPowerDisplay) leftPowerDisplay.className = 'power-display';
    if (rightPowerDisplay) rightPowerDisplay.textContent = 'Poder: Nenhum';
    if (rightPowerDisplay) rightPowerDisplay.className = 'power-display';
    updateLivesDisplay();
    updateScoreDisplay();
}

function gameLoop() {
    console.log(`Verificando gameLoop: gameStarted=${gameStarted}, gameOver=${gameOver}, paused=${paused}, ctx=${!!ctx}`);
    if (!gameStarted || gameOver || paused || !ctx) {
        console.log(`Game Loop interrompido: gameStarted=${gameStarted}, gameOver=${gameOver}, paused=${paused}, ctx=${!!ctx}`);
        return;
    }
    console.log('Executando gameLoop');
    update();
    draw();
    animationFrameId = requestAnimationFrame(gameLoop);
}

// Inicializar o jogo ao carregar
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM carregado, inicializando o jogo');
    showStartScreen();
    initGame();
});
