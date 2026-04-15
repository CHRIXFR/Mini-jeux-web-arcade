/**
 * Système de Modales Standardisé — Arcade
 * Fonctions utilitaires pour les écrans de démarrage et de fin de jeu.
 */

(function () {
    if (!window.arcade) window.arcade = {};

    function ensureGameTopbarStyles() {
        if (document.getElementById('arcade-game-topbar-styles')) return;
        const style = document.createElement('style');
        style.id = 'arcade-game-topbar-styles';
        style.textContent = `
            .game-topbar {
                display: flex;
                flex-direction: column;
                align-items: stretch;
                gap: 0.6rem;
                padding: 0.85rem 0.95rem;
                margin-bottom: 0.75rem;
                border: 1px solid var(--border);
                background: var(--glass-bg, var(--card-bg));
                border-radius: var(--radius);
                backdrop-filter: blur(10px);
                -webkit-backdrop-filter: blur(10px);
            }
            .game-topbar-left {
                display: flex;
                align-items: flex-start;
                gap: 0.6rem;
                min-width: 0;
            }
            .game-topbar-icon {
                font-size: 1.3rem;
                line-height: 1;
            }
            .game-topbar-title {
                margin: 0;
                font-size: 1.1rem;
                color: var(--text-primary);
                line-height: 1.15;
                white-space: normal;
                word-break: break-word;
                overflow-wrap: anywhere;
                max-width: 100%;
            }
            .game-topbar-right {
                display: grid;
                grid-template-columns: 1fr;
                gap: 0.45rem;
                width: 100%;
            }
            .game-topbar-difficulty {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                justify-content: space-between;
                width: 100%;
            }
            .game-topbar-difficulty label {
                font-size: 0.74rem;
                text-transform: uppercase;
                letter-spacing: 0.06em;
                color: var(--text-secondary);
                font-weight: 600;
            }
            .game-topbar-difficulty select {
                background: var(--card-bg-alt);
                color: var(--text-primary);
                border: 1px solid var(--border);
                border-radius: 8px;
                font-family: inherit;
                height: var(--control-height, var(--btn-height));
                padding: 0 0.6rem;
            }
            .game-topbar-stat {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                justify-content: space-between;
                width: 100%;
            }
            .game-topbar-stat-label {
                font-size: 0.74rem;
                text-transform: uppercase;
                letter-spacing: 0.06em;
                color: var(--text-secondary);
                font-weight: 600;
            }
            .game-topbar-stat-value {
                font-weight: 700;
                color: var(--accent);
                font-variant-numeric: tabular-nums;
                max-width: 100%;
                overflow-wrap: anywhere;
                text-align: right;
                line-height: 1.25;
                min-height: 1.25rem;
            }
            @media (min-width: 900px) {
                .game-topbar {
                    grid-template-columns: minmax(0, 1fr) minmax(260px, auto);
                    display: grid;
                    align-items: center;
                }
            }
            @media (max-width: 520px) {
                .game-topbar {
                    padding: 0.8rem 0.75rem;
                }
                .game-topbar-title {
                    font-size: 1rem;
                }
                .game-topbar-right {
                    gap: 0.4rem;
                }
                .game-topbar-difficulty,
                .game-topbar-stat {
                    justify-content: space-between;
                    width: 100%;
                }
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Crée une topbar standardisée de jeu.
     * @param {HTMLElement|string} target - Node ou sélecteur CSS de montage.
     * @param {Object} config
     */
    window.arcade.renderGameTopbar = function (target, config) {
        ensureGameTopbarStyles();
        const mountNode = typeof target === 'string' ? document.querySelector(target) : target;
        if (!mountNode || !config) return null;

        const barId = config.id || `topbar-${Date.now()}`;
        const difficulty = config.difficulty || null;
        const hasDifficulty = !!(difficulty && Array.isArray(difficulty.options) && difficulty.options.length > 0);
        const diffSelectId = hasDifficulty ? (difficulty.selectId || `${barId}-difficulty`) : null;

        const difficultyHTML = hasDifficulty
            ? `
                <div class="game-topbar-difficulty">
                    <label for="${diffSelectId}">Difficulté</label>
                    <select id="${diffSelectId}" data-role="difficulty-select">
                        ${difficulty.options.map(opt => `<option value="${opt.value}" ${opt.value === difficulty.value ? 'selected' : ''}>${opt.label}</option>`).join('')}
                    </select>
                </div>
              `
            : '';

        mountNode.innerHTML = `
            <div class="game-topbar card" data-topbar-id="${barId}">
                <div class="game-topbar-left">
                    <span class="game-topbar-icon">${config.icon || '🎮'}</span>
                    <h2 class="game-topbar-title">${config.title || 'Jeu'}</h2>
                </div>
                <div class="game-topbar-right">
                    ${difficultyHTML}
                    <div class="game-topbar-stat">
                        <span class="game-topbar-stat-label" data-role="stat-label">${config.statLabel || 'Score'}</span>
                        <span class="game-topbar-stat-value" data-role="stat-value">${config.statValue || '0'}</span>
                    </div>
                </div>
            </div>
        `;

        if (hasDifficulty && typeof difficulty.onChange === 'function') {
            const diffSelect = mountNode.querySelector(`#${diffSelectId}`);
            if (diffSelect) {
                diffSelect.addEventListener('change', (e) => difficulty.onChange(e.target.value));
            }
        }

        return mountNode.querySelector(`[data-topbar-id="${barId}"]`);
    };

    window.arcade.updateGameTopbarStat = function (barId, value) {
        const bar = document.querySelector(`[data-topbar-id="${barId}"]`);
        if (!bar) return;
        const statNode = bar.querySelector('[data-role="stat-value"]');
        if (statNode) statNode.textContent = value;
    };

    window.arcade.updateGameTopbarDifficulty = function (barId, value) {
        const bar = document.querySelector(`[data-topbar-id="${barId}"]`);
        if (!bar) return;
        const select = bar.querySelector('[data-role="difficulty-select"]');
        if (select) select.value = value;
    };

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
        const activeGameId = window.arcade && window.arcade.state ? window.arcade.state.currentView : null;
        const modalGameId = config && (config.gameId || config.title);
        if (activeGameId && activeGameId !== 'home' && modalGameId && modalGameId !== activeGameId) {
            return;
        }

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
