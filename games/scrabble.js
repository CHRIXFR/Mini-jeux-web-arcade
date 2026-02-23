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
        this.tempMoves = []; // Tiles placed during current turn {r, c, letter, isJoker}
        this.dictionary = new Set();
        this.trie = new TrieNode();
        this.isDictionaryLoaded = false;
        this.firstMove = true;

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

    async start() {
        this.score = 0;
        this.playerScore = 0;
        this.aiScore = 0;
        this.isGameOver = false;
        this.renderLayout();
        await this.loadDictionary();

        if (this.isDictionaryLoaded) {
            this.initBag();
            this.fillPlayerRack();
            this.fillAiRack();
            this.renderBoard();
            this.renderRack();
            window.arcade.showToast('Partie commencée !');
        }
    }

    async loadDictionary() {
        try {
            const btn = document.getElementById('scr-btn-play');
            if (btn) btn.textContent = "Chargement dico...";

            const response = await fetch('games/dictionary/French ODS dictionary.txt');
            if (!response.ok) throw new Error('Dictionnaire introuvable');

            const text = await response.text();
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
            console.log(`Dictionnaire chargé : ${this.dictionary.size} mots.`);
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
                    <button id="scr-btn-pass" class="btn-secondary">Passer</button>
                </div>
            </div>
            
            <!-- Joker Modal -->
            <div id="scr-joker-modal" class="modal-overlay" style="display: none;">
                <div class="modal-content">
                    <h3>Lettre du Joker ?</h3>
                    <input type="text" id="scr-joker-input" maxlength="1" style="font-size: 2rem; width: 3rem; text-align: center; text-transform: uppercase; margin: 1rem 0;">
                    <button id="scr-btn-joker" class="btn-primary">Confirmer</button>
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
                const placedTile = this.board[r][c];
                const tempTile = this.tempMoves.find(m => m.r === r && m.c === c);

                if (placedTile || tempTile) {
                    const letter = placedTile ? placedTile.letter : tempTile.letter;
                    const isJoker = placedTile ? placedTile.isJoker : tempTile.isJoker;
                    const val = isJoker ? 0 : this.letterData[letter].v;

                    cell.innerHTML = `
                        <div class="scr-tile" style="${isJoker ? 'color: #b91c1c;' : ''}">
                            ${letter}
                            <span class="scr-tile-val">${val}</span>
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
        console.log("=== BEGIN validateMove ===");
        console.log("tempMoves:", JSON.parse(JSON.stringify(this.tempMoves)));
        console.log("firstMove:", this.firstMove);

        if (this.tempMoves.length === 0) {
            console.log("ERROR: tempMoves empty");
            window.arcade.showToast('Placez au moins une lettre !');
            return;
        }

        if (!this.isDictionaryLoaded) {
            console.log("ERROR: dictionary not loaded");
            window.arcade.showToast('Dictionnaire en cours de chargement...');
            return;
        }

        // 1. Check Alignment
        const isHorizontal = this.tempMoves.every(m => m.r === this.tempMoves[0].r);
        const isVertical = this.tempMoves.every(m => m.c === this.tempMoves[0].c);

        console.log("Alignment check: isHorizontal=", isHorizontal, "isVertical=", isVertical);

        if (!isHorizontal && !isVertical && this.tempMoves.length > 1) {
            console.log("ERROR: Not aligned horizontally or vertically");
            window.arcade.showToast('Les lettres doivent être alignées !');
            return;
        }

        // Sort moves
        this.tempMoves.sort((a, b) => isHorizontal ? a.c - b.c : a.r - b.r);

        // Gap check
        if (this.tempMoves.length > 1) {
            const first = this.tempMoves[0];
            const last = this.tempMoves[this.tempMoves.length - 1];
            if (isHorizontal) {
                for (let c = first.c; c <= last.c; c++) {
                    const inTemp = this.tempMoves.find(m => m.r === first.r && m.c === c);
                    const onBoard = this.board[first.r][c];
                    if (!inTemp && !onBoard) {
                        console.log(`ERROR: Gap at ${first.r},${c}`);
                        window.arcade.showToast('Le mot ne doit pas contenir de trous.');
                        return;
                    }
                }
            } else {
                for (let r = first.r; r <= last.r; r++) {
                    const inTemp = this.tempMoves.find(m => m.r === r && m.c === first.c);
                    const onBoard = this.board[r][first.c];
                    if (!inTemp && !onBoard) {
                        console.log(`ERROR: Gap at ${r},${first.c}`);
                        window.arcade.showToast('Le mot ne doit pas contenir de trous.');
                        return;
                    }
                }
            }
        }

        // 2. Constraints Check (Center OR Attached)
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

        console.log("passingCenter=", passingCenter, "isAttached=", isAttached);

        if (this.firstMove && !passingCenter) {
            console.log("ERROR: First move doesn't pass center");
            window.arcade.showToast('Le premier mot doit passer par l\'étoile au centre');
            return;
        }
        if (!this.firstMove && !isAttached) {
            console.log("ERROR: Move is not attached to existing pieces");
            window.arcade.showToast('Le mot doit être rattaché aux lettres existantes');
            return;
        }

        // 3. Find and Validate Words, Calculate Score
        // To accurately calculate, we temporarily place tiles
        console.log("Placing tiles temporarily on board");
        for (const m of this.tempMoves) this.board[m.r][m.c] = { letter: m.letter, isJoker: m.isJoker, temp: true };

        const { isValid, turnScore, invalidWords } = this.evaluateBoardState();

        console.log("evaluateBoardState results:", { isValid, turnScore, invalidWords });

        if (!isValid) {
            console.log("ERROR: Invalid words found");
            for (const m of this.tempMoves) this.board[m.r][m.c] = null; // Revert
            window.arcade.showToast(`Mots invalides : ${invalidWords.join(', ')}`);
            return;
        }

        // 4. Commit Move
        console.log("=== Move is VALID ===");
        this.firstMove = false;
        for (const m of this.tempMoves) {
            this.board[m.r][m.c].temp = false;
        }

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
        console.log("=== BEGIN evaluateBoardState ===");
        let turnScore = 0;
        let invalidWords = [];
        let wordsFormed = 0;

        const getTileNode = (r, c) => this.board[r][c];
        const processedOrigins = new Set(); // Prevent double counting words

        // Check horizontal and vertical words formed by newly placed tiles
        for (const m of this.tempMoves) {
            console.log(`Checking temp tile at ${m.r},${m.c} (${m.letter})`);
            // Horizontal sweep
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
                    if (tile.temp) { // Apply bonuses only on new tiles
                        const bonus = this.bonuses[`${m.r},${currC}`];
                        if (bonus === 'dl') letterVal *= 2;
                        if (bonus === 'tl') letterVal *= 3;
                        if (bonus === 'dw' || bonus === 'star') wordMultiplier *= 2;
                        if (bonus === 'tw') wordMultiplier *= 3;
                    }
                    wordBaseScore += letterVal;
                    currC++;
                }

                console.log(`Horizontal sweep at ${hOrigin}: word='${wordStr}', length=${length}`);
                if (length > 1) {
                    if (!this.dictionary.has(wordStr)) {
                        console.log(`Word '${wordStr}' NOT in dictionary.`);
                        invalidWords.push(wordStr);
                    } else {
                        console.log(`Word '${wordStr}' OK. Score +${wordBaseScore * wordMultiplier}`);
                    }
                    turnScore += (wordBaseScore * wordMultiplier);
                    wordsFormed++;
                    processedOrigins.add(hOrigin);
                }
            }

            // Vertical sweep
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
                        if (bonus === 'dl') letterVal *= 2;
                        if (bonus === 'tl') letterVal *= 3;
                        if (bonus === 'dw' || bonus === 'star') wordMultiplier *= 2;
                        if (bonus === 'tw') wordMultiplier *= 3;
                    }
                    wordBaseScore += letterVal;
                    currR++;
                }

                console.log(`Vertical sweep at ${vOrigin}: word='${wordStr}', length=${length}`);
                if (length > 1) {
                    if (!this.dictionary.has(wordStr)) {
                        console.log(`Word '${wordStr}' NOT in dictionary.`);
                        invalidWords.push(wordStr);
                    } else {
                        console.log(`Word '${wordStr}' OK. Score +${wordBaseScore * wordMultiplier}`);
                    }
                    turnScore += (wordBaseScore * wordMultiplier);
                    wordsFormed++;
                    processedOrigins.add(vOrigin);
                }
            }
        }

        // Disconnected tiles check (holes in placement)
        if (wordsFormed === 0 && this.tempMoves.length > 0) {
            console.log("No valid words formed (length>1). Isolated/too short placement.");
            // Can happen if placing 1 tile that creates no words (meaning length 1 in both dirs)
            // But if it's first move, len > 1 is required
            invalidWords.push("[Mot trop court / Isolé]");
        }

        console.log("=== END evaluateBoardState ===");
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
        // Find all possible words the AI can form
        const possibleMoves = this.findAllValidAiMoves();

        if (possibleMoves.length > 0) {
            // Sort by score descending
            possibleMoves.sort((a, b) => b.score - a.score);

            // Difficulty logic (MVP: always take the best move)
            const chosenMove = possibleMoves[0];

            this.tempMoves = chosenMove.placements;
            const { turnScore } = this.evaluateBoardState();

            // Commit AI Move
            for (const m of this.tempMoves) {
                this.board[m.r][m.c] = { letter: m.letter, isJoker: m.isJoker, temp: false };
                // Remove used letters from AI rack
                const rackIdx = this.aiRack.indexOf(m.isJoker ? '?' : m.letter);
                if (rackIdx > -1) this.aiRack.splice(rackIdx, 1);
            }
            this.firstMove = false;

            let finalScore = turnScore;
            if (this.tempMoves.length === 7) finalScore += 50;

            this.aiScore += finalScore;
            this.tempMoves = [];
            this.fillAiRack();
            this.updateStats();
            this.renderBoard();
            window.arcade.showToast(`L'IA joue "${chosenMove.word}" pour ${finalScore} pts`);
        } else {
            // Swap tiles if bag has enough, else pass
            if (this.bag.length >= 7) {
                this.bag.push(...this.aiRack);
                this.shuffle(this.bag);
                this.aiRack = [];
                this.fillAiRack();
                window.arcade.showToast(`L'IA a échangé ses lettres`);
            } else {
                window.arcade.showToast(`L'IA a passé son tour`);
            }
        }

        this.checkEndGame();
        if (!this.isGameOver) this.switchTurn();
    }

    findAllValidAiMoves() {
        // Simplified Brute-force for MVP: Try putting words from the rack on open anchors
        // A full GADDAG/Trie traversal is complex to implement fully here.
        // We will scan each row/col, find contiguous empty spaces crossing at least one existing letter (or center).
        const validMoves = [];
        const isRackEmpty = this.aiRack.length === 0;
        if (isRackEmpty) return validMoves;

        // Generate all permutations of rack to form words (limited length to avoid hanging)
        // For browser perf, we will instead iterate the dictionary and see if we can form it.
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
                    return null; // Cannot form
                }
            }
            return usedLetters;
        };

        // If first move, only 7,7 is anchor
        const anchors = [];
        if (this.firstMove) {
            anchors.push({ r: 7, c: 7 });
        } else {
            for (let r = 0; r < 15; r++) {
                for (let c = 0; c < 15; c++) {
                    if (this.board[r][c]) {
                        // Add adjacent empty spaces as anchors
                        [[r + 1, c], [r - 1, c], [r, c + 1], [r, c - 1]].forEach(([nr, nc]) => {
                            if (nr >= 0 && nr < 15 && nc >= 0 && nc < 15 && !this.board[nr][nc]) {
                                anchors.push({ r: nr, c: nc });
                            }
                        });
                    }
                }
            }
        }

        // Extremely simplified AI approach: Try to place single letters or short words adjacent to existing
        // This is a placeholder to keep browser from freezing while providing a functional opponent.

        const aiLetters = this.aiRack.map(l => l === '?' ? '' : l).join(''); // simple heuristic: use only real letters for word check
        const hasJoker = this.aiRack.includes('?');

        // Iterate through anchors checking what words we could form
        // We will scan dictionary words that contain at least one letter we can place on an anchor
        // For performance, we'll limit the search drastically. A real Scrabble AI uses a GADDAG or Trie generation.
        // We have a Trie! We can do a recursive search from anchors.

        // AI Logic:
        // 1. Find all "anchors" (empty squares adjacent to filled squares, plus the center if first move).
        // 2. For each anchor, try extending horizontally and vertically.
        // Due to browser performance constraints, we'll do a simpler heuristic:
        // Find existing letters on the board. Try to prepend or append rack letters to them.

        const tryPlacements = (r, c, dRow, dCol, availableRack, currentWord, placements, isPrefix) => {
            // simplified naive back-tracking for browser
        };

        // Simplified better Brute-force for browser:
        // 1. Identify all sequences of letters currently on the board (rows and cols).
        //    (e.g., if "HELLO" is on the board).
        // 2. Try to add 1 to 5 letters from the rack to the beginning or end of these sequences.

        const MAX_AI_CHECKS = 1000;
        let checks = 0;

        for (const anchor of anchors) {
            if (checks > MAX_AI_CHECKS) break;

            for (let dir = 0; dir < 2; dir++) { // 0: Horiz, 1: Vert
                const dr = dir === 1 ? 1 : 0;
                const dc = dir === 0 ? 1 : 0;

                // Try placing 1 to AI rack length letters starting at this anchor
                for (let len = 1; len <= this.aiRack.length; len++) {
                    // Get permutations of rack of length `len`
                    const perms = this.getRackPermutations(len);
                    for (const perm of perms) {
                        checks++;
                        if (checks > MAX_AI_CHECKS) break;

                        this.tempMoves = [];
                        let isValidPlacement = true;
                        let pr = anchor.r;
                        let pc = anchor.c;

                        for (let i = 0; i < len; i++) {
                            // Skip over already placed tiles
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
                            if (isValid) {
                                // To avoid duplicate identical words, we stringify tempMoves
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

                        // Revert
                        for (const m of this.tempMoves) {
                            this.board[m.r][m.c] = null;
                        }
                    }
                }
            }
        }

        // Disable console logs temporarily
        const origLog = console.log;
        console.log = () => { };

        // Restore logs after
        // console.log = origLog;

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
            // Use a Set to avoid duplicate permutations at this depth
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
        if (this.bag.length === 0 && (this.playerRack.length === 0 || this.aiRack.length === 0)) {
            this.isGameOver = true;

            // Deduct remaining tile values
            let pPenalty = 0;
            for (const l of this.playerRack) pPenalty += (l === '?' ? 0 : this.letterData[l].v);

            let aPenalty = 0;
            for (const l of this.aiRack) aPenalty += (l === '?' ? 0 : this.letterData[l].v);

            this.playerScore -= pPenalty;
            this.aiScore -= aPenalty;

            // Bonus to the one who finished first
            if (this.playerRack.length === 0) this.playerScore += aPenalty;
            if (this.aiRack.length === 0) this.aiScore += pPenalty;

            this.updateStats();

            const pWon = this.playerScore > this.aiScore;
            setTimeout(() => {
                window.arcade.showToast(pWon ? 'Vous avez gagné !' : 'L\'IA a gagné...', 5000);
            }, 1000);
        }
    }
}

class TrieNode {
    constructor() {
        this.children = {};
        this.isEndOfWord = false;
    }
}
