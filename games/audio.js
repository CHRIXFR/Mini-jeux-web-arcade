/**
 * Moteur Audio Global - Web Arcade Minimaliste
 * Basé sur l'API Web Audio (Pure Vanilla JS)
 * Permet de générer des effets sonores sans fichiers externes.
 */

window.arcade = window.arcade || {};

window.arcade.audio = {
    ctx: null,
    isMuted: true, // Désactivé par défaut comme demandé

    init: function () {
        // Initialisation différée au premier clic de l'utilisateur (Politique des navigateurs)
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
        } catch (e) {
            console.warn("Web Audio API non supportée sur ce navigateur.");
        }
    },

    toggleMute: function () {
        this.isMuted = !this.isMuted;

        // Initialiser le contexte s'il ne l'est pas encore après unmute
        if (!this.isMuted && !this.ctx) {
            this.init();
        }

        // Relacher le contexte s'il est suspendu par le navigateur
        if (this.ctx && this.ctx.state === 'suspended' && !this.isMuted) {
            this.ctx.resume();
        }

        return this.isMuted;
    },

    /**
     * Joue un son de "Bip" synthétique simple
     * @param {number} freq Fréquence en Hz
     * @param {string} type Type d'onde : 'sine', 'square', 'sawtooth', 'triangle'
     * @param {number} duration Durée en secondes
     * @param {number} vol Volume (0 à 1)
     */
    playTone: function (freq, type, duration, vol) {
        if (this.isMuted || !this.ctx) return;

        const osc = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

        // Enveloppe basique (Fade out)
        gainNode.gain.setValueAtTime(vol, this.ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

        osc.connect(gainNode);
        gainNode.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    },

    // --- Banque de sons prédéfinis ---

    playMove: function () {
        // Petit tick rapide
        this.playTone(400, 'sine', 0.1, 0.1);
    },

    playRotate: function () {
        this.playTone(600, 'triangle', 0.1, 0.1);
    },

    playDrop: function () {
        // Son de chute (basse fréquence brève)
        this.playTone(150, 'square', 0.15, 0.2);
    },

    playLineClear: function () {
        // Arpège ascendant joyeux
        if (this.isMuted || !this.ctx) return;
        const now = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();
        osc.connect(gainNode);
        gainNode.connect(this.ctx.destination);

        osc.type = 'sine';
        gainNode.gain.setValueAtTime(0.2, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

        // Sequence : Mi - Sol - Do (Aigu)
        osc.frequency.setValueAtTime(659.25, now); // Mi5
        osc.frequency.setValueAtTime(783.99, now + 0.1); // Sol5
        osc.frequency.setValueAtTime(1046.50, now + 0.2); // Do6

        osc.start(now);
        osc.stop(now + 0.4);
    },

    playTetris: function () {
        // Fanfare de victoire
        if (this.isMuted || !this.ctx) return;
        const now = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();
        osc.connect(gainNode);
        gainNode.connect(this.ctx.destination);

        osc.type = 'triangle';
        gainNode.gain.setValueAtTime(0.2, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.8);

        // Accord magique
        osc.frequency.setValueAtTime(523.25, now); // Do5
        osc.frequency.setValueAtTime(659.25, now + 0.1); // Mi5
        osc.frequency.setValueAtTime(783.99, now + 0.2); // Sol5
        osc.frequency.setValueAtTime(1046.50, now + 0.3); // Do6
        osc.frequency.setValueAtTime(1318.51, now + 0.4); // Mi6 (Tenue)

        osc.start(now);
        osc.stop(now + 0.8);
    },

    playGameOver: function () {
        // Chute descendante triste
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
