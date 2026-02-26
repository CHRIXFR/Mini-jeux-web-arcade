/**
 * Le Pendu - Modèle Arcade
 */

window.initHangman = function (container) {
    const game = new HangmanGame(container);
    game.start();
};

class HangmanGame {
    constructor(container) {
        this.container = container;
        this.words = [
            "AVENTURE", "BALEINE", "CHOCOLAT", "DAUPHIN", "ELEPHANT",
            "FROMAGE", "GUITARE", "HORLOGE", "IGLOO", "JARDIN",
            "KANGOUROU", "LUMIERE", "MONTAGNE", "NUAGE", "ORANGE",
            "PAPILLON", "QUARTIER", "REQUIN", "SOLEIL", "TORTUE",
            "UNIVERS", "VOITURE", "WAGON", "XYLOPHONE", "YAOURT", "ZEBRE"
        ];
        this.fullDictionary = [];
        this.isDictionaryLoaded = false;
        this.word = "";
        this.guessedLetters = new Set();
        this.wrongGuesses = 0;
        this.maxWrong = 9;
        this.isGameOver = false;
    }

    async start() {
        this.guessedLetters.clear();
        this.wrongGuesses = 0;
        this.isGameOver = false;

        this.renderLayout();

        // Désactiver le clavier et le bouton de réinitialisation pendant le chargement
        const btnReset = document.getElementById('hg-btn-reset');
        if (btnReset) btnReset.disabled = true;
        document.querySelectorAll('.hg-key').forEach(k => k.disabled = true);

        await this.loadDictionary();

        const dict = (this.isDictionaryLoaded && this.fullDictionary.length > 0) ? this.fullDictionary : this.words;
        this.word = dict[Math.floor(Math.random() * dict.length)];

        this.renderKeyboard();
        if (btnReset) btnReset.disabled = false;

        this.updateWordDisplay();
        this.updateDrawing();
    }

    async loadDictionary() {
        if (this.isDictionaryLoaded) return;
        try {
            const btn = document.getElementById('hg-btn-reset');
            if (btn) btn.textContent = "Chargement dico...";

            const text = await window.arcade.dictionaryCache.getRaw();
            const words = text.split(/\r?\n/);

            this.fullDictionary = [];
            for (let word of words) {
                word = word.trim().toUpperCase();
                // Filtrer les mots : longueur entre 5 et 10, caractères A-Z uniquement
                if (word.length >= 5 && word.length <= 10 && /^[A-Z]+$/.test(word)) {
                    this.fullDictionary.push(word);
                }
            }
            this.isDictionaryLoaded = true;
            if (btn) btn.textContent = "Nouveau Mot";
        } catch (error) {
            console.error("Erreur chargement dico:", error);
            const btn = document.getElementById('hg-btn-reset');
            if (btn) btn.textContent = "Nouveau Mot";
        }
    }

    renderLayout() {
        this.container.innerHTML = `
            <div class="hg-game-container">
                <div class="hg-drawing-container">
                    <div class="hg-part hg-gallows-v" data-step="1"></div>
                    <div class="hg-part hg-gallows-h" data-step="2"></div>
                    <div class="hg-part hg-rope" data-step="3"></div>
                    <div class="hg-part hg-head" data-step="4"></div>
                    <div class="hg-part hg-body" data-step="5"></div>
                    <div class="hg-part hg-arm-l" data-step="6"></div>
                    <div class="hg-part hg-arm-r" data-step="7"></div>
                    <div class="hg-part hg-leg-l" data-step="8"></div>
                    <div class="hg-part hg-leg-r" data-step="9"></div>
                </div>

                <div id="hg-word" class="hg-word-display"></div>

                <div id="hg-keyboard" class="hg-keyboard"></div>

                <div class="scr-controls" style="margin-top: 2rem;">
                    <button id="hg-btn-reset" class="btn-secondary">Nouveau Mot</button>
                </div>
            </div>
        `;

        this.renderKeyboard();
        document.getElementById('hg-btn-reset').onclick = () => this.start();
    }

    renderKeyboard() {
        const keyboardEl = document.getElementById('hg-keyboard');
        const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        keyboardEl.innerHTML = alphabet.split('').map(letter => `
            <button class="hg-key" data-letter="${letter}">${letter}</button>
        `).join('');

        keyboardEl.querySelectorAll('.hg-key').forEach(btn => {
            btn.onclick = () => this.handleGuess(btn.dataset.letter);
        });
    }

    handleGuess(letter) {
        if (this.isGameOver || this.guessedLetters.has(letter)) return;

        this.guessedLetters.add(letter);
        const btn = document.querySelector(`.hg-key[data-letter="${letter}"]`);
        btn.disabled = true;

        if (this.word.includes(letter)) {
            btn.classList.add('correct');
            this.updateWordDisplay();
            this.checkWin();
        } else {
            btn.classList.add('wrong');
            this.wrongGuesses++;
            this.updateDrawing();
            this.checkLoss();
        }
    }

    updateWordDisplay() {
        const wordEl = document.getElementById('hg-word');
        wordEl.innerHTML = this.word.split('').map(letter => `
            <div class="hg-letter-slot">${this.guessedLetters.has(letter) ? letter : ""}</div>
        `).join('');
    }

    updateDrawing() {
        for (let i = 1; i <= this.maxWrong; i++) {
            const part = document.querySelector(`.hg-part[data-step="${i}"]`);
            if (part) {
                if (i <= this.wrongGuesses) {
                    part.classList.add('visible');
                } else {
                    part.classList.remove('visible');
                }
            }
        }
    }

    checkWin() {
        const isWon = this.word.split('').every(letter => this.guessedLetters.has(letter));
        if (isWon) {
            this.isGameOver = true;
            const xp = 20;
            window.arcade.addXP(xp);
            setTimeout(() => {
                window.arcade.showToast(`Gagné ! +${xp} XP`);
                this.showEndModal(true);
            }, 500);
        }
    }

    checkLoss() {
        if (this.wrongGuesses >= this.maxWrong) {
            this.isGameOver = true;
            setTimeout(() => {
                window.arcade.showToast(`Perdu... Le mot était ${this.word}`);
                this.showEndModal(false);
            }, 500);
        }
    }

    showEndModal(win) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <h2>${win ? "Félicitations !" : "Dommage..."}</h2>
                <p>${win ? "Vous avez trouvé le mot." : `Le mot secret était : <strong>${this.word}</strong>`}</p>
                <div class="modal-actions">
                    <button id="hg-btn-restart" class="btn-primary">Rejouer</button>
                    <button id="hg-btn-quit" class="btn-secondary">Menu Principal</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        document.getElementById('hg-btn-restart').onclick = () => { modal.remove(); this.start(); };
        document.getElementById('hg-btn-quit').onclick = () => { modal.remove(); window.arcade.renderHome(); };
    }
}
