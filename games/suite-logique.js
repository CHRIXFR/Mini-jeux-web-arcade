(function () {
    class SuiteLogiqueGame {
        constructor(container) {
            this.container = container;

            this.totalQuestions = 10;
            this.maxErrors = 3;
            this.quickAnswerSeconds = 8;
            this.basePoints = 10;
            this.quickBonus = 5;
            this.errorPenalty = 5;

            this.state = {
                mode: 'mixte',
                questionIndex: 0,
                score: 0,
                errors: 0,
                currentQuestion: null,
                usedHint: false,
                answered: false,
                startedAtMs: 0
            };

            this.testQuestionQueue = [];
            this.testElapsedQueue = [];
            this.mixAlternationStartsWithShape = true;

            this.renderLayout();
            this.bindEvents();
            this.renderTopbar();
        }

        renderLayout() {
            this.container.innerHTML = `
                <div class="sl-game-container">
                    <section class="sl-main glass-panel">
                        <div id="sl-topbar"></div>
                        <div class="sl-mode-row">
                            <span class="sl-mode-label">Mode</span>
                            <strong id="sl-mode-value" class="sl-mode-value">Mixte</strong>
                        </div>

                        <div class="sl-question-card card">
                            <div class="sl-question-head">
                                <span id="sl-question-count" class="sl-question-count">Question 1/10</span>
                                <span id="sl-difficulty-badge" class="sl-difficulty-badge">Facile</span>
                            </div>
                            <p id="sl-question-prompt" class="sl-question-prompt">Complétez la suite.</p>
                            <div id="sl-sequence" class="sl-sequence" aria-live="polite"></div>
                            <div id="sl-options" class="sl-options" role="group" aria-label="Options de réponse"></div>
                        </div>

                        <div class="sl-actions">
                            <button id="sl-hint-btn" class="btn-secondary">Indice (-50%)</button>
                            <button id="sl-next-btn" class="btn-primary" disabled>Question suivante</button>
                        </div>

                        <div id="sl-feedback" class="sl-feedback" aria-live="polite">
                            Choisissez un mode pour commencer.
                        </div>
                    </section>

                    <aside class="sl-help card">
                        <h3>Règles rapides</h3>
                        <ul class="sl-help-list">
                            <li><strong>10 questions</strong> par partie</li>
                            <li><strong>+10 points</strong> par bonne réponse</li>
                            <li><strong>+5 bonus</strong> si réponse en moins de 8 secondes</li>
                            <li><strong>-5 points</strong> par erreur (score minimum 0)</li>
                            <li><strong>3 erreurs max</strong> avant fin de partie</li>
                        </ul>
                    </aside>
                </div>
            `;
        }

        bindEvents() {
            this.topbarMount = this.container.querySelector('#sl-topbar');
            this.modeValueNode = this.container.querySelector('#sl-mode-value');
            this.questionCountNode = this.container.querySelector('#sl-question-count');
            this.difficultyNode = this.container.querySelector('#sl-difficulty-badge');
            this.promptNode = this.container.querySelector('#sl-question-prompt');
            this.sequenceNode = this.container.querySelector('#sl-sequence');
            this.optionsNode = this.container.querySelector('#sl-options');
            this.feedbackNode = this.container.querySelector('#sl-feedback');
            this.hintBtn = this.container.querySelector('#sl-hint-btn');
            this.nextBtn = this.container.querySelector('#sl-next-btn');

            this.onHintClick = () => this.useHint();
            this.onNextClick = () => this.nextQuestion();

            this.hintBtn.addEventListener('click', this.onHintClick);
            this.nextBtn.addEventListener('click', this.onNextClick);
        }

        startScreen() {
            window.arcade.showStartModal({
                title: 'Suite Logique',
                icon: '🧠',
                description: 'Complétez des suites en mode forme, chiffre ou mixte.',
                controls: [
                    { icon: '🖱️', desktop: 'Cliquez la bonne réponse parmi 4 options', mobile: 'Touchez la bonne réponse parmi 4 options' },
                    { icon: '💡', desktop: 'Un indice réduit les points de la question', mobile: 'Un indice réduit les points de la question' }
                ],
                difficulty: {
                    options: [
                        { value: 'forme', label: '🔷 Forme' },
                        { value: 'chiffre', label: '🔢 Chiffre' },
                        { value: 'mixte', label: '🎲 Mixte' }
                    ],
                    default: 'mixte'
                },
                onStart: (mode) => this.newGame(mode || 'mixte'),
                onQuit: () => window.arcade.renderHome()
            });
        }

        newGame(mode) {
            this.state.mode = mode;
            this.state.questionIndex = 0;
            this.state.score = 0;
            this.state.errors = 0;
            this.state.currentQuestion = null;
            this.state.usedHint = false;
            this.state.answered = false;
            this.mixAlternationStartsWithShape = true;
            this.feedbackNode.textContent = 'Identifiez la règle logique de la suite.';
            this.renderTopbar();
            this.nextQuestion();
        }

        stop() {
            if (this.hintBtn) this.hintBtn.removeEventListener('click', this.onHintClick);
            if (this.nextBtn) this.nextBtn.removeEventListener('click', this.onNextClick);
        }

        getDifficultyLevel(questionIndex) {
            if (questionIndex <= 3) return 'easy';
            if (questionIndex <= 7) return 'medium';
            return 'hard';
        }

        getDifficultyLabel(level) {
            if (level === 'easy') return 'Facile';
            if (level === 'medium') return 'Moyen';
            return 'Difficile';
        }

        getSubModeForQuestion() {
            if (this.state.mode === 'forme') return 'shape';
            if (this.state.mode === 'chiffre') return 'number';

            const isShapeTurn = this.mixAlternationStartsWithShape;
            this.mixAlternationStartsWithShape = !this.mixAlternationStartsWithShape;
            return isShapeTurn ? 'shape' : 'number';
        }

        renderTopbar() {
            window.arcade.renderGameTopbar(this.topbarMount, {
                id: 'suite-logique-topbar',
                icon: '🧠',
                title: 'Suite Logique',
                statLabel: 'Progression',
                statValue: this.getStatText()
            });
            this.updateModeLabel();
        }

        getModeLabel() {
            if (this.state.mode === 'forme') return 'Forme';
            if (this.state.mode === 'chiffre') return 'Chiffre';
            return 'Mixte (alterné)';
        }

        updateModeLabel() {
            if (this.modeValueNode) this.modeValueNode.textContent = this.getModeLabel();
        }

        getStatText() {
            const answeredCount = Math.max(0, this.state.questionIndex - 1);
            return `Q${answeredCount}/${this.totalQuestions} • ${this.state.score} pts • ${this.state.errors}/${this.maxErrors} erreurs`;
        }

        updateTopbarStat() {
            window.arcade.updateGameTopbarStat('suite-logique-topbar', this.getStatText());
        }

        nextQuestion() {
            if (this.state.errors >= this.maxErrors || this.state.questionIndex >= this.totalQuestions) {
                this.endGame();
                return;
            }

            this.state.questionIndex += 1;
            this.state.usedHint = false;
            this.state.answered = false;

            const difficulty = this.getDifficultyLevel(this.state.questionIndex);
            const mode = this.getSubModeForQuestion();
            const question = this.buildQuestion(mode, difficulty);
            this.state.currentQuestion = question;
            this.state.startedAtMs = performance.now();

            this.renderQuestion(question);
            this.updateTopbarStat();
            this.nextBtn.disabled = true;
            this.nextBtn.textContent = 'Question suivante';
            this.hintBtn.disabled = false;
            this.feedbackNode.textContent = 'Analysez la suite puis choisissez la bonne réponse.';
        }

        renderQuestion(question) {
            this.updateModeLabel();

            if (this.questionCountNode) {
                this.questionCountNode.textContent = `Question ${this.state.questionIndex}/${this.totalQuestions}`;
            }
            if (this.difficultyNode) {
                this.difficultyNode.textContent = this.getDifficultyLabel(question.difficulty);
            }
            if (this.promptNode) {
                this.promptNode.textContent = question.prompt || 'Complétez la suite.';
            }

            this.sequenceNode.innerHTML = '';
            question.sequence.forEach((item) => {
                const node = document.createElement('div');
                node.className = 'sl-seq-item';
                if (question.mode === 'shape') {
                    node.innerHTML = this.renderShapeSvg(item);
                } else {
                    node.textContent = String(item);
                }
                this.sequenceNode.appendChild(node);
            });

            const unknownNode = document.createElement('div');
            unknownNode.className = 'sl-seq-item sl-seq-unknown';
            unknownNode.textContent = '?';
            this.sequenceNode.appendChild(unknownNode);

            this.optionsNode.innerHTML = '';
            question.options.forEach((opt, index) => {
                const button = document.createElement('button');
                button.type = 'button';
                button.className = 'sl-option-btn';
                button.dataset.optionIndex = String(index);
                button.setAttribute('aria-label', question.mode === 'shape' ? this.describeShape(opt.value) : `Option ${index + 1}: ${opt.value}`);

                if (question.mode === 'shape') {
                    button.innerHTML = `<div class="sl-option-shape">${this.renderShapeSvg(opt.value)}</div>`;
                } else {
                    button.textContent = String(opt.value);
                }

                button.addEventListener('click', () => this.answer(index));
                this.optionsNode.appendChild(button);
            });
        }

        answer(optionIndex) {
            if (this.state.answered || !this.state.currentQuestion) return;
            this.state.answered = true;

            const question = this.state.currentQuestion;
            const selected = question.options[optionIndex];
            const isCorrect = !!selected && selected.isCorrect;
            const elapsedSec = this.consumeElapsedSeconds();

            const allButtons = this.optionsNode.querySelectorAll('.sl-option-btn');
            allButtons.forEach((btn, idx) => {
                btn.disabled = true;
                if (question.options[idx].isCorrect) btn.classList.add('correct');
            });
            const selectedBtn = this.optionsNode.querySelector(`[data-option-index="${optionIndex}"]`);

            if (isCorrect) {
                const rawPoints = this.basePoints + (elapsedSec <= this.quickAnswerSeconds ? this.quickBonus : 0);
                const earned = this.state.usedHint ? Math.max(1, Math.floor(rawPoints / 2)) : rawPoints;
                this.state.score += earned;
                if (selectedBtn) selectedBtn.classList.add('selected-correct');
                this.feedbackNode.textContent = `Bonne réponse. ${question.explanation} (+${earned} pts)`;
            } else {
                this.state.errors += 1;
                this.state.score = Math.max(0, this.state.score - this.errorPenalty);
                if (selectedBtn) selectedBtn.classList.add('selected-wrong');
                this.feedbackNode.textContent = `Mauvaise réponse. ${question.explanation} (-${this.errorPenalty} pts)`;
            }

            this.updateTopbarStat();
            this.hintBtn.disabled = true;

            if (this.state.errors >= this.maxErrors || this.state.questionIndex >= this.totalQuestions) {
                this.nextBtn.textContent = 'Voir le résultat';
            }
            this.nextBtn.disabled = false;
        }

        useHint() {
            if (this.state.answered || this.state.usedHint || !this.state.currentQuestion) return;
            this.state.usedHint = true;
            this.hintBtn.disabled = true;
            this.feedbackNode.textContent = `Indice: ${this.state.currentQuestion.hint} (points divisés par 2 si bonne réponse)`;
        }

        consumeElapsedSeconds() {
            if (this.testElapsedQueue.length > 0) {
                const testValue = Number(this.testElapsedQueue.shift());
                if (!Number.isNaN(testValue) && testValue >= 0) return testValue;
            }
            return Math.max(0, (performance.now() - this.state.startedAtMs) / 1000);
        }

        endGame() {
            const answeredCount = Math.min(this.totalQuestions, this.state.questionIndex);
            const success = this.state.errors < this.maxErrors;

            window.arcade.showGameOverModal({
                title: 'suite-logique',
                gameStatus: success ? 'Partie Terminée !' : 'Fin de partie',
                icon: '🧠',
                stats: [
                    { label: 'Score final', value: `${this.state.score} pts` },
                    { label: 'Questions jouées', value: `${answeredCount} / ${this.totalQuestions}` },
                    { label: 'Erreurs', value: `${this.state.errors} / ${this.maxErrors}` },
                    { label: 'Mode', value: this.getModeLabel() }
                ],
                score: this.state.score,
                scoreType: 'points',
                onReplay: () => this.startScreen(),
                onQuit: () => window.arcade.renderHome()
            });
        }

        buildQuestion(mode, difficulty) {
            if (this.testQuestionQueue.length > 0) {
                return this.normalizeTestQuestion(this.testQuestionQueue.shift(), mode, difficulty);
            }
            if (mode === 'shape') return this.generateShapeQuestion(difficulty);
            return this.generateNumberQuestion(difficulty);
        }

        normalizeTestQuestion(question, fallbackMode, fallbackDifficulty) {
            const normalizedMode = question && question.mode ? question.mode : fallbackMode;
            const sequence = Array.isArray(question && question.sequence) ? question.sequence.slice(0, 5) : [1, 2, 3, 4, 5];
            const answer = question && Object.prototype.hasOwnProperty.call(question, 'answer') ? question.answer : (normalizedMode === 'shape'
                ? this.generateShapeState('square', 0, 'var(--accent)', 1)
                : 6);

            const rawOptions = Array.isArray(question && question.options) && question.options.length >= 4
                ? question.options.slice(0, 4)
                : [answer, answer + 1, answer + 2, answer + 3];

            const options = rawOptions.map((value) => ({
                value,
                isCorrect: this.isEquivalentValue(value, answer, normalizedMode)
            }));

            if (!options.some((opt) => opt.isCorrect)) {
                options[0].isCorrect = true;
                options[0].value = answer;
            }

            return {
                mode: normalizedMode,
                difficulty: question && question.difficulty ? question.difficulty : fallbackDifficulty,
                prompt: question && question.prompt ? question.prompt : 'Complétez la suite.',
                sequence,
                answer,
                options,
                explanation: question && question.explanation ? question.explanation : 'La règle est appliquée terme après terme.',
                hint: question && question.hint ? question.hint : 'Cherchez la transformation entre deux éléments voisins.'
            };
        }

        isEquivalentValue(valueA, valueB, mode) {
            if (mode === 'shape') {
                return this.getShapeKey(valueA) === this.getShapeKey(valueB);
            }
            return Number(valueA) === Number(valueB);
        }

        generateNumberQuestion(difficulty) {
            if (difficulty === 'easy') return this.generateNumberEasy();
            if (difficulty === 'medium') return this.generateNumberMedium();
            return this.generateNumberHard();
        }

        generateNumberEasy() {
            const step = this.randomInt(2, 9);
            const start = this.randomInt(1, 30);
            const sequence = this.buildArithmeticSequence(start, step, 5);
            const answer = sequence[4] + step;
            const options = this.buildNumericOptions(answer, [answer + 1, answer - 1, answer + step]);

            return {
                mode: 'number',
                difficulty: 'easy',
                prompt: 'Complétez la suite numérique.',
                sequence,
                answer,
                options,
                explanation: `Règle: +${step} à chaque terme.`,
                hint: `L'écart est constant: +${step}.`
            };
        }

        generateNumberMedium() {
            const variant = Math.random() < 0.5 ? 'mulAdd' : 'alternating';
            if (variant === 'mulAdd') {
                const factor = this.randomInt(2, 3);
                const plus = this.randomInt(1, 4);
                const start = this.randomInt(1, 9);
                const sequence = [start];
                while (sequence.length < 5) {
                    sequence.push(sequence[sequence.length - 1] * factor + plus);
                }
                const answer = sequence[4] * factor + plus;
                const options = this.buildNumericOptions(answer, [answer + plus, answer - plus, sequence[4] + factor]);

                return {
                    mode: 'number',
                    difficulty: 'medium',
                    prompt: 'Identifiez la règle composée de la suite.',
                    sequence,
                    answer,
                    options,
                    explanation: `Règle: ×${factor} puis +${plus}.`,
                    hint: `Le terme suivant dépend d'une multiplication puis d'une addition.`
                };
            }

            const addA = this.randomInt(3, 8);
            const subB = this.randomInt(1, 4);
            const start = this.randomInt(15, 35);
            const sequence = [start];
            while (sequence.length < 5) {
                const prev = sequence[sequence.length - 1];
                const delta = (sequence.length % 2 === 1) ? addA : -subB;
                sequence.push(prev + delta);
            }
            const answer = sequence[4] + ((sequence.length % 2 === 1) ? addA : -subB);
            const options = this.buildNumericOptions(answer, [answer + addA, answer - subB, sequence[4] + subB]);

            return {
                mode: 'number',
                difficulty: 'medium',
                prompt: 'La suite alterne deux transformations. Trouvez la suivante.',
                sequence,
                answer,
                options,
                explanation: `Règle alternée: +${addA}, puis -${subB}, puis répétition.`,
                hint: 'Séparez les sauts impairs et pairs.'
            };
        }

        generateNumberHard() {
            const startA = this.randomInt(2, 14);
            const stepA = this.randomInt(2, 6);
            const startB = this.randomInt(5, 17);
            const stepB = this.randomInt(2, 6);

            const sequence = [
                startA,
                startB,
                startA + stepA,
                startB + stepB,
                startA + (2 * stepA)
            ];
            const answer = startB + (2 * stepB);
            const options = this.buildNumericOptions(answer, [
                startA + (3 * stepA),
                answer + stepB,
                answer - stepA
            ]);

            return {
                mode: 'number',
                difficulty: 'hard',
                prompt: 'Deux suites sont imbriquées. Trouvez le prochain terme.',
                sequence,
                answer,
                options,
                explanation: `Termes impairs: +${stepA}. Termes pairs: +${stepB}.`,
                hint: 'Regroupez les positions 1-3-5 puis 2-4-6.'
            };
        }

        buildArithmeticSequence(start, step, length) {
            const values = [start];
            while (values.length < length) {
                values.push(values[values.length - 1] + step);
            }
            return values;
        }

        buildNumericOptions(answer, candidates) {
            const set = new Set([answer]);
            candidates.forEach((value) => {
                const num = Number(value);
                if (!Number.isNaN(num)) set.add(num);
            });
            while (set.size < 4) {
                const offset = this.randomInt(-9, 9) || 2;
                set.add(answer + offset);
            }

            const options = Array.from(set).slice(0, 4).map((value) => ({
                value,
                isCorrect: value === answer
            }));

            return this.shuffle(options);
        }

        generateShapeQuestion(difficulty) {
            if (difficulty === 'easy') return this.generateShapeEasy();
            if (difficulty === 'medium') return this.generateShapeMedium();
            return this.generateShapeHard();
        }

        generateShapeEasy() {
            const shape = this.pick(['circle', 'square', 'triangle']);
            const rotationStep = this.pick([45, 90]);
            const color = this.pick(['#06b6d4', '#f97316', '#84cc16', '#a855f7']);
            const sequence = [];

            for (let i = 0; i < 5; i += 1) {
                sequence.push(this.generateShapeState(shape, i * rotationStep, color, 1));
            }

            const answer = this.generateShapeState(shape, 5 * rotationStep, color, 1);
            const options = this.buildShapeOptions(answer, [
                this.generateShapeState(shape, 4 * rotationStep, color, 1),
                this.generateShapeState(shape, 5 * rotationStep, color, 2),
                this.generateShapeState(shape, 5 * rotationStep + 45, color, 1)
            ]);

            return {
                mode: 'shape',
                difficulty: 'easy',
                prompt: 'Complétez la suite de formes.',
                sequence,
                answer,
                options,
                explanation: `Règle: rotation de ${rotationStep}° à chaque étape.`,
                hint: `Observez la rotation régulière de ${rotationStep}°.`
            };
        }

        generateShapeMedium() {
            const shape = this.pick(['circle', 'square', 'diamond']);
            const colors = ['#06b6d4', '#f43f5e'];
            const rotationStep = this.pick([45, 90]);
            const sequence = [];

            for (let i = 0; i < 5; i += 1) {
                sequence.push(this.generateShapeState(shape, i * rotationStep, colors[i % 2], 1));
            }

            const answer = this.generateShapeState(shape, 5 * rotationStep, colors[5 % 2], 1);
            const options = this.buildShapeOptions(answer, [
                this.generateShapeState(shape, 5 * rotationStep, colors[0], 1),
                this.generateShapeState(shape, 4 * rotationStep, colors[5 % 2], 1),
                this.generateShapeState(shape, 5 * rotationStep, colors[5 % 2], 2)
            ]);

            return {
                mode: 'shape',
                difficulty: 'medium',
                prompt: 'La forme change selon deux règles combinées.',
                sequence,
                answer,
                options,
                explanation: 'Règle: rotation progressive + alternance de couleur.',
                hint: 'Suivez la couleur en alternance puis la rotation.'
            };
        }

        generateShapeHard() {
            const shape = this.pick(['triangle', 'square', 'diamond']);
            const colors = ['#22c55e', '#f59e0b', '#3b82f6'];
            const rotationStep = this.pick([60, 90]);
            const baseCount = this.pick([1, 2]);
            const sequence = [];

            for (let i = 0; i < 5; i += 1) {
                sequence.push(this.generateShapeState(shape, i * rotationStep, colors[i % 3], baseCount + (i % 3)));
            }

            const answer = this.generateShapeState(shape, 5 * rotationStep, colors[5 % 3], baseCount + (5 % 3));
            const options = this.buildShapeOptions(answer, [
                this.generateShapeState(shape, 5 * rotationStep, colors[(5 + 1) % 3], baseCount + (5 % 3)),
                this.generateShapeState(shape, 4 * rotationStep, colors[5 % 3], baseCount + (5 % 3)),
                this.generateShapeState(shape, 5 * rotationStep, colors[5 % 3], baseCount + ((5 + 1) % 3))
            ]);

            return {
                mode: 'shape',
                difficulty: 'hard',
                prompt: 'Plusieurs attributs évoluent en même temps. Trouvez le suivant.',
                sequence,
                answer,
                options,
                explanation: 'Règle: rotation, cycle de couleur et nombre de symboles évoluent ensemble.',
                hint: 'Regardez séparément la rotation, la couleur et le nombre de formes.'
            };
        }

        buildShapeOptions(answer, candidates) {
            const values = [answer, ...candidates];
            const byKey = new Map();
            values.forEach((value) => byKey.set(this.getShapeKey(value), value));

            while (byKey.size < 4) {
                const randomVariant = this.generateShapeState(
                    answer.shape,
                    answer.rotation + this.pick([30, 45, 60, 90]),
                    this.pick(['#06b6d4', '#f97316', '#22c55e', '#3b82f6']),
                    this.randomInt(1, 3)
                );
                byKey.set(this.getShapeKey(randomVariant), randomVariant);
            }

            const options = Array.from(byKey.values()).slice(0, 4).map((value) => ({
                value,
                isCorrect: this.getShapeKey(value) === this.getShapeKey(answer)
            }));

            return this.shuffle(options);
        }

        generateShapeState(shape, rotation, color, count) {
            return {
                shape,
                rotation: ((rotation % 360) + 360) % 360,
                color,
                count: Math.max(1, Math.min(4, count))
            };
        }

        getShapeKey(state) {
            if (!state) return '';
            return `${state.shape}|${state.rotation}|${state.color}|${state.count}`;
        }

        describeShape(state) {
            const shapeNameMap = {
                circle: 'cercle',
                square: 'carré',
                triangle: 'triangle',
                diamond: 'losange'
            };
            const shapeName = shapeNameMap[state.shape] || state.shape;
            return `${state.count} ${shapeName}, rotation ${state.rotation} degrés`;
        }

        renderShapeSvg(state) {
            const spacing = 18;
            const baseX = 26;
            let symbols = '';
            const totalWidth = (state.count - 1) * spacing;

            for (let i = 0; i < state.count; i += 1) {
                const x = baseX + (i * spacing) - (totalWidth / 2);
                symbols += this.renderSingleShape(state.shape, x, 26, 8, state.color);
            }

            return `
                <svg class="sl-shape-svg" viewBox="0 0 52 52" role="img" aria-label="${this.describeShape(state)}">
                    <g transform="rotate(${state.rotation} 26 26)">
                        ${symbols}
                    </g>
                </svg>
            `;
        }

        renderSingleShape(shape, x, y, size, color) {
            if (shape === 'circle') {
                return `<circle cx="${x}" cy="${y}" r="${size}" fill="${color}" />`;
            }
            if (shape === 'triangle') {
                return `<polygon points="${x},${y - size} ${x - size},${y + size} ${x + size},${y + size}" fill="${color}" />`;
            }
            if (shape === 'diamond') {
                return `<polygon points="${x},${y - size} ${x - size},${y} ${x},${y + size} ${x + size},${y}" fill="${color}" />`;
            }
            return `<rect x="${x - size}" y="${y - size}" width="${size * 2}" height="${size * 2}" rx="2" fill="${color}" />`;
        }

        randomInt(min, max) {
            return Math.floor(Math.random() * (max - min + 1)) + min;
        }

        pick(values) {
            return values[this.randomInt(0, values.length - 1)];
        }

        shuffle(values) {
            const copy = values.slice();
            for (let i = copy.length - 1; i > 0; i -= 1) {
                const j = Math.floor(Math.random() * (i + 1));
                [copy[i], copy[j]] = [copy[j], copy[i]];
            }
            return copy;
        }

        setTestQuestionQueue(questions) {
            if (!Array.isArray(questions)) {
                this.testQuestionQueue = [];
                return;
            }
            this.testQuestionQueue = questions.slice();
        }

        setTestElapsedQueue(values) {
            if (!Array.isArray(values)) {
                this.testElapsedQueue = [];
                return;
            }
            this.testElapsedQueue = values
                .map((v) => Number(v))
                .filter((v) => !Number.isNaN(v) && v >= 0);
        }
    }

    window.initSuiteLogique = function (container) {
        const game = new SuiteLogiqueGame(container);
        window._suiteLogiqueGame = game;
        window.arcade.registerGameCleanup(() => game.stop(), 'suite-logique');
        game.startScreen();
    };
})();
