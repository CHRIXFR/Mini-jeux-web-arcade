/**
 * Jeu Match-3
 * Logique avec Joyaux Spéciaux et Combos
 */

window.initMatch3 = function (container) {
    const game = new Match3Game(container);
    game.start();
};

class Match3Game {
    constructor(container) {
        this.container = container;
        this.gridSize = 8;
        this.gemTypes = [
            { id: 0, icon: '💎' },
            { id: 1, icon: '🍎' },
            { id: 2, icon: '⭐' },
            { id: 3, icon: '🍀' },
            { id: 4, icon: '🔥' },
            { id: 5, icon: '❄️' }
        ];
        this.grid = []; // Stocke { typeId, specialType }
        this.score = 0;
        this.moves = 20;
        this.selectedCell = null; // {r, c}
        this.isAnimating = false;
        this.comboStats = { line: 0, cross: 0, color: 0 };

        // Types Spéciaux :
        // null : normal
        // 'horizontal' : nettoie la ligne (combo 4)
        // 'vertical' : nettoie la colonne (combo 4)
        // 'cross' : nettoie ligne & colonne (combo 5)
        // 'color' : nettoie tous les joyaux de la même couleur (combo 6)
        // 'omega' : nettoie toute la grille (combinaison de 2 joyaux couleur)
    }

    start() {
        this.renderLayout();
        this.newGame();
    }

    newGame() {
        this.score = 0;
        this.moves = 20;
        this.comboStats = { line: 0, cross: 0, color: 0 };
        this.updateStats();
        this.generateInitialGrid();
        this.renderGrid();
    }

    generateInitialGrid() {
        this.grid = Array(this.gridSize).fill().map(() => Array(this.gridSize).fill(null));

        for (let r = 0; r < this.gridSize; r++) {
            for (let c = 0; c < this.gridSize; c++) {
                let validIds = this.gemTypes.map(t => t.id);

                if (c >= 2 && this.grid[r][c - 1]?.typeId === this.grid[r][c - 2]?.typeId) {
                    validIds = validIds.filter(id => id !== this.grid[r][c - 1].typeId);
                }

                if (r >= 2 && this.grid[r - 1][c]?.typeId === this.grid[r - 2][c]?.typeId) {
                    validIds = validIds.filter(id => id !== this.grid[r - 1][c].typeId);
                }

                const typeId = validIds[Math.floor(Math.random() * validIds.length)];
                this.grid[r][c] = { typeId, special: null };
            }
        }
    }

    renderLayout() {
        this.container.innerHTML = `
            <div class="jb-game-container">
                <div class="jb-header">
                    <div class="jb-stats">
                        <div class="jb-stat-item">
                            <span class="jb-stat-label">Score</span>
                            <span id="jb-score" class="jb-stat-value">0</span>
                        </div>
                        <div class="jb-stat-item">
                            <span class="jb-stat-label">Coups</span>
                            <span id="jb-moves" class="jb-stat-value">20</span>
                        </div>
                        <div class="stats-divider"></div>
                        <div class="jb-combos-mini">
                            <div class="combo-count" title="Lignes/Colonnes">⚡ <span id="count-line">0</span></div>
                            <div class="combo-count" title="Explosion Croix">✴️ <span id="count-cross">0</span></div>
                            <div class="combo-count" title="Nettoyage Couleur">🌈 <span id="count-color">0</span></div>
                        </div>
                    </div>
                </div>
                
                <div id="jb-grid" class="jb-grid"></div>
                
                <div class="jb-controls">
                    <button id="jb-btn-new" class="btn-secondary">Recommencer</button>
                </div>
            </div>
        `;

        document.getElementById('jb-btn-new').onclick = () => this.newGame();
    }

    renderGrid() {
        const gridEl = document.getElementById('jb-grid');
        gridEl.innerHTML = '';
        gridEl.style.gridTemplateColumns = `repeat(${this.gridSize}, 1fr)`;
        gridEl.style.gridTemplateRows = `repeat(${this.gridSize}, 1fr)`;

        for (let r = 0; r < this.gridSize; r++) {
            for (let c = 0; c < this.gridSize; c++) {
                const cell = document.createElement('div');
                cell.className = 'jb-cell';
                const gemData = this.grid[r][c];

                if (gemData) {
                    const gemType = this.gemTypes.find(t => t.id === gemData.typeId);
                    let specialClass = '';
                    let specialOverlay = '';

                    if (gemData.special) {
                        specialClass = ` is-${gemData.special}`;
                        if (gemData.special === 'horizontal') specialOverlay = '<div class="special-fx h-line"></div>';
                        if (gemData.special === 'vertical') specialOverlay = '<div class="special-fx v-line"></div>';
                        if (gemData.special === 'cross') specialOverlay = '<div class="special-fx cross-fx"></div>';
                        if (gemData.special === 'color') specialOverlay = '<div class="special-fx color-fx">🌈</div>';
                    }

                    cell.innerHTML = `
                        <span class="jb-gem${specialClass}">${gemType.icon}</span>
                        ${specialOverlay}
                    `;
                }

                cell.dataset.r = r;
                cell.dataset.c = c;
                cell.onclick = () => this.handleCellClick(r, c);
                gridEl.appendChild(cell);
            }
        }
        this.updateSelectedUI();
    }

    handleCellClick(r, c) {
        if (this.isAnimating || this.moves <= 0) return;

        if (!this.selectedCell) {
            this.selectedCell = { r, c };
            this.updateSelectedUI();
        } else {
            const r2 = this.selectedCell.r;
            const c2 = this.selectedCell.c;
            const isAdjacent = (Math.abs(r - r2) === 1 && c === c2) || (Math.abs(c - c2) === 1 && r === r2);

            if (isAdjacent) {
                this.swapGems(r, c, r2, c2);
            } else {
                this.selectedCell = { r, c };
                this.updateSelectedUI();
            }
        }
    }

    async swapGems(r1, c1, r2, c2) {
        this.isAnimating = true;
        this.selectedCell = null;
        this.updateSelectedUI();

        const g1 = this.grid[r1][c1];
        const g2 = this.grid[r2][c2];

        // Combo Omega : Arc-en-ciel + Arc-en-ciel
        if (g1.special === 'color' && g2.special === 'color') {
            this.moves--;
            this.updateStats();
            await this.clearGridOmega();
            this.isAnimating = false;
            return;
        }

        // Nettoyage de couleur : Arc-en-ciel + N'importe quoi
        if (g1.special === 'color' || g2.special === 'color') {
            this.moves--;
            this.updateStats();
            const colorToClear = (g1.special === 'color') ? g2.typeId : g1.typeId;
            const rainbowPos = (g1.special === 'color') ? { r: r1, c: c1 } : { r: r2, c: c2 };
            await this.clearColor(colorToClear, rainbowPos);
            this.isAnimating = false;
            return;
        }

        // Échange normal
        this.grid[r1][c1] = g2;
        this.grid[r2][c2] = g1;
        this.renderGrid();
        await new Promise(res => setTimeout(res, 250));

        const matches = this.findMatches();
        if (matches.length > 0) {
            this.moves--;
            this.updateStats();
            await this.handleMatches(matches);
        } else {
            // Annuler l'échange
            this.grid[r1][c1] = g1;
            this.grid[r2][c2] = g2;
            this.renderGrid();
        }

        this.isAnimating = false;
        this.checkGameOver();
    }

    findMatches() {
        const matches = [];
        const horizontalMatches = [];
        const verticalMatches = [];

        // Trouver les séquences horizontales
        for (let r = 0; r < this.gridSize; r++) {
            let count = 1;
            for (let c = 1; c <= this.gridSize; c++) {
                if (c < this.gridSize && this.grid[r][c]?.typeId === this.grid[r][c - 1]?.typeId) {
                    count++;
                } else {
                    if (count >= 3) {
                        horizontalMatches.push({ r, cStart: c - count, count });
                    }
                    count = 1;
                }
            }
        }

        // Trouver les séquences verticales
        for (let c = 0; c < this.gridSize; c++) {
            let count = 1;
            for (let r = 1; r <= this.gridSize; r++) {
                if (r < this.gridSize && this.grid[r][c]?.typeId === this.grid[r - 1][c]?.typeId) {
                    count++;
                } else {
                    if (count >= 3) {
                        verticalMatches.push({ c, rStart: r - count, count });
                    }
                    count = 1;
                }
            }
        }

        // Mappage des coordonnées et identification de la création de joyaux spéciaux
        horizontalMatches.forEach(m => {
            const cells = [];
            for (let i = 0; i < m.count; i++) cells.push({ r: m.r, c: m.cStart + i });

            let special = null;
            if (m.count === 4) special = 'horizontal';
            else if (m.count === 5) special = 'cross';
            else if (m.count >= 6) special = 'color';

            matches.push({ cells, typeId: this.grid[m.r][m.cStart].typeId, special, creationPos: cells[0] });
        });

        verticalMatches.forEach(m => {
            const cells = [];
            for (let i = 0; i < m.count; i++) cells.push({ r: m.rStart + i, c: m.c });

            let special = null;
            if (m.count === 4) special = 'vertical';
            else if (m.count === 5) special = 'cross';
            else if (m.count >= 6) special = 'color';

            matches.push({ cells, typeId: this.grid[m.rStart][m.c].typeId, special, creationPos: cells[0] });
        });

        return matches;
    }

    async handleMatches(matchGroups) {
        while (matchGroups.length > 0) {
            const cellsToClear = new Set();
            const specialsToCreate = [];

            matchGroups.forEach(group => {
                group.cells.forEach(cell => cellsToClear.add(`${cell.r},${cell.c}`));
                if (group.special) {
                    specialsToCreate.push({ pos: group.creationPos, typeId: group.typeId, special: group.special });
                }
            });

            // Gérer les effets de destruction des joyaux spéciaux
            const finalBlast = this.calculateBlasts(cellsToClear);

            // Animation : Secouer la grille
            document.getElementById('jb-grid').classList.add('shake');
            setTimeout(() => document.getElementById('jb-grid').classList.remove('shake'), 300);

            // Exécuter la destruction
            finalBlast.forEach(posKey => {
                const [r, c] = posKey.split(',').map(Number);
                if (this.grid[r][c]) {
                    this.score += 15;
                    this.grid[r][c] = null;
                }
            });

            // Créer de nouveaux joyaux spéciaux
            specialsToCreate.forEach(s => {
                this.grid[s.pos.r][s.pos.c] = { typeId: s.typeId, special: s.special };
                this.score += 50;

                // Stats
                if (s.special === 'horizontal' || s.special === 'vertical') this.comboStats.line++;
                if (s.special === 'cross') this.comboStats.cross++;
                if (s.special === 'color') this.comboStats.color++;
            });

            this.updateStats();
            this.renderGrid();
            await new Promise(res => setTimeout(res, 500)); // Ralenti

            this.dropGems();
            this.renderGrid();
            await new Promise(res => setTimeout(res, 400)); // Ralenti

            this.fillEmpty();
            this.renderGrid();
            await new Promise(res => setTimeout(res, 400)); // Ralenti

            matchGroups = this.findMatches();
            if (matchGroups.length > 0) window.arcade.showToast("Combo !");
        }
    }

    calculateBlasts(initialCells) {
        const toBlast = new Set(initialCells);
        let expanded = true;

        while (expanded) {
            expanded = false;
            const currentSize = toBlast.size;

            for (const posKey of toBlast) {
                const [r, c] = posKey.split(',').map(Number);
                const gem = this.grid[r][c];

                if (gem?.special) {
                    if (gem.special === 'horizontal' || gem.special === 'cross' || gem.special === 'color') {
                        for (let i = 0; i < this.gridSize; i++) {
                            const key = `${r},${i}`;
                            if (!toBlast.has(key)) { toBlast.add(key); expanded = true; }
                        }
                    }
                    if (gem.special === 'vertical' || gem.special === 'cross' || gem.special === 'color') {
                        for (let i = 0; i < this.gridSize; i++) {
                            const key = `${i},${c}`;
                            if (!toBlast.has(key)) { toBlast.add(key); expanded = true; }
                        }
                    }
                }
            }
        }
        return toBlast;
    }

    async clearColor(typeId, rainbowPos) {
        this.grid[rainbowPos.r][rainbowPos.c] = null;
        for (let r = 0; r < this.gridSize; r++) {
            for (let c = 0; c < this.gridSize; c++) {
                if (this.grid[r][c]?.typeId === typeId) {
                    this.grid[r][c] = null;
                    this.score += 20;
                }
            }
        }
        this.updateStats();
        this.renderGrid();
        await new Promise(res => setTimeout(res, 400));
        await this.handleMatches([]); // Déclenche le remplissage
    }

    async clearGridOmega() {
        window.arcade.showToast("ULTRA COMBO !");
        for (let r = 0; r < this.gridSize; r++) {
            for (let c = 0; c < this.gridSize; c++) {
                this.grid[r][c] = null;
                this.score += 30;
            }
        }
        this.updateStats();
        this.renderGrid();
        await new Promise(res => setTimeout(res, 600));
        await this.handleMatches([]); // Triggers refilling
    }

    dropGems() {
        for (let c = 0; c < this.gridSize; c++) {
            let emptyIdx = this.gridSize - 1;
            for (let r = this.gridSize - 1; r >= 0; r--) {
                if (this.grid[r][c]) {
                    const gem = this.grid[r][c];
                    this.grid[r][c] = null;
                    this.grid[emptyIdx][c] = gem;
                    emptyIdx--;
                }
            }
        }
    }

    fillEmpty() {
        for (let r = 0; r < this.gridSize; r++) {
            for (let c = 0; c < this.gridSize; c++) {
                if (!this.grid[r][c]) {
                    const typeId = Math.floor(Math.random() * this.gemTypes.length);
                    this.grid[r][c] = { typeId, special: null };
                }
            }
        }
    }

    updateStats() {
        const s = document.getElementById('jb-score');
        const m = document.getElementById('jb-moves');
        if (s) s.textContent = this.score;
        if (m) m.textContent = this.moves;

        const cl = document.getElementById('count-line');
        const cr = document.getElementById('count-cross');
        const cc = document.getElementById('count-color');
        if (cl) cl.textContent = this.comboStats.line;
        if (cr) cr.textContent = this.comboStats.cross;
        if (cc) cc.textContent = this.comboStats.color;
    }

    updateSelectedUI() {
        document.querySelectorAll('.jb-cell').forEach(el => el.classList.remove('selected'));
        if (this.selectedCell) {
            const el = document.querySelector(`.jb-cell[data-r="${this.selectedCell.r}"][data-c="${this.selectedCell.c}"]`);
            if (el) el.classList.add('selected');
        }
    }

    checkGameOver() {
        if (this.moves <= 0) {
            const xp = Math.floor(this.score / 15);
            window.arcade.addXP(xp);
            this.showGameOverModal(xp);
        }
    }

    showGameOverModal(xp) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <h2>Fin !</h2>
                <div class="jb-stat-value" style="font-size: 3rem">${this.score}</div>
                <div class="xp-bonus">+${xp} XP</div>
                <div class="modal-actions">
                    <button id="btn-restart-jb" class="btn-primary">Rejouer</button>
                    <button id="btn-quit-jb" class="btn-secondary">Menu Principal</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        document.getElementById('btn-restart-jb').onclick = () => { modal.remove(); this.newGame(); };
        document.getElementById('btn-quit-jb').onclick = () => { modal.remove(); window.arcade.renderHome(); };
    }
}
