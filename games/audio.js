/**
 * Moteur Audio Global - Web Arcade Minimaliste
 * Basé sur l'API Web Audio (effets sonores) et l'API Cache (MP3 BGM).
 * Sons désactivés par défaut. Playlists contextuelles par dossier.
 */

window.arcade = window.arcade || {};

window.arcade.audio = {
    ctx: null,
    isMuted: true,

    // --- Playlists par contexte ---
    // Clé = id du jeu (ou 'base' pour l'accueil et les jeux sans playlist dédiée)
    playlists: {
        'base': [
            'sons/base/Midnight_Algorithm.mp3',
            'sons/base/Midnight_Bloom.mp3',
            'sons/base/Midnight_Snack_Run.mp3',
            'sons/base/Midnight_Study_Session.mp3',
            'sons/base/Nebula_Drift.mp3',
            'sons/base/Pixel_Dust_Dreams.mp3'
        ],
        'tetris': [
            'sons/tetris/gregorquendel-tetris-theme-korobeiniki-arranged-for-piano-186249.mp3',
            'sons/tetris/gregorquendel-tetris-theme-korobeiniki-rearranged-arr-for-music-box-184978.mp3',
            'sons/tetris/gregorquendel-tetris-theme-korobeiniki-rearranged-arr-for-strings-185592.mp3'
        ]
    },

    currentContext: 'base',
    currentTrackIndex: -1,
    bgmPlayer: null,
    CACHE_NAME: 'arcade-audio-v1',

    // ==========================================
    // INITIALISATION & CONTROLE PRINCIPAL
    // ==========================================

    init: function () {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
        } catch (e) {
            console.warn('Web Audio API non supportée sur ce navigateur.');
        }
    },

    toggleMute: function () {
        this.isMuted = !this.isMuted;

        if (!this.isMuted && !this.ctx) {
            this.init();
        }

        if (this.ctx && this.ctx.state === 'suspended' && !this.isMuted) {
            this.ctx.resume();
        }

        this.syncMusicStatus();
        return this.isMuted;
    },

    // ==========================================
    // CONTEXTE AUDIO (changement de playlist)
    // ==========================================

    /**
     * Change le contexte audio actif (sélectionne la playlist correspondant au jeu).
     * Si le jeu n'a pas de playlist dédiée, on revient à 'base'.
     * @param {string} gameId - Identifiant du jeu (ou 'base' pour l'accueil)
     */
    setContext: function (gameId) {
        const newContext = this.playlists[gameId] ? gameId : 'base';

        // Si le contexte change, on arrête la musique en cours et on vide le player
        if (newContext !== this.currentContext) {
            this.stopMusic();
            this.currentContext = newContext;
        }

        // Préchargement discret en arrière-plan pour économiser la data la prochaine fois
        this.preloadContext(this.currentContext);
    },

    // ==========================================
    // CACHE API - Économie de data mobile
    // ==========================================

    /**
     * Précharge toutes les pistes d'un contexte dans le Cache API du navigateur.
     * Les lectures suivantes se feront depuis le cache (0 data réseau).
     * @param {string} contextName
     */
    preloadContext: async function (contextName) {
        if (!('caches' in window)) return; // Cache API non supportée
        const tracks = this.playlists[contextName];
        if (!tracks) return;

        try {
            const cache = await caches.open(this.CACHE_NAME);
            const promises = tracks.map(async (url) => {
                const cached = await cache.match(url);
                if (!cached) {
                    const response = await fetch(url);
                    if (response.ok) await cache.put(url, response);
                }
            });
            await Promise.all(promises);
        } catch (e) {
            // Silencieux en cas d'erreur réseau (mode hors ligne, etc.)
        }
    },

    /**
     * Charge un MP3 depuis le Cache API si disponible, sinon depuis le réseau.
     * Définit le src du bgmPlayer avec une Blob URL pour contourner les restrictions CORS du cache.
     * @param {string} url
     */
    loadAndCache: async function (url) {
        if (!this.bgmPlayer) return;

        try {
            let response;
            if ('caches' in window) {
                const cache = await caches.open(this.CACHE_NAME);
                response = await cache.match(url);
                if (!response) {
                    response = await fetch(url);
                    if (response && response.ok) {
                        // Met en cache pour la prochaine fois
                        const cloned = response.clone();
                        cache.put(url, cloned);
                    }
                }
            } else {
                response = await fetch(url);
            }

            if (response && response.ok) {
                const blob = await response.blob();
                const blobUrl = URL.createObjectURL(blob);
                // Libère l'ancienne Blob URL pour éviter les fuites mémoire
                if (this.bgmPlayer._currentBlobUrl) {
                    URL.revokeObjectURL(this.bgmPlayer._currentBlobUrl);
                }
                this.bgmPlayer._currentBlobUrl = blobUrl;
                this.bgmPlayer.src = blobUrl;
                this.bgmPlayer.play().catch(e => console.warn('Lecture bloquée:', e));
            }
        } catch (e) {
            // Fallback direct si erreur de cache
            this.bgmPlayer.src = url;
            this.bgmPlayer.play().catch(err => console.warn('Lecture bloquée:', err));
        }
    },

    // ==========================================
    // LECTEUR DE MUSIQUE DE FOND (BGM)
    // ==========================================

    playMusic: function () {
        if (this.isMuted) return;

        if (!this.bgmPlayer) {
            this.bgmPlayer = new Audio();
            this.bgmPlayer.volume = 0.3;

            this.bgmPlayer.addEventListener('ended', () => {
                this.nextTrack();
            });
        }

        // Si déjà en pause sur la même piste, on reprend
        if (this.bgmPlayer.src && this.bgmPlayer.paused && this.bgmPlayer.currentTime > 0) {
            this.bgmPlayer.play().catch(e => console.warn('Lecture bloquée:', e));
            return;
        }

        // Démarre une nouvelle piste
        this.nextTrack();
    },

    pauseMusic: function () {
        if (this.bgmPlayer && !this.bgmPlayer.paused) {
            this.bgmPlayer.pause();
        }
    },

    stopMusic: function () {
        if (this.bgmPlayer) {
            this.bgmPlayer.pause();
            this.bgmPlayer.currentTime = 0;
            if (this.bgmPlayer._currentBlobUrl) {
                URL.revokeObjectURL(this.bgmPlayer._currentBlobUrl);
                this.bgmPlayer._currentBlobUrl = null;
            }
            this.bgmPlayer.src = '';
        }
        this.currentTrackIndex = -1;
    },

    nextTrack: function () {
        if (this.isMuted || !this.bgmPlayer) return;

        const tracks = this.playlists[this.currentContext] || this.playlists['base'];
        if (!tracks || tracks.length === 0) return;

        // Choix aléatoire différent du précédent
        let nextIndex;
        do {
            nextIndex = Math.floor(Math.random() * tracks.length);
        } while (nextIndex === this.currentTrackIndex && tracks.length > 1);

        this.currentTrackIndex = nextIndex;
        this.loadAndCache(tracks[this.currentTrackIndex]);
    },

    syncMusicStatus: function () {
        if (this.isMuted) {
            this.pauseMusic();
        } else {
            this.playMusic();
        }
    },

    // ==========================================
    // SYNTHÉTISEUR (Effets Sonores)
    // ==========================================

    /**
     * Joue un son synthétique via l'API Web Audio
     * @param {number} freq - Fréquence en Hz
     * @param {string} type - Type d'onde : 'sine', 'square', 'sawtooth', 'triangle'
     * @param {number} duration - Durée en secondes
     * @param {number} vol - Volume (0 à 1)
     */
    playTone: function (freq, type, duration, vol) {
        if (this.isMuted || !this.ctx) return;

        const osc = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

        gainNode.gain.setValueAtTime(vol, this.ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

        osc.connect(gainNode);
        gainNode.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    },

    // --- Banque de sons Tetris ---

    playMove: function () {
        this.playTone(400, 'sine', 0.1, 0.1);
    },

    playRotate: function () {
        this.playTone(600, 'triangle', 0.1, 0.1);
    },

    playDrop: function () {
        this.playTone(150, 'square', 0.15, 0.2);
    },

    playLineClear: function () {
        if (this.isMuted || !this.ctx) return;
        const now = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();
        osc.connect(gainNode);
        gainNode.connect(this.ctx.destination);

        osc.type = 'sine';
        gainNode.gain.setValueAtTime(0.2, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

        osc.frequency.setValueAtTime(659.25, now);      // Mi5
        osc.frequency.setValueAtTime(783.99, now + 0.1); // Sol5
        osc.frequency.setValueAtTime(1046.50, now + 0.2); // Do6

        osc.start(now);
        osc.stop(now + 0.4);
    },

    playTetris: function () {
        if (this.isMuted || !this.ctx) return;
        const now = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();
        osc.connect(gainNode);
        gainNode.connect(this.ctx.destination);

        osc.type = 'triangle';
        gainNode.gain.setValueAtTime(0.2, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.8);

        osc.frequency.setValueAtTime(523.25, now);       // Do5
        osc.frequency.setValueAtTime(659.25, now + 0.1); // Mi5
        osc.frequency.setValueAtTime(783.99, now + 0.2); // Sol5
        osc.frequency.setValueAtTime(1046.50, now + 0.3); // Do6
        osc.frequency.setValueAtTime(1318.51, now + 0.4); // Mi6

        osc.start(now);
        osc.stop(now + 0.8);
    },

    playGameOver: function () {
        if (this.isMuted || !this.ctx) return;
        const now = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();
        osc.connect(gainNode);
        gainNode.connect(this.ctx.destination);

        osc.type = 'sawtooth';
        gainNode.gain.setValueAtTime(0.2, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 1);

        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 1);

        osc.start(now);
        osc.stop(now + 1);
    }
};
