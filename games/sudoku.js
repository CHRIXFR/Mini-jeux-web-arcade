/**
 * Sudoku Module - Version Avancée & Peaufinée
 */

window.initSudoku = function (container) {
    const sudoku = new SudokuGame(container);
    sudoku.showStartScreen();
}

class SudokuGame {
    constructor(container) {
        this.container = container;
        this.grid = Array(9).fill().map(() => Array(9).fill(0));
        this.solution = Array(9).fill().map(() => Array(9).fill(0));
        this.initial = Array(9).fill().map(() => Array(9).fill(false));
        this.notes = Array(9 * 9).fill().map(() => new Set());
        this.selectedCell = null;
        this.isNoteMode = false;
        this.difficulty = 'medium';
        this.timer = 0;
        this.timerInterval = null;
    }

    showStartScreen() {
        const self = this;
        this.renderLayout();
        window.arcade.showStartModal({
            title: 'Sudoku',
            icon: '🧩',
            description: 'Le classique jeu de chiffres avec notes et indices.',
            controls: [
                { icon: '🖱️', desktop: 'Cliquez sur une case puis un chiffre', mobile: 'Touchez une case puis un chiffre' },
                { icon: '📝', desktop: 'Mode Notes pour vos hypothèses', mobile: 'Mode Notes pour vos hypothèses' }
            ],
            difficulty: {
                options: [
                    { value: 'easy', label: 'Facile' },
                    { value: 'medium', label: 'Moyen' },
                    { value: 'hard', label: 'Difficile' }
                ],
                default: 'medium'
            },
            onStart: function (diff) {
                self.difficulty = diff || 'medium';
                const select = document.getElementById('diff-select');
                if (select) select.value = self.difficulty;
                self.newGame();
            },
            onQuit: function () { window.arcade.renderHome(); }
        });
    }

    start() {
        this.renderLayout();
        this.newGame();
    }

    newGame() {
        this.generatePuzzle();
        this.timer = 0;
        clearInterval(this.timerInterval);
        this.timerInterval = setInterval(() => {
            this.timer++;
            this.updateTimerDisplay();
        }, 1000);
        this.renderGrid();
        this.updateNumberStatus();
    }

    generatePuzzle() {
        this.fillGrid(this.solution);
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                this.grid[i][j] = this.solution[i][j];
            }
        }
        const attempts = { 'easy': 30, 'medium': 45, 'hard': 55 }[this.difficulty];
        let removed = 0;
        while (removed < attempts) {
            let row = Math.floor(Math.random() * 9);
            let col = Math.floor(Math.random() * 9);
            if (this.grid[row][col] !== 0) {
                this.grid[row][col] = 0;
                removed++;
            }
        }
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                this.initial[i][j] = (this.grid[i][j] !== 0);
            }
        }
    }

    fillGrid(grid) {
        const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        for (let i = 0; i < 81; i++) {
            let row = Math.floor(i / 9);
            let col = i % 9;
            if (grid[row][col] === 0) {
                this.shuffle(numbers);
                for (let num of numbers) {
                    if (this.isSafe(grid, row, col, num)) {
                        grid[row][col] = num;
                        if (this.checkGrid(grid)) return true;
                        if (this.fillGrid(grid)) return true;
                    }
                }
                grid[row][col] = 0;
                return false;
            }
        }
        return true;
    }

    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    isSafe(grid, row, col, num) {
        for (let i = 0; i < 9; i++) {
            if (grid[row][i] === num || grid[i][col] === num) return false;
        }
        let startRow = Math.floor(row / 3) * 3;
        let startCol = Math.floor(col / 3) * 3;
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                if (grid[startRow + i][startCol + j] === num) return false;
            }
        }
        return true;
    }

    checkGrid(grid) {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (grid[row][col] === 0) return false;
            }
        }
        return true;
    }

    renderLayout() {
        this.container.innerHTML = `
            <div class="sudoku-container">
                <h2>🧩 Sudoku</h2>
                <div class="sudoku-header">
                    <div id="sudoku-timer">00:00</div>
                    <div class="difficulty-picker">
                        <label for="diff-select" class="sr-only">Difficulté</label>
                        <select id="diff-select">
                            <option value="easy">Facile</option>
                            <option value="medium" selected>Moyen</option>
                            <option value="hard">Difficile</option>
                        </select>
                    </div>
                </div>
                <div id="sudoku-grid" class="grid-9x9"></div>
                <div class="sudoku-controls">
                    <button id="btn-note" class="control-btn">📝 Notes: OFF</button>
                    <button id="btn-erase" class="control-btn">🗑️ Effacer</button>
                    <button id="btn-hint" class="control-btn pulse-hint">💡 Indice</button>
                </div>
                <div class="number-pad">
                    ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `<button class="num-btn" data-num="${n}">${n}</button>`).join('')}
                </div>
            </div>
        `;

        document.getElementById('btn-note').addEventListener('click', (e) => {
            this.isNoteMode = !this.isNoteMode;
            e.target.textContent = `📝 Notes: ${this.isNoteMode ? 'ON' : 'OFF'}`;
            e.target.classList.toggle('active', this.isNoteMode);
        });

        document.getElementById('diff-select').addEventListener('change', (e) => {
            this.difficulty = e.target.value;
            this.newGame();
        });

        document.querySelectorAll('.num-btn').forEach(btn => {
            btn.addEventListener('click', () => this.handleNumberInput(parseInt(btn.dataset.num)));
        });

        document.getElementById('btn-erase').addEventListener('click', () => this.handleNumberInput(0));

        document.getElementById('btn-hint').addEventListener('click', () => this.useHint());
    }

    renderGrid() {
        const gridEl = document.getElementById('sudoku-grid');
        gridEl.innerHTML = '';
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                const cell = document.createElement('div');
                cell.className = 'grid-cell';
                cell.tabIndex = 0;
                cell.setAttribute('role', 'gridcell');
                cell.setAttribute('aria-label', `Case ligne ${r + 1} colonne ${c + 1}`);
                if (this.initial[r][c]) {
                    cell.classList.add('fixed');
                    cell.setAttribute('aria-readonly', 'true');
                }
                if ((Math.floor(r / 3) + Math.floor(c / 3)) % 2 === 0) cell.classList.add('alt-block');
                cell.dataset.row = r;
                cell.dataset.col = c;
                this.updateCellDisplay(cell, r, c);
                cell.addEventListener('click', () => this.selectCell(cell, r, c));
                cell.addEventListener('keydown', (e) => this.handleKeyDown(e, r, c));
                gridEl.appendChild(cell);
            }
        }
    }

    updateCellDisplay(cellEl, r, c) {
        const val = this.grid[r][c];
        cellEl.innerHTML = '';
        if (val !== 0) {
            cellEl.textContent = val;
            if (val !== this.solution[r][c] && !this.initial[r][c]) {
                cellEl.classList.add('error');
            } else {
                cellEl.classList.remove('error');
            }
        } else {
            const notes = this.notes[r * 9 + c];
            if (notes.size > 0) {
                const notesGrid = document.createElement('div');
                notesGrid.className = 'notes-grid';
                for (let i = 1; i <= 9; i++) {
                    const n = document.createElement('span');
                    n.textContent = notes.has(i) ? i : '';
                    notesGrid.appendChild(n);
                }
                cellEl.appendChild(notesGrid);
            }
        }
    }

    handleKeyDown(e, r, c) {
        let nr = r, nc = c;
        if (e.key === 'ArrowUp') nr = Math.max(0, r - 1);
        else if (e.key === 'ArrowDown') nr = Math.min(8, r + 1);
        else if (e.key === 'ArrowLeft') nc = Math.max(0, c - 1);
        else if (e.key === 'ArrowRight') nc = Math.min(8, c + 1);
        else if (e.key >= '1' && e.key <= '9') {
            this.handleNumberInput(parseInt(e.key));
            return;
        } else if (e.key === 'Backspace' || e.key === 'Delete') {
            this.handleNumberInput(0);
            return;
        } else return;

        e.preventDefault();
        const nextCell = document.querySelector(`.grid-cell[data-row="${nr}"][data-col="${nc}"]`);
        if (nextCell) {
            nextCell.focus();
            this.selectCell(nextCell, nr, nc);
        }
    }

    selectCell(cellEl, r, c) {
        document.querySelectorAll('.grid-cell').forEach(el => el.classList.remove('selected', 'highlight', 'same-num'));
        cellEl.classList.add('selected');
        this.selectedCell = { el: cellEl, r, c };
        const selectedVal = this.grid[r][c];
        document.querySelectorAll('.grid-cell').forEach(el => {
            const er = parseInt(el.dataset.row);
            const ec = parseInt(el.dataset.col);
            const evalue = this.grid[er][ec];
            if (er === r || ec === c || (Math.floor(er / 3) === Math.floor(r / 3) && Math.floor(ec / 3) === Math.floor(c / 3))) {
                el.classList.add('highlight');
            }
            if (selectedVal !== 0 && evalue === selectedVal) {
                el.classList.add('same-num');
            }
        });
    }

    handleNumberInput(num) {
        if (!this.selectedCell || this.initial[this.selectedCell.r][this.selectedCell.col]) return;
        const { r, c, el } = this.selectedCell;
        if (this.isNoteMode && num !== 0) {
            const notes = this.notes[r * 9 + c];
            if (notes.has(num)) notes.delete(num); else notes.add(num);
            this.grid[r][c] = 0;
        } else {
            this.grid[r][c] = num;
            this.notes[r * 9 + c].clear();
        }
        this.updateCellDisplay(el, r, c);
        this.updateNumberStatus();
        this.checkWin();
    }

    updateNumberStatus() {
        // Compter les occurrences de chaque chiffre
        const counts = Array(10).fill(0);
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                const val = this.grid[r][c];
                if (val !== 0 && val === this.solution[r][c]) {
                    counts[val]++;
                }
            }
        }

        document.querySelectorAll('.num-btn').forEach(btn => {
            const num = parseInt(btn.dataset.num);
            if (counts[num] === 9) {
                btn.classList.add('completed');
            } else {
                btn.classList.remove('completed');
            }
        });
    }

    useHint() {
        const costs = { 'easy': 10, 'medium': 25, 'hard': 50 };
        const cost = costs[this.difficulty];

        // Pas de système d'XP, le hint coûte juste du temps (+30s de malus par exemple)
        this.timer += 30;

        // Trouver une case vide ou fausse
        const possibleHints = [];
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                if (this.grid[r][c] !== this.solution[r][c]) {
                    possibleHints.push({ r, c });
                }
            }
        }

        if (possibleHints.length > 0) {
            const hint = possibleHints[Math.floor(Math.random() * possibleHints.length)];
            this.grid[hint.r][hint.c] = this.solution[hint.r][hint.c];
            this.initial[hint.r][hint.c] = true; // Fixé pour l'indice
            this.renderGrid();
            this.updateNumberStatus();
            this.checkWin();
            window.arcade.showToast(`Indice utilisé : +30s de malus`);
        }
    }

    updateTimerDisplay() {
        const min = Math.floor(this.timer / 60).toString().padStart(2, '0');
        const sec = (this.timer % 60).toString().padStart(2, '0');
        const el = document.getElementById('sudoku-timer');
        if (el) el.textContent = `${min}:${sec}`;
    }

    checkWin() {
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                if (this.grid[r][c] !== this.solution[r][c]) return;
            }
        }
        clearInterval(this.timerInterval);
        this.showWinModal();
    }

    showWinModal() {
        const min = Math.floor(this.timer / 60);
        const sec = this.timer % 60;
        const self = this;

        window.arcade.showGameOverModal({
            title: 'sudoku',
            gameStatus: 'Félicitations !',
            icon: '🎉',
            stats: [
                { label: 'Temps', value: `${min}m ${sec}s` },
                { label: 'Difficulté', value: { 'easy': 'Facile', 'medium': 'Moyen', 'hard': 'Difficile' }[this.difficulty] }
            ],
            score: this.timer,
            scoreType: 'time',
            onReplay: function () { self.newGame(); },
            onQuit: function () { window.arcade.renderHome(); }
        });
    }
}
