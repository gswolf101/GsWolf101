const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const finalScoreElement = document.getElementById('final-score');
const playerNameInput = document.getElementById('player-name');
const rankingList = document.getElementById('ranking-list');

let score = 0;
let gameLoop;
let player, enemies, bullets;
let keys = {};
let lastShot = 0;
let ranking = JSON.parse(localStorage.getItem('ranking')) || [];

// Configurações do jogador
player = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    width: 20,
    height: 20,
    speed: 5,
    health: 100
};

// Arrays para inimigos e balas
enemies = [];
bullets = [];

// Controles do teclado
document.addEventListener('keydown', (e) => keys[e.key.toLowerCase()] = true);
document.addEventListener('keyup', (e) => keys[e.key.toLowerCase()] = false);

// Disparo com o mouse
canvas.addEventListener('click', shoot);

// Função para iniciar o jogo
function startGame() {
    document.getElementById('start-screen').classList.remove('active');
    document.getElementById('game-screen').classList.add('active');
    score = 0;
    player.health = 100;
    enemies = [];
    bullets = [];
    scoreElement.textContent = score;
    gameLoop = setInterval(update, 1000 / 60);
    spawnEnemy();
}

// Função principal de atualização
function update() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Movimento do jogador
    if (keys['w'] && player.y > 0) player.y -= player.speed;
    if (keys['s'] && player.y < canvas.height - player.height) player.y += player.speed;
    if (keys['a'] && player.x > 0) player.x -= player.speed;
    if (keys['d'] && player.x < canvas.width - player.width) player.x += player.speed;

    // Desenhar jogador
    ctx.fillStyle = '#0f0';
    ctx.fillRect(player.x, player.y, player.width, player.height);

    // Atualizar e desenhar balas
    bullets.forEach((bullet, index) => {
        bullet.x += bullet.vx;
        bullet.y += bullet.vy;
        ctx.fillStyle = '#ff0';
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);

        // Remover balas fora da tela
        if (bullet.x < 0 || bullet.x > canvas.width || bullet.y < 0 || bullet.y > canvas.height) {
            bullets.splice(index, 1);
        }
    });

    // Atualizar e desenhar inimigos
    enemies.forEach((enemy, eIndex) => {
        // Movimento do inimigo em direção ao jogador
        let dx = player.x - enemy.x;
        let dy = player.y - enemy.y;
        let distance = Math.sqrt(dx * dx + dy * dy);
        enemy.x += (dx / distance) * enemy.speed;
        enemy.y += (dy / distance) * enemy.speed;

        ctx.fillStyle = '#f00';
        ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);

        // Colisão com o jogador
        if (collides(player, enemy)) {
            player.health -= 10;
            enemies.splice eIndex, 1);
            if (player.health <= 0) {
                gameOver();
            }
        }

        // Colisão com balas
        bullets.forEach((bullet, bIndex) => {
            if (collides(bullet, enemy)) {
                enemies.splice(eIndex, 1);
                bullets.splice(bIndex, 1);
                score += 10;
                scoreElement.textContent = score;
            }
        });
    });

    // Gerar inimigos
    if (Math.random() < 0.02) {
        spawnEnemy();
    }
}

// Função para atirar
function shoot(e) {
    const now = Date.now();
    if (now - lastShot < 300) return; // Limite de disparos
    lastShot = now;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const dx = mouseX - (player.x + player.width / 2);
    const dy = mouseY - (player.y + player.height / 2);
    const distance = Math.sqrt(dx * dx + dy * dy);
    const speed = 10;

    bullets.push({
        x: player.x + player.width /  jus2,
        y: player.y + player.height / 2,
        vx: (dx / distance) * speed,
        vy: (dy / distance) * speed,
        width: 5,
        height: 5
    });
}

// Função para gerar inimigos
function spawnEnemy() {
    const side = Math.floor(Math.random() * 4);
    let x, y;
    switch (side) {
        case 0: // Topo
            x = Math.random() * canvas.width;
            y = -20;
            break;
        case 1: // Direita
            x = canvas.width;
            y = Math.random() * canvas.height;
            break;
        case 2: // Baixo
            x = Math.random() * canvas.width;
            y = canvas.height;
            break;
        case 3: // Esquerda
            x = -20;
            y = Math.random() * canvas.height;
            break;
    }
    enemies.push({
        x: x,
        y: y,
        width: 20,
        height: 20,
        speed: 2 + Math.random() * 2
    });
}

// Função de colisão
function collides(a, b) {
    return a.x < b.x + b.width &&
           a.x + a.width > b.x &&
           a.y < b.y + b.height &&
           a.y + a.height > b.y;
}

// Função de game over
function gameOver() {
    clearInterval(gameLoop);
    document.getElementById('game-screen').classList.remove('active');
    document.getElementById('game-over-screen').classList.add('active');
    finalScoreElement.textContent = score;
}

// Função para salvar score
function saveScore() {
    const name = playerNameInput.value.trim() || 'Anônimo';
    ranking.push({ name, score });
    ranking.sort((a, b) => b.score - a.score);
    ranking = ranking.slice(0, 5); // Mantém apenas os 5 melhores
    localStorage.setItem('ranking', JSON.stringify(ranking));
    playerNameInput.value = '';
    showRanking();
}

// Função para mostrar ranking
function showRanking() {
    document.getElementById('game-over-screen').classList.remove('active');
    document.getElementById('ranking-screen').classList.add('active');
    rankingList.innerHTML = '';
    ranking.forEach((entry, index) => {
        const li = document.createElement('li');
        li.textContent = `${index + 1}. ${entry.name}: ${entry.score}`;
        rankingList.appendChild(li);
    });
}

// Função para reiniciar o jogo
function restartGame() {
    document.getElementById('game-over-screen').classList.remove('active');
    startGame();
}

// Função para voltar ao início
function backToStart() {
    document.getElementById('ranking-screen').classList.remove('active');
    document.getElementById('start-screen').classList.add('active');
}
