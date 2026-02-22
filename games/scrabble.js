/**
 * Scrabble Solo - Modèle Arcade
 */

window.initScrabble = function (container) {
    const game = new ScrabbleGame(container);
    game.start();
};

class ScrabbleGame {
    constructor(container) {
        this.container = container;
        this.boardSize = 15;
        this.board = Array(15).fill().map(() => Array(15).fill(null));
        this.bag = [];
        this.playerRack = [];
        this.aiRack = [];
        this.playerScore = 0;
        this.aiScore = 0;
        this.selectedTileIndex = null;
        this.currentTurn = 'player';
        this.tempMoves = []; // Tiles placed during current turn {r, c, letter}

        this.letterData = {
            'A': { v: 1, c: 9 }, 'B': { v: 3, c: 2 }, 'C': { v: 3, c: 2 }, 'D': { v: 2, c: 3 },
            'E': { v: 1, c: 15 }, 'F': { v: 4, c: 2 }, 'G': { v: 2, c: 2 }, 'H': { v: 4, c: 2 },
            'I': { v: 1, c: 8 }, 'J': { v: 8, c: 1 }, 'K': { v: 10, c: 1 }, 'L': { v: 1, c: 5 },
            'M': { v: 2, c: 3 }, 'N': { v: 1, c: 6 }, 'O': { v: 1, c: 6 }, 'P': { v: 3, c: 2 },
            'Q': { v: 8, c: 1 }, 'R': { v: 1, c: 6 }, 'S': { v: 1, c: 6 }, 'T': { v: 1, c: 6 },
            'U': { v: 1, c: 6 }, 'V': { v: 4, c: 2 }, 'W': { v: 10, c: 1 }, 'X': { v: 10, c: 1 },
            'Y': { v: 10, c: 1 }, 'Z': { v: 10, c: 1 }, '?': { v: 0, c: 2 }
        };

        this.bonuses = this.initBonuses();
    }

    initBonuses() {
        const b = {};
        const tw = [[0, 0], [0, 7], [0, 14], [7, 0], [7, 14], [14, 0], [14, 7], [14, 14]];
        const dw = [[1, 1], [2, 2], [3, 3], [4, 4], [1, 13], [2, 12], [3, 11], [4, 10], [13, 1], [12, 2], [11, 3], [10, 4], [13, 13], [12, 12], [11, 11], [10, 10], [7, 7]];
        const tl = [[1, 5], [1, 9], [5, 1], [5, 5], [5, 9], [5, 13], [9, 1], [9, 5], [9, 9], [9, 13], [13, 5], [13, 9]];
        const dl = [[0, 3], [0, 11], [2, 6], [2, 8], [3, 0], [3, 7], [3, 14], [6, 2], [6, 6], [6, 8], [6, 12], [7, 3], [7, 11], [8, 2], [8, 6], [8, 8], [8, 12], [11, 0], [11, 7], [11, 14], [12, 6], [12, 8], [14, 3], [14, 11]];

        tw.forEach(p => b[`${p[0]},${p[1]}`] = 'tw');
        dw.forEach(p => b[`${p[0]},${p[1]}`] = 'dw');
        tl.forEach(p => b[`${p[0]},${p[1]}`] = 'tl');
        dl.forEach(p => b[`${p[0]},${p[1]}`] = 'dl');
        b['7,7'] = 'star';
        return b;
    }

    start() {
        this.score = 0;
        this.initBag();
        this.fillPlayerRack();
        this.fillAiRack();
        this.renderLayout();
        this.renderBoard();
        this.renderRack();
    }

    initBag() {
        this.bag = [];
        for (const [lettre, data] of Object.entries(this.letterData)) {
            for (let i = 0; i < data.c; i++) {
                this.bag.push(lettre);
            }
        }
        this.shuffle(this.bag);
    }

    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    fillPlayerRack() {
        while (this.playerRack.length < 7 && this.bag.length > 0) {
            this.playerRack.push(this.bag.pop());
        }
    }

    fillAiRack() {
        while (this.aiRack.length < 7 && this.bag.length > 0) {
            this.aiRack.push(this.bag.pop());
        }
    }

    renderLayout() {
        this.container.innerHTML = `
            <div class="scr-game-container">
                <div class="scr-header">
                    <div class="scr-score-box">
                        <span class="scr-score-label">Vous</span>
                        <span id="scr-score-player" class="scr-score-value">0</span>
                    </div>
                    <div class="scr-turn-info">
                        <span id="scr-turn-msg">Votre tour</span>
                    </div>
                    <div class="scr-score-box">
                        <span class="scr-score-label">IA</span>
                        <span id="scr-score-ai" class="scr-score-value">0</span>
                    </div>
                </div>

                <div id="scr-board" class="scr-board"></div>

                <div id="scr-rack" class="scr-rack"></div>

                <div class="scr-controls">
                    <button id="scr-btn-play" class="btn-primary">Valider</button>
                    <button id="scr-btn-cancel" class="btn-secondary">Annuler</button>
                    <button id="scr-btn-shuffle" class="btn-secondary">Mélanger</button>
                    <button id="scr-btn-pass" class="btn-secondary">Passer</button>
                </div>
            </div>
        `;

        document.getElementById('scr-btn-play').onclick = () => this.validateMove();
        document.getElementById('scr-btn-cancel').onclick = () => this.cancelTempMove();
        document.getElementById('scr-btn-shuffle').onclick = () => this.shuffleRack();
        document.getElementById('scr-btn-pass').onclick = () => this.passTurn();
    }

    renderBoard() {
        const boardEl = document.getElementById('scr-board');
        boardEl.innerHTML = '';
        for (let r = 0; r < 15; r++) {
            for (let c = 0; c < 15; c++) {
                const cell = document.createElement('div');
                const bonus = this.bonuses[`${r},${c}`];
                cell.className = 'scr-cell' + (bonus ? ` ${bonus}` : '');

                // Content priority: Logic Board > Temp Move > Bonus Text
                const tile = this.board[r][c];
                const temp = this.tempMoves.find(m => m.r === r && m.c === c);

                if (tile || temp) {
                    const letter = tile || temp.letter;
                    cell.innerHTML = `
                        <div class="scr-tile">
                            ${letter}
                            <span class="scr-tile-val">${this.letterData[letter].v}</span>
                        </div>
                    `;
                } else if (bonus) {
                    cell.textContent = bonus.toUpperCase();
                    if (bonus === 'star') cell.textContent = '★';
                }

                cell.onclick = () => this.handleCellClick(r, c);
                boardEl.appendChild(cell);
            }
        }
    }

    renderRack() {
        const rackEl = document.getElementById('scr-rack');
        rackEl.innerHTML = '';
        this.playerRack.forEach((letter, index) => {
            const tile = document.createElement('div');
            tile.className = 'scr-tile' + (this.selectedTileIndex === index ? ' selected' : '');
            tile.innerHTML = `
                ${letter}
                <span class="scr-tile-val">${this.letterData[letter].v}</span>
            `;
            tile.onclick = () => this.selectTile(index);
            rackEl.appendChild(tile);
        });
    }

    selectTile(index) {
        if (this.currentTurn !== 'player') return;
        this.selectedTileIndex = (this.selectedTileIndex === index) ? null : index;
        this.renderRack();
    }

    handleCellClick(r, c) {
        if (this.currentTurn !== 'player') return;

        // If clicking a cell where we just placed a temp tile, take it back
        const tempIdx = this.tempMoves.findIndex(m => m.r === r && m.c === c);
        if (tempIdx !== -1) {
            const moved = this.tempMoves.splice(tempIdx, 1)[0];
            this.playerRack.push(moved.letter);
            this.renderBoard();
            this.renderRack();
            return;
        }

        // Place selected tile
        if (this.selectedTileIndex !== null && !this.board[r][c]) {
            const letter = this.playerRack.splice(this.selectedTileIndex, 1)[0];
            this.tempMoves.push({ r, c, letter });
            this.selectedTileIndex = null;
            this.renderBoard();
            this.renderRack();
        }
    }

    shuffleRack() {
        this.shuffle(this.playerRack);
        this.renderRack();
    }

    cancelTempMove() {
        this.tempMoves.forEach(m => this.playerRack.push(m.letter));
        this.tempMoves = [];
        this.renderBoard();
        this.renderRack();
    }

    passTurn() {
        if (this.tempMoves.length > 0) this.cancelTempMove();
        this.switchTurn();
    }

    validateMove() {
        if (this.tempMoves.length === 0) {
            window.arcade.showToast('Placez au moins une lettre !');
            return;
        }

        // Basic check: at least one word formed, connected to others or center star
        // For this MVP, we simplify:
        // 1. All temp tiles on same row or column
        const rows = new Set(this.tempMoves.map(m => m.r));
        const cols = new Set(this.tempMoves.map(m => m.c));

        if (rows.size > 1 && cols.size > 1) {
            window.arcade.showToast('Les lettres doivent être alignées !');
            return;
        }

        // Logic for word validation and scoring goes here...
        // For MVP: Apply moves and score based on letter values
        let turnScore = 0;
        this.tempMoves.forEach(m => {
            this.board[m.r][m.c] = m.letter;
            turnScore += this.letterData[m.letter].v;
        });

        this.playerScore += turnScore;
        this.tempMoves = [];
        this.fillPlayerRack();
        this.updateStats();
        this.renderBoard();
        this.renderRack();

        window.arcade.showToast(`+${turnScore} points !`);
        this.switchTurn();
    }

    updateStats() {
        document.getElementById('scr-score-player').textContent = this.playerScore;
        document.getElementById('scr-score-ai').textContent = this.aiScore;
    }

    switchTurn() {
        this.currentTurn = (this.currentTurn === 'player') ? 'ai' : 'player';
        const msg = document.getElementById('scr-turn-msg');
        if (this.currentTurn === 'ai') {
            msg.textContent = "L'IA réfléchit...";
            setTimeout(() => this.aiPlay(), 1500);
        } else {
            msg.textContent = "Votre tour";
        }
    }

    aiPlay() {
        // AI simplified logic: finds an empty spot and puts its first letters
        // Real AI would be too complex for this script, let's simulate a basic move
        let placed = false;
        let aiTurnScore = 0;

        // Find center star if empty
        if (!this.board[7][7]) {
            const letter = this.aiRack.pop();
            this.board[7][7] = letter;
            aiTurnScore += this.letterData[letter].v;
            placed = true;
        } else {
            // Find adjacent to existing
            for (let r = 0; r < 15 && !placed; r++) {
                for (let c = 0; c < 15 && !placed; c++) {
                    if (this.board[r][c]) {
                        // Check neighbors
                        const neighbors = [[r + 1, c], [r - 1, c], [r, c + 1], [r, c - 1]];
                        for (let [nr, nc] of neighbors) {
                            if (nr >= 0 && nr < 15 && nc >= 0 && nc < 15 && !this.board[nr][nc]) {
                                const letter = this.aiRack.pop();
                                this.board[nr][nc] = letter;
                                aiTurnScore += this.letterData[letter].v;
                                placed = true;
                                break;
                            }
                        }
                    }
                }
            }
        }

        if (placed) {
            this.aiScore += aiTurnScore;
            this.fillAiRack();
            this.updateStats();
            this.renderBoard();
            window.arcade.showToast(`L'IA joue pour ${aiTurnScore} pts`);
        } else {
            window.arcade.showToast(`L'IA a passé son tour`);
        }

        this.switchTurn();
    }
}
