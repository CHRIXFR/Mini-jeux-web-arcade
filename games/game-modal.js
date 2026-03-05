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

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.id = 'game-start-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-game-icon">${config.icon || '🎮'}</div>
                <h2>${config.title || 'Jeu'}</h2>
                <p class="modal-description">${config.description || ''}</p>
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
     * Affiche la modale de fin de jeu.
     * @param {Object} config
     * @param {string} config.title - "Victoire !", "Game Over", etc.
     * @param {string} [config.icon] - Emoji de contexte
     * @param {Array} [config.stats] - [{ label, value }]
     * @param {number} [config.xpGained] - XP gagnés
     * @param {Function} config.onReplay - Callback "Rejouer"
     * @param {Function} [config.onQuit] - Callback "Menu Principal"
     */
    window.arcade.showGameOverModal = function (config) {
        // SÉCURITÉ : Ne pas afficher si le joueur est revenu à l'accueil entre-temps
        if (window.arcade.state && window.arcade.state.currentView !== 'game') {
            console.warn("Affichage de modale de fin ignoré (déjà de retour au menu).");
            return;
        }

        const existingModal = document.getElementById('game-over-modal');
        if (existingModal) existingModal.remove();

        // Construction des stats
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

        // XP
        const xpHTML = (config.xpGained && config.xpGained > 0)
            ? `<div class="xp-bonus">+${config.xpGained} XP</div>`
            : '';

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.id = 'game-over-modal';
        modal.innerHTML = `
            <div class="modal-content">
                ${config.icon ? `<div class="modal-game-icon">${config.icon}</div>` : ''}
                <h2>${config.title || 'Fin'}</h2>
                ${statsHTML}
                ${xpHTML}
                <div class="modal-actions">
                    <button id="modal-btn-replay" class="btn-primary">Rejouer</button>
                    <button id="modal-btn-home" class="btn-secondary">Menu Principal</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        document.getElementById('modal-btn-replay').addEventListener('click', () => {
            modal.remove();
            if (config.onReplay) config.onReplay();
        });

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
