const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 800;
canvas.height = 600;

let gameState = 'start';
let player = {
    x: 50,
    y: canvas.height / 2,
    health: 100,
    maxHealth: 100,
    xp: 0,
    xpNeeded: 10,
    level: 1,
    coins: 0,
    score: 0,
    weapon: 'bow',
    healthUpgrade: 0,
    coinMultiplier: 1
};

let enemies = [];
let projectiles = [];
let bosses = [];
let keys = {};
let mouse = { x: canvas.width / 2, y: canvas.height / 2, down: false, charge: 0, lastShot: 0 };
let gameLoop;
let lastTime = 0;
let bossActive = false;
let ranking = JSON.parse(localStorage.getItem('ranking')) || [];

const weapons = {
    bow: { damage: 1, cooldown: 0, chargeable: true },
    crossbow: { damage: 2, cooldown: 1500, chargeable: false },
    oldPistol: { damage: 4, cooldown: 3500, chargeable: false },
    pistol: { damage: 3, cooldown: 1500, chargeable: false },
    oldRifle: { damage: 3, cooldown: 4000, chargeable: false, pierce: true },
    rifle: { damage: 3, cooldown: 2000, chargeable: false, pierce: true }
};

const upgrades = [
    { name: 'Dano Extra', rarity: 'common', effect: () => { if (player.weapon === 'bow') weapons.bow.damage += 0.5; } },
    { name: 'Vida Extra', rarity: 'rare', effect: () => { player.maxHealth *= 1.1; player.health = player.maxHealth; } },
    { name: 'Tiro Rápido', rarity: 'epic', effect: () => { Object.values(weapons).forEach(w => { if (w.cooldown) w.cooldown *= 0.9; }); } },
    { name: 'Regeneração', rarity: 'legendary', effect: () => { setInterval(() => player.health = Math.min(player.health + 1, player.maxHealth), 5000); } },
    { name: 'Dano Crítico', rarity: 'mythic', effect: () => { projectiles.forEach(p => p.damage *= Math.random() < 0.2 ? 2 : 1); } }
];

function startGame() {
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('game-screen').style.display = 'block';
    gameState = 'playing';
    lastTime = performance.now();
    gameLoop = requestAnimationFrame(update);
    spawnEnemy();
}

function showShop() {
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('shop-screen').style.display = 'block';
    updateShop();
}

function showRanking() {
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('ranking-screen').style.display = 'block';
    updateRanking();
}

function backToStart() {
    document.getElementById('shop-screen').style.display = 'none';
    document.getElementById('ranking-screen').style.display = 'none';
    document.getElementById('start-screen').style.display = 'block';
}

function resetGame() {
    localStorage.removeItem('ranking');
    localStorage.removeItem('player');
    player = {
        x: 50,
        y: canvas.height / 2,
        health: 100,
        maxHealth: 100,
        xp: 0,
        xpNeeded: 10,
        level: 1,
        coins: 0,
        score: 0,
        weapon: 'bow',
        healthUpgrade: 0,
        coinMultiplier: 1
    };
    ranking = [];
    updateRanking();
}

function buyUpgrade(type) {
    let cost = type === 'health' ? 10 * Math.pow(1.1, player.healthUpgrade) : 10 * Math.pow(1.25, player.coinMultiplier - 1);
    if (player.coins >= cost) {
        player.coins -= cost;
        if (type === 'health') {
            player.healthUpgrade++;
            player.maxHealth *= 1.05;
            player.health = player.maxHealth;
        } else {
            player.coinMultiplier += 0.05;
        }
        updateShop();
        saveGame();
    }
}

function buyWeapon(weapon) {
    const costs = { crossbow: 50, oldPistol: 100, pistol: 150, oldRifle: 200, rifle: 250 };
    if (player.coins >= costs[weapon]) {
        player.coins -= costs[weapon];
        player.weapon = weapon;
        updateShop();
        saveGame();
    }
}

function updateShop() {
    document.getElementById('health-cost').textContent = Math.round(10 * Math.pow(1.1, player.healthUpgrade));
    document.getElementById('coin-cost').textContent = Math.round(10 * Math.pow(1.25, player.coinMultiplier - 1));
}

function updateRanking() {
    const rankingList = document.getElementById('ranking-list');
    rankingList.innerHTML = '';
    ranking.sort((a, b) => b.score - a.score).slice(0, 10).forEach(entry => {
        const li = document.createElement('li');
        li.textContent = `Pontos: ${entry.score}`;
        rankingList.appendChild(li);
    });
}

function update(time) {
    if (gameState !== 'playing') return;
    const delta = time - lastTime;
    lastTime = time;

    // Movimento do jogador
    if (keys['w'] && player.y > 10) player.y -= 5;
    if (keys['s'] && player.y < canvas.height - 10) player.y += 5;
    if (keys['a'] && player.x > 10) player.x -= 5;
    if (keys['d'] && player.x < canvas.width / 2 - 10) player.x += 5;

    // Carregamento do tiro
    if (mouse.down && player.weapon === 'bow') {
        mouse.charge = Math.min(mouse.charge + delta / 2000, 1);
    }

    // Atualizar barras de status
    document.getElementById('health').textContent = Math.round(player.health);
    document.getElementById('xp).textContent = player.xp;
    document.getElementById('xp-needed').textContent = player.xpNeeded;
    document.getElementById('coins').textContent = player.coins;
    document.getElementById('score').textContent = player.score;

    const cooldownBar = document.getElementById('cooldown-bar');
    const cooldownProgress = (time - mouse.lastShot) / (weapons[player.weapon].cooldown || 1000);
    cooldownBar.style.backgroundColor = cooldownProgress > 0.75 ? 'red' : cooldownProgress > 0.5 ? 'yellow' : 'green';
    cooldownBar.style.width = `${100 * (1 - cooldownProgress)}px`;

    // Desenhar
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Jogador redondo
    ctx.fillStyle = 'blue';
    ctx.beginPath();
    ctx.arc(player.x, player.y, 10, 0, Math.PI * 2);
    ctx.fill();

    // Atualizar e desenhar inimigos
    enemies.forEach(enemy => {
        // Movimento na direção do jogador
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance > 0) {
            enemy.x += (dx / distance) * enemy.speed;
            enemy.y += (dy / distance) * enemy.speed;
        }
        ctx.fillStyle = 'red';
        ctx.fillRect(enemy.x - 10, enemy.y - 10, 20, 20);
    });

    // Atualizar e desenhar projéteis
    projectiles.forEach(projectile => {
        projectile.x += projectile.dx;
        projectile.y += projectile.dy;
        ctx.fillStyle = 'yellow';
        ctx.fillRect(projectile.x, projectile.y, 10, 5);
    });

    // Colisões
    projectiles.forEach((projectile, pIndex) => {
        enemies.forEach((enemy, eIndex) => {
            if (Math.abs(projectile.x - enemy.x) < 20 && Math.abs(projectile.y - enemy.y) < 20) {
                enemy.health -= projectile.damage;
                if (!weapons[player.weapon].pierce) projectiles.splice(pIndex, 1);
                if (enemy.health <= 0) {
                    enemies.splice(eIndex, 1);
                    player.coins += player.coinMultiplier;
                    player.score++;
                    player.xp++;
                    if (player.xp >= player.xpNeeded) levelUp();
                    if (player.score % 50 === 0 && !bossActive) spawnBoss();
                }
            }
        });
    });

    // Atualizar bosses
    bosses.forEach(boss => {
        // Comportamento do boss (a ser implementado)
    });

    // Spawn de inimigos
    if (!bossActive && Math.random() < 0.02) spawnEnemy();

    if (player.health <= 0) gameOver();

    gameLoop = requestAnimationFrame(update);
}

function spawnEnemy() {
    const healthMultiplier = 1 + Math.floor(player.score / 50) * 0.0025;
    enemies.push({
        x: canvas.width,
        y: Math.random() * canvas.height,
        health: 1 * healthMultiplier,
        speed: 2
    });
}

function spawnBoss() {
    bossActive = true;
    const bossTypes = [
        { type: 'melee', health: 50, ability: () => {/* Ataque corpo a corpo */} },
        { type: 'ranged', health: 50, ability: () => {/* Ataque à distância */} },
        { type: 'summoner', health: 50, ability: () => {/* Invoca lacaios */} }
    ];
    bosses.push(bossTypes[Math.floor(Math.random() * bossTypes.length)]);
}

function levelUp() {
    player.level++;
    player.xp = 0;
    player.xpNeeded *= 1.2;
    showUpgrades();
}

function showUpgrades() {
    gameState = 'upgrade';
    document.getElementById('game-screen').style.display = 'none';
    document.getElementById('upgrade-screen').style.display = 'block';
    const options = document.getElementById('upgrade-options');
    options.innerHTML = '';
    
    // Selecionar 3 upgrades aleatórios
    const availableUpgrades = [...upgrades];
    for (let i = 0; i < 3; i++) {
        if (availableUpgrades.length === 0) break;
        const randomIndex = Math.floor(Math.random() * availableUpgrades.length);
        const upgrade = availableUpgrades.splice(randomIndex, 1)[0];
        const button = document.createElement('button');
        button.textContent = `${upgrade.name} (${upgrade.rarity})`;
        button.onclick = () => {
            upgrade.effect();
            document.getElementById('upgrade-screen').style.display = 'none';
            document.getElementById('game-screen').style.display = 'block';
            gameState = 'playing';
            gameLoop = requestAnimationFrame(update);
        };
        options.appendChild(button);
    }
}

function gameOver() {
    cancelAnimationFrame(gameLoop);
    ranking.push({ score: player.score });
    localStorage.setItem('ranking', JSON.stringify(ranking));
    player.health = player.maxHealth;
    player.xp = 0;
    player.score = 0;
    enemies = [];
    projectiles = [];
    bosses = [];
    bossActive = false;
    document.getElementById('game-screen').style.display = 'none';
    document.getElementById('start-screen').style.display = 'block';
    gameState = 'start';
}

function saveGame() {
    localStorage.setItem('player', JSON.stringify(player));
}

document.addEventListener('keydown', e => keys[e.key.toLowerCase()] = true);
document.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);
canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
});
canvas.addEventListener('mousedown', e => {
    if (e.button === 0) {
        mouse.down = true;
        if (player.weapon !== 'bow' && Date.now() - mouse.lastShot >= (weapons[player.weapon].cooldown || 1000)) {
            shoot();
        }
    }
});
canvas.addEventListener('mouseup', e => {
    if (e.button === 0 && player.weapon === 'bow' && mouse.down) {
        shoot();
    }
    mouse.down = false;
    mouse.charge = 0;
});

// Suporte a toque para dispositivos móveis
canvas.addEventListener('touchstart', e => {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    mouse.x = touch.clientX - rect.left;
    mouse.y = touch.clientY - rect.top;
    mouse.down = true;
    if (player.weapon !== 'bow' && Date.now() - mouse.lastShot >= (weapons[player.weapon].cooldown || 1000)) {
        shoot();
    }
});
canvas.addEventListener('touchend', e => {
    e.preventDefault();
    if (player.weapon === 'bow' && mouse.down) {
        shoot();
    }
    mouse.down = false;
    mouse.charge = 0;
});

function shoot() {
    if (Date.now() - mouse.lastShot < (weapons[player.weapon].cooldown || 0)) return;
    const damage = player.weapon === 'bow' ? Math.ceil(mouse.charge * 2) + 1 : weapons[player.weapon].damage;
    const angle = Math.atan2(mouse.y - player.y, mouse.x - player.x);
    projectiles.push({
        x: player.x,
        y: player.y,
        dx: Math.cos(angle) * 10,
        dy: Math.sin(angle) * 10,
        damage: damage
    });
    mouse.lastShot = Date.now();
}
