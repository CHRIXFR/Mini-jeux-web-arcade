/**
 * Système de Modales Standardisé — Arcade
 * Fonctions utilitaires pour les écrans de démarrage et de fin de jeu.
 */

(function () {
    if (!window.arcade) window.arcade = {};

    /**
     * Affiche la modale de démarrage d'un jeu.
     * @param {Object} config
     * @param {string} config.title - Nom du jeu
     * @param {string} config.icon - Emoji du jeu
     * @param {string} config.description - Phrase d'accroche
     * @param {Array} [config.controls] - Liste { icon, desktop, mobile }
     * @param {Object|null} [config.difficulty] - { options: [{value, label}], default: string }
     * @param {Function} config.onStart - Callback(difficulty) au clic "Commencer"
     * @param {Function} [config.onQuit] - Callback au clic "Menu Principal"
     */
    window.arcade.showStartModal = function (config) {
        const existingModal = document.getElementById('game-start-modal');
        if (existingModal) existingModal.remove();

        const isMobile = window.innerWidth <= 950 || ('ontouchstart' in window);

        // Construction du HTML des contrôles
        let controlsHTML = '';
        if (config.controls && config.controls.length > 0) {
            const items = config.controls.map(ctrl => {
                const text = isMobile ? (ctrl.mobile || ctrl.desktop) : ctrl.desktop;
                return `<li><span class="modal-ctrl-icon">${ctrl.icon || ''}</span> ${text}</li>`;
            }).join('');
            controlsHTML = `
                <div class="modal-controls-section">
                    <span class="modal-section-label">Contrôles</span>
                    <ul class="modal-controls-list">${items}</ul>
                </div>
            `;
        }

        // Construction du sélecteur de difficulté
        let difficultyHTML = '';
        let selectedDifficulty = config.difficulty ? config.difficulty.default : null;

        if (config.difficulty && config.difficulty.options.length > 0) {
            const buttons = config.difficulty.options.map(opt => {
                const isDefault = opt.value === config.difficulty.default;
                return `<button class="modal-diff-btn ${isDefault ? 'active' : ''}" data-diff="${opt.value}">${opt.label}</button>`;
            }).join('');
            difficultyHTML = `
                <div class="modal-difficulty-section">
                    <span class="modal-section-label">Difficulté</span>
                    <div class="modal-difficulty-selector">${buttons}</div>
                </div>
            `;
        }

        // Affichage du meilleur score si existant
        let bestScoreHTML = '';
        const savedScoreRaw = localStorage.getItem(`arcade_hs_${config.title}`);
        if (savedScoreRaw) {
            const savedData = JSON.parse(savedScoreRaw);
            const scoreLabel = savedData.type === 'time' ? 'Meilleur Temps' : 'Meilleur Score';
            const scoreValue = savedData.type === 'time' ? formatTime(savedData.score) : savedData.score;
            bestScoreHTML = `
                 <div class="modal-best-score" style="margin-top: 1rem; padding: 0.5rem; background: var(--card-bg-alt); border-radius: var(--radius); text-align: center; border: 1px solid var(--border);">
                    <span style="font-size: 0.8rem; color: var(--text-secondary); text-transform: uppercase;">🏆 ${scoreLabel}</span>
                    <div style="font-size: 1.2rem; font-weight: bold; color: var(--accent);">${scoreValue}</div>
                </div>
            `;
        }


        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.id = 'game-start-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-game-icon">${config.icon || '🎮'}</div>
                <h2>${config.title || 'Jeu'}</h2>
                <p class="modal-description">${config.description || ''}</p>
                ${bestScoreHTML}
                ${controlsHTML}
                ${difficultyHTML}
                <div class="modal-actions" style="margin-top: 1.5rem;">
                    <button id="modal-btn-start" class="btn-primary">Commencer</button>
                    <button id="modal-btn-quit" class="btn-secondary">Menu Principal</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // Gestion des boutons de difficulté
        if (config.difficulty) {
            modal.querySelectorAll('.modal-diff-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    modal.querySelectorAll('.modal-diff-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    selectedDifficulty = btn.dataset.diff;
                });
            });
        }

        document.getElementById('modal-btn-start').addEventListener('click', () => {
            modal.remove();
            if (config.onStart) config.onStart(selectedDifficulty);
        });

        document.getElementById('modal-btn-quit').addEventListener('click', () => {
            modal.remove();
            if (config.onQuit) {
                config.onQuit();
            } else {
                window.arcade.renderHome();
            }
        });
    };

    /**
     * Helper pour formater le temps en MM:SS
     */
    function formatTime(seconds) {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    }

    /**
     * Affiche la modale de fin de jeu avec gestion des High Scores locaux.
     * @param {Object} config
     * @param {string} config.title - Titre du jeu (utilisé comme clé de sauvegarde, ex: "Sudoku")
     * @param {string} config.gameStatus - "Victoire !", "Game Over", etc.
     * @param {string} [config.icon] - Emoji de contexte
     * @param {Array} [config.stats] - [{ label, value }] (Statistiques détaillées optionnelles)
     * @param {number} [config.score] - Score principal ou temps de la partie
     * @param {string} [config.scoreType] - 'points' ou 'time' (défaut: 'points')
     * @param {Function} config.onReplay - Callback "Rejouer"
     * @param {Function} [config.onQuit] - Callback "Menu Principal"
     */
    window.arcade.showGameOverModal = function (config) {
        const existingModal = document.getElementById('game-over-modal');
        if (existingModal) existingModal.remove();

        let newRecordHTML = '';
        let isNewRecord = false;
        const scoreType = config.scoreType || 'points';

        // Gestion du High Score Local si un score est fourni
        if (config.score !== undefined && config.title) {
            const storageKey = `arcade_hs_${config.title}`;
            const savedScoreRaw = localStorage.getItem(storageKey);
            let savedData = savedScoreRaw ? JSON.parse(savedScoreRaw) : null;

            if (!savedData) {
                // Premier score enregistré
                isNewRecord = true;
                localStorage.setItem(storageKey, JSON.stringify({ score: config.score, type: scoreType, date: new Date().toISOString() }));
            } else {
                // Comparaison (si points: plus grand c'est mieux. si temps: plus petit c'est mieux)
                if (scoreType === 'points' && config.score > savedData.score) {
                    isNewRecord = true;
                    localStorage.setItem(storageKey, JSON.stringify({ score: config.score, type: scoreType, date: new Date().toISOString() }));
                } else if (scoreType === 'time' && config.score < savedData.score) {
                    isNewRecord = true;
                    localStorage.setItem(storageKey, JSON.stringify({ score: config.score, type: scoreType, date: new Date().toISOString() }));
                }
            }
        }

        if (isNewRecord) {
            newRecordHTML = `
                <div class="new-record-badge" style="background: var(--success); color: white; padding: 0.5rem 1rem; border-radius: 20px; font-weight: bold; font-size: 0.9rem; margin-bottom: 1rem; display: inline-block; animation: pop 0.4s cubic-bezier(.175,.885,.32,1.275);">
                    🎉 NOUVEAU RECORD !
                </div>
            `;
        }

        // Construction des stats détaillées
        let statsHTML = '';
        if (config.stats && config.stats.length > 0) {
            const rows = config.stats.map(s =>
                `<div class="modal-stat-row">
                    <span class="modal-stat-label">${s.label}</span>
                    <span class="modal-stat-value">${s.value}</span>
                </div>`
            ).join('');
            statsHTML = `<div class="modal-stats-grid">${rows}</div>`;
        }

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.id = 'game-over-modal';
        modal.innerHTML = `
            <div class="modal-content">
                ${config.icon ? `<div class="modal-game-icon">${config.icon}</div>` : ''}
                <h2>${config.gameStatus || 'Fin'}</h2>
                ${newRecordHTML}
                ${statsHTML}
                <div class="modal-actions">
                    <button id="modal-btn-replay" class="btn-primary">Rejouer</button>
                    ${config.extraButton ? `<button id="modal-btn-extra" class="btn-secondary" style="margin-top: 10px;">${config.extraButton.label}</button>` : ''}
                    <button id="modal-btn-home" class="btn-secondary" style="margin-top: 10px;">Menu Principal</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        document.getElementById('modal-btn-replay').addEventListener('click', () => {
            modal.remove();
            if (config.onReplay) config.onReplay();
        });

        if (config.extraButton) {
            document.getElementById('modal-btn-extra').addEventListener('click', () => {
                // On peut choisir de fermer la modale ou non, ici on ferme avant d'exécuter l'action
                modal.remove();
                if (config.extraButton.onClick) config.extraButton.onClick();
            });
        }

        document.getElementById('modal-btn-home').addEventListener('click', () => {
            modal.remove();
            if (config.onQuit) {
                config.onQuit();
            } else {
                window.arcade.renderHome();
            }
        });
    };
})();
