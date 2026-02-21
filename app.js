/**
 * Arcade Minimaliste - Main Application
 */

const state = {
    xp: parseInt(localStorage.getItem('arcade_xp')) || 0,
    currentView: 'home',
};

// --- DOM Elements ---
const xpDisplay = document.getElementById('total-xp');
const levelDisplay = document.getElementById('level-display');
const btnSudoku = document.getElementById('btn-sudoku');
const btnMotsMeles = document.getElementById('btn-mots-meles');
const appContainer = document.getElementById('app-container');

// --- Initialization ---
function init() {
    updateXPDisplay();
    setupEventListeners();
    console.log("Application initialisée.");
}

function setupEventListeners() {
    btnSudoku?.addEventListener('click', () => loadGame('sudoku'));
    btnMotsMeles?.addEventListener('click', () => loadGame('mots-meles'));
}

// --- XP System ---
function updateXPDisplay() {
    xpDisplay.textContent = state.xp;
    const level = Math.floor(state.xp / 100) + 1;
    levelDisplay.textContent = `Niv. ${level}`;
}

export function addXP(amount) {
    state.xp += amount;
    localStorage.setItem('arcade_xp', state.xp);
    updateXPDisplay();
    // Notification visuelle
    showToast(`+${amount} XP !`);
}

// --- Navigation / Routing ---
function loadGame(gameId) {
    console.log(`Chargement du jeu : ${gameId}`);
    
    // Pour l'instant, on simule le changement de vue
    // Plus tard, on injectera le HTML du jeu dynamiquement
    appContainer.innerHTML = `
        <div class="game-view">
            <button id="back-home" class="btn-secondary">← Retour</button>
            <div id="game-mount">
                <div class="loading-state">
                    <h2>Chargement de ${gameId}...</h2>
                    <p>Préparation de votre défi.</p>
                </div>
            </div>
        </div>
    `;

    document.getElementById('back-home').addEventListener('click', () => {
        location.reload(); // Solution simple pour revenir au début pour l'instant
    });

    // Appel au module spécifique du jeu
    if (gameId === 'sudoku') {
        import('./games/sudoku.js').then(module => {
            module.initSudoku(document.getElementById('game-mount'));
        });
    } else if (gameId === 'mots-meles') {
        const mount = document.getElementById('game-mount');
        mount.innerHTML = `<h2>Mots Mêlés - Bientôt disponible</h2>`;
    }
}

// --- UI Helpers ---
function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    }, 100);
}

init();
