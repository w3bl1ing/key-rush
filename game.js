class FeverSystem {
    constructor() {
        this.heat = 0; // 0-100
        this.maxHeat = 100;
        this.level = 0; // 0-4 (0=none, 1-3=fever levels, 4=fever rush)
        this.feverRushActive = false;
        this.feverRushStartTime = 0;
        this.feverRushDuration = 10000; // 10 seconds
        this.lastWpmSnapshot = 0;
        this.perfectWordStreak = 0;
        
        this.levels = {
            0: { name: 'Cool', multiplier: 1, threshold: 0 },
            1: { name: 'Warm', multiplier: 1.2, threshold: 25 },
            2: { name: 'Hot', multiplier: 1.5, threshold: 50 },
            3: { name: 'Blazing', multiplier: 2.0, threshold: 75 },
            4: { name: 'FEVER!', multiplier: 3.0, threshold: 100 }
        };
        
        this.decayRates = {
            normal: 5, // per second
            error: 15, // instant penalty
            safeZone: 2, // per second when position > 0.7
            inactivity: 10 // per second when not typing
        };
    }

    addHeat(amount) {
        if (this.feverRushActive) return; // Can't gain heat during fever rush
        
        this.heat = Math.min(this.maxHeat, this.heat + amount);
        this.updateLevel();
        
        // Trigger fever rush at max heat
        if (this.heat >= this.maxHeat && this.level < 4) {
            this.triggerFeverRush();
        }
    }

    removeHeat(amount) {
        this.heat = Math.max(0, this.heat - amount);
        this.updateLevel();
    }

    updateLevel() {
        let newLevel = 0;
        for (let level = 4; level >= 0; level--) {
            if (this.heat >= this.levels[level].threshold) {
                newLevel = level;
                break;
            }
        }
        this.level = newLevel;
    }

    triggerFeverRush() {
        this.feverRushActive = true;
        this.feverRushStartTime = Date.now();
        this.level = 4;
        this.perfectWordStreak = 0;
    }

    updateFeverRush() {
        if (!this.feverRushActive) return false;
        
        const elapsed = Date.now() - this.feverRushStartTime;
        if (elapsed >= this.feverRushDuration) {
            this.endFeverRush();
            return false;
        }
        return true;
    }

    endFeverRush() {
        this.feverRushActive = false;
        this.heat = 0; // Cool down completely after fever rush
        this.updateLevel();
    }

    applyDecay(deltaTime, playerPosition, isTyping, hasError = false) {
        if (this.feverRushActive) return;
        
        let decayAmount = 0;
        
        if (hasError) {
            decayAmount += this.decayRates.error;
        } else if (!isTyping) {
            decayAmount += (this.decayRates.inactivity * deltaTime) / 1000;
        } else {
            decayAmount += (this.decayRates.normal * deltaTime) / 1000;
            
            // Safe zone penalty - discourages camping
            if (playerPosition > 0.7) {
                decayAmount += (this.decayRates.safeZone * deltaTime) / 1000;
            }
        }
        
        this.removeHeat(decayAmount);
    }

    // Heat generation triggers
    onDangerZoneTyping(playerPosition, deltaTime) {
        if (playerPosition < 0.3) {
            const intensity = (0.3 - playerPosition) / 0.3; // 0-1 scale
            this.addHeat((8 * intensity * deltaTime) / 1000);
        }
    }

    onRightWallTouch(playerPosition) {
        if (playerPosition > 0.9) {
            this.addHeat(15);
        }
    }

    onPerfectWord() {
        this.perfectWordStreak++;
        this.addHeat(10 + (this.perfectWordStreak * 2));
    }

    onWpmBurst(currentWpm, averageWpm) {
        if (currentWpm > averageWpm + 20) {
            const burstIntensity = Math.min((currentWpm - averageWpm - 20) / 20, 2);
            this.addHeat(5 + (burstIntensity * 3));
        }
    }

    onComboIncrease(comboCount) {
        this.addHeat(comboCount * 1.5);
    }

    onTypingError() {
        this.perfectWordStreak = 0;
        this.applyDecay(0, 0, false, true);
    }

    getScoreMultiplier() {
        return this.levels[this.level].multiplier;
    }

    getLevel() {
        return this.level;
    }

    getLevelName() {
        return this.levels[this.level].name;
    }

    getHeatPercentage() {
        return (this.heat / this.maxHeat) * 100;
    }

    isFeverRushActive() {
        return this.feverRushActive;
    }

    getFeverRushTimeLeft() {
        if (!this.feverRushActive) return 0;
        const elapsed = Date.now() - this.feverRushStartTime;
        return Math.max(0, this.feverRushDuration - elapsed);
    }

    reset() {
        this.heat = 0;
        this.level = 0;
        this.feverRushActive = false;
        this.perfectWordStreak = 0;
        this.lastWpmSnapshot = 0;
    }
}

class PowerUpSystem {
    constructor() {
        this.activePowerUps = [];
        this.effects = {
            speed: { duration: 3000, multiplier: 1.5 },
            timeWarp: { duration: 5000, multiplier: 0.5 },
            shield: { duration: 4000, multiplier: 1 },
            multiplier: { duration: 6000, multiplier: 2, wordsLeft: 3 },
            laserFocus: { duration: 6000, multiplier: 1 },
            freeze: { duration: 5000, multiplier: 0 }
        };
    }

    activatePowerUp(type, rarity = 'common') {
        const rarityMultiplier = { common: 1, rare: 1.3, epic: 1.6 };
        const effect = { ...this.effects[type] };
        
        // Apply rarity bonus
        effect.duration *= rarityMultiplier[rarity];
        if (effect.multiplier !== 1) {
            effect.multiplier *= rarityMultiplier[rarity];
        }
        
        // Remove existing power-up of same type
        this.activePowerUps = this.activePowerUps.filter(pu => pu.type !== type);
        
        const powerUp = {
            type: type,
            rarity: rarity,
            startTime: Date.now(),
            duration: effect.duration,
            multiplier: effect.multiplier,
            wordsLeft: effect.wordsLeft || null
        };
        
        this.activePowerUps.push(powerUp);
        return powerUp;
    }

    updatePowerUps() {
        const now = Date.now();
        this.activePowerUps = this.activePowerUps.filter(powerUp => {
            if (powerUp.wordsLeft !== null) {
                return powerUp.wordsLeft > 0;
            }
            return (now - powerUp.startTime) < powerUp.duration;
        });
    }

    isActive(type) {
        return this.activePowerUps.some(pu => pu.type === type);
    }

    getPowerUp(type) {
        return this.activePowerUps.find(pu => pu.type === type);
    }

    getTimeRemaining(type) {
        const powerUp = this.getPowerUp(type);
        if (!powerUp) return 0;
        
        if (powerUp.wordsLeft !== null) {
            return powerUp.wordsLeft;
        }
        
        const elapsed = Date.now() - powerUp.startTime;
        return Math.max(0, powerUp.duration - elapsed);
    }

    consumeMultiplierUse() {
        const multiplier = this.getPowerUp('multiplier');
        if (multiplier && multiplier.wordsLeft > 0) {
            multiplier.wordsLeft--;
        }
    }

    getActivePowerUps() {
        return this.activePowerUps;
    }

    reset() {
        this.activePowerUps = [];
    }
    
    cleanup() {
        // Clear all active power-ups to prevent memory leaks
        this.activePowerUps = [];
    }
}

class ParticleManager {
    constructor() {
        this.particles = [];
        this.confettiColors = [
            '#ff0080', '#00ffff', '#ffff00', '#ff8000', '#8000ff', '#00ff80', 
            '#ff4080', '#80ff40', '#ff6b9d', '#4ecdc4', '#45b7d1', '#96ceb4',
            '#feca57', '#ff6b6b', '#4834d4', '#686de0', '#30e3ca', '#ff9ff3',
            '#54a0ff', '#5f27cd', '#00d2d3', '#ff9f43', '#10ac84', '#ee5a24'
        ];
    }
    
    createThanosSnapExplosion(word, wordContainer, color = '#00ffff') {
        const letters = word.split('');
        const letterElements = wordContainer.querySelectorAll('.letter');
        const canvasRect = document.getElementById('game-canvas').getBoundingClientRect();
        
        // Create particles from each letter's actual position (Thanos snap effect)
        letters.forEach((letter, index) => {
            if (letter.trim() === '' || index >= letterElements.length) return;
            
            const letterElement = letterElements[index];
            const letterRect = letterElement.getBoundingClientRect();
            
            // Convert DOM position to canvas coordinates
            const letterX = (letterRect.left + letterRect.right) / 2 - canvasRect.left;
            const letterY = (letterRect.top + letterRect.bottom) / 2 - canvasRect.top;
            
            // Create multiple particles per letter exploding from its exact position
            const particlesPerLetter = 4 + Math.floor(Math.random() * 3); // 4-6 particles per letter
            
            for (let i = 0; i < particlesPerLetter; i++) {
                // Explosion radiates outward from letter position
                const angle = (Math.PI * 2 * i) / particlesPerLetter + (Math.random() - 0.5) * 0.8;
                const velocity = 180 + Math.random() * 280;
                const particleColor = color || this.confettiColors[Math.floor(Math.random() * this.confettiColors.length)];
                
                this.particles.push({
                    type: 'letter',
                    letter: letter.toUpperCase(),
                    x: letterX + (Math.random() - 0.5) * 8, // Very small initial spread from letter center
                    y: letterY + (Math.random() - 0.5) * 8,
                    vx: Math.cos(angle) * velocity,
                    vy: Math.sin(angle) * velocity - 80, // Slight upward bias
                    rotation: Math.random() * Math.PI * 2,
                    rotationSpeed: (Math.random() - 0.5) * 0.8,
                    scale: 0.7 + Math.random() * 0.6,
                    color: particleColor,
                    life: 1.0,
                    maxLife: 2.2 + Math.random() * 1.3,
                    gravity: 140 + Math.random() * 80,
                    bounce: 0.35 + Math.random() * 0.4,
                    airResistance: 0.985 + Math.random() * 0.01,
                    startTime: Date.now() + index * 30 + Math.random() * 50 // Slight cascade from left to right
                });
            }
            
            // Add smaller confetti pieces from each letter position
            const confettiPerLetter = 2 + Math.floor(Math.random() * 2);
            for (let i = 0; i < confettiPerLetter; i++) {
                const angle = Math.random() * Math.PI * 2;
                const velocity = 120 + Math.random() * 200;
                const color = this.confettiColors[Math.floor(Math.random() * this.confettiColors.length)];
                
                this.particles.push({
                    type: 'confetti',
                    x: letterX + (Math.random() - 0.5) * 10,
                    y: letterY + (Math.random() - 0.5) * 10,
                    vx: Math.cos(angle) * velocity,
                    vy: Math.sin(angle) * velocity - 60,
                    rotation: Math.random() * Math.PI * 2,
                    rotationSpeed: (Math.random() - 0.5) * 1.0,
                    width: 6 + Math.random() * 8,
                    height: 2 + Math.random() * 4,
                    color: color,
                    life: 1.0,
                    maxLife: 1.8 + Math.random() * 1.2,
                    gravity: 160 + Math.random() * 100,
                    bounce: 0.25 + Math.random() * 0.35,
                    airResistance: 0.98 + Math.random() * 0.015,
                    startTime: Date.now() + index * 25 + Math.random() * 75
                });
            }
        });
        
        // Add some extra explosion particles from word center for dramatic effect
        const wordRect = wordContainer.getBoundingClientRect();
        const wordCenterX = (wordRect.left + wordRect.right) / 2 - canvasRect.left;
        const wordCenterY = (wordRect.top + wordRect.bottom) / 2 - canvasRect.top;
        
        for (let i = 0; i < 15; i++) {
            const angle = (Math.PI * 2 * i) / 15 + (Math.random() - 0.5) * 0.5;
            const velocity = 200 + Math.random() * 300;
            const color = this.confettiColors[Math.floor(Math.random() * this.confettiColors.length)];
            
            this.particles.push({
                type: 'confetti',
                x: wordCenterX + (Math.random() - 0.5) * 20,
                y: wordCenterY + (Math.random() - 0.5) * 20,
                vx: Math.cos(angle) * velocity,
                vy: Math.sin(angle) * velocity - 100,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 1.2,
                width: 8 + Math.random() * 10,
                height: 3 + Math.random() * 5,
                color: color,
                life: 1.0,
                maxLife: 2.0 + Math.random() * 1.0,
                gravity: 170 + Math.random() * 110,
                bounce: 0.3 + Math.random() * 0.4,
                airResistance: 0.98 + Math.random() * 0.02,
                startTime: Date.now() + Math.random() * 100
            });
        }
    }
    
    createBorderDisintegration(wordContainer) {
        const canvasRect = document.getElementById('game-canvas').getBoundingClientRect();
        const wordRect = wordContainer.getBoundingClientRect();
        
        // Convert word container position to canvas coordinates
        const wordLeft = wordRect.left - canvasRect.left;
        const wordTop = wordRect.top - canvasRect.top;
        const wordWidth = wordRect.width;
        const wordHeight = wordRect.height;
        
        // Create particles along the border perimeter
        const borderThickness = 4;
        const particleSpacing = 8; // Distance between border particles
        
        // Top border particles
        for (let x = 0; x <= wordWidth; x += particleSpacing) {
            this.createBorderParticle(
                wordLeft + x, 
                wordTop, 
                'top',
                x / wordWidth // Progress along border for stagger timing
            );
        }
        
        // Right border particles  
        for (let y = 0; y <= wordHeight; y += particleSpacing) {
            this.createBorderParticle(
                wordLeft + wordWidth, 
                wordTop + y, 
                'right',
                y / wordHeight
            );
        }
        
        // Bottom border particles
        for (let x = wordWidth; x >= 0; x -= particleSpacing) {
            this.createBorderParticle(
                wordLeft + x, 
                wordTop + wordHeight, 
                'bottom',
                (wordWidth - x) / wordWidth
            );
        }
        
        // Left border particles
        for (let y = wordHeight; y >= 0; y -= particleSpacing) {
            this.createBorderParticle(
                wordLeft, 
                wordTop + y, 
                'left',
                (wordHeight - y) / wordHeight
            );
        }
    }
    
    createBorderParticle(x, y, side, progress) {
        // Direction vectors for each border side
        const directions = {
            top: { vx: 0, vy: -1 },
            right: { vx: 1, vy: 0 },
            bottom: { vx: 0, vy: 1 },
            left: { vx: -1, vy: 0 }
        };
        
        const direction = directions[side];
        const baseVelocity = 120 + Math.random() * 180;
        const spreadAngle = (Math.random() - 0.5) * Math.PI * 0.4; // 72 degree spread
        
        // Calculate final velocity with spread
        const cos = Math.cos(spreadAngle);
        const sin = Math.sin(spreadAngle);
        const finalVx = (direction.vx * cos - direction.vy * sin) * baseVelocity;
        const finalVy = (direction.vx * sin + direction.vy * cos) * baseVelocity;
        
        // Border colors - cyan to magenta gradient
        const borderColors = ['#00ffff', '#4080ff', '#8040ff', '#ff00ff', '#ff4080', '#80ff80'];
        const color = borderColors[Math.floor(Math.random() * borderColors.length)];
        
        this.particles.push({
            type: 'border',
            x: x + (Math.random() - 0.5) * 4,
            y: y + (Math.random() - 0.5) * 4,
            vx: finalVx + (Math.random() - 0.5) * 60,
            vy: finalVy + (Math.random() - 0.5) * 60 - 40, // Slight upward bias
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.6,
            width: 6 + Math.random() * 8,
            height: 2 + Math.random() * 3,
            color: color,
            life: 1.0,
            maxLife: 1.5 + Math.random() * 1.0,
            gravity: 120 + Math.random() * 80,
            bounce: 0.2 + Math.random() * 0.3,
            airResistance: 0.985 + Math.random() * 0.01,
            startTime: Date.now() + progress * 150 + Math.random() * 50, // Cascade around border
            glowIntensity: 0.8 + Math.random() * 0.4
        });
    }
    
    createColorfulExplosion(x, y, count = 15) {
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
            const velocity = 100 + Math.random() * 150;
            const color = this.colors[Math.floor(Math.random() * this.colors.length)];
            
            this.particles.push({
                type: 'dot',
                x: x,
                y: y,
                vx: Math.cos(angle) * velocity,
                vy: Math.sin(angle) * velocity,
                size: 3 + Math.random() * 5,
                color: color,
                life: 1.0,
                maxLife: 1.0 + Math.random() * 0.5,
                gravity: 150,
                startTime: Date.now()
            });
        }
    }
    
    update(deltaTime, canvasWidth, canvasHeight) {
        const dt = deltaTime * 0.016;
        const now = Date.now();
        
        this.particles = this.particles.filter(particle => {
            if (now < particle.startTime) return true; // Not started yet
            
            const age = (now - particle.startTime) / 1000;
            if (age > particle.maxLife) return false;
            
            // Apply air resistance for confetti effect
            if (particle.airResistance) {
                particle.vx *= particle.airResistance;
                particle.vy *= particle.airResistance;
            }
            
            // Update physics
            particle.vy += particle.gravity * dt;
            particle.x += particle.vx * dt;
            particle.y += particle.vy * dt;
            
            // Bounce off bottom with more realistic physics
            if (particle.y > canvasHeight - 20) {
                particle.y = canvasHeight - 20;
                particle.vy *= -particle.bounce;
                particle.vx *= 0.85; // Friction
                
                // Stop tiny bounces
                if (Math.abs(particle.vy) < 10) {
                    particle.vy = 0;
                    particle.bounce *= 0.8;
                }
            }
            
            // Bounce off sides for confetti effect
            if (particle.x < 0 || particle.x > canvasWidth) {
                particle.vx *= -0.5;
                particle.x = particle.x < 0 ? 0 : canvasWidth;
            }
            
            // Update rotation
            if (particle.type === 'letter' || particle.type === 'confetti') {
                particle.rotation += particle.rotationSpeed * dt;
            }
            
            // Update life with smoother fade
            particle.life = Math.pow(1 - (age / particle.maxLife), 1.5);
            
            return particle.life > 0;
        });
    }
    
    render(ctx) {
        this.particles.forEach(particle => {
            if (Date.now() < particle.startTime) return; // Not started yet
            
            ctx.save();
            
            const alpha = Math.pow(particle.life, 0.8); // Smoother fade out
            ctx.globalAlpha = alpha;
            
            if (particle.type === 'letter') {
                ctx.translate(particle.x, particle.y);
                ctx.rotate(particle.rotation);
                ctx.scale(particle.scale, particle.scale);
                
                // Letter styling with enhanced glow
                ctx.font = 'bold 28px Orbitron, monospace';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                
                // Multi-layer glow effect
                ctx.shadowColor = particle.color;
                ctx.shadowBlur = 20 * alpha;
                ctx.fillStyle = particle.color;
                ctx.fillText(particle.letter, 0, 0);
                
                // Inner bright core
                ctx.shadowBlur = 8 * alpha;
                ctx.fillStyle = '#ffffff';
                ctx.fillText(particle.letter, 0, 0);
                
            } else if (particle.type === 'confetti') {
                ctx.translate(particle.x, particle.y);
                ctx.rotate(particle.rotation);
                
                // Rectangular confetti pieces
                ctx.fillStyle = particle.color;
                ctx.shadowColor = particle.color;
                ctx.shadowBlur = 12 * alpha;
                
                const halfWidth = particle.width * 0.5;
                const halfHeight = particle.height * 0.5;
                ctx.fillRect(-halfWidth, -halfHeight, particle.width, particle.height);
                
                // Add shimmer effect
                const shimmerGradient = ctx.createLinearGradient(-halfWidth, -halfHeight, halfWidth, halfHeight);
                shimmerGradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
                shimmerGradient.addColorStop(0.3, `rgba(255, 255, 255, ${0.6 * alpha})`);
                shimmerGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
                
                ctx.fillStyle = shimmerGradient;
                ctx.fillRect(-halfWidth, -halfHeight, particle.width, particle.height);
                
            } else if (particle.type === 'border') {
                ctx.translate(particle.x, particle.y);
                ctx.rotate(particle.rotation);
                
                // Border particle with enhanced glow
                const glowAlpha = alpha * particle.glowIntensity;
                ctx.fillStyle = particle.color;
                ctx.shadowColor = particle.color;
                ctx.shadowBlur = 16 * glowAlpha;
                
                const halfWidth = particle.width * 0.5;
                const halfHeight = particle.height * 0.5;
                
                // Main border piece
                ctx.fillRect(-halfWidth, -halfHeight, particle.width, particle.height);
                
                // Extra bright core for border glow
                ctx.shadowBlur = 8 * glowAlpha;
                ctx.fillStyle = `rgba(255, 255, 255, ${glowAlpha * 0.8})`;
                ctx.fillRect(-halfWidth * 0.6, -halfHeight * 0.6, particle.width * 0.6, particle.height * 0.6);
                
                // Outer glow ring
                ctx.shadowBlur = 20 * glowAlpha;
                ctx.fillStyle = particle.color;
                ctx.fillRect(-halfWidth * 1.2, -halfHeight * 1.2, particle.width * 1.2, particle.height * 1.2);
                
            } else if (particle.type === 'dot') {
                ctx.fillStyle = particle.color;
                ctx.shadowColor = particle.color;
                ctx.shadowBlur = 10 * alpha;
                
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                ctx.fill();
            }
            
            ctx.restore();
        });
    }
    
    clear() {
        this.particles = [];
    }
    
    getParticleCount() {
        return this.particles.length;
    }
}

class TypingGame {
    constructor() {
        console.log('TypingGame constructor called');
        
        // Initialize event listeners array first
        this.eventListeners = [];
        
        // Cache all DOM elements with safety checks
        this.domElements = this.cacheDOMElements();
        if (!this.domElements.canvas) {
            console.error('Critical DOM elements missing! Cannot initialize game.');
            return;
        }
        
        this.canvas = this.domElements.canvas;
        this.ctx = this.canvas.getContext('2d');
        
        // Handle canvas context loss
        this.canvas.addEventListener('webglcontextlost', (e) => {
            e.preventDefault();
            console.warn('Canvas context lost');
        });
        
        this.canvas.addEventListener('webglcontextrestored', () => {
            console.log('Canvas context restored');
            this.ctx = this.canvas.getContext('2d');
            this.setupCanvas();
        });
        
        this.setupCanvas();
        
        this.gameState = 'start'; // 'start', 'playing', 'gameOver'
        this.activeBranch = 1; // 1 or 2
        
        this.player = {
            position: 0.5, // 0 = left edge (danger), 1 = right edge (safe)
            speed: 0,
            targetPosition: 0.5,
            safeWallContactTime: 0, // Track how long touching safe wall
            wasInSafeZone: false // Track if player was in safe zone last frame
        };
        
        this.screenShake = {
            active: false,
            intensity: 0,
            duration: 0,
            startTime: 0,
            offsetX: 0,
            offsetY: 0
        };
        
        this.particleManager = new ParticleManager();
        
        this.background = {
            offset: 0,
            scrollSpeed: 1.5,
            baseSpeed: 1.5,
            maxSpeed: 3.5
        };
        
        this.typing = {
            currentInput: '',
            wordsPerMinute: 0,
            startTime: null,
            charactersTyped: 0,
            lastWpmUpdate: 0
        };

        // Performance optimization flags
        this.frenzyUpdatePending = false;
        this.snakeUpdatePending = false;
        this.animatedElements = new Set(); // Track elements with animations for cleanup
        
        this.scoring = {
            score: 0,
            combo: 0,
            wordsCompleted: 0,
            bestWpm: 0
        };
        
        // Rogue-like run system
        this.runSystem = {
            active: false,          // Whether a run is currently active
            currentFloor: 1,        // Current floor number (1-based)
            maxFloor: 15,           // Maximum floors per run
            runState: 'inactive',   // 'inactive', 'active', 'completed', 'failed'
            floorsCompleted: 0,     // Number of floors completed this run
            runsAttempted: 0,       // Total runs attempted
            bestFloorReached: 0     // Best floor ever reached
        };
        
        this.frenzyMode = {
            active: false,
            countdownActive: false,
            wordsSinceFrenzy: 0,
            frenzyTriggerInterval: 5, // Every 5th word for easier testing
            currentSentence: '',
            sentenceWords: [],
            currentWordIndex: 0,
            completedWords: [],
            snakeContainer: null,
            // Duration-based timer system
            duration: 30000, // 30 seconds in milliseconds
            timeRemaining: 30000,
            startTime: null,
            lastTypoTime: 0, // Track last typo to avoid duplicate penalties
            // Timer adjustment values
            correctWordBonus: 3000, // +3 seconds per correct word
            typoePenalty: 2000, // -2 seconds per typo
            maxDuration: 60000, // 60 second cap
            minDuration: 5000, // 5 second minimum
            // Frenzy-specific performance tracking
            frenzyStartTime: null,
            frenzyEndTime: null,
            totalCharactersTyped: 0,
            correctCharactersTyped: 0,
            totalWords: 0,
            perfectWords: 0,
            wpmHistory: [],
            currentWPM: 0,
            averageAccuracy: 0
        };
        
        this.powerUpSystem = new PowerUpSystem();
        this.feverSystem = new FeverSystem();
        this.hadErrorDuringWord = false;
        this.averageWpmHistory = [];
        
        this.setupEventListeners();
        this.updateUI();
        this.startGameLoop();
        
        WordManager.generateWordPair(0);
        this.updateWordDisplay();
        
        // Add error handler for uncaught errors
        this.addEventListenerTracked(window, 'error', (e) => {
            console.error('Game Error:', e.error);
            // Don't let errors crash the entire game
            e.preventDefault();
        });
        
        this.addEventListenerTracked(window, 'unhandledrejection', (e) => {
            console.error('Unhandled Promise Rejection:', e.reason);
            e.preventDefault();
        });
    }
    
    cacheDOMElements() {
        const elements = {};
        const elementIds = [
            'game-canvas', 'start-btn', 'restart-btn', 'word-input',
            'start-screen', 'game-over-screen', 'floor', 'score', 'wpm', 'combo',
            'fever-display-center', 'fever-level', 'fever-multiplier', 'fever-fill',
            'fever-rush-overlay', 'fever-rush-timer', 'freeze-flash-overlay',
            'frenzy-mode-overlay', 'frenzy-countdown', 'frenzy-ui-container',
            'frenzy-word-counter', 'frenzy-timer', 'frenzy-progress-fill',
            'frenzy-current-word-display', 'frenzy-input-echo', 'snake-container',
            'frenzy-complete-overlay', 'frenzy-bonus-score', 'frenzy-timeout-overlay',
            'position-bar', 'player-marker', 'active-powerups',
            'branch-1', 'branch-2', 'final-score', 'best-wpm', 'words-typed'
        ];
        
        elementIds.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                elements[id.replace(/-/g, '_')] = element;
            } else {
                console.warn(`DOM element with ID '${id}' not found`);
            }
        });
        
        // Special handling for canvas
        elements.canvas = elements.game_canvas;
        
        return elements;
    }
    
    // Helper method for safe DOM element access
    safeGetElement(id) {
        const element = this.domElements[id.replace(/-/g, '_')] || document.getElementById(id);
        if (!element) {
            console.warn(`Element with ID '${id}' not found`);
        }
        return element;
    }

    // Helper method for formatting numbers with commas
    formatNumber(num) {
        return num.toLocaleString();
    }
    
    addEventListenerTracked(element, event, handler, options = false) {
        if (element && typeof element.addEventListener === 'function') {
            element.addEventListener(event, handler, options);
            
            // Ensure eventListeners array exists
            if (!this.eventListeners) {
                this.eventListeners = [];
            }
            
            this.eventListeners.push({ element, event, handler, options });
        }
    }
    
    cleanup() {
        // Remove all tracked event listeners
        this.eventListeners.forEach(({ element, event, handler, options }) => {
            if (element && typeof element.removeEventListener === 'function') {
                element.removeEventListener(event, handler, options);
            }
        });
        this.eventListeners = [];
        
        // Stop game loop
        if (this.gameLoopId) {
            cancelAnimationFrame(this.gameLoopId);
        }
        
        // Clear power-up timers
        if (this.powerUpSystem && this.powerUpSystem.cleanup) {
            this.powerUpSystem.cleanup();
        }
    }
    
    setupCanvas() {
        this.resizeHandler = () => {
            if (this.canvas) {
                this.canvas.width = window.innerWidth;
                this.canvas.height = window.innerHeight;
            }
        };
        
        this.resizeHandler();
        this.addEventListenerTracked(window, 'resize', this.resizeHandler);
    }
    
    setupEventListeners() {
        const startBtn = this.domElements.start_btn;
        const restartBtn = this.domElements.restart_btn;
        const wordInput = this.domElements.word_input;
        
        if (startBtn) {
            this.addEventListenerTracked(startBtn, 'click', () => this.startNewRun());
        } else {
            console.error('Start button not found');
        }
        
        if (restartBtn) {
            this.addEventListenerTracked(restartBtn, 'click', () => {
                this.startNewRun();
            });
        } else {
            console.error('Restart button not found');
        }
        
        if (wordInput) {
            this.addEventListenerTracked(wordInput, 'input', (e) => this.handleInput(e));
            this.addEventListenerTracked(wordInput, 'focus', () => {
                if (this.gameState !== 'playing') {
                    wordInput.blur();
                }
            });
        } else {
            console.error('Word input not found');
        }
        
        this.keydownHandler = (e) => {
            // Improved input validation
            if (!e || typeof e.key !== 'string') return;
            
            // Handle frenzy mode space bar advancement
            if (e.key === ' ' && this.frenzyMode.active && this.gameState === 'playing') {
                e.preventDefault();
                this.handleFrenzySpaceAdvancement();
                return;
            }
            
            // Prevent rapid TAB switching
            if (e.key === 'Tab') {
                e.preventDefault();
                if (!this.lastTabSwitch || Date.now() - this.lastTabSwitch > 100) {
                    this.switchBranch();
                    this.lastTabSwitch = Date.now();
                }
            }
            
            // Allow starting game with Enter or Space
            if ((e.key === 'Enter' || e.key === ' ') && this.gameState === 'start') {
                e.preventDefault();
                this.startNewRun();
            }
            
            // Allow restarting game with Enter or Space
            if ((e.key === 'Enter' || e.key === ' ') && this.gameState === 'gameOver') {
                e.preventDefault();
                this.startNewRun();
            }
        };
        
        this.addEventListenerTracked(document, 'keydown', this.keydownHandler);
        
        // Add touch support for mobile devices
        this.setupTouchSupport();
    }
    
    setupTouchSupport() {
        // Detect if device supports touch
        this.isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        
        if (this.isTouchDevice) {
            // Add touch handlers for start/restart
            const startBtn = this.domElements.start_btn;
            const restartBtn = this.domElements.restart_btn;
            
            if (startBtn) {
                this.addEventListenerTracked(startBtn, 'touchstart', (e) => {
                    e.preventDefault();
                    this.startNewRun();
                });
            }
            
            if (restartBtn) {
                this.addEventListenerTracked(restartBtn, 'touchstart', (e) => {
                    e.preventDefault();
                    this.startNewRun();
                });
            }
            
            // Add touch handler for branch switching (tap to switch)
            const branch1 = this.domElements.branch_1;
            const branch2 = this.domElements.branch_2;
            
            if (branch1) {
                this.addEventListenerTracked(branch1, 'touchstart', (e) => {
                    e.preventDefault();
                    if (this.activeBranch !== 1) this.switchBranch();
                });
            }
            
            if (branch2) {
                this.addEventListenerTracked(branch2, 'touchstart', (e) => {
                    e.preventDefault();
                    if (this.activeBranch !== 2) this.switchBranch();
                });
            }
            
            // Prevent zoom on double tap
            this.addEventListenerTracked(document, 'touchstart', (e) => {
                if (e.touches.length > 1) {
                    e.preventDefault();
                }
            });
            
            // Improve mobile input experience
            const wordInput = this.domElements.word_input;
            if (wordInput) {
                wordInput.setAttribute('inputmode', 'text');
                wordInput.setAttribute('autocapitalize', 'none');
                wordInput.setAttribute('autocorrect', 'off');
                wordInput.setAttribute('spellcheck', 'false');
            }
        }
    }
    
    startGame() {
        console.log('Starting game...');
        this.gameState = 'playing';
        this.resetGameData();
        
        const startScreen = this.domElements.start_screen;
        const feverDisplay = this.domElements.fever_display_center;
        const wordInput = this.domElements.word_input;
        
        if (startScreen) {
            startScreen.classList.add('hidden');
        } else {
            console.error('Start screen not found');
        }
        
        if (feverDisplay) {
            feverDisplay.classList.remove('hidden');
        } else {
            console.error('Fever display not found');
        }

        // Show active power-ups container when game starts
        const activePowerupsContainer = document.getElementById('active-powerups');
        if (activePowerupsContainer) {
            activePowerupsContainer.classList.remove('hidden');
        }
        
        if (wordInput) {
            wordInput.focus();
        } else {
            console.error('Word input not found');
        }
        
        this.typing.startTime = Date.now();
        WordManager.reset();
        this.updateWordDisplay();
        console.log('Game started successfully');
    }
    
    restartGame() {
        if (this.domElements.game_over_screen) {
            this.domElements.game_over_screen.classList.add('hidden');
        }
        this.startNewRun();
    }
    
    // Rogue-like run management functions
    startNewRun() {

        // Hide game over screen if it's showing
        const gameOverScreen = document.getElementById('game-over-screen');
        if (gameOverScreen) {
            gameOverScreen.classList.add('hidden');
        }

        // Initialize run state
        this.runSystem.active = true;
        this.runSystem.currentFloor = 1;
        this.runSystem.runState = 'active';
        this.runSystem.floorsCompleted = 0;
        this.runSystem.runsAttempted += 1;

        // Start the game with run-specific initialization
        this.startGame();
        
        // Run started (floor system placeholder for future roguelike features)
    }
    
    endRun(reason = 'failed') {
        console.log(`Ending run - Reason: ${reason}`);
        
        // Update best floor reached if applicable
        if (this.runSystem.currentFloor > this.runSystem.bestFloorReached) {
            this.runSystem.bestFloorReached = this.runSystem.currentFloor;
        }
        
        // Set final run state
        this.runSystem.runState = reason; // 'completed', 'failed'
        this.runSystem.active = false;
        
        // Run statistics logged for potential future use
        // Floor system not currently active in main gameplay
        
        // For now, proceed to game over screen
        // Later this will show run summary and meta-progression options
        if (reason === 'failed') {
            this.gameState = 'gameOver';
        }
    }
    
    // Helper functions for run state tracking
    isRunActive() {
        return this.runSystem.active && this.runSystem.runState === 'active';
    }
    
    getRunProgress() {
        if (!this.runSystem.active) return 0;
        return (this.runSystem.currentFloor - 1) / this.runSystem.maxFloor;
    }
    
    resetGameData() {
        this.player.position = 0.5;
        this.player.speed = 0;
        this.player.safeWallContactTime = 0;
        this.player.wasInSafeZone = false;
        this.background.offset = 0;
        this.background.scrollSpeed = this.background.baseSpeed;
        
        this.typing.currentInput = '';
        this.typing.wordsPerMinute = 0;
        this.typing.charactersTyped = 0;
        
        this.scoring.score = 0;
        this.scoring.combo = 0;
        this.scoring.wordsCompleted = 0;
        
        // Reset frenzy mode
        this.frenzyMode.active = false;
        this.frenzyMode.countdownActive = false;
        this.frenzyMode.wordsSinceFrenzy = 0;
        this.frenzyMode.currentSentence = '';
        this.frenzyMode.sentenceWords = [];
        this.frenzyMode.currentWordIndex = 0;
        this.frenzyMode.completedWords = [];
        this.frenzyMode.duration = 30000;
        this.frenzyMode.timeRemaining = 30000;
        this.frenzyMode.startTime = null;
        this.frenzyMode.lastTypoTime = 0;
        if (this.frenzyMode.snakeContainer) {
            this.frenzyMode.snakeContainer.remove();
            this.frenzyMode.snakeContainer = null;
        }
        
        this.powerUpSystem.reset();
        this.feverSystem.reset();
        this.hadErrorDuringWord = false;
        this.averageWpmHistory = [];
        
        // Reset active branch to default
        this.activeBranch = 1;
        
        if (this.domElements.word_input) {
            this.domElements.word_input.value = '';
        }
        this.typing.currentInput = '';
        this.updateUI();
    }
    
    triggerFrenzyMode() {
        const frenzyData = WordManager.generateFrenzySentence();
        
        // Clean up preview styling
        this.cleanupFrenzyPreview();
        
        // CRITICAL: Reset player to safe zone to prevent game over during countdown
        this.player.position = 0.9; // Move to safe zone (90% right)
        this.player.speed = 0; // Stop movement
        
        // Stop danger wall immediately
        this.background.scrollSpeed = 0;
        
        // Initialize frenzy mode state
        this.frenzyMode.active = false; // Not active yet, countdown first
        this.frenzyMode.countdownActive = true; // Countdown is starting
        this.frenzyMode.currentSentence = frenzyData.sentence;
        this.frenzyMode.sentenceWords = frenzyData.words;
        this.frenzyMode.currentWordIndex = 0;
        this.frenzyMode.completedWords = [];
        this.frenzyMode.wordsSinceFrenzy = 0;
        
        // Show frenzy mode overlay with countdown
        const frenzyOverlay = document.getElementById('frenzy-mode-overlay');
        frenzyOverlay.classList.remove('hidden');
        
        // Clear any existing countdown text to prevent double display
        const countdownElement = document.getElementById('frenzy-countdown');
        countdownElement.textContent = '';
        
        // Hide fever meter during frenzy mode
        const feverDisplay = document.getElementById('fever-display-center');
        if (feverDisplay) {
            feverDisplay.classList.add('hidden');
        }
        
        // Hide snake container initially
        const snakeContainer = document.getElementById('snake-container');
        snakeContainer.style.display = 'none';
        
        // Start countdown
        this.startFrenzyCountdown(() => {
            this.startFrenzyMode(frenzyData);
        });
        
        console.log(`Frenzy Mode: ${frenzyData.theme} - ${frenzyData.sentence}`);
    }
    
    showFrenzyModePreview() {
        // Immediate visual feedback to prevent "crash" perception
        // Dim the normal word display slightly
        const wordDisplay = document.getElementById('word-display');
        if (wordDisplay) {
            wordDisplay.style.transition = 'opacity 0.3s ease';
            wordDisplay.style.opacity = '0.5';
        }
        
        // Pause input temporarily and show visual feedback
        const wordInput = this.domElements.word_input;
        if (wordInput) {
            wordInput.style.transition = 'all 0.2s ease';
            wordInput.style.transform = 'scale(0.95)';
            wordInput.style.opacity = '0.7';
            wordInput.placeholder = 'FRENZY MODE INCOMING...';
        }
        
        // Create a subtle screen flash
        const flashOverlay = document.createElement('div');
        flashOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(45deg, rgba(255, 0, 255, 0.1), rgba(0, 255, 255, 0.1));
            z-index: 999;
            pointer-events: none;
            animation: frenzyPreviewFlash 0.4s ease-out;
        `;
        
        // Add flash animation if not already defined
        if (!document.querySelector('#frenzy-preview-styles')) {
            const style = document.createElement('style');
            style.id = 'frenzy-preview-styles';
            style.textContent = `
                @keyframes frenzyPreviewFlash {
                    0% { opacity: 0; }
                    50% { opacity: 1; }
                    100% { opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(flashOverlay);
        
        // Remove flash after animation
        setTimeout(() => {
            if (flashOverlay.parentNode) {
                flashOverlay.parentNode.removeChild(flashOverlay);
            }
        }, 400);
    }
    
    cleanupFrenzyPreview() {
        // Restore word display opacity
        const wordDisplay = document.getElementById('word-display');
        if (wordDisplay) {
            wordDisplay.style.opacity = '1';
            wordDisplay.style.transition = '';
        }
        
        // Restore input styling
        const wordInput = this.domElements.word_input;
        if (wordInput) {
            wordInput.style.transform = '';
            wordInput.style.opacity = '';
            wordInput.style.transition = '';
        }
    }
    
    startFrenzyCountdown(callback) {
        const countdownElement = document.getElementById('frenzy-countdown');
        console.log('Countdown element found:', countdownElement);
        
        if (!countdownElement) {
            console.error('Countdown element not found!');
            callback(); // Skip countdown if element missing
            return;
        }
        
        let count = 3;
        console.log('Starting frenzy countdown from', count);
        
        // Show initial count immediately
        countdownElement.textContent = count;
        countdownElement.style.animation = 'countdownPulse 1s ease-in-out';
        
        const countdownInterval = setInterval(() => {
            count--;
            console.log('Countdown tick:', count);
            
            if (count > 0) {
                countdownElement.textContent = count;
                countdownElement.style.animation = 'none';
                setTimeout(() => {
                    countdownElement.style.animation = 'countdownPulse 1s ease-in-out';
                }, 10);
            } else {
                console.log('Countdown finished, starting frenzy mode');
                clearInterval(countdownInterval);
                callback();
            }
        }, 1000);
    }
    
    startFrenzyMode(frenzyData) {
        // Now actually activate frenzy mode
        this.frenzyMode.active = true;
        this.frenzyMode.countdownActive = false; // Countdown is over
        
        // Hide countdown and announcement
        const announcement = document.querySelector('.frenzy-announcement');
        announcement.style.display = 'none';
        
        // Show snake container
        const snakeContainer = document.getElementById('snake-container');
        snakeContainer.style.display = 'flex';
        
        // Hide normal word display
        document.getElementById('word-display').style.display = 'none';
        
        // Create snake container
        this.createSnakeContainer();
        
        // Auto-trigger fever rush for dramatic effect
        this.feverSystem.triggerFeverRush();
        
        // Keep danger wall stopped during frenzy
        this.background.scrollSpeed = 0;
        
        // Initialize frenzy performance tracking
        this.initializeFrenzyTracking();
        
        // Update input placeholder and clear input
        const wordInput = this.domElements.word_input;
        wordInput.placeholder = 'Type word, then press SPACE to continue...';
        wordInput.value = '';
        this.typing.currentInput = '';
        
        // Initialize enhanced frenzy UI
        this.initializeFrenzyUI();
        
        // Initialize duration-based timer
        this.frenzyMode.startTime = Date.now();
        this.frenzyMode.timeRemaining = this.frenzyMode.duration;
        
        console.log('Frenzy Mode Started!');
    }
    
    initializeFrenzyTracking() {
        // Reset frenzy-specific performance tracking
        this.frenzyMode.frenzyStartTime = Date.now();
        this.frenzyMode.frenzyEndTime = null;
        this.frenzyMode.totalCharactersTyped = 0;
        this.frenzyMode.correctCharactersTyped = 0;
        this.frenzyMode.totalWords = 0;
        this.frenzyMode.perfectWords = 0;
        this.frenzyMode.wpmHistory = [];
        this.frenzyMode.currentWPM = 0;
        this.frenzyMode.averageAccuracy = 0;
        
        console.log('Frenzy tracking initialized');
    }

    updateFrenzyTracking(userInput, targetWord, accuracy) {
        // Track total characters and words
        this.frenzyMode.totalCharactersTyped += userInput.length;
        this.frenzyMode.correctCharactersTyped += Math.round(targetWord.length * accuracy);
        this.frenzyMode.totalWords += 1;
        
        // Track perfect words (100% accuracy)
        if (accuracy === 1.0) {
            this.frenzyMode.perfectWords += 1;
        }
        
        // Calculate current WPM for frenzy mode only
        const currentTime = Date.now();
        const timeElapsed = (currentTime - this.frenzyMode.frenzyStartTime) / 1000 / 60; // Convert to minutes
        this.frenzyMode.currentWPM = timeElapsed > 0 ? Math.round(this.frenzyMode.totalWords / timeElapsed) : 0;
        
        // Store WPM in history for averaging
        this.frenzyMode.wpmHistory.push(this.frenzyMode.currentWPM);
        
        // Calculate running accuracy average
        this.frenzyMode.averageAccuracy = this.frenzyMode.correctCharactersTyped / Math.max(1, this.frenzyMode.totalCharactersTyped);
        
        console.log(`Frenzy tracking: ${this.frenzyMode.totalWords} words, ${this.frenzyMode.currentWPM} WPM, ${Math.round(this.frenzyMode.averageAccuracy * 100)}% accuracy`);
    }

    updateFrenzyMetricsDisplay() {
        if (!this.frenzyMode.active) return;
        
        const wpmElement = document.getElementById('frenzy-wpm');
        const accuracyElement = document.getElementById('frenzy-accuracy');
        
        if (wpmElement && accuracyElement) {
            wpmElement.textContent = `WPM: ${this.frenzyMode.currentWPM}`;
            accuracyElement.textContent = `Acc: ${Math.round(this.frenzyMode.averageAccuracy * 100)}%`;
            
            // Add visual styling based on performance
            const accuracyPercent = this.frenzyMode.averageAccuracy * 100;
            if (accuracyPercent >= 90) {
                accuracyElement.style.color = '#00ff41';
            } else if (accuracyPercent >= 80) {
                accuracyElement.style.color = '#ffaa00';
            } else if (accuracyPercent >= 70) {
                accuracyElement.style.color = '#ff6600';
            } else {
                accuracyElement.style.color = '#ff4444';
            }
            
            // Color WPM based on speed
            if (this.frenzyMode.currentWPM >= 60) {
                wpmElement.style.color = '#00ff41';
            } else if (this.frenzyMode.currentWPM >= 40) {
                wpmElement.style.color = '#ffaa00';
            } else if (this.frenzyMode.currentWPM >= 20) {
                wpmElement.style.color = '#ff6600';
            } else {
                wpmElement.style.color = '#ff4444';
            }
        }
    }

    displayFinalFrenzyMetrics(bonusScore) {
        // Calculate final WPM
        const finalWPM = this.frenzyMode.currentWPM;
        const finalAccuracy = Math.round(this.frenzyMode.averageAccuracy * 100);
        
        // Update the completion overlay elements
        const wpmElement = document.getElementById('final-frenzy-wpm');
        const accuracyElement = document.getElementById('final-frenzy-accuracy');
        const perfectWordsElement = document.getElementById('frenzy-perfect-words');
        const bonusScoreElement = document.getElementById('frenzy-bonus-score');
        
        if (wpmElement) wpmElement.textContent = finalWPM.toString();
        if (accuracyElement) accuracyElement.textContent = `${finalAccuracy}%`;
        if (perfectWordsElement) perfectWordsElement.textContent = `${this.frenzyMode.perfectWords}/${this.frenzyMode.totalWords}`;
        if (bonusScoreElement) bonusScoreElement.textContent = `+${this.formatNumber(bonusScore)}`;
        
        // Apply color coding based on performance
        if (accuracyElement) {
            if (finalAccuracy >= 90) {
                accuracyElement.style.color = '#00ff41';
            } else if (finalAccuracy >= 80) {
                accuracyElement.style.color = '#ffaa00';
            } else if (finalAccuracy >= 70) {
                accuracyElement.style.color = '#ff6600';
            } else {
                accuracyElement.style.color = '#ff4444';
            }
        }
        
        if (wpmElement) {
            if (finalWPM >= 60) {
                wpmElement.style.color = '#00ff41';
            } else if (finalWPM >= 40) {
                wpmElement.style.color = '#ffaa00';
            } else if (finalWPM >= 20) {
                wpmElement.style.color = '#ff6600';
            } else {
                wpmElement.style.color = '#ff4444';
            }
        }
        
        console.log(`Final Frenzy Performance: ${finalWPM} WPM, ${finalAccuracy}% accuracy, ${this.frenzyMode.perfectWords}/${this.frenzyMode.totalWords} perfect words`);
    }

    calculateFrenzyPerformanceBonus() {
        const baseBonus = this.frenzyMode.sentenceWords.length * 100;
        const finalWPM = this.frenzyMode.currentWPM;
        const finalAccuracy = this.frenzyMode.averageAccuracy;
        
        // WPM-based multiplier (0.5x to 3.0x)
        let wpmMultiplier = 1.0;
        if (finalWPM >= 80) wpmMultiplier = 3.0;
        else if (finalWPM >= 60) wpmMultiplier = 2.5;
        else if (finalWPM >= 40) wpmMultiplier = 2.0;
        else if (finalWPM >= 25) wpmMultiplier = 1.5;
        else if (finalWPM >= 15) wpmMultiplier = 1.0;
        else wpmMultiplier = 0.5;
        
        // Accuracy-based multiplier (0.3x to 2.5x)
        let accuracyMultiplier = 1.0;
        if (finalAccuracy >= 0.95) accuracyMultiplier = 2.5;
        else if (finalAccuracy >= 0.90) accuracyMultiplier = 2.0;
        else if (finalAccuracy >= 0.80) accuracyMultiplier = 1.5;
        else if (finalAccuracy >= 0.70) accuracyMultiplier = 1.0;
        else if (finalAccuracy >= 0.50) accuracyMultiplier = 0.7;
        else accuracyMultiplier = 0.3;
        
        // Perfect words bonus (extra 20% for each perfect word)
        const perfectWordBonus = this.frenzyMode.perfectWords * 0.2;
        
        // Combined performance multiplier
        const performanceMultiplier = (wpmMultiplier + accuracyMultiplier) / 2;
        const totalMultiplier = performanceMultiplier * (1 + perfectWordBonus);
        
        const finalBonus = Math.round(baseBonus * totalMultiplier);
        
        console.log(`Frenzy Performance Bonus Calculation:`);
        console.log(`  Base: ${baseBonus}, WPM: ${finalWPM} (${wpmMultiplier}x), Accuracy: ${Math.round(finalAccuracy*100)}% (${accuracyMultiplier}x)`);
        console.log(`  Perfect words: ${this.frenzyMode.perfectWords} (+${Math.round(perfectWordBonus*100)}%), Final bonus: ${finalBonus}`);
        
        return finalBonus;
    }

    displayTimeoutFrenzyMetrics() {
        // Calculate final metrics for timeout display
        const finalWPM = this.frenzyMode.currentWPM;
        const finalAccuracy = Math.round(this.frenzyMode.averageAccuracy * 100);
        const wordsCompleted = this.frenzyMode.totalWords;
        const totalWords = this.frenzyMode.sentenceWords.length;
        
        // Update the timeout overlay elements
        const wpmElement = document.getElementById('timeout-frenzy-wpm');
        const accuracyElement = document.getElementById('timeout-frenzy-accuracy');
        const wordsElement = document.getElementById('timeout-words-completed');
        
        if (wpmElement) wpmElement.textContent = finalWPM.toString();
        if (accuracyElement) accuracyElement.textContent = `${finalAccuracy}%`;
        if (wordsElement) wordsElement.textContent = `${wordsCompleted}/${totalWords}`;
        
        // Apply color coding based on performance
        if (accuracyElement) {
            if (finalAccuracy >= 90) {
                accuracyElement.style.color = '#00ff41';
            } else if (finalAccuracy >= 80) {
                accuracyElement.style.color = '#ffaa00';
            } else if (finalAccuracy >= 70) {
                accuracyElement.style.color = '#ff6600';
            } else {
                accuracyElement.style.color = '#ff4444';
            }
        }
        
        if (wpmElement) {
            if (finalWPM >= 60) {
                wpmElement.style.color = '#00ff41';
            } else if (finalWPM >= 40) {
                wpmElement.style.color = '#ffaa00';
            } else if (finalWPM >= 20) {
                wpmElement.style.color = '#ff6600';
            } else {
                wpmElement.style.color = '#ff4444';
            }
        }
        
        console.log(`Timeout Frenzy Performance: ${finalWPM} WPM, ${finalAccuracy}% accuracy, ${wordsCompleted}/${totalWords} words completed`);
    }

    initializeFrenzyUI() {
        // Show the enhanced UI container
        document.getElementById('frenzy-ui-container').classList.remove('hidden');
        
        // Initialize progress tracking
        this.updateFrenzyProgress();
        
        // Initialize current word display
        this.updateFrenzyCurrentWordDisplay();
    }
    
    updateFrenzyCurrentWordDisplay() {
        if (!this.frenzyMode.active) return;
        
        // Throttle updates using requestAnimationFrame
        if (this.frenzyUpdatePending) return;
        this.frenzyUpdatePending = true;
        
        requestAnimationFrame(() => {
            this.frenzyUpdatePending = false;
            this.performFrenzyWordUpdate();
        });
    }

    performFrenzyWordUpdate() {
        // Update massive performance display instead of word/input display
        this.updateMassivePerformanceDisplay();
    }
    
    updateMassivePerformanceDisplay() {
        const wpmElement = document.getElementById('massive-wpm-value');
        const accuracyElement = document.getElementById('massive-accuracy-value');
        
        if (wpmElement && accuracyElement) {
            // Calculate real-time WPM and accuracy
            const currentWPM = this.frenzyMode.currentWPM || 0;
            const currentAccuracy = Math.round(this.frenzyMode.averageAccuracy * 100) || 100;
            
            wpmElement.textContent = currentWPM.toString();
            accuracyElement.textContent = `${currentAccuracy}%`;
        }
    }

    updateWordLettersOptimized(currentWord, currentInput) {
        const wordLettersContainer = document.querySelector('.word-letters');
        
        // Ensure we have the right number of letter elements
        while (wordLettersContainer.children.length < currentWord.length) {
            const letterSpan = document.createElement('span');
            letterSpan.className = 'letter-span';
            letterSpan.style.willChange = 'transform, opacity';
            wordLettersContainer.appendChild(letterSpan);
        }
        
        // Remove excess elements
        while (wordLettersContainer.children.length > currentWord.length) {
            wordLettersContainer.removeChild(wordLettersContainer.lastChild);
        }
        
        // Update existing elements efficiently
        for (let i = 0; i < currentWord.length; i++) {
            const letterSpan = wordLettersContainer.children[i];
            
            // Only update text if changed
            if (letterSpan.textContent !== currentWord[i]) {
                letterSpan.textContent = currentWord[i];
            }
            
            // Determine new state
            let newState;
            if (i < currentInput.length) {
                newState = currentInput[i].toLowerCase() === currentWord[i].toLowerCase() ? 'correct' : 'incorrect';
            } else if (i === currentInput.length) {
                newState = 'current';
            } else {
                newState = 'pending';
            }
            
            // Only update classes if state changed
            const currentState = letterSpan.dataset.state;
            if (currentState !== newState) {
                letterSpan.className = 'letter-span';
                letterSpan.classList.add(newState);
                letterSpan.dataset.state = newState;
            }
        }
    }

    updateInputLettersOptimized(currentInput, currentWord) {
        const inputLettersContainer = document.querySelector('.input-letters');
        
        // Ensure we have the right number of input letter elements
        while (inputLettersContainer.children.length < currentInput.length) {
            const letterSpan = document.createElement('span');
            letterSpan.className = 'input-letter-span';
            letterSpan.style.willChange = 'transform, opacity';
            inputLettersContainer.appendChild(letterSpan);
        }
        
        // Remove excess elements
        while (inputLettersContainer.children.length > currentInput.length) {
            inputLettersContainer.removeChild(inputLettersContainer.lastChild);
        }
        
        // Update existing elements efficiently
        for (let i = 0; i < currentInput.length; i++) {
            const letterSpan = inputLettersContainer.children[i];
            
            // Only update text if changed
            if (letterSpan.textContent !== currentInput[i]) {
                letterSpan.textContent = currentInput[i];
            }
            
            // Determine new state
            let newState;
            if (i < currentWord.length) {
                newState = currentInput[i].toLowerCase() === currentWord[i].toLowerCase() ? 'correct' : 'incorrect';
            } else {
                newState = 'extra';
            }
            
            // Only update classes if state changed
            const currentState = letterSpan.dataset.state;
            if (currentState !== newState) {
                letterSpan.className = 'input-letter-span';
                letterSpan.classList.add(newState);
                letterSpan.dataset.state = newState;
            }
        }
    }
    
    updateFrenzyProgress() {
        if (!this.frenzyMode.active) return;
        
        const wordCounter = document.getElementById('frenzy-word-counter');
        const timer = document.getElementById('frenzy-timer');
        const progressFill = document.getElementById('frenzy-progress-fill');
        
        // Update word counter (fix 18/17 bug)
        const totalWords = this.frenzyMode.sentenceWords.length;
        const currentWordNum = Math.min(this.frenzyMode.currentWordIndex + 1, totalWords);
        
        if (this.frenzyMode.currentWordIndex >= totalWords) {
            wordCounter.textContent = `Complete! ${totalWords} of ${totalWords}`;
        } else {
            wordCounter.textContent = `Word ${currentWordNum} of ${totalWords}`;
        }
        
        // Update duration-based timer (accounting for penalties)
        if (this.frenzyMode.startTime) {
            const elapsed = Date.now() - this.frenzyMode.startTime;

            // Calculate natural time remaining based on elapsed time
            const naturalTimeRemaining = Math.max(0, this.frenzyMode.duration - elapsed);

            // Use the minimum of penalty-adjusted time and natural time
            // This ensures the timer always counts down consistently
            this.frenzyMode.timeRemaining = Math.min(this.frenzyMode.timeRemaining, naturalTimeRemaining);

            const secondsRemaining = Math.ceil(this.frenzyMode.timeRemaining / 1000);
            timer.textContent = `⏱ ${secondsRemaining}s`;
            
            // Add urgency styling when time is low
            if (secondsRemaining <= 10) {
                timer.classList.add('urgent-timer');
            } else {
                timer.classList.remove('urgent-timer');
            }
            
            // End frenzy mode if time runs out
            if (this.frenzyMode.timeRemaining <= 0) {
                this.endFrenzyModeTimeOut();
                return;
            }
        }
        
        // Update real-time WPM and accuracy display
        this.updateFrenzyMetricsDisplay();
        
        // Check if frenzy is complete by word completion (not just in completeFrenzyWord)
        if (this.frenzyMode.currentWordIndex >= this.frenzyMode.sentenceWords.length) {
            setTimeout(() => this.completeFrenzyMode(), 500);
            return;
        }
        
        // Update progress bar
        const progress = (this.frenzyMode.currentWordIndex / totalWords) * 100;
        progressFill.style.width = `${progress}%`;
    }
    
    createSnakeContainer() {
        const snakeContainer = document.getElementById('snake-container');
        snakeContainer.innerHTML = ''; // Clear existing content
        
        // Double-check container is empty to prevent duplicates
        while (snakeContainer.firstChild) {
            snakeContainer.removeChild(snakeContainer.firstChild);
        }
        
        this.frenzyMode.sentenceWords.forEach((word, index) => {
            const wordElement = document.createElement('div');
            wordElement.className = 'snake-word';

            // Length-based styling will be handled by width calculation below

            // Pre-create letter spans for consistent spacing from the start
            for (let i = 0; i < word.length; i++) {
                const letterSpan = document.createElement('span');
                letterSpan.className = 'snake-letter snake-pending';
                letterSpan.textContent = word[i];
                letterSpan.style.willChange = 'transform, opacity';
                wordElement.appendChild(letterSpan);
            }

            // Calculate the exact width needed by measuring actual content
            // Temporarily add to container to measure, then set fixed width
            snakeContainer.appendChild(wordElement);

            // Get the natural width the content wants to be
            const naturalWidth = wordElement.scrollWidth;
            const computedStyle = getComputedStyle(wordElement);
            const padding = parseInt(computedStyle.paddingLeft) + parseInt(computedStyle.paddingRight);
            const border = parseInt(computedStyle.borderLeftWidth) + parseInt(computedStyle.borderRightWidth);

            // Add some extra space for safety (10px buffer)
            const requiredWidth = Math.max(80, naturalWidth + padding + border + 10);

            // Set fixed width to prevent any truncation
            wordElement.style.width = `${requiredWidth}px`;
            wordElement.style.flexShrink = '0';

            // Remove from container temporarily (we'll re-add it below)
            snakeContainer.removeChild(wordElement);

            // Add state classes
            if (index === this.frenzyMode.currentWordIndex) {
                wordElement.classList.add('current');
            } else if (index < this.frenzyMode.currentWordIndex) {
                wordElement.classList.add('completed');
            } else {
                wordElement.classList.add('pending');
            }
            
            snakeContainer.appendChild(wordElement);
        });
        
        this.frenzyMode.snakeContainer = snakeContainer;
    }
    
    updateSnakeContainer() {
        if (!this.frenzyMode.active || !this.frenzyMode.snakeContainer) return;
        
        // Prevent multiple simultaneous updates
        if (this.snakeUpdatePending) return;
        this.snakeUpdatePending = true;
        
        requestAnimationFrame(() => {
            this.snakeUpdatePending = false;
            
            const wordElements = this.frenzyMode.snakeContainer.querySelectorAll('.snake-word');
            
            // Verify we have the right number of elements
            if (wordElements.length !== this.frenzyMode.sentenceWords.length) {
                console.warn('Snake container element count mismatch, recreating...');
                this.createSnakeContainer();
                return;
            }
            
            wordElements.forEach((element, index) => {
                // Remove all state classes
                element.classList.remove('current', 'completed', 'pending');
                
                // Add appropriate state class
                if (index === this.frenzyMode.currentWordIndex) {
                    element.classList.add('current');
                } else if (index < this.frenzyMode.currentWordIndex) {
                    element.classList.add('completed');
                } else {
                    element.classList.add('pending');
                }
            });
        });
    }
    
    exitFrenzyMode() {
        this.frenzyMode.active = false;
        
        // Hide all frenzy-related overlays
        document.getElementById('frenzy-mode-overlay').classList.add('hidden');
        document.getElementById('frenzy-complete-overlay').classList.add('hidden');
        document.getElementById('frenzy-timeout-overlay').classList.add('hidden');
        
        // Restore announcement display for next time
        const announcement = document.querySelector('.frenzy-announcement');
        announcement.style.display = 'block';
        
        // Reset countdown display
        const countdownElement = document.getElementById('frenzy-countdown');
        countdownElement.textContent = '3';
        
        // Hide snake container
        const snakeContainer = document.getElementById('snake-container');
        snakeContainer.style.display = 'none';
        
        // Hide enhanced frenzy UI
        document.getElementById('frenzy-ui-container').classList.add('hidden');
        
        // Show normal word display
        document.getElementById('word-display').style.display = 'flex';
        
        // Restore fever meter
        const feverDisplay = document.getElementById('fever-display-center');
        if (feverDisplay) {
            feverDisplay.classList.remove('hidden');
        }
        
        // Clear any residual styling from word elements and restore opacity
        const branch1 = document.getElementById('branch-1');
        const branch2 = document.getElementById('branch-2');
        if (branch1) {
            branch1.classList.remove('typing-correct', 'typing-error');
            branch1.style.opacity = '1';
            branch1.style.transform = 'scale(1)';
            branch1.style.borderColor = '';
        }
        if (branch2) {
            branch2.classList.remove('typing-correct', 'typing-error');
            branch2.style.opacity = '1';
            branch2.style.transform = 'scale(1)';
            branch2.style.borderColor = '';
        }
        
        // Temporarily pause danger wall to give player time to see new words
        this.background.scrollSpeed = 0;
        const wordInput = this.domElements.word_input;
        wordInput.placeholder = 'Type the highlighted word...';
        wordInput.value = '';
        this.typing.currentInput = '';
        
        // Reset active branch to ensure valid state
        this.activeBranch = 1;
        
        // Ensure player is in safe position after frenzy mode
        this.player.position = Math.max(this.player.position, 0.7); // Ensure safe position
        this.player.speed = 0; // Reset movement
        
        // Reset frenzy mode state completely first
        this.frenzyMode.countdownActive = false;
        this.frenzyMode.currentWordIndex = 0;
        this.frenzyMode.completedWords = [];
        this.frenzyMode.currentSentence = '';
        this.frenzyMode.sentenceWords = [];
        this.frenzyMode.duration = 30000; // Reset to default
        this.frenzyMode.startTime = null;
        
        // Generate new word pair immediately with fresh words
        WordManager.generateWordPair(this.scoring.score);
        
        // Force immediate UI update to show new words
        this.updateWordDisplay();
        this.updateUI();
        
        // Debug logging to verify word pair state
        console.log('Exit frenzy - New words generated:', WordManager.currentPair);
        console.log('Exit frenzy - activeBranch:', this.activeBranch);
        
        // Double-check word pairs are valid and visible
        if (!WordManager.currentPair || !WordManager.currentPair.branch1 || !WordManager.currentPair.branch2) {
            console.error('Invalid word pair after frenzy exit, regenerating...');
            WordManager.generateWordPair(this.scoring.score);
            this.updateWordDisplay();
            this.updateUI();
        }
        
        // Clean up any preview styling and restore normal input
        this.cleanupFrenzyPreview();
        
        // Clean up performance optimizations
        this.cleanupAnimations();
        this.resumeNonEssentialAnimations();
        
        // Resume danger wall movement after brief pause to let player see new words
        setTimeout(() => {
            this.background.scrollSpeed = this.background.baseSpeed;
            console.log('Danger wall resumed after frenzy mode exit');
        }, 1000); // 1 second pause
        
        // Clear and focus input to resume normal typing
        if (wordInput) {
            wordInput.value = '';
            wordInput.placeholder = 'Type the highlighted word...'; // Restore original placeholder
            this.typing.currentInput = '';
            // Small delay to ensure DOM is updated
            setTimeout(() => {
                wordInput.focus();
            }, 100);
        }
        
        // Force UI update to ensure everything is properly displayed
        this.updateUI();
        
        console.log('Frenzy Mode Complete!');
        console.log('Game state:', this.gameState);
        console.log('Player position:', this.player.position);
        console.log('Background scroll speed:', this.background.scrollSpeed);
    }
    
    extendFrenzyTimer(bonusMs) {
        if (!this.frenzyMode.active) return;
        
        this.frenzyMode.duration = Math.min(
            this.frenzyMode.maxDuration, 
            this.frenzyMode.duration + bonusMs
        );
        
        // Create visual feedback for time bonus
        this.showTimerBonus(`+${bonusMs / 1000}s`);
    }
    
    applyTypoPenalty() {
        if (!this.frenzyMode.active) return;
        
        // Prevent duplicate penalties for same typo
        const currentTime = Date.now();
        if (currentTime - this.frenzyMode.lastTypoTime < 500) return; // 500ms cooldown
        this.frenzyMode.lastTypoTime = currentTime;
        
        this.frenzyMode.duration = Math.max(
            this.frenzyMode.minDuration,
            this.frenzyMode.duration - this.frenzyMode.typoePenalty
        );
        
        // Create visual feedback for time penalty
        this.showTimerPenalty(`-${this.frenzyMode.typoePenalty / 1000}s`);
    }
    
    endFrenzyModeTimeOut() {
        console.log('Frenzy Mode: Time Out!');
        
        // Finalize frenzy tracking for timeout
        this.frenzyMode.frenzyEndTime = Date.now();
        
        // Update timeout performance metrics
        this.displayTimeoutFrenzyMetrics();
        
        // Show timeout message briefly
        this.showTimeoutMessage();
        
        // Exit frenzy mode after short delay
        setTimeout(() => {
            this.exitFrenzyMode();
        }, 2000);
    }
    
    showTimerBonus(text) {
        const feedback = document.getElementById('timer-feedback');
        feedback.textContent = text;
        feedback.className = 'timer-feedback bonus show';
        
        setTimeout(() => {
            feedback.classList.remove('show');
        }, 1500);
    }
    
    showTimerPenalty(text) {
        const feedback = document.getElementById('timer-feedback');
        feedback.textContent = text;
        feedback.className = 'timer-feedback penalty show';
        
        setTimeout(() => {
            feedback.classList.remove('show');
        }, 1500);
    }
    
    showTimeoutMessage() {
        const timeoutOverlay = document.getElementById('frenzy-timeout-overlay');
        timeoutOverlay.classList.remove('hidden');
        
        setTimeout(() => {
            timeoutOverlay.classList.add('hidden');
        }, 2000);
    }
    
    switchBranch() {
        if (this.gameState !== 'playing' || this.frenzyMode.active) return;
        
        this.activeBranch = this.activeBranch === 1 ? 2 : 1;
        this.updateWordDisplay();
        
        if (this.domElements.word_input) {
            this.domElements.word_input.value = '';
        }
        this.typing.currentInput = '';
    }
    
    handleInput(e) {
        if (this.gameState !== 'playing') return;
        
        // Enhanced input validation
        if (!e || !e.target || typeof e.target.value !== 'string') return;
        
        const rawInput = e.target.value;
        
        if (this.frenzyMode.active) {
            // In frenzy mode, allow backspace and more natural editing
            const frenzyInput = rawInput.toLowerCase().substring(0, 50); // Limit length but allow backspace
            this.typing.currentInput = frenzyInput;
            this.handleFrenzyInput(frenzyInput);
        } else {
            // Normal mode with character filtering
            const input = rawInput.trim().toLowerCase();
            const sanitizedInput = input.replace(/[^\w\s'-]/g, '').substring(0, 50);
            this.typing.currentInput = sanitizedInput;
            
            // Ignore empty input (whitespace only)
            if (sanitizedInput === '') {
                this.updateWordDisplay();
                return;
            }
            
            this.handleNormalInput(sanitizedInput);
        }
        
        this.updateWPM();
    }
    
    handleNormalInput(input) {
        const targetWord = this.activeBranch === 1 ? 
            WordManager.currentPair.branch1 : 
            WordManager.currentPair.branch2;
        
        const match = WordManager.getPartialMatch(input, targetWord);
        
        this.updateWordVisuals(input, targetWord);
        
        if (match.isComplete) {
            this.completeWord();
        } else {
            this.updatePlayerSpeed(match);
        }
    }
    
    handleFrenzyInput(input) {
        if (this.frenzyMode.currentWordIndex >= this.frenzyMode.sentenceWords.length) {
            return; // Frenzy already complete
        }
        
        const targetWord = this.frenzyMode.sentenceWords[this.frenzyMode.currentWordIndex];
        const match = WordManager.getPartialMatch(input, targetWord);
        
        // Update enhanced frenzy UI with real-time feedback
        this.updateFrenzyCurrentWordDisplay();
        this.updateFrenzyProgress();
        
        // Visual feedback for current snake word (even for empty input from backspace)
        this.updateSnakeWordVisuals(input, targetWord);
        
        // Update backspace hint visibility based on errors
        this.updateBackspaceHint(match);
        
        // Apply time penalty for errors (with debounce to prevent rapid penalties)
        if (match && match.hasError && this.frenzyMode.startTime) {
            const currentTime = Date.now();
            const timeSinceLastPenalty = currentTime - this.frenzyMode.lastTypoTime;
            
            // Only apply penalty if it's been at least 500ms since last penalty
            if (timeSinceLastPenalty > 500) {
                this.frenzyMode.timeRemaining = Math.max(0, this.frenzyMode.timeRemaining - this.frenzyMode.typoePenalty);
                this.frenzyMode.lastTypoTime = currentTime;
                
                // Show visual feedback for time penalty
                this.showTimePenaltyFeedback();
            }
        }
        
        // Check if this is the final word and if it's completed perfectly
        const isLastWord = this.frenzyMode.currentWordIndex === this.frenzyMode.sentenceWords.length - 1;
        
        if (match.isComplete) {
            if (isLastWord) {
                // Auto-complete frenzy mode on perfect final word
                this.handleFrenzySpaceAdvancement();
                return;
            }
            // For non-final words, still require space bar (natural sentence flow)
        }
        
        // Still provide some movement feedback in frenzy mode based on accuracy
        const accuracy = this.calculateWordAccuracy(input, targetWord);
        this.player.speed = accuracy > 0.7 ? 0.03 : (accuracy > 0.3 ? 0.01 : -0.01);
    }
    
    updateSnakeWordVisuals(input, targetWord) {
        if (!this.frenzyMode.snakeContainer) return;
        
        // Throttle snake updates using requestAnimationFrame
        if (this.snakeUpdatePending) return;
        this.snakeUpdatePending = true;
        
        requestAnimationFrame(() => {
            this.snakeUpdatePending = false;
            this.performSnakeWordUpdate(input, targetWord);
        });
    }

    performSnakeWordUpdate(input, targetWord) {
        const currentWordElement = this.frenzyMode.snakeContainer.children[this.frenzyMode.currentWordIndex];
        if (!currentWordElement) return;
        
        // Efficiently update current word highlighting
        if (!currentWordElement.classList.contains('current-word')) {
            // Remove current-word class from all other words (batch operation)
            const currentWords = this.frenzyMode.snakeContainer.querySelectorAll('.current-word');
            for (const elem of currentWords) {
                elem.classList.remove('current-word');
            }
            currentWordElement.classList.add('current-word');
        }
        
        // Update letters with virtual DOM diffing
        this.updateSnakeLettersOptimized(currentWordElement, targetWord, input);
    }

    updateSnakeLettersOptimized(wordElement, targetWord, input) {
        // Letter spans are already created in createSnakeContainer, just update their states
        const letterSpans = wordElement.children;
        
        // Verify we have the expected number of letters
        if (letterSpans.length !== targetWord.length) {
            console.warn(`Letter count mismatch: expected ${targetWord.length}, got ${letterSpans.length}`);
            return;
        }
        
        // Update existing elements efficiently
        for (let i = 0; i < targetWord.length; i++) {
            const letterSpan = wordElement.children[i];
            
            // Only update text if changed
            if (letterSpan.textContent !== targetWord[i]) {
                letterSpan.textContent = targetWord[i];
            }
            
            // Determine new state
            let newState;
            if (i < input.length) {
                newState = input[i].toLowerCase() === targetWord[i].toLowerCase() ? 'snake-correct' : 'snake-incorrect';
            } else if (i === input.length && input.length < targetWord.length) {
                // Only show current position if we haven't finished the word yet
                newState = 'snake-current';
            } else {
                newState = 'snake-pending';
            }
            
            // Only update classes if state changed
            const currentState = letterSpan.dataset.snakeState;
            if (currentState !== newState) {
                letterSpan.className = 'snake-letter';
                letterSpan.classList.add(newState);
                letterSpan.dataset.snakeState = newState;
            }
        }
    }

    addAnimationToElement(element, animationName) {
        // Track animated elements for cleanup
        this.animatedElements.add(element);
        element.style.animationName = animationName;
    }

    cleanupAnimations() {
        // Clean up animations when not needed (e.g., when leaving frenzy mode)
        for (const element of this.animatedElements) {
            if (element && element.style) {
                element.style.animationName = 'none';
                element.style.willChange = 'auto';
            }
        }
        this.animatedElements.clear();
    }

    pauseNonEssentialAnimations() {
        // Pause decorative animations during intensive typing
        const decorativeElements = document.querySelectorAll('.fever-glow, .pulse-effect, .background-animation');
        decorativeElements.forEach(el => {
            el.style.animationPlayState = 'paused';
        });
    }

    resumeNonEssentialAnimations() {
        // Resume decorative animations when typing slows down
        const decorativeElements = document.querySelectorAll('.fever-glow, .pulse-effect, .background-animation');
        decorativeElements.forEach(el => {
            el.style.animationPlayState = 'running';
        });
    }
    
    completeFrenzyWord() {
        const currentWord = this.frenzyMode.sentenceWords[this.frenzyMode.currentWordIndex];
        
        // Add time bonus for completing word
        this.extendFrenzyTimer(this.frenzyMode.correctWordBonus);
        
        // Add to completed words
        this.frenzyMode.completedWords.push(currentWord);
        
        // Create explosion effect from the snake word position
        const currentWordElement = this.frenzyMode.snakeContainer.children[this.frenzyMode.currentWordIndex];
        if (currentWordElement) {
            const wordRect = currentWordElement.getBoundingClientRect();
            const canvasRect = this.canvas.getBoundingClientRect();
            const canvasX = (wordRect.left + wordRect.right) / 2 - canvasRect.left;
            const canvasY = (wordRect.top + wordRect.bottom) / 2 - canvasRect.top;
            
            this.particleManager.createThanosSnapExplosion(currentWord, currentWordElement);
        }
        
        // Update snake visual state (word index will be incremented by handleFrenzySpaceAdvancement)
        this.updateSnakeContainer();
        
        // Update enhanced frenzy UI for next word
        this.updateFrenzyCurrentWordDisplay();
        this.updateFrenzyProgress();
        
        // Update scoring with frenzy bonus
        this.scoring.score += (25 + (this.scoring.combo * 5)) * 5; // 5x multiplier in frenzy
        this.scoring.combo += 1;
        this.scoring.wordsCompleted += 1;
        
        // Player movement boost
        this.player.speed = 0.4;
        
        // Clear input
        if (this.domElements.word_input) {
            this.domElements.word_input.value = '';
        }
        this.typing.currentInput = '';
        
        // Check if frenzy is complete
        if (this.frenzyMode.currentWordIndex >= this.frenzyMode.sentenceWords.length) {
            setTimeout(() => this.completeFrenzyMode(), 500);
        }
        
        this.updateUI();
    }
    
    completeFrenzyMode() {
        // Finalize frenzy tracking
        this.frenzyMode.frenzyEndTime = Date.now();
        
        // Calculate combined WPM + Accuracy bonus
        const combinedBonus = this.calculateFrenzyPerformanceBonus();
        this.scoring.score += combinedBonus;
        
        // Update final performance metrics in completion overlay
        this.displayFinalFrenzyMetrics(combinedBonus);
        
        // Create spectacular completion effect
        this.triggerFrenzyCompletionEffect();
        
        setTimeout(() => {
            this.exitFrenzyMode();
        }, 2000);
    }
    
    handleFrenzySpaceAdvancement() {
        if (this.frenzyMode.currentWordIndex >= this.frenzyMode.sentenceWords.length) {
            return; // Already completed
        }
        
        const targetWord = this.frenzyMode.sentenceWords[this.frenzyMode.currentWordIndex];
        const userInput = this.typing.currentInput.trim();
        
        // VALIDATION: Prevent word skipping - require actual input
        if (!userInput || userInput.length === 0) {
            this.showSpaceWarning("Type something first!");
            return;
        }
        
        // Calculate accuracy-based score
        const accuracy = this.calculateWordAccuracy(userInput, targetWord);
        const wordScore = this.scoreFrenzyWord(accuracy, targetWord.length);
        
        // Add the word to completed list with accuracy info
        this.frenzyMode.completedWords.push({
            word: targetWord,
            input: userInput,
            accuracy: accuracy,
            score: wordScore
        });
        
        // Update score
        this.scoring.score += wordScore;
        this.scoring.wordsCompleted += 1;
        
        // Update frenzy performance tracking
        this.updateFrenzyTracking(userInput, targetWord, accuracy);
        
        // Time bonus based on accuracy
        if (accuracy >= 0.8) {
            this.extendFrenzyTimer(this.frenzyMode.correctWordBonus * accuracy);
        } else if (accuracy < 0.6) {
            // Time penalty for poor accuracy
            this.applyTypoPenalty();
        }
        
        // Visual effects for word completion
        this.createFrenzyWordCompletionEffect(targetWord, accuracy);
        
        // Move to next word
        this.frenzyMode.currentWordIndex++;
        
        // Clear input for next word
        if (this.domElements.word_input) {
            this.domElements.word_input.value = '';
        }
        this.typing.currentInput = '';
        
        // Update displays
        this.updateFrenzyCurrentWordDisplay();
        this.updateFrenzyProgress();
        this.updateSnakeContainer();
        
        // Check if frenzy is complete
        if (this.frenzyMode.currentWordIndex >= this.frenzyMode.sentenceWords.length) {
            setTimeout(() => this.completeFrenzyMode(), 500);
        }
        
        this.updateUI();
    }
    
    calculateWordAccuracy(userInput, targetWord) {
        if (!userInput || !targetWord) return 0;
        
        const user = userInput.toLowerCase().trim();
        const target = targetWord.toLowerCase().trim();
        
        // Perfect match
        if (user === target) return 1.0;
        
        // Calculate similarity using longest common subsequence approach
        let correctChars = 0;
        let minLength = Math.min(user.length, target.length);
        
        // Count correct characters in correct positions
        for (let i = 0; i < minLength; i++) {
            if (user[i] === target[i]) {
                correctChars++;
            }
        }
        
        // Penalize length differences
        const lengthPenalty = Math.abs(user.length - target.length) / target.length;
        const positionAccuracy = correctChars / target.length;
        
        return Math.max(0, positionAccuracy - (lengthPenalty * 0.5));
    }
    
    scoreFrenzyWord(accuracy, wordLength) {
        const baseScore = 25 + (wordLength * 2); // Base points per word
        const accuracyMultiplier = Math.max(0.3, accuracy); // Minimum 30% points
        const frenzyMultiplier = 5; // 5x points in frenzy mode
        
        return Math.floor(baseScore * accuracyMultiplier * frenzyMultiplier);
    }
    
    createFrenzyWordCompletionEffect(word, accuracy) {
        // Get color based on accuracy
        let effectColor = '#ff4444'; // Red for poor
        if (accuracy >= 0.9) effectColor = '#00ff41'; // Green for excellent  
        else if (accuracy >= 0.7) effectColor = '#ffaa00'; // Yellow for good
        else if (accuracy >= 0.5) effectColor = '#ff8800'; // Orange for fair
        
        // Create particle effect from current word position
        const currentWordElement = this.frenzyMode.snakeContainer?.children[this.frenzyMode.currentWordIndex];
        if (currentWordElement) {
            // Add accuracy class for visual feedback
            currentWordElement.classList.add('completed');
            currentWordElement.classList.add(`accuracy-${Math.floor(accuracy * 10)}`);
            currentWordElement.style.backgroundColor = effectColor + '20'; // Transparent version
            currentWordElement.style.borderColor = effectColor;
            
            this.particleManager.createThanosSnapExplosion(word, currentWordElement, effectColor);
        }
    }
    
    showSpaceWarning(message) {
        // Create temporary warning overlay
        const warningOverlay = document.createElement('div');
        warningOverlay.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, rgba(255, 68, 68, 0.9), rgba(255, 136, 0, 0.9));
            color: white;
            padding: 20px 30px;
            border-radius: 10px;
            font-size: 18px;
            font-weight: bold;
            text-align: center;
            z-index: 2000;
            pointer-events: none;
            border: 2px solid #ff4444;
            box-shadow: 0 0 20px rgba(255, 68, 68, 0.5);
            animation: warningPulse 0.6s ease-out;
        `;
        warningOverlay.textContent = message;
        
        // Add warning animation if not already defined
        if (!document.querySelector('#warning-styles')) {
            const style = document.createElement('style');
            style.id = 'warning-styles';
            style.textContent = `
                @keyframes warningPulse {
                    0% { 
                        opacity: 0;
                        transform: translate(-50%, -50%) scale(0.8);
                    }
                    30% { 
                        opacity: 1;
                        transform: translate(-50%, -50%) scale(1.1);
                    }
                    100% { 
                        opacity: 0.8;
                        transform: translate(-50%, -50%) scale(1);
                    }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(warningOverlay);
        
        // Shake the input field for additional feedback
        const wordInput = this.domElements.word_input;
        if (wordInput) {
            wordInput.style.animation = 'none';
            setTimeout(() => {
                wordInput.style.animation = 'inputShake 0.5s ease-in-out';
            }, 10);
        }
        
        // Add input shake animation if not already defined
        if (!document.querySelector('#input-shake-styles')) {
            const shakeStyle = document.createElement('style');
            shakeStyle.id = 'input-shake-styles';
            shakeStyle.textContent = `
                @keyframes inputShake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-5px); border-color: #ff4444; }
                    75% { transform: translateX(5px); border-color: #ff4444; }
                }
            `;
            document.head.appendChild(shakeStyle);
        }
        
        // Remove warning after delay
        setTimeout(() => {
            if (warningOverlay.parentNode) {
                warningOverlay.style.opacity = '0';
                warningOverlay.style.transform = 'translate(-50%, -50%) scale(0.8)';
                setTimeout(() => {
                    if (warningOverlay.parentNode) {
                        warningOverlay.parentNode.removeChild(warningOverlay);
                    }
                }, 200);
            }
        }, 1500);
    }
    
    updateBackspaceHint(match) {
        const backspaceHint = document.querySelector('.frenzy-backspace-hint');
        if (!backspaceHint) return;
        
        // Show backspace hint when there are errors or incorrect characters
        if (match && match.hasError) {
            backspaceHint.style.opacity = '1';
            backspaceHint.style.transform = 'scale(1.1)';
            backspaceHint.style.color = '#ff4444';
            backspaceHint.style.textShadow = '0 0 15px #ff4444';
        } else {
            backspaceHint.style.opacity = '0.6';
            backspaceHint.style.transform = 'scale(1)';
            backspaceHint.style.color = '#ffaa00';
            backspaceHint.style.textShadow = '0 0 10px #ffaa00';
        }
    }
    
    showTimePenaltyFeedback() {
        // Create floating text for time penalty
        const penaltyText = document.createElement('div');
        penaltyText.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: #ff4444;
            font-size: 24px;
            font-weight: bold;
            text-shadow: 0 0 10px #ff4444;
            pointer-events: none;
            z-index: 2000;
            animation: timePenaltyFloat 1.5s ease-out forwards;
        `;
        penaltyText.textContent = `-${this.frenzyMode.typoePenalty / 1000}s`;
        
        // Add animation keyframes if not already defined
        if (!document.querySelector('#time-penalty-styles')) {
            const style = document.createElement('style');
            style.id = 'time-penalty-styles';
            style.textContent = `
                @keyframes timePenaltyFloat {
                    0% { 
                        opacity: 1;
                        transform: translate(-50%, -50%) scale(1.2);
                    }
                    100% { 
                        opacity: 0;
                        transform: translate(-50%, -80px) scale(0.8);
                    }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(penaltyText);
        
        // Remove after animation
        setTimeout(() => {
            if (penaltyText.parentNode) {
                penaltyText.parentNode.removeChild(penaltyText);
            }
        }, 1500);
    }
    
    triggerFrenzyCompletionEffect() {
        // Show completion overlay
        const completeOverlay = document.getElementById('frenzy-complete-overlay');
        const bonusScoreElement = document.getElementById('frenzy-bonus-score');
        const frenzyBonus = this.frenzyMode.sentenceWords.length * 100;
        
        bonusScoreElement.textContent = `+${this.formatNumber(frenzyBonus)}`;
        completeOverlay.classList.remove('hidden');
        
        // Massive particle explosion from snake container
        if (this.frenzyMode.snakeContainer) {
            const containerRect = this.frenzyMode.snakeContainer.getBoundingClientRect();
            const canvasRect = this.canvas.getBoundingClientRect();
            const centerX = (containerRect.left + containerRect.right) / 2 - canvasRect.left;
            const centerY = (containerRect.top + containerRect.bottom) / 2 - canvasRect.top;
            
            // Create multiple explosion bursts
            for (let i = 0; i < 5; i++) {
                setTimeout(() => {
                    this.particleManager.createColorfulExplosion(
                        centerX + (Math.random() - 0.5) * 200, 
                        centerY + (Math.random() - 0.5) * 100, 
                        30
                    );
                }, i * 200);
            }
        }
        
        // Screen shake
        this.triggerScreenShake(15, 1000);
        
        // Hide completion overlay after 2 seconds
        setTimeout(() => {
            completeOverlay.classList.add('hidden');
        }, 2000);
        
        console.log('FRENZY MODE COMPLETE! Massive bonus!');
    }
    
    completeWord() {
        // Check if word was completed perfectly (no errors during typing)
        const wasWordPerfect = this.typing.currentInput.length === 0 || !this.hadErrorDuringWord;
        
        // Fever system: Perfect word completion
        if (wasWordPerfect) {
            this.feverSystem.onPerfectWord();
        }
        
        // Fever system: Combo increase
        this.feverSystem.onComboIncrease(this.scoring.combo + 1);
        
        // Fever system: WPM burst check
        this.feverSystem.onWpmBurst(this.typing.wordsPerMinute, this.getAverageWpm());
        
        // Check for power-up activation
        const activeBranchKey = this.activeBranch === 1 ? 'branch1' : 'branch2';
        const powerUp = WordManager.currentPair.powerUps[activeBranchKey];
        
        if (powerUp) {
            this.powerUpSystem.activatePowerUp(powerUp.type, powerUp.rarity);
            
            // Trigger freeze flash effect
            if (powerUp.type === 'freeze') {
                this.triggerFreezeEffect();
            }
        }
        
        // Apply fever and power-up multipliers
        let scoreMultiplier = this.feverSystem.getScoreMultiplier();
        if (this.powerUpSystem.isActive('multiplier')) {
            const multiplierPowerUp = this.powerUpSystem.getPowerUp('multiplier');
            scoreMultiplier *= multiplierPowerUp.multiplier;
            this.powerUpSystem.consumeMultiplierUse();
        }
        
        this.scoring.score += (10 + (this.scoring.combo * 2)) * scoreMultiplier;
        this.scoring.combo += 1;
        this.scoring.wordsCompleted += 1;
        
        // Check for frenzy mode trigger
        this.frenzyMode.wordsSinceFrenzy++;
        if (this.frenzyMode.wordsSinceFrenzy >= this.frenzyMode.frenzyTriggerInterval) {
            // Show immediate visual feedback before frenzy mode starts
            this.showFrenzyModePreview();
            
            // Trigger frenzy mode with minimal delay for smooth transition
            setTimeout(() => {
                this.triggerFrenzyMode();
            }, 200); // Reduced from 800ms to 200ms
            return; // Exit early, don't continue with normal word flow
        }
        
        // Apply speed boost if active
        let speedBoost = 0.3 + (this.scoring.combo * 0.05);
        if (this.powerUpSystem.isActive('speed')) {
            const speedPowerUp = this.powerUpSystem.getPowerUp('speed');
            speedBoost *= speedPowerUp.multiplier;
        }
        this.player.speed = speedBoost;
        
        // Reset error tracking for next word
        this.hadErrorDuringWord = false;
        
        // Progressive difficulty based on WPM and score
        this.updateDifficulty();
        
        // Trigger Thanos snap explosion from the actual word letters
        const wordDisplayElement = this.activeBranch === 1 ? 
            document.getElementById('branch-1') : 
            document.getElementById('branch-2');
        
        const completedWord = this.activeBranch === 1 ? 
            WordManager.currentPair.branch1 : 
            WordManager.currentPair.branch2;
        
        const wordTextContainer = wordDisplayElement.querySelector('.word-text');
        
        // Create Thanos snap explosion from each letter's position
        this.particleManager.createThanosSnapExplosion(completedWord, wordTextContainer);
        
        // Create border disintegration effect
        this.particleManager.createBorderDisintegration(wordDisplayElement);
        
        // Make the word temporarily disappear (Thanos snap effect)
        wordDisplayElement.style.opacity = '0';
        wordDisplayElement.style.transform = 'scale(0.8)';
        wordDisplayElement.style.borderColor = 'rgba(0, 255, 255, 0)'; // Fade border
        
        // Brief delay then show new word with dramatic entrance
        setTimeout(() => {
            WordManager.getNextWordPair(this.scoring.score);
            this.updateWordDisplay();
            
            // Restore and animate new word in
            wordDisplayElement.style.opacity = '1';
            wordDisplayElement.style.transform = 'scale(1.1)';
            wordDisplayElement.style.borderColor = ''; // Restore original border color
            
            // Return to normal scale
            setTimeout(() => {
                wordDisplayElement.style.transform = 'scale(1)';
            }, 150);
        }, 200);
        
        if (this.domElements.word_input) {
            this.domElements.word_input.value = '';
        }
        this.typing.currentInput = '';
        
        this.updateUI();
    }
    
    updatePlayerSpeed(match) {
        if (match.hasError) {
            // Track error for fever system
            this.hadErrorDuringWord = true;
            this.feverSystem.onTypingError();
            
            // Shield power-up protects from errors
            if (this.powerUpSystem.isActive('shield')) {
                this.player.speed = 0.05; // Small forward movement instead
                return; // Don't reset combo
            }
            
            // Laser Focus turns errors into forward movement
            if (this.powerUpSystem.isActive('laserFocus')) {
                this.player.speed = 0.08; // Small forward movement
                return; // Don't reset combo
            }
            
            this.player.speed = -0.04; // Gentler backward movement on error
            this.scoring.combo = 0; // Reset combo on error
        } else {
            // Much more gradual forward movement
            const progress = match.correct / match.total;
            const baseSpeed = 0.05; // Very small base movement for correct letters
            const progressBonus = progress * 0.15; // Modest bonus for word progress
            this.player.speed = baseSpeed + progressBonus;
            
            // Apply speed boost if active
            if (this.powerUpSystem.isActive('speed')) {
                const speedPowerUp = this.powerUpSystem.getPowerUp('speed');
                this.player.speed *= speedPowerUp.multiplier;
            }
        }
    }
    
    getAverageWpm() {
        if (this.averageWpmHistory.length === 0) return this.typing.wordsPerMinute;
        
        const sum = this.averageWpmHistory.reduce((a, b) => a + b, 0);
        return sum / this.averageWpmHistory.length;
    }
    
    updateWPM() {
        const now = Date.now();
        const timeElapsed = (now - this.typing.startTime) / 1000 / 60; // minutes
        
        if (timeElapsed > 0) {
            const wordsTyped = this.scoring.wordsCompleted + (this.typing.currentInput.length / 5);
            this.typing.wordsPerMinute = Math.round(wordsTyped / timeElapsed);
            
            // Update WPM history for fever system
            if (this.typing.wordsPerMinute > 0) {
                this.averageWpmHistory.push(this.typing.wordsPerMinute);
                // Keep only last 10 readings for rolling average
                if (this.averageWpmHistory.length > 10) {
                    this.averageWpmHistory.shift();
                }
            }
            
            if (this.typing.wordsPerMinute > this.scoring.bestWpm) {
                this.scoring.bestWpm = this.typing.wordsPerMinute;
            }
        }
    }
    
    updateWordDisplay() {
        const branch1 = this.domElements.branch_1 || document.getElementById('branch-1');
        const branch2 = this.domElements.branch_2 || document.getElementById('branch-2');
        
        if (!branch1 || !branch2) {
            console.error('Branch elements not found for word display update');
            return;
        }
        
        // Ensure WordManager has valid current pair
        if (!WordManager.currentPair || !WordManager.currentPair.branch1 || !WordManager.currentPair.branch2) {
            console.error('WordManager currentPair is invalid, regenerating...');
            WordManager.generateWordPair(this.scoring.score);
        }
        
        const wordText1 = branch1.querySelector('.word-text');
        const wordText2 = branch2.querySelector('.word-text');
        
        if (wordText1) this.renderWordWithLetters(wordText1, WordManager.currentPair.branch1);
        if (wordText2) this.renderWordWithLetters(wordText2, WordManager.currentPair.branch2);
        
        // Update power-up icons
        this.updatePowerUpIcons(branch1, WordManager.currentPair.powerUps.branch1, 1);
        this.updatePowerUpIcons(branch2, WordManager.currentPair.powerUps.branch2, 2);
        
        branch1.classList.toggle('active', this.activeBranch === 1);
        branch2.classList.toggle('active', this.activeBranch === 2);
    }
    
    updatePowerUpIcons(branchElement, powerUp, branchNumber) {
        const icon = branchElement.querySelector('.power-up-icon');
        
        if (powerUp) {
            icon.className = `power-up-icon visible ${powerUp.type}`;
            icon.textContent = this.getPowerUpSymbol(powerUp.type);
        } else {
            icon.className = 'power-up-icon';
            icon.textContent = '';
        }
    }
    
    getPowerUpSymbol(type) {
        const symbols = {
            speed: '⚡',
            timeWarp: '⏰',
            shield: '🛡',
            multiplier: '💎',
            laserFocus: '🎯',
            freeze: '❄️'
        };
        return symbols[type] || '?';
    }
    
    renderWordWithLetters(container, word) {
        container.innerHTML = '';
        for (let i = 0; i < word.length; i++) {
            const letterSpan = document.createElement('span');
            letterSpan.className = 'letter';
            letterSpan.textContent = word[i];
            container.appendChild(letterSpan);
        }
    }
    
    updateWordVisuals(input, targetWord) {
        const activeContainer = this.activeBranch === 1 ? 
            document.getElementById('branch-1').querySelector('.word-text') :
            document.getElementById('branch-2').querySelector('.word-text');
        
        const letters = activeContainer.querySelectorAll('.letter');
        
        letters.forEach((letter, index) => {
            letter.classList.remove('correct', 'incorrect');
            
            if (index < input.length) {
                if (input[index].toLowerCase() === targetWord[index].toLowerCase()) {
                    letter.classList.add('correct');
                } else {
                    letter.classList.add('incorrect');
                }
            }
        });
    }
    
    updateDifficulty() {
        // Difficulty based on both WPM performance and score progression
        const wpmFactor = Math.min(this.typing.wordsPerMinute / 60, 1); // Normalize to 0-1 range
        const scoreFactor = Math.min(this.scoring.score / 200, 1); // Normalize to 0-1 range
        const difficultyLevel = (wpmFactor + scoreFactor) / 2;
        
        // Update scroll speed based on difficulty
        const speedIncrease = difficultyLevel * (this.background.maxSpeed - this.background.baseSpeed);
        this.background.scrollSpeed = this.background.baseSpeed + speedIncrease;
    }
    
    updateUI() {
        // Update floor display
        if (this.domElements.floor) {
            this.domElements.floor.textContent = this.runSystem.currentFloor;
        }
        
        document.getElementById('score').textContent = this.formatNumber(this.scoring.score);
        document.getElementById('wpm').textContent = this.typing.wordsPerMinute;
        document.getElementById('combo').textContent = this.scoring.combo;
        
        const positionPercent = this.player.position * 100;
        document.getElementById('player-marker').style.left = positionPercent + '%';
        
        this.updateActivePowerUpDisplay();
        this.updateFeverDisplay();
    }
    
    updateFeverDisplay() {
        // Don't update fever display if game hasn't started
        if (this.gameState !== 'playing') {
            return;
        }
        
        const levelElement = document.getElementById('fever-level');
        const multiplierElement = document.getElementById('fever-multiplier');
        const fillElement = document.getElementById('fever-fill');
        const barElement = document.getElementById('fever-bar');
        const overlayElement = document.getElementById('fever-rush-overlay');
        const feverDisplay = document.getElementById('fever-display-center');
        
        const currentLevel = this.feverSystem.getLevel();
        
        // Update fever level and multiplier text
        if (levelElement) levelElement.textContent = this.feverSystem.getLevelName();
        if (multiplierElement) multiplierElement.textContent = `×${this.feverSystem.getScoreMultiplier().toFixed(1)}`;
        
        // Update fever bar
        const heatPercentage = this.feverSystem.getHeatPercentage();
        if (fillElement) fillElement.style.width = `${heatPercentage}%`;
        
        // Update bar class for visual effects
        if (barElement) barElement.className = `fever-bar level-${currentLevel}`;
        
        // Update fever display class for dynamic text styling
        if (feverDisplay) feverDisplay.className = `hud-item fever-level-${currentLevel}`;
        
        // Update fever rush overlay
        if (this.feverSystem.isFeverRushActive() && overlayElement) {
            overlayElement.classList.remove('hidden');
            const timeLeft = Math.ceil(this.feverSystem.getFeverRushTimeLeft() / 1000);
            const timerElement = document.getElementById('fever-rush-timer');
            if (timerElement) timerElement.textContent = `${timeLeft}s`;
        } else if (overlayElement) {
            overlayElement.classList.add('hidden');
        }
    }
    
    updateActivePowerUpDisplay() {
        const container = document.getElementById('active-powerups');
        container.innerHTML = '';
        
        const activePowerUps = this.powerUpSystem.getActivePowerUps();
        
        activePowerUps.forEach(powerUp => {
            const powerUpElement = document.createElement('div');
            powerUpElement.className = `active-powerup ${powerUp.type}`;
            
            const symbol = this.getPowerUpSymbol(powerUp.type);
            const name = this.getPowerUpName(powerUp.type);
            
            let timeDisplay = '';
            if (powerUp.wordsLeft !== null) {
                timeDisplay = `${powerUp.wordsLeft} words`;
            } else {
                const timeRemaining = this.powerUpSystem.getTimeRemaining(powerUp.type);
                timeDisplay = `${Math.ceil(timeRemaining / 1000)}s`;
            }
            
            powerUpElement.innerHTML = `${symbol} ${name}<br><small>${timeDisplay}</small>`;
            container.appendChild(powerUpElement);
        });
    }
    
    getPowerUpName(type) {
        const names = {
            speed: 'Speed Boost',
            timeWarp: 'Time Warp',
            shield: 'Shield',
            multiplier: 'Multiplier',
            laserFocus: 'Laser Focus'
        };
        return names[type] || 'Unknown';
    }
    
    updateGame(deltaTime) {
        if (this.gameState !== 'playing') return;
        
        // Update power-up system
        this.powerUpSystem.updatePowerUps();
        
        // Update fever system (pause during frenzy mode countdown/active)
        if (!this.frenzyMode.countdownActive && !this.frenzyMode.active) {
            const isTyping = this.typing.currentInput.length > 0;
            this.feverSystem.applyDecay(deltaTime, this.player.position, isTyping);
            this.feverSystem.updateFeverRush();
            
            // Fever system: Danger zone typing heat generation
            if (isTyping) {
                this.feverSystem.onDangerZoneTyping(this.player.position, deltaTime);
            }
        } else {
            // During frenzy mode, only update fever rush timer if it's active
            this.feverSystem.updateFeverRush();
        }
        
        // Fever system: Right wall touch detection
        this.feverSystem.onRightWallTouch(this.player.position);
        
        // Update frenzy mode timer display
        if (this.frenzyMode.active && this.frenzyMode.startTime) {
            this.updateFrenzyProgress();
        }
        
        // Apply time warp effect to scroll speed
        let effectiveScrollSpeed = this.background.scrollSpeed;
        if (this.powerUpSystem.isActive('timeWarp')) {
            const timeWarpPowerUp = this.powerUpSystem.getPowerUp('timeWarp');
            effectiveScrollSpeed *= timeWarpPowerUp.multiplier;
        }
        
        // Apply freeze effect - completely stops scrolling
        if (this.powerUpSystem.isActive('freeze')) {
            effectiveScrollSpeed = 0;
        }
        
        this.background.offset += effectiveScrollSpeed * deltaTime * 0.016;
        
        // Player movement calculation: player speed vs background scroll pressure
        // PAUSE movement during frenzy countdown to prevent game over
        if (this.frenzyMode.countdownActive) {
            // During countdown, force player to stay in safe position
            this.player.position = Math.max(this.player.position, 0.85); // Keep in safe zone
            this.player.speed = 0; // No movement during countdown
        } else {
            const scrollPressure = effectiveScrollSpeed * 0.008; // More forgiving scroll pressure
            const netMovement = (this.player.speed - scrollPressure) * deltaTime * 0.016;
            this.player.position += netMovement;
            this.player.position = Math.max(0, Math.min(1, this.player.position));
            
            this.player.speed *= 0.92; // Slower speed decay - more forgiving
        }
        
        // Track safe wall contact (right side at 95%+ position)
        const inSafeZone = this.player.position >= 0.95;
        if (inSafeZone) {
            // Trigger screen shake on first impact
            if (!this.player.wasInSafeZone) {
                this.triggerScreenShake(8, 200); // Medium intensity, short duration
            }
            
            this.player.safeWallContactTime += deltaTime * 0.016;
            // Cap at 3 seconds for maximum intensity
            this.player.safeWallContactTime = Math.min(this.player.safeWallContactTime, 3.0);
        } else {
            this.player.safeWallContactTime = Math.max(0, this.player.safeWallContactTime - deltaTime * 0.032);
        }
        
        this.player.wasInSafeZone = inSafeZone;
        
        // PREVENT game over during frenzy countdown or active frenzy mode
        if (this.player.position <= 0.02 && !this.frenzyMode.countdownActive && !this.frenzyMode.active) {
            this.gameOver();
        }
        
        this.updateScreenShake();
        this.particleManager.update(deltaTime, this.canvas.width, this.canvas.height);
        this.updateUI();
    }
    
    // Reusable screen shake system
    triggerScreenShake(intensity = 5, duration = 300) {
        this.screenShake.active = true;
        this.screenShake.intensity = intensity;
        this.screenShake.duration = duration;
        this.screenShake.startTime = Date.now();
    }
    
    updateScreenShake() {
        if (!this.screenShake.active) {
            this.screenShake.offsetX = 0;
            this.screenShake.offsetY = 0;
            return;
        }
        
        const elapsed = Date.now() - this.screenShake.startTime;
        if (elapsed >= this.screenShake.duration) {
            this.screenShake.active = false;
            this.screenShake.offsetX = 0;
            this.screenShake.offsetY = 0;
            return;
        }
        
        // Decay intensity over time
        const progress = elapsed / this.screenShake.duration;
        const currentIntensity = this.screenShake.intensity * (1 - progress);
        
        // Generate random shake offsets
        this.screenShake.offsetX = (Math.random() - 0.5) * currentIntensity * 2;
        this.screenShake.offsetY = (Math.random() - 0.5) * currentIntensity * 2;
    }
    
    triggerFreezeEffect() {
        const freezeOverlay = document.getElementById('freeze-flash-overlay');
        
        if (freezeOverlay) {
            freezeOverlay.classList.remove('hidden');
            
            // Create ice particle explosion
            this.createIceParticleExplosion();
            
            // Get freeze duration
            const freezePowerUp = this.powerUpSystem.getPowerUp('freeze');
            const duration = freezePowerUp ? freezePowerUp.duration : 5000;
            
            // Hide overlay after freeze duration
            setTimeout(() => {
                freezeOverlay.classList.add('hidden');
                // Clean up any remaining particles
                const particlesContainer = document.querySelector('.ice-particles-container');
                if (particlesContainer) {
                    particlesContainer.innerHTML = '';
                }
            }, duration);
        }
    }
    
    createIceParticleExplosion() {
        const particlesContainer = document.querySelector('.ice-particles-container');
        if (!particlesContainer) return;
        
        // Clear any existing particles
        particlesContainer.innerHTML = '';
        
        const numParticles = 15;
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        
        for (let i = 0; i < numParticles; i++) {
            const particle = document.createElement('div');
            particle.className = 'ice-particle';
            
            // Random explosion direction
            const angle = (Math.PI * 2 * i) / numParticles + (Math.random() - 0.5) * 0.5;
            const velocity = 150 + Math.random() * 200; // pixels per second
            const lifetime = 1.0; // seconds
            
            // Calculate translation distance
            const translateX = Math.cos(angle) * velocity * lifetime;
            const translateY = Math.sin(angle) * velocity * lifetime;
            
            // Set initial position (center)
            particle.style.left = '50%';
            particle.style.top = '50%';
            particle.style.transform = 'translate(-50%, -50%)';
            
            // Add random size variation
            const size = 6 + Math.random() * 8;
            particle.style.width = size + 'px';
            particle.style.height = size + 'px';
            
            // Set CSS custom properties for final translation
            particle.style.setProperty('--offset-x', translateX + 'px');
            particle.style.setProperty('--offset-y', translateY + 'px');
            
            // Add slight delay for more organic explosion
            particle.style.animationDelay = (Math.random() * 0.1) + 's';
            
            particlesContainer.appendChild(particle);
            
            // Remove particle after animation
            setTimeout(() => {
                if (particle.parentNode) {
                    particle.remove();
                }
            }, 1100);
        }
    }
    
    gameOver() {
        // End the current run if one is active
        if (this.isRunActive()) {
            this.endRun('failed');
        } else {
            this.gameState = 'gameOver';
        }
        
        document.getElementById('final-score').textContent = this.formatNumber(this.scoring.score);
        document.getElementById('best-wpm').textContent = this.scoring.bestWpm;
        document.getElementById('words-typed').textContent = this.scoring.wordsCompleted;
        
        document.getElementById('game-over-screen').classList.remove('hidden');
        document.getElementById('fever-display-center').classList.add('hidden');

        // Hide active power-ups display on game over
        const activePowerupsContainer = document.getElementById('active-powerups');
        if (activePowerupsContainer) {
            activePowerupsContainer.classList.add('hidden');
        }
        
        // Hide all power-up overlays
        const feverRushOverlay = document.getElementById('fever-rush-overlay');
        if (feverRushOverlay) feverRushOverlay.classList.add('hidden');
        
        const freezeOverlay = document.getElementById('freeze-flash-overlay');
        if (freezeOverlay) freezeOverlay.classList.add('hidden');
        
        // Hide frenzy mode overlays
        const frenzyOverlay = document.getElementById('frenzy-mode-overlay');
        if (frenzyOverlay) frenzyOverlay.classList.add('hidden');
        
        const frenzyCompleteOverlay = document.getElementById('frenzy-complete-overlay');
        if (frenzyCompleteOverlay) frenzyCompleteOverlay.classList.add('hidden');
        
        // Reset frenzy mode state completely
        this.frenzyMode.active = false;
        this.frenzyMode.countdownActive = false;
        
        // Restore normal word display in case frenzy was active
        document.getElementById('word-display').style.display = 'flex';
        
        // Restore UI elements for next game
        const announcement = document.querySelector('.frenzy-announcement');
        if (announcement) announcement.style.display = 'block';
        
        const snakeContainer = document.getElementById('snake-container');
        if (snakeContainer) snakeContainer.style.display = 'none';
        
        if (this.domElements.word_input) {
            this.domElements.word_input.blur();
        }
    }
    
    render() {
        const { width, height } = this.canvas;
        
        // Apply screen shake if active
        this.ctx.save();
        if (this.screenShake.active) {
            this.ctx.translate(this.screenShake.offsetX, this.screenShake.offsetY);
        }
        
        // Cyberpunk background gradient
        const bgGradient = this.ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, Math.max(width, height)/2);
        bgGradient.addColorStop(0, '#0f0f2a');
        bgGradient.addColorStop(0.5, '#0a0a1a');
        bgGradient.addColorStop(1, '#000000');
        this.ctx.fillStyle = bgGradient;
        this.ctx.fillRect(0, 0, width, height);
        
        this.renderBackground();
        this.renderDangerZone();
        this.renderSafeWallEffect();
        this.renderPlayer();
        
        // Render freeze effects if active
        if (this.powerUpSystem.isActive('freeze')) {
            this.renderFreezeEffects();
        }
        
        // Render frenzy mode effects if active
        if (this.frenzyMode.active) {
            this.renderFrenzyEffects();
        }
        
        // Render particles
        this.particleManager.render(this.ctx);
        
        // Restore canvas transform after screen shake
        this.ctx.restore();
    }
    
    renderBackground() {
        const { width, height } = this.canvas;
        const ctx = this.ctx;
        
        // Cyberpunk grid lines
        const lineSpacing = 50;
        const numLines = Math.ceil(height / lineSpacing) + 1;
        
        ctx.strokeStyle = '#ff00ff';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#ff00ff';
        ctx.shadowBlur = 10;
        
        for (let i = 0; i < numLines; i++) {
            const y = i * lineSpacing - (this.background.offset % lineSpacing);
            const alpha = 0.3 + Math.sin((this.background.offset * 0.01) + (i * 0.5)) * 0.2;
            ctx.globalAlpha = alpha;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }
        
        // Vertical neon lines
        const vertLineSpacing = 80;
        const numVertLines = Math.ceil(width / vertLineSpacing) + 1;
        
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 1;
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 8;
        
        for (let i = 0; i < numVertLines; i++) {
            const x = (i * vertLineSpacing - (this.background.offset * 0.3 % vertLineSpacing));
            const alpha = 0.2 + Math.sin((this.background.offset * 0.008) + (i * 0.3)) * 0.15;
            ctx.globalAlpha = alpha;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }
        
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
    }
    
    renderDangerZone() {
        const { height } = this.canvas;
        const dangerWidth = 120;
        
        // Cyberpunk danger gradient
        const gradient = this.ctx.createLinearGradient(0, 0, dangerWidth, 0);
        gradient.addColorStop(0, 'rgba(255, 0, 128, 0.9)');
        gradient.addColorStop(0.7, 'rgba(255, 0, 128, 0.3)');
        gradient.addColorStop(1, 'rgba(255, 0, 128, 0)');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, dangerWidth, height);
        
        // Pulsing danger wall
        const pulseIntensity = 0.8 + Math.sin(Date.now() * 0.008) * 0.4;
        this.ctx.fillStyle = `rgba(255, 0, 128, ${pulseIntensity})`;
        this.ctx.shadowColor = '#ff0080';
        this.ctx.shadowBlur = 15;
        this.ctx.fillRect(0, 0, 5, height);
        this.ctx.shadowBlur = 0;
    }
    
    renderSafeWallEffect() {
        if (this.gameState !== 'playing' || this.player.safeWallContactTime <= 0) return;
        
        const { width, height } = this.canvas;
        const time = Date.now() * 0.008;
        const intensity = Math.min(this.player.safeWallContactTime, 1);
        
        // Resonating safe wall effect on right side - keep original green
        const wallX = width - 5;
        
        // Multiple wave patterns that get stronger with longer contact
        for (let i = 0; i < 3; i++) {
            const wavePhase = time + i * Math.PI / 1.5;
            const waveIntensity = intensity * (0.3 + 0.7 * Math.sin(wavePhase));
            const waveWidth = 3 + intensity * 8 * Math.sin(wavePhase);
            
            this.ctx.fillStyle = `rgba(0, 255, 100, ${waveIntensity * 0.6})`;
            this.ctx.shadowColor = '#00ff64';
            this.ctx.shadowBlur = 10 + intensity * 20;
            this.ctx.fillRect(wallX - waveWidth, 0, waveWidth + 5, height);
        }
        
        // Energy particles rising from safe wall
        if (intensity > 0.3) {
            const particleCount = Math.floor(intensity * 8);
            for (let i = 0; i < particleCount; i++) {
                const particleY = (height * 0.8 * Math.sin(time * 2 + i)) + height * 0.1;
                const particleX = wallX - Math.sin(time * 3 + i) * 15;
                const particleSize = 2 + intensity * 3;
                
                this.ctx.fillStyle = `rgba(0, 255, 100, ${intensity * 0.8})`;
                this.ctx.shadowBlur = 8;
                this.ctx.beginPath();
                this.ctx.arc(particleX, particleY, particleSize, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }
        
        this.ctx.shadowBlur = 0;
    }
    
    renderPlayer() {
        if (this.gameState !== 'playing') return;
        
        const { width, height } = this.canvas;
        const playerX = this.player.position * width;
        const playerY = height / 2;
        
        // Cyberpunk player orb with pulsing glow
        const time = Date.now() * 0.005;
        let pulseSize = 25 + Math.sin(time) * 5;
        let glowSize = 40 + Math.sin(time * 1.2) * 8;
        
        // Enhanced animation when touching safe wall - much more intense!
        const rawIntensity = this.player.safeWallContactTime / 3.0; // 0-1 over 3 seconds
        const safeWallIntensity = Math.pow(rawIntensity, 0.7); // Exponential scaling for dramatic effect
        if (safeWallIntensity > 0) {
            const resonanceTime = time * (1 + safeWallIntensity * 3);
            const intensePulse = Math.sin(resonanceTime * 4) * 25 * safeWallIntensity;
            const intenseGlow = Math.sin(resonanceTime * 2.5) * 40 * safeWallIntensity;
            
            pulseSize += intensePulse;
            glowSize += intenseGlow;
            
            // Maximum resonance creates screen-shake effect
            if (safeWallIntensity > 0.8) {
                const shakeOffset = Math.sin(resonanceTime * 8) * 3 * (safeWallIntensity - 0.8) * 5;
                glowSize += shakeOffset;
            }
        }
        
        // Ensure glowSize is never negative
        glowSize = Math.max(glowSize, 1);
        pulseSize = Math.max(pulseSize, 1);
        
        // Outer glow with simple color progression
        const outerGradient = this.ctx.createRadialGradient(playerX, playerY, 0, playerX, playerY, glowSize);
        const baseOpacity = 0.6 + safeWallIntensity * 0.4;
        const midOpacity = 0.3 + safeWallIntensity * 0.3;
        
        // Simple color progression: cyan → green → gold
        let centerColor, midColor;
        if (safeWallIntensity < 0.5) {
            // Cyan to green transition
            const green = Math.floor(100 + safeWallIntensity * 310);
            centerColor = `rgba(0, 255, ${green}, ${baseOpacity})`;
            midColor = `rgba(255, 0, 255, ${midOpacity})`;
        } else {
            // Green to gold transition
            const red = Math.floor((safeWallIntensity - 0.5) * 510);
            centerColor = `rgba(${red}, 255, 100, ${baseOpacity})`;
            midColor = `rgba(255, ${Math.floor(200 - safeWallIntensity * 100)}, 255, ${midOpacity})`;
        }
        
        outerGradient.addColorStop(0, centerColor);
        outerGradient.addColorStop(0.5, midColor);
        outerGradient.addColorStop(1, 'rgba(0, 255, 255, 0)');
        
        this.ctx.fillStyle = outerGradient;
        this.ctx.beginPath();
        this.ctx.arc(playerX, playerY, glowSize, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Main orb
        const mainGradient = this.ctx.createRadialGradient(playerX, playerY, 0, playerX, playerY, pulseSize);
        mainGradient.addColorStop(0, '#ffffff');
        mainGradient.addColorStop(0.3, '#00ffff');
        mainGradient.addColorStop(0.7, '#ff00ff');
        mainGradient.addColorStop(1, 'rgba(0, 255, 255, 0)');
        
        this.ctx.fillStyle = mainGradient;
        this.ctx.shadowColor = '#00ffff';
        this.ctx.shadowBlur = 20;
        this.ctx.beginPath();
        this.ctx.arc(playerX, playerY, pulseSize, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Core
        this.ctx.fillStyle = '#ffffff';
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = '#ffffff';
        this.ctx.beginPath();
        this.ctx.arc(playerX, playerY, 6, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.shadowBlur = 0;
    }
    
    renderFreezeEffects() {
        const { width, height } = this.canvas;
        const ctx = this.ctx;
        
        // Cyan tint overlay
        ctx.fillStyle = 'rgba(0, 255, 255, 0.1)';
        ctx.fillRect(0, 0, width, height);
        
        // Frozen border glow effect
        const time = Date.now() * 0.003;
        const glowIntensity = 0.3 + 0.2 * Math.sin(time);
        
        ctx.strokeStyle = `rgba(0, 255, 255, ${glowIntensity})`;
        ctx.lineWidth = 8;
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 30;
        
        ctx.beginPath();
        ctx.rect(10, 10, width - 20, height - 20);
        ctx.stroke();
        
        // Ice crystal particles
        const numParticles = 20;
        for (let i = 0; i < numParticles; i++) {
            const x = (width * 0.2) + (i / numParticles) * (width * 0.6);
            const y = height * 0.1 + Math.sin(time + i * 0.5) * 50;
            const size = 3 + Math.sin(time * 2 + i) * 2;
            
            ctx.fillStyle = `rgba(255, 255, 255, ${0.6 + 0.4 * Math.sin(time + i)})`;
            ctx.shadowColor = '#00ffff';
            ctx.shadowBlur = 10;
            
            ctx.beginPath();
            ctx.moveTo(x, y - size);
            ctx.lineTo(x - size * 0.6, y + size * 0.6);
            ctx.lineTo(x + size * 0.6, y + size * 0.6);
            ctx.closePath();
            ctx.fill();
            
            ctx.beginPath();
            ctx.moveTo(x, y + size);
            ctx.lineTo(x - size * 0.6, y - size * 0.6);
            ctx.lineTo(x + size * 0.6, y - size * 0.6);
            ctx.closePath();
            ctx.fill();
        }
        
        ctx.shadowBlur = 0;
    }
    
    renderFrenzyEffects() {
        const { width, height } = this.canvas;
        const ctx = this.ctx;
        const time = Date.now() * 0.005;
        
        // Enhanced background pulsing during frenzy
        const pulseIntensity = 0.3 + 0.2 * Math.sin(time * 3);
        ctx.fillStyle = `rgba(255, 0, 255, ${pulseIntensity * 0.15})`;
        ctx.fillRect(0, 0, width, height);
        
        // Frenzy border glow
        ctx.strokeStyle = `rgba(255, 255, 0, ${0.6 + 0.4 * Math.sin(time * 2)})`;
        ctx.lineWidth = 8;
        ctx.shadowColor = '#ffff00';
        ctx.shadowBlur = 25;
        
        ctx.beginPath();
        ctx.rect(15, 15, width - 30, height - 30);
        ctx.stroke();
        
        // Energy waves emanating from center
        const centerX = width / 2;
        const centerY = height / 2;
        
        for (let i = 0; i < 3; i++) {
            const waveTime = time * 1.5 + i * Math.PI / 1.5;
            const waveRadius = 150 + i * 100 + Math.sin(waveTime) * 50;
            const waveAlpha = 0.3 + 0.2 * Math.sin(waveTime);
            
            ctx.strokeStyle = `rgba(0, 255, 255, ${waveAlpha})`;
            ctx.lineWidth = 3;
            ctx.shadowColor = '#00ffff';
            ctx.shadowBlur = 15;
            
            ctx.beginPath();
            ctx.arc(centerX, centerY, waveRadius, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        // Lightning-like effects
        if (Math.random() < 0.1) { // 10% chance per frame
            const lightningCount = 3 + Math.floor(Math.random() * 4);
            for (let i = 0; i < lightningCount; i++) {
                this.renderLightningBolt(
                    Math.random() * width,
                    Math.random() * height * 0.2,
                    Math.random() * width,
                    height * 0.8 + Math.random() * height * 0.2
                );
            }
        }
        
        ctx.shadowBlur = 0;
    }
    
    renderLightningBolt(startX, startY, endX, endY) {
        const ctx = this.ctx;
        const segments = 8;
        const jitter = 30;
        
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 20;
        
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        
        for (let i = 1; i <= segments; i++) {
            const progress = i / segments;
            const x = startX + (endX - startX) * progress + (Math.random() - 0.5) * jitter;
            const y = startY + (endY - startY) * progress + (Math.random() - 0.5) * jitter;
            ctx.lineTo(x, y);
        }
        
        ctx.stroke();
    }
    
    startGameLoop() {
        let lastTime = 0;
        
        const gameLoop = (currentTime) => {
            const deltaTime = currentTime - lastTime;
            lastTime = currentTime;
            
            this.updateGame(deltaTime);
            this.render();
            
            this.gameLoopId = requestAnimationFrame(gameLoop);
        };
        
        this.gameLoopId = requestAnimationFrame(gameLoop);
    }
}

window.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded, initializing game...');
    try {
        new TypingGame();
    } catch (error) {
        console.error('Error initializing game:', error);
    }
});