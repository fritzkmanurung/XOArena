// Konstanta dan variabel global
const board = document.getElementById('board');
const cells = document.querySelectorAll('.cell');
const infoArea = document.getElementById('info-area');
const restartBtn = document.getElementById('restart-btn');
const newMatchBtn = document.getElementById('new-match-btn');
const pvpBtn = document.getElementById('pvp-btn');
const aiBtn = document.getElementById('ai-btn');
const difficultyButtons = document.querySelectorAll('.difficulty-btn');
const aiDifficulty = document.getElementById('ai-difficulty');
const playerXScore = document.getElementById('player-x-score');
const playerOScore = document.getElementById('player-o-score');
const xWinsElement = document.getElementById('x-wins');
const oWinsElement = document.getElementById('o-wins');
const drawsElement = document.getElementById('draws');
const soundToggle = document.getElementById('sound-toggle');
const darkModeToggle = document.getElementById('dark-mode-toggle');
const helpButton = document.getElementById('help-btn');
const helpModal = document.getElementById('help-modal');
const closeHelp = document.getElementById('close-help');
const gameoverModal = document.getElementById('gameover-modal');
const gameoverTitle = document.getElementById('gameover-title');
const gameoverMessage = document.getElementById('gameover-message');
const playAgainBtn = document.getElementById('play-again-btn');
const newMatchModalBtn = document.getElementById('new-match-modal-btn');
const winLine = document.getElementById('win-line');

// Audio Elements
const placeSound = document.getElementById('place-sound');
const winSound = document.getElementById('win-sound');
const drawSound = document.getElementById('draw-sound');
const clickSound = document.getElementById('click-sound');

let currentPlayer = 'X'; // Pemain saat ini (X atau O)
let gameState = ['', '', '', '', '', '', '', '', '']; // State papan permainan
let gameActive = true; // Status apakah game sedang berjalan
let vsAI = false; // Mode vs AI aktif/tidak
let aiLevel = 'easy'; // Tingkat kesulitan AI
let scores = { // Skor pemain
    X: 0,
    O: 0,
    wins: {
        X: 0,
        O: 0,
        draws: 0
    }
};

// Kombinasi pemenang (8 kemungkinan)
const winningConditions = [
    [0, 1, 2], // Baris atas
    [3, 4, 5], // Baris tengah
    [6, 7, 8], // Baris bawah
    [0, 3, 6], // Kolom kiri
    [1, 4, 7], // Kolom tengah
    [2, 5, 8], // Kolom kanan
    [0, 4, 8], // Diagonal kiri atas ke kanan bawah
    [2, 4, 6]  // Diagonal kanan atas ke kiri bawah
];

// Pesan yang akan ditampilkan
const winMessage = () => `Player ${currentPlayer} Wins!`;
const drawMessage = () => `Game ended in a draw!`;
const currentPlayerTurn = () => `Player ${currentPlayer}'s Turn`;

// Inisialisasi game
function initGame() {
    // Load saved state from localStorage
    loadGameState();
    
    // Set pesan info awal
    updateInfoArea();
    updatePlayerIndicators();
    
    // Add event listeners
    cells.forEach(cell => cell.addEventListener('click', handleCellClick));
    restartBtn.addEventListener('click', restartGame);
    newMatchBtn.addEventListener('click', newMatch);
    pvpBtn.addEventListener('click', () => toggleMode(false));
    aiBtn.addEventListener('click', () => toggleMode(true));
    difficultyButtons.forEach(btn => {
        btn.addEventListener('click', () => setAILevel(btn.dataset.difficulty));
    });
    soundToggle.addEventListener('click', toggleSound);
    darkModeToggle.addEventListener('click', toggleDarkMode);
    helpButton.addEventListener('click', showHelpModal);
    closeHelp.addEventListener('click', hideHelpModal);
    playAgainBtn.addEventListener('click', playAgain);
    newMatchModalBtn.addEventListener('click', newMatch);
    
    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === helpModal) hideHelpModal();
        if (e.target === gameoverModal) hideGameoverModal();
    });
    
    // Apply dark mode preferences
    applyDarkModePreferences();
}

// Load game state from localStorage
function loadGameState() {
    const savedScores = localStorage.getItem('tttScores');
    
    if (savedScores) {
        scores = JSON.parse(savedScores);
        updateScoreboard();
    }
}

// Save game state to localStorage
function saveGameState() {
    localStorage.setItem('tttScores', JSON.stringify(scores));
}

// Update info area
function updateInfoArea() {
    infoArea.innerHTML = `<span class="current-turn">${currentPlayerTurn()}</span>`;
}

// Update player indicators
function updatePlayerIndicators() {
    const playerX = document.querySelector('.player-x');
    const playerO = document.querySelector('.player-o');
    
    playerX.classList.toggle('active', currentPlayer === 'X');
    playerO.classList.toggle('active', currentPlayer === 'O');
}

// Update scoreboard
function updateScoreboard() {
    playerXScore.textContent = scores.X;
    playerOScore.textContent = scores.O;
    xWinsElement.textContent = scores.wins.X;
    oWinsElement.textContent = scores.wins.O;
    drawsElement.textContent = scores.wins.draws;
}

/**
 * Menangani klik pada cell
 * @param {Event} event - Event object dari klik
 */
function handleCellClick(event) {
    // Dapatkan index cell yang diklik
    const clickedCell = event.target;
    const cellIndex = parseInt(clickedCell.getAttribute('data-index'));
    
    // Periksa apakah cell sudah terisi atau game tidak aktif
    if (gameState[cellIndex] !== '' || !gameActive) {
        return;
    }
    
    // Update cell dan state game
    placeMark(clickedCell, cellIndex);
    
    // Periksa apakah ada pemenang
    checkResult();
    
    // Jika mode vs AI aktif dan game masih berjalan, lakukan langkah AI
    if (vsAI && gameActive && currentPlayer === 'O') {
        setTimeout(makeAIMove, 600); // Delay untuk memberikan efek "berpikir"
    }
}

/**
 * Menempatkan tanda (X/O) pada cell
 * @param {Element} cell - Element cell yang diklik
 * @param {number} index - Index cell dalam array
 */
function placeMark(cell, index) {
    // Update state game dan UI
    gameState[index] = currentPlayer;
    cell.textContent = currentPlayer;
    cell.classList.add(currentPlayer.toLowerCase());
    cell.classList.add('disabled');
    cell.setAttribute('data-player', currentPlayer);
    
    // Play sound
    playPlaceSound();
    
    // Add animation class
    cell.classList.add('placed');
    setTimeout(() => cell.classList.remove('placed'), 300);
}

/**
 * Memeriksa hasil game (menang/seri)
 */
function checkResult() {
    let roundWon = false;
    let winCombo = [];
    
    // Periksa semua kondisi menang
    for (let i = 0; i < winningConditions.length; i++) {
        const [a, b, c] = winningConditions[i];
        
        if (gameState[a] === '' || gameState[b] === '' || gameState[c] === '') {
            continue;
        }
        
        if (gameState[a] === gameState[b] && gameState[b] === gameState[c]) {
            roundWon = true;
            winCombo = winningConditions[i];
            break;
        }
    }
    
    // Jika ada pemenang
    if (roundWon) {
        gameActive = false;
        displayGameOver(winMessage(), true);
        
        // Update scores
        scores[currentPlayer]++;
        scores.wins[currentPlayer]++;
        
        // Highlight cell pemenang
        highlightWinningCells(winCombo);
        
        // Play win sound and show confetti
        playWinSound();
        triggerConfetti();
        
        // Save game state
        saveGameState();
        updateScoreboard();
        
        return;
    }
    
    // Periksa jika seri (tidak ada cell kosong)
    const roundDraw = !gameState.includes('');
    if (roundDraw) {
        gameActive = false;
        displayGameOver(drawMessage(), false);
        scores.wins.draws++;
        
        // Play draw sound
        playDrawSound();
        
        // Save game state
        saveGameState();
        updateScoreboard();
        
        return;
    }
    
    // Ganti pemain
    changePlayer();
}

/**
 * Menampilkan garis kemenangan
 * @param {Array} winCombo - Array berisi index sel yang menang
 */
function highlightWinningCells(winCombo) {
    // Add win class to winning cells
    winCombo.forEach(index => {
        cells[index].classList.add('win');
    });
    
    // Calculate and draw winning line
    drawWinningLine(winCombo);
}

/**
 * Menggambar garis kemenangan
 * @param {Array} winCombo - Array berisi index sel yang menang
 */
function drawWinningLine(winCombo) {
    const firstCell = cells[winCombo[0]];
    const lastCell = cells[winCombo[2]];
    
    const boardRect = board.getBoundingClientRect();
    const firstRect = firstCell.getBoundingClientRect();
    const lastRect = lastCell.getBoundingClientRect();
    
    // Calculate line position and dimensions
    let lineStyle = '';
    
    if (winCombo[0] === 0 && winCombo[2] === 2) { // Top row
        const y = firstRect.top - boardRect.top + firstRect.height / 2;
        lineStyle = `top: ${y}px; left: 12px; width: ${boardRect.width - 24}px; height: 6px; transform: none;`;
    } 
    else if (winCombo[0] === 3 && winCombo[2] === 5) { // Middle row
        const y = firstRect.top - boardRect.top + firstRect.height / 2;
        lineStyle = `top: ${y}px; left: 12px; width: ${boardRect.width - 24}px; height: 6px; transform: none;`;
    }
    else if (winCombo[0] === 6 && winCombo[2] === 8) { // Bottom row
        const y = firstRect.top - boardRect.top + firstRect.height / 2;
        lineStyle = `top: ${y}px; left: 12px; width: ${boardRect.width - 24}px; height: 6px; transform: none;`;
    }
    else if (winCombo[0] === 0 && winCombo[2] === 6) { // Left column
        const x = firstRect.left - boardRect.left + firstRect.width / 2;
        lineStyle = `left: ${x}px; top: 12px; height: ${boardRect.height - 24}px; width: 6px; transform: none;`;
    }
    else if (winCombo[0] === 1 && winCombo[2] === 7) { // Middle column
        const x = firstRect.left - boardRect.left + firstRect.width / 2;
        lineStyle = `left: ${x}px; top: 12px; height: ${boardRect.height - 24}px; width: 6px; transform: none;`;
    }
    else if (winCombo[0] === 2 && winCombo[2] === 8) { // Right column
        const x = firstRect.left - boardRect.left + firstRect.width / 2;
        lineStyle = `left: ${x}px; top: 12px; height: ${boardRect.height - 24}px; width: 6px; transform: none;`;
    }
    else if (winCombo[0] === 0 && winCombo[2] === 8) { // Diagonal \
        lineStyle = `top: 12px; left: 12px; width: ${boardRect.width - 24}px; height: ${boardRect.height - 24}px; transform: rotate(45deg); transform-origin: center;`;
    }
    else if (winCombo[0] === 2 && winCombo[2] === 6) { // Diagonal /
        lineStyle = `top: 12px; left: 12px; width: ${boardRect.width - 24}px; height: ${boardRect.height - 24}px; transform: rotate(-45deg); transform-origin: center;`;
    }
    
    winLine.style = lineStyle + 'opacity: 1;';
}

/**
 * Mengganti pemain saat ini
 */
function changePlayer() {
    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
    updateInfoArea();
    updatePlayerIndicators();
}

/**
 * Membuat langkah AI (pemain O)
 */
function makeAIMove() {
    if (!gameActive || currentPlayer !== 'O') return;
    
    let moveIndex;
    
    // Different AI strategies based on difficulty
    if (aiLevel === 'easy') {
        moveIndex = getRandomMove();
    } else if (aiLevel === 'medium') {
        // 50% chance to make a smart move, 50% random
        moveIndex = Math.random() > 0.5 ? getSmartMove() : getRandomMove();
    } else { // hard
        // 80% chance to make a smart move, 20% random
        moveIndex = Math.random() > 0.2 ? getSmartMove() : getRandomMove();
    }
    
    // Make the move
    const cell = cells[moveIndex];
    placeMark(cell, moveIndex);
    
    // Periksa hasil
    checkResult();
}

/**
 * Mendapatkan langkah acak untuk AI
 * @returns {number} Index cell untuk langkah AI
 */
function getRandomMove() {
    // Dapatkan semua cell yang masih kosong
    const emptyCells = gameState
        .map((value, index) => value === '' ? index : null)
        .filter(index => index !== null);
    
    // Pilih cell secara acak
    return emptyCells[Math.floor(Math.random() * emptyCells.length)];
}

/**
 * Mendapatkan langkah pintar untuk AI (mencoba menang atau menghalangi pemain)
 * @returns {number} Index cell untuk langkah AI
 */
function getSmartMove() {
    // First, check if AI can win in the next move
    for (let i = 0; i < winningConditions.length; i++) {
        const [a, b, c] = winningConditions[i];
        const condition = [gameState[a], gameState[b], gameState[c]];
        
        // Check if two cells are O and one is empty
        if (condition.filter(val => val === 'O').length === 2 && condition.includes('')) {
            const emptyIndex = condition.findIndex(val => val === '');
            return winningConditions[i][emptyIndex];
        }
    }
    
    // Check if player can win in the next move and block them
    for (let i = 0; i < winningConditions.length; i++) {
        const [a, b, c] = winningConditions[i];
        const condition = [gameState[a], gameState[b], gameState[c]];
        
        // Check if two cells are X and one is empty
        if (condition.filter(val => val === 'X').length === 2 && condition.includes('')) {
            const emptyIndex = condition.findIndex(val => val === '');
            return winningConditions[i][emptyIndex];
        }
    }
    
    // Try to take the center if available
    if (gameState[4] === '') return 4;
    
    // Try to take a corner if available
    const corners = [0, 2, 6, 8];
    const emptyCorners = corners.filter(index => gameState[index] === '');
    if (emptyCorners.length > 0) {
        return emptyCorners[Math.floor(Math.random() * emptyCorners.length)];
    }
    
    // Otherwise, make a random move
    return getRandomMove();
}

/**
 * Mengatur ulang game ke state awal (tetap pertahankan skor)
 */
function restartGame() {
    gameState = ['', '', '', '', '', '', '', '', ''];
    gameActive = true;
    currentPlayer = 'X';
    
    // Reset semua cell
    cells.forEach(cell => {
        cell.textContent = '';
        cell.classList.remove('x', 'o', 'disabled', 'win', 'placed');
        cell.removeAttribute('data-player');
    });
    
    // Reset win line
    winLine.style.opacity = '0';
    
    // Update UI
    updateInfoArea();
    updatePlayerIndicators();
    
    // Play click sound
    playClickSound();
}

/**
 * Memulai match baru (reset semua termasuk skor)
 */
function newMatch() {
    scores.X = 0;
    scores.O = 0;
    restartGame();
    updateScoreboard();
    saveGameState();
    hideGameoverModal();
    
    // Play click sound
    playClickSound();
}

/**
 * Memainkan lagi setelah game over
 */
function playAgain() {
    restartGame();
    hideGameoverModal();
    
    // Play click sound
    playClickSound();
}

/**
 * Mengganti mode permainan (Player vs Player vs Vs AI)
 * @param {boolean} aiMode - True untuk mode vs AI, false untuk mode 2 pemain
 */
function toggleMode(aiMode) {
    vsAI = aiMode;
    pvpBtn.classList.toggle('active', !aiMode);
    aiBtn.classList.toggle('active', aiMode);
    aiDifficulty.classList.toggle('visible', aiMode);
    restartGame();
    
    // Play click sound
    playClickSound();
}

/**
 * Mengatur tingkat kesulitan AI
 * @param {string} level - Tingkat kesulitan ('easy', 'medium', 'hard')
 */
function setAILevel(level) {
    aiLevel = level;
    difficultyButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.difficulty === level);
    });
    
    // Play click sound
    playClickSound();
}

/**
 * Menampilkan modal game over
 * @param {string} message - Pesan yang akan ditampilkan
 * @param {boolean} isWin - Apakah pemain menang
 */
function displayGameOver(message, isWin) {
    gameoverTitle.textContent = isWin ? 'You Win!' : 'Game Over';
    gameoverMessage.textContent = message;
    gameoverModal.classList.add('show');
}

/**
 * Menyembunyikan modal game over
 */
function hideGameoverModal() {
    gameoverModal.classList.remove('show');
}

/**
 * Menampilkan modal bantuan
 */
function showHelpModal() {
    helpModal.classList.add('show');
    
    // Play click sound
    playClickSound();
}

/**
 * Menyembunyikan modal bantuan
 */
function hideHelpModal() {
    helpModal.classList.remove('show');
}

/**
 * Mengaktifkan/menonaktifkan suara
 */
function toggleSound() {
    const soundEnabled = placeSound.volume === 1;
    placeSound.volume = soundEnabled ? 0 : 1;
    winSound.volume = soundEnabled ? 0 : 1;
    drawSound.volume = soundEnabled ? 0 : 1;
    clickSound.volume = soundEnabled ? 0 : 1;
    
    soundToggle.innerHTML = soundEnabled ? '<i class="fas fa-volume-mute"></i>' : '<i class="fas fa-volume-up"></i>';
    
    // Play click sound (if not muting)
    if (!soundEnabled) playClickSound();
}

/**
 * Mengaktifkan/menonaktifkan dark mode
 */
function toggleDarkMode() {
    const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';
    
    if (isDarkMode) {
        document.documentElement.removeAttribute('data-theme');
        darkModeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    } else {
        document.documentElement.setAttribute('data-theme', 'dark');
        darkModeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    }
    
    // Play click sound
    playClickSound();
}

/**
 * Menerapkan preferensi dark mode dari localStorage atau sistem
 */
function applyDarkModePreferences() {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const savedTheme = localStorage.getItem('tttTheme');
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
        document.documentElement.setAttribute('data-theme', 'dark');
        darkModeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    }
}

/**
 * Memutar suara untuk menempatkan tanda
 */
function playPlaceSound() {
    placeSound.currentTime = 0;
    placeSound.play().catch(e => console.log("Audio play failed:", e));
}

/**
 * Memutar suara untuk kemenangan
 */
function playWinSound() {
    winSound.currentTime = 0;
    winSound.play().catch(e => console.log("Audio play failed:", e));
}

/**
 * Memutar suara untuk seri
 */
function playDrawSound() {
    drawSound.currentTime = 0;
    drawSound.play().catch(e => console.log("Audio play failed:", e));
}

/**
 * Memutar suara untuk klik
 */
function playClickSound() {
    clickSound.currentTime = 0;
    clickSound.play().catch(e => console.log("Audio play failed:", e));
}

// Confetti effect
function triggerConfetti() {
    const canvas = document.getElementById('confetti-canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const confetti = [];
    const confettiCount = 150;
    const gravity = 0.5;
    const terminalVelocity = 5;
    const drag = 0.075;
    const colors = [
        { front: '#4361ee', back: '#3a56d4' },
        { front: '#f72585', back: '#e51a75' },
        { front: '#4cc9f0', back: '#43b4d7' },
        { front: '#fca311', back: '#e3940f' },
        { front: '#4895ef', back: '#4086e0' }
    ];
    
    // Initialize confetti particles
    for (let i = 0; i < confettiCount; i++) {
        confetti.push({
            color: colors[Math.floor(Math.random() * colors.length)],
            dimensions: {
                x: Math.random() * 10 + 5,
                y: Math.random() * 10 + 5
            },
            position: {
                x: Math.random() * canvas.width,
                y: -Math.random() * canvas.height
            },
            rotation: Math.random() * 2 * Math.PI,
            scale: {
                x: 1,
                y: 1
            },
            velocity: {
                x: Math.random() * 20 - 10,
                y: Math.random() * 10 + 5
            }
        });
    }
    
    // Animation loop
    let animationFrame;
    let time = 0;
    
    function loop() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        confetti.forEach((confetto, index) => {
            let width = confetto.dimensions.x * confetto.scale.x;
            let height = confetto.dimensions.y * confetto.scale.y;
            
            // Apply forces to velocity
            confetto.velocity.x -= confetto.velocity.x * drag;
            confetto.velocity.y = Math.min(confetto.velocity.y + gravity, terminalVelocity);
            confetto.velocity.y -= confetto.velocity.y * drag;
            
            // Update position
            confetto.position.x += confetto.velocity.x;
            confetto.position.y += confetto.velocity.y;
            
            // Spin confetto
            confetto.rotation += confetto.velocity.x / 50;
            
            // Delete confetto when out of view
            if (confetto.position.y >= canvas.height) {
                confetti.splice(index, 1);
                return;
            }
            
            // Draw confetto
            ctx.save();
            ctx.translate(confetto.position.x, confetto.position.y);
            ctx.rotate(confetto.rotation);
            
            ctx.fillStyle = confetto.color.front;
            ctx.fillRect(-width / 2, -height / 2, width, height);
            
            ctx.restore();
        });
        
        time += 1;
        
        if (time < 200 && confetti.length > 0) {
            animationFrame = requestAnimationFrame(loop);
        } else {
            cancelAnimationFrame(animationFrame);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    }
    
    loop();
}

// Inisialisasi game ketika DOM sudah siap
document.addEventListener('DOMContentLoaded', initGame);

// Resize confetti canvas ketika window di-resize
window.addEventListener('resize', () => {
    const canvas = document.getElementById('confetti-canvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});