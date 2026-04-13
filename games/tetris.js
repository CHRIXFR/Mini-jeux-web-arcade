// games/tetris.js

if (!window.arcade) {
    window.arcade = {};
}

// ---------------------------------------------------------
// TETRIS ENGINE
// ---------------------------------------------------------

window.arcade.tetris = {
    // ---- DOM Elements ----
    mountNode: null,
    gridElement: null,
    nextGridElement: null,
    scoreElement: null,
    linesElement: null,
    levelElement: null,

    // ---- Game State ----
    grid: [],
    nextPiece: null,
    currentPiece: null,
    score: 0,
    lines: 0,
    level: 1,
    isGameOver: false,

    // ---- Loop State ----
    animationId: null,
    lastTime: 0,
    dropCounter: 0,
    dropInterval: 1000,

    // ---- Constants ----
    COLS: 10,
    ROWS: 20,
    CELL_SIZE: 30, // Unused for logic, mostly for info

    // Les couleurs associées pour le CSS
    colors: {
        'I': 'tetris-I',
        'J': 'tetris-J',
        'L': 'tetris-L',
        'O': 'tetris-O',
        'S': 'tetris-S',
        'T': 'tetris-T',
        'Z': 'tetris-Z'
    },

    // Définition des pièces (Matrice bidimensionnelle)
    tetrominos: {
        'I': [
            [0, 0, 0, 0],
            [1, 1, 1, 1],
            [0, 0, 0, 0],
            [0, 0, 0, 0]
        ],
        'J': [
            [1, 0, 0],
            [1, 1, 1],
            [0, 0, 0]
        ],
        'L': [
            [0, 0, 1],
            [1, 1, 1],
            [0, 0, 0]
        ],
        'O': [
            [1, 1],
            [1, 1]
        ],
        'S': [
            [0, 1, 1],
            [1, 1, 0],
            [0, 0, 0]
        ],
        'T': [
            [0, 1, 0],
            [1, 1, 1],
            [0, 0, 0]
        ],
        'Z': [
            [1, 1, 0],
            [0, 1, 1],
            [0, 0, 0]
        ]
    },

    // ==========================================
    // INITIALISATION
    // ==========================================
    renderLayout: function () {
        this.mountNode.innerHTML = `
            <div id="view-tetris" class="tetris-game-container">
                <div id="tetris-topbar"></div>
                
                <div class="tetris-main-area">
                    <div id="tetris-grid" class="tetris-grid"></div>
                    
                    <div class="tetris-side-panel">
                        <div class="tetris-stat-label">Suivant</div>
                        <div id="tetris-next-grid" class="tetris-next-piece"></div>
                        <div class="tetris-stat-box" style="margin-top: 1rem;">
                            <span class="tetris-stat-label">Lignes</span>
                            <span id="tetris-lines" class="tetris-stat-value">0</span>
                        </div>
                        <div class="tetris-stat-box" style="margin-top: 0.75rem;">
                            <span class="tetris-stat-label">Niveau</span>
                            <span id="tetris-level" class="tetris-stat-value">1</span>
                        </div>
                        
                        <div class="tetris-controls-mobile">
                            <button id="btn-tetris-left" class="btn-secondary">◀</button>
                            <button id="btn-tetris-right" class="btn-secondary">▶</button>
                            <button id="btn-tetris-down" class="btn-secondary">▼</button>
                            <button id="btn-tetris-rotate" class="btn-primary">↻</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        window.arcade.renderGameTopbar('#tetris-topbar', {
            id: 'tetris-topbar',
            icon: '🧱',
            title: 'Tetris',
            statLabel: 'Score',
            statValue: this.score
        });
    },

    init: function (mountNode) {
        this.mountNode = mountNode;
        this.renderLayout();
        this.gridElement = document.getElementById('tetris-grid');
        this.nextGridElement = document.getElementById('tetris-next-grid');
        this.linesElement = document.getElementById('tetris-lines');
        this.levelElement = document.getElementById('tetris-level');

        // Touches clavier
        this.handleKeyDown = this.handleKeyDown.bind(this);
        document.addEventListener('keydown', this.handleKeyDown);

        // Boutons tactiles
        const btnLeft = document.getElementById('btn-tetris-left');
        const btnRight = document.getElementById('btn-tetris-right');
        const btnRotate = document.getElementById('btn-tetris-rotate');
        const btnDown = document.getElementById('btn-tetris-down');

        if (btnLeft) btnLeft.addEventListener('click', () => this.movePiece(-1, 0));
        if (btnRight) btnRight.addEventListener('click', () => this.movePiece(1, 0));
        if (btnRotate) btnRotate.addEventListener('click', () => this.rotatePiece());
        if (btnDown) btnDown.addEventListener('click', () => this.movePiece(0, 1));
    },

    cleanup: function () {
        document.removeEventListener('keydown', this.handleKeyDown);
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        if (window.arcade.audio) {
            window.arcade.audio.stopMusic();
        }
    },

    showStartModal: function () {
        const self = this;
        window.arcade.showStartModal({
            title: 'Tetris',
            icon: '🧱',
            description: 'Prêt à empiler les blocs et pulvériser vos records ?',
            controls: [
                { icon: '⌨️', desktop: 'Flèches pour déplacer/tourner', mobile: 'Boutons pour déplacer' },
                { icon: '⏬', desktop: 'Espace pour chute rapide', mobile: 'Bouton ↻ pour tourner' }
            ],
            onStart: function () { self.start(); },
            onQuit: function () { window.arcade.renderHome(); }
        });
    },

    start: function () {
        // Nettoyage de sécurité
        if (this.animationId) cancelAnimationFrame(this.animationId);

        // Reset l'état
        this.grid = this.createEmptyMatrix(this.COLS, this.ROWS);
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.dropInterval = 1000;
        this.isGameOver = false;

        this.updateStatsUI();

        // Créer les grilles DOM
        this.createGridDOM();
        this.createNextGridDOM();

        // Lancer la première pièce
        this.nextPiece = this.generateRandomPiece();
        this.spawnPiece();

        // Lancement Musique BGM
        if (window.arcade.audio) {
            window.arcade.audio.playMusic();
        }

        // Lancer la boucle
        this.lastTime = 0;
        this.dropCounter = 0;
        this.gameLoopWrapper = this.gameLoop.bind(this); // bind une seule fois
        this.animationId = requestAnimationFrame(this.gameLoopWrapper);
    },

    // ==========================================
    // LOGIQUE DE PIECE
    // ==========================================
    generateRandomPiece: function () {
        const sequence = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];
        const name = sequence[Math.floor(Math.random() * sequence.length)];
        const matrix = this.tetrominos[name];
        return {
            name: name,
            matrix: matrix,
            color: this.colors[name],
            // On centre la pièce horizontalement (dépend de la largeur de la matrice)
            x: Math.floor(this.COLS / 2) - Math.floor(matrix[0].length / 2),
            y: 0
        };
    },

    spawnPiece: function () {
        this.currentPiece = this.nextPiece;
        this.currentPiece.x = Math.floor(this.COLS / 2) - Math.floor(this.currentPiece.matrix[0].length / 2);
        this.currentPiece.y = 0;

        // Génère la nouvelle prochaine pièce
        this.nextPiece = this.generateRandomPiece();
        this.drawNextPiece();

        // Game Over Check au spawn
        if (this.checkCollision(this.currentPiece.matrix, this.currentPiece.x, this.currentPiece.y)) {
            this.isGameOver = true;
            this.triggerGameOver();
        }
    },

    // Réalise la translation de la pièce
    movePiece: function (dirX, dirY) {
        if (this.isGameOver) return false; // Return false to indicate no move happened

        // Check collision virtuelle
        if (!this.checkCollision(this.currentPiece.matrix, this.currentPiece.x + dirX, this.currentPiece.y + dirY)) {
            this.currentPiece.x += dirX;
            this.currentPiece.y += dirY;
            if (dirY > 0) {
                // Si move vers le bas manuel, on reset le timer
                this.dropCounter = 0;
            }
            // Play move sound only for horizontal moves
            if (dirX !== 0 && window.arcade.audio) {
                window.arcade.audio.playMove();
            }
            this.draw();
            return true; // Move successful
        } else {
            // Si c'est un drop qui collisionne, on fixe la pièce
            if (dirY > 0) {
                this.lockPiece();
            }
            this.draw(); // Redraw even if collision to show locked piece
            return false; // Move failed due to collision
        }
    },

    rotatePiece: function () {
        if (this.isGameOver) return;

        const originalMatrix = this.currentPiece.matrix;
        const rotatedMatrix = this.rotateMatrix(originalMatrix);

        // Si la rotation ne crée pas de collision
        if (!this.checkCollision(rotatedMatrix, this.currentPiece.x, this.currentPiece.y)) {
            this.currentPiece.matrix = rotatedMatrix;
            if (window.arcade.audio) {
                window.arcade.audio.playRotate();
            }
            this.draw();
        }
        // Sinon (collision contre un mur), on essaie le 'Wall Kick' très basique
        else {
            // Essaie à droite
            if (!this.checkCollision(rotatedMatrix, this.currentPiece.x + 1, this.currentPiece.y)) {
                this.currentPiece.matrix = rotatedMatrix;
                this.currentPiece.x += 1;
                if (window.arcade.audio) {
                    window.arcade.audio.playRotate();
                }
                this.draw();
            }
            // Essaie à gauche
            else if (!this.checkCollision(rotatedMatrix, this.currentPiece.x - 1, this.currentPiece.y)) {
                this.currentPiece.matrix = rotatedMatrix;
                this.currentPiece.x -= 1;
                if (window.arcade.audio) {
                    window.arcade.audio.playRotate();
                }
                this.draw();
            }
        }
    },

    rotateMatrix: function (matrix) {
        const N = matrix.length;
        const result = [];
        for (let i = 0; i < N; i++) {
            result.push(new Array(N).fill(0));
        }
        for (let y = 0; y < N; y++) {
            for (let x = 0; x < N; x++) {
                result[x][N - 1 - y] = matrix[y][x];
            }
        }
        return result;
    },

    hardDrop: function () {
        if (this.isGameOver) return;
        let dropDistance = 0;
        while (!this.checkCollision(this.currentPiece.matrix, this.currentPiece.x, this.currentPiece.y + 1)) {
            this.currentPiece.y++;
            dropDistance++;
        }
        this.score += dropDistance * 2; // Bonus de soft drop
        this.lockPiece();
        if (window.arcade.audio) {
            window.arcade.audio.playDrop();
        }
    },

    // Vérifie si la pièce intersecte la grille fixée ou le bords 
    checkCollision: function (pieceMatrix, offsetX, offsetY) {
        for (let y = 0; y < pieceMatrix.length; y++) {
            for (let x = 0; x < pieceMatrix[y].length; x++) {
                if (pieceMatrix[y][x] !== 0) {
                    let mapX = x + offsetX;
                    let mapY = y + offsetY;

                    // Out of bounds - Gauche, Droite, Bas
                    if (mapX < 0 || mapX >= this.COLS || mapY >= this.ROWS) {
                        return true;
                    }
                    // Dépasse en haut (safe)
                    if (mapY < 0) {
                        continue;
                    }
                    // Check dans la grille (si != 0 alors collision)
                    if (this.grid[mapY] && this.grid[mapY][mapX] !== 0) {
                        return true;
                    }
                }
            }
        }
        return false;
    },

    lockPiece: function () {
        if (this.isGameOver) return;

        // Transfère la pièce actuelle dans la grille globale
        for (let y = 0; y < this.currentPiece.matrix.length; y++) {
            for (let x = 0; x < this.currentPiece.matrix[y].length; x++) {
                if (this.currentPiece.matrix[y][x] !== 0) {
                    let mapY = y + this.currentPiece.y;
                    let mapX = x + this.currentPiece.x;
                    // Ignore les pièces fixées au dessus du plateau (Game over géré ailleurs)
                    if (mapY >= 0) {
                        // On stocke la string de couleur au lieu de 1
                        this.grid[mapY][mapX] = this.currentPiece.color;
                    }
                }
            }
        }

        // Vérifie les lignes complètes
        this.clearLines();

        // Game Over si on a locké hors écran (y < 0)
        // ou simplement on spawn la suite
        this.spawnPiece();
    },

    clearLines: function () {
        let linesCleared = 0;

        // De bas en haut
        for (let y = this.ROWS - 1; y >= 0; y--) {
            let rowIsFull = true;
            for (let x = 0; x < this.COLS; x++) {
                if (this.grid[y][x] === 0) {
                    rowIsFull = false;
                    break;
                }
            }

            if (rowIsFull) {
                // Retire la ligne Y et rajoute une ligne vide en haut (0)
                this.grid.splice(y, 1);
                this.grid.unshift(new Array(this.COLS).fill(0));
                linesCleared++;
                // On check la même ligne Y au prochain cycle vu qu'elle a été remplacée
                y++;
            }
        }

        if (linesCleared > 0) {
            this.lines += linesCleared;

            // Score classique (approx)
            let lineScores = [0, 40, 100, 300, 1200];
            this.score += lineScores[linesCleared] * this.level;

            // Level up tous les 10 lignes
            if (this.lines >= this.level * 10) {
                this.level++;
                // Accélère
                this.dropInterval = Math.max(100, 1000 - (this.level - 1) * 100);
            }

            this.updateStatsUI();

            // Effet visuel & Sonore
            if (window.arcade.audio && linesCleared > 0) {
                if (linesCleared >= 4) {
                    window.arcade.audio.playTetris();
                } else {
                    window.arcade.audio.playLineClear();
                }
            }

            // Flash effet (UX Premium)
            this.gridElement.classList.add('flash');
            setTimeout(() => this.gridElement.classList.remove('flash'), 200);

            // Si TETRIS
            if (linesCleared === 4) {
                this.gridElement.classList.add('shake');
                window.arcade.showToast("TETRIS ! 🎉");
                setTimeout(() => this.gridElement.classList.remove('shake'), 400);
            }
        }
    },

    // ==========================================
    // RENDER (DOM)
    // ==========================================

    createEmptyMatrix: function (w, h) {
        const matrix = [];
        for (let i = 0; i < h; i++) {
            matrix.push(new Array(w).fill(0));
        }
        return matrix;
    },

    createGridDOM: function () {
        this.gridElement.innerHTML = '';
        // 20 lignes x 10 cols
        for (let i = 0; i < this.ROWS * this.COLS; i++) {
            const cell = document.createElement('div');
            cell.classList.add('tetris-cell');
            this.gridElement.appendChild(cell);
        }
    },

    createNextGridDOM: function () {
        this.nextGridElement.innerHTML = '';
        for (let i = 0; i < 16; i++) {
            const cell = document.createElement('div');
            cell.classList.add('tetris-cell');
            this.nextGridElement.appendChild(cell);
        }
    },

    draw: function () {
        if (!this.gridElement) return;

        const cells = this.gridElement.children;
        if (!cells || cells.length === 0) return;

        // 1. Dessine la grille fixe (Background)
        for (let y = 0; y < this.ROWS; y++) {
            for (let x = 0; x < this.COLS; x++) {
                const index = y * this.COLS + x;
                const val = this.grid[y][x];

                // Reset la cellule
                cells[index].className = 'tetris-cell';

                if (val !== 0) {
                    cells[index].classList.add('tetris-block');
                    cells[index].classList.add(val); // => ex: tetris-I
                }
            }
        }

        // 2. Dessine la pièce courante pardessus
        if (this.currentPiece) {
            for (let y = 0; y < this.currentPiece.matrix.length; y++) {
                for (let x = 0; x < this.currentPiece.matrix[y].length; x++) {
                    if (this.currentPiece.matrix[y][x] !== 0) {
                        let mapX = this.currentPiece.x + x;
                        let mapY = this.currentPiece.y + y;
                        if (mapY >= 0 && mapY < this.ROWS && mapX >= 0 && mapX < this.COLS) {
                            const index = mapY * this.COLS + mapX;
                            cells[index].className = 'tetris-cell tetris-block ' + this.currentPiece.color;
                        }
                    }
                }
            }
        }
    },

    drawNextPiece: function () {
        if (!this.nextGridElement) return;
        const cells = this.nextGridElement.children;

        // Clear
        for (let i = 0; i < 16; i++) {
            cells[i].className = 'tetris-cell';
        }

        const matrix = this.nextPiece.matrix;

        // Centrer la mini piece 4x4
        const offset = matrix.length === 2 ? 1 : 0; // O piece

        for (let y = 0; y < matrix.length; y++) {
            for (let x = 0; x < matrix[y].length; x++) {
                if (matrix[y][x] !== 0) {
                    const index = (y + offset) * 4 + (x + offset);
                    cells[index].className = 'tetris-cell tetris-block ' + this.nextPiece.color;
                }
            }
        }
    },

    updateStatsUI: function () {
        window.arcade.updateGameTopbarStat('tetris-topbar', this.score);
        if (this.linesElement) this.linesElement.textContent = this.lines;
        if (this.levelElement) this.levelElement.textContent = this.level;
    },

    // ==========================================
    // LOOP & EVENTS
    // ==========================================

    gameLoop: function (time = 0) {
        if (this.isGameOver) return;

        const dt = time - this.lastTime;
        this.lastTime = time;
        this.dropCounter += dt;

        if (this.dropCounter > this.dropInterval) {
            this.movePiece(0, 1);
            this.dropCounter = 0;
        }

        this.draw();

        // Si non gameOver, appel du prochain frame
        if (!this.isGameOver) {
            this.animationId = requestAnimationFrame(this.gameLoopWrapper);
        }
    },

    handleKeyDown: function (e) {
        if (this.isGameOver) return;

        switch (e.key) {
            case 'ArrowLeft':
            case 'q':
            case 'a':
                this.movePiece(-1, 0);
                break;
            case 'ArrowRight':
            case 'd':
                this.movePiece(1, 0);
                break;
            case 'ArrowDown':
            case 's':
                this.movePiece(0, 1);
                break;
            case 'ArrowUp':
            case 'z':
            case 'w':
                this.rotatePiece();
                break;
            case ' ':
                this.hardDrop();
                break;
            default:
                return; // pour ne pas preventDefault
        }
        e.preventDefault();
    },

    triggerGameOver: function () {
        console.log("GAME OVER");
        cancelAnimationFrame(this.animationId);

        if (window.arcade.audio) {
            window.arcade.audio.pauseMusic();
            window.arcade.audio.playGameOver();
        }

        // Attribue XP basé sur lignes
        let xpGained = this.lines * 10;
        // Met la grille en mode Game Over (transparence rouge ou effacement visuel)
        if (this.gridElement) {
            const cells = this.gridElement.children;
            for (let i = 0; i < cells.length; i++) {
                // Si la cellule est de couleur, on la passe "morte"
                if (cells[i].classList.contains('tetris-block')) {
                    cells[i].style.filter = "grayscale(100%) opacity(0.5)";
                }
            }
        }

        setTimeout(() => {
            this.showGameOverModal();
        }, 500);
    },

    showGameOverModal: function () {
        const self = this;
        window.arcade.showGameOverModal({
            title: 'tetris',
            gameStatus: 'Game Over',
            icon: '💀',
            stats: [
                { label: 'Score final', value: this.score },
                { label: 'Lignes complétées', value: this.lines },
                { label: 'Niveau atteint', value: this.level }
            ],
            score: this.score,
            scoreType: 'points',
            onReplay: function () { self.start(); },
            onQuit: function () { window.arcade.renderHome(); }
        });
    }
};

// Injection d'initialiseur pour coller à l'architecture
window.initTetris = function (mountNode) {
    if (window.arcade.tetris.animationId) {
        window.arcade.tetris.cleanup();
    }

    // Nettoyer toute modale orpheline au chargement (sécurité)
    const existingStart = document.getElementById('game-start-modal');
    if (existingStart) existingStart.remove();
    const existingOver = document.getElementById('game-over-modal');
    if (existingOver) existingOver.remove();

    window.arcade.tetris.init(mountNode);
    window.arcade.tetris.showStartModal();
};
