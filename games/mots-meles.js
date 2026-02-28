/**
 * Mots Mêlés Module
 */

window.initMotsMeles = function (container) {
    const game = new WordSearchGame(container);
    game.start();
}

class WordSearchGame {
    constructor(container) {
        this.container = container;
        this.difficulty = 'medium';
        this.gridSize = 10;
        this.wordsToFind = [];
        this.wordCount = 9;
        this.foundWords = new Set();
        this.grid = [];
        this.isSelecting = false;
        this.selectionStart = null; // {r, c}
        this.selectionEnd = null;   // {r, c}

        this.wordList = [
            "AVION", "BALLON", "SOLEIL", "BATEAU", "CHAT", "CHIEN", "POMME", "FRAISE",
            "MANGER", "DORMIR", "JOUER", "ECOLE", "LIVRE", "CRAYON", "FORÊT", "MER",
            "MONTAGNE", "FLEUVE", "ROUGE", "BLEU", "VERT", "JAUNE", "AMIS", "PAIN",
            "ESPACE", "ETOILE", "PLANETE", "FUSEE", "ORDINATEUR", "SOURIS", "CLAVIER", "ECRAN",
            "MUSIQUE", "GUITARE", "PIANO", "DANSE", "CHÂTEAU", "ROI", "REINE", "CHEVALIER",
            "VOITURE", "VELO", "TRAIN", "ROUTE", "JARDIN", "FLEUR", "ARBRE", "PLAGE",
            "HIVER", "ETE", "AUTOMNE", "PRINTEMPS", "NEIGE", "PLUIE", "SOLEIL", "NUAGE",
            "GATEAU", "CHOCOLAT", "CUISINE", "TABLE", "CHAISE", "FENÊTRE", "PORTE", "MAISON"
        ];
        this.fullDictionary = [];
        this.isDictionaryLoaded = false;
    }

    async start() {
        this.renderLayout();
        await this.newGame();
    }

    applyDifficulty() {
        const select = document.getElementById('ws-diff-select');
        if (select) {
            this.difficulty = select.value;
            if (this.difficulty === 'easy') {
                this.gridSize = 8;
                this.wordCount = 6;
            } else if (this.difficulty === 'medium') {
                this.gridSize = 10;
                this.wordCount = 9;
            } else {
                this.gridSize = 12;
                this.wordCount = 12;
            }
        }
    }

    async newGame() {
        this.applyDifficulty();
        this.foundWords.clear();

        const wsGrid = document.getElementById('ws-grid');
        if (wsGrid) {
            wsGrid.style.gridTemplateColumns = '1fr';
            wsGrid.innerHTML = '<div class="loading-state">Génération en cours...</div>';
        }

        await this.loadDictionary();

        this.generateGrid();
        this.renderGrid();
        this.renderWordList();
    }

    async loadDictionary() {
        if (this.isDictionaryLoaded) return;
        try {
            const btn = document.getElementById('ws-btn-new');
            const select = document.getElementById('ws-diff-select');
            if (btn) {
                btn.textContent = "Chargement...";
                btn.disabled = true;
            }
            if (select) select.disabled = true;

            const text = await window.arcade.dictionaryCache.getRaw();
            const words = text.split(/\r?\n/);

            this.fullDictionary = [];
            for (let word of words) {
                word = word.trim().toUpperCase();
                if (word.length >= 3 && word.length <= 12 && /^[A-Z]+$/.test(word)) {
                    this.fullDictionary.push(word);
                }
            }
            this.isDictionaryLoaded = true;

            if (btn) {
                btn.textContent = "Nouveau";
                btn.disabled = false;
            }
            if (select) select.disabled = false;
        } catch (error) {
            console.error("Erreur chargement dico:", error);
            const btn = document.getElementById('ws-btn-new');
            const select = document.getElementById('ws-diff-select');
            if (btn) {
                btn.textContent = "Nouveau";
                btn.disabled = false;
            }
            if (select) select.disabled = false;
        }
    }

    generateGrid() {
        // Longueurs min/max selon la difficulté
        let minLen, maxLen;
        if (this.difficulty === 'easy') {
            minLen = 3; maxLen = 6;
        } else if (this.difficulty === 'medium') {
            minLen = 4; maxLen = 8;
        } else {
            minLen = 5; maxLen = 10;
        }

        // Sélectionner les mots aléatoires
        let pool = this.wordList.filter(w => w.length >= minLen && w.length <= maxLen);
        if (this.isDictionaryLoaded) {
            pool = this.fullDictionary.filter(w => w.length >= minLen && w.length <= maxLen);
        }

        this.wordsToFind = [];
        if (pool.length > 0) {
            const pickedIndices = new Set();
            while (this.wordsToFind.length < this.wordCount && pickedIndices.size < pool.length) {
                const idx = Math.floor(Math.random() * pool.length);
                if (!pickedIndices.has(idx)) {
                    pickedIndices.add(idx);
                    this.wordsToFind.push(pool[idx]);
                }
            }
        }

        // Initialiser grille vide
        this.grid = Array(this.gridSize).fill().map(() => Array(this.gridSize).fill(''));

        // Placer les mots — retirer ceux qui ne peuvent pas être placés
        const placedWords = [];
        for (let word of this.wordsToFind) {
            let placed = false;
            let attempts = 0;
            while (!placed && attempts < 200) {
                const direction = Math.floor(Math.random() * 3); // 0: H, 1: V, 2: D
                const row = Math.floor(Math.random() * this.gridSize);
                const col = Math.floor(Math.random() * this.gridSize);

                if (this.canPlaceWord(word, row, col, direction)) {
                    this.placeWord(word, row, col, direction);
                    placed = true;
                }
                attempts++;
            }
            if (placed) {
                placedWords.push(word);
            } else {
                // Mot non plaçable, on l'ignore
            }
        }
        this.wordsToFind = placedWords;

        // Remplir le reste avec des lettres aléatoires
        const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        for (let r = 0; r < this.gridSize; r++) {
            for (let c = 0; c < this.gridSize; c++) {
                if (this.grid[r][c] === '') {
                    this.grid[r][c] = letters[Math.floor(Math.random() * letters.length)];
                }
            }
        }
    }

    canPlaceWord(word, r, c, dir) {
        let dr = 0, dc = 0;
        if (dir === 0) dc = 1;      // H
        if (dir === 1) dr = 1;      // V
        if (dir === 2) { dr = 1; dc = 1; } // D

        if (r + dr * (word.length - 1) >= this.gridSize || c + dc * (word.length - 1) >= this.gridSize) return false;

        for (let i = 0; i < word.length; i++) {
            const char = word[i];
            const current = this.grid[r + dr * i][c + dc * i];
            if (current !== '' && current !== char) return false;
        }
        return true;
    }

    placeWord(word, r, c, dir) {
        let dr = 0, dc = 0;
        if (dir === 0) dc = 1;
        if (dir === 1) dr = 1;
        if (dir === 2) { dr = 1; dc = 1; }

        for (let i = 0; i < word.length; i++) {
            this.grid[r + dr * i][c + dc * i] = word[i];
        }
    }


    renderLayout() {
        this.container.innerHTML = `
            <div class="ws-game-container">
                <div class="ws-header">
                    <h2>Mots Mêlés</h2>
                    <div class="ws-controls">
                        <label for="ws-diff-select" class="sr-only">Choisir la difficulté</label>
                        <select id="ws-diff-select" class="diff-select">
                            <option value="easy">Facile</option>
                            <option value="medium" selected>Moyen</option>
                            <option value="hard">Difficile</option>
                        </select>
                        <button id="ws-btn-new" class="btn-secondary">Nouveau</button>
                    </div>
                </div>
                
                <div id="ws-grid" class="ws-grid"></div>
                
                <div class="ws-words-container">
                    <h3>Mots à trouver :</h3>
                    <div id="ws-word-list" class="ws-word-list"></div>
                </div>
            </div>
        `;

        document.getElementById('ws-btn-new').onclick = () => this.newGame();
        document.getElementById('ws-diff-select').onchange = () => this.newGame();
    }

    renderGrid() {
        const gridEl = document.getElementById('ws-grid');
        gridEl.innerHTML = '';
        gridEl.style.gridTemplateColumns = `repeat(${this.gridSize}, 1fr)`;

        for (let r = 0; r < this.gridSize; r++) {
            for (let c = 0; c < this.gridSize; c++) {
                const cell = document.createElement('div');
                cell.className = 'ws-cell';
                cell.textContent = this.grid[r][c];
                cell.dataset.r = r;
                cell.dataset.c = c;

                cell.onmousedown = (e) => this.handleStart(r, c);
                cell.onmouseenter = (e) => this.handleMove(r, c);
                cell.onmouseup = (e) => this.handleEnd();

                // Support Mobile
                cell.ontouchstart = (e) => { e.preventDefault(); this.handleStart(r, c); };
                cell.ontouchmove = (e) => {
                    const touch = e.touches[0];
                    const target = document.elementFromPoint(touch.clientX, touch.clientY);
                    if (target && target.classList.contains('ws-cell')) {
                        this.handleMove(parseInt(target.dataset.r), parseInt(target.dataset.c));
                    }
                };
                cell.ontouchend = () => this.handleEnd();

                gridEl.appendChild(cell);
            }
        }
        window.onmouseup = () => { if (this.isSelecting) this.handleEnd(); };
    }

    renderWordList() {
        const listEl = document.getElementById('ws-word-list');
        listEl.innerHTML = this.wordsToFind.map(w => `<span class="ws-word ${this.foundWords.has(w) ? 'found' : ''}">${w}</span>`).join('');
    }

    handleStart(r, c) {
        this.isSelecting = true;
        this.selectionStart = { r, c };
        this.selectionEnd = { r, c };
        this.updateSelectionUI();
    }

    handleMove(r, c) {
        if (!this.isSelecting) return;

        // Verrouiller en ligne droite (H, V ou D 45°)
        const dr = Math.abs(r - this.selectionStart.r);
        const dc = Math.abs(c - this.selectionStart.c);

        if (r === this.selectionStart.r || c === this.selectionStart.c || dr === dc) {
            this.selectionEnd = { r, c };
            this.updateSelectionUI();
        }
    }

    handleEnd() {
        if (!this.isSelecting) return;
        this.isSelecting = false;

        const selectedWord = this.getSelectedWord();
        const reversedWord = selectedWord.split('').reverse().join('');

        if (this.wordsToFind.includes(selectedWord) && !this.foundWords.has(selectedWord)) {
            this.foundWords.add(selectedWord);
            this.markFoundWord();
            window.arcade.addXP(10);
        } else if (this.wordsToFind.includes(reversedWord) && !this.foundWords.has(reversedWord)) {
            this.foundWords.add(reversedWord);
            this.markFoundWord();
            window.arcade.addXP(10);
        }

        this.selectionStart = null;
        this.selectionEnd = null;
        this.updateSelectionUI();
        this.renderWordList();
        this.checkWin();
    }

    getSelectedWord() {
        if (!this.selectionStart || !this.selectionEnd) return "";

        let word = "";
        const steps = Math.max(
            Math.abs(this.selectionEnd.r - this.selectionStart.r),
            Math.abs(this.selectionEnd.c - this.selectionStart.c)
        );

        const dr = Math.sign(this.selectionEnd.r - this.selectionStart.r);
        const dc = Math.sign(this.selectionEnd.c - this.selectionStart.c);

        for (let i = 0; i <= steps; i++) {
            word += this.grid[this.selectionStart.r + i * dr][this.selectionStart.c + i * dc];
        }
        return word;
    }

    updateSelectionUI() {
        document.querySelectorAll('.ws-cell').forEach(el => el.classList.remove('selected'));

        if (this.isSelecting && this.selectionStart && this.selectionEnd) {
            const steps = Math.max(
                Math.abs(this.selectionEnd.r - this.selectionStart.r),
                Math.abs(this.selectionEnd.c - this.selectionStart.c)
            );
            const dr = Math.sign(this.selectionEnd.r - this.selectionStart.r);
            const dc = Math.sign(this.selectionEnd.c - this.selectionStart.c);

            for (let i = 0; i <= steps; i++) {
                const r = this.selectionStart.r + i * dr;
                const c = this.selectionStart.c + i * dc;
                const cell = document.querySelector(`.ws-cell[data-r="${r}"][data-c="${c}"]`);
                if (cell) cell.classList.add('selected');
            }
        }
    }

    markFoundWord() {
        // Ajouter une classe permanente aux cellules trouvées
        const steps = Math.max(
            Math.abs(this.selectionEnd.r - this.selectionStart.r),
            Math.abs(this.selectionEnd.c - this.selectionStart.c)
        );
        const dr = Math.sign(this.selectionEnd.r - this.selectionStart.r);
        const dc = Math.sign(this.selectionEnd.c - this.selectionStart.c);

        for (let i = 0; i <= steps; i++) {
            const r = this.selectionStart.r + i * dr;
            const c = this.selectionStart.c + i * dc;
            const cell = document.querySelector(`.ws-cell[data-r="${r}"][data-c="${c}"]`);
            if (cell) cell.classList.add('permanently-found');
        }
    }

    checkWin() {
        if (this.foundWords.size === this.wordsToFind.length) {
            setTimeout(() => {
                window.arcade.addXP(100);
                this.showWinModal();
            }, 500);
        }
    }

    showWinModal() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <h2>Bravo !</h2>
                <p>Tous les mots ont été trouvés.</p>
                <div class="xp-bonus">+100 XP</div>
                <div class="modal-actions">
                    <button id="btn-restart-ws" class="btn-primary">Nouvelle Grille</button>
                    <button id="btn-quit-ws" class="btn-secondary">Menu Principal</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        document.getElementById('btn-restart-ws').onclick = () => { modal.remove(); this.newGame(); };
        document.getElementById('btn-quit-ws').onclick = () => { modal.remove(); window.arcade.renderHome(); };
    }
}
