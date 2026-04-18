window.initUno = function (container) {
    const game = new UnoGame(container);
    window._unoGame = game;
    window.arcade.registerGameCleanup(() => game.stop(), 'uno');
    game.showStartScreen();
};

class UnoGame {
    constructor(container) {
        this.container = container;
        this.mode = 'solo';
        this.rules = this.getDefaultRules();
        this.players = [];
        this.drawPile = [];
        this.discardPile = [];
        this.activeIndex = 0;
        this.direction = 1;
        this.currentColor = null;
        this.hasDrawnThisTurn = false;
        this.pendingWildCard = null;
        this.pendingWildCardId = null;
        this.isPlaying = false;
        this.turnCount = 1;
        this.aiTimeout = null;
        this.passOverlayVisible = false;
        this.passOverlayFor = '';
        this.statsSolo = this.getSoloStats();
        this.testDeckCodes = null;
        this.pendingDrawStack = 0;
        this.lastWild4Meta = null;
        this.roundPoints = 0;
    }

    showStartScreen() {
        this.renderLayout();
        const self = this;
        window.arcade.showStartModal({
            title: 'UNO',
            icon: '🃏',
            description: 'Règles classiques : solo contre IA ou local 2/3/4 joueurs.',
            controls: [
                { icon: '🖱️', desktop: 'Cliquez une carte pour la jouer', mobile: 'Touchez une carte pour la jouer' },
                { icon: '📱', desktop: 'Mode local : passation obligatoire entre tours', mobile: 'Mode local : passez l’appareil à chaque tour' }
            ],
            difficulty: {
                options: [
                    { value: 'solo', label: 'Solo vs IA' },
                    { value: 'multi2', label: '2 Joueurs' },
                    { value: 'multi3', label: '3 Joueurs' },
                    { value: 'multi4', label: '4 Joueurs' }
                ],
                default: 'solo'
            },
            settings: {
                groups: [
                    {
                        id: 'uno-rules',
                        label: 'Règles activables',
                        options: [
                            { key: 'stackDraw', label: 'Cumul de +2/+4', default: false, help: 'Le joueur ciblé peut répondre avec +2 ou +4 pour cumuler la pénalité.' },
                            { key: 'allowPlayAfterDraw', label: 'Autoriser le jeu après pioche', default: true, help: 'Si désactivé: après avoir pioché, le tour doit se terminer par passer.' },
                            { key: 'scoreLosersPoints', label: 'Compter les points des perdants', default: false, help: 'Affiche les points restants des perdants en fin de manche.' },
                            { key: 'jumpIn', label: 'Jump-In (auto)', default: false, help: 'Une carte exactement identique peut être jouée immédiatement.' },
                            { key: 'sevenZero', label: 'Règle 7-0', default: false, help: '7 échange de main, 0 rotation des mains.' },
                            { key: 'wild4Challenge', label: 'Contestation du +4', default: false, help: 'Le +4 peut être contesté avec résolution standard simplifiée.' }
                        ]
                    }
                ]
            },
            onStart: function (selectedMode, selectedSettings) {
                self.startGame(selectedMode || 'solo', selectedSettings || {});
            },
            onQuit: function () { window.arcade.renderHome(); }
        });
    }

    renderLayout() {
        this.container.innerHTML = `
            <div class="uno-game-container">
                <section class="uno-main glass-panel">
                    <div id="uno-topbar"></div>

                    <div id="uno-status" class="uno-status">Préparez une partie UNO.</div>

                    <div id="uno-players-strip" class="uno-players-strip"></div>

                    <div class="uno-board">
                        <button id="uno-draw-pile" class="uno-pile uno-draw-pile control-btn">Pioche<br><span id="uno-draw-count">0</span></button>
                        <div id="uno-discard-pile" class="uno-pile uno-discard-pile">Défausse</div>
                    </div>

                    <div class="uno-actions">
                        <button id="uno-btn-draw" class="btn-primary">Piocher</button>
                        <button id="uno-btn-pass" class="btn-secondary">Passer</button>
                        <button id="uno-btn-uno" class="btn-secondary">UNO !</button>
                    </div>

                    <div id="uno-hand" class="uno-hand" aria-live="polite"></div>
                </section>

                <aside class="uno-help card">
                    <h3>Règles UNO</h3>
                    <ul id="uno-help-rules" class="uno-help-list"></ul>
                    <p class="uno-help-note">Objectif: vider sa main avant les autres joueurs.</p>
                </aside>
            </div>

            <div id="uno-pass-overlay" class="uno-overlay" hidden>
                <div class="uno-overlay-content">
                    <h3>Passation</h3>
                    <p id="uno-pass-message">Passez l'appareil au joueur suivant.</p>
                    <button id="uno-btn-pass-continue" class="btn-primary">Prêt</button>
                </div>
            </div>

            <div id="uno-color-overlay" class="uno-overlay" hidden>
                <div class="uno-overlay-content">
                    <h3>Choisir une couleur</h3>
                    <div class="uno-color-choices">
                        <button class="uno-color-btn red" data-color="red">Rouge</button>
                        <button class="uno-color-btn yellow" data-color="yellow">Jaune</button>
                        <button class="uno-color-btn green" data-color="green">Vert</button>
                        <button class="uno-color-btn blue" data-color="blue">Bleu</button>
                    </div>
                </div>
            </div>
        `;

        window.arcade.renderGameTopbar('#uno-topbar', {
            id: 'uno-topbar',
            icon: '🃏',
            title: 'UNO',
            statLabel: 'Tour',
            statValue: 'Prêt'
        });

        this.statusNode = this.container.querySelector('#uno-status');
        this.playersStripNode = this.container.querySelector('#uno-players-strip');
        this.drawPileNode = this.container.querySelector('#uno-draw-pile');
        this.drawCountNode = this.container.querySelector('#uno-draw-count');
        this.discardPileNode = this.container.querySelector('#uno-discard-pile');
        this.handNode = this.container.querySelector('#uno-hand');
        this.passBtn = this.container.querySelector('#uno-btn-pass');
        this.drawBtn = this.container.querySelector('#uno-btn-draw');
        this.unoBtn = this.container.querySelector('#uno-btn-uno');
        this.passOverlayNode = this.container.querySelector('#uno-pass-overlay');
        this.passMessageNode = this.container.querySelector('#uno-pass-message');
        this.passContinueBtn = this.container.querySelector('#uno-btn-pass-continue');
        this.colorOverlayNode = this.container.querySelector('#uno-color-overlay');
        this.colorChoiceBtns = Array.from(this.container.querySelectorAll('.uno-color-btn'));
        this.helpRulesNode = this.container.querySelector('#uno-help-rules');

        this.drawBtn.addEventListener('click', () => this.handleDrawClick());
        this.passBtn.addEventListener('click', () => this.handlePassClick());
        this.unoBtn.addEventListener('click', () => this.handleUnoClick());
        this.drawPileNode.addEventListener('click', () => this.handleDrawClick());
        this.passContinueBtn.addEventListener('click', () => this.closePassOverlay());
        this.colorChoiceBtns.forEach((btn) => {
            btn.addEventListener('click', () => this.confirmWildColor(btn.dataset.color));
        });
        this.renderRulesHelp();
    }

    startGame(selectedMode, selectedSettings = {}) {
        if (window.arcade.audio) window.arcade.audio.setContext('uno');

        this.mode = selectedMode === 'solo' ? 'solo' : selectedMode;
        this.rules = this.normalizeRules(selectedSettings);
        this.players = this.createPlayers(this.mode);
        this.drawPile = this.createDeck();
        this.discardPile = [];
        this.activeIndex = 0;
        this.direction = 1;
        this.currentColor = null;
        this.hasDrawnThisTurn = false;
        this.pendingWildCard = null;
        this.pendingWildCardId = null;
        this.isPlaying = true;
        this.turnCount = 1;
        this.passOverlayVisible = false;
        this.pendingDrawStack = 0;
        this.lastWild4Meta = null;
        this.roundPoints = 0;

        this.players.forEach((player) => {
            player.hand = [];
            player.saidUno = false;
            player.unoPending = false;
        });

        this.dealCards();
        this.initDiscardPile();
        this.renderRulesHelp();
        this.startTurn(this.activeIndex, true);
    }

    createPlayers(mode) {
        if (mode === 'solo') {
            return [
                { name: 'Vous', isAI: false, hand: [], saidUno: false, unoPending: false },
                { name: 'IA', isAI: true, hand: [], saidUno: false, unoPending: false }
            ];
        }
        const count = Number(mode.replace('multi', '')) || 2;
        return Array.from({ length: count }, (_v, i) => ({
            name: `Joueur ${i + 1}`,
            isAI: false,
            hand: [],
            saidUno: false,
            unoPending: false
        }));
    }

    getDefaultRules() {
        return {
            stackDraw: false,
            allowPlayAfterDraw: true,
            scoreLosersPoints: false,
            jumpIn: false,
            sevenZero: false,
            wild4Challenge: false
        };
    }

    normalizeRules(partialRules) {
        const defaults = this.getDefaultRules();
        const merged = { ...defaults };
        if (!partialRules || typeof partialRules !== 'object') return merged;
        Object.keys(defaults).forEach((key) => {
            if (typeof partialRules[key] === 'boolean') {
                merged[key] = partialRules[key];
            }
        });
        return merged;
    }

    activeRulesCount() {
        return Object.keys(this.rules).reduce((count, key) => count + (this.rules[key] ? 1 : 0), 0);
    }

    renderRulesHelp() {
        if (!this.helpRulesNode) return;
        const baseRules = [
            'Deck standard 108 cartes',
            '<code>reverse</code> = <code>skip</code> à 2 joueurs',
            'UNO non annoncé: +2 cartes'
        ];
        const toggles = [];
        toggles.push(this.rules.stackDraw ? '✅ Cumul +2/+4 actif' : '❌ Cumul +2/+4 désactivé');
        toggles.push(this.rules.allowPlayAfterDraw ? '✅ Jeu après pioche autorisé' : '❌ Jeu après pioche interdit');
        toggles.push(this.rules.scoreLosersPoints ? '✅ Points des perdants affichés' : '❌ Points des perdants désactivés');
        toggles.push(this.rules.jumpIn ? '✅ Jump-In actif' : '❌ Jump-In désactivé');
        toggles.push(this.rules.sevenZero ? '✅ Règle 7-0 active' : '❌ Règle 7-0 désactivée');
        toggles.push(this.rules.wild4Challenge ? '✅ Contestation +4 active' : '❌ Contestation +4 désactivée');
        this.helpRulesNode.innerHTML = [...baseRules, ...toggles].map((line) => `<li>${line}</li>`).join('');
    }

    createDeck() {
        const fullDeck = this.createStandardDeck();
        this.shuffle(fullDeck);
        if (!this.testDeckCodes || this.testDeckCodes.length === 0) return fullDeck;
        const forced = this.testDeckCodes
            .map((code) => this.parseCardCode(code))
            .filter(Boolean);
        this.testDeckCodes = null;
        return [...forced, ...fullDeck];
    }

    createStandardDeck() {
        const colors = ['red', 'yellow', 'green', 'blue'];
        const deck = [];
        let id = 1;
        colors.forEach((color) => {
            deck.push({ id: `u${id++}`, color, value: '0' });
            ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'skip', 'reverse', 'draw2'].forEach((value) => {
                deck.push({ id: `u${id++}`, color, value });
                deck.push({ id: `u${id++}`, color, value });
            });
        });
        for (let i = 0; i < 4; i++) {
            deck.push({ id: `u${id++}`, color: 'wild', value: 'wild' });
            deck.push({ id: `u${id++}`, color: 'wild', value: 'wild4' });
        }
        return deck;
    }

    parseCardCode(code) {
        if (typeof code !== 'string') return null;
        const m = code.trim().toUpperCase().match(/^([RYGBW]):([0-9]|SKIP|REV|D2|W|W4)$/);
        if (!m) return null;
        const colorMap = { R: 'red', Y: 'yellow', G: 'green', B: 'blue', W: 'wild' };
        const valueMap = { REV: 'reverse', D2: 'draw2', W: 'wild', W4: 'wild4' };
        const color = colorMap[m[1]];
        const rawValue = m[2];
        const value = valueMap[rawValue] || rawValue.toLowerCase();
        if (color !== 'wild' && (value === 'wild' || value === 'wild4')) return null;
        if (color === 'wild' && value !== 'wild' && value !== 'wild4') return null;
        return { id: `t${Math.random().toString(36).slice(2, 11)}`, color, value };
    }

    setTestDeck(codes) {
        if (!Array.isArray(codes)) return;
        this.testDeckCodes = [...codes];
    }

    dealCards() {
        for (let round = 0; round < 7; round++) {
            for (let i = 0; i < this.players.length; i++) {
                this.players[i].hand.push(this.drawOneCard());
            }
        }
    }

    initDiscardPile() {
        let starter = this.drawOneCard();
        while (starter && starter.color === 'wild') {
            this.drawPile.push(starter);
            starter = this.drawOneCard();
        }
        if (!starter) starter = { id: 'fallback', color: 'red', value: '0' };
        this.discardPile.push(starter);
        this.currentColor = starter.color;
    }

    startTurn(index, isNewGame = false) {
        this.activeIndex = index;
        const player = this.players[this.activeIndex];
        player.saidUno = false;
        this.hasDrawnThisTurn = false;
        this.pendingWildCard = null;
        this.pendingWildCardId = null;
        this.turnCount += isNewGame ? 0 : 1;

        if (!isNewGame) {
            this.status(`${player.name} doit jouer.`);
        }
        if (this.resolvePendingDrawForActive(player)) {
            return;
        }
        this.updateUI();
        this.triggerAIIfNeeded();
    }

    resolvePendingDrawForActive(player) {
        if (!this.rules.stackDraw || this.pendingDrawStack <= 0 || !player) return false;
        const stackable = this.getStackableCards(player);
        if (stackable.length > 0) {
            this.status(`${player.name} peut cumuler la pioche (${this.pendingDrawStack}).`);
            return false;
        }
        this.drawForPlayer(player, this.pendingDrawStack);
        this.status(`${player.name} pioche ${this.pendingDrawStack} cartes (cumul).`);
        this.pendingDrawStack = 0;
        const next = this.getNextIndex(this.activeIndex, 1);
        this.requestPassOverlayIfNeeded(next);
        this.startTurn(next);
        return true;
    }

    status(message) {
        if (this.statusNode) this.statusNode.textContent = message;
    }

    handleUnoClick() {
        if (!this.isPlaying || this.passOverlayVisible) return;
        const player = this.players[this.activeIndex];
        if (player.isAI) return;
        player.saidUno = true;
        window.arcade.showToast('UNO annoncé !');
    }

    handleDrawClick() {
        if (!this.isPlaying || this.passOverlayVisible) return;
        const player = this.players[this.activeIndex];
        if (!player || player.isAI) return;
        if (this.rules.stackDraw && this.pendingDrawStack > 0) {
            window.arcade.showToast('Répondez avec +2/+4 ou subissez la pioche cumulée.');
            return;
        }
        if (this.hasDrawnThisTurn) {
            window.arcade.showToast('Vous avez déjà pioché ce tour.');
            return;
        }
        this.drawForPlayer(player, 1);
        this.hasDrawnThisTurn = true;
        if (this.rules.allowPlayAfterDraw) {
            this.status(`${player.name} a pioché. Jouez une carte ou passez.`);
        } else {
            this.status(`${player.name} a pioché. Passe obligatoire.`);
        }
        this.updateUI();
    }

    handlePassClick() {
        if (!this.isPlaying || this.passOverlayVisible) return;
        const player = this.players[this.activeIndex];
        if (!player || player.isAI) return;
        if (this.rules.stackDraw && this.pendingDrawStack > 0) {
            this.drawForPlayer(player, this.pendingDrawStack);
            this.status(`${player.name} subit ${this.pendingDrawStack} cartes.`);
            this.pendingDrawStack = 0;
            this.advanceAfterTurn(player, null);
            return;
        }
        if (!this.hasDrawnThisTurn && this.hasPlayableCard(player)) {
            window.arcade.showToast('Vous avez un coup possible. Jouez ou piochez avant de passer.');
            return;
        }
        this.advanceAfterTurn(player, null);
    }

    triggerAIIfNeeded() {
        clearTimeout(this.aiTimeout);
        const player = this.players[this.activeIndex];
        if (!player || !player.isAI || !this.isPlaying || this.passOverlayVisible) return;
        this.aiTimeout = setTimeout(() => this.playAITurn(), 650);
    }

    playAITurn() {
        if (!this.isPlaying || this.passOverlayVisible) return;
        const ai = this.players[this.activeIndex];
        if (!ai || !ai.isAI) return;

        if (this.rules.stackDraw && this.pendingDrawStack > 0) {
            const stackable = this.getStackableCards(ai);
            if (stackable.length > 0) {
                const card = stackable[0];
                const chosenColor = card.color === 'wild' ? this.chooseAIWildColor(ai, card) : null;
                this.playCardById(card.id, chosenColor);
                return;
            }
            this.drawForPlayer(ai, this.pendingDrawStack);
            this.status(`IA subit ${this.pendingDrawStack} cartes.`);
            this.pendingDrawStack = 0;
            this.advanceAfterTurn(ai, null);
            return;
        }

        const playable = ai.hand.filter((card) => this.isPlayable(card));
        if (playable.length === 0) {
            this.drawForPlayer(ai, 1);
            const drawn = ai.hand[ai.hand.length - 1];
            if (this.rules.allowPlayAfterDraw && drawn && this.isPlayable(drawn)) {
                this.playCardById(drawn.id, this.chooseAIWildColor(ai, drawn));
            } else {
                this.status('IA passe son tour.');
                this.advanceAfterTurn(ai, null);
            }
            return;
        }

        const selected = this.pickAICard(ai, playable);
        const chosenColor = selected.color === 'wild' ? this.chooseAIWildColor(ai, selected) : null;
        this.playCardById(selected.id, chosenColor);
    }

    pickAICard(ai, playable) {
        const scoreFor = (card) => {
            let score = 0;
            if (card.value === 'wild4') score += 7;
            if (card.value === 'wild') score += 5;
            if (card.value === 'draw2') score += 4;
            if (card.value === 'skip' || card.value === 'reverse') score += 3;
            if (/^[0-9]$/.test(card.value)) score += 1;
            if (card.color === this.currentColor) score += 2;
            if (card.color === 'wild') score -= 1;
            return score;
        };
        return [...playable].sort((a, b) => scoreFor(b) - scoreFor(a))[0];
    }

    chooseAIWildColor(ai, card) {
        if (card.color !== 'wild') return null;
        const counts = { red: 0, yellow: 0, green: 0, blue: 0 };
        ai.hand.forEach((c) => {
            if (counts[c.color] !== undefined) counts[c.color] += 1;
        });
        return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
    }

    playCardById(cardId, forcedColor = null) {
        if (!this.isPlaying || this.passOverlayVisible) return;
        const player = this.players[this.activeIndex];
        if (!player) return;

        const idx = player.hand.findIndex((card) => card.id === cardId);
        if (idx === -1) return;
        const card = player.hand[idx];
        if (!this.isPlayable(card)) return;
        if (!player.isAI && this.hasDrawnThisTurn && !this.rules.allowPlayAfterDraw) {
            window.arcade.showToast('Règle active: après pioche, vous devez passer.');
            return;
        }
        if (this.rules.stackDraw && this.pendingDrawStack > 0) {
            const stackable = this.getStackableCards(player);
            if (!stackable.some((c) => c.id === card.id)) {
                window.arcade.showToast('Vous ne pouvez répondre qu\'avec +2/+4.');
                return;
            }
        }

        if (!player.isAI && card.color === 'wild' && !forcedColor) {
            this.pendingWildCard = card;
            this.pendingWildCardId = card.id;
            this.colorOverlayNode.hidden = false;
            return;
        }

        const wild4HadColorMatch = card.value === 'wild4'
            ? player.hand.some((c, handIdx) => handIdx !== idx && c.color !== 'wild' && c.color === this.currentColor)
            : false;

        player.hand.splice(idx, 1);
        this.discardPile.push(card);
        this.currentColor = card.color === 'wild' ? (forcedColor || 'red') : card.color;
        this.hasDrawnThisTurn = false;
        this.lastWild4Meta = null;
        if (card.value === 'wild4') {
            this.lastWild4Meta = { attackerIndex: this.activeIndex, hadColorMatch: wild4HadColorMatch };
        }

        if (window.arcade.audio) {
            window.arcade.audio.playTone(460, 'triangle', 0.07, 0.12);
        }

        if (player.hand.length === 1 && !player.saidUno) {
            this.drawForPlayer(player, 2);
            this.status(`${player.name} n'a pas annoncé UNO : +2 cartes.`);
        }

        if (player.hand.length === 0) {
            this.finishGame(player);
            return;
        }

        this.advanceAfterTurn(player, card);
    }

    confirmWildColor(color) {
        if (!this.pendingWildCardId || !color) return;
        this.colorOverlayNode.hidden = true;
        const cardId = this.pendingWildCardId;
        this.pendingWildCard = null;
        this.pendingWildCardId = null;
        this.playCardById(cardId, color);
    }

    advanceAfterTurn(player, playedCard) {
        if (playedCard && this.rules.jumpIn) {
            const jumpInMeta = this.findJumpInCandidate(playedCard, this.activeIndex);
            if (jumpInMeta) {
                const jumper = this.players[jumpInMeta.playerIndex];
                const jumpCard = jumper.hand.splice(jumpInMeta.cardIndex, 1)[0];
                this.discardPile.push(jumpCard);
                this.currentColor = jumpCard.color === 'wild' ? (this.currentColor || 'red') : jumpCard.color;
                this.activeIndex = jumpInMeta.playerIndex;
                player = jumper;
                playedCard = jumpCard;
                this.status(`${jumper.name} coupe la manche (Jump-In).`);
                if (jumper.hand.length === 0) {
                    this.finishGame(jumper);
                    return;
                }
            }
        }

        let next = this.getNextIndex(this.activeIndex, 1);

        if (playedCard) {
            if (playedCard.value === 'skip') {
                next = this.getNextIndex(next, 1);
                this.status(`${player.name} joue Skip.`);
            } else if (playedCard.value === 'reverse') {
                if (this.players.length === 2) {
                    next = this.getNextIndex(next, 1);
                    this.status(`${player.name} joue Reverse (effet Skip à 2).`);
                } else {
                    this.direction *= -1;
                    next = this.getNextIndex(this.activeIndex, 1);
                    this.status(`${player.name} inverse le sens.`);
                }
            } else if (playedCard.value === 'draw2') {
                const target = next;
                if (this.rules.stackDraw) {
                    this.pendingDrawStack += 2;
                    this.status(`${player.name} lance un cumul +2 (${this.pendingDrawStack}).`);
                } else {
                    this.drawForPlayer(this.players[target], 2);
                    next = this.getNextIndex(target, 1);
                    this.status(`${player.name} inflige +2.`);
                }
            } else if (playedCard.value === 'wild4') {
                const target = next;
                if (this.rules.stackDraw) {
                    this.pendingDrawStack += 4;
                    this.status(`${player.name} lance un cumul +4 (${this.pendingDrawStack}).`);
                } else if (this.rules.wild4Challenge) {
                    const resolution = this.resolveWild4Challenge(target);
                    this.status(resolution.message);
                    if (resolution.skipTarget) {
                        next = this.getNextIndex(target, 1);
                    }
                } else {
                    this.drawForPlayer(this.players[target], 4);
                    next = this.getNextIndex(target, 1);
                    this.status(`${player.name} joue +4.`);
                }
            } else if (playedCard.value === 'wild') {
                this.status(`${player.name} change la couleur en ${this.colorLabel(this.currentColor)}.`);
            } else if (this.rules.sevenZero && playedCard.value === '7') {
                const swapTarget = this.getSevenSwapTargetIndex(this.activeIndex);
                this.swapHands(this.activeIndex, swapTarget);
                this.status(`${player.name} joue 7 et échange sa main avec ${this.players[swapTarget].name}.`);
            } else if (this.rules.sevenZero && playedCard.value === '0') {
                this.rotateHands();
                this.status(`${player.name} joue 0: rotation des mains.`);
            }
        }

        this.requestPassOverlayIfNeeded(next);
        this.startTurn(next);
    }

    requestPassOverlayIfNeeded(nextIndex) {
        const nextPlayer = this.players[nextIndex];
        const isLocalMulti = this.mode !== 'solo';
        if (!isLocalMulti || !nextPlayer || nextPlayer.isAI || nextIndex === this.activeIndex) {
            this.passOverlayVisible = false;
            this.passOverlayNode.hidden = true;
            return;
        }
        this.passOverlayVisible = true;
        this.passOverlayFor = nextPlayer.name;
        this.passMessageNode.textContent = `Passez l'appareil à ${nextPlayer.name}.`;
        this.passOverlayNode.hidden = false;
    }

    closePassOverlay() {
        this.passOverlayVisible = false;
        this.passOverlayNode.hidden = true;
        this.updateUI();
        this.triggerAIIfNeeded();
    }

    finishGame(winner) {
        this.isPlaying = false;
        clearTimeout(this.aiTimeout);
        this.pendingDrawStack = 0;

        if (this.mode === 'solo') {
            const humanWon = winner && winner.name === 'Vous';
            const stats = this.getSoloStats();
            stats.played += 1;
            if (humanWon) stats.wins += 1;
            localStorage.setItem('arcade_uno_solo_stats', JSON.stringify(stats));
            this.statsSolo = stats;
        }

        const self = this;
        const statsRows = this.players.map((p) => ({ label: p.name, value: `${p.hand.length} carte(s)` }));
        let roundPoints = 0;
        if (this.rules.scoreLosersPoints && winner) {
            this.players.forEach((p) => {
                if (p !== winner) {
                    const points = this.getPlayerHandPoints(p);
                    roundPoints += points;
                    statsRows.push({ label: `Points ${p.name}`, value: String(points) });
                }
            });
            statsRows.push({ label: 'Points manche', value: String(roundPoints) });
        }
        this.roundPoints = roundPoints;
        if (this.mode === 'solo') {
            statsRows.push({ label: 'Bilan solo', value: `${this.statsSolo.wins}/${this.statsSolo.played}` });
        }
        window.arcade.showGameOverModal({
            gameId: 'uno',
            gameStatus: `${winner.name} gagne la manche !`,
            icon: '🏁',
            stats: statsRows,
            onReplay: function () { self.showStartScreen(); },
            onQuit: function () { window.arcade.renderHome(); }
        });
    }

    getSoloStats() {
        try {
            const raw = localStorage.getItem('arcade_uno_solo_stats');
            if (!raw) return { wins: 0, played: 0 };
            const parsed = JSON.parse(raw);
            return {
                wins: Number(parsed.wins || 0),
                played: Number(parsed.played || 0)
            };
        } catch (_err) {
            return { wins: 0, played: 0 };
        }
    }

    updateUI() {
        this.renderPlayersStrip();
        this.renderDiscard();
        this.renderHand();
        this.updateButtons();
        this.updateTopbar();
    }

    renderPlayersStrip() {
        if (!this.playersStripNode) return;
        this.playersStripNode.innerHTML = this.players.map((player, idx) => {
            const cls = idx === this.activeIndex ? 'active' : '';
            return `
                <div class="uno-player-pill ${cls}" data-player-idx="${idx}">
                    <span class="uno-player-name">${player.name}${player.isAI ? ' 🤖' : ''}</span>
                    <span class="uno-player-count" id="uno-player-count-${idx}">${player.hand.length}</span>
                </div>
            `;
        }).join('');
    }

    renderDiscard() {
        const top = this.getTopDiscard();
        const glyph = top ? this.cardGlyph(top) : '?';
        this.discardPileNode.className = `uno-pile uno-discard-pile ${top ? `card-${top.color}` : ''}`;
        this.discardPileNode.innerHTML = `
            <div class="uno-card-inner">
                <span class="uno-corner tl">${glyph}</span>
                <span class="uno-center">${glyph}</span>
                <span class="uno-corner br">${glyph}</span>
            </div>
        `;
        this.drawCountNode.textContent = this.drawPile.length;
    }

    renderHand() {
        if (!this.handNode) return;
        const player = this.players[this.activeIndex];
        if (!player) return;

        if (this.passOverlayVisible) {
            this.handNode.innerHTML = `<div class="uno-hand-placeholder">Main masquée pendant la passation</div>`;
            return;
        }

        if (player.isAI) {
            this.handNode.innerHTML = `<div class="uno-hand-placeholder">Tour de l'IA...</div>`;
            return;
        }

        this.handNode.innerHTML = player.hand.map((card) => {
            const playable = this.isPlayable(card);
            const disabled = playable ? '' : 'disabled';
            const glyph = this.cardGlyph(card);
            return `
                <button class="uno-card-btn card-${card.color} ${playable ? 'playable' : 'blocked'}" data-card-id="${card.id}" data-card-code="${this.cardCode(card)}" ${disabled}>
                    <div class="uno-card-inner">
                        <span class="uno-corner tl">${glyph}</span>
                        <span class="uno-center">${glyph}</span>
                        <span class="uno-corner br">${glyph}</span>
                    </div>
                </button>
            `;
        }).join('');

        this.handNode.querySelectorAll('.uno-card-btn').forEach((btn) => {
            btn.addEventListener('click', () => this.playCardById(btn.dataset.cardId));
        });
    }

    updateButtons() {
        const player = this.players[this.activeIndex];
        const canAct = this.isPlaying && !this.passOverlayVisible && player && !player.isAI;
        const hasPlayable = player ? this.hasPlayableCard(player) : false;
        this.drawBtn.disabled = !canAct || this.hasDrawnThisTurn || (this.rules.stackDraw && this.pendingDrawStack > 0);
        this.unoBtn.disabled = !canAct;
        this.passBtn.disabled = !canAct || (!this.hasDrawnThisTurn && hasPlayable);
    }

    updateTopbar() {
        const active = this.players[this.activeIndex];
        const rulesTag = this.activeRulesCount() > 0 ? ` • Règles: ${this.activeRulesCount()}` : '';
        const stat = active
            ? `${active.name} • ${this.modeLabel()} • Couleur: ${this.colorLabel(this.currentColor)}${rulesTag}`
            : 'UNO';
        window.arcade.updateGameTopbarStat('uno-topbar', stat);
        const titleNode = document.querySelector('[data-topbar-id="uno-topbar"] .game-topbar-title');
        if (titleNode) titleNode.textContent = `UNO (${this.modeLabel()})`;
    }

    modeLabel() {
        if (this.mode === 'solo') return 'Solo vs IA';
        const count = this.players.length;
        return `${count} joueurs local`;
    }

    cardLabel(card) {
        if (!card) return '';
        if (card.color === 'wild' && card.value === 'wild') return 'Joker';
        if (card.color === 'wild' && card.value === 'wild4') return 'Joker +4';
        if (card.value === 'skip') return 'Skip';
        if (card.value === 'reverse') return 'Reverse';
        if (card.value === 'draw2') return '+2';
        return `${this.colorLabel(card.color)} ${card.value}`;
    }

    cardGlyph(card) {
        if (!card) return '?';
        if (card.value === 'skip') return '⊘';
        if (card.value === 'reverse') return '↺';
        if (card.value === 'draw2') return '+2';
        if (card.value === 'wild') return '🎨';
        if (card.value === 'wild4') return '+4';
        return String(card.value);
    }

    cardCode(card) {
        const colorMap = { red: 'R', yellow: 'Y', green: 'G', blue: 'B', wild: 'W' };
        const valueMap = { reverse: 'REV', draw2: 'D2', wild: 'W', wild4: 'W4' };
        return `${colorMap[card.color] || 'W'}:${valueMap[card.value] || String(card.value).toUpperCase()}`;
    }

    colorLabel(color) {
        const map = {
            red: 'Rouge',
            yellow: 'Jaune',
            green: 'Vert',
            blue: 'Bleu',
            wild: 'Joker'
        };
        return map[color] || '-';
    }

    hasPlayableCard(player) {
        return player.hand.some((card) => this.isPlayable(card));
    }

    getStackableCards(player) {
        if (!player || !this.rules.stackDraw || this.pendingDrawStack <= 0) return [];
        return player.hand.filter((card) => card.value === 'draw2' || card.value === 'wild4');
    }

    isPlayable(card) {
        if (this.rules.stackDraw && this.pendingDrawStack > 0) {
            return card.value === 'draw2' || card.value === 'wild4';
        }
        const top = this.getTopDiscard();
        if (!top) return true;
        if (card.color === 'wild') return true;
        if (card.color === this.currentColor) return true;
        if (card.value === top.value) return true;
        return false;
    }

    getTopDiscard() {
        return this.discardPile[this.discardPile.length - 1] || null;
    }

    drawForPlayer(player, count) {
        for (let i = 0; i < count; i++) {
            player.hand.push(this.drawOneCard());
        }
    }

    resolveWild4Challenge(targetIndex) {
        const meta = this.lastWild4Meta;
        const target = this.players[targetIndex];
        if (!meta || !target) {
            this.drawForPlayer(target, 4);
            return { message: `${target.name} pioche 4 cartes.`, skipTarget: true };
        }
        const challengeSuccessful = meta.hadColorMatch === true;
        if (challengeSuccessful) {
            const attacker = this.players[meta.attackerIndex];
            this.drawForPlayer(attacker, 4);
            return { message: `Contestation réussie: ${attacker.name} pioche 4 cartes.`, skipTarget: false };
        }
        this.drawForPlayer(target, 6);
        return { message: `Contestation ratée: ${target.name} pioche 6 cartes.`, skipTarget: true };
    }

    findJumpInCandidate(card, excludePlayerIndex) {
        if (!card || card.color === 'wild') return null;
        for (let i = 0; i < this.players.length; i++) {
            if (i === excludePlayerIndex) continue;
            const player = this.players[i];
            if (!player || !Array.isArray(player.hand) || player.hand.length === 0) continue;
            const cardIndex = player.hand.findIndex((c) => c.color === card.color && c.value === card.value);
            if (cardIndex >= 0) return { playerIndex: i, cardIndex };
        }
        return null;
    }

    getSevenSwapTargetIndex(playerIndex) {
        let target = this.getNextIndex(playerIndex, 1);
        if (target === playerIndex) target = (playerIndex + 1) % this.players.length;
        return target;
    }

    swapHands(a, b) {
        if (a === b) return;
        const temp = this.players[a].hand;
        this.players[a].hand = this.players[b].hand;
        this.players[b].hand = temp;
    }

    rotateHands() {
        if (this.players.length <= 1) return;
        if (this.direction === 1) {
            const last = this.players[this.players.length - 1].hand;
            for (let i = this.players.length - 1; i > 0; i--) {
                this.players[i].hand = this.players[i - 1].hand;
            }
            this.players[0].hand = last;
        } else {
            const first = this.players[0].hand;
            for (let i = 0; i < this.players.length - 1; i++) {
                this.players[i].hand = this.players[i + 1].hand;
            }
            this.players[this.players.length - 1].hand = first;
        }
    }

    getCardPoint(card) {
        if (!card) return 0;
        if (/^[0-9]$/.test(card.value)) return Number(card.value);
        if (card.value === 'skip' || card.value === 'reverse' || card.value === 'draw2') return 20;
        if (card.value === 'wild' || card.value === 'wild4') return 50;
        return 0;
    }

    getPlayerHandPoints(player) {
        if (!player || !Array.isArray(player.hand)) return 0;
        return player.hand.reduce((sum, card) => sum + this.getCardPoint(card), 0);
    }

    setRules(partialRules) {
        this.rules = this.normalizeRules({ ...this.rules, ...(partialRules || {}) });
        this.renderRulesHelp();
        this.updateUI();
    }

    getRules() {
        return { ...this.rules };
    }

    getState() {
        const active = this.players[this.activeIndex] || null;
        return {
            mode: this.mode,
            activeIndex: this.activeIndex,
            activePlayer: active ? active.name : null,
            players: this.players.map((p) => ({ name: p.name, handSize: p.hand.length, isAI: p.isAI })),
            currentColor: this.currentColor,
            topCard: this.getTopDiscard() ? this.cardCode(this.getTopDiscard()) : null,
            pendingDrawStack: this.pendingDrawStack,
            rules: this.getRules(),
            roundPoints: this.roundPoints,
            hasDrawnThisTurn: this.hasDrawnThisTurn
        };
    }

    drawOneCard() {
        if (this.drawPile.length === 0) this.refillDrawPile();
        return this.drawPile.shift() || { id: `fallback-${Date.now()}`, color: 'red', value: '0' };
    }

    refillDrawPile() {
        if (this.discardPile.length <= 1) return;
        const top = this.discardPile.pop();
        const rest = [...this.discardPile];
        this.discardPile = [top];
        this.shuffle(rest);
        this.drawPile = rest;
    }

    getNextIndex(from, steps) {
        const len = this.players.length;
        let idx = from;
        for (let i = 0; i < steps; i++) {
            idx = (idx + this.direction + len) % len;
        }
        return idx;
    }

    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    stop() {
        this.isPlaying = false;
        clearTimeout(this.aiTimeout);
    }
}
