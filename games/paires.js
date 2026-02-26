/**
 * Jeu de Paires (Memory)
 */

window.initPaires = function (container) {
    const game = new PairesGame(container);
    game.start();
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

    start() {
        this.renderLayout();
        this.newGame();
    }

    renderLayout() {
        this.container.innerHTML = `
            <div class="pa-game-container">
                <div class="pa-header">
                    <h2>Jeu de Paires</h2>
                    <div class="pa-stats">
                        <div class="pa-stat-item">
                            <span class="pa-stat-label">Temps</span>
                            <span id="pa-timer" class="pa-stat-value">00:00</span>
                        </div>
                        <div class="pa-stat-item">
                            <span class="pa-stat-label">Essais</span>
                            <span id="pa-moves" class="pa-stat-value">0</span>
                        </div>
                    </div>
                    <div class="pa-controls">
                        <label for="pa-diff-select" class="sr-only">Difficulté</label>
                        <select id="pa-diff-select" class="diff-select">
                            <option value="easy">Facile (4x3)</option>
                            <option value="medium" selected>Moyen (4x4)</option>
                            <option value="hard">Difficile (6x6)</option>
                        </select>
                        <button id="pa-btn-new" class="btn-secondary">Nouveau</button>
                    </div>
                </div>
                <div id="pa-grid" class="pa-grid"></div>
            </div>
        `;

        document.getElementById('pa-btn-new').onclick = () => this.newGame();
        document.getElementById('pa-diff-select').onchange = (e) => {
            this.difficulty = e.target.value;
            this.newGame();
        };
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
            const xpGain = this.difficulty === 'easy' ? 15 : (this.difficulty === 'medium' ? 30 : 60);

            setTimeout(() => {
                this.showWinModal(xpGain);
            }, 500);
        }
    }

    showWinModal(xp) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <h2>Bravo !</h2>
                <p>Vous avez trouvé toutes les paires en ${this.moves} essais et ${this.formatTime(this.timer)}.</p>
                <div class="xp-bonus">+${xp} XP</div>
                <div class="modal-actions">
                    <button id="pa-btn-retry" class="btn-primary">Rejouer</button>
                    <button id="pa-btn-home" class="btn-secondary">Retour à l'accueil</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        document.getElementById('pa-btn-retry').onclick = () => {
            modal.remove();
            this.newGame();
        };
        document.getElementById('pa-btn-home').onclick = () => {
            modal.remove();
            window.arcade.addXP(xp);
            window.arcade.renderHome();
        };
    }

    updateStats() {
        document.getElementById('pa-moves').textContent = this.moves;
    }

    updateTimerDisplay() {
        document.getElementById('pa-timer').textContent = this.formatTime(this.timer);
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
}
