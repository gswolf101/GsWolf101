const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score');
const startScreen = document.getElementById('startScreen');
const gameOverDisplay = document.getElementById('gameOver');
const rankingDisplay = document.getElementById('ranking');
const rankingList = document.getElementById('rankingList');
const shopDisplay = document.getElementById('shop');
const shopCoins = document.getElementById('shopCoins');
const healthBar = document.getElementById('health');
const healthText = document.getElementById('healthText');
const xpBar = document.getElementById('xp');
const xpText = document.getElementById('xpText');
const fireRateCostDisplay = document.getElementById('fireRateCost');
const healthCostDisplay = document.getElementById('healthCost');
const countdownDisplay = document.getElementById('countdown');
const buyInitialUpgradeBtn = document.getElementById('buyInitialUpgradeBtn');
const buyGlockBtn = document.getElementById('buyGlockBtn');
const buyRifleBtn = document.getElementById('buyRifleBtn');
const upgradeMenu = document.getElementById('upgradeMenu');
const upgradeOptions = document.getElementById('upgradeOptions');
const upgradesList = document.getElementById('upgradesList');

let player = { x: 375, y: 375, size: 20, speed: 2.2, baseSpeed: 2.2, health: 10, maxHealth: 10 };
let zombies = [];
let bullets = [];
let bossBullets = [];
let coins = [];
let boss = null;
let score = 0;
let coinCount = 0;
let xp = 0;
let level = 1;
let xpToNextLevel = 10;
let gameOver = false;
let isPaused = true;
let lastShot = 0;
let lastSpawn = 0;
let lastRegen = 0;
let countdown = 0;
let countdownStart = 0;
let bossSpawned = false;
let lastBossCharge = 0;
let lastBossSpawnZombies = 0;
let bossChargeWarning = 0;
let shootDelay = 2000;
let fireRateCost = 200;
let healthCost = 50;
let spawnInterval = 4000;
let diagonalShots = 0;
let frontShots = 0;
let homingShot = false;
let electricShot = false;
let pierceCount = 0;
let regen = false;
let vampirism = false;
let lightHands = false;
let goodHands = false;
let speedUpgrades = 0;
let healthUpgrades = 0;
let fireRateUpgrades = 0;
let hasGlock = false;
let hasRifle = false;
let equippedWeapon = 'none';
let hasInitialUpgrade = false;
let collectedUpgrades = [];
let bosses = 0;

const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
const touchState = {
    movement: { active: false, touchId: null, startX: 0, startY: 0, dx: 0, dy: 0, targetX: null, targetY: null },
    shoot: { active: false, touchId: null, dx: 0, dy: 0, lastShot: 0 }
};

const savedDataLocal = JSON.parse(localStorage.getItem('zombieGameData')) || {
    coins: 0,
    healthUpgrades: 0,
    fireRateUpgrades: 0,
    hasGlock: false,
    hasRifle: false,
    equippedWeapon: 'none',
    hasInitialUpgrade: false,
    speedUpgrades: 0,
    healthCost: 50,
    bosses: 0,
    ranking: []
};
coinCount = savedDataLocal.coins;
healthUpgrades = savedDataLocal.healthUpgrades || 0;
fireRateUpgrades = savedDataLocal.fireRateUpgrades || 0;
hasGlock = savedDataLocal.hasGlock || false;
hasRifle = savedDataLocal.hasRifle || false;
equippedWeapon = savedDataLocal.equippedWeapon || 'none';
hasInitialUpgrade = savedDataLocal.hasInitialUpgrade || false;
speedUpgrades = savedDataLocal.speedUpgrades || 0;
healthCost = savedDataLocal.healthCost || 50;
bosses = savedDataLocal.bosses || 0;
player.maxHealth = 10 * Math.pow(1.2, healthUpgrades);
player.health = player.maxHealth;
player.speed = player.baseSpeed * Math.pow(1.05, speedUpgrades);
fireRateCost = 200 * Math.pow(1.15, fireRateUpgrades);
shootDelay = equippedWeapon === 'glock' ? 1200 : equippedWeapon === 'rifle' ? 1000 : 2000 - fireRateUpgrades * 50;
shootDelay = Math.max(50, shootDelay);
fireRateCostDisplay.textContent = Math.round(fireRateCost);
healthCostDisplay.textContent = Math.round(healthCost);
healthText.textContent = `Vida: ${Math.round((player.health / player.maxHealth) * 100)}%`;
xpText.textContent = `Nível ${level}: ${xp}/${xpToNextLevel} XP`;
if (hasInitialUpgrade) {
    buyInitialUpgradeBtn.disabled = true;
    buyInitialUpgradeBtn.textContent = "Comprado";
}
updateWeaponButtons();

function resizeCanvas() {
    const container = document.getElementById('gameContainer');
    const scaleX = window.innerWidth / 750;
    const scaleY = window.innerHeight / 750;
    const scale = Math.min(scaleX, scaleY);
    container.style.transform = `scale(${scale})`;
    container.style.transformOrigin = 'center';
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

const keys = {
    w: false,
    a: false,
    s: false,
    d: false,
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
    '1': false,
    '2': false,
    '3': false
};

document.addEventListener('keydown', (e) => {
    const key = e.key;
    const normalizedKey = key === 'ArrowUp' || key === 'ArrowDown' || key === 'ArrowLeft' || key === 'ArrowRight' ? key : key.toLowerCase();
    if (normalizedKey in keys) {
        keys[normalizedKey] = true;
    }
    if (normalizedKey === 'r' && gameOver) resetGame();
    if (upgradeMenu.style.display === 'block' && ['1', '2', '3'].includes(normalizedKey)) {
        selectUpgrade(parseInt(normalizedKey) - 1);
    }
});

document.addEventListener('keyup', (e) => {
    const key = e.key;
    const normalizedKey = key === 'ArrowUp' || key === 'ArrowDown' || key === 'ArrowLeft' || key === 'ArrowRight' ? key : key.toLowerCase();
    if (normalizedKey in keys) {
        keys[normalizedKey] = false;
    }
});

canvas.addEventListener('click', () => {
    canvas.focus();
});

if (isMobile) {
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        for (let touch of e.changedTouches) {
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            const touchX = (touch.clientX - rect.left) * scaleX;
            const touchY = (touch.clientY - rect.top) * scaleY;

            if (touchX < canvas.width / 2 && !touchState.movement.active) {
                touchState.movement.active = true;
                touchState.movement.touchId = touch.identifier;
                touchState.movement.startX = touch.clientX;
                touchState.movement.startY = touch.clientY;
                touchState.movement.dx = 0;
                touchState.movement.dy = 0;
                touchState.movement.targetX = touchX;
                touchState.movement.targetY = touchY;
            } else if (touchX >= canvas.width / 2 && !touchState.shoot.active) {
                touchState.shoot.active = true;
                touchState.shoot.touchId = touch.identifier;
                touchState.shoot.dx = touchX - player.x;
                touchState.shoot.dy = touchY - player.y;
                shoot(touchX, touchY);
            }
        }
    });

    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        for (let touch of e.changedTouches) {
            if (touchState.movement.active && touch.identifier === touchState.movement.touchId) {
                const rect = canvas.getBoundingClientRect();
                const scaleX = canvas.width / rect.width;
                const scaleY = canvas.height / rect.height;
                const touchX = (touch.clientX - rect.left) * scaleX;
                const touchY = (touch.clientY - rect.top) * scaleY;

                touchState.movement.dx = touch.clientX - touchState.movement.startX;
                touchState.movement.dy = touch.clientY - touchState.movement.startY;
                const distance = Math.hypot(touchState.movement.dx, touchState.movement.dy);
                const maxDistance = 100;
                if (distance > maxDistance) {
                    const scale = maxDistance / distance;
                    touchState.movement.dx *= scale;
                    touchState.movement.dy *= scale;
                }
                const snapped = snapToEightDirections(touchState.movement.dx, touchState.movement.dy);
                touchState.movement.dx = snapped.dx;
                touchState.movement.dy = snapped.dy;
                touchState.movement.targetX = null;
                touchState.movement.targetY = null;
            }
            if (touchState.shoot.active && touch.identifier === touchState.shoot.touchId) {
                const rect = canvas.getBoundingClientRect();
                const scaleX = canvas.width / rect.width;
                const scaleY = canvas.height / rect.height;
                const touchX = (touch.clientX - rect.left) * scaleX;
                const touchY = (touch.clientY - rect.top) * scaleY;
                touchState.shoot.dx = touchX - player.x;
                touchState.shoot.dy = touchY - player.y;
            }
        }
    });

    canvas.addEventListener('touchend', (e) => {
        e.preventDefault();
        for (let touch of e.changedTouches) {
            if (touchState.movement.active && touch.identifier === touchState.movement.touchId) {
                touchState.movement.active = false;
                touchState.movement.touchId = null;
                touchState.movement.dx = 0;
                touchState.movement.dy = 0;
                if (!touchState.movement.targetX && !touchState.movement.targetY) {
                    touchState.movement.targetX = null;
                    touchState.movement.targetY = null;
                }
            }
            if (touchState.shoot.active && touch.identifier === touchState.shoot.touchId) {
                touchState.shoot.active = false;
                touchState.shoot.touchId = null;
                touchState.shoot.dx = 0;
                touchState.shoot.dy = 0;
                touchState.shoot.lastShot = 0;
            }
        }
    });

    function snapToEightDirections(dx, dy) {
        const angle = Math.atan2(dy, dx);
        const snappedAngle = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4);
        return {
            dx: Math.cos(snappedAngle),
            dy: Math.sin(snappedAngle)
        };
    }
}

function restoreCanvasFocus() {
    setTimeout(() => {
        canvas.focus();
    }, 100);
}

function showTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    document.querySelector(`.tab-button[onclick="showTab('${tabId}')"]`).classList.add('active');
}

function updateUpgradesList() {
    upgradesList.textContent = collectedUpgrades.length > 0 
        ? `Upgrades: ${collectedUpgrades.join(', ')}` 
        : 'Upgrades: Nenhum';
}

function saveData() {
    localStorage.setItem('zombieGameData', JSON.stringify({
        coins: coinCount,
        healthUpgrades: healthUpgrades,
        fireRateUpgrades: fireRateUpgrades,
        hasGlock: hasGlock,
        hasRifle: hasRifle,
        equippedWeapon: equippedWeapon,
        hasInitialUpgrade: hasInitialUpgrade,
        speedUpgrades: speedUpgrades,
        healthCost: healthCost,
        bosses: bosses,
        ranking: savedDataLocal.ranking
    }));
}

function updateWeaponButtons() {
    if (hasGlock) {
        buyGlockBtn.textContent = equippedWeapon === 'glock' ? 'Equipado' : 'Equipar';
        buyGlockBtn.disabled = equippedWeapon === 'glock';
    } else {
        buyGlockBtn.textContent = 'Comprar';
        buyGlockBtn.disabled = false;
    }
    if (hasRifle) {
        buyRifleBtn.textContent = equippedWeapon === 'rifle' ? 'Equipado' : 'Equipar';
        buyRifleBtn.disabled = equippedWeapon === 'rifle';
    } else {
        buyRifleBtn.textContent = 'Comprar';
        buyRifleBtn.disabled = false;
    }
}

function resetAll() {
    if (confirm('Tem certeza que deseja resetar todas as características, moedas e compras?')) {
        coinCount = 0;
        healthUpgrades = 0;
        fireRateUpgrades = 0;
        speedUpgrades = 0;
        hasGlock = false;
        hasRifle = false;
        equippedWeapon = 'none';
        hasInitialUpgrade = false;
        healthCost = 50;
        bosses = 0;
        player.maxHealth = 10;
        player.health = player.maxHealth;
        player.speed = player.baseSpeed;
        fireRateCost = 200;
        shootDelay = 2000;
        pierceCount = 0;
        collectedUpgrades = [];
        updateShootDelay();
        updateUpgradesList();
        shopCoins.textContent = coinCount;
        fireRateCostDisplay.textContent = Math.round(fireRateCost);
        healthCostDisplay.textContent = Math.round(healthCost);
        buyInitialUpgradeBtn.disabled = false;
        buyInitialUpgradeBtn.textContent = 'Comprar';
        updateWeaponButtons();
        healthBar.style.width = '100%';
        healthText.textContent = `Vida: ${Math.round((player.health / player.maxHealth) * 100)}%`;
        saveData();
        alert('Todas as características, moedas e compras foram resetadas!');
        restoreCanvasFocus();
    } else {
        restoreCanvasFocus();
    }
}

function startGame() {
    startScreen.style.display = 'none';
    isPaused = false;
    canvas.focus();
    resetGame();
}

function showRankingFromStart() {
    rankingList.innerHTML = '';
    savedDataLocal.ranking.sort((a, b) => b.score - a.score);
    savedDataLocal.ranking.slice(0, 5).forEach(entry => {
        const li = document.createElement('li');
        li.textContent = `Pontos: ${entry.score} - ${entry.date}`;
        rankingList.appendChild(li);
    });
    startScreen.style.display = 'none';
    rankingDisplay.style.display = 'block';
    canvas.focus();
}

function spawnZombies() {
    if (isPaused || countdown > 0 || boss) return;
    const now = Date.now();
    if (now - lastSpawn < spawnInterval) return;
    lastSpawn = now;

    let zombieCount;
    if (score <= 20) {
        zombieCount = 2;
        spawnInterval = 4000;
    } else if (score <= 40) {
        zombieCount = 3;
        spawnInterval = 4000;
    } else if ((score >= 52 && score < 100 && !bossSpawned) || (score > 100 && !bossSpawned)) {
        zombieCount = 4;
        spawnInterval = 4000;
    } else {
        zombieCount = 3;
        spawnInterval = 3000;
    }

    if (score === 50 || score === 100) {
        zombies = [];
        countdown = 3;
        countdownStart = Date.now();
        return;
    }

    for (let i = 0; i < zombieCount; i++) {
        const side = Math.floor(Math.random() * 4);
        let x, y;
        if (side === 0) { x = Math.random() * canvas.width; y = -20; }
        else if (side === 1) { x = Math.random() * canvas.width; y = canvas.height + 20; }
        else if (side === 2) { x = -20; y = Math.random() * canvas.height; }
        else { x = canvas.width + 20; y = Math.random() * canvas.height; }
        zombies.push({ x, y, size: 20, speed: 1.9 });
    }
}

function spawnBoss() {
    const side = Math.floor(Math.random() * 4);
    let x, y;
    if (side === 0) { x = Math.random() * canvas.width; y = -40; }
    else if (side === 1) { x = Math.random() * canvas.width; y = canvas.height + 40; }
    else if (side === 2) { x = -40; y = Math.random() * canvas.height; }
    else { x = canvas.width + 40; y = Math.random() * canvas.height; }
    const bossTypes = ['charger', 'shooter'];
    const bossType = bossTypes[Math.floor(Math.random() * bossTypes.length)];
    const bossHealth = 50 * (bosses + 1);
    boss = {
        x,
        y,
        size: 40,
        speed: 1.5,
        health: bossHealth,
        baseSpeed: 1.5,
        type: bossType,
        chargeTimer: 0,
        spawnZombieTimer: 0,
        chargeWarning: false,
        shootTimer: 0,
        isStopped: false
    };
    bossSpawned = true;
}

function spawnCoin(x, y) {
    if (Math.random() < 0.3) {
        coins.push({ x, y, size: 10 });
    }
}

function findClosestZombie(bullet) {
    let closestZombie = null;
    let minDistance = Infinity;
    zombies.forEach(zombie => {
        const distance = Math.sqrt((bullet.x - zombie.x) ** 2 + (bullet.y - zombie.y) ** 2);
        if (distance < minDistance) {
            minDistance = distance;
            closestZombie = zombie;
        }
    });
    if (boss) {
        const distance = Math.sqrt((bullet.x - boss.x) ** 2 + (bullet.y - boss.y) ** 2);
        if (distance < minDistance) {
            minDistance = distance;
            closestZombie = boss;
        }
    }
    return closestZombie;
}

function findNearbyZombie(zombie, exclude) {
    let closestZombie = null;
    let minDistance = 100;
    zombies.forEach(z => {
        if (z !== exclude) {
            const distance = Math.sqrt((zombie.x - z.x) ** 2 + (zombie.y - z.y) ** 2);
            if (distance < minDistance) {
                minDistance = distance;
                closestZombie = z;
            }
        }
    });
    return closestZombie;
}

const availableUpgrades = [
    {
        name: "+1 Diagonais",
        description: "Adiciona uma bala diagonal para cada lado",
        rarity: "raro",
        chance: 0.5,
        accumulable: true,
        effect: () => {
            diagonalShots += 1;
            collectedUpgrades.push("+1 Diagonais");
            updateUpgradesList();
            restoreCanvasFocus();
        }
    },
    {
        name: "+1 Frente",
        description: "Adiciona uma bala extra na direção frontal",
        rarity: "raro",
        chance: 0.5,
        accumulable: true,
        effect: () => {
            frontShots += 1;
            collectedUpgrades.push("+1 Frente");
            updateUpgradesList();
            restoreCanvasFocus();
        }
    },
    {
        name: "Pressa",
        description: "Aumenta a velocidade de movimento em 5%",
        rarity: "raro",
        chance: 0.5,
        accumulable: true,
        effect: () => {
            speedUpgrades += 1;
            player.speed = player.baseSpeed * Math.pow(1.05, speedUpgrades);
            collectedUpgrades.push("Pressa");
            updateUpgradesList();
            restoreCanvasFocus();
        }
    },
    {
        name: "Hp-UP",
        description: "Aumenta a vida máxima em 5%",
        rarity: "raro",
        chance: 0.5,
        accumulable: true,
        effect: () => {
            player.maxHealth *= 1.05;
            player.health = player.maxHealth;
            collectedUpgrades.push("Hp-UP");
            healthBar.style.width = `${(player.health / player.maxHealth) * 100}%`;
            healthText.textContent = `Vida: ${Math.round((player.health / player.maxHealth) * 100)}%`;
            updateUpgradesList();
            restoreCanvasFocus();
        }
    },
    {
        name: "Balas Elétricas",
        description: "Balas causam choque em zumbi próximo (50% de chance)",
        rarity: "normal",
        chance: 0.3,
        accumulable: false,
        effect: () => {
            electricShot = true;
            collectedUpgrades.push("Balas Elétricas");
            updateUpgradesList();
            restoreCanvasFocus();
        }
    },
    {
        name: "Perfuração",
        description: "Balas atravessam até 2 zumbis",
        rarity: "normal",
        chance: 0.3,
        accumulable: false,
        effect: () => {
            pierceCount = 2;
            collectedUpgrades.push("Perfuração");
            updateUpgradesList();
            restoreCanvasFocus();
        }
    },
    {
        name: "Mãos Leves",
        description: "Aumenta a velocidade de disparo em 20%",
        rarity: "normal",
        chance: 0.3,
        accumulable: true,
        effect: () => {
            lightHands = true;
            goodHands = false;
            updateShootDelay();
            collectedUpgrades.push("Mãos Leves");
            updateUpgradesList();
            restoreCanvasFocus();
        }
    },
    {
        name: "Mãos Boas",
        description: "Aumenta a velocidade de disparo em 30%",
        rarity: "epico",
        chance: 0.15,
        accumulable: false,
        effect: () => {
            goodHands = true;
            lightHands = false;
            updateShootDelay();
            collectedUpgrades.push("Mãos Boas");
            updateUpgradesList();
            restoreCanvasFocus();
        }
    },
    {
        name: "Balas Teleguiadas",
        description: "Balas seguem o zumbi mais próximo",
        rarity: "lendario",
        chance: 0.05,
        accumulable: false,
        effect: () => {
            homingShot = true;
            collectedUpgrades.push("Balas Teleguiadas");
            updateUpgradesList();
            restoreCanvasFocus();
        }
    },
    {
        name: "Regeneração",
        description: "Recupera 0,5 vida por segundo",
        rarity: "lendario",
        chance: 0.05,
        accumulable: false,
        effect: () => {
            regen = true;
            collectedUpgrades.push("Regeneração");
            updateUpgradesList();
            restoreCanvasFocus();
        }
    },
    {
        name: "Vampirismo",
        description: "30% de chance de recuperar 1 vida ao matar um zumbi",
        rarity: "lendario",
        chance: 0.05,
        accumulable: false,
        effect: () => {
            vampirism = true;
            collectedUpgrades.push("Vampirismo");
            updateUpgradesList();
            restoreCanvasFocus();
        }
    }
];

function updateShootDelay() {
    let baseDelay = equippedWeapon === 'glock' ? 1200 : equippedWeapon === 'rifle' ? 1000 : 2000 - fireRateUpgrades * 50;
    if (lightHands) baseDelay *= 0.8;
    if (goodHands) baseDelay *= 0.7;
    shootDelay = Math.max(50, baseDelay);
}

function applyInitialUpgrade() {
    if (!hasInitialUpgrade) return;
    const validUpgrades = availableUpgrades.filter(upgrade => 
        upgrade.accumulable || 
        (!upgrade.accumulable && (
            (upgrade.name === "Balas Teleguiadas" && !homingShot) ||
            (upgrade.name === "Regeneração" && !regen) ||
            (upgrade.name === "Vampirismo" && !vampirism) ||
            (upgrade.name === "Balas Elétricas" && !electricShot) ||
            (upgrade.name === "Mãos Leves" && !lightHands && !goodHands) ||
            (upgrade.name === "Mãos Boas" && !goodHands && !lightHands) ||
            (upgrade.name === "Perfuração" && pierceCount < 2 && !collectedUpgrades.includes("Perfuração"))
        ))
    );
    if (validUpgrades.length === 0) return;
    const totalChance = validUpgrades.reduce((sum, u) => sum + u.chance, 0);
    let random = Math.random() * totalChance;
    let selectedUpgrade = null;
    for (let upgrade of validUpgrades) {
        random -= upgrade.chance;
        if (random <= 0) {
            selectedUpgrade = upgrade;
            break;
        }
    }
    if (selectedUpgrade) {
        selectedUpgrade.effect();
    }
}

function shoot(touchX, touchY) {
    if (isPaused) return;
    const now = Date.now();
    if (now - lastShot < shootDelay) return;
    lastShot = now;

    let dx = 0, dy = 0;
    if (isMobile && touchX !== undefined && touchY !== undefined) {
        dx = touchX - player.x;
        dy = touchY - player.y;
        const snapped = snapToEightDirections(dx, dy);
        dx = snapped.dx;
        dy = snapped.dy;
    } else if (isMobile && touchState.shoot.active) {
        const snapped = snapToEightDirections(touchState.shoot.dx, touchState.shoot.dy);
        dx = snapped.dx;
        dy = snapped.dy;
    } else {
        if (keys.ArrowUp) dy = -1;
        if (keys.ArrowDown) dy = 1;
        if (keys.ArrowLeft) dx = -1;
        if (keys.ArrowRight) dx = 1;
        if (dx !== 0 || dy !== 0) {
            const snapped = snapToEightDirections(dx, dy);
            dx = snapped.dx;
            dy = snapped.dy;
        }
    }

    if (dx !== 0 || dy !== 0) {
        bullets.push({ 
            x: player.x, 
            y: player.y, 
            dx: dx * 7, 
            dy: dy * 7, 
            homing: homingShot,
            electric: electricShot,
            electricTimer: null,
            pierce: pierceCount
        });

        for (let i = 1; i <= diagonalShots; i++) {
            const angle1 = Math.PI / 4;
            const angle2 = -Math.PI / 4;
            bullets.push({
                x: player.x,
                y: player.y,
                dx: Math.cos(angle1) * 7,
                dy: Math.sin(angle1) * 7,
                homing: homingShot,
                electric: electricShot,
                electricTimer: null,
                pierce: pierceCount
            });
            bullets.push({
                x: player.x,
                y: player.y,
                dx: Math.cos(angle2) * 7,
                dy: Math.sin(angle2) * 7,
                homing: homingShot,
                electric: electricShot,
                electricTimer: null,
                pierce: pierceCount
            });
        }

        for (let i = 1; i <= frontShots; i++) {
            const offset = i * 10 * (i % 2 === 0 ? -1 : 1);
            bullets.push({
                x: player.x + offset,
                y: player.y,
                dx: dx * 7,
                dy: dy * 7,
                homing: homingShot,
                electric: electricShot,
                electricTimer: null,
                pierce: pierceCount
            });
        }
    }
}

function selectUpgrade(index) {
    const buttons = upgradeOptions.getElementsByTagName('button');
    if (buttons[index]) {
        buttons[index].click();
    }
}

function showUpgradeMenu() {
    isPaused = true;
    upgradeMenu.style.display = 'block';
    upgradeOptions.innerHTML = '';

    const validUpgrades = availableUpgrades.filter(upgrade => 
        upgrade.accumulable || 
        (!upgrade.accumulable && (
            (upgrade.name === "Balas Teleguiadas" && !homingShot) ||
            (upgrade.name === "Regeneração" && !regen) ||
            (upgrade.name === "Vampirismo" && !vampirism) ||
            (upgrade.name === "Balas Elétricas" && !electricShot) ||
            (upgrade.name === "Mãos Leves" && !lightHands && !goodHands) ||
            (upgrade.name === "Mãos Boas" && !goodHands && !lightHands) ||
            (upgrade.name === "Perfuração" && pierceCount < 2 && !collectedUpgrades.includes("Perfuração"))
        ))
    );

    const selectedUpgrades = [];
    const totalChance = validUpgrades.reduce((sum, u) => sum + u.chance, 0);
    while (selectedUpgrades.length < Math.min(3, validUpgrades.length)) {
        let random = Math.random() * totalChance;
        let selected = null;
        for (let upgrade of validUpgrades) {
            if (!selectedUpgrades.includes(upgrade)) {
                random -= upgrade.chance;
                if (random <= 0) {
                    selected = upgrade;
                    break;
                }
            }
        }
        if (selected) selectedUpgrades.push(selected);
    }

    selectedUpgrades.forEach((upgrade, index) => {
        const button = document.createElement('button');
        button.textContent = `${index + 1}. ${upgrade.name}: ${upgrade.description}`;
        button.className = upgrade.rarity;
        button.onclick = () => {
            upgrade.effect();
            upgradeMenu.style.display = 'none';
            isPaused = false;
            canvas.focus();
        };
        upgradeOptions.appendChild(button);
    });
}

function checkLevelUp() {
    if (xp >= xpToNextLevel) {
        level++;
        xp = 0;
        xpToNextLevel = Math.round(xpToNextLevel * 1.1);
        xpBar.style.width = '0%';
        xpText.textContent = `Nível ${level}: ${xp}/${xpToNextLevel} XP`;
        showUpgradeMenu();
    }
}

function update() {
    if (gameOver || isPaused) return;

    if (countdown > 0) {
        const now = Date.now();
        const elapsed = now - countdownStart;
        const remaining = Math.ceil((3000 - elapsed) / 1000);
        countdownDisplay.textContent = remaining;
        countdownDisplay.style.display = 'block';
        if (elapsed >= 3000) {
            countdown = 0;
            countdownDisplay.style.display = 'none';
            spawnBoss();
        }
        return;
    }

    if (isMobile) {
        if (touchState.movement.active && touchState.movement.dx !== 0 && touchState.movement.dy !== 0) {
            const length = Math.hypot(touchState.movement.dx, touchState.movement.dy);
            if (length > 0) {
                const snapped = snapToEightDirections(touchState.movement.dx, touchState.movement.dy);
                const normalizedDx = snapped.dx;
                const normalizedDy = snapped.dy;
                const moveX = normalizedDx * player.speed;
                const moveY = normalizedDy * player.speed;
                if (player.x + moveX > player.size && player.x + moveX < canvas.width - player.size) {
                    player.x += moveX;
                }
                if (player.y + moveY > player.size && player.y + moveY < canvas.height - player.size) {
                    player.y += moveY;
                }
            }
        } else if (touchState.movement.targetX !== null && touchState.movement.targetY !== null) {
            const dx = touchState.movement.targetX - player.x;
            const dy = touchState.movement.targetY - player.y;
            const distance = Math.hypot(dx, dy);
            if (distance > 5) {
                const snapped = snapToEightDirections(dx, dy);
                const normalizedDx = snapped.dx;
                const normalizedDy = snapped.dy;
                const moveX = normalizedDx * player.speed;
                const moveY = normalizedDy * player.speed;
                if (player.x + moveX > player.size && player.x + moveX < canvas.width - player.size) {
                    player.x += moveX;
                }
                if (player.y + moveY > player.size && player.y + moveY < canvas.height - player.size) {
                    player.y += moveY;
                }
            } else {
                touchState.movement.targetX = null;
                touchState.movement.targetY = null;
            }
        }
        if (touchState.shoot.active && touchState.shoot.dx !== 0 && touchState.shoot.dy !== 0) {
            const now = Date.now();
            if (now - touchState.shoot.lastShot >= shootDelay) {
                const snapped = snapToEightDirections(touchState.shoot.dx, touchState.shoot.dy);
                shoot(player.x + snapped.dx * 50, player.y + snapped.dy * 50);
                touchState.shoot.lastShot = now;
            }
        }
    } else {
        if (keys.w && player.y > player.size) player.y -= player.speed;
        if (keys.s && player.y < canvas.height - player.size) player.y += player.speed;
        if (keys.a && player.x > player.size) player.x -= player.speed;
        if (keys.d && player.x < canvas.width - player.size) player.x += player.speed;
        if (keys.ArrowUp || keys.ArrowDown || keys.ArrowLeft || keys.ArrowRight) {
            shoot();
        }
    }

    if (regen) {
        const now = Date.now();
        if (now - lastRegen >= 1000) {
            player.health = Math.min(player.maxHealth, player.health + 0.5);
            healthBar.style.width = `${(player.health / player.maxHealth) * 100}%`;
            healthText.textContent = `Vida: ${Math.round((player.health / player.maxHealth) * 100)}%`;
            lastRegen = now;
        }
    }

    bullets.forEach(bullet => {
        if (bullet.homing) {
            const closestZombie = findClosestZombie(bullet);
            if (closestZombie) {
                const dx = closestZombie.x - bullet.x;
                const dy = closestZombie.y - bullet.y;
                const snapped = snapToEightDirections(dx, dy);
                bullet.dx = snapped.dx * 7;
                bullet.dy = snapped.dy * 7;
            }
        }
        bullet.x += bullet.dx;
        bullet.y += bullet.dy;

        if (bullet.electric && bullet.electricTimer !== null && Date.now() - bullet.electricTimer >= 500) {
            bullet.electric = false;
        }
    });
    bullets = bullets.filter(b => b.x > 0 && b.x < canvas.width && b.y > 0 && b.y < canvas.height);

    zombies.forEach(zombie => {
        const dx = player.x - zombie.x;
        const dy = player.y - zombie.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        zombie.x += (dx / distance) * zombie.speed;
        zombie.y += (dy / distance) * zombie.speed;

        if (distance < player.size + zombie.size) {
            player.health -= 5;
            zombies = zombies.filter(z => z !== zombie);
            healthBar.style.width = `${(player.health / player.maxHealth) * 100}%`;
            healthText.textContent = `Vida: ${Math.round((player.health / player.maxHealth) * 100)}%`;
            if (player.health <= 0) {
                gameOver = true;
                gameOverDisplay.style.display = 'block';
                isPaused = true;
            }
        }

        bullets.forEach((bullet, bIndex) => {
            const bDistance = Math.sqrt((bullet.x - zombie.x) ** 2 + (bullet.y - zombie.y) ** 2);
            if (bDistance < zombie.size) {
                zombies = zombies.filter(z => z !== zombie);
                bullet.pierce -= 1;
                if (bullet.electric && bullet.electricTimer === null) {
                    bullet.electricTimer = Date.now();
                }
                if (bullet.pierce < 0 || (bullet.electric && bullet.pierce === 0)) {
                    bullets.splice(bIndex, 1);
                }
                score += 1;
                xp += 1;
                if ((score === 50 || score === 100) && !boss && !bossSpawned && countdown === 0) {
                    zombies = [];
                    countdown = 3;
                    countdownStart = Date.now();
                }
                if (vampirism && Math.random() < 0.3) {
                    player.health = Math.min(player.maxHealth, player.health + 1);
                    healthBar.style.width = `${(player.health / player.maxHealth) * 100}%`;
                    healthText.textContent = `Vida: ${Math.round((player.health / player.maxHealth) * 100)}%`;
                }
                xpBar.style.width = `${(xp / xpToNextLevel) * 100}%`;
                xpText.textContent = `Nível ${level}: ${xp}/${xpToNextLevel} XP`;
                scoreDisplay.textContent = `Pontos: ${score} | Moedas: ${coinCount}`;
                spawnCoin(zombie.x, zombie.y);
                checkLevelUp();

                if (bullet.electric && Math.random() < 0.5) {
                    const nearbyZombie = findNearbyZombie(zombie, zombie);
                    if (nearbyZombie) {
                        zombies = zombies.filter(z => z !== nearbyZombie);
                        score += 1;
                        xp += 1;
                        if ((score === 50 || score === 100) && !boss && !bossSpawned && countdown === 0) {
                            zombies = [];
                            countdown = 3;
                            countdownStart = Date.now();
                        }
                        if (vampirism && Math.random() < 0.3) {
                            player.health = Math.min(player.maxHealth, player.health + 1);
                            healthBar.style.width = `${(player.health / player.maxHealth) * 100}%`;
                            healthText.textContent = `Vida: ${Math.round((player.health / player.maxHealth) * 100)}%`;
                        }
                        xpBar.style.width = `${(xp / xpToNextLevel) * 100}%`;
                        xpText.textContent = `Nível ${level}: ${xp}/${xpToNextLevel} XP`;
                        scoreDisplay.textContent = `Pontos: ${score} | Moedas: ${coinCount}`;
                        spawnCoin(nearbyZombie.x, nearbyZombie.y);
                        checkLevelUp();
                    }
                }
            }
        });
    });

    if (boss) {
        const now = Date.now();
        const dx = player.x - boss.x;
        const dy = player.y - boss.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (boss.type === 'charger') {
            if (now - lastBossCharge >= 4000 && !boss.chargeWarning) {
                boss.chargeWarning = true;
                bossChargeWarning = now;
            }
            if (now - lastBossCharge >= 5000) {
                boss.speed = 4;
                boss.chargeTimer = now;
                lastBossCharge = now;
                boss.chargeWarning = false;
            }
            if (boss.chargeTimer && now - boss.chargeTimer >= 1000) {
                boss.speed = boss.baseSpeed;
                boss.chargeTimer = 0;
            }
        } else if (boss.type === 'shooter') {
            if (now - boss.shootTimer >= 3000 && !boss.isStopped) {
                boss.isStopped = true;
                boss.speed = 0;
                boss.shootTimer = now;
            }
            if (boss.isStopped && now - boss.shootTimer >= 2000) {
                const length = Math.sqrt(dx * dx + dy * dy);
                if (length > 0) {
                    bossBullets.push({
                        x: boss.x,
                        y: boss.y,
                        dx: (dx / length) * 5,
                        dy: (dy / length) * 5,
                        size: 10
                    });
                }
                boss.isStopped = false;
                boss.speed = boss.baseSpeed;
                boss.shootTimer = now;
            }
        }

        if (!boss.isStopped) {
            boss.x += (dx / distance) * boss.speed;
            boss.y += (dy / distance) * boss.speed;
        }

        if (distance < player.size + boss.size) {
            player.health -= 10;
            healthBar.style.width = `${(player.health / player.maxHealth) * 100}%`;
            healthText.textContent = `Vida: ${Math.round((player.health / player.maxHealth) * 100)}%`;
            if (player.health <= 0) {
                gameOver = true;
                gameOverDisplay.style.display = 'block';
                isPaused = true;
            }
        }

        bullets.forEach((bullet, bIndex) => {
            const bDistance = Math.sqrt((bullet.x - boss.x) ** 2 + (bullet.y - boss.y) ** 2);
            if (bDistance < boss.size) {
                boss.health -= 1;
                bullet.pierce -= 1;
                if (bullet.electric && bullet.electricTimer === null) {
                    bullet.electricTimer = Date.now();
                }
                if (bullet.pierce < 0 || (bullet.electric && bullet.pierce === 0)) {
                    bullets.splice(bIndex, 1);
                }
            }
        });

        bossBullets.forEach((bullet, bIndex) => {
            bullet.x += bullet.dx;
            bullet.y += bullet.dy;
            const pDistance = Math.sqrt((bullet.x - player.x) ** 2 + (bullet.y - player.y) ** 2);
            if (pDistance < player.size + bullet.size) {
                player.health -= 5;
                bossBullets.splice(bIndex, 1);
                healthBar.style.width = `${(player.health / player.maxHealth) * 100}%`;
                healthText.textContent = `Vida: ${Math.round((player.health / player.maxHealth) * 100)}%`;
                if (player.health <= 0) {
                    gameOver = true;
                    gameOverDisplay.style.display = 'block';
                    isPaused = true;
                }
            }
        });
        bossBullets = bossBullets.filter(b => b.x > 0 && b.x < canvas.width && b.y > 0 && b.y < canvas.height);

        if (boss && boss.health <= 0) {
            const bossX = boss.x;
            const bossY = boss.y;
            bosses += 1;
            score = score === 50 ? 51 : 101;
            xp += 10;
            coinCount += 5;
            spawnCoin(bossX, bossY);
            xpBar.style.width = `${(xp / xpToNextLevel) * 100}%`;
            xpText.textContent = `Nível ${level}: ${xp}/${xpToNextLevel} XP`;
            scoreDisplay.textContent = `Pontos: ${score} | Moedas: ${coinCount}`;
            checkLevelUp();
            saveData();
            boss = null;
            bossSpawned = false;
            bossBullets = [];
        }
    }

    coins = coins.filter(coin => {
        const distance = Math.sqrt((player.x - coin.x) ** 2 + (player.y - coin.y) ** 2);
        if (distance < player.size + coin.size) {
            coinCount += 1;
            scoreDisplay.textContent = `Pontos: ${score} | Moedas: ${coinCount}`;
            saveData();
            return false;
        }
        return true;
    });

    spawnZombies();
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'blue';
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.size, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'green';
    zombies.forEach(zombie => {
        ctx.beginPath();
        ctx.arc(zombie.x, zombie.y, zombie.size, 0, Math.PI * 2);
        ctx.fill();
    });

    if (boss) {
        if (boss.type === 'charger' && boss.chargeWarning && Date.now() - bossChargeWarning < 1000) {
            const dx = player.x - boss.x;
            const dy = player.y - boss.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const normalizedDx = dx / distance;
            const normalizedDy = dy / distance;
            const warningLength = 200;
            const warningWidth = boss.size * 2;

            ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
            ctx.beginPath();
            ctx.moveTo(boss.x - normalizedDy * warningWidth / 2, boss.y + normalizedDx * warningWidth / 2);
            ctx.lineTo(boss.x + normalizedDx * warningLength - normalizedDy * warningWidth / 2, boss.y + normalizedDy * warningLength + normalizedDx * warningWidth / 2);
            ctx.lineTo(boss.x + normalizedDx * warningLength + normalizedDy * warningWidth / 2, boss.y + normalizedDy * warningLength - normalizedDx * warningWidth / 2);
            ctx.lineTo(boss.x + normalizedDy * warningWidth / 2, boss.y - normalizedDx * warningWidth / 2);
            ctx.closePath();
            ctx.fill();
        } else if (boss.type === 'shooter' && boss.isStopped) {
            ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
            ctx.beginPath();
            ctx.arc(boss.x, boss.y, boss.size + 10, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.fillStyle = boss.type === 'charger' ? 'darkred' : 'purple';
        ctx.beginPath();
        ctx.arc(boss.x, boss.y, boss.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'white';
        ctx.font = '16px Arial';
        ctx.fillText(`Vida: ${boss.health}`, boss.x - 20, boss.y - 50);
    }

    ctx.fillStyle = 'red';
    bullets.forEach(bullet => {
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, 5, 0, Math.PI * 2);
        ctx.fill();
    });

    ctx.fillStyle = 'green';
    bossBullets.forEach(bullet => {
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, bullet.size, 0, Math.PI * 2);
        ctx.fill();
    });

    ctx.fillStyle = 'gold';
    coins.forEach(coin => {
        ctx.beginPath();
        ctx.arc(coin.x, coin.y, coin.size, 0, Math.PI * 2);
        ctx.fill();
    });

    if (isMobile && touchState.movement.targetX !== null && touchState.movement.targetY !== null) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.arc(touchState.movement.targetX, touchState.movement.targetY, 10, 0, Math.PI * 2);
        ctx.fill();
    }
}

function resetGame() {
    player = { x: canvas.width / 2, y: canvas.height / 2, size: 20, speed: player.baseSpeed * Math.pow(1.05, speedUpgrades), baseSpeed: 2.2, health: player.maxHealth, maxHealth: player.maxHealth };
    zombies = [];
    bullets = [];
    bossBullets = [];
    coins = [];
    boss = null;
    score = 0;
    xp = 0;
    level = 1;
    xpToNextLevel = 10;
    countdown = 0;
    countdownStart = 0;
    bossSpawned = false;
    lastBossCharge = 0;
    lastBossSpawnZombies = 0;
    bossChargeWarning = 0;
    diagonalShots = 0;
    frontShots = 0;
    homingShot = false;
    electricShot = false;
    pierceCount = equippedWeapon === 'rifle' ? 1 : 0;
    regen = false;
    vampirism = false;
    lightHands = false;
    goodHands = false;
    collectedUpgrades = equippedWeapon === 'rifle' ? ['Perfuração'] : [];
    updateUpgradesList();
    gameOver = false;
    isPaused = false;
    lastSpawn = 0;
    lastRegen = 0;
    lastShot = 0;
    updateShootDelay();
    gameOverDisplay.style.display = 'none';
    rankingDisplay.style.display = 'none';
    shopDisplay.style.display = 'none';
    upgradeMenu.style.display = 'none';
    countdownDisplay.style.display = 'none';
    scoreDisplay.textContent = `Pontos: ${score} | Moedas: ${coinCount}`;
    healthBar.style.width = '100%';
    healthText.textContent = `Vida: ${Math.round((player.health / player.maxHealth) * 100)}%`;
    xpBar.style.width = '0%';
    xpText.textContent = `Nível ${level}: ${xp}/${xpToNextLevel} XP`;
    applyInitialUpgrade();
    canvas.focus();
}

function showRanking() {
    savedDataLocal.ranking.push({ score, date: new Date().toLocaleString() });
    savedDataLocal.ranking.sort((a, b) => b.score - a.score);
    savedDataLocal.ranking = savedDataLocal.ranking.slice(0, 5);
    saveData();

    rankingList.innerHTML = '';
    savedDataLocal.ranking.forEach(entry => {
        const li = document.createElement('li');
        li.textContent = `Pontos: ${entry.score} - ${entry.date}`;
        rankingList.appendChild(li);
    });
    gameOverDisplay.style.display = 'none';
    rankingDisplay.style.display = 'block';
}

function closeRanking() {
    rankingDisplay.style.display = 'none';
    if (gameOver) {
        gameOverDisplay.style.display = 'block';
    } else {
        startScreen.style.display = 'block';
    }
    canvas.focus();
}

function showShop() {
    shopCoins.textContent = coinCount;
    fireRateCostDisplay.textContent = Math.round(fireRateCost);
    healthCostDisplay.textContent = Math.round(healthCost);
    updateWeaponButtons();
    showTab('weapons');
    gameOverDisplay.style.display = 'none';
    shopDisplay.style.display = 'block';
}

function closeShop() {
    shopDisplay.style.display = 'none';
    gameOverDisplay.style.display = 'block';
    canvas.focus();
}

function buyHealth() {
    if (coinCount >= healthCost) {
        coinCount -= healthCost;
        healthUpgrades += 1;
        player.maxHealth *= 1.2;
        player.health = player.maxHealth;
        healthCost *= 1.2;
        shopCoins.textContent = coinCount;
        healthCostDisplay.textContent = Math.round(healthCost);
        healthBar.style.width = '100%';
        healthText.textContent = `Vida: ${Math.round((player.health / player.maxHealth) * 100)}%`;
        saveData();
        alert('Vida extra comprada! Vida máxima: ' + Math.round(player.maxHealth));
        restoreCanvasFocus();
    } else {
        alert('Moedas insuficientes!');
        restoreCanvasFocus();
    }
}

function buyFireRate() {
    if (coinCount >= fireRateCost) {
        coinCount -= fireRateCost;
        fireRateUpgrades += 1;
        fireRateCost = 200 * Math.pow(1.15, fireRateUpgrades);
        updateShootDelay();
        shopCoins.textContent = coinCount;
        fireRateCostDisplay.textContent = Math.round(fireRateCost);
        saveData();
        alert('Tiro rápido comprado! Atraso de tiro: ' + shootDelay + 'ms');
        restoreCanvasFocus();
    } else {
        alert('Moedas insuficientes!');
        restoreCanvasFocus();
    }
}

function buyGlock() {
    if (!hasGlock && coinCount >= 100) {
        coinCount -= 100;
        hasGlock = true;
        equippedWeapon = 'glock';
        pierceCount = 0;
        updateShootDelay();
        shopCoins.textContent = coinCount;
        updateWeaponButtons();
        collectedUpgrades = collectedUpgrades.filter(u => u !== 'Perfuração');
        updateUpgradesList();
        saveData();
        alert('Glock comprada e equipada! Atraso de tiro: ' + shootDelay + 'ms');
        restoreCanvasFocus();
    } else if (hasGlock && equippedWeapon !== 'glock') {
        equippedWeapon = 'glock';
        pierceCount = 0;
        updateShootDelay();
        updateWeaponButtons();
        collectedUpgrades = collectedUpgrades.filter(u => u !== 'Perfuração');
        updateUpgradesList();
        saveData();
        alert('Glock equipada! Atraso de tiro: ' + shootDelay + 'ms');
        restoreCanvasFocus();
    } else if (!hasGlock) {
        alert('Moedas insuficientes!');
        restoreCanvasFocus();
    }
}

function buyRifle() {
    if (!hasRifle && coinCount >= 250) {
        coinCount -= 250;
        hasRifle = true;
        equippedWeapon = 'rifle';
        pierceCount = 1;
        updateShootDelay();
        shopCoins.textContent = coinCount;
        updateWeaponButtons();
        if (!collectedUpgrades.includes('Perfuração')) {
            collectedUpgrades.push('Perfuração');
            updateUpgradesList();
        }
        saveData();
        alert('Rifle Velho comprado e equipado! Atraso de tiro: ' + shootDelay + 'ms, +1 Perfuração');
        restoreCanvasFocus();
    } else if (hasRifle && equippedWeapon !== 'rifle') {
        equippedWeapon = 'rifle';
        pierceCount = 1;
        updateShootDelay();
        updateWeaponButtons();
        if (!collectedUpgrades.includes('Perfuração')) {
            collectedUpgrades.push('Perfuração');
            updateUpgradesList();
        }
        saveData();
        alert('Rifle Velho equipado! Atraso de tiro: ' + shootDelay + 'ms, +1 Perfuração');
        restoreCanvasFocus();
    } else if (!hasRifle) {
        alert('Moedas insuficientes!');
        restoreCanvasFocus();
    }
}

function buyInitialUpgrade() {
    if (coinCount >= 100 && !hasInitialUpgrade) {
        coinCount -= 100;
        hasInitialUpgrade = true;
        shopCoins.textContent = coinCount;
        buyInitialUpgradeBtn.disabled = true;
        buyInitialUpgradeBtn.textContent = "Comprado";
        saveData();
        alert('Upgrade Inicial comprado! Você receberá um upgrade aleatório no início de cada partida.');
        restoreCanvasFocus();
    } else if (hasInitialUpgrade) {
        alert('Upgrade Inicial já comprado!');
        restoreCanvasFocus();
    } else {
        alert('Moedas insuficientes!');
        restoreCanvasFocus();
    }
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

canvas.focus();
gameLoop();
