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
const buyMagnetBtn = document.getElementById('buyMagnetBtn');
const buyAdrenalineBtn = document.getElementById('buyAdrenalineBtn');
const upgradeMenu = document.getElementById('upgradeMenu');
const upgradeOptions = document.getElementById('upgradeOptions');
const upgradesList = document.getElementById('upgradesList');
const movementJoystick = document.getElementById('movementJoystick');
const shootJoystick = document.getElementById('shootJoystick');

let player = { x: 500, y: 375, size: 20, speed: 1.75, baseSpeed: 1.75, health: 10, maxHealth: 10, damage: 1 };
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
let damageUpgrades = 0;
let suplemento = false;
let ricochetCount = 0;
let steelHeart = false;
let hasGlock = false;
let hasRifle = false;
let equippedWeapon = 'none';
let hasInitialUpgrade = false;
let collectedUpgrades = [];
let bosses = 0;
let zombieHealth = 2;
let bossDamage = 5;
let hasMagnet = false;
let hasAdrenaline = false;
let equippedAccessory = 'none';
let magnetActive = false;
let magnetStart = 0;
let magnetCooldown = 0;
let adrenalineActive = false;
let adrenalineStart = 0;
let adrenalineCooldown = 0;
let electricLines = [];

const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
const joystickState = {
    movement: { active: false, touchId: null, dx: 0, dy: 0, x: 0, y: 0 },
    shoot: { active: false, touchId: null, dx: 0, dy: 0, x: 0, y: 0 }
};

// Carregar dados salvos com validação
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
    hasMagnet: false,
    hasAdrenaline: false,
    equippedAccessory: 'none',
    ranking: []
};
coinCount = Number.isFinite(savedDataLocal.coins) ? savedDataLocal.coins : 0;
healthUpgrades = Number.isFinite(savedDataLocal.healthUpgrades) ? savedDataLocal.healthUpgrades : 0;
fireRateUpgrades = Number.isFinite(savedDataLocal.fireRateUpgrades) ? savedDataLocal.fireRateUpgrades : 0;
hasGlock = typeof savedDataLocal.hasGlock === 'boolean' ? savedDataLocal.hasGlock : false;
hasRifle = typeof savedDataLocal.hasRifle === 'boolean' ? savedDataLocal.hasRifle : false;
equippedWeapon = ['none', 'glock', 'rifle'].includes(savedDataLocal.equippedWeapon) ? savedDataLocal.equippedWeapon : 'none';
hasInitialUpgrade = typeof savedDataLocal.hasInitialUpgrade === 'boolean' ? savedDataLocal.hasInitialUpgrade : false;
speedUpgrades = Number.isFinite(savedDataLocal.speedUpgrades) ? savedDataLocal.speedUpgrades : 0;
healthCost = Number.isFinite(savedDataLocal.healthCost) ? savedDataLocal.healthCost : 50;
bosses = Number.isFinite(savedDataLocal.bosses) ? savedDataLocal.bosses : 0;
hasMagnet = typeof savedDataLocal.hasMagnet === 'boolean' ? savedDataLocal.hasMagnet : false;
hasAdrenaline = typeof savedDataLocal.hasAdrenaline === 'boolean' ? savedDataLocal.hasAdrenaline : false;
equippedAccessory = ['none', 'magnet', 'adrenaline'].includes(savedDataLocal.equippedAccessory) ? savedDataLocal.equippedAccessory : 'none';
player.maxHealth = 10 * Math.pow(1.2, healthUpgrades);
player.health = player.maxHealth;
player.speed = player.baseSpeed * Math.pow(1.05, speedUpgrades);
fireRateCost = 200 * Math.pow(1.15, fireRateUpgrades);
shootDelay = equippedWeapon === 'glock' ? 1200 : equippedWeapon === 'rifle' ? 1000 : 2000 - fireRateUpgrades * 50;
shootDelay = Math.max(50, shootDelay);
player.damage = equippedWeapon === 'glock' || equippedWeapon === 'rifle' ? 2 : 1;
fireRateCostDisplay.textContent = Math.round(fireRateCost);
healthCostDisplay.textContent = Math.round(healthCost);
healthText.textContent = `Vida: ${Math.round((player.health / player.maxHealth) * 100)}%`;
xpText.textContent = `Nível ${level}: ${xp}/${xpToNextLevel} XP`;
if (hasInitialUpgrade) {
    buyInitialUpgradeBtn.disabled = true;
    buyInitialUpgradeBtn.textContent = "Comprado";
}
updateWeaponButtons();
updateAccessoryButtons();
scoreDisplay.textContent = `Pontos: ${score} | Moedas: ${coinCount}`;

function resizeCanvas() {
    const container = document.getElementById('gameContainer');
    const scaleX = window.innerWidth / 1000;
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
    '3': false,
    'e': false
};

document.addEventListener('keydown', (e) => {
    const key = e.key;
    const normalizedKey = key === 'ArrowUp' || key === 'ArrowDown' || key === 'ArrowLeft' || key === 'ArrowRight' ? key : key.toLowerCase();
    if (normalizedKey in keys) {
        keys[normalizedKey] = true;
    }
    if (normalizedKey === 'r' && gameOver) resetGame();
    if (normalizedKey === 'e' && !isPaused) activateAccessory();
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
    movementJoystick.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const touch = e.changedTouches[0];
        joystickState.movement.active = true;
        joystickState.movement.touchId = touch.identifier;
        updateJoystick(touch, joystickState.movement, movementJoystick);
    });

    shootJoystick.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const touch = e.changedTouches[0];
        joystickState.shoot.active = true;
        joystickState.shoot.touchId = touch.identifier;
        updateJoystick(touch, joystickState.shoot, shootJoystick);
    });

    document.addEventListener('touchmove', (e) => {
        e.preventDefault();
        for (let touch of e.changedTouches) {
            if (joystickState.movement.active && touch.identifier === joystickState.movement.touchId) {
                updateJoystick(touch, joystickState.movement, movementJoystick);
            }
            if (joystickState.shoot.active && touch.identifier === joystickState.shoot.touchId) {
                updateJoystick(touch, joystickState.shoot, shootJoystick);
            }
        }
    });

    document.addEventListener('touchend', (e) => {
        e.preventDefault();
        for (let touch of e.changedTouches) {
            if (joystickState.movement.active && touch.identifier === joystickState.movement.touchId) {
                joystickState.movement.active = false;
                joystickState.movement.touchId = null;
                joystickState.movement.dx = 0;
                joystickState.movement.dy = 0;
                updateJoystickPosition(joystickState.movement, movementJoystick);
            }
            if (joystickState.shoot.active && touch.identifier === joystickState.shoot.touchId) {
                joystickState.shoot.active = false;
                joystickState.shoot.touchId = null;
                joystickState.shoot.dx = 0;
                joystickState.shoot.dy = 0;
                updateJoystickPosition(joystickState.shoot, shootJoystick);
            }
        }
    });

    function updateJoystick(touch, joystick, element) {
        const rect = element.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        let dx = touch.clientX - centerX;
        let dy = touch.clientY - centerY;
        const distance = Math.hypot(dx, dy);
        const maxDistance = rect.width / 2 - 20;
        if (distance > maxDistance) {
            const scale = maxDistance / distance;
            dx *= scale;
            dy *= scale;
        }
        joystick.dx = dx;
        joystick.dy = dy;
        joystick.x = centerX;
        joystick.y = centerY;
        updateJoystickPosition(joystick, element);
    }

    function updateJoystickPosition(joystick, element) {
        const inner = element.querySelector('.joystick-inner');
        inner.style.transform = `translate(${joystick.dx - 20}px, ${joystick.dy - 20}px)`;
    }
}

function restoreCanvasFocus() {
    setTimeout(() => {
        canvas.focus();
        console.log('Canvas focado');
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
        hasMagnet: hasMagnet,
        hasAdrenaline: hasAdrenaline,
        equippedAccessory: equippedAccessory,
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

function updateAccessoryButtons() {
    if (hasMagnet) {
        buyMagnetBtn.textContent = equippedAccessory === 'magnet' ? 'Equipado' : 'Equipar';
        buyMagnetBtn.disabled = equippedAccessory === 'magnet';
    } else {
        buyMagnetBtn.textContent = 'Comprar';
        buyMagnetBtn.disabled = false;
    }
    if (hasAdrenaline) {
        buyAdrenalineBtn.textContent = equippedAccessory === 'adrenaline' ? 'Equipado' : 'Equipar';
        buyAdrenalineBtn.disabled = equippedAccessory === 'adrenaline';
    } else {
        buyAdrenalineBtn.textContent = 'Comprar';
        buyAdrenalineBtn.disabled = false;
    }
}

function activateAccessory() {
    const now = Date.now();
    if (equippedAccessory === 'magnet' && !magnetActive && now - magnetCooldown >= 60000) {
        magnetActive = true;
        magnetStart = now;
        magnetCooldown = now;
        console.log('Imã Velho ativado');
    } else if (equippedAccessory === 'adrenaline' && !adrenalineActive && now - adrenalineCooldown >= 60000) {
        adrenalineActive = true;
        adrenalineStart = now;
        adrenalineCooldown = now;
        updateShootDelay();
        console.log('Adrenalina ativada');
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
        hasMagnet = false;
        hasAdrenaline = false;
        equippedAccessory = 'none';
        player.maxHealth = 10;
        player.health = player.maxHealth;
        player.speed = player.baseSpeed;
        player.damage = 1;
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
        updateAccessoryButtons();
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
    console.log('Iniciando o jogo...');
    startScreen.style.display = 'none';
    isPaused = false;
    gameOver = false;
    resetGame();
    canvas.focus();
    restoreCanvasFocus();
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
    if (score < 50) {
        zombieCount = 2;
        spawnInterval = 4000;
    } else if (score < 100) {
        zombieCount = 3;
        spawnInterval = 4000;
    } else {
        zombieCount = 4;
        spawnInterval = 3000;
    }

    if (score > 0 && score % 50 === 0 && !bossSpawned) {
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
        zombies.push({ x, y, size: 20, speed: 1.5, health: zombieHealth, maxHealth: zombieHealth });
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
        speed: 1.2,
        health: bossHealth,
        baseSpeed: 1.2,
        type: bossType,
        chargeTimerílio
        chargeTimer: 0,
        spawnZombieTimer: 0,
        chargeWarning: false,
        shootTimer: 0,
        isStopped: false,
        chargeDx: 0,
        chargeDy: 0
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
        name: "Força-Up",
        description: "Aumenta o dano em 5%",
        rarity: "raro",
        chance: 0.5,
        accumulable: true,
        effect: () => {
            damageUpgrades += 1;
            player.damage = (equippedWeapon === 'glock' || equippedWeapon === 'rifle' ? 2 : 1) * Math.pow(1.05, damageUpgrades);
            if (suplemento) player.damage *= 1.15;
            collectedUpgrades.push("Força-Up");
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
        description: "Balas atravessam até 1 zumbi",
        rarity: "normal",
        chance: 0.3,
        accumulable: false,
        effect: () => {
            pierceCount = 1;
            collectedUpgrades.push("Perfuração");
            updateUpgradesList();
            restoreCanvasFocus();
        }
    }
];

function buyRifle() {
    console.log('buyRifle chamado, coinCount:', coinCount, 'hasRifle:', hasRifle, 'equippedWeapon:', equippedWeapon);
    if (!hasRifle && coinCount >= 250) {
        coinCount -= 250;
        hasRifle = true;
        equippedWeapon = 'rifle';
        pierceCount = 1;
        player.damage = 2 * Math.pow(1.05, damageUpgrades) * (suplemento ? 1.15 : 1);
        updateShootDelay();
        shopCoins.textContent = coinCount;
        updateWeaponButtons();
        if (!collectedUpgrades.includes("Perfuração")) {
            collectedUpgrades.push("Perfuração");
        }
        updateUpgradesList();
        saveData();
        console.log('Rifle comprado:', { coinCount, hasRifle, equippedWeapon, pierceCount });
        alert('Rifle Velho comprado e equipado! Atraso de tiro: ' + shootDelay + 'ms, +1 Perfuração');
        restoreCanvasFocus();
    } else if (hasRifle && equippedWeapon !== 'rifle') {
        equippedWeapon = 'rifle';
        pierceCount = 1;
        player.damage = 2 * Math.pow(1.05, damageUpgrades) * (suplemento ? 1.15 : 1);
        updateShootDelay();
        updateWeaponButtons();
        if (!collectedUpgrades.includes("Perfuração")) {
            collectedUpgrades.push("Perfuração");
        }
        updateUpgradesList();
        saveData();
        console.log('Rifle equipado:', { coinCount, hasRifle, equippedWeapon, pierceCount });
        alert('Rifle Velho equipado! Atraso de tiro: ' + shootDelay + 'ms, +1 Perfuração');
        restoreCanvasFocus();
    } else if (!hasRifle) {
        alert('Moedas insuficientes!');
        restoreCanvasFocus();
    }
}

function buyInitialUpgrade() {
    if (!hasInitialUpgrade && coinCount >= 100) {
        coinCount -= 100;
        hasInitialUpgrade = true;
        shopCoins.textContent = coinCount;
        buyInitialUpgradeBtn.disabled = true;
        buyInitialUpgradeBtn.textContent = "Comprado";
        saveData();
        alert('Upgrade inicial comprado! Um upgrade aleatório será aplicado ao iniciar o jogo.');
        restoreCanvasFocus();
    } else if (!hasInitialUpgrade) {
        alert('Moedas insuficientes!');
        restoreCanvasFocus();
    }
}

function buyMagnet() {
    console.log('buyMagnet chamado, coinCount:', coinCount, 'hasMagnet:', hasMagnet, 'equippedAccessory:', equippedAccessory);
    if (!hasMagnet && coinCount >= 1000) {
        coinCount -= 1000;
        hasMagnet = true;
        equippedAccessory = 'magnet';
        shopCoins.textContent = coinCount;
        updateAccessoryButtons();
        saveData();
        console.log('Imã comprado:', { coinCount, hasMagnet, equippedAccessory });
        alert('Imã Velho comprado e equipado! Pressione "E" para ativar (15s ativo, 60s recarga).');
        restoreCanvasFocus();
    } else if (hasMagnet && equippedAccessory !== 'magnet') {
        equippedAccessory = 'magnet';
        updateAccessoryButtons();
        saveData();
        console.log('Imã equipado:', { coinCount, hasMagnet, equippedAccessory });
        alert('Imã Velho equipado! Pressione "E" para ativar (15s ativo, 60s recarga).');
        restoreCanvasFocus();
    } else if (!hasMagnet) {
        alert('Moedas insuficientes!');
        restoreCanvasFocus();
    }
}

function buyAdrenaline() {
    console.log('buyAdrenaline chamado, coinCount:', coinCount, 'hasAdrenaline:', hasAdrenaline, 'equippedAccessory:', equippedAccessory);
    if (!hasAdrenaline && coinCount >= 500) {
        coinCount -= 500;
        hasAdrenaline = true;
        equippedAccessory = 'adrenaline';
        shopCoins.textContent = coinCount;
        updateAccessoryButtons();
        saveData();
        console.log('Adrenalina comprada:', { coinCount, hasAdrenaline, equippedAccessory });
        alert('Adrenalina comprada e equipada! Pressione "E" para ativar (-75% tempo de disparo por 10s, 60s recarga).');
        restoreCanvasFocus();
    } else if (hasAdrenaline && equippedAccessory !== 'adrenaline') {
        equippedAccessory = 'adrenaline';
        updateAccessoryButtons();
        saveData();
        console.log('Adrenalina equipada:', { coinCount, hasAdrenaline, equippedAccessory });
        alert('Adrenalina equipada! Pressione "E" para ativar (-75% tempo de disparo por 10s, 60s recarga).');
        restoreCanvasFocus();
    } else if (!hasAdrenaline) {
        alert('Moedas insuficientes!');
        restoreCanvasFocus();
    }
}

function gameLoop() {
    console.log('gameLoop executando, isPaused:', isPaused);
    if (!isPaused) {
        let dx = 0, dy = 0;
        if (isMobile && joystickState.movement.active) {
            dx = joystickState.movement.dx / 40;
            dy = joystickState.movement.dy / 40;
            console.log('Joystick movement:', { dx, dy });
        } else {
            if (keys.w || keys.ArrowUp) dy -= 1;
            if (keys.s || keys.ArrowDown) dy += 1;
            if (keys.a || keys.ArrowLeft) dx -= 1;
            if (keys.d || keys.ArrowRight) dx += 1;
            console.log('Keyboard movement:', { dx, dy });
        }
        const length = Math.sqrt(dx * dx + dy * dy);
        if (length > 0) {
            dx = (dx / length) * player.speed;
            dy = (dy / length) * player.speed;
        }
        player.x = Math.max(player.size, Math.min(canvas.width - player.size, player.x + dx));
        player.y = Math.max(player.size, Math.min(canvas.height - player.size, player.y + dy));

        update();
        draw();
    }
    requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
