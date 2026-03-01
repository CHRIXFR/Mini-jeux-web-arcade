// games/capitales.js
(function () {
    const STATE = {
        countries: [],
        currentQuestion: null,
        mode: null, // 'pays', 'capitale', 'mixte'
        score: 0,
        questionsAsked: 0,
        totalQuestions: 10,
        options: []
    };

    const DOM = {};

    function initCapitales(mountPoint) {
        mountPoint.innerHTML = `
            <div id="capitales-app" class="capitales-container fade-in">
                <div class="capitales-header">
                    <h2>🌍 Jeu des Capitales</h2>
                    <div class="score-board">Score: <span id="cap-score">0</span> / <span id="cap-total">10</span></div>
                </div>
                
                <div id="cap-menu" class="cap-menu">
                    <h3>Choisissez votre mode de jeu</h3>
                    <div class="mode-buttons">
                        <button class="btn-primary cap-mode-btn" data-mode="pays">🏳️ Nommer le Pays</button>
                        <button class="btn-primary cap-mode-btn" data-mode="capitale">🏙️ Nommer la Capitale</button>
                        <button class="btn-primary cap-mode-btn" data-mode="mixte">🎲 Mode Mixte</button>
                    </div>
                    <div id="cap-loading" style="display:none; text-align:center; margin-top:20px;">Chargement des données...</div>
                </div>

                <div id="cap-game" class="cap-game" style="display: none;">
                    <div class="card cap-flag-container">
                        <picture id="cap-flag-pic">
                            <!-- Le drapeau sera injecté ici -->
                        </picture>
                    </div>
                    <div id="cap-question-text" class="cap-question">Quel est ce pays ?</div>
                    <div id="cap-options" class="cap-options-grid">
                        <!-- Boutons d'options générés dynamiquement -->
                    </div>
                    <button id="cap-next-btn" class="btn-secondary cap-next" style="display:none;">Question Suivante ➡️</button>
                </div>
                
                <div id="cap-end" class="cap-end" style="display: none;">
                    <h3>Partie Terminée !</h3>
                    <div class="final-score">Vous avez obtenu <span id="cap-final-score"></span> bonnes réponses.</div>
                    <p id="cap-xp-reward" class="xp-reward"></p>
                    <button id="cap-restart-btn" class="btn-primary">Rejouer</button>
                    <button onclick="window.arcade.renderHome()" class="btn-secondary">Retour à l'Accueil</button>
                </div>
            </div>
        `;

        DOM.menu = document.getElementById('cap-menu');
        DOM.game = document.getElementById('cap-game');
        DOM.end = document.getElementById('cap-end');
        DOM.loading = document.getElementById('cap-loading');
        DOM.flagPic = document.getElementById('cap-flag-pic');
        DOM.questionText = document.getElementById('cap-question-text');
        DOM.optionsContainer = document.getElementById('cap-options');
        DOM.score = document.getElementById('cap-score');
        DOM.total = document.getElementById('cap-total');
        DOM.nextBtn = document.getElementById('cap-next-btn');
        DOM.finalScore = document.getElementById('cap-final-score');
        DOM.xpReward = document.getElementById('cap-xp-reward');
        DOM.restartBtn = document.getElementById('cap-restart-btn');

        bindEvents();
        loadData();
    }

    async function loadData() {
        if (STATE.countries.length > 0) return; // Déjà chargé

        DOM.loading.style.display = 'block';
        try {
            const response = await fetch('games/data/capitales.json');
            if (!response.ok) throw new Error("Erreur chargement données");
            STATE.countries = await response.json();
        } catch (error) {
            console.error(error);
            window.arcade.showToast("Erreur lors du chargement des pays.");
        } finally {
            DOM.loading.style.display = 'none';
        }
    }

    function bindEvents() {
        document.querySelectorAll('.cap-mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => startGame(e.target.dataset.mode));
        });

        DOM.nextBtn.addEventListener('click', generateQuestion);

        DOM.restartBtn.addEventListener('click', () => {
            DOM.end.style.display = 'none';
            DOM.menu.style.display = 'block';
        });
    }

    function startGame(mode) {
        if (STATE.countries.length < 5) {
            window.arcade.showToast("Les données ne sont pas encore prêtes.");
            return;
        }
        STATE.mode = mode;
        STATE.score = 0;
        STATE.questionsAsked = 0;

        DOM.total.textContent = STATE.totalQuestions;
        updateScoreBoard();

        DOM.menu.style.display = 'none';
        DOM.end.style.display = 'none';
        DOM.game.style.display = 'flex';

        generateQuestion();
    }

    function generateQuestion() {
        STATE.questionsAsked++;
        if (STATE.questionsAsked > STATE.totalQuestions) {
            endGame();
            return;
        }

        DOM.nextBtn.style.display = 'none';
        DOM.optionsContainer.innerHTML = '';
        DOM.flagPic.classList.remove('answered');

        // Sélectionner 5 pays uniques aléatoirement
        const shuffled = [...STATE.countries].sort(() => 0.5 - Math.random());
        const selectedCountries = shuffled.slice(0, 5);

        // La bonne réponse est le premier des 5
        STATE.currentQuestion = selectedCountries[0];
        STATE.options = selectedCountries.sort(() => 0.5 - Math.random()); // Mélanger les options

        // Déterminer le sous-mode pour cette question si on est en mixte
        let currentSubMode = STATE.mode;
        if (currentSubMode === 'mixte') {
            currentSubMode = Math.random() > 0.5 ? 'pays' : 'capitale';
        }

        renderQuestion(currentSubMode);
    }

    function renderQuestion(mode) {
        const country = STATE.currentQuestion;

        // Mettre à jour le drapeau
        DOM.flagPic.innerHTML = `
            <source type="image/webp" srcset="https://flagcdn.com/h120/${country.iso}.webp, https://flagcdn.com/h240/${country.iso}.webp 2x">
            <source type="image/png" srcset="https://flagcdn.com/h120/${country.iso}.png, https://flagcdn.com/h240/${country.iso}.png 2x">
            <img src="https://flagcdn.com/h120/${country.iso}.png" height="120" alt="Drapeau de ${country.nom}" class="cap-flag-img">
        `;

        if (mode === 'pays') {
            DOM.questionText.textContent = "À quel pays appartient ce drapeau ?";
        } else {
            DOM.questionText.textContent = `Quelle est la capitale de ce pays (${country.nom}) ?`;
        }

        // Créer les boutons d'options
        STATE.options.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'cap-option-btn';
            btn.textContent = mode === 'pays' ? opt.nom : opt.capitale;
            btn.onclick = () => handleAnswer(opt, btn, mode);
            DOM.optionsContainer.appendChild(btn);
        });
    }

    function handleAnswer(selectedOpt, clickedBtn, mode) {
        // Désactiver tous les boutons
        const allBtns = DOM.optionsContainer.querySelectorAll('.cap-option-btn');
        allBtns.forEach(btn => btn.disabled = true);

        DOM.flagPic.classList.add('answered'); // Pour d'éventuels effets CSS

        const isCorrect = selectedOpt.iso === STATE.currentQuestion.iso;

        if (isCorrect) {
            clickedBtn.classList.add('correct');
            STATE.score++;
            updateScoreBoard();
            window.arcade.showToast('✅ Bonne réponse !');
        } else {
            clickedBtn.classList.add('wrong');
            // Trouver et mettre en surbrillance la bonne réponse
            allBtns.forEach(btn => {
                const correctText = mode === 'pays' ? STATE.currentQuestion.nom : STATE.currentQuestion.capitale;
                if (btn.textContent === correctText) {
                    btn.classList.add('correct');
                }
            });
            window.arcade.showToast('❌ Oups !');
        }

        DOM.nextBtn.style.display = 'block';
    }

    function updateScoreBoard() {
        DOM.score.textContent = STATE.score;
    }

    function endGame() {
        DOM.game.style.display = 'none';
        DOM.end.style.display = 'flex';
        DOM.finalScore.textContent = `${STATE.score} / ${STATE.totalQuestions}`;

        // Calcul XP : 20 XP par bonne réponse
        const xpGained = STATE.score * 20;
        if (xpGained > 0) {
            DOM.xpReward.innerHTML = `Bonus de victoire : <span class="text-accent">+${xpGained} XP</span>`;
            setTimeout(() => window.arcade.addXP(xpGained), 500);
        } else {
            DOM.xpReward.textContent = "Entraînez-vous pour gagner de l'XP !";
        }
    }

    // Exposer l'initialisation globalement
    window.initCapitales = initCapitales;
})();
