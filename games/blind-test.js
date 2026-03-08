// games/blind-test.js
(function () {
    const STATE = {
        tracks: [],
        currentQuestion: null,
        mode: null, // 'blockbusters', 'animation', 'classique', 'mixte'
        score: 0,
        questionsAsked: 0,
        totalQuestions: 5, // 5 questions pour un blind test rapide
        options: []
    };

    const DOM = {};

    function initBlindTest(mountPoint) {
        mountPoint.innerHTML = `
            <div id="blindtest-app" class="blindtest-container fade-in">
                <div class="blindtest-header">
                    <h2>🎵 Blind Test Musical</h2>
                    <div class="score-board">Score: <span id="bt-score">0</span> / <span id="bt-total">5</span></div>
                </div>

                <div id="bt-game" class="bt-game" style="display: none;">
                    <div class="card bt-player-container">
                        <div class="audio-waves" id="bt-audio-waves">
                            <span></span><span></span><span></span><span></span><span></span>
                        </div>
                        <p class="bt-status" id="bt-status-text">Écoutez bien...</p>
                    </div>
                    
                    <div id="bt-question-text" class="bt-question">Quelle est cette musique ?</div>
                    <div id="bt-options" class="bt-options-grid"></div>
                    <button id="bt-next-btn" class="btn-secondary bt-next" style="display:none;">Musique Suivante ➡️</button>
                    <button id="bt-replay-btn" class="control-btn bt-replay">🔁 Réécouter</button>
                </div>
            </div>
        `;

        DOM.game = document.getElementById('bt-game');
        DOM.waves = document.getElementById('bt-audio-waves');
        DOM.statusText = document.getElementById('bt-status-text');
        DOM.optionsContainer = document.getElementById('bt-options');
        DOM.score = document.getElementById('bt-score');
        DOM.total = document.getElementById('bt-total');
        DOM.nextBtn = document.getElementById('bt-next-btn');
        DOM.replayBtn = document.getElementById('bt-replay-btn');

        DOM.nextBtn.addEventListener('click', generateQuestion);
        DOM.replayBtn.addEventListener('click', () => playCurrentMelody());

        loadData();
        showStartScreen();
    }

    async function loadData() {
        if (STATE.tracks.length > 0) return;
        try {
            const response = await fetch('games/data/blind-test.json');
            if (!response.ok) throw new Error("Erreur chargement musiques");
            STATE.tracks = await response.json();
        } catch (error) {
            window.arcade.showToast("Erreur lors du chargement des partitions.");
        }
    }

    function showStartScreen() {
        window.arcade.showStartModal({
            title: 'Blind Test 8-Bits',
            icon: '🎵',
            description: 'Devinez les titres des musiques célèbres jouées par le synthétiseur rétro.',
            controls: [
                { icon: '🎧', desktop: 'Montez le son', mobile: 'Montez le son' },
                { icon: '🖱️', desktop: 'Sélectionnez le bon titre', mobile: 'Touchez le bon titre' }
            ],
            onStart: function () { startGame('mixte'); },
            onQuit: function () { window.arcade.renderHome(); }
        });
    }

    function startGame(mode) {
        if (STATE.tracks.length < 5) {
            window.arcade.showToast("Les musiques ne sont pas prêtes.");
            return;
        }

        // Auto-Unmute : Si le son est coupé, on l'active (car l'utilisateur vient de cliquer sur "Commencer")
        if (window.arcade.audio && window.arcade.audio.isMuted) {
            if (typeof window.arcade.toggleAudio === 'function') {
                window.arcade.toggleAudio();
            } else {
                window.arcade.audio.toggleMute();
            }
            window.arcade.showToast("🎵 Le son a été activé automatiquement");
        }

        // Couper la BGM de fond de l'arcade car on va jouer du son
        if (window.arcade.audio) {
            if (typeof window.arcade.audio.suspendBgm === 'function') {
                window.arcade.audio.suspendBgm(true);
            } else if (typeof window.arcade.audio.pauseMusic === 'function') {
                window.arcade.audio.pauseMusic();
            }
        }

        STATE.mode = mode;
        STATE.score = 0;
        STATE.questionsAsked = 0;

        DOM.total.textContent = STATE.totalQuestions;
        DOM.nextBtn.textContent = "Musique Suivante ➡️"; // Réinitialisation du bouton
        updateScoreBoard();

        DOM.game.style.display = 'flex';
        generateQuestion();
    }

    function generateQuestion() {
        window.arcade.audio.stopMelody(); // S'assurer que ça s'arrête

        STATE.questionsAsked++;
        if (STATE.questionsAsked > STATE.totalQuestions) {
            endGame();
            return;
        }

        DOM.nextBtn.style.display = 'none';
        DOM.replayBtn.style.display = 'none';
        DOM.optionsContainer.innerHTML = '';
        DOM.waves.classList.add('playing');
        DOM.statusText.textContent = "Écoute en cours...";

        // Filtrer les pistes par thème
        let availableTracks = STATE.tracks;
        if (STATE.mode !== 'mixte') {
            availableTracks = STATE.tracks.filter(t => t.theme === STATE.mode);
        }

        // Si pas assez de pistes pour des questions uniques, on mélange tout 
        // ou on rejoue des existantes (ici on les mélange juste).
        const shuffledPool = [...availableTracks].sort(() => 0.5 - Math.random());

        // Sélectionner la bonne réponse (la première)
        STATE.currentQuestion = shuffledPool[0];

        // Pour les options fausses, on peut piocher dans tout le catalogue pour plus de choix
        const allOtherTracks = [...STATE.tracks].filter(t => t.id !== STATE.currentQuestion.id).sort(() => 0.5 - Math.random());

        // On prend 4 mauvaises réponses
        const falseOptions = allOtherTracks.slice(0, 4);

        STATE.options = [STATE.currentQuestion, ...falseOptions].sort(() => 0.5 - Math.random());

        renderQuestion();
        playCurrentMelody();
    }

    function renderQuestion() {
        STATE.options.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'bt-option-btn';
            btn.textContent = opt.titre;
            btn.onclick = () => handleAnswer(opt, btn);
            DOM.optionsContainer.appendChild(btn);
        });
    }

    function playCurrentMelody() {
        if (!STATE.currentQuestion) return;
        DOM.waves.classList.add('playing');
        DOM.statusText.textContent = "Écoute en cours...";

        window.arcade.audio.playMelody(
            STATE.currentQuestion.notes,
            STATE.currentQuestion.bpm,
            STATE.currentQuestion.type
        );

        // Arrêt visuel approximatif (basé sur la durée de la mélodie)
        const durationSecs = STATE.currentQuestion.notes.reduce((acc, curr) => acc + (curr.d * (60 / STATE.currentQuestion.bpm)), 0);

        clearTimeout(STATE.waveTimeout);
        STATE.waveTimeout = setTimeout(() => {
            if (DOM.nextBtn.style.display === 'none') { // Si le joueur n'a pas encore répondu
                DOM.waves.classList.remove('playing');
                DOM.statusText.textContent = "Musique terminée.";
                DOM.replayBtn.style.display = 'inline-flex';
            }
        }, durationSecs * 1000);
    }

    function handleAnswer(selectedOpt, btnElement) {
        // Stopper la musique dès que le joueur répond
        window.arcade.audio.stopMelody();
        clearTimeout(STATE.waveTimeout);
        DOM.waves.classList.remove('playing');
        DOM.statusText.textContent = "";
        DOM.replayBtn.style.display = 'none';

        const isCorrect = selectedOpt.id === STATE.currentQuestion.id;

        // Désactiver tous les boutons
        const allBtns = DOM.optionsContainer.querySelectorAll('button');
        allBtns.forEach(b => b.disabled = true);

        if (isCorrect) {
            btnElement.classList.add('correct');
            STATE.score++;
            updateScoreBoard();
            window.arcade.audio.playTone(600, 'sine', 0.1, 0.1);
        } else {
            btnElement.classList.add('wrong');
            // Montrer la bonne réponse
            allBtns.forEach(b => {
                if (b.textContent === STATE.currentQuestion.titre) {
                    b.classList.add('correct');
                }
            });
            window.arcade.audio.playTone(150, 'sawtooth', 0.3, 0.2);
        }

        DOM.nextBtn.style.display = 'inline-flex';

        if (STATE.questionsAsked === STATE.totalQuestions) {
            DOM.nextBtn.textContent = "Terminer 🏁";
        }
    }

    function updateScoreBoard() {
        DOM.score.textContent = STATE.score;
        // Animation du score
        DOM.score.style.transform = 'scale(1.5)';
        DOM.score.style.color = 'var(--success)';
        setTimeout(() => {
            DOM.score.style.transform = 'scale(1)';
            DOM.score.style.color = 'var(--accent)';
        }, 300);
    }

    function endGame() {
        DOM.game.style.display = 'none';

        // Relancer la musique de fond de l'arcade s'il y en avait une
        if (window.arcade.audio) {
            if (typeof window.arcade.audio.suspendBgm === 'function') {
                window.arcade.audio.suspendBgm(false);
            } else if (typeof window.arcade.audio.playMusic === 'function' && !window.arcade.audio.isMuted) {
                window.arcade.audio.playMusic();
            }
        }

        window.arcade.showGameOverModal({
            title: 'blind-test',
            gameStatus: 'Test Terminé !',
            icon: '🎵',
            stats: [
                { label: 'Score', value: STATE.score + ' / ' + STATE.totalQuestions }
            ],
            score: STATE.score,
            scoreType: 'points',
            onReplay: function () { startGame(STATE.mode); },
            onQuit: function () { window.arcade.renderHome(); }
        });
    }

    window.initBlindTest = function (mountPoint) {
        initBlindTest(mountPoint);
    };

})();
