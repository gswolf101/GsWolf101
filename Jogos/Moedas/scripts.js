// Obtém elementos do DOM
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

// Event listeners para teclas
document.addEventListener('keydown', (e) => {
    if (e.code in keys) {
        keys[e.code] = true;
    }
});

document.addEventListener('keyup', (e) => {
    if (e.code in keys) {
        keys[e.code] = false;
    }
});

// Função para criar uma nova moeda
function createCoin() {
    const coin = {
        x: Math.random() * (canvas.width - 10),
        y: Math.random() * (canvas.height - 10),
        size: 10
    };
    coins.push(coin);
}

// Função para verificar colisão
function checkCollision(player, coin) {
    const dx = player.x - coin.x;
    const dy = player.y - coin.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < player.size / 2 + coin.size / 2;
}

// Função para salvar pontuação no ranking
function saveScore(score) {
    let ranking = JSON.parse(localStorage.getItem('ranking') || '[]');
    ranking.push(score);
    ranking.sort((a, b) => b - a); // Ordena em ordem decrescente
    ranking = ranking.slice(0, 5); // Mantém apenas as 5 melhores
    localStorage.setItem('ranking', JSON.stringify(ranking));
}

// Função para exibir o ranking
function displayRanking() {
    const ranking = JSON.parse(localStorage.getItem('ranking') || '[]');
    rankingList.innerHTML = '';
    ranking.forEach((score, index) => {
        const li = document.createElement('li');
        li.textContent = `${index + 1}. ${score} pontos`;
        rankingList.append(li);
    });
}

// Função para resetar o ranking
function resetRanking() {
    localStorage.setItem('ranking', '[]');
    displayRanking();
}

// Função para mudar o estado do jogo
function setGameState(state) {
    gameState = state;
    startScreen.classList.remove('active');
    gameScreen.classList.remove('active');
    gameoverScreen.classList.remove('active');

    if (state === 'start') {
        startScreen.classList.add('active');
    } else if (state === 'playing') {
        gameScreen.classList.add('active');
    } else if (state === 'gameover') {
        gameoverScreen.classList.add('active');
        finalScoreElement.textContent = score;
        saveScore(score);
        displayRanking();
    }
}

// Função para reiniciar o jogo
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
        requestAnimationFrame(gameLoop);
        return;
    }

    // Limpa o canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Atualiza a posição do jogador
    if ((keys.ArrowUp || keys.KeyW) && player.y - player.size / 2 > 0) player.y -= player.speed;
    if ((keys.ArrowDown || keys.KeyS) && player.y + player.size / 2 < canvas.height) player.y += player.speed;
    if ((keys.ArrowLeft || keys.KeyA) && player.x - player.size / 2 > 0) player.x -= player.speed;
    if ((keys.ArrowRight || keys.KeyD) && player.x + player.size / 2 < canvas.width) player.x += player.speed;

    // Desenha o jogador
    ctx.fillStyle = 'blue';
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.size / 2, 0, Math.PI * 2);
    ctx.fill();

    // Cria uma nova moeda a cada 2 segundos
    if (Math.random() < 0.02) {
        createCoin();
    }

    // Desenha e verifica colisões com moedas
    coins = coins.filter(coin => {
        ctx.fillStyle = 'gold';
        ctx.beginPath();
        ctx.arc(coin.x, coin.y, coin.size / 2, 0, Math.PI * 2);
        ctx.fill();

        if (checkCollision(player, coin)) {
            score += 10;
            scoreElement.textContent = score;
            return false; // Remove a moeda
        }
        return true;
    });

    // Finaliza o jogo após 30 segundos (exemplo)
    if (score >= 50) { // Condição de fim de jogo (exemplo: 50 pontos)
        setGameState('gameover');
    }

    // Chama o próximo frame
    requestAnimationFrame(gameLoop);
}

// Event listeners para botões
startButton.addEventListener('click', () => {
    resetGame();
});

restartButton.addEventListener('click', () => {
    resetGame();
});

resetRankingButton.addEventListener('click', () => {
    resetRanking();
});

backButtons.forEach(button => {
    button.addEventListener('click', () => {
        window.location.href = '../Jogos/CentralJogos.html';
    });
});

// Inicializa o ranking e o loop do jogo
displayRanking();
setGameState('start');
gameLoop();
