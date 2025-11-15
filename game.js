// Game Variables
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startScreen = document.getElementById('startScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('highScore');
const finalScoreElement = document.getElementById('finalScore');
const soundToggle = document.getElementById('soundToggle');
const gameOverImage = document.getElementById('gameOverImage');

// Audio elements
const backgroundMusic = document.getElementById('backgroundMusic');
const jumpSound = document.getElementById('jumpSound');
const coinSound = document.getElementById('coinSound');
const gameOverSound = document.getElementById('gameOverSound');

// Game state
let gameState = 'start'; // 'start', 'playing', 'gameover'
let score = 0;
let highScore = localStorage.getItem('flyingModiHighScore') || 0;
let soundEnabled = true;
let gameStartTime = 0;

// Set canvas size
function resizeCanvas() {
    const container = canvas.parentElement;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight || 500;
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Player object
const player = {
    x: 100,
    y: canvas.height / 2,
    width: 60,
    height: 60,
    velocity: 0,
    gravity: 0.2,  // Much slower gravity for smoother, slower movement
    jumpPower: -6.5,  // Medium sensitivity
    color: '#FFD700',
    image: null,
    imageLoaded: false
};

// Load player image
const playerImage = new Image();
playerImage.onload = function() {
    player.image = playerImage;
    player.imageLoaded = true;
};
playerImage.onerror = function() {
    player.imageLoaded = false;
};
playerImage.src = 'images/marut2.jpg';  // User will upload this image

// Obstacles array
let obstacles = [];
let coins = [];
let clouds = [];

// Game settings - Made easier
const obstacleSpeed = 2;  // Slower obstacles
const obstacleSpawnRate = 0.012;  // Fewer obstacles
const coinSpawnRate = 0.015;  // More coins to collect
const cloudSpawnRate = 0.005;

// Initialize high score display
highScoreElement.textContent = highScore;

// Sound toggle
soundToggle.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    soundToggle.textContent = soundEnabled ? 'ON' : 'OFF';
    if (soundEnabled && gameState === 'playing') {
        backgroundMusic.volume = 0.5;
        backgroundMusic.play().catch(() => {});
    } else {
        backgroundMusic.pause();
    }
});

// Start game
startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);

function startGame() {
    gameState = 'playing';
    score = 0;
    obstacles = [];
    coins = [];
    clouds = [];
    gameStartTime = Date.now();
    
    player.x = 100;
    player.y = canvas.height / 2;
    player.velocity = 0;
    
    startScreen.style.display = 'none';
    gameOverScreen.style.display = 'none';
    
    scoreElement.textContent = score;
    
    if (soundEnabled) {
        backgroundMusic.volume = 0.5;  // Set volume to 50%
        backgroundMusic.play().catch(() => {});
    }
    
    gameLoop();
}

// Control sensitivity - medium sensitive
let lastJumpTime = 0;
const jumpCooldown = 50;  // Minimum time between jumps (milliseconds) - less restrictive

function handleJump() {
    const now = Date.now();
    if (now - lastJumpTime < jumpCooldown) {
        return;  // Too soon, ignore jump
    }
    lastJumpTime = now;
    
    // More responsive velocity change
    player.velocity = Math.max(player.velocity + player.jumpPower * 0.85, player.jumpPower);
    
    if (soundEnabled) {
        jumpSound.currentTime = 0;
        jumpSound.play().catch(() => {});
    }
}

// Game controls - less sensitive
canvas.addEventListener('click', () => {
    if (gameState === 'playing') {
        handleJump();
    }
});

// Touch support for mobile
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (gameState === 'playing') {
        handleJump();
    }
});

// Keyboard support
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && gameState === 'playing') {
        e.preventDefault();
        handleJump();
    }
});

// Draw player using uploaded image
function drawPlayer() {
    ctx.save();
    
    // If image is loaded, draw it
    if (player.imageLoaded && player.image) {
        // Smooth rotation based on velocity for dynamic feel
        const rotation = Math.min(Math.max(player.velocity * 0.08, -0.25), 0.25);
        
        ctx.translate(player.x + player.width / 2, player.y + player.height / 2);
        ctx.rotate(rotation);
        
        // Draw the image centered
        ctx.drawImage(
            player.image,
            -player.width / 2,
            -player.height / 2,
            player.width,
            player.height
        );
    } else {
        // Fallback: Draw simple placeholder if image not loaded
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(player.x + player.width / 2, player.y + player.height / 2, player.width / 2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#CCAA00';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Draw text to indicate image needed
        ctx.fillStyle = '#000';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Image?', player.x + player.width / 2, player.y + player.height / 2);
    }
    
    ctx.restore();
}

// Draw obstacles as fire
function drawObstacle(obstacle) {
    const time = Date.now() / 100;
    const fireWidth = obstacle.width;
    
    // Top fire
    drawFire(obstacle.x, 0, fireWidth, obstacle.topHeight, time);
    
    // Bottom fire (flipped)
    ctx.save();
    ctx.translate(obstacle.x, obstacle.bottomY);
    ctx.scale(1, -1);
    drawFire(0, 0, fireWidth, obstacle.bottomHeight, time);
    ctx.restore();
}

// Draw animated fire effect
function drawFire(x, y, width, height, time) {
    ctx.save();
    
    // Create fire gradient
    const gradient = ctx.createLinearGradient(x, y, x, y + height);
    gradient.addColorStop(0, '#FF4500');  // Orange red at top
    gradient.addColorStop(0.3, '#FF6347');  // Tomato
    gradient.addColorStop(0.6, '#FF8C00');  // Dark orange
    gradient.addColorStop(1, '#FFD700');    // Gold at bottom
    
    // Draw multiple flame layers for animated effect
    for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        const offset = Math.sin(time + i) * 3;
        const flameWidth = width + Math.sin(time * 2 + i) * 5;
        
        // Left flame
        ctx.moveTo(x + offset, y);
        ctx.quadraticCurveTo(
            x - 5 + Math.sin(time + i) * 3, 
            y + height * 0.3, 
            x + offset, 
            y + height * 0.5
        );
        ctx.quadraticCurveTo(
            x + offset, 
            y + height * 0.7, 
            x + flameWidth * 0.3 + offset, 
            y + height
        );
        
        // Right flame
        ctx.lineTo(x + flameWidth * 0.7 + offset, y + height);
        ctx.quadraticCurveTo(
            x + flameWidth + offset, 
            y + height * 0.7, 
            x + flameWidth + offset, 
            y + height * 0.5
        );
        ctx.quadraticCurveTo(
            x + flameWidth + 5 + Math.sin(time + i) * 3, 
            y + height * 0.3, 
            x + flameWidth + offset, 
            y
        );
        ctx.closePath();
        
        // Fill with gradient
        ctx.fillStyle = gradient;
        ctx.globalAlpha = 0.7 - i * 0.2;
        ctx.fill();
    }
    
    // Add bright center
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = '#FFFF00';
    ctx.beginPath();
    ctx.ellipse(x + width / 2, y + height * 0.3, width * 0.2, height * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Add sparks
    ctx.globalAlpha = 0.6;
    for (let i = 0; i < 5; i++) {
        const sparkX = x + width / 2 + (Math.sin(time * 3 + i) * width * 0.3);
        const sparkY = y + Math.sin(time * 2 + i) * height * 0.2;
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(sparkX, sparkY, 2, 0, Math.PI * 2);
        ctx.fill();
    }
    
    ctx.restore();
}

// Draw coins
function drawCoin(coin) {
    ctx.save();
    ctx.translate(coin.x, coin.y);
    
    // Rotation animation
    const rotation = Date.now() / 10 % 360;
    ctx.rotate(rotation * Math.PI / 180);
    
    // Outer circle (gold) with gradient
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, coin.radius);
    gradient.addColorStop(0, '#FFD700');
    gradient.addColorStop(1, '#FFA500');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, coin.radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Border
    ctx.strokeStyle = '#CC9900';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Inner circle
    ctx.fillStyle = '#FFA500';
    ctx.beginPath();
    ctx.arc(0, 0, coin.radius * 0.7, 0, Math.PI * 2);
    ctx.fill();
    
    // Shine effect
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.beginPath();
    ctx.arc(-coin.radius * 0.3, -coin.radius * 0.3, coin.radius * 0.3, 0, Math.PI * 2);
    ctx.fill();
    
    // Coin symbol (₹)
    ctx.fillStyle = '#000';
    ctx.font = `bold ${coin.radius}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('₹', 0, 0);
    
    ctx.restore();
}

// Draw clouds
function drawCloud(cloud) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.beginPath();
    ctx.arc(cloud.x, cloud.y, cloud.size, 0, Math.PI * 2);
    ctx.arc(cloud.x + cloud.size * 0.6, cloud.y, cloud.size * 0.8, 0, Math.PI * 2);
    ctx.arc(cloud.x + cloud.size * 1.2, cloud.y, cloud.size, 0, Math.PI * 2);
    ctx.fill();
}

// Collision detection - Made more forgiving with padding
function checkCollision(rect1, rect2) {
    // Add padding to make collision detection more forgiving
    const padding = 5;
    return rect1.x + padding < rect2.x + rect2.width - padding &&
           rect1.x + rect1.width - padding > rect2.x + padding &&
           rect1.y + padding < rect2.y + rect2.height - padding &&
           rect1.y + rect1.height - padding > rect2.y + padding;
}

// Update game
function update() {
    if (gameState !== 'playing') return;
    
    // Update player - with velocity cap for medium sensitivity
    player.velocity += player.gravity;
    player.velocity = Math.min(player.velocity, 5);  // Medium cap for balanced movement
    player.y += player.velocity;
    
    // Keep player in bounds - More forgiving at top and bottom
    if (player.y < -5) {
        player.y = -5;
        player.velocity = 0;
    }
    if (player.y + player.height > canvas.height + 5) {
        gameOver();
        return;
    }
    
    // Spawn obstacles - Wait 2 seconds after game start
    const timeSinceStart = Date.now() - gameStartTime;
    if (timeSinceStart > 2000 && Math.random() < obstacleSpawnRate) {
        const gap = 220;  // Increased gap for easier passage
        const topHeight = Math.random() * (canvas.height - gap - 100) + 50;
        const bottomY = topHeight + gap;
        const bottomHeight = canvas.height - bottomY;
        
        obstacles.push({
            x: canvas.width,
            width: 30,  // Narrower obstacles
            topHeight: topHeight,
            bottomY: bottomY,
            bottomHeight: bottomHeight
        });
    }
    
    // Spawn coins
    if (Math.random() < coinSpawnRate) {
        coins.push({
            x: canvas.width,
            y: Math.random() * (canvas.height - 100) + 50,
            radius: 15,
            collected: false
        });
    }
    
    // Spawn clouds
    if (Math.random() < cloudSpawnRate) {
        clouds.push({
            x: canvas.width,
            y: Math.random() * canvas.height * 0.5,
            size: 30 + Math.random() * 20,
            speed: 1
        });
    }
    
    // Update obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
        obstacles[i].x -= obstacleSpeed;
        
        // Check collision
        const topObstacle = {
            x: obstacles[i].x,
            y: 0,
            width: obstacles[i].width,
            height: obstacles[i].topHeight
        };
        const bottomObstacle = {
            x: obstacles[i].x,
            y: obstacles[i].bottomY,
            width: obstacles[i].width,
            height: obstacles[i].bottomHeight
        };
        
        if (checkCollision(player, topObstacle) || checkCollision(player, bottomObstacle)) {
            gameOver();
            return;
        }
        
        // Remove off-screen obstacles
        if (obstacles[i].x + obstacles[i].width < 0) {
            obstacles.splice(i, 1);
            score++;
            scoreElement.textContent = score;
        }
    }
    
    // Update coins
    for (let i = coins.length - 1; i >= 0; i--) {
        coins[i].x -= obstacleSpeed;
        
        // Check collision
        const coinRect = {
            x: coins[i].x - coins[i].radius,
            y: coins[i].y - coins[i].radius,
            width: coins[i].radius * 2,
            height: coins[i].radius * 2
        };
        
        if (checkCollision(player, coinRect) && !coins[i].collected) {
            coins[i].collected = true;
            score += 5;
            scoreElement.textContent = score;
            if (soundEnabled) {
                coinSound.currentTime = 0;
                coinSound.play().catch(() => {});
            }
        }
        
        // Remove off-screen or collected coins
        if (coins[i].x + coins[i].radius < 0 || coins[i].collected) {
            coins.splice(i, 1);
        }
    }
    
    // Update clouds
    for (let i = clouds.length - 1; i >= 0; i--) {
        clouds[i].x -= clouds[i].speed;
        if (clouds[i].x + clouds[i].size * 2 < 0) {
            clouds.splice(i, 1);
        }
    }
}

// Draw game
function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(0.5, '#98D8E8');
    gradient.addColorStop(1, '#B0E0E6');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw clouds
    clouds.forEach(drawCloud);
    
    // Draw obstacles
    obstacles.forEach(drawObstacle);
    
    // Draw coins
    coins.forEach(drawCoin);
    
    // Draw player
    drawPlayer();
}

// Game over
function gameOver() {
    gameState = 'gameover';
    backgroundMusic.pause();
    backgroundMusic.currentTime = 0;  // Reset music to start
    
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('flyingModiHighScore', highScore);
        highScoreElement.textContent = highScore;
    }
    
    finalScoreElement.textContent = score;
    gameOverScreen.style.display = 'flex';
    
    // Show game over image if it exists
    if (gameOverImage) {
        // Check if image exists and show it
        const img = new Image();
        img.onload = function() {
            gameOverImage.style.display = 'block';
        };
        img.onerror = function() {
            gameOverImage.style.display = 'none';
        };
        img.src = gameOverImage.src;
    }
    
    // Ensure restart button is visible and scroll into view on mobile
    setTimeout(() => {
        const restartBtn = document.getElementById('restartBtn');
        const gameOverScreen = document.getElementById('gameOverScreen');
        if (restartBtn) {
            // Force visibility with inline styles
            restartBtn.style.display = 'block';
            restartBtn.style.visibility = 'visible';
            restartBtn.style.opacity = '1';
            restartBtn.style.position = 'sticky';
            restartBtn.style.bottom = '0';
            restartBtn.style.zIndex = '1001';
            restartBtn.style.width = '100%';
            restartBtn.style.marginTop = '10px';
            
            // Scroll button into view
            restartBtn.scrollIntoView({ behavior: 'smooth', block: 'end', inline: 'nearest' });
            
            // Also scroll the overlay to bottom to show button
            if (gameOverScreen) {
                setTimeout(() => {
                    gameOverScreen.scrollTop = gameOverScreen.scrollHeight;
                }, 200);
            }
        }
    }, 150);
    
    if (soundEnabled) {
        gameOverSound.volume = 0.7;  // Set volume to 70%
        gameOverSound.currentTime = 0;
        gameOverSound.play().catch(() => {});
    }
}

// Game loop
function gameLoop() {
    if (gameState === 'playing') {
        update();
        draw();
        requestAnimationFrame(gameLoop);
    }
}

// Initial draw
draw();

