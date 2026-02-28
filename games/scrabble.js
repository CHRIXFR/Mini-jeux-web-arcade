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
        this.tempMoves = []; // Tuiles placées pendant le tour actuel {r, c, letter, isJoker}
        this.dictionary = new Set();
        this.trie = new TrieNode();
        this.isDictionaryLoaded = false;
        this.firstMove = true;
        this.difficulty = 'beginner'; // Difficulté par défaut

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
        const mt = [[0, 0], [0, 7], [0, 14], [7, 0], [7, 14], [14, 0], [14, 7], [14, 14]];
        const md = [[1, 1], [2, 2], [3, 3], [4, 4], [1, 13], [2, 12], [3, 11], [4, 10], [13, 1], [12, 2], [11, 3], [10, 4], [13, 13], [12, 12], [11, 11], [10, 10], [7, 7]];
        const lt = [[1, 5], [1, 9], [5, 1], [5, 5], [5, 9], [5, 13], [9, 1], [9, 5], [9, 9], [9, 13], [13, 5], [13, 9]];
        const ld = [[0, 3], [0, 11], [2, 6], [2, 8], [3, 0], [3, 7], [3, 14], [6, 2], [6, 6], [6, 8], [6, 12], [7, 3], [7, 11], [8, 2], [8, 6], [8, 8], [8, 12], [11, 0], [11, 7], [11, 14], [12, 6], [12, 8], [14, 3], [14, 11]];

        mt.forEach(p => b[`${p[0]},${p[1]}`] = 'mt');
        md.forEach(p => b[`${p[0]},${p[1]}`] = 'md');
        lt.forEach(p => b[`${p[0]},${p[1]}`] = 'lt');
        ld.forEach(p => b[`${p[0]},${p[1]}`] = 'ld');
        b['7,7'] = 'star';
        return b;
    }

    async start() {
        this.score = 0;
        this.playerScore = 0;
        this.aiScore = 0;
        this.consecutivePasses = 0;
        this.isGameOver = false;
        this.firstMove = true;
        this.renderLayout();
        await this.loadDictionary();

        if (this.isDictionaryLoaded) {
            this.promptDifficulty();
        }
    }

    promptDifficulty() {
        const modal = document.getElementById('scr-diff-modal');
        if (modal) modal.style.display = 'flex';
    }

    startGameWithDifficulty(diff) {
        this.difficulty = diff;
        document.getElementById('scr-diff-modal').style.display = 'none';
        this.initBag();
        this.fillPlayerRack();
        this.fillAiRack();
        this.renderBoard();
        this.renderRack();
        window.arcade.showToast('Partie commencée !');
    }

    async loadDictionary() {
        try {
            const btn = document.getElementById('scr-btn-play');
            if (btn) btn.textContent = "Chargement dico...";

            const text = await window.arcade.dictionaryCache.getRaw();
            const words = text.split(/\r?\n/);

            for (let word of words) {
                word = word.trim().toUpperCase();
                if (word.length >= 2 && word.length <= 15) {
                    this.dictionary.add(word);
                    this.insertIntoTrie(word);
                }
            }
            this.isDictionaryLoaded = true;
            if (btn) {
                btn.textContent = "Valider";
                btn.removeAttribute('disabled');
            }
        } catch (error) {
            console.error("Erreur chargement dico:", error);
            window.arcade.showToast('Erreur: Impossible de charger le dictionnaire.');
        }
    }

    insertIntoTrie(word) {
        let node = this.trie;
        for (const char of word) {
            if (!node.children[char]) node.children[char] = new TrieNode();
            node = node.children[char];
        }
        node.isEndOfWord = true;
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
                    <button id="scr-btn-play" class="btn-primary" disabled>Chargement...</button>
                    <button id="scr-btn-cancel" class="btn-secondary">Annuler</button>
                    <button id="scr-btn-shuffle" class="btn-secondary">Mélanger</button>
                    <button id="scr-btn-exchange" class="btn-secondary" title="Échanger toutes vos lettres (passe votre tour)">Échanger</button>
                    <button id="scr-btn-pass" class="btn-secondary">Passer</button>
                    <button id="scr-btn-hint" class="btn-secondary scr-btn-hint" title="Proposer un mot possible">Aide 💡</button>
                </div>
            </div>
            
            <!-- Modale Joker -->
            <div id="scr-joker-modal" class="modal-overlay" style="display: none;">
                <div class="modal-content">
                    <h3>Lettre du Joker ?</h3>
                    <input type="text" id="scr-joker-input" maxlength="1" style="font-size: 2rem; width: 3rem; text-align: center; text-transform: uppercase; margin: 1rem 0;">
                    <button id="scr-btn-joker" class="btn-primary">Confirmer</button>
                </div>
            </div>

            <!-- Modale Difficulté -->
            <div id="scr-diff-modal" class="modal-overlay" style="display: none;">
                <div class="modal-content">
                    <h2>Niveau de l'IA</h2>
                    <p style="margin-bottom: 2rem; color: var(--text-secondary);">Choisissez la difficulté de votre adversaire avant de commencer.</p>
                    <div class="modal-actions">
                        <button class="btn-primary diff-btn" data-diff="beginner">Débutant</button>
                        <button class="btn-primary diff-btn" data-diff="intermediate">Intermédiaire</button>
                        <button class="btn-primary diff-btn" data-diff="confirmed">Confirmé</button>
                        <button class="btn-primary diff-btn" data-diff="pro">Pro</button>
                    </div>
                </div>
            </div>
            
            <!-- Modale Fin de Partie -->
            <div id="scr-end-modal" class="modal-overlay" style="display: none;">
                <div class="modal-content">
                    <h2 id="scr-end-title">Fin de partie</h2>
                    <div class="xp-bonus" id="scr-end-score" style="font-size: 2rem; margin-bottom: 2rem;">0 - 0</div>
                    <div class="modal-actions">
                        <button id="scr-btn-replay" class="btn-primary">Rejouer la partie</button>
                        <button onclick="window.arcade.renderHome()" class="btn-secondary">Retour au menu</button>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('scr-btn-play').onclick = () => this.validateMove();
        document.getElementById('scr-btn-cancel').onclick = () => this.cancelTempMove();
        document.getElementById('scr-btn-shuffle').onclick = () => this.shuffleRack();
        document.getElementById('scr-btn-exchange').onclick = () => this.exchangePlayerLetters();
        document.getElementById('scr-btn-pass').onclick = () => this.passTurn();
        document.getElementById('scr-btn-hint').onclick = () => this.hintMove();

        document.querySelectorAll('.diff-btn').forEach(btn => {
            btn.onclick = (e) => this.startGameWithDifficulty(e.target.getAttribute('data-diff'));
        });
        document.getElementById('scr-btn-replay').onclick = () => {
            document.getElementById('scr-end-modal').style.display = 'none';
            this.start();
        };

        // Expose jeu pour tests Playwright
        window._scrabbleGame = this;
    }

    renderBoard() {
        const boardEl = document.getElementById('scr-board');
        boardEl.innerHTML = '';
        for (let r = 0; r < 15; r++) {
            for (let c = 0; c < 15; c++) {
                const cell = document.createElement('div');
                const bonus = this.bonuses[`${r},${c}`];
                cell.className = 'scr-cell' + (bonus ? ` ${bonus}` : '');

                // Priorité du contenu : Plateau logique > Coup temporaire > Aide > Texte bonus
                const placedTile = this.board[r][c];
                const tempTile = this.tempMoves.find(m => m.r === r && m.c === c);
                const hintTile = this.hintMoves && this.hintMoves.find(m => m.r === r && m.c === c);

                if (placedTile || tempTile) {
                    const letter = placedTile ? placedTile.letter : tempTile.letter;
                    const isJoker = placedTile ? placedTile.isJoker : tempTile.isJoker;
                    const val = isJoker ? 0 : this.letterData[letter].v;
                    const isAi = placedTile && placedTile.playedByAi;

                    cell.innerHTML = `
                        <div class="scr-tile ${isAi ? 'scr-tile-ai' : ''}" style="${isJoker ? 'color: #b91c1c;' : ''}">
                            ${letter}
                            <span class="scr-tile-val">${val}</span>
                        </div>
                    `;
                } else if (hintTile) {
                    const val = hintTile.isJoker ? 0 : this.letterData[hintTile.letter].v;
                    cell.innerHTML = `
                        <div class="scr-tile scr-tile-hint">
                            ${hintTile.letter}
                            <span class="scr-tile-val">${val}</span>
                        </div>
                    `;
                } else if (bonus) {
                    cell.textContent = bonus === 'star' ? '★' : bonus.toUpperCase();
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

        // Si clic sur une cellule où une tuile a été placée ce tour, on la reprend
        const tempIdx = this.tempMoves.findIndex(m => m.r === r && m.c === c);
        if (tempIdx !== -1) {
            const moved = this.tempMoves.splice(tempIdx, 1)[0];
            this.playerRack.push(moved.isJoker ? '?' : moved.letter);
            this.renderBoard();
            this.renderRack();
            return;
        }

        // Placer la tuile sélectionnée
        if (this.selectedTileIndex !== null && !this.board[r][c]) {
            const letter = this.playerRack[this.selectedTileIndex];

            if (letter === '?') {
                this.promptJoker(r, c, this.selectedTileIndex);
            } else {
                this.executePlacement(r, c, letter, false, this.selectedTileIndex);
            }
        }
    }

    promptJoker(r, c, rackIndex) {
        const modal = document.getElementById('scr-joker-modal');
        const input = document.getElementById('scr-joker-input');
        const btn = document.getElementById('scr-btn-joker');

        modal.style.display = 'flex';
        input.value = '';
        input.focus();

        btn.onclick = () => {
            const val = input.value.toUpperCase();
            if (/^[A-Z]$/.test(val)) {
                modal.style.display = 'none';
                this.executePlacement(r, c, val, true, rackIndex);
            }
        };
    }

    executePlacement(r, c, letter, isJoker, rackIndex) {
        this.playerRack.splice(rackIndex, 1);
        this.tempMoves.push({ r, c, letter, isJoker });
        this.selectedTileIndex = null;
        this.renderBoard();
        this.renderRack();
    }

    shuffleRack() {
        this.shuffle(this.playerRack);
        this.renderRack();
    }

    exchangePlayerLetters() {
        if (this.currentTurn !== 'player') return;
        if (this.tempMoves.length > 0) this.cancelTempMove();

        // Peut échanger seulement si le sac a au moins autant de lettres que le chevalet
        if (this.bag.length < this.playerRack.length) {
            const isTestMode = new URLSearchParams(window.location.search).get('test') === 'true';
            if (isTestMode) {
                // En mode test : fin de partie si impossible d'échanger (sac vide)
                this.handleGameEnd();
            } else {
                window.arcade.showToast('Pas assez de lettres dans le sac pour échanger.');
            }
            return;
        }

        this.bag.push(...this.playerRack);
        this.shuffle(this.bag);
        this.playerRack = [];
        this.fillPlayerRack();
        this.renderRack();
        this.consecutivePasses = 0;
        window.arcade.showToast('Vous avez échangé toutes vos lettres.');
        this.switchTurn();
    }

    cancelTempMove() {
        this.tempMoves.forEach(m => this.playerRack.push(m.isJoker ? '?' : m.letter));
        this.tempMoves = [];
        this.renderBoard();
        this.renderRack();
    }

    passTurn() {
        if (this.tempMoves.length > 0) this.cancelTempMove();
        this.hintMoves = null; // Effacer l'aide en cours
        this.consecutivePasses = (this.consecutivePasses || 0) + 1;
        if (this.consecutivePasses >= 2) {
            this.handleGameEnd();
            return;
        }
        this.switchTurn();
    }

    hintMove() {
        if (this.currentTurn !== 'player') return;
        if (this.tempMoves.length > 0) this.cancelTempMove();

        // Utilise temporairement le rack joueur dans la mécanique IA niveau Confirmé
        const savedAiRack = this.aiRack;
        const savedDiff = this.difficulty;
        this.aiRack = [...this.playerRack];
        this.difficulty = 'confirmed';

        const possibleMoves = this.findAllValidAiMoves();

        // Restaurer l'état IA
        this.aiRack = savedAiRack;
        this.difficulty = savedDiff;

        const isTestMode = new URLSearchParams(window.location.search).get('test') === 'true';

        if (possibleMoves.length === 0) {
            if (isTestMode) {
                // En mode test : échange automatique des lettres si aucun mot trouvable
                this.exchangePlayerLetters();
            } else {
                window.arcade.showToast('Aucun mot trouvé. Essayez d\'échanger vos lettres !');
            }
            return;
        }

        // Choisir un bon mot (comme la logique confirmée)
        const midWords = possibleMoves.filter(m => m.word.length >= 5 && m.word.length <= 6);
        const chosen = midWords.length > 0
            ? midWords.sort((a, b) => b.score - a.score)[0]
            : possibleMoves.sort((a, b) => b.score - a.score)[0];

        if (isTestMode) {
            // Mode test : placer ET valider automatiquement
            const placements = chosen.placements.map(m => ({ ...m }));
            const removedLetters = [];

            for (const m of placements) {
                const letterInRack = m.isJoker ? '?' : m.letter;
                const idx = this.playerRack.indexOf(letterInRack);
                if (idx > -1) {
                    this.playerRack.splice(idx, 1);
                    removedLetters.push(letterInRack);
                }
            }

            this.tempMoves = placements;
            this.hintMoves = null;
            this.renderBoard();
            this.renderRack();

            const rackSize = this.playerRack.length + removedLetters.length;
            this.validateMove();

            // Si validateMove a échoué, remettre les lettres retirées
            if (this.tempMoves.length > 0 || this.playerRack.length > rackSize) {
                this.playerRack.push(...removedLetters);
                this.tempMoves = [];
                this.renderRack();
            }
        } else {
            // Mode normal : placer les lettres en tempMoves (suggestion interactive)
            // Le joueur peut Valider ou Annuler comme s'il les avait placées manuellement
            const placements = chosen.placements.map(m => ({ ...m }));

            for (const m of placements) {
                const letterInRack = m.isJoker ? '?' : m.letter;
                const idx = this.playerRack.indexOf(letterInRack);
                if (idx > -1) {
                    this.playerRack.splice(idx, 1);
                }
            }

            this.tempMoves = placements;
            this.hintMoves = null;
            this.renderBoard();
            this.renderRack();
            window.arcade.showToast(`Suggestion : "${chosen.word}" (~${chosen.score} pts) — Validez ou Annulez`);
        }
    }


    validateMove() {
        if (this.tempMoves.length === 0) {
            window.arcade.showToast('Placez au moins une lettre !');
            return;
        }

        if (!this.isDictionaryLoaded) {
            window.arcade.showToast('Dictionnaire en cours de chargement...');
            return;
        }

        // 1. Vérification de l'alignement
        const isHorizontal = this.tempMoves.every(m => m.r === this.tempMoves[0].r);
        const isVertical = this.tempMoves.every(m => m.c === this.tempMoves[0].c);

        if (!isHorizontal && !isVertical && this.tempMoves.length > 1) {
            window.arcade.showToast('Les lettres doivent être alignées !');
            return;
        }

        // Trier les coups
        this.tempMoves.sort((a, b) => isHorizontal ? a.c - b.c : a.r - b.r);

        // Vérification des trous
        if (this.tempMoves.length > 1) {
            const first = this.tempMoves[0];
            const last = this.tempMoves[this.tempMoves.length - 1];
            if (isHorizontal) {
                for (let c = first.c; c <= last.c; c++) {
                    const inTemp = this.tempMoves.find(m => m.r === first.r && m.c === c);
                    const onBoard = this.board[first.r][c];
                    if (!inTemp && !onBoard) {
                        window.arcade.showToast('Le mot ne doit pas contenir de trous.');
                        return;
                    }
                }
            } else {
                for (let r = first.r; r <= last.r; r++) {
                    const inTemp = this.tempMoves.find(m => m.r === r && m.c === first.c);
                    const onBoard = this.board[r][first.c];
                    if (!inTemp && !onBoard) {
                        window.arcade.showToast('Le mot ne doit pas contenir de trous.');
                        return;
                    }
                }
            }
        }

        // 2. Vérification des contraintes (Centre OU Attachement)
        let passingCenter = false;
        let isAttached = false;

        for (const m of this.tempMoves) {
            if (m.r === 7 && m.c === 7) passingCenter = true;
            const neighbors = [[m.r + 1, m.c], [m.r - 1, m.c], [m.r, m.c + 1], [m.r, m.c - 1]];
            for (const [nr, nc] of neighbors) {
                if (nr >= 0 && nr < 15 && nc >= 0 && nc < 15 && this.board[nr][nc]) {
                    isAttached = true;
                }
            }
        }

        if (this.firstMove && !passingCenter) {
            window.arcade.showToast('Le premier mot doit passer par l\'étoile au centre');
            return;
        }
        if (!this.firstMove && !isAttached) {
            window.arcade.showToast('Le mot doit être rattaché aux lettres existantes');
            return;
        }

        // 3. Identification des mots et calcul du score
        // Placement temporaire pour l'évaluation
        for (const m of this.tempMoves) this.board[m.r][m.c] = { letter: m.letter, isJoker: m.isJoker, temp: true };

        const { isValid, turnScore, invalidWords } = this.evaluateBoardState();

        if (!isValid) {
            for (const m of this.tempMoves) this.board[m.r][m.c] = null; // Revert
            window.arcade.showToast(`Mots invalides : ${invalidWords.join(', ')}`);
            return;
        }

        // 4. Validation finale du coup
        this.firstMove = false;
        for (const m of this.tempMoves) {
            this.board[m.r][m.c].temp = false;
        }

        // Nettoyer les highlights IA précédents lors d'un coup valide
        for (let r = 0; r < 15; r++) {
            for (let c = 0; c < 15; c++) {
                if (this.board[r][c] && this.board[r][c].playedByAi) {
                    this.board[r][c].playedByAi = false;
                }
            }
        }

        this.consecutivePasses = 0;

        let finalScore = turnScore;
        if (this.tempMoves.length === 7) {
            finalScore += 50; // BINGO!
            window.arcade.showToast('BINGO ! +50 points', 3000);
        }

        this.playerScore += finalScore;
        this.tempMoves = [];
        this.fillPlayerRack();
        this.updateStats();
        this.renderBoard();
        this.renderRack();

        window.arcade.showToast(`Coup valide : +${finalScore} points !`);
        this.checkEndGame();
        if (!this.isGameOver) this.switchTurn();
    }

    evaluateBoardState() {
        let turnScore = 0;
        let invalidWords = [];
        let wordsFormed = 0;

        const getTileNode = (r, c) => this.board[r][c];
        const processedOrigins = new Set(); // Évite de compter deux fois le même mot

        // Vérification des mots horizontaux et verticaux formés par les nouvelles tuiles
        for (const m of this.tempMoves) {
            // Balayage horizontal
            let hc = m.c; while (hc > 0 && getTileNode(m.r, hc - 1)) hc--;
            const hOrigin = `${m.r},${hc},H`;
            if (!processedOrigins.has(hOrigin)) {
                let wordStr = "";
                let wordBaseScore = 0;
                let wordMultiplier = 1;
                let length = 0;

                let currC = hc;
                while (currC < 15 && getTileNode(m.r, currC)) {
                    const tile = getTileNode(m.r, currC);
                    wordStr += tile.letter;
                    length++;

                    let letterVal = tile.isJoker ? 0 : this.letterData[tile.letter].v;
                    if (tile.temp) { // Appliquer les bonus uniquement sur les nouvelles tuiles
                        const bonus = this.bonuses[`${m.r},${currC}`];
                        if (bonus === 'ld') letterVal *= 2;
                        if (bonus === 'lt') letterVal *= 3;
                        if (bonus === 'md' || bonus === 'star') wordMultiplier *= 2;
                        if (bonus === 'mt') wordMultiplier *= 3;
                    }
                    wordBaseScore += letterVal;
                    currC++;
                }

                if (length > 1) {
                    if (!this.dictionary.has(wordStr)) {
                        invalidWords.push(wordStr);
                    }
                    turnScore += (wordBaseScore * wordMultiplier);
                    wordsFormed++;
                    processedOrigins.add(hOrigin);
                }
            }

            // Balayage vertical
            let vr = m.r; while (vr > 0 && getTileNode(vr - 1, m.c)) vr--;
            const vOrigin = `${vr},${m.c},V`;
            if (!processedOrigins.has(vOrigin)) {
                let wordStr = "";
                let wordBaseScore = 0;
                let wordMultiplier = 1;
                let length = 0;

                let currR = vr;
                while (currR < 15 && getTileNode(currR, m.c)) {
                    const tile = getTileNode(currR, m.c);
                    wordStr += tile.letter;
                    length++;

                    let letterVal = tile.isJoker ? 0 : this.letterData[tile.letter].v;
                    if (tile.temp) {
                        const bonus = this.bonuses[`${currR},${m.c}`];
                        if (bonus === 'ld') letterVal *= 2;
                        if (bonus === 'lt') letterVal *= 3;
                        if (bonus === 'md' || bonus === 'star') wordMultiplier *= 2;
                        if (bonus === 'mt') wordMultiplier *= 3;
                    }
                    wordBaseScore += letterVal;
                    currR++;
                }

                if (length > 1) {
                    if (!this.dictionary.has(wordStr)) {
                        invalidWords.push(wordStr);
                    }
                    turnScore += (wordBaseScore * wordMultiplier);
                    wordsFormed++;
                    processedOrigins.add(vOrigin);
                }
            }
        }

        // Vérification des tuiles déconnectées (trous dans le placement)
        if (wordsFormed === 0 && this.tempMoves.length > 0) {
            invalidWords.push("[Mot trop court / Isolé]");
        }

        return { isValid: invalidWords.length === 0, turnScore, invalidWords };
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
        // Recherche tous les coups possibles pour l'IA dans le temps imparti
        const possibleMoves = this.findAllValidAiMoves();

        if (possibleMoves.length > 0) {
            let chosenMove;

            if (this.difficulty === 'beginner') {
                // Préfère les mots courts et les scores faibles
                possibleMoves.sort((a, b) => {
                    if (a.word.length !== b.word.length) return a.word.length - b.word.length;
                    return a.score - b.score;
                });
                chosenMove = possibleMoves[0];
            } else if (this.difficulty === 'intermediate') {
                // Préfère les mots de 4 lettres
                const fourLetters = possibleMoves.filter(m => m.word.length === 4);
                if (fourLetters.length > 0) {
                    fourLetters.sort((a, b) => b.score - a.score);
                    chosenMove = fourLetters[0];
                } else {
                    possibleMoves.sort((a, b) => b.score - a.score);
                    // Prend un coup correct mais pas forcément le meilleur
                    chosenMove = possibleMoves[Math.min(possibleMoves.length - 1, 2)];
                }
            } else if (this.difficulty === 'confirmed') {
                // Préfère les mots de 5 à 6 lettres
                const midWords = possibleMoves.filter(m => m.word.length >= 5 && m.word.length <= 6);
                if (midWords.length > 0) {
                    midWords.sort((a, b) => b.score - a.score);
                    chosenMove = midWords[0];
                } else {
                    possibleMoves.sort((a, b) => b.score - a.score);
                    chosenMove = possibleMoves[0];
                }
            } else {
                // Pro : prend le meilleur coup absolu
                possibleMoves.sort((a, b) => b.score - a.score);
                chosenMove = possibleMoves[0];
            }

            this.tempMoves = chosenMove.placements;
            let finalScore = chosenMove.score;

            // Validation du coup de l'IA
            for (const m of this.tempMoves) {
                this.board[m.r][m.c] = { letter: m.letter, isJoker: m.isJoker, temp: false, playedByAi: true };
                // Retirer les lettres utilisées du chevalet de l'IA
                const rackIdx = this.aiRack.indexOf(m.isJoker ? '?' : m.letter);
                if (rackIdx > -1) this.aiRack.splice(rackIdx, 1);
            }
            this.firstMove = false;

            if (this.tempMoves.length === 7) finalScore += 50;
            this.consecutivePasses = 0;

            this.aiScore += finalScore;
            this.tempMoves = [];
            this.fillAiRack();
            this.updateStats();
            this.renderBoard();
            window.arcade.showToast(`L'IA joue "${chosenMove.word}" pour ${finalScore} pts`);
        } else {
            // Échanger les lettres si le sac en contient assez, sinon passer
            if (this.bag.length >= 7) {
                this.bag.push(...this.aiRack);
                this.shuffle(this.bag);
                this.aiRack = [];
                this.fillAiRack();
                window.arcade.showToast(`L'IA a échangé ses lettres`);
                this.consecutivePasses = 0;
            } else {
                window.arcade.showToast(`L'IA a passé son tour`);
                this.consecutivePasses = (this.consecutivePasses || 0) + 1;
                if (this.consecutivePasses >= 2) {
                    this.handleGameEnd();
                    return;
                }
            }
        }

        this.checkEndGame();
        if (!this.isGameOver) this.switchTurn();
    }

    findAllValidAiMoves() {
        // Brute-force simplifiée : tente de placer les mots du chevalet sur les points d'ancrage
        const validMoves = [];
        const isRackEmpty = this.aiRack.length === 0;
        if (isRackEmpty) return validMoves;

        // Pour des raisons de performance, on limite la recherche drastiquement.
        const rackCounts = {};
        let jokerCount = 0;
        for (const l of this.aiRack) {
            if (l === '?') jokerCount++;
            else rackCounts[l] = (rackCounts[l] || 0) + 1;
        }

        const canForm = (wordSegment, neededStr) => {
            let j = jokerCount;
            const tempRack = { ...rackCounts };
            const usedLetters = [];

            for (const char of neededStr) {
                if (tempRack[char] > 0) {
                    tempRack[char]--;
                    usedLetters.push({ letter: char, isJoker: false });
                } else if (j > 0) {
                    j--;
                    usedLetters.push({ letter: char, isJoker: true });
                } else {
                    return null;
                }
            }
            return usedLetters;
        };

        // Si premier coup, seule l'étoile centrale (7,7) est un point d'ancrage
        const anchors = [];
        if (this.firstMove) {
            anchors.push({ r: 7, c: 7 });
        } else {
            for (let r = 0; r < 15; r++) {
                for (let c = 0; c < 15; c++) {
                    if (this.board[r][c]) {
                        // Ajouter les espaces vides adjacents comme ancres
                        [[r + 1, c], [r - 1, c], [r, c + 1], [r, c - 1]].forEach(([nr, nc]) => {
                            if (nr >= 0 && nr < 15 && nc >= 0 && nc < 15 && !this.board[nr][nc]) {
                                anchors.push({ r: nr, c: nc });
                            }
                        });
                    }
                }
            }
        }

        // Approche IA simplifiée : tente de placer des lettres ou mots courts adjacents aux tuiles existantes.
        // Heuristique conçue pour ne pas bloquer le navigateur tout en fournissant un adversaire fonctionnel.

        const aiLetters = this.aiRack.map(l => l === '?' ? '' : l).join(''); // Heuristique : n'utilise que les vraies lettres
        const hasJoker = this.aiRack.includes('?');

        // Parcourt les ancres pour trouver les mots formables.
        // On scanne les mots du dictionnaire contenant au moins une lettre plaçable sur une ancre.
        // Pour la performance, la recherche est fortement limitée. Une vraie IA Scrabble utilise un GADDAG ou un Trie.
        // On dispose d'un Trie ! On peut faire une recherche récursive depuis les ancres.

        // Logique IA :
        // 1. Trouver toutes les "ancres" (cases vides adjacentes aux cases remplies, plus le centre au premier coup).
        // 2. Pour chaque ancre, tenter une extension horizontale et verticale.
        // Contrainte de performance navigateur : on utilise une heuristique plus simple :
        // Trouver les lettres existantes sur le plateau et tenter d'ajouter des lettres du chevalet.

        // Force brute simplifiée pour le navigateur :
        // Tente d'ajouter de 1 à N lettres du chevalet aux lettres existantes.

        const startTime = performance.now();
        let timeLimit = 500; // ms par défaut
        if (this.difficulty === 'beginner') timeLimit = 1000;
        else if (this.difficulty === 'intermediate') timeLimit = 2000;
        else if (this.difficulty === 'confirmed') timeLimit = 4000;
        else if (this.difficulty === 'pro') timeLimit = 6000;

        let timeExceeded = false;

        for (const anchor of anchors) {
            if (timeExceeded) break;

            for (let dir = 0; dir < 2; dir++) { // 0: Horiz, 1: Vert
                if (timeExceeded) break;
                const dr = dir === 1 ? 1 : 0;
                const dc = dir === 0 ? 1 : 0;

                // Tente de placer de 1 à 7 lettres du chevalet à partir de cette ancre
                for (let len = 1; len <= this.aiRack.length; len++) {
                    if (timeExceeded) break;

                    // Obtient les permutations du chevalet de longueur `len`
                    const perms = this.getRackPermutations(len);
                    for (const perm of perms) {
                        // Vérifier la contrainte de temps
                        if (performance.now() - startTime > timeLimit) {
                            timeExceeded = true;
                            break;
                        }

                        this.tempMoves = [];
                        let isValidPlacement = true;
                        let pr = anchor.r;
                        let pc = anchor.c;

                        for (let i = 0; i < len; i++) {
                            // Saute les tuiles déjà placées
                            while (pr >= 0 && pr < 15 && pc >= 0 && pc < 15 && this.board[pr][pc] !== null) {
                                pr += dr;
                                pc += dc;
                            }

                            if (pr >= 15 || pc >= 15) {
                                isValidPlacement = false;
                                break;
                            }

                            const l = perm[i];
                            const letter = l === '?' ? 'E' : l;
                            const isJoker = l === '?';

                            this.tempMoves.push({ r: pr, c: pc, letter, isJoker });
                            this.board[pr][pc] = { letter, isJoker, temp: true };

                            pr += dr;
                            pc += dc;
                        }

                        if (isValidPlacement) {
                            const { isValid, turnScore } = this.evaluateBoardState();
                            // Doit être entièrement valide et score > 0
                            if (isValid && turnScore > 0) {
                                // Pour éviter les mots identiques en double
                                const wordId = this.tempMoves.map(m => `${m.r},${m.c}=${m.letter}`).join('|');
                                if (!validMoves.find(v => v.id === wordId)) {
                                    validMoves.push({
                                        id: wordId,
                                        word: this.tempMoves.map(m => m.letter).join(''),
                                        placements: [...this.tempMoves],
                                        score: turnScore
                                    });
                                }
                            }
                        }

                        // Annulation pour le test suivant
                        for (const m of this.tempMoves) {
                            this.board[m.r][m.c] = null;
                        }
                    }
                }
            }
        }

        return validMoves;
    }

    getRackPermutations(len) {
        const results = [];
        const used = Array(this.aiRack.length).fill(false);

        const permute = (current) => {
            if (current.length === len) {
                results.push([...current]);
                return;
            }
            // Utilise un Set pour éviter les permutations en double
            const seen = new Set();
            for (let i = 0; i < this.aiRack.length; i++) {
                if (used[i]) continue;
                const letter = this.aiRack[i];
                if (seen.has(letter)) continue;

                seen.add(letter);
                used[i] = true;
                current.push(letter);
                permute(current);
                current.pop();
                used[i] = false;
            }
        };

        permute([]);
        return results;
    }

    checkEndGame() {
        if (!this.isGameOver && this.bag.length === 0 && (this.playerRack.length === 0 || this.aiRack.length === 0)) {
            this.handleGameEnd();
        }
    }

    handleGameEnd() {
        if (this.isGameOver) return;
        this.isGameOver = true;

        // Déduire la valeur des lettres restantes
        let pPenalty = 0;
        for (const l of this.playerRack) pPenalty += (l === '?' ? 0 : this.letterData[l].v);

        let aPenalty = 0;
        for (const l of this.aiRack) aPenalty += (l === '?' ? 0 : this.letterData[l].v);

        this.playerScore -= pPenalty;
        this.aiScore -= aPenalty;

        // Bonus pour le joueur ayant terminé en premier
        if (this.playerRack.length === 0 && this.aiRack.length !== 0) this.playerScore += aPenalty;
        if (this.aiRack.length === 0 && this.playerRack.length !== 0) this.aiScore += pPenalty;

        this.updateStats();

        const pWon = this.playerScore > this.aiScore;
        setTimeout(() => {
            const modal = document.getElementById('scr-end-modal');
            const title = document.getElementById('scr-end-title');
            const score = document.getElementById('scr-end-score');

            if (this.playerScore === this.aiScore) {
                title.textContent = 'Égalité ! 🤝';
                title.style.color = '#3b82f6';
            } else {
                title.textContent = pWon ? 'Vous avez gagné ! 🎉' : 'L\'IA a gagné... 🤖';
                title.style.color = pWon ? 'var(--success)' : '#ef4444';
            }
            score.textContent = `${this.playerScore} - ${this.aiScore}`;

            modal.style.display = 'flex';
        }, 1000);
    }
}

class TrieNode {
    constructor() {
        this.children = {};
        this.isEndOfWord = false;
    }
}
