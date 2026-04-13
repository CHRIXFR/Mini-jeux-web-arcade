/**
 * Jeu de Paires (Memory)
 */

window.initPaires = function (container) {
    const game = new PairesGame(container);
    game.showStartScreen();
}

class PairesGame {
    constructor(container) {
        this.container = container;
        this.difficulty = 'easy'; // faciles, moyen, difficile
        this.cards = [];
        this.flippedCards = [];
        this.matchedPairs = 0;
        this.moves = 0;
        this.timer = 0;
        this.timerInterval = null;
        this.isLocked = false;

        this.emojis = [
            '🍎', '🍌', '🍒', '🍇', '🍉', '🍓', '🍍', '🥝',
            '🥑', '🥥', '🥦', '🥕', '🌽', '🥔', '🍄', '🥜',
            '🌰', '🍞', '🥨', '🧀', '🥩', '🍗', '🍔', '🍟',
            '🍕', '🌮', '🍣', '🍦', '🍩', '🍫', '🍭', '🍮',
            '🍯', '🍰'
        ];
    }

    showStartScreen() {
        const self = this;
        this.renderLayout();
        window.arcade.showStartModal({
            title: 'Jeu de Paires',
            icon: '🃏',
            description: 'Exercez votre mémoire en trouvant toutes les paires d\'emojis.',
            controls: [
                { icon: '👆', desktop: 'Retournez deux cartes pour trouver les paires', mobile: 'Touchez deux cartes pour trouver les paires' }
            ],
            difficulty: {
                options: [
                    { value: 'easy', label: 'Facile (4x3)' },
                    { value: 'medium', label: 'Moyen (4x4)' },
                    { value: 'hard', label: 'Difficile (6x6)' }
                ],
                default: 'easy'
            },
            onStart: function (diff) {
                self.difficulty = diff || 'easy';
                const select = document.getElementById('pa-diff-select');
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

    renderLayout() {
        this.container.innerHTML = `
            <div class="pa-game-container">
                <div id="pa-topbar"></div>
                <div class="pa-header">
                    <div class="pa-stats">
                        <div class="pa-stat-item">
                            <span class="pa-stat-label">Essais</span>
                            <span id="pa-moves" class="pa-stat-value">0</span>
                        </div>
                    </div>
                    <div class="pa-controls">
                        <button id="pa-btn-new" class="btn-secondary">Nouveau</button>
                    </div>
                </div>
                <div id="pa-grid" class="pa-grid"></div>
            </div>
        `;

        window.arcade.renderGameTopbar('#pa-topbar', {
            id: 'paires-topbar',
            icon: '🃏',
            title: 'Jeu de Paires',
            statLabel: 'Temps',
            statValue: this.formatTime(this.timer),
            difficulty: {
                selectId: 'pa-diff-select',
                value: this.difficulty,
                options: [
                    { value: 'easy', label: 'Facile (4x3)' },
                    { value: 'medium', label: 'Moyen (4x4)' },
                    { value: 'hard', label: 'Difficile (6x6)' }
                ],
                onChange: (newDiff) => {
                    this.difficulty = newDiff;
                    this.newGame();
                }
            }
        });

        document.getElementById('pa-btn-new').onclick = () => this.newGame();
    }

    newGame() {
        this.flippedCards = [];
        this.matchedPairs = 0;
        this.moves = 0;
        this.timer = 0;
        this.isLocked = false;
        clearInterval(this.timerInterval);

        this.updateStats();
        this.generateCards();
        this.renderGrid();

        this.timerInterval = setInterval(() => {
            this.timer++;
            this.updateTimerDisplay();
        }, 1000);
    }

    generateCards() {
        let rows, cols;
        if (this.difficulty === 'easy') { rows = 3; cols = 4; }
        else if (this.difficulty === 'medium') { rows = 4; cols = 4; }
        else { rows = 6; cols = 6; }

        const totalCards = rows * cols;
        const pairCount = totalCards / 2;

        // Sélectionner des emojis aléatoires
        const selectedEmojis = [...this.emojis]
            .sort(() => Math.random() - 0.5)
            .slice(0, pairCount);

        // Doubler pour créer les paires
        const cardValues = [...selectedEmojis, ...selectedEmojis]
            .sort(() => Math.random() - 0.5);

        this.cards = cardValues.map((value, index) => ({
            id: index,
            value: value,
            isFlipped: false,
            isMatched: false
        }));

        this.gridSize = { rows, cols };
    }

    renderGrid() {
        const gridEl = document.getElementById('pa-grid');
        gridEl.innerHTML = '';
        gridEl.style.gridTemplateColumns = `repeat(${this.gridSize.cols}, 1fr)`;

        // Ajuster la taille des cartes selon la difficulté
        const cardClass = this.difficulty === 'hard' ? 'pa-card-small' : '';

        this.cards.forEach(card => {
            const cardEl = document.createElement('div');
            cardEl.className = `pa-card ${cardClass}`;
            cardEl.dataset.id = card.id;

            cardEl.innerHTML = `
                <div class="pa-card-inner">
                    <div class="pa-card-front">?</div>
                    <div class="pa-card-back">${card.value}</div>
                </div>
            `;

            cardEl.onclick = () => this.flipCard(card, cardEl);
            gridEl.appendChild(cardEl);
        });
    }

    flipCard(card, cardEl) {
        if (this.isLocked || card.isFlipped || card.isMatched || this.flippedCards.length >= 2) return;

        card.isFlipped = true;
        cardEl.classList.add('flipped');
        this.flippedCards.push({ card, el: cardEl });

        if (this.flippedCards.length === 2) {
            this.moves++;
            this.updateStats();
            this.checkMatch();
        }
    }

    checkMatch() {
        const [c1, c2] = this.flippedCards;
        this.isLocked = true;

        if (c1.card.value === c2.card.value) {
            // Match !
            setTimeout(() => {
                c1.el.classList.add('matched');
                c2.el.classList.add('matched');
                c1.card.isMatched = true;
                c2.card.isMatched = true;
                this.matchedPairs++;
                this.flippedCards = [];
                this.isLocked = false;
                this.checkWin();
            }, 500);
        } else {
            // Pas de match
            setTimeout(() => {
                c1.el.classList.remove('flipped');
                c2.el.classList.remove('flipped');
                c1.card.isFlipped = false;
                c2.card.isFlipped = false;
                this.flippedCards = [];
                this.isLocked = false;
            }, 1000);
        }
    }

    checkWin() {
        if (this.matchedPairs === this.cards.length / 2) {
            clearInterval(this.timerInterval);

            setTimeout(() => {
                this.showWinModal();
            }, 500);
        }
    }

    showWinModal() {
        const self = this;
        window.arcade.showGameOverModal({
            title: 'paires',
            gameStatus: 'Bravo !',
            icon: '🎉',
            stats: [
                { label: 'Essais', value: this.moves },
                { label: 'Temps', value: this.formatTime(this.timer) },
                { label: 'Difficulté', value: { 'easy': 'Facile', 'medium': 'Moyen', 'hard': 'Difficile' }[this.difficulty] }
            ],
            score: this.timer,
            scoreType: 'time',
            onReplay: function () { self.newGame(); },
            onQuit: function () { window.arcade.renderHome(); }
        });
    }

    updateStats() {
        document.getElementById('pa-moves').textContent = this.moves;
    }

    updateTimerDisplay() {
        window.arcade.updateGameTopbarStat('paires-topbar', this.formatTime(this.timer));
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
}
