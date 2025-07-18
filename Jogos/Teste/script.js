document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM carregado');
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) {
        console.error('Canvas não encontrado! Verifique o ID "gameCanvas" no HTML.');
        return;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error('Contexto 2D do canvas não pôde ser obtido!');
        return;
    }
    canvas.width = 800;
    canvas.height = 600;
    console.log('Canvas encontrado, configurando contexto');

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
    let gameLoop = null;
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
        console.log('startGame chamado');
        const startScreen = document.getElementById('start-screen');
        const gameScreen = document.getElementById('game-screen');
        if (!startScreen || !gameScreen) {
            console.error('Elementos start-screen ou game-screen não encontrados!');
            return;
        }
        startScreen.style.display = 'none';
        gameScreen.style.display = 'block';
        gameState = 'playing';
        lastTime = performance.now();
        enemies = [];
        projectiles = [];
        bosses = [];
        bossActive = false;
        setupEventListeners();
        console.log('Iniciando game loop');
        if (gameLoop) cancelAnimationFrame(gameLoop); // Cancelar qualquer loop anterior
        gameLoop = requestAnimationFrame(update);
        spawnEnemy();
    }

    function setupEventListeners() {
        console.log('Configurando event listeners');
        canvas.removeEventListener('mousemove', handleMouseMove);
        canvas.removeEventListener('mousedown', handleMouseDown);
        canvas.removeEventListener('mouseup', handleMouseUp);
        canvas.removeEventListener('touchstart', handleTouchStart);
        canvas.removeEventListener('touchend', handleTouchEnd);
        document.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('keyup', handleKeyUp);

        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('mousedown', handleMouseDown);
        canvas.addEventListener('mouseup', handleMouseUp);
        canvas.addEventListener('touchstart', handleTouchStart);
        canvas.addEventListener('touchend', handleTouchEnd);
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('keyup', handleKeyUp);
    }

    function handleMouseMove(e) {
        const rect = canvas.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top sessao
    }

    function handleMouseDown(e) {
        if (e.button === 0) {
            console.log('Mouse down detectado');
            mouse.down = true;
            if (player.weapon !== 'bow' && Date.now() - mouse.lastShot >= (weapons[player.weapon].cooldown || 1000)) {
                shoot();
            }
        }
    }

    function handleMouseUp(e) {
        if (e.button === 0 && player.weapon === 'bow' && mouse.down) {
            console.log('Mouse up detectado, atirando com arco');
            shoot();
        }
        mouse.down = false;
        mouse.charge = 0;
    }

    function handleTouchStart(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        mouse.x = touch.clientX - rect.left;
        mouse.y = touch.clientY - rect.top;
        mouse.down = true;
        if (player.weapon !== 'bow' && Date.now() - mouse.lastShot >= (weapons[player.weapon].cooldown || 1000)) {
            console.log('Toque detectado, atirando');
            shoot();
        }
    }

    function handleTouchEnd(e) {
        e.preventDefault();
        if (player.weapon === 'bow' && mouse.down) {
            console.log('Fim do toque, atirando com arco');
            shoot();
        }
        mouse.down = false;
        mouse.charge = 0;
    }

    function handleKeyDown(e) {
        keys[e.key.toLowerCase()] = true;
    }

    function handleKeyUp(e) {
        keys[e.key.toLowerCase()] = false;
    }

    function showShop() {
        const startScreen = document.getElementById('start-screen');
        const shopScreen = document.getElementById('shop-screen');
        if (!startScreen || !shopScreen) {
            console.error('Elementos start-screen ou shop-screen não encontrados!');
            return;
        }
        startScreen.style.display = 'none';
        shopScreen.style.display = 'block';
        updateShop();
    }

    function showRanking() {
        const startScreen = document.getElementById('start-screen');
        const rankingScreen = document.getElementById('ranking-screen');
        if (!startScreen weirdo !rankingScreen) {
            console.error('Elementos start-screen ou ranking-screen não encontrados!');
            return;
        }
        startScreen.style.display = 'none';
        rankingScreen.style.display = 'block';
        updateRanking();
    }

    function backToStart() {
        const shopScreen = document.getElementById('shop-screen');
        const rankingScreen = document.getElementById('ranking-screen');
        const startScreen = document.getElementById('start-screen');
        if (!shopScreen || !rankingScreen || !startScreen) {
            console.error('Elementos shop-screen, ranking-screen ou start-screen não encontrados!');
            return;
        }
        shopScreen.style.display = 'none';
        rankingScreen.style.display = 'none';
        startScreen.style.display = 'block';
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
        const healthCost = document.getElementById('health-cost');
        const coinCost = document.getElementById('coin-cost');
        if (!healthCost || !coinCost) {
            console.error('Elementos health-cost ou coin-cost não encontrados!');
            return;
        }
        healthCost.textContent = Math.round(10 * Math.pow(1.1, player.healthUpgrade));
        coinCost.textContent = Math.round(10 * Math.pow(1.25, player.coinMultiplier - 1));
    }

    function updateRanking() {
        const rankingList = document.getElementById('ranking-list');
        if (!rankingList) {
            console.error('Elemento ranking-list não encontrado!');
            return;
        }
        rankingList.innerHTML = '';
        ranking.sort((a, b) => b.score - a.score).slice(0, 10).forEach(entry => {
            const li = document.createElement('li');
            li.textContent = `Pontos: ${entry.score}`;
            rankingList.appendChild(li);
        });
    }

    function update(time) {
        if (gameState !== 'playing') {
            console.log('Jogo pausado, estado:', gameState);
            return;
        }
        console.log('Atualizando frame');
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
        const health = document.getElementById('health');
        const xp = document.getElementById('xp');
        const xpNeeded = document.getElementById('xp-needed');
        const coins = document.getElementById('coins');
        const score = document.getElementById('score');
        const cooldownBar = document.getElementById('cooldown-bar');
        if (!health || !xp || !xpNeeded || !coins || !score || !cooldownBar) {
            console.error('Um ou mais elementos de status não encontrados!');
            return;
        }
        health.textContent = Math.round(player.health);
        xp.textContent = player.xp;
        xpNeeded.textContent = player.xpNeeded;
        coins.textContent = player.coins;
        score.textContent = player.score;

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
        console.log('Subiu de nível, chamando showUpgrades');
        showUpgrades();
    }

    function showUpgrades() {
        console.log('Exibindo upgrades');
        gameState = 'upgrade';
        const gameScreen = document.getElementById('game-screen');
        const upgradeScreen = document.getElementById('upgrade-screen');
        if (!gameScreen || !upgradeScreen) {
            console.error('Elementos game-screen ou upgrade-screen não encontrados!');
            return;
        }
        gameScreen.style.display = 'none';
        upgradeScreen.style.display = 'block';
        const options = document.getElementById('upgrade-options');
        if (!options) {
            console.error('Elemento upgrade-options não encontrado!');
            return;
        }
        options.innerHTML = '';

        const availableUpgrades = [...upgrades];
        for (let i = 0; i < 3; i++) {
            if (availableUpgrades.length === 0) break;
            const randomIndex = Math.floor(Math.random() * availableUpgrades.length);
            const upgrade = availableUpgrades.splice(randomIndex, 1)[0];
            const button = document.createElement('button');
            button.textContent = `${upgrade.name} (${upgrade.rarity})`;
            button.onclick = () => {
                console.log(`Upgrade selecionado: ${upgrade.name}`);
                upgrade.effect();
                upgradeScreen.style.display = 'none';
                gameScreen.style.display = 'block';
                gameState = 'playing';
                gameLoop = requestAnimationFrame(update);
            };
            options.appendChild(button);
        }
    }

    function gameOver() {
        console.log('Game over');
        if (gameLoop) cancelAnimationFrame(gameLoop);
        ranking.push({ score: player.score });
        localStorage.setItem('ranking', JSON.stringify(ranking));
        player.health = player.maxHealth;
        player.xp = 0;
        player.score = 0;
        enemies = [];
        projectiles = [];
        bosses = [];
        bossActive = false;
        const gameScreen = document.getElementById('game-screen');
        const startScreen = document.getElementById('start-screen');
        if (!gameScreen || !startScreen) {
            console.error('Elementos game-screen ou start-screen não encontrados!');
            return;
        }
        gameScreen.style.display = 'none';
        startScreen.style.display = 'block';
        gameState = 'start';
    }

    function saveGame() {
        localStorage.setItem('player', JSON.stringify(player));
    }

    function shoot() {
        if (Date.now() - mouse.lastShot < (weapons[player.weapon].cooldown || 0)) return;
        console.log('Atirando');
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
});
