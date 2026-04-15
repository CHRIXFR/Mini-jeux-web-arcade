(function () {
    const FILES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'];

    const PIECE_UNICODE = {
        K: '♔',
        Q: '♕',
        R: '♖',
        B: '♗',
        N: '♘',
        P: '♙',
        k: '♚',
        q: '♛',
        r: '♜',
        b: '♝',
        n: '♞',
        p: '♟'
    };

    const AI_LEVEL_MAP = {
        easy: 0,
        medium: 1,
        hard: 2
    };

    class EchecsGame {
        constructor(container) {
            this.container = container;
            this.engineLib = window.jsChessEngine || window['js-chess-engine'];
            this.mode = 'local';
            this.aiLevel = 'medium';
            this.selectedSquare = null;
            this.legalTargets = [];
            this.lastMove = null;
            this.history = [];
            this.fenStack = [];
            this.aiThinking = false;
            this.aiTimer = null;
            this.finished = false;
            this.finishReason = null;
            this.statusText = 'Prêt à lancer une partie d\'échecs.';

            this.renderLayout();
            this.bindEvents();
            this.renderTopbar();
        }

        renderLayout() {
            this.container.innerHTML = `
                <div class="ec-game-container">
                    <section class="ec-main glass-panel">
                        <div id="ec-topbar"></div>
                        <div id="ec-status" class="ec-status">Prêt à lancer une partie d'échecs.</div>
                        <div id="ec-board" class="ec-board" role="grid" aria-label="Échiquier"></div>
                    </section>

                    <aside class="ec-side card">
                        <h3>Historique</h3>
                        <ol id="ec-history" class="ec-history-list"></ol>

                        <div class="ec-actions">
                            <button id="ec-btn-undo" class="btn-secondary">Annuler</button>
                            <button id="ec-btn-restart" class="btn-secondary">Rejouer</button>
                            <button id="ec-btn-resign" class="btn-primary">Abandonner</button>
                        </div>

                        <p class="ec-help-note">
                            Mode local: jouez à tour de rôle sur le même appareil.<br>
                            Mode IA: vous jouez les Blancs.
                        </p>
                    </aside>
                </div>
            `;

            this.topbarMount = this.container.querySelector('#ec-topbar');
            this.statusNode = this.container.querySelector('#ec-status');
            this.boardNode = this.container.querySelector('#ec-board');
            this.historyNode = this.container.querySelector('#ec-history');
            this.undoBtn = this.container.querySelector('#ec-btn-undo');
            this.restartBtn = this.container.querySelector('#ec-btn-restart');
            this.resignBtn = this.container.querySelector('#ec-btn-resign');
        }

        bindEvents() {
            this.onBoardClick = (event) => {
                const squareBtn = event.target.closest('.ec-square');
                if (!squareBtn || !squareBtn.dataset.square) return;
                this.handleSquareClick(squareBtn.dataset.square);
            };

            this.onUndo = () => this.undoMove();
            this.onRestart = () => this.showStartScreen();
            this.onResign = () => this.resignGame();

            this.boardNode.addEventListener('click', this.onBoardClick);
            this.undoBtn.addEventListener('click', this.onUndo);
            this.restartBtn.addEventListener('click', this.onRestart);
            this.resignBtn.addEventListener('click', this.onResign);
        }

        stop() {
            this.clearAiTimer();
            if (this.boardNode) this.boardNode.removeEventListener('click', this.onBoardClick);
            if (this.undoBtn) this.undoBtn.removeEventListener('click', this.onUndo);
            if (this.restartBtn) this.restartBtn.removeEventListener('click', this.onRestart);
            if (this.resignBtn) this.resignBtn.removeEventListener('click', this.onResign);
        }

        showStartScreen() {
            const self = this;
            window.arcade.showStartModal({
                title: 'Échecs',
                icon: '♟️',
                description: 'Affrontez un autre joueur local ou une IA à 3 niveaux.',
                controls: [
                    { icon: '🖱️', desktop: 'Cliquez une pièce puis une case cible', mobile: 'Touchez une pièce puis une case cible' },
                    { icon: '↩️', desktop: 'Annuler disponible en mode local', mobile: 'Annuler disponible en mode local' }
                ],
                difficulty: {
                    options: [
                        { value: 'local', label: '👥 Local 2 joueurs' },
                        { value: 'ai-easy', label: '🤖 IA Facile' },
                        { value: 'ai-medium', label: '🤖 IA Moyenne' },
                        { value: 'ai-hard', label: '🤖 IA Difficile' }
                    ],
                    default: 'ai-medium'
                },
                onStart: function (selected) {
                    self.applyStartSelection(selected || 'ai-medium');
                },
                onQuit: function () {
                    window.arcade.renderHome();
                }
            });
        }

        applyStartSelection(selection) {
            if (selection === 'local') {
                this.mode = 'local';
                this.aiLevel = 'medium';
            } else {
                this.mode = 'ai';
                if (selection === 'ai-easy') this.aiLevel = 'easy';
                else if (selection === 'ai-hard') this.aiLevel = 'hard';
                else this.aiLevel = 'medium';
            }
            this.startNewGame();
        }

        startNewGame() {
            if (!this.engineLib || !this.engineLib.Game) {
                this.setStatus('Erreur: moteur d\'échecs introuvable.');
                return;
            }

            this.clearAiTimer();
            this.game = new this.engineLib.Game();
            this.selectedSquare = null;
            this.legalTargets = [];
            this.lastMove = null;
            this.history = [];
            this.finished = false;
            this.finishReason = null;
            this.aiThinking = false;
            this.fenStack = [this.game.exportFEN()];
            this.setStatus(this.mode === 'local'
                ? 'Mode local: les Blancs commencent.'
                : `Mode IA (${this.getAiLevelLabel()}): à vous de jouer avec les Blancs.`);

            this.renderTopbar();
            this.renderAll();
            this.queueAiIfNeeded();
        }

        renderTopbar() {
            const difficultyConfig = this.mode === 'ai'
                ? {
                    value: this.aiLevel,
                    options: [
                        { value: 'easy', label: 'Facile' },
                        { value: 'medium', label: 'Moyen' },
                        { value: 'hard', label: 'Difficile' }
                    ],
                    onChange: (value) => {
                        this.aiLevel = this.normalizeAiLevel(value);
                        this.renderTopbar();
                        this.renderStatusAndControls();
                    }
                }
                : null;

            window.arcade.renderGameTopbar(this.topbarMount, {
                id: 'echecs-topbar',
                icon: '♟️',
                title: 'Échecs',
                statLabel: 'Statut',
                statValue: this.getTopbarStat(),
                difficulty: difficultyConfig
            });
        }

        getTopbarStat() {
            if (!this.game) return 'Prêt';
            const turnLabel = this.getTurnLabel(this.game.exportJson().turn);
            const modeLabel = this.mode === 'ai' ? `IA ${this.getAiLevelLabel()}` : 'Local 2 joueurs';
            const thinkLabel = this.aiThinking ? ' • IA réfléchit...' : '';
            return `${modeLabel} • Trait: ${turnLabel} • Coups: ${this.history.length}${thinkLabel}`;
        }

        getAiLevelLabel() {
            if (this.aiLevel === 'easy') return 'Facile';
            if (this.aiLevel === 'hard') return 'Difficile';
            return 'Moyen';
        }

        getTurnLabel(turn) {
            return turn === 'black' ? 'Noirs' : 'Blancs';
        }

        setStatus(message) {
            this.statusText = message;
            if (this.statusNode) this.statusNode.textContent = message;
        }

        renderStatusAndControls() {
            if (!this.game) return;
            window.arcade.updateGameTopbarStat('echecs-topbar', this.getTopbarStat());
            this.undoBtn.disabled = !(this.mode === 'local' && this.fenStack.length > 1 && !this.finished && !this.aiThinking);
            this.resignBtn.disabled = this.finished || this.aiThinking;
        }

        renderAll() {
            this.renderBoard();
            this.renderHistory();
            this.renderStatusAndControls();
        }

        renderBoard() {
            if (!this.game) return;
            const state = this.game.exportJson();
            const pieces = state.pieces || {};
            const legalSet = new Set(this.legalTargets);

            const boardHTML = RANKS.map((rank, rankIdx) => {
                return FILES.map((file, fileIdx) => {
                    const square = `${file}${rank}`;
                    const piece = pieces[square] || '';
                    const isLight = (rankIdx + fileIdx) % 2 === 1;
                    const classes = ['ec-square', isLight ? 'light' : 'dark'];
                    if (square === this.selectedSquare) classes.push('is-selected');
                    if (legalSet.has(square)) classes.push('is-legal-target');
                    if (this.lastMove && (square === this.lastMove.from || square === this.lastMove.to)) classes.push('is-last-move');
                    if (piece && this.canSelectSquare(square)) classes.push('is-selectable');

                    const pieceColor = piece ? (piece === piece.toUpperCase() ? 'white' : 'black') : '';
                    const pieceHTML = piece
                        ? `<span class="ec-piece ${pieceColor}" aria-hidden="true">${PIECE_UNICODE[piece] || piece}</span>`
                        : `<span class="ec-piece-empty" aria-hidden="true"></span>`;

                    return `
                        <button class="${classes.join(' ')}" data-square="${square}" role="gridcell" aria-label="${this.getSquareAriaLabel(square, piece)}">
                            <span class="ec-coordinate-file">${rank === '1' ? file.toLowerCase() : ''}</span>
                            <span class="ec-coordinate-rank">${file === 'A' ? rank : ''}</span>
                            ${pieceHTML}
                        </button>
                    `;
                }).join('');
            }).join('');

            this.boardNode.innerHTML = boardHTML;
        }

        getSquareAriaLabel(square, piece) {
            if (!piece) return `Case ${square}`;
            const color = piece === piece.toUpperCase() ? 'blanche' : 'noire';
            const labels = {
                K: 'Roi', Q: 'Dame', R: 'Tour', B: 'Fou', N: 'Cavalier', P: 'Pion',
                k: 'Roi', q: 'Dame', r: 'Tour', b: 'Fou', n: 'Cavalier', p: 'Pion'
            };
            return `${labels[piece] || 'Pièce'} ${color} en ${square}`;
        }

        renderHistory() {
            if (!this.historyNode) return;
            if (this.history.length === 0) {
                this.historyNode.innerHTML = '<li class="ec-history-empty">Aucun coup joué.</li>';
                return;
            }

            this.historyNode.innerHTML = this.history.map((entry, index) => {
                const moveNo = index + 1;
                return `<li><span class="ec-history-index">${moveNo}.</span> <span>${entry}</span></li>`;
            }).join('');
        }

        handleSquareClick(square) {
            if (!this.game || this.finished || this.aiThinking) return;

            const currentTurn = this.game.exportJson().turn;
            if (this.mode === 'ai' && currentTurn === 'black') return;

            if (this.selectedSquare && this.legalTargets.includes(square)) {
                this.playMove(this.selectedSquare, square);
                return;
            }

            if (!this.canSelectSquare(square)) {
                this.selectedSquare = null;
                this.legalTargets = [];
                this.renderAll();
                return;
            }

            this.selectedSquare = square;
            this.legalTargets = this.getLegalMovesFrom(square);
            this.renderAll();
        }

        canSelectSquare(square) {
            if (!this.game) return false;
            const piece = this.game.exportJson().pieces[square];
            if (!piece) return false;
            const turn = this.game.exportJson().turn;
            const pieceIsWhite = piece === piece.toUpperCase();
            if (turn === 'white' && !pieceIsWhite) return false;
            if (turn === 'black' && pieceIsWhite) return false;
            if (this.mode === 'ai' && turn === 'black') return false;
            return true;
        }

        getLegalMovesFrom(square) {
            if (!this.game) return [];
            try {
                const moves = this.game.moves(square.toUpperCase());
                return Array.isArray(moves) ? moves.slice() : [];
            } catch (_err) {
                return [];
            }
        }

        playMove(from, to) {
            if (!this.game || this.finished) return false;
            const fromSq = String(from || '').toUpperCase();
            const toSq = String(to || '').toUpperCase();
            const before = this.game.exportJson();
            const movingPiece = before.pieces[fromSq];
            const capturedPiece = before.pieces[toSq] || null;

            if (!movingPiece) return false;

            try {
                this.game.move(fromSq, toSq);
            } catch (_err) {
                this.setStatus(`Coup illégal: ${fromSq} → ${toSq}`);
                this.selectedSquare = null;
                this.legalTargets = [];
                this.renderAll();
                return false;
            }

            this.lastMove = { from: fromSq, to: toSq };
            this.history.push(this.formatHistoryEntry(movingPiece, fromSq, toSq, capturedPiece));
            this.fenStack.push(this.game.exportFEN());
            this.selectedSquare = null;
            this.legalTargets = [];

            this.applyPostMoveState();
            return true;
        }

        formatHistoryEntry(piece, from, to, capturedPiece) {
            const pieceLabelMap = {
                K: 'R', Q: 'D', R: 'T', B: 'F', N: 'C', P: 'P',
                k: 'R', q: 'D', r: 'T', b: 'F', n: 'C', p: 'P'
            };
            const pieceLabel = pieceLabelMap[piece] || 'P';
            const captureSign = capturedPiece ? 'x' : '-';
            return `${pieceLabel} ${from}${captureSign}${to}`;
        }

        applyPostMoveState() {
            const state = this.game.exportJson();
            if (state.isFinished) {
                this.finishGame(state.checkMate ? 'checkmate' : 'stalemate');
                return;
            }

            const turnLabel = this.getTurnLabel(state.turn);
            this.setStatus(`Trait aux ${turnLabel}.`);
            this.renderAll();
            this.queueAiIfNeeded();
        }

        queueAiIfNeeded() {
            if (!this.game || this.finished || this.mode !== 'ai') return;
            const turn = this.game.exportJson().turn;
            if (turn !== 'black') return;

            this.clearAiTimer();
            this.aiThinking = true;
            this.setStatus(`IA (${this.getAiLevelLabel()}) réfléchit...`);
            this.renderStatusAndControls();

            this.aiTimer = setTimeout(() => {
                this.forceAiMove();
            }, 380);
        }

        forceAiMove() {
            if (!this.game || this.finished || this.mode !== 'ai') return false;
            if (this.game.exportJson().turn !== 'black') return false;

            const before = this.game.exportJson();
            try {
                this.game.aiMove(AI_LEVEL_MAP[this.aiLevel]);
            } catch (_err) {
                this.aiThinking = false;
                this.setStatus('Erreur IA: impossible de calculer un coup.');
                this.renderStatusAndControls();
                return false;
            }

            const after = this.game.exportJson();
            const move = this.detectMove(before.pieces, after.pieces);
            if (move) {
                this.lastMove = { from: move.from, to: move.to };
                this.history.push(this.formatHistoryEntry(move.piece, move.from, move.to, move.captured));
            } else {
                this.history.push('IA: coup joué');
            }

            this.fenStack.push(this.game.exportFEN());
            this.aiThinking = false;
            this.selectedSquare = null;
            this.legalTargets = [];

            if (after.isFinished) {
                this.finishGame(after.checkMate ? 'checkmate' : 'stalemate');
                return true;
            }

            this.setStatus('À vous de jouer (Blancs).');
            this.renderAll();
            return true;
        }

        detectMove(beforePieces, afterPieces) {
            let from = null;
            let to = null;
            let piece = null;
            let captured = null;

            Object.keys(beforePieces).forEach((sq) => {
                if (!afterPieces[sq] && (!from || beforePieces[sq] === beforePieces[sq].toLowerCase())) {
                    from = sq;
                    piece = beforePieces[sq];
                }
            });
            Object.keys(afterPieces).forEach((sq) => {
                if (beforePieces[sq] !== afterPieces[sq] && afterPieces[sq] === afterPieces[sq].toLowerCase()) {
                    to = sq;
                    if (beforePieces[sq]) captured = beforePieces[sq];
                }
            });

            if (!from || !to || !piece) return null;
            return { from, to, piece, captured };
        }

        undoMove() {
            if (!this.game || this.mode !== 'local' || this.finished || this.aiThinking) return;
            if (this.fenStack.length <= 1) return;

            this.fenStack.pop();
            const fen = this.fenStack[this.fenStack.length - 1];
            this.loadFenInternal(fen, true);
            if (this.history.length > 0) this.history.pop();
            this.lastMove = null;
            this.setStatus(`Trait aux ${this.getTurnLabel(this.game.exportJson().turn)}.`);
            this.renderAll();
        }

        resignGame() {
            if (!this.game || this.finished || this.aiThinking) return;
            const turn = this.game.exportJson().turn;
            const winner = turn === 'white' ? 'Noirs' : 'Blancs';
            this.finishReason = 'resign';
            this.finished = true;
            this.showEndModal(`Abandon — victoire des ${winner}`);
        }

        finishGame(reason) {
            if (this.finished) return;
            this.finished = true;
            this.finishReason = reason;

            if (reason === 'checkmate') {
                const turn = this.game.exportJson().turn;
                const winner = turn === 'white' ? 'Noirs' : 'Blancs';
                this.showEndModal(`Échec et mat — ${winner} gagnent`);
                return;
            }

            this.showEndModal('Pat — partie nulle');
        }

        showEndModal(statusText) {
            this.clearAiTimer();
            this.aiThinking = false;
            const self = this;
            const modeText = this.mode === 'ai' ? `IA (${this.getAiLevelLabel()})` : 'Local 2 joueurs';

            window.arcade.showGameOverModal({
                gameId: 'echecs',
                title: 'echecs',
                gameStatus: statusText,
                icon: '♟️',
                stats: [
                    { label: 'Mode', value: modeText },
                    { label: 'Coups joués', value: String(this.history.length) },
                    { label: 'Trait final', value: this.getTurnLabel(this.game.exportJson().turn) },
                    { label: 'État', value: this.finishReason === 'resign' ? 'Abandon' : (this.finishReason === 'checkmate' ? 'Échec et mat' : 'Pat') }
                ],
                score: this.history.length,
                scoreType: 'points',
                onReplay: function () {
                    self.showStartScreen();
                },
                onQuit: function () {
                    window.arcade.renderHome();
                }
            });
        }

        clearAiTimer() {
            if (this.aiTimer) {
                clearTimeout(this.aiTimer);
                this.aiTimer = null;
            }
        }

        normalizeAiLevel(level) {
            const normalized = String(level || 'medium').toLowerCase();
            if (normalized === 'easy' || normalized === 'hard' || normalized === 'medium') return normalized;
            if (normalized === '0' || normalized === '1') return 'easy';
            if (normalized === '3') return 'hard';
            return 'medium';
        }

        loadFenInternal(fen, keepHistory) {
            if (!this.engineLib || !this.engineLib.Game) return;
            this.clearAiTimer();
            this.aiThinking = false;
            this.finished = false;
            this.finishReason = null;
            this.selectedSquare = null;
            this.legalTargets = [];
            this.lastMove = null;
            this.game = new this.engineLib.Game(fen);
            if (!keepHistory) {
                this.history = [];
                this.fenStack = [this.game.exportFEN()];
            }
            this.renderTopbar();
            this.renderAll();
        }

        setMode(mode, level) {
            const normalizedMode = String(mode || '').toLowerCase() === 'ai' ? 'ai' : 'local';
            this.mode = normalizedMode;
            if (normalizedMode === 'ai') {
                this.aiLevel = this.normalizeAiLevel(level);
            }
            this.startNewGame();
        }

        loadFen(fen) {
            if (typeof fen !== 'string' || !fen.trim()) return;
            this.loadFenInternal(fen.trim(), false);
            this.setStatus(`Position chargée. Trait aux ${this.getTurnLabel(this.game.exportJson().turn)}.`);
            this.renderStatusAndControls();
        }

        getFen() {
            if (!this.game) return null;
            return this.game.exportFEN();
        }

        getState() {
            if (!this.game) {
                return {
                    mode: this.mode,
                    level: this.aiLevel,
                    status: 'not-started',
                    turn: 'white',
                    isFinished: false,
                    checkMate: false,
                    movesCount: 0,
                    fen: null
                };
            }
            const state = this.game.exportJson();
            return {
                mode: this.mode,
                level: this.aiLevel,
                status: this.finished ? 'finished' : (this.aiThinking ? 'ai-thinking' : 'playing'),
                turn: state.turn,
                isFinished: !!state.isFinished,
                checkMate: !!state.checkMate,
                movesCount: this.history.length,
                fen: this.game.exportFEN()
            };
        }
    }

    window.initEchecs = function (container) {
        const game = new EchecsGame(container);
        window._echecsGame = game;
        window.arcade.registerGameCleanup(() => game.stop(), 'echecs');
        game.showStartScreen();
    };
})();
