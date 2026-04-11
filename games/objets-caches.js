/**
 * Objets Cachés - Mini-jeu
 */

(function () {
    const THEMES = [
        {
            id: 'cuisine',
            name: 'Cuisine',
            // V2 avec assets IA (images sur fond blanc pur)
            items: [
                'images/objets-caches/cuisine/cuisine_obj_1_pomme.png',
                'images/objets-caches/cuisine/cuisine_obj_2_burger.png',
                'images/objets-caches/cuisine/cuisine_obj_3_oeuf.png',
                'images/objets-caches/cuisine/cuisine_obj_4_tasse.png',
                'images/objets-caches/cuisine/cuisine_obj_5_spatule.png',
                'images/objets-caches/cuisine/cuisine_obj_6_banane.png',
                'images/objets-caches/cuisine/cuisine_obj_7_pizza.png',
                'images/objets-caches/cuisine/cuisine_obj_8_fraise.png',
                'images/objets-caches/cuisine/cuisine_obj_9_donut.png',
                'images/objets-caches/cuisine/cuisine_obj_10_vin.png',
                'images/objets-caches/cuisine/cuisine_obj_11_crepe.png',
                'images/objets-caches/cuisine/cuisine_obj_12_coco.png',
                'images/objets-caches/cuisine/cuisine_obj_13_glace.png',
                'images/objets-caches/cuisine/cuisine_obj_14_ketchup.png',
                'images/objets-caches/cuisine/cuisine_obj_15_planche.png'
            ],
            bgId: 'bg-cuisine',
            isImage: true
        },
        {
            id: 'nature',
            name: 'Nature',
            items: [
                'images/objets-caches/nature/nature_obj_1_arbre.png',
                'images/objets-caches/nature/nature_obj_2_sapin.png',
                'images/objets-caches/nature/nature_obj_3_cactus.png',
                'images/objets-caches/nature/nature_obj_4_palmier.png',
                'images/objets-caches/nature/nature_obj_5_champignon.png',
                'images/objets-caches/nature/nature_obj_6_tournesol.png',
                'images/objets-caches/nature/nature_obj_7_marguerite.png',
                'images/objets-caches/nature/nature_obj_8_fleur_rose.png',
                'images/objets-caches/nature/nature_obj_9_feuille.png',
                'images/objets-caches/nature/nature_obj_10_erable.png',
                'images/objets-caches/nature/nature_obj_11_chenille.png',
                'images/objets-caches/nature/nature_obj_12_papillon.png',
                'images/objets-caches/nature/nature_obj_13_escargot.png',
                'images/objets-caches/nature/nature_obj_14_coccinelle.png',
                'images/objets-caches/nature/nature_obj_15_fourmi.png'
            ],
            bgId: 'bg-nature',
            isImage: true
        },
        {
            id: 'espace',
            name: 'Espace',
            items: [
                'images/objets-caches/espace/espace_obj_1_panneau_solaire.png',
                'images/objets-caches/espace/espace_obj_2_antenne.png',
                'images/objets-caches/espace/espace_obj_3_reservoir.png',
                'images/objets-caches/espace/espace_obj_4_casque.png',
                'images/objets-caches/espace/espace_obj_5_cle.png',
                'images/objets-caches/espace/espace_obj_6_debris.png',
                'images/objets-caches/espace/espace_obj_7_capsule.png',
                'images/objets-caches/espace/espace_obj_8_propulseur.png',
                'images/objets-caches/espace/espace_obj_9_circuit.png',
                'images/objets-caches/espace/espace_obj_10_meteorite.png',
                'images/objets-caches/espace/espace_obj_11_satellite.png',
                'images/objets-caches/espace/espace_obj_12_carlingue.png',
                'images/objets-caches/espace/espace_obj_13_camera.png',
                'images/objets-caches/espace/espace_obj_14_botte.png',
                'images/objets-caches/espace/espace_obj_15_disque.png'
            ],
            bgId: 'bg-espace',
            isImage: true
        },
    ];

    const LEVELS = [
        { targetsCount: 3, parasitesCount: 7, baseTime: 30 }, // Niveau 1
        { targetsCount: 4, parasitesCount: 11, baseTime: 30 }, // Niveau 2
        { targetsCount: 5, parasitesCount: 15, baseTime: 25 }, // Niveau 3
        { targetsCount: 6, parasitesCount: 20, baseTime: 25 }, // Niveau 4
        { targetsCount: 7, parasitesCount: 30, baseTime: 20 }, // Niveau 5
    ];

    class ObjetsCachesGame {
        constructor(container) {
            this.container = container;
            this.levelIndex = 0;
            this.score = 0;

            this.currentTheme = null;
            this.targets = [];
            this.parasites = [];
            this.foundTargets = 0;

            this.timeRemaining = 0;
            this.maxTime = 0;
            this.lastFrameTime = null;
            this.animationFrameId = null;
            this.isPlaying = false;
        }

        init() {
            this.renderLayout();
            this.showStartScreen();
        }

        renderLayout() {
            this.container.innerHTML = `
                <div class="oc-game-container fade-in">
                    <h2>🕵️ Objets Cachés</h2>
                    <div class="oc-landscape-prompt">
                        📱 Veuillez pivoter votre appareil en mode paysage pour jouer dans de bonnes conditions.
                    </div>
                    <div class="oc-header card">
                        <div class="oc-infos">
                            <span class="oc-stat-label">NIVEAU <span id="oc-level-disp">1</span></span>
                            <span class="oc-stat-label">SCORE: <span id="oc-score-disp">0</span></span>
                        </div>
                        <div class="oc-timer-container">
                            <div id="oc-timer-bar" class="oc-timer-bar"></div>
                        </div>
                        <div id="oc-targets-list" class="oc-targets-list"></div>
                    </div>
                    <div id="oc-scene" class="oc-scene"></div>
                </div>
            `;
            this.sceneEl = document.getElementById('oc-scene');
            this.targetsListEl = document.getElementById('oc-targets-list');
            this.timerBarEl = document.getElementById('oc-timer-bar');
            this.scoreDisp = document.getElementById('oc-score-disp');
            this.levelDisp = document.getElementById('oc-level-disp');
        }

        showStartScreen() {
            const self = this;
            window.arcade.showStartModal({
                title: 'Objets Cachés',
                icon: '🕵️',
                description: 'Retrouvez les cibles avant la fin du temps !',
                controls: [
                    { icon: '🎯', desktop: 'Clic = Chercher / +2s', mobile: 'Touche = Chercher / +2s' },
                    { icon: '❌', desktop: 'Faux clic = -3s', mobile: 'Faux clic = -3s' }
                ],
                onStart: function () {
                    self.levelIndex = 0;
                    self.score = 0;
                    self.startLevel();
                },
                onQuit: function () { window.arcade.renderHome(); }
            });
        }

        startLevel() {
            this.isPlaying = true;
            this.foundTargets = 0;

            const lvlData = LEVELS[Math.min(this.levelIndex, LEVELS.length - 1)];
            this.maxTime = lvlData.baseTime;
            this.timeRemaining = this.maxTime;

            this.scoreDisp.textContent = this.score;
            this.levelDisp.textContent = (this.levelIndex + 1);

            // Choix du thème aléatoire
            this.currentTheme = THEMES[Math.floor(Math.random() * THEMES.length)];

            // Appliquer le style au fond de la scène
            this.sceneEl.className = 'oc-scene ' + this.currentTheme.bgId;
            this.sceneEl.innerHTML = '';

            // Sélectionner les objets cibles et parasites
            const shuffled = [...this.currentTheme.items].sort(() => Math.random() - 0.5);

            // Cibles saines
            this.targets = shuffled.slice(0, lvlData.targetsCount);

            // Parasites restants (peuvent se répéter)
            const remaining = shuffled.slice(lvlData.targetsCount);
            this.parasites = [];
            for (let i = 0; i < lvlData.parasitesCount; i++) {
                this.parasites.push(remaining[Math.floor(Math.random() * remaining.length)]);
            }

            this.renderTargetsList();
            this.spawnObjects();

            // Lancer le timer
            this.lastFrameTime = performance.now();
            if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = requestAnimationFrame((now) => this.gameLoop(now));
        }

        renderTargetsList() {
            this.targetsListEl.innerHTML = '';
            this.targets.forEach((itemContent, idx) => {
                const el = document.createElement('div');
                el.className = 'oc-target-item';
                el.id = 'oc-target-' + idx;

                if (this.currentTheme.isImage) {
                    const img = document.createElement('img');
                    img.src = itemContent;
                    img.alt = 'Objet cible';
                    img.style.width = '40px';
                    img.style.height = '40px';
                    img.style.objectFit = 'contain';
                    el.appendChild(img);
                } else {
                    el.textContent = itemContent;
                }

                this.targetsListEl.appendChild(el);
            });
        }

        spawnObjects() {
            const allItems = [];
            this.targets.forEach((content, idx) => {
                allItems.push({ content, isTarget: true, targetId: idx });
            });
            this.parasites.forEach(content => {
                allItems.push({ content, isTarget: false });
            });

            // Mélanger
            allItems.sort(() => Math.random() - 0.5);

            allItems.forEach(item => {
                const el = document.createElement('div');
                el.className = 'oc-item';

                if (this.currentTheme.isImage) {
                    const img = document.createElement('img');
                    img.src = item.content;
                    img.alt = 'Objet';
                    img.style.width = '60px'; // Taille de base des images
                    img.style.height = '60px';
                    img.style.objectFit = 'contain';
                    img.draggable = false;
                    el.classList.add('oc-item-img');
                    el.appendChild(img);
                } else {
                    el.textContent = item.content;
                }

                // Position aléatoire entre 5% et 90% pour pas dépasser
                const left = 5 + Math.random() * 85;
                const top = 5 + Math.random() * 85;
                const rotate = (Math.random() * 60) - 30; // -30 à +30 deg
                const scale = 0.8 + Math.random() * 0.7; // 0.8x à 1.5x

                el.style.left = left + '%';
                el.style.top = top + '%';
                el.style.transform = `translate(-50%, -50%) rotate(${rotate}deg) scale(${scale})`;
                el.style.zIndex = Math.floor(Math.random() * 100);

                // Interactions
                el.addEventListener('mousedown', (e) => {
                    e.stopPropagation(); // Évite le clic sur la scène (erreur)
                    this.handleItemClick(item, el);
                });

                // Support Touch
                el.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.handleItemClick(item, el);
                }, { passive: false });

                this.sceneEl.appendChild(el);
            });

            // Clic sur un espace vide (erreur générique sur le fond)
            this.sceneEl.onmousedown = () => this.handleWrongClick(null);
            this.sceneEl.ontouchstart = (e) => { e.preventDefault(); this.handleWrongClick(null); };
        }

        handleItemClick(item, element) {
            if (!this.isPlaying) return;

            if (item.isTarget) {
                // Vérifier si déjà trouvé
                if (element.classList.contains('found')) return;

                // Effet de réussite
                element.classList.add('found');
                setTimeout(() => element.remove(), 300); // Disparait avec anim

                window.arcade.audio?.playTone(800, 'sine', 0.1, 0.1);
                window.arcade.audio?.playTone(1200, 'sine', 0.15, 0.1, 0.1);

                // Barrer dans la liste
                const targetLi = document.getElementById('oc-target-' + item.targetId);
                if (targetLi) targetLi.classList.add('found-target');

                this.addTime(2); // +2 secondes bonus
                this.score += 10;
                this.scoreDisp.textContent = this.score;

                this.foundTargets++;
                if (this.foundTargets >= this.targets.length) {
                    this.levelComplete();
                }
            } else {
                this.handleWrongClick(element);
            }
        }

        handleWrongClick(element = null) {
            if (!this.isPlaying) return;
            // Effet erreur globale sur la scène
            this.sceneEl.classList.remove('oc-shake');
            void this.sceneEl.offsetWidth; // Reflow
            this.sceneEl.classList.add('oc-shake');

            // Si c'est un parasite, on le fait disparaître pour débloquer la vue
            if (element) {
                element.style.pointerEvents = 'none';
                element.style.transition = 'opacity 0.3s, transform 0.3s';
                element.style.opacity = '0';
                element.style.transform += ' scale(0.5)';
                setTimeout(() => element.remove(), 300);
            }

            window.arcade.audio?.playTone(150, 'sawtooth', 0.2, 0.2);
            this.addTime(-3); // Pénalité !

            // Feedback -X
            const feedback = document.createElement('div');
            feedback.className = 'oc-time-feedback neg';
            feedback.textContent = '-3s';
            // Placer au centre
            feedback.style.left = '50%';
            feedback.style.top = '50%';
            this.sceneEl.appendChild(feedback);
            setTimeout(() => feedback.remove(), 1000);
        }

        addTime(seconds) {
            this.timeRemaining += seconds;
            if (this.timeRemaining > this.maxTime) this.timeRemaining = this.maxTime;
            if (this.timeRemaining <= 0) {
                this.timeRemaining = 0;
                this.gameOver();
            }
            // Feedback visuel +2s
            if (seconds > 0) {
                const feedback = document.createElement('div');
                feedback.className = 'oc-time-feedback pos';
                feedback.textContent = '+' + seconds + 's';
                feedback.style.left = '50%';
                feedback.style.top = '10%'; // En haut
                this.sceneEl.appendChild(feedback);
                setTimeout(() => feedback.remove(), 1000);
            }
        }

        gameLoop(now) {
            if (!this.isPlaying) return;
            const dt = (now - this.lastFrameTime) / 1000;
            this.lastFrameTime = now;

            this.timeRemaining -= dt;
            if (this.timeRemaining <= 0) {
                this.timeRemaining = 0;
                this.updateTimerBar();
                this.gameOver();
                return;
            }

            this.updateTimerBar();
            this.animationFrameId = requestAnimationFrame((n) => this.gameLoop(n));
        }

        updateTimerBar() {
            const pct = Math.max(0, (this.timeRemaining / this.maxTime) * 100);
            this.timerBarEl.style.width = pct + '%';

            // Couleurs progressives
            if (pct > 50) {
                this.timerBarEl.style.background = 'var(--success)';
            } else if (pct > 25) {
                this.timerBarEl.style.background = 'var(--warning)';
            } else {
                this.timerBarEl.style.background = 'var(--error)';
            }
        }

        levelComplete() {
            this.isPlaying = false;
            if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);

            window.arcade.audio?.playTone(400, 'sine', 0.1, 0.1);
            window.arcade.audio?.playTone(600, 'sine', 0.1, 0.1, 0.1);
            window.arcade.audio?.playTone(800, 'sine', 0.3, 0.1, 0.2);

            window.arcade.showToast('Niveau ' + (this.levelIndex + 1) + ' terminé !');

            // Bonus de temps
            const timeBonus = Math.floor(this.timeRemaining);
            this.score += timeBonus * 2;

            this.levelIndex++;
            setTimeout(() => this.startLevel(), 1500);
        }

        gameOver() {
            this.isPlaying = false;
            if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);

            const self = this;
            window.arcade.showGameOverModal({
                title: 'objets-caches',
                gameStatus: 'Temps Écoulé !',
                icon: '⏳',
                stats: [
                    { label: 'Score final', value: this.score },
                    { label: 'Niveau atteint', value: this.levelIndex + 1 }
                ],
                score: this.score,
                scoreType: 'points',
                onReplay: function () { self.showStartScreen(); },
                onQuit: function () { window.arcade.renderHome(); }
            });
        }
    }

    window.initObjetsCaches = function (container) {
        const game = new ObjetsCachesGame(container);
        game.init();
    };

})();
