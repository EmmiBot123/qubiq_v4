const gameContainer = document.getElementById('game-container');
const scoreEl = document.getElementById('score');
const livesEl = document.getElementById('lives');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const finalScoreEl = document.getElementById('final-score');

let score = 0;
let lives = 3;
let gameActive = false;
let balloons = [];
let spawnInterval;
let spawnRate = 2000; // milliseconds
let baseSpeed = 2; // pixels per frame

// Vibrant HSL colors for balloons
const balloonColors = [
    'hsl(348, 83%, 58%)', // Red pink
    'hsl(204, 86%, 53%)', // Bright blue
    'hsl(141, 71%, 48%)', // Green
    'hsl(48, 89%, 55%)',  // Yellow
    'hsl(271, 76%, 53%)', // Purple
    'hsl(14, 100%, 53%)', // Orange
    'hsl(316, 73%, 52%)'  // Magenta
];

// Generate a random letter A-Z
function getRandomLetter() {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    return letters[Math.floor(Math.random() * letters.length)];
}

// Generate a random color
function getRandomColor() {
    return balloonColors[Math.floor(Math.random() * balloonColors.length)];
}

function createBalloon() {
    if (!gameActive) return;

    const balloon = document.createElement('div');
    balloon.classList.add('balloon');
    
    const letter = getRandomLetter();
    balloon.textContent = letter;
    
    // Styling
    const color = getRandomColor();
    balloon.style.backgroundColor = color;
    // Set border bottom color for the knot pseudo-element to inherit
    balloon.style.borderBottomColor = color; 

    // Initial position
    const size = 90;
    const maxX = window.innerWidth - size - 20; // 20px padding from edges
    const xPos = Math.random() * maxX + 10;
    const yPos = window.innerHeight; // Start off screen
    
    balloon.style.left = `${xPos}px`;
    balloon.style.top = `${yPos}px`;
    
    gameContainer.appendChild(balloon);

    // Wiggle effect offset
    const wiggleOffset = Math.random() * Math.PI * 2;
    const speed = baseSpeed + (Math.random() * 1); // Randomize speed slightly

    balloons.push({
        element: balloon,
        letter: letter,
        x: xPos,
        y: yPos,
        speed: speed,
        wiggleOffset: wiggleOffset
    });
}

function updateGame() {
    if (!gameActive) return;

    for (let i = balloons.length - 1; i >= 0; i--) {
        const b = balloons[i];
        
        // Move floating up
        b.y -= b.speed;
        
        // Add gentle horizontal sway (wiggle)
        const sway = Math.sin(Date.now() / 300 + b.wiggleOffset) * 1.5;
        b.x += sway;
        
        b.element.style.top = `${b.y}px`;
        b.element.style.left = `${b.x}px`;

        // Check if balloon reaches top (-150px to fully disappear including string)
        if (b.y < -150) {
            loseLife();
            b.element.remove();
            balloons.splice(i, 1);
        }
    }

    requestAnimationFrame(updateGame);
}

function createPopEffect(x, y, color) {
    const particleCount = 8;
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.classList.add('pop-particle');
        
        const size = Math.random() * 15 + 5;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.backgroundColor = color;
        
        particle.style.left = `${x}px`;
        particle.style.top = `${y}px`;
        
        // Random trajectory
        const angle = (Math.PI * 2 / particleCount) * i + (Math.random() - 0.5);
        const distance = Math.random() * 50 + 50;
        
        particle.style.transform = `translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance}px) scale(0)`;
        
        gameContainer.appendChild(particle);
        
        setTimeout(() => particle.remove(), 500);
    }
}

function popBalloon(index) {
    const b = balloons[index];
    
    // Visual effect
    const rect = b.element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    createPopEffect(centerX, centerY, b.element.style.backgroundColor);
    
    // Add points
    score += 10;
    scoreEl.textContent = score;
    
    // Play sound (optional, could add audio here)

    // Increase difficulty gracefully
    if (score % 50 === 0 && spawnRate > 500) {
        spawnRate -= 100;
        baseSpeed += 0.2;
        clearInterval(spawnInterval);
        spawnInterval = setInterval(createBalloon, spawnRate);
    }

    // Remove balloon
    b.element.remove();
    balloons.splice(index, 1);
}

function loseLife() {
    lives--;
    updateLivesDisplay();
    
    // Visual indication of losing a life
    gameContainer.style.background = 'linear-gradient(135deg, #ff7e5f 0%, #feb47b 100%)';
    setTimeout(() => {
        gameContainer.style.background = ''; // reset to default css gradient
    }, 200);

    if (lives <= 0) {
        endGame();
    }
}

function updateLivesDisplay() {
    livesEl.textContent = '❤️'.repeat(Math.max(0, lives));
}

function startGame() {
    // Reset state
    score = 0;
    lives = 3;
    spawnRate = 2000;
    baseSpeed = 2;
    gameActive = true;
    
    scoreEl.textContent = score;
    updateLivesDisplay();
    
    // Clear existing balloons
    balloons.forEach(b => b.element.remove());
    balloons = [];
    
    // Hide screens
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    
    // Start game loops
    spawnInterval = setInterval(createBalloon, spawnRate);
    requestAnimationFrame(updateGame);
}

function endGame() {
    gameActive = false;
    clearInterval(spawnInterval);
    finalScoreEl.textContent = score;
    gameOverScreen.classList.remove('hidden');
}

// Event Listeners
startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);

document.addEventListener('keydown', (e) => {
    if (!gameActive) return;
    
    const key = e.key.toUpperCase();
    
    // Ensure it's a letter A-Z
    if (/^[A-Z]$/.test(key)) {
        // Find balloon matching the typed key.
        // We'll prioritize the balloon that is lowest on the screen (highest Y value)
        let targetIndex = -1;
        let lowestY = -Infinity;
        
        for (let i = 0; i < balloons.length; i++) {
            if (balloons[i].letter === key && balloons[i].y > lowestY) {
                targetIndex = i;
                lowestY = balloons[i].y;
            }
        }
        
        if (targetIndex !== -1) {
            popBalloon(targetIndex);
        } else {
            // Optional constraint: penalty for wrong keys to discourage spamming? 
            // We'll leave it forgiving for kids right now.
        }
    }
});
