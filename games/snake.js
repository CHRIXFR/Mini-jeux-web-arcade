window.initSnake = function (container) {
    const game = new SnakeGame(container);
    window._snakeGame = game;
    game.showStartScreen();
};

class SnakeGame {
    constructor(container) {
        this.container = container;
        this.gridSize = 20;
        this.baseSpeed = 160;
        
        this.level = 1;
        this.applesEaten = 0;
        this.applesInLevel = 0;
        this.applesToNextLevel = 5;
        
        this.snake = [];
        this.apple = { x: 0, y: 0 };
        this.walls = [];
        
        this.direction = { x: 1, y: 0 };
        this.nextDirection = { x: 1, y: 0 };
        
        this.gameInterval = null;
        this.isPlaying = false;
        
        this.boundKeydown = this.handleKeydown.bind(this);
        this.renderLayout();
    }

    renderLayout() {
        this.container.innerHTML = `
            <div class="sk-game-container">
                <div id="sk-topbar"></div>
                <div class="sk-header">
                    <div class="sk-stats">
                        <div class="sk-stat">
                            <div class="sk-stat-label">POMMES</div>
                            <div class="sk-stat-value" id="sk-apples">0/5</div>
                        </div>
                    </div>
                </div>
                <div id="sk-grid" class="sk-grid"></div>
                <div class="sk-controls">
                    <div class="sk-dpad">
                        <button class="control-btn sk-btn-up" data-dir="up">▲</button>
                        <button class="control-btn sk-btn-left" data-dir="left">◀</button>
                        <button class="control-btn sk-btn-right" data-dir="right">▶</button>
                        <button class="control-btn sk-btn-down" data-dir="down">▼</button>
                    </div>
                </div>
            </div>
        `;
        window.arcade.renderGameTopbar('#sk-topbar', {
            id: 'snake-topbar',
            icon: '🐍',
            title: 'Snake',
            statLabel: 'Niveau',
            statValue: this.level
        });
        this.createGridCells();
        this.bindEvents();
    }

    createGridCells() {
        const grid = document.getElementById('sk-grid');
        grid.innerHTML = '';
        // CSS Grid 20x20
        grid.style.gridTemplateColumns = `repeat(${this.gridSize}, 1fr)`;
        grid.style.gridTemplateRows = `repeat(${this.gridSize}, 1fr)`;
        
        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                const cell = document.createElement('div');
                cell.className = 'sk-cell';
                cell.id = `sk-cell-${x}-${y}`;
                grid.appendChild(cell);
            }
        }
    }

    bindEvents() {
        // Au cas où le jeu est rechargé, on le nettoie
        document.removeEventListener('keydown', this.boundKeydown);
        document.addEventListener('keydown', this.boundKeydown);

        const dpadBtns = this.container.querySelectorAll('.sk-dpad .control-btn');
        dpadBtns.forEach(btn => {
            btn.addEventListener('touchstart', (e) => {
                e.preventDefault(); // Prevents double firing with mouse
                this.handleDpad(btn.dataset.dir);
            }, { passive: false });
            
            btn.addEventListener('mousedown', (e) => {
                e.preventDefault();
                this.handleDpad(btn.dataset.dir);
            });
        });
    }

    handleKeydown(e) {
        if (!this.isPlaying) return;
        
        switch (e.key) {
            case 'ArrowUp':
            case 'z':
            case 'w':
                if (this.direction.y !== 1) this.nextDirection = { x: 0, y: -1 };
                break;
            case 'ArrowDown':
            case 's':
                if (this.direction.y !== -1) this.nextDirection = { x: 0, y: 1 };
                break;
            case 'ArrowLeft':
            case 'q':
            case 'a':
                if (this.direction.x !== 1) this.nextDirection = { x: -1, y: 0 };
                break;
            case 'ArrowRight':
            case 'd':
                if (this.direction.x !== -1) this.nextDirection = { x: 1, y: 0 };
                break;
        }
    }

    handleDpad(dir) {
        if (!this.isPlaying) return;
        switch (dir) {
            case 'up':
                if (this.direction.y !== 1) this.nextDirection = { x: 0, y: -1 };
                break;
            case 'down':
                if (this.direction.y !== -1) this.nextDirection = { x: 0, y: 1 };
                break;
            case 'left':
                if (this.direction.x !== 1) this.nextDirection = { x: -1, y: 0 };
                break;
            case 'right':
                if (this.direction.x !== -1) this.nextDirection = { x: 1, y: 0 };
                break;
        }
    }

    showStartScreen() {
        const self = this;
        window.arcade.showStartModal({
            title: 'Snake',
            icon: '🐍',
            description: 'Dirigez le serpent, mangez des pommes et évitez les murs.',
            controls: [
                { icon: '⌨️', desktop: 'Flèches / ZQSD', mobile: 'D-Pad Tactile' }
            ],
            onStart: function () {
                self.newGame();
            },
            onQuit: function () { 
                document.removeEventListener('keydown', self.boundKeydown);
                window.arcade.renderHome(); 
            }
        });
    }

    newGame() {
        if (window.arcade.audio) {
            window.arcade.audio.setContext('snake');
        }

        this.level = 1;
        this.applesEaten = 0;
        this.applesInLevel = 0;
        this.walls = [];
        this.direction = { x: 1, y: 0 };
        this.nextDirection = { x: 1, y: 0 };
        
        // Start in middle
        const mid = Math.floor(this.gridSize / 2);
        this.snake = [
            { x: mid, y: mid },
            { x: mid - 1, y: mid },
            { x: mid - 2, y: mid }
        ];

        this.updateStatsUI();
        this.placeApple();
        this.draw();
        
        this.isPlaying = true;
        this.startGameLoop();
    }

    startGameLoop() {
        if (this.gameInterval) clearInterval(this.gameInterval);
        
        // La vitesse augmente (le délai diminue) par tranche jusqu'à un minimum
        const currentSpeed = Math.max(60, this.baseSpeed - (this.level - 1) * 8);
        
        this.gameInterval = setInterval(() => this.update(), currentSpeed);
    }

    update() {
        if (!this.isPlaying) return;

        this.direction = this.nextDirection;

        const head = { ...this.snake[0] };
        head.x += this.direction.x;
        head.y += this.direction.y;

        // Collision mur extérieur
        if (head.x < 0 || head.x >= this.gridSize || head.y < 0 || head.y >= this.gridSize) {
            return this.gameOver();
        }

        // Collision soi-même
        if (this.snake.some(segment => segment.x === head.x && segment.y === head.y)) {
            return this.gameOver();
        }

        // Collision murs générés aléatoirement
        if (this.walls.some(wall => wall.x === head.x && wall.y === head.y)) {
            return this.gameOver();
        }

        this.snake.unshift(head);

        // Pomme mangée ?
        if (head.x === this.apple.x && head.y === this.apple.y) {
            this.applesEaten++;
            this.applesInLevel++;
            
            if (window.arcade.audio) {
                window.arcade.audio.playTone(600, 'sine', 0.1, 0.1);
            }
            
            this.updateStatsUI();

            if (this.applesInLevel >= this.applesToNextLevel) {
                this.levelUp();
            } else {
                this.placeApple();
            }
        } else {
            this.snake.pop(); // Remove tail if no apple eaten
        }

        this.draw();
    }

    levelUp() {
        this.isPlaying = false;
        this.level++;
        this.applesInLevel = 0;
        
        if (window.arcade.audio) {
            window.arcade.audio.playTone(800, 'triangle', 0.2, 0.2);
            setTimeout(() => window.arcade.audio.playTone(1000, 'triangle', 0.3, 0.2), 200);
        }

        this.updateStatsUI();
        
        // Reset la grille, on garde le serpent positionné au milieu
        const mid = Math.floor(this.gridSize / 2);
        this.snake = [
            { x: mid, y: mid },
            { x: mid - 1, y: mid },
            { x: mid - 2, y: mid }
        ];
        this.direction = { x: 1, y: 0 };
        this.nextDirection = { x: 1, y: 0 };
        
        this.generateWalls();
        this.placeApple();
        this.draw();

        // Flash screen
        const grid = document.getElementById('sk-grid');
        grid.style.background = 'var(--accent)';
        setTimeout(() => {
            grid.style.background = 'var(--card-bg-alt)';
            
            // Reprise du jeu courte
            setTimeout(() => {
                this.isPlaying = true;
                this.startGameLoop(); // avec la nouvelle vitesse
            }, 800);
            
        }, 200);
    }

    generateWalls() {
        this.walls = [];
        // Nombre de murs augmente avec le niveau, max 20 murs
        const numWalls = Math.min(20, (this.level - 1) * 3);
        
        for (let i = 0; i < numWalls; i++) {
            let x, y;
            let secure = false;
            let attempts = 0;
            
            while (!secure && attempts < 50) {
                x = Math.floor(Math.random() * this.gridSize);
                y = Math.floor(Math.random() * this.gridSize);
                
                // Vérifier que ça ne spawn pas sur le serpent (qui sera toujours réinitialisé au milieu lors du levelup)
                // Ou trop proche du centre (sécurité 5x5 au centre)
                const mid = Math.floor(this.gridSize / 2);
                if (x >= mid - 3 && x <= mid + 3 && y >= mid - 3 && y <= mid + 3) {
                    attempts++;
                    continue;
                }

                // Vérifier s'il n'y a pas déjà un mur là
                if (this.walls.some(w => w.x === x && w.y === y)) {
                    attempts++;
                    continue;
                }

                secure = true;
                this.walls.push({ x, y });
            }
        }
    }

    placeApple() {
        let secure = false;
        let attempts = 0;

        while (!secure && attempts < 100) {
            this.apple.x = Math.floor(Math.random() * this.gridSize);
            this.apple.y = Math.floor(Math.random() * this.gridSize);

            // Pas sur le serpent
            let onSnake = this.snake.some(segment => segment.x === this.apple.x && segment.y === this.apple.y);
            // Pas sur un mur
            let onWall = this.walls.some(wall => wall.x === this.apple.x && wall.y === this.apple.y);

            if (!onSnake && !onWall) secure = true;
            attempts++;
        }
    }

    draw() {
        // Nettoyer grid
        document.querySelectorAll('.sk-cell').forEach(c => {
            c.className = 'sk-cell'; // reset
        });

        // Les murs
        this.walls.forEach(w => {
            const el = document.getElementById(`sk-cell-${w.x}-${w.y}`);
            if (el) el.classList.add('wall');
        });

        // La pomme
        const aEl = document.getElementById(`sk-cell-${this.apple.x}-${this.apple.y}`);
        if (aEl) aEl.classList.add('apple');

        // Le serpent
        this.snake.forEach((s, i) => {
            const el = document.getElementById(`sk-cell-${s.x}-${s.y}`);
            if (el) {
                el.classList.add('snake');
                if (i === 0) el.classList.add('head');
            }
        });
    }

    updateStatsUI() {
        window.arcade.updateGameTopbarStat('snake-topbar', this.level);
        document.getElementById('sk-apples').textContent = `${this.applesInLevel}/${this.applesToNextLevel}`;
    }

    gameOver() {
        this.isPlaying = false;
        clearInterval(this.gameInterval);

        if (window.arcade.audio) {
            window.arcade.audio.playTone(150, 'sawtooth', 0.5, 0.4);
            const grid = document.getElementById('sk-grid');
            grid.classList.add('shake');
            setTimeout(() => grid.classList.remove('shake'), 400);
        }

        const self = this;
        // Le titre doit être 'snake' pour coïncider avec l'ID du jeu 
        // Et on sauvegarde 'level' comme le score.
        window.arcade.showGameOverModal({
            title: 'snake',
            gameStatus: 'Partie terminée !',
            icon: '💥',
            stats: [
                { label: 'Niveau atteint', value: this.level },
                { label: 'Pommes totales', value: this.applesEaten }
            ],
            score: this.level,
            scoreType: 'points',
            onReplay: function () { self.newGame(); },
            onQuit: function () { 
                document.removeEventListener('keydown', self.boundKeydown);
                window.arcade.renderHome(); 
            }
        });
    }
}
