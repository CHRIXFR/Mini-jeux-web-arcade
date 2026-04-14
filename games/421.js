window.init421 = function (container) {
    const game = new Game421(container);
    window._d421Game = game;
    window.arcade.registerGameCleanup(() => game.stop(), '421');
    game.showStartScreen();
};

class Game421 {
    constructor(container) {
        this.container = container;
        this.maxRounds = 10;
        this.maxRolls = 3;
        this.targetScore = 30;

        this.players = [
            { name: 'Joueur 1', score: 0, count421: 0, roundsPlayed: 0, lastTurnScore: 0 },
            { name: 'Joueur 2', score: 0, count421: 0, roundsPlayed: 0, lastTurnScore: 0 }
        ];

        this.gameMode = 'solo';
        this.activePlayerIndex = 0;
        this.currentMatchRound = 1;
        this.isTieBreak = false;
        this.tieBreakRound = 0;
        this.tieBreakPairScores = [null, null];

        this.round = 1;
        this.rollsUsed = 0;
        this.totalScore = 0;
        this.count421 = 0;
        this.isPlaying = false;
        this.roundComplete = false;

        this.dice = [null, null, null];
        this.holds = [false, false, false];
        this.currentEvaluation = null;

        this.testDiceQueue = [];

        this.renderLayout();
        this.bindEvents();
        this.updateUI();
    }

    renderLayout() {
        this.container.innerHTML = `
            <div class="d421-game-container">
                <section class="d421-main glass-panel">
                    <div id="d421-topbar"></div>

                    <div id="d421-scoreboard" class="d421-scoreboard" aria-live="polite">
                        <div id="d421-player-0" class="d421-player-row">
                            <span class="d421-player-name">Joueur 1</span>
                            <span id="d421-player-score-0" class="d421-player-score">0 pts</span>
                        </div>
                        <div id="d421-player-1" class="d421-player-row">
                            <span class="d421-player-name">Joueur 2</span>
                            <span id="d421-player-score-1" class="d421-player-score">0 pts</span>
                        </div>
                        <div id="d421-tiebreak-badge" class="d421-tiebreak-badge" hidden>Tie-break en cours</div>
                    </div>

                    <div class="d421-dice-row" id="d421-dice-row">
                        <button id="d421-die-0" class="d421-die-btn control-btn" aria-label="Dé 1">•</button>
                        <button id="d421-die-1" class="d421-die-btn control-btn" aria-label="Dé 2">•</button>
                        <button id="d421-die-2" class="d421-die-btn control-btn" aria-label="Dé 3">•</button>
                    </div>

                    <div class="d421-roll-info">
                        <span id="d421-roll-counter">Lancers : 0/3</span>
                    </div>

                    <div class="d421-actions">
                        <button id="d421-roll-btn" class="btn-primary">Lancer</button>
                        <button id="d421-validate-btn" class="btn-secondary">Valider la manche</button>
                        <button id="d421-next-btn" class="btn-secondary">Manche suivante</button>
                    </div>

                    <div id="d421-round-feedback" class="d421-round-feedback">
                        Lancez les dés pour commencer la manche.
                    </div>
                </section>

                <aside class="d421-help card">
                    <h3>Table des points</h3>
                    <ul class="d421-help-list">
                        <li><strong>421</strong> : 10 pts</li>
                        <li><strong>111 (Mac 1)</strong> : 7 pts</li>
                        <li><strong>x11 (Fiche)</strong> : x pts</li>
                        <li><strong>xxx (Baraque)</strong> : x pts</li>
                        <li><strong>Suite</strong> : 2 pts</li>
                        <li><strong>Nénette (221)</strong> : 0 pt</li>
                        <li><strong>Autre</strong> : 1 pt</li>
                    </ul>
                    <p class="d421-help-note">
                        Bonus "sec" : valider après le 1er lancer double les points (sauf tie-break duel).
                    </p>
                </aside>
            </div>
        `;

        window.arcade.renderGameTopbar('#d421-topbar', {
            id: '421-topbar',
            icon: '🎲',
            title: '421 • Solo',
            statLabel: 'Progression / Scores',
            statValue: 'Manche 1/10 • 0'
        });
    }

    bindEvents() {
        this.rollBtn = this.container.querySelector('#d421-roll-btn');
        this.validateBtn = this.container.querySelector('#d421-validate-btn');
        this.nextBtn = this.container.querySelector('#d421-next-btn');
        this.feedbackNode = this.container.querySelector('#d421-round-feedback');
        this.rollCounterNode = this.container.querySelector('#d421-roll-counter');
        this.scoreBoardNode = this.container.querySelector('#d421-scoreboard');
        this.tieBreakBadgeNode = this.container.querySelector('#d421-tiebreak-badge');
        this.playerRows = [
            this.container.querySelector('#d421-player-0'),
            this.container.querySelector('#d421-player-1')
        ];
        this.playerScoreNodes = [
            this.container.querySelector('#d421-player-score-0'),
            this.container.querySelector('#d421-player-score-1')
        ];
        this.diceButtons = [
            this.container.querySelector('#d421-die-0'),
            this.container.querySelector('#d421-die-1'),
            this.container.querySelector('#d421-die-2')
        ];

        this.onRollClick = () => this.rollDice();
        this.onValidateClick = () => this.validateRound();
        this.onNextClick = () => this.nextRound();

        this.rollBtn.addEventListener('click', this.onRollClick);
        this.validateBtn.addEventListener('click', this.onValidateClick);
        this.nextBtn.addEventListener('click', this.onNextClick);

        this.diceButtons.forEach((button, index) => {
            button.addEventListener('click', () => this.toggleHold(index));
        });
    }

    setTestDiceQueue(values) {
        if (!Array.isArray(values)) return;
        this.testDiceQueue = values
            .map((v) => Number(v))
            .filter((v) => Number.isInteger(v) && v >= 1 && v <= 6);
    }

    showStartScreen() {
        const self = this;
        window.arcade.showStartModal({
            title: '421',
            icon: '🎲',
            description: 'Mode solo ou duel local en pass-and-play sur le même appareil.',
            controls: [
                { icon: '🖱️', desktop: 'Cliquez un dé pour le verrouiller/déverrouiller', mobile: 'Touchez un dé pour le verrouiller/déverrouiller' },
                { icon: '👥', desktop: 'En duel: Joueur 1 puis Joueur 2 à chaque ronde', mobile: 'En duel: Joueur 1 puis Joueur 2 à chaque ronde' }
            ],
            difficulty: {
                options: [
                    { value: 'solo', label: 'Solo' },
                    { value: 'duo', label: '2 Joueurs' }
                ],
                default: 'solo'
            },
            onStart: function (mode) {
                self.newGame(mode || 'solo');
            },
            onQuit: function () {
                window.arcade.renderHome();
            }
        });
    }

    newGame(mode) {
        if (window.arcade.audio) {
            window.arcade.audio.setContext('421');
        }

        this.gameMode = mode === 'duo' ? 'duo' : 'solo';
        this.isPlaying = true;

        if (this.gameMode === 'duo') {
            this.startDuoGame();
            return;
        }

        this.round = 1;
        this.totalScore = 0;
        this.count421 = 0;
        this.prepareTurn();
        if (this.feedbackNode) {
            this.feedbackNode.textContent = `Manche ${this.round}/${this.maxRounds} : lancez les dés puis validez la combinaison.`;
        }
        this.updateUI();
    }

    startDuoGame() {
        this.players = [
            { name: 'Joueur 1', score: 0, count421: 0, roundsPlayed: 0, lastTurnScore: 0 },
            { name: 'Joueur 2', score: 0, count421: 0, roundsPlayed: 0, lastTurnScore: 0 }
        ];
        this.activePlayerIndex = 0;
        this.currentMatchRound = 1;
        this.isTieBreak = false;
        this.tieBreakRound = 0;
        this.tieBreakPairScores = [null, null];

        this.prepareTurn();
        if (this.feedbackNode) {
            this.feedbackNode.textContent = `Ronde 1/${this.maxRounds} • Au tour de Joueur 1.`;
        }
        this.updateUI();
    }

    prepareTurn() {
        this.rollsUsed = 0;
        this.roundComplete = false;
        this.dice = [null, null, null];
        this.holds = [false, false, false];
        this.currentEvaluation = null;
        this.nextBtn.textContent = 'Manche suivante';
    }

    toggleHold(index) {
        if (!this.isPlaying || this.roundComplete || this.rollsUsed === 0) return;
        this.holds[index] = !this.holds[index];
        this.updateDiceUI();
    }

    rollDice() {
        if (!this.isPlaying || this.roundComplete) return;
        if (this.rollsUsed >= this.maxRolls) return;

        if (this.holds.every(Boolean)) {
            window.arcade.showToast('Déverrouillez au moins un dé pour relancer.');
            return;
        }

        for (let i = 0; i < this.dice.length; i++) {
            if (!this.holds[i]) this.dice[i] = this.randomDie();
        }

        this.rollsUsed += 1;
        this.currentEvaluation = this.evaluateCombination(this.dice);
        this.playRollSound();

        if (this.feedbackNode) {
            let secHint = '';
            if (this.rollsUsed === 1) {
                if (this.gameMode === 'duo' && this.isTieBreak) {
                    secHint = ' | Tie-break: bonus sec désactivé';
                } else {
                    secHint = ` | Bonus sec possible: ${this.currentEvaluation.score * 2} pts`;
                }
            }
            this.feedbackNode.textContent = `Combinaison: ${this.currentEvaluation.name} (${this.currentEvaluation.score} pt${this.currentEvaluation.score > 1 ? 's' : ''})${secHint}`;
        }

        this.updateUI();
    }

    validateRound() {
        if (!this.isPlaying || this.roundComplete) return;
        if (this.rollsUsed === 0 || !this.currentEvaluation) {
            window.arcade.showToast('Faites au moins un lancer avant de valider.');
            return;
        }

        let roundScore = this.currentEvaluation.score;
        const canUseSecBonus = !(this.gameMode === 'duo' && this.isTieBreak);
        const usedSecBonus = canUseSecBonus && this.rollsUsed === 1;
        if (usedSecBonus) roundScore *= 2;

        if (this.gameMode === 'duo') {
            this.resolveDuoRound(roundScore, usedSecBonus);
            return;
        }

        this.totalScore += roundScore;
        if (this.currentEvaluation.code === '421') this.count421 += 1;

        this.roundComplete = true;
        this.playRoundResultSound(roundScore);
        if (this.feedbackNode) {
            const secLabel = usedSecBonus ? ' (bonus sec x2)' : '';
            this.feedbackNode.textContent = `Manche validée: ${this.currentEvaluation.name}${secLabel} → +${roundScore} pt${roundScore > 1 ? 's' : ''}.`;
        }
        this.nextBtn.textContent = this.round >= this.maxRounds ? 'Voir résultat' : 'Manche suivante';
        this.updateUI();
    }

    resolveDuoRound(roundScore, usedSecBonus) {
        const player = this.players[this.activePlayerIndex];
        player.score += roundScore;
        player.roundsPlayed += 1;
        player.lastTurnScore = roundScore;
        if (this.currentEvaluation.code === '421') player.count421 += 1;
        if (this.isTieBreak) this.tieBreakPairScores[this.activePlayerIndex] = roundScore;

        this.roundComplete = true;
        this.playRoundResultSound(roundScore);

        if (this.feedbackNode) {
            const secLabel = usedSecBonus ? ' (bonus sec x2)' : '';
            this.feedbackNode.textContent = `${player.name} valide: ${this.currentEvaluation.name}${secLabel} → +${roundScore} pt${roundScore > 1 ? 's' : ''}.`;
        }

        this.nextBtn.textContent = this.activePlayerIndex === 0 ? 'Passer à Joueur 2' : 'Continuer';
        this.updateUI();
    }

    nextRound() {
        if (!this.isPlaying || !this.roundComplete) return;

        if (this.gameMode === 'duo') {
            this.advanceTurn();
            return;
        }

        if (this.round >= this.maxRounds) {
            this.endSoloGame();
            return;
        }

        this.round += 1;
        this.prepareTurn();
        if (this.feedbackNode) {
            this.feedbackNode.textContent = `Manche ${this.round}/${this.maxRounds} : lancez les dés puis validez la combinaison.`;
        }
        this.updateUI();
    }

    advanceTurn() {
        if (this.activePlayerIndex === 0) {
            this.activePlayerIndex = 1;
            this.prepareTurn();
            if (this.feedbackNode) {
                const phaseLabel = this.isTieBreak ? `Tie-break ${this.tieBreakRound}` : `Ronde ${this.currentMatchRound}/${this.maxRounds}`;
                this.feedbackNode.textContent = `${phaseLabel} • Au tour de Joueur 2.`;
            }
            this.updateUI();
            return;
        }

        if (this.isTieBreak) {
            this.resolveTieBreakPair();
            return;
        }

        if (this.currentMatchRound >= this.maxRounds) {
            this.finishDuoOrStartTieBreak();
            return;
        }

        this.currentMatchRound += 1;
        this.activePlayerIndex = 0;
        this.prepareTurn();
        if (this.feedbackNode) {
            this.feedbackNode.textContent = `Ronde ${this.currentMatchRound}/${this.maxRounds} • Au tour de Joueur 1.`;
        }
        this.updateUI();
    }

    finishDuoOrStartTieBreak() {
        const p1 = this.players[0];
        const p2 = this.players[1];
        if (p1.score > p2.score) {
            this.endDuoGame(0, false);
            return;
        }
        if (p2.score > p1.score) {
            this.endDuoGame(1, false);
            return;
        }
        this.startTieBreak();
    }

    startTieBreak() {
        this.isTieBreak = true;
        this.tieBreakRound = 1;
        this.tieBreakPairScores = [null, null];
        this.activePlayerIndex = 0;
        this.prepareTurn();
        if (this.feedbackNode) {
            this.feedbackNode.textContent = 'Égalité parfaite. Tie-break 1: Au tour de Joueur 1 (bonus sec désactivé).';
        }
        this.updateUI();
    }

    resolveTieBreakPair() {
        const [s1, s2] = this.tieBreakPairScores;
        if (s1 > s2) {
            this.endDuoGame(0, true);
            return;
        }
        if (s2 > s1) {
            this.endDuoGame(1, true);
            return;
        }

        this.tieBreakRound += 1;
        this.tieBreakPairScores = [null, null];
        this.activePlayerIndex = 0;
        this.prepareTurn();
        if (this.feedbackNode) {
            this.feedbackNode.textContent = `Tie-break ${this.tieBreakRound}: nouvelle égalité, au tour de Joueur 1.`;
        }
        this.updateUI();
    }

    endSoloGame() {
        this.isPlaying = false;
        this.updateUI();

        const self = this;
        const win = this.totalScore >= this.targetScore;
        window.arcade.showGameOverModal({
            title: '421',
            gameId: '421',
            gameStatus: win ? 'Victoire ! Objectif atteint.' : 'Partie terminée',
            icon: win ? '🏆' : '🎲',
            stats: [
                { label: 'Score final', value: this.totalScore },
                { label: 'Objectif', value: this.targetScore },
                { label: 'Manches', value: `${this.maxRounds}` },
                { label: '421 obtenus', value: this.count421 }
            ],
            score: this.totalScore,
            scoreType: 'points',
            onReplay: function () { self.newGame('solo'); },
            onQuit: function () { window.arcade.renderHome(); }
        });
    }

    endDuoGame(winnerIndex, usedTieBreak) {
        this.isPlaying = false;
        this.updateUI();

        const self = this;
        const winner = this.players[winnerIndex];
        const loser = this.players[winnerIndex === 0 ? 1 : 0];
        const status = usedTieBreak
            ? `${winner.name} gagne au tie-break !`
            : `${winner.name} remporte la partie !`;

        window.arcade.showGameOverModal({
            gameId: '421',
            gameStatus: status,
            icon: '🏅',
            stats: [
                { label: winner.name, value: `${winner.score} pts` },
                { label: loser.name, value: `${loser.score} pts` },
                { label: '421 Joueur 1', value: `${this.players[0].count421}` },
                { label: '421 Joueur 2', value: `${this.players[1].count421}` },
                { label: 'Mode', value: usedTieBreak ? `Duel (tie-break ${this.tieBreakRound})` : 'Duel' }
            ],
            onReplay: function () { self.newGame('duo'); },
            onQuit: function () { window.arcade.renderHome(); }
        });
    }

    evaluateCombination(values) {
        const sorted = [...values].sort((a, b) => b - a);
        const [d1, d2, d3] = sorted;

        if (d1 === 4 && d2 === 2 && d3 === 1) return { code: '421', name: '421', score: 10 };
        if (d1 === 1 && d2 === 1 && d3 === 1) return { code: 'mac-1', name: 'Mac 1 (111)', score: 7 };
        if (d1 === 2 && d2 === 2 && d3 === 1) return { code: 'nenette', name: 'Nénette (221)', score: 0 };
        if (d2 === 1 && d3 === 1) return { code: 'fiche', name: `Fiche (${d1}11)`, score: d1 };
        if (d1 === d2 && d2 === d3) return { code: 'baraque', name: `Baraque (${d1}${d1}${d1})`, score: d1 };
        if (d1 === d2 + 1 && d2 === d3 + 1) return { code: 'suite', name: `Suite (${d1}${d2}${d3})`, score: 2 };
        return { code: 'simple', name: `Simple (${d1}${d2}${d3})`, score: 1 };
    }

    updateUI() {
        this.updateDiceUI();
        this.updateControls();
        this.updateScoreBoard();

        if (this.rollCounterNode) {
            this.rollCounterNode.textContent = `Lancers : ${this.rollsUsed}/${this.maxRolls}`;
        }

        this.updateTopbar();
    }

    updateTopbar() {
        let title = '421 • Solo';
        let stat = `Manche ${this.round}/${this.maxRounds} • ${this.totalScore} pts`;

        if (this.gameMode === 'duo') {
            const active = this.players[this.activePlayerIndex];
            const phase = this.isTieBreak
                ? `Tie-break ${this.tieBreakRound} • Tour ${active.name}`
                : `Ronde ${this.currentMatchRound}/${this.maxRounds} • Tour ${active.name}`;
            title = `421 • Duel local`;
            stat = `${phase} • J1 ${this.players[0].score} - J2 ${this.players[1].score}`;
        }

        window.arcade.updateGameTopbarStat('421-topbar', stat);
        const titleNode = document.querySelector('[data-topbar-id="421-topbar"] .game-topbar-title');
        if (titleNode) titleNode.textContent = title;
    }

    updateScoreBoard() {
        const isDuo = this.gameMode === 'duo';
        if (!this.scoreBoardNode) return;

        this.scoreBoardNode.hidden = !isDuo;
        if (!isDuo) return;

        this.playerRows.forEach((row, index) => {
            if (!row) return;
            row.classList.toggle('active', this.activePlayerIndex === index && this.isPlaying);
        });

        this.playerScoreNodes[0].textContent = `${this.players[0].score} pts`;
        this.playerScoreNodes[1].textContent = `${this.players[1].score} pts`;

        if (this.tieBreakBadgeNode) {
            this.tieBreakBadgeNode.hidden = !this.isTieBreak;
            this.tieBreakBadgeNode.textContent = this.isTieBreak
                ? `Tie-break ${this.tieBreakRound} • bonus sec désactivé`
                : 'Tie-break en cours';
        }
    }

    updateDiceUI() {
        const faces = ['•', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
        this.diceButtons.forEach((button, index) => {
            const value = this.dice[index];
            button.textContent = value == null ? '•' : faces[value];
            button.classList.toggle('is-held', this.holds[index]);
            button.classList.toggle('is-ready', this.rollsUsed > 0 && !this.roundComplete);
            button.title = this.holds[index] ? 'Dé verrouillé (cliquez pour déverrouiller)' : 'Dé relançable';
        });
    }

    updateControls() {
        this.rollBtn.disabled = !this.isPlaying || this.roundComplete || this.rollsUsed >= this.maxRolls;
        this.validateBtn.disabled = !this.isPlaying || this.roundComplete || this.rollsUsed === 0;
        this.nextBtn.disabled = !this.isPlaying || !this.roundComplete;
    }

    randomDie() {
        if (window.arcade && window.arcade.state && window.arcade.state.testMode && this.testDiceQueue.length > 0) {
            const forced = this.testDiceQueue.shift();
            if (forced >= 1 && forced <= 6) return forced;
        }
        return Math.floor(Math.random() * 6) + 1;
    }

    playRollSound() {
        if (!window.arcade.audio) return;
        const freq = 160 + Math.floor(Math.random() * 70);
        window.arcade.audio.playTone(freq, 'triangle', 0.06, 0.09);
    }

    playRoundResultSound(score) {
        if (!window.arcade.audio) return;
        if (score >= 10) {
            window.arcade.audio.playTone(760, 'sine', 0.11, 0.2);
            window.arcade.audio.playTone(940, 'triangle', 0.12, 0.17);
            return;
        }
        if (score === 0) {
            window.arcade.audio.playTone(130, 'square', 0.16, 0.18);
            return;
        }
        window.arcade.audio.playTone(420, 'sine', 0.08, 0.12);
    }

    stop() {
        this.isPlaying = false;
        if (this.rollBtn && this.onRollClick) this.rollBtn.removeEventListener('click', this.onRollClick);
        if (this.validateBtn && this.onValidateClick) this.validateBtn.removeEventListener('click', this.onValidateClick);
        if (this.nextBtn && this.onNextClick) this.nextBtn.removeEventListener('click', this.onNextClick);
    }
}
