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

                <div id="cap-game" class="cap-game" style="display: none;">
                    <div class="card cap-flag-container">
                        <picture id="cap-flag-pic">
                        </picture>
                    </div>
                    <div id="cap-question-text" class="cap-question">Quel est ce pays ?</div>
                    <div id="cap-options" class="cap-options-grid">
                    </div>
                    <button id="cap-next-btn" class="btn-secondary cap-next" style="display:none;">Question Suivante ➡️</button>
                </div>
            </div>
        `;


        DOM.game = document.getElementById('cap-game');
        DOM.flagPic = document.getElementById('cap-flag-pic');
        DOM.questionText = document.getElementById('cap-question-text');
        DOM.optionsContainer = document.getElementById('cap-options');
        DOM.score = document.getElementById('cap-score');
        DOM.total = document.getElementById('cap-total');
        DOM.nextBtn = document.getElementById('cap-next-btn');

        DOM.nextBtn.addEventListener('click', generateQuestion);
        loadData();

        // Afficher la modale de start après le chargement des données
        showStartScreen();
    }

    async function loadData() {
        if (STATE.countries.length > 0) return;
        try {
            const response = await fetch('games/data/capitales.json');
            if (!response.ok) throw new Error("Erreur chargement données");
            STATE.countries = await response.json();
        } catch (error) {
            window.arcade.showToast("Erreur lors du chargement des pays.");
        }
    }

    function showStartScreen() {
        window.arcade.showStartModal({
            title: 'Capitales',
            icon: '🌍',
            description: 'Testez vos connaissances en géographie !',
            controls: [
                { icon: '🏳️', desktop: 'Choisissez parmi 5 réponses possibles', mobile: 'Touchez la bonne réponse' }
            ],
            difficulty: {
                options: [
                    { value: 'pays', label: '🏳️ Nommer le Pays' },
                    { value: 'capitale', label: '🏙️ Nommer la Capitale' },
                    { value: 'mixte', label: '🎲 Mode Mixte' }
                ],
                default: 'pays'
            },
            onStart: function (mode) { startGame(mode || 'pays'); },
            onQuit: function () { window.arcade.renderHome(); }
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

        const xpGained = STATE.score * 20;
        if (xpGained > 0) {
            window.arcade.addXP(xpGained);
        }

        const modeLabels = { 'pays': 'Pays', 'capitale': 'Capitale', 'mixte': 'Mixte' };
        window.arcade.showGameOverModal({
            title: 'Partie Terminée !',
            icon: '🌍',
            stats: [
                { label: 'Score', value: `${STATE.score} / ${STATE.totalQuestions}` },
                { label: 'Mode', value: modeLabels[STATE.mode] || 'Mixte' }
            ],
            xpGained: xpGained,
            onReplay: function () { showStartScreen(); },
            onQuit: function () { window.arcade.renderHome(); }
        });
    }

    // Exposer l'initialisation globalement
    window.initCapitales = function (mountPoint) {
        initCapitales(mountPoint);
        // showStartScreen est déjà appelé dans initCapitales(mountPoint)
    };
})();
