// Game Configuration
const GRID_WIDTH = 10;
const GRID_HEIGHT = 20;
const BLOCK_SIZE = 30;

// Game State
let gameState = {
    grid: [],
    currentPiece: null,
    nextPiece: null,
    score: 0,
    lines: 0,
    level: 1,
    dropTime: 0,
    isPaused: false,
    isGameOver: false,
    dropInterval: 1000
};

// Canvas elements
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const nextCanvas = document.getElementById('nextCanvas');
const nextCtx = nextCanvas.getContext('2d');

// Tetromino pieces
const TETROMINOES = {
    I: {
        shape: [
            [0, 0, 0, 0],
            [1, 1, 1, 1],
            [0, 0, 0, 0],
            [0, 0, 0, 0]
        ],
        color: '#00f5ff'
    },
    O: {
        shape: [
            [1, 1],
            [1, 1]
        ],
        color: '#ffed00'
    },
    T: {
        shape: [
            [0, 1, 0],
            [1, 1, 1],
            [0, 0, 0]
        ],
        color: '#a000f0'
    },
    S: {
        shape: [
            [0, 1, 1],
            [1, 1, 0],
            [0, 0, 0]
        ],
        color: '#00f000'
    },
    Z: {
        shape: [
            [1, 1, 0],
            [0, 1, 1],
            [0, 0, 0]
        ],
        color: '#ff0000'
    },
    J: {
        shape: [
            [1, 0, 0],
            [1, 1, 1],
            [0, 0, 0]
        ],
        color: '#0000ff'
    },
    L: {
        shape: [
            [0, 0, 1],
            [1, 1, 1],
            [0, 0, 0]
        ],
        color: '#ff7f00'
    }
};

// Initialize game
function initGame() {
    // Create empty grid
    gameState.grid = Array(GRID_HEIGHT).fill().map(() => Array(GRID_WIDTH).fill(0));
    
    // Reset game state
    gameState.score = 0;
    gameState.lines = 0;
    gameState.level = 1;
    gameState.dropTime = 0;
    gameState.isPaused = false;
    gameState.isGameOver = false;
    gameState.dropInterval = 1000;
    
    // Generate first pieces
    gameState.nextPiece = createRandomPiece();
    spawnNewPiece();
    
    updateDisplay();
    hideGameOverScreen();
}

// Create a random tetromino piece
function createRandomPiece() {
    const pieces = Object.keys(TETROMINOES);
    const randomPiece = pieces[Math.floor(Math.random() * pieces.length)];
    return {
        type: randomPiece,
        shape: TETROMINOES[randomPiece].shape,
        color: TETROMINOES[randomPiece].color,
        x: Math.floor(GRID_WIDTH / 2) - Math.floor(TETROMINOES[randomPiece].shape[0].length / 2),
        y: 0
    };
}

// Spawn new piece
function spawnNewPiece() {
    gameState.currentPiece = gameState.nextPiece;
    gameState.nextPiece = createRandomPiece();
    
    // Check if game over
    if (isCollision(gameState.currentPiece)) {
        gameOver();
    }
}

// Check collision
function isCollision(piece, offsetX = 0, offsetY = 0) {
    for (let y = 0; y < piece.shape.length; y++) {
        for (let x = 0; x < piece.shape[y].length; x++) {
            if (piece.shape[y][x]) {
                const newX = piece.x + x + offsetX;
                const newY = piece.y + y + offsetY;
                
                if (newX < 0 || newX >= GRID_WIDTH || 
                    newY >= GRID_HEIGHT || 
                    (newY >= 0 && gameState.grid[newY][newX])) {
                    return true;
                }
            }
        }
    }
    return false;
}

// Move piece
function movePiece(dx, dy) {
    if (!gameState.isGameOver && !gameState.isPaused) {
        if (!isCollision(gameState.currentPiece, dx, dy)) {
            gameState.currentPiece.x += dx;
            gameState.currentPiece.y += dy;
            return true;
        }
    }
    return false;
}

// Rotate piece
function rotatePiece() {
    if (!gameState.isGameOver && !gameState.isPaused) {
        const rotated = {
            ...gameState.currentPiece,
            shape: rotateMatrix(gameState.currentPiece.shape)
        };
        
        if (!isCollision(rotated)) {
            gameState.currentPiece.shape = rotated.shape;
        }
    }
}

// Rotate matrix 90 degrees clockwise
function rotateMatrix(matrix) {
    const rows = matrix.length;
    const cols = matrix[0].length;
    const rotated = Array(cols).fill().map(() => Array(rows).fill(0));
    
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            rotated[c][rows - 1 - r] = matrix[r][c];
        }
    }
    
    return rotated;
}

// Hard drop
function hardDrop() {
    if (!gameState.isGameOver && !gameState.isPaused) {
        while (movePiece(0, 1)) {
            gameState.score += 2;
        }
        lockPiece();
    }
}

// Lock piece in place
function lockPiece() {
    for (let y = 0; y < gameState.currentPiece.shape.length; y++) {
        for (let x = 0; x < gameState.currentPiece.shape[y].length; x++) {
            if (gameState.currentPiece.shape[y][x]) {
                const gridY = gameState.currentPiece.y + y;
                const gridX = gameState.currentPiece.x + x;
                
                if (gridY >= 0) {
                    gameState.grid[gridY][gridX] = gameState.currentPiece.color;
                }
            }
        }
    }
    
    clearLines();
    spawnNewPiece();
}

// Clear completed lines
function clearLines() {
    let linesCleared = 0;
    
    for (let y = GRID_HEIGHT - 1; y >= 0; y--) {
        if (gameState.grid[y].every(cell => cell !== 0)) {
            gameState.grid.splice(y, 1);
            gameState.grid.unshift(Array(GRID_WIDTH).fill(0));
            linesCleared++;
            y++; // Check the same line again
        }
    }
    
    if (linesCleared > 0) {
        // Update score and lines
        const lineScores = [0, 100, 300, 500, 800];
        gameState.score += lineScores[linesCleared] * gameState.level;
        gameState.lines += linesCleared;
        
        // Level up every 10 lines
        gameState.level = Math.floor(gameState.lines / 10) + 1;
        gameState.dropInterval = Math.max(50, 1000 - (gameState.level - 1) * 50);
        
        updateDisplay();
        
        // Add visual feedback for line clear
        animateLineClear();
    }
}

// Animate line clear
function animateLineClear() {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setTimeout(() => draw(), 100);
}

// Game over
function gameOver() {
    gameState.isGameOver = true;
    showGameOverScreen();
}

// Update display
function updateDisplay() {
    document.getElementById('score').textContent = gameState.score;
    document.getElementById('level').textContent = gameState.level;
    document.getElementById('lines').textContent = gameState.lines;
}

// Show game over screen
function showGameOverScreen() {
    document.getElementById('finalScore').textContent = gameState.score;
    document.getElementById('gameOverScreen').classList.remove('hidden');
}

// Hide game over screen
function hideGameOverScreen() {
    document.getElementById('gameOverScreen').classList.add('hidden');
}

// Toggle pause
function togglePause() {
    if (!gameState.isGameOver) {
        gameState.isPaused = !gameState.isPaused;
        const pauseScreen = document.getElementById('pauseScreen');
        const pauseBtn = document.getElementById('pauseBtn');
        
        if (gameState.isPaused) {
            pauseScreen.classList.remove('hidden');
            pauseBtn.textContent = 'Resume';
        } else {
            pauseScreen.classList.add('hidden');
            pauseBtn.textContent = 'Pause';
        }
    }
}

// Draw functions
function draw() {
    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid
    drawGrid();
    
    // Draw placed pieces
    drawPlacedPieces();
    
    // Draw current piece
    if (gameState.currentPiece) {
        drawPiece(gameState.currentPiece, ctx);
    }
    
    // Draw ghost piece
    if (gameState.currentPiece && !gameState.isPaused) {
        drawGhostPiece();
    }
    
    // Draw next piece
    drawNextPiece();
}

function drawGrid() {
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    
    for (let x = 0; x <= GRID_WIDTH; x++) {
        ctx.beginPath();
        ctx.moveTo(x * BLOCK_SIZE, 0);
        ctx.lineTo(x * BLOCK_SIZE, canvas.height);
        ctx.stroke();
    }
    
    for (let y = 0; y <= GRID_HEIGHT; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * BLOCK_SIZE);
        ctx.lineTo(canvas.width, y * BLOCK_SIZE);
        ctx.stroke();
    }
}

function drawPlacedPieces() {
    for (let y = 0; y < GRID_HEIGHT; y++) {
        for (let x = 0; x < GRID_WIDTH; x++) {
            if (gameState.grid[y][x]) {
                drawBlock(x * BLOCK_SIZE, y * BLOCK_SIZE, gameState.grid[y][x], ctx);
            }
        }
    }
}

function drawPiece(piece, context) {
    for (let y = 0; y < piece.shape.length; y++) {
        for (let x = 0; x < piece.shape[y].length; x++) {
            if (piece.shape[y][x]) {
                const blockX = (piece.x + x) * BLOCK_SIZE;
                const blockY = (piece.y + y) * BLOCK_SIZE;
                drawBlock(blockX, blockY, piece.color, context);
            }
        }
    }
}

function drawGhostPiece() {
    if (!gameState.currentPiece) return;
    
    const ghostPiece = { ...gameState.currentPiece };
    
    // Move ghost piece down until collision
    while (!isCollision(ghostPiece, 0, 1)) {
        ghostPiece.y++;
    }
    
    // Draw ghost piece with transparency
    ctx.save();
    ctx.globalAlpha = 0.3;
    
    for (let y = 0; y < ghostPiece.shape.length; y++) {
        for (let x = 0; x < ghostPiece.shape[y].length; x++) {
            if (ghostPiece.shape[y][x]) {
                const blockX = (ghostPiece.x + x) * BLOCK_SIZE;
                const blockY = (ghostPiece.y + y) * BLOCK_SIZE;
                drawBlock(blockX, blockY, ghostPiece.color, ctx);
            }
        }
    }
    
    ctx.restore();
}

function drawNextPiece() {
    // Clear next canvas
    nextCtx.fillStyle = '#000';
    nextCtx.fillRect(0, 0, nextCanvas.width, nextCanvas.height);
    
    if (gameState.nextPiece) {
        const piece = gameState.nextPiece;
        const blockSize = 20;
        const offsetX = (nextCanvas.width - piece.shape[0].length * blockSize) / 2;
        const offsetY = (nextCanvas.height - piece.shape.length * blockSize) / 2;
        
        for (let y = 0; y < piece.shape.length; y++) {
            for (let x = 0; x < piece.shape[y].length; x++) {
                if (piece.shape[y][x]) {
                    const blockX = offsetX + x * blockSize;
                    const blockY = offsetY + y * blockSize;
                    drawBlock(blockX, blockY, piece.color, nextCtx, blockSize);
                }
            }
        }
    }
}

function drawBlock(x, y, color, context, size = BLOCK_SIZE) {
    // Main block
    context.fillStyle = color;
    context.fillRect(x, y, size, size);
    
    // Highlight
    context.fillStyle = 'rgba(255, 255, 255, 0.3)';
    context.fillRect(x, y, size, size / 6);
    context.fillRect(x, y, size / 6, size);
    
    // Shadow
    context.fillStyle = 'rgba(0, 0, 0, 0.3)';
    context.fillRect(x, y + size - size / 6, size, size / 6);
    context.fillRect(x + size - size / 6, y, size / 6, size);
    
    // Border
    context.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    context.lineWidth = 1;
    context.strokeRect(x, y, size, size);
}

// Game loop
function gameLoop(timestamp) {
    if (!gameState.isPaused && !gameState.isGameOver) {
        const deltaTime = timestamp - gameState.dropTime;
        
        if (deltaTime > gameState.dropInterval) {
            if (!movePiece(0, 1)) {
                lockPiece();
            }
            gameState.dropTime = timestamp;
        }
    }
    
    draw();
    requestAnimationFrame(gameLoop);
}

// Event listeners
document.addEventListener('keydown', (e) => {
    if (gameState.isGameOver) return;
    
    switch (e.code) {
        case 'ArrowLeft':
            e.preventDefault();
            movePiece(-1, 0);
            break;
        case 'ArrowRight':
            e.preventDefault();
            movePiece(1, 0);
            break;
        case 'ArrowDown':
            e.preventDefault();
            if (movePiece(0, 1)) {
                gameState.score += 1;
                updateDisplay();
            }
            break;
        case 'ArrowUp':
            e.preventDefault();
            rotatePiece();
            break;
        case 'Space':
            e.preventDefault();
            hardDrop();
            updateDisplay();
            break;
        case 'KeyP':
            e.preventDefault();
            togglePause();
            break;
    }
});

// Button event listeners
document.getElementById('pauseBtn').addEventListener('click', togglePause);
document.getElementById('newGameBtn').addEventListener('click', initGame);
document.getElementById('restartBtn').addEventListener('click', initGame);

// Prevent arrow keys from scrolling the page
window.addEventListener('keydown', (e) => {
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].indexOf(e.code) > -1) {
        e.preventDefault();
    }
}, false);

// Touch controls for mobile
let touchStartX = 0;
let touchStartY = 0;

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
});

canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;
    const minSwipeDistance = 30;
    
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal swipe
        if (Math.abs(deltaX) > minSwipeDistance) {
            if (deltaX > 0) {
                movePiece(1, 0); // Right
            } else {
                movePiece(-1, 0); // Left
            }
        }
    } else {
        // Vertical swipe
        if (Math.abs(deltaY) > minSwipeDistance) {
            if (deltaY > 0) {
                if (movePiece(0, 1)) {
                    gameState.score += 1;
                    updateDisplay();
                }
            } else {
                rotatePiece(); // Up swipe rotates
            }
        } else {
            // Tap to rotate
            rotatePiece();
        }
    }
});

// Initialize and start game
initGame();
requestAnimationFrame(gameLoop);