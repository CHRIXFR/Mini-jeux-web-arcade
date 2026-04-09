class NeonPulseGame {
    constructor(container) {
        this.container = container;
        this.gameState = 'start'; // start, playing, gameover, win
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.maxLevel = 10;
        
        // Configuration Canvas
        this.width = 800;
        this.height = 600;
        
        // Entités
        this.paddle = {
            w: 120, h: 15,
            x: this.width / 2 - 60,
            y: this.height - 30,
            speed: 8,
            dx: 0
        };
        this.balls = []; // Gestion multi-balles prévue
        
        this.keys = { ArrowLeft: false, ArrowRight: false, q: false, d: false };
        this.lastTime = 0;
        this.animationFrame = null;
        
        this.bricks = [];
        this.brickRows = 0;
        this.brickCols = 0;
        
        this.particles = [];
        this.powerups = [];
        this.lasers = [];
        
        this.defineLevels();

        this.renderLayout();
        this.bindEvents();
    }

    defineLevels() {
        // Types: 0=vide, 1=classique(1HP), 2=renforcé(2PHP), 9=mur(incassable)
        this.levelsData = [
            // Level 1
            [
                [1,1,1,1,1,1,1,1,1,1],
                [1,1,1,1,1,1,1,1,1,1],
                [1,1,1,1,1,1,1,1,1,1]
            ],
            // Level 2
            [
                [1,0,1,0,1,0,1,0,1,0],
                [0,1,0,1,0,1,0,1,0,1],
                [1,0,1,0,1,0,1,0,1,0],
                [0,1,0,1,0,1,0,1,0,1]
            ],
            // Level 3
            [
                [2,2,2,2,2,2,2,2,2,2],
                [1,1,1,1,1,1,1,1,1,1],
                [1,1,1,1,1,1,1,1,1,1]
            ],
            // Level 4
            [
                [2,1,2,1,2,1,2,1,2,1],
                [1,2,1,2,1,2,1,2,1,2],
                [9,9,1,1,1,1,1,1,9,9]
            ],
            // Level 5
            [
                [0,0,0,0,2,2,0,0,0,0],
                [0,0,0,1,1,1,1,0,0,0],
                [0,0,1,1,1,1,1,1,0,0],
                [0,1,1,1,9,9,1,1,1,0],
                [1,1,1,1,1,1,1,1,1,1]
            ],
            // Level 6
            [
                [9,1,1,9,1,1,9,1,1,9],
                [1,2,2,1,2,2,1,2,2,1],
                [1,2,2,1,2,2,1,2,2,1],
                [9,1,1,9,1,1,9,1,1,9]
            ],
            // Level 7
            [
                [2,2,2,2,2,2,2,2,2,2],
                [9,0,0,0,0,0,0,0,0,9],
                [2,2,2,2,2,2,2,2,2,2],
                [1,1,1,1,1,1,1,1,1,1]
            ],
            // Level 8
            [
                [1,2,1,2,9,9,2,1,2,1],
                [1,1,1,1,2,2,1,1,1,1],
                [2,2,2,2,1,1,2,2,2,2],
                [1,1,1,1,1,1,1,1,1,1]
            ],
            // Level 9
            [
                [9,2,9,2,9,2,9,2,9,2],
                [1,1,1,1,1,1,1,1,1,1],
                [2,9,2,9,2,9,2,9,2,9],
                [1,1,1,1,1,1,1,1,1,1]
            ],
            // Level 10
            [
                [2,2,2,2,2,2,2,2,2,2],
                [2,9,9,2,2,2,2,9,9,2],
                [2,9,9,2,2,2,2,9,9,2],
                [2,2,2,2,2,2,2,2,2,2],
                [1,1,1,1,1,1,1,1,1,1],
                [1,1,1,1,1,1,1,1,1,1]
            ]
        ];
    }

    renderLayout() {
        this.container.innerHTML = `
            <div class="np-container glass-panel">
                <div class="np-header">
                    <h2>Neon Pulse</h2>
                    <div class="np-stats">
                        <span id="np-level">Niveau: 1</span>
                        <span id="np-lives">Vies: ❤️❤️❤️</span>
                    </div>
                </div>
                
                <div class="np-canvas-container" id="np-canvas-container">
                    <canvas id="np-canvas" width="${this.width}" height="${this.height}"></canvas>
                </div>
                
                <div class="np-controls-help">
                    <p>⌨️ Flèches G/D ou Q/D | 🖱️ Glisser pour déplacer le paddle</p>
                </div>
            </div>
        `;

        this.canvas = document.getElementById('np-canvas');
        this.ctx = this.canvas.getContext('2d');

        if (window.arcade && window.arcade.showStartModal) {
            window.arcade.showStartModal({
                title: "Neon Pulse",
                icon: "🎮",
                description: "Détruisez les briques et accumulez les bonus ! (3 vies par niveau)",
                controls: [
                    { icon: '⌨️', desktop: 'Flèches / Q D', mobile: 'Glisser' },
                    { icon: '🖱️', desktop: 'Souris', mobile: 'Tactile' },
                    { icon: '🔥', desktop: 'Clic / Espace (Laser)', mobile: 'Toucher (Laser)' }
                ],
                onStart: () => this.startGame()
            });
        } else {
            this.startGame();
        }
    }

    bindEvents() {
        this.keydownHandler = (e) => {
            if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'q') this.keys.ArrowLeft = true;
            if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') this.keys.ArrowRight = true;
        };
        this.keyupHandler = (e) => {
            if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'q') this.keys.ArrowLeft = false;
            if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') this.keys.ArrowRight = false;
        };
        const move = (e) => {
            e.preventDefault();
            const rect = this.canvas.getBoundingClientRect();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const x = clientX - rect.left;
            this.paddle.x = Math.max(0, Math.min(this.width - this.paddle.w, x - this.paddle.w / 2));
        };
        this.canvas.addEventListener('mousemove', move);
        this.canvas.addEventListener('touchmove', move);

        const shootLaser = (e) => {
            if (this.paddle.laser && this.gameState === 'playing') {
                this.shootLaser();
            }
        };

        window.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft' || e.key === 'q' || e.key === 'Q') this.keys.ArrowLeft = true;
            if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') this.keys.ArrowRight = true;
            if (e.code === 'Space') shootLaser(e);
        });
        window.addEventListener('keyup', (e) => {
            if (e.key === 'ArrowLeft' || e.key === 'q' || e.key === 'Q') this.keys.ArrowLeft = false;
            if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') this.keys.ArrowRight = false;
        });
        
        this.canvas.addEventListener('mousedown', shootLaser);
        this.canvas.addEventListener('touchstart', shootLaser);
    }

    unbindEvents() {
        // Implementation omitted for brevity
    }

    initBall() {
        this.balls = [{
            x: this.width / 2,
            y: this.paddle.y - 15,
            r: 8,
            speed: 6,
            dx: 4 * (Math.random() > 0.5 ? 1 : -1),
            dy: -6, // vers le haut
            laser: false,
            trail: []
        }];
    }

    startGame() {
        this.gameState = 'playing';
        this.lives = 3;
        this.level = 1;
        this.updateHUD();
        this.initLevel();
        this.initBall();
        
        this.lastTime = performance.now();
        this.animationFrame = requestAnimationFrame((t) => this.loop(t));
    }

    initLevel() {
        this.bricks = [];
        this.powerups = [];
        this.lasers = [];
        this.paddle.w = 100;
        this.paddle.laser = false;
        
        // Clmap du niveau
        const lvlIdx = Math.min(this.level - 1, this.levelsData.length - 1);
        const layout = this.levelsData[lvlIdx];
        
        this.brickRows = layout.length;
        this.brickCols = layout[0].length;
        
        const padding = 10;
        const offsetTop = 60;
        const offsetLeft = 40;
        
        const bw = (this.width - offsetLeft * 2 - padding * (this.brickCols - 1)) / this.brickCols;
        const bh = 25;
        
        for (let r = 0; r < this.brickRows; r++) {
            for (let c = 0; c < this.brickCols; c++) {
                let type = layout[r][c];
                if (type === 0) continue;
                
                let hp = type === 2 ? 2 : (type === 9 ? Infinity : 1);
                
                this.bricks.push({
                    x: offsetLeft + c * (bw + padding),
                    y: offsetTop + r * (bh + padding),
                    w: bw,
                    h: bh,
                    type: type, // 1, 2, 9
                    hp: hp,
                    maxHp: hp
                });
            }
        }
    }

    nextLevel() {
        this.level++;
        if (this.level > this.maxLevel) {
            this.gameWin();
            return;
        }
        this.updateHUD();
        this.initLevel();
        this.initBall();
    }

    updateHUD() {
        const hLevel = document.getElementById('np-level');
        const hLives = document.getElementById('np-lives');
        if (hLevel) hLevel.textContent = `Niveau: ${this.level}`;
        if (hLives) hLives.textContent = `Vies: ${'❤️'.repeat(this.lives)}`;
    }

    loop(timestamp) {
        if (this.gameState !== 'playing') return;
        
        // deltaTime pour rendre la vitesse indépendante du framerate si besoin
        const dt = (timestamp - this.lastTime) / 16.66; // basé sur 60fps
        this.lastTime = timestamp;

        this.update(dt);
        this.draw();
        
        if (this.gameState === 'playing') {
            this.animationFrame = requestAnimationFrame((t) => this.loop(t));
        }
    }

    update(dt) {
        // Déplacement Paddle (clavier)
        if (this.keys.ArrowLeft) this.paddle.x -= this.paddle.speed * dt;
        if (this.keys.ArrowRight) this.paddle.x += this.paddle.speed * dt;
        // Contraintes murs
        this.paddle.x = Math.max(0, Math.min(this.width - this.paddle.w, this.paddle.x));

        // Powerups (Descente et ramassage)
        for (let i = this.powerups.length - 1; i >= 0; i--) {
            let p = this.powerups[i];
            p.y += p.dy * dt;
            if (p.y > this.height) {
                this.powerups.splice(i, 1);
                continue;
            }
            if (p.x < this.paddle.x + this.paddle.w && p.x + p.w > this.paddle.x &&
                p.y < this.paddle.y + this.paddle.h && p.y + p.h > this.paddle.y) {
                this.applyPowerup(p.type);
                this.powerups.splice(i, 1);
            }
        }

        // Lasers
        for (let i = this.lasers.length - 1; i >= 0; i--) {
            let l = this.lasers[i];
            l.y += l.dy * dt;
            let hit = false;
            
            if (l.y < 0) { hit = true; } // Hors écran
            else {
                for (let j = this.bricks.length - 1; j >= 0; j--) {
                    let br = this.bricks[j];
                    if (l.y < br.y + br.h && l.y + l.h > br.y &&
                        l.x < br.x + br.w && l.x + l.w > br.x) {
                        
                        hit = true;
                        if (br.type !== 9) {
                            br.hp--;
                            if (br.hp <= 0) {
                                this.score += (br.maxHp * 10);
                                this.createExplosion(br.x + br.w/2, br.y + br.h/2, this.getBrickColor(br.type, br.maxHp));
                                this.spawnPowerup(br.x + br.w/2, br.y + br.h/2);
                                this.bricks.splice(j, 1);
                            }
                        }
                        if (window.arcade && window.arcade.audio) window.arcade.audio.playTone(300, 'square', 0.05);
                        break;
                    }
                }
            }
            if (hit) this.lasers.splice(i, 1);
        }

        // Boucle Balles (Update)
        for (let i = this.balls.length - 1; i >= 0; i--) {
            let b = this.balls[i];
            
            b.x += b.dx * dt;
            b.y += b.dy * dt;
            
            // Trail
            b.trail.push({x: b.x, y: b.y});
            if (b.trail.length > 15) b.trail.shift();
            
            // Collisions Box (Murs Haut/Gauche/Droite)
            if (b.x - b.r < 0) { b.x = b.r; b.dx *= -1; }
            else if (b.x + b.r > this.width) { b.x = this.width - b.r; b.dx *= -1; }
            if (b.y - b.r < 0) { b.y = b.r; b.dy *= -1; }
            
            // Collision bas (Perte de balle)
            if (b.y + b.r > this.height) {
                this.balls.splice(i, 1);
                continue;
            }
            
            // Collision Paddle (Cercle / Rectangle)
            if (
                b.y + b.r >= this.paddle.y && b.y - b.r <= this.paddle.y + this.paddle.h &&
                b.x + b.r >= this.paddle.x && b.x - b.r <= this.paddle.x + this.paddle.w
            ) {
                // Rebond
                b.y = this.paddle.y - b.r;
                b.dy = -Math.abs(b.dy); // Force la montée
                
                // Angle dynamique calculé (Distance par rapport au centre)
                const hitPoint = b.x - (this.paddle.x + this.paddle.w / 2);
                // ratio de -1 à 1
                const ratio = hitPoint / (this.paddle.w / 2);
                
                // Max angle (e.g. 60 degrés) => modifie la vélocité x
                b.dx = ratio * b.speed * 1.2;
                // Normalisation pour conserver le speed constant
                const currentSpeedStr = Math.sqrt(b.dx*b.dx + b.dy*b.dy);
                b.dx = (b.dx / currentSpeedStr) * b.speed;
                b.dy = (b.dy / currentSpeedStr) * b.speed;
                
                if (window.arcade && window.arcade.audio) {
                    window.arcade.audio.playTone(300, 'sine', 0.1);
                }
            }
            
            // Collisions Balles / Briques
            for (let j = this.bricks.length - 1; j >= 0; j--) {
                let br = this.bricks[j];
                // Check AABB collision
                if (
                    b.y + b.r > br.y && b.y - b.r < br.y + br.h &&
                    b.x + b.r > br.x && b.x - b.r < br.x + br.w
                ) {
                    // Calcul si on tape verticalement ou horizontalement
                    // On vérifie de quel côté on a traversé
                    let OverlapLeft = b.x + b.r - br.x;
                    let OverlapRight = br.x + br.w - (b.x - b.r);
                    let OverlapTop = b.y + b.r - br.y;
                    let OverlapBottom = br.y + br.h - (b.y - b.r);
                    
                    let minOverlap = Math.min(OverlapLeft, OverlapRight, OverlapTop, OverlapBottom);
                    
                    // Si pas mode laser, on rebondit
                    if (!b.laser) {
                        if (minOverlap === OverlapLeft || minOverlap === OverlapRight) {
                            b.dx *= -1;
                        } else {
                            b.dy *= -1;
                        }
                    }

                    // Dégâts
                    if (br.type !== 9) {
                        br.hp--;
                        if (window.arcade && window.arcade.audio) {
                            window.arcade.audio.playTone(br.hp === 0 ? 600 : 400, 'square', 0.1);
                        }
                        
                        if (br.hp <= 0) {
                            this.score += (br.maxHp * 10);
                            this.updateHUD();
                            this.createExplosion(br.x + br.w/2, br.y + br.h/2, this.getBrickColor(br.type, br.maxHp));
                            this.spawnPowerup(br.x + br.w/2 - 10, br.y + br.h/2 - 10);
                            this.bricks.splice(j, 1);
                            this.shakeScreen(false); // Léger shake
                        }
                    } else {
                        // Mur incassable
                        if (window.arcade && window.arcade.audio) window.arcade.audio.playTone(150, 'sawtooth', 0.1);
                    }
                    
                    // Si on touche un bloc on continue pas la détection pour cette frame
                    break; 
                }
            }
        }
        
        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            let p = this.particles[i];
            p.x += p.dx * dt;
            p.y += p.dy * dt;
            p.life -= 0.05 * dt;
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
        
        // Check win condition (no breakable bricks left)
        let breakableLeft = this.bricks.filter(br => br.type !== 9).length;
        if (breakableLeft === 0 && this.gameState === 'playing') {
            this.nextLevel();
        }

        // Gestion de perte de vue (toutes les balles tombées)
        if (this.balls.length === 0) {
            this.handleLifeLost();
        }
    }

    shakeScreen(heavy = false) {
        const cw = document.getElementById('np-canvas-container');
        if (cw) {
            // Pour ré-trigger l'animation
            cw.classList.remove('np-shake-active');
            void cw.offsetWidth;
            cw.style.animationDuration = heavy ? '0.4s' : '0.15s';
            // Le class de base np-shake-active est dans CSS
            cw.classList.add('np-shake-active');
        }
    }

    createExplosion(x, y, color) {
        for (let i = 0; i < 15; i++) {
            this.particles.push({
                x, y,
                dx: (Math.random() - 0.5) * 8,
                dy: (Math.random() - 0.5) * 8,
                life: 1.0,
                color: color
            });
        }
    }

    getBrickColor(type, hp) {
        if (type === 9) return '#475569';
        if (type === 2) return hp === 2 ? '#c084fc' : '#a855f7';
        return '#34d399';
    }

    spawnPowerup(x, y) {
        if (Math.random() < 0.15) {
            let type;
            if (Math.random() < 0.05) { // 5% de chance parmi les 15%, très rare
                type = 'life';
            } else {
                const types = ['multiball', 'largepaddle', 'laser'];
                type = types[Math.floor(Math.random() * types.length)];
            }
            this.powerups.push({ x, y, w: 24, h: 24, dy: 15, type });
        }
    }

    applyPowerup(type) {
        if (window.arcade && window.arcade.audio) window.arcade.audio.playTone(800, 'square', 0.1);
        
        if (type === 'life') {
            this.lives = Math.min(3, this.lives + 1); // Capped at 3 relative to request "limite de 3 vies par niveau"
            this.updateHUD();
        } else if (type === 'multiball') {
            const b = this.balls[0] || { x: this.paddle.x + this.paddle.w/2, y: this.paddle.y - 10, r: 5 };
            this.balls.push({ x: b.x, y: b.y, dx: -200, dy: -300, r: b.r, speed: 360, trail: [] });
            this.balls.push({ x: b.x, y: b.y, dx: 200, dy: -300, r: b.r, speed: 360, trail: [] });
        } else if (type === 'largepaddle') {
            this.paddle.w = 150;
            clearTimeout(this.paddleTimeout);
            this.paddleTimeout = setTimeout(() => { this.paddle.w = 100; }, 10000);
        } else if (type === 'laser') {
            this.paddle.laser = true;
            clearTimeout(this.laserTimeout);
            this.laserTimeout = setTimeout(() => { this.paddle.laser = false; }, 8000);
        }
    }

    shootLaser() {
        // Anti spam 300ms
        const now = performance.now();
        if (!this.lastShoot || now - this.lastShoot > 300) {
            if (window.arcade && window.arcade.audio) window.arcade.audio.playTone(600, 'square', 0.05);
            this.lasers.push({ x: this.paddle.x + 5, y: this.paddle.y, w: 4, h: 15, dy: -600 });
            this.lasers.push({ x: this.paddle.x + this.paddle.w - 9, y: this.paddle.y, w: 4, h: 15, dy: -600 });
            this.lastShoot = now;
        }
    }

    handleLifeLost() {
        this.lives--;
        this.updateHUD();
        this.paddle.laser = false;
        this.paddle.w = 100;
        
        this.shakeScreen(true); // Gros shake

        if (this.lives > 0) {
            this.initBall();
        } else {
            this.gameOver();
        }
    }

    draw() {
        this.clearCanvas();
        
        // Mode de composition pour effets néon
        this.ctx.globalCompositeOperation = 'lighter';
        
        // Traînées balles (Trails)
        this.balls.forEach(b => {
            if (b.trail.length > 0) {
                this.ctx.beginPath();
                this.ctx.moveTo(b.trail[0].x, b.trail[0].y);
                for (let i = 1; i < b.trail.length; i++) {
                    this.ctx.lineTo(b.trail[i].x, b.trail[i].y);
                }
                this.ctx.strokeStyle = `rgba(244, 114, 182, 0.4)`;
                this.ctx.lineWidth = b.r * 2;
                this.ctx.lineCap = 'round';
                this.ctx.lineJoin = 'round';
                this.ctx.shadowBlur = 10;
                this.ctx.shadowColor = '#f472b6';
                this.ctx.stroke();
            }
        });
        
        this.ctx.globalCompositeOperation = 'source-over';
        
        // Dessin Paddle
        this.ctx.fillStyle = '#38bdf8'; // Bleu néon
        this.ctx.shadowColor = '#38bdf8';
        this.ctx.shadowBlur = 15;
        this.ctx.fillRect(this.paddle.x, this.paddle.y, this.paddle.w, this.paddle.h);
        // Canons laser visuels
        if (this.paddle.laser) {
            this.ctx.fillStyle = '#ef4444'; // Rouge
            this.ctx.fillRect(this.paddle.x + 2, this.paddle.y - 5, 8, 5);
            this.ctx.fillRect(this.paddle.x + this.paddle.w - 10, this.paddle.y - 5, 8, 5);
        }
        
        // Lasers
        this.ctx.fillStyle = '#ef4444';
        this.ctx.shadowColor = '#ef4444';
        this.ctx.shadowBlur = 10;
        this.lasers.forEach(l => {
            this.ctx.fillRect(l.x, l.y, l.w, l.h);
        });
        
        // Briques
        this.bricks.forEach(br => {
            const color = this.getBrickColor(br.type, br.hp);
            this.ctx.fillStyle = color;
            this.ctx.shadowColor = br.type !== 9 ? color : 'transparent';
            this.ctx.shadowBlur = br.type !== 9 ? 10 : 0;
            
            this.ctx.fillRect(br.x, br.y, br.w, br.h);
            this.ctx.strokeStyle = 'rgba(255,255,255,0.3)';
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(br.x, br.y, br.w, br.h);
        });

        // Particules
        this.particles.forEach(p => {
            this.ctx.globalAlpha = p.life;
            this.ctx.fillStyle = p.color;
            this.ctx.shadowColor = p.color;
            this.ctx.shadowBlur = 10;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, 4 * p.life, 0, Math.PI * 2);
            this.ctx.fill();
        });
        this.ctx.globalAlpha = 1.0;

        // Powerups
        this.powerups.forEach(p => {
            this.ctx.fillStyle = '#1e293b';
            this.ctx.shadowBlur = 0;
            this.ctx.fillRect(p.x, p.y, p.w, p.h);
            this.ctx.lineWidth = 2;
            
            this.ctx.shadowBlur = 8;
            if (p.type === 'multiball') {
                this.ctx.strokeStyle = '#f472b6';
                this.ctx.shadowColor = '#f472b6';
            } else if (p.type === 'largepaddle') {
                this.ctx.strokeStyle = '#38bdf8';
                this.ctx.shadowColor = '#38bdf8';
            } else if (p.type === 'laser') {
                this.ctx.strokeStyle = '#ef4444';
                this.ctx.shadowColor = '#ef4444';
            } else if (p.type === 'life') {
                this.ctx.strokeStyle = '#10b981';
                this.ctx.shadowColor = '#10b981';
            }
            this.ctx.strokeRect(p.x, p.y, p.w, p.h);
            this.ctx.fillStyle = this.ctx.strokeStyle;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.font = 'bold 14px "Press Start 2P"';
            this.ctx.fillText(p.type[0].toUpperCase(), p.x + p.w/2, p.y + p.h/2 + 2);
        });

        // Dessin Balle(s)
        this.ctx.fillStyle = '#f472b6'; // Rose pulse
        this.ctx.shadowColor = '#f472b6';
        this.ctx.shadowBlur = 10;
        
        this.balls.forEach(b => {
            this.ctx.beginPath();
            this.ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
            this.ctx.fill();
        });
        
        // Reset shadow
        this.ctx.shadowBlur = 0;
    }

    clearCanvas() {
        this.ctx.fillStyle = '#0f172a';
        this.ctx.fillRect(0, 0, this.width, this.height);
    }
    
    gameWin() {
        this.gameState = 'win';
        if (window.arcade && window.arcade.showGameOverModal) {
            window.arcade.showGameOverModal({
                title: "neon-pulse",
                gameStatus: "Victoire Totale !",
                icon: "🏆",
                stats: [
                    { label: "Niveau Atteint", value: this.level }
                ],
                score: this.level,
                onReplay: () => this.startGame()
            });
        }
    }

    gameOver() {
        this.gameState = 'gameover';
        if (window.arcade && window.arcade.showGameOverModal) {
            window.arcade.showGameOverModal({
                title: "neon-pulse",
                gameStatus: "Game Over",
                icon: "💥",
                stats: [
                    { label: "Niveau Atteint", value: this.level }
                ],
                score: this.level,
                onReplay: () => this.startGame()
            });
        }
    }

    stop() {
        this.gameState = 'stopped';
        cancelAnimationFrame(this.animationFrame);
        this.unbindEvents();
    }
}

// Point d'entrée pour l'Arcade
window.initNeonPulse = function (container) {
    const game = new NeonPulseGame(container);
    const observer = new MutationObserver((mutations) => {
        if (!document.body.contains(container)) {
            game.stop();
            observer.disconnect();
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });
};
