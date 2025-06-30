// Elementos do DOM
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const finalScoreElement = document.getElementById('final-score');
const rankingList = document.getElementById('ranking-list');
const startScreen = document.getElementById('start-screen');
const gameScreen = document.getElementById('game-screen');
const gameoverScreen = document.getElementById('gameover-screen');
const startButton = document.getElementById('start-button');
const restartButton = document.getElementById('restart-button');
const resetRankingButton = document.getElementById('reset-ranking');
const backButtons = document.querySelectorAll('#back-button, #back-button-gameover');

// Objetos do jogo
const player = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    size: 20,
    speed: 5
};

let coins = [];
let score = 0;
let gameState = 'start';
let gameStartTime = null;
const gameDuration = 30; // 30 segundos

// Controles
const keys = {
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
    KeyW: false,
    KeyS: false,
    KeyA: false,
    KeyD: false
};

// Listeners para teclas
document.addEventListener('keydown', (e) => {
    if (e.code in keys) {
        keys[e.code] = true;
        console.log(`Tecla pressionada: ${e.code}`);
    }
});

document.addEventListener('keyup', (e) => {
    if (e.code in keys) {
        keys[e.code] = false;
    }
});

// Cria uma nova moeda
function createCoin() {
    const coin = {
        x: Math.random() * (canvas.width - 10),
        y: Math.random() * (canvas.height - 10),
        size: 10
    };
    coins.push(coin);
}

// Verifica colisão
function checkCollision(player, coin) {
    const dx = player.x - coin.x;
    const dy = player.y - coin.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < player.size / 2 + coin.size / 2;
}

// Salva pontuação no ranking
function saveScore(score) {
    let ranking = JSON.parse(localStorage.getItem('ranking') || '[]');
    ranking.push(score);
    ranking.sort((a, b) => b - a);
    ranking = ranking.slice(0, 5);
    localStorage.setItem('ranking', JSON.stringify(ranking));
}

// Exibe o ranking
function displayRanking() {
    const ranking = JSON.parse(localStorage.getItem('ranking') || '[]');
    rankingList.innerHTML = '';
    ranking.forEach((score, index) => {
        const li = document.createElement('li');
        li.textContent = `${index + 1}. ${score} pontos`;
        rankingList.appendChild(li);
    });
}

// Reseta o ranking
function resetRanking() {
    localStorage.setItem('ranking', '[]');
    displayRanking();
}

// Muda o estado do jogo
function setGameState(state) {
    gameState = state;
    startScreen.classList.toggle('active', state === 'start');
    gameScreen.classList.toggle('active', state === 'playing');
    gameoverScreen.classList.toggle('active', state === 'gameover');

    if (state === 'start') {
        console.log('Tela inicial exibida');
    } else if (state === 'playing') {
        gameStartTime = Date.now();
        console.log('Jogo iniciado');
    } else if (state === 'gameover') {
        finalScoreElement.textContent = score;
        saveScore(score);
        displayRanking();
        console.log('Tela de game over exibida');
    }
}

// Reinicia o jogo
function resetGame() {
    player.x = canvas.width / 2;
    player.y = canvas.height / 2;
    coins = [];
    score = 0;
    scoreElement.textContent = score;
    setGameState('playing');
}

// Loop principal do jogo
function gameLoop() {
    if (gameState !== 'playing') {
        console.log('GameLoop parado: estado atual =', gameState);
        return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Move o jogador
    if ((keys.ArrowUp || keys.KeyW) && player.y - player.size / 2 > 0) player.y -= player.speed;
    if ((keys.ArrowDown || keys.KeyS) && player.y + player.size / 2 < canvas.height) player.y += player.speed;
    if ((keys.ArrowLeft || keys.KeyA) && player.x - player.size / 2 > 0) player.x -= player.speed;
    if ((keys.ArrowRight || keys.KeyD) && player.x + player.size / 2 < canvas.width) player.x += player.speed;

    // Desenha o jogador
    ctx.fillStyle = 'blue';
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.size / 2, 0, Math.PI * 2);
    ctx.fill();

    // Cria moedas
    if (Math.random() < 0.02) {
        createCoin();
    }

    // Desenha e verifica colisões
    coins = coins.filter(coin => {
        ctx.fillStyle = 'gold';
        ctx.beginPath();
        ctx.arc(coin.x, coin.y, coin.size / 2, 0, Math.PI * 2);
        ctx.fill();

        if (checkCollision(player, coin)) {
            score += 10;
            scoreElement.textContent = score;
            return false;
        }
        return true;
    });

    // Verifica o tempo
    const elapsedTime = (Date.now() - gameStartTime) / 1000;
    if (elapsedTime >= gameDuration) {
        setGameState('gameover');
        return;
    }

    // Desenha o tempo restante
    ctx.fillStyle = 'white';
    ctx.font = '16px Arial';
    ctx.fillText(`Tempo: ${Math.ceil(gameDuration - elapsedTime)}s`, 10, 20);

    requestAnimationFrame(gameLoop);
}

// Listeners para botões
startButton.addEventListener('click', () => {
    console.log('Botão Começar clicado');
    resetGame();
    requestAnimationFrame(gameLoop);
});

restartButton.addEventListener('click', () => {
    console.log('Botão Jogar Novamente clicado');
    resetGame();
    requestAnimationFrame(gameLoop);
});

resetRankingButton.addEventListener('click', () => {
    console.log('Botão Zerar Ranking clicado');
    resetRanking();
});

backButtons.forEach(button => {
    button.addEventListener('click', () => {
        console.log('Botão Voltar clicado');
        window.location.href = '../Jogos/CentralJogos.html';
    });
});

// Inicializa
console.log('Jogo inicializado');
displayRanking();
setGameState('start');
