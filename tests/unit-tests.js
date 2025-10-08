/**
 * Unit Tests for Key Rush Game Core Systems
 * Tests individual components in isolation
 */

// Import the test framework
if (typeof testFramework === 'undefined') {
    console.error('Test framework not loaded. Please include test-framework.js first.');
}

const { describe, test, expect, mock, mockTimers, restoreAllMocks } = testFramework;

// Unit Tests for FeverSystem
describe('FeverSystem Tests', () => {
    let feverSystem;

    function setup() {
        feverSystem = new FeverSystem();
    }

    test('FeverSystem initializes with correct default values', () => {
        setup();
        expect(feverSystem.heat).toBe(0);
        expect(feverSystem.level).toBe(0);
        expect(feverSystem.feverRushActive).toBeFalse();
        expect(feverSystem.perfectWordStreak).toBe(0);
    });

    test('addHeat increases heat correctly', () => {
        setup();
        feverSystem.addHeat(25);
        expect(feverSystem.heat).toBe(25);
        expect(feverSystem.level).toBe(1); // Should reach 'Warm' level
    });

    test('heat cannot exceed maximum', () => {
        setup();
        feverSystem.addHeat(150); // More than max
        expect(feverSystem.heat).toBe(100);
    });

    test('fever levels update correctly based on heat', () => {
        setup();

        feverSystem.addHeat(24);
        expect(feverSystem.level).toBe(0); // Still Cool

        feverSystem.addHeat(1);
        expect(feverSystem.level).toBe(1); // Warm at 25

        feverSystem.addHeat(25);
        expect(feverSystem.level).toBe(2); // Hot at 50

        feverSystem.addHeat(25);
        expect(feverSystem.level).toBe(3); // Blazing at 75
    });

    test('fever rush triggers at max heat', () => {
        setup();
        const mockTimers = testFramework.mockTimers();

        feverSystem.addHeat(100);
        expect(feverSystem.feverRushActive).toBeTrue();
        expect(feverSystem.level).toBe(4); // FEVER!

        mockTimers.restore();
    });

    test('fever rush ends after duration', () => {
        setup();
        const mockTimers = testFramework.mockTimers();

        feverSystem.triggerFeverRush();
        expect(feverSystem.feverRushActive).toBeTrue();

        mockTimers.advanceTimersByTime(feverSystem.feverRushDuration + 1000);
        feverSystem.updateFeverRush();

        expect(feverSystem.feverRushActive).toBeFalse();
        expect(feverSystem.heat).toBe(0); // Should cool down completely

        mockTimers.restore();
    });

    test('heat decay works correctly', () => {
        setup();
        feverSystem.addHeat(50);

        // Normal decay while typing
        feverSystem.applyDecay(1000, 0.5, true, false);
        expect(feverSystem.heat).toBeLessThan(50);

        // Error penalty
        const heatBefore = feverSystem.heat;
        feverSystem.applyDecay(0, 0.5, true, true);
        expect(feverSystem.heat).toBeLessThan(heatBefore - 10); // Error penalty
    });

    test('safe zone penalty applies correctly', () => {
        setup();
        feverSystem.addHeat(50);
        const heatBefore = feverSystem.heat;

        // In safe zone (position > 0.7)
        feverSystem.applyDecay(1000, 0.8, true, false);
        const heatAfterSafeZone = feverSystem.heat;

        // Reset and test normal position
        feverSystem.heat = heatBefore;
        feverSystem.applyDecay(1000, 0.5, true, false);
        const heatAfterNormal = feverSystem.heat;

        expect(heatAfterSafeZone).toBeLessThan(heatAfterNormal); // More decay in safe zone
    });

    test('no heat gain during fever rush', () => {
        setup();
        feverSystem.triggerFeverRush();
        const heatBefore = feverSystem.heat;

        feverSystem.addHeat(50);
        expect(feverSystem.heat).toBe(heatBefore); // No change during fever rush
    });

    test('getScoreMultiplier returns correct values', () => {
        setup();

        expect(feverSystem.getScoreMultiplier()).toBe(1); // Cool

        feverSystem.addHeat(25);
        expect(feverSystem.getScoreMultiplier()).toBe(1.2); // Warm

        feverSystem.addHeat(25);
        expect(feverSystem.getScoreMultiplier()).toBe(1.5); // Hot

        feverSystem.addHeat(25);
        expect(feverSystem.getScoreMultiplier()).toBe(2.0); // Blazing

        feverSystem.triggerFeverRush();
        expect(feverSystem.getScoreMultiplier()).toBe(3.0); // FEVER!
    });
});

// Unit Tests for PowerUpSystem
describe('PowerUpSystem Tests', () => {
    let powerUpSystem;

    function setup() {
        powerUpSystem = new PowerUpSystem();
    }

    test('PowerUpSystem initializes correctly', () => {
        setup();
        expect(powerUpSystem.activePowerUps).toHaveLength(0);
        expect(powerUpSystem.effects.speed).toBeDefined();
        expect(powerUpSystem.effects.timeWarp).toBeDefined();
        expect(powerUpSystem.effects.shield).toBeDefined();
        expect(powerUpSystem.effects.multiplier).toBeDefined();
        expect(powerUpSystem.effects.laserFocus).toBeDefined();
        expect(powerUpSystem.effects.freeze).toBeDefined();
    });

    test('activatePowerUp creates power-up correctly', () => {
        setup();
        const mockTimers = testFramework.mockTimers();

        const powerUp = powerUpSystem.activatePowerUp('speed', 'common');

        expect(powerUp.type).toBe('speed');
        expect(powerUp.rarity).toBe('common');
        expect(powerUp.multiplier).toBe(1.5);
        expect(powerUp.duration).toBe(3000);
        expect(powerUpSystem.activePowerUps).toHaveLength(1);

        mockTimers.restore();
    });

    test('rare power-ups have enhanced effects', () => {
        setup();
        const mockTimers = testFramework.mockTimers();

        const rarePowerUp = powerUpSystem.activatePowerUp('speed', 'rare');
        expect(rarePowerUp.multiplier).toBeCloseTo(1.95); // 1.5 * 1.3
        expect(rarePowerUp.duration).toBe(3900); // 3000 * 1.3

        mockTimers.restore();
    });

    test('epic power-ups have maximum enhancement', () => {
        setup();
        const mockTimers = testFramework.mockTimers();

        const epicPowerUp = powerUpSystem.activatePowerUp('speed', 'epic');
        expect(epicPowerUp.multiplier).toBeCloseTo(2.4); // 1.5 * 1.6
        expect(epicPowerUp.duration).toBe(4800); // 3000 * 1.6

        mockTimers.restore();
    });

    test('duplicate power-ups replace existing ones', () => {
        setup();
        const mockTimers = testFramework.mockTimers();

        powerUpSystem.activatePowerUp('speed', 'common');
        powerUpSystem.activatePowerUp('speed', 'rare');

        expect(powerUpSystem.activePowerUps).toHaveLength(1);
        expect(powerUpSystem.activePowerUps[0].rarity).toBe('rare');

        mockTimers.restore();
    });

    test('power-ups expire after duration', () => {
        setup();
        const mockTimers = testFramework.mockTimers();

        powerUpSystem.activatePowerUp('speed', 'common');
        expect(powerUpSystem.isActive('speed')).toBeTrue();

        mockTimers.advanceTimersByTime(3500); // Past duration
        powerUpSystem.updatePowerUps();

        expect(powerUpSystem.isActive('speed')).toBeFalse();
        expect(powerUpSystem.activePowerUps).toHaveLength(0);

        mockTimers.restore();
    });

    test('word-based power-ups work correctly', () => {
        setup();
        const mockTimers = testFramework.mockTimers();

        const multiplierPowerUp = powerUpSystem.activatePowerUp('multiplier', 'common');
        expect(multiplierPowerUp.wordsLeft).toBe(3);

        powerUpSystem.consumeMultiplierUse();
        expect(powerUpSystem.getPowerUp('multiplier').wordsLeft).toBe(2);

        powerUpSystem.updatePowerUps();
        expect(powerUpSystem.isActive('multiplier')).toBeTrue(); // Still has words left

        powerUpSystem.getPowerUp('multiplier').wordsLeft = 0;
        powerUpSystem.updatePowerUps();
        expect(powerUpSystem.isActive('multiplier')).toBeFalse(); // No words left

        mockTimers.restore();
    });

    test('getTimeRemaining works for time-based power-ups', () => {
        setup();
        const mockTimers = testFramework.mockTimers();

        powerUpSystem.activatePowerUp('speed', 'common');
        const remaining = powerUpSystem.getTimeRemaining('speed');
        expect(remaining).toBe(3000);

        mockTimers.advanceTimersByTime(1000);
        const remainingAfter = powerUpSystem.getTimeRemaining('speed');
        expect(remainingAfter).toBe(2000);

        mockTimers.restore();
    });

    test('getTimeRemaining works for word-based power-ups', () => {
        setup();
        const mockTimers = testFramework.mockTimers();

        powerUpSystem.activatePowerUp('multiplier', 'common');
        const remaining = powerUpSystem.getTimeRemaining('multiplier');
        expect(remaining).toBe(3); // Words left

        mockTimers.restore();
    });

    test('reset clears all active power-ups', () => {
        setup();
        const mockTimers = testFramework.mockTimers();

        powerUpSystem.activatePowerUp('speed', 'common');
        powerUpSystem.activatePowerUp('shield', 'rare');

        expect(powerUpSystem.activePowerUps).toHaveLength(2);

        powerUpSystem.reset();
        expect(powerUpSystem.activePowerUps).toHaveLength(0);

        mockTimers.restore();
    });
});

// Unit Tests for WordManager
describe('WordManager Tests', () => {
    test('WordManager has all required power-up word categories', () => {
        expect(WordManager.powerUpWords.speed).toBeDefined();
        expect(WordManager.powerUpWords.timeWarp).toBeDefined();
        expect(WordManager.powerUpWords.shield).toBeDefined();
        expect(WordManager.powerUpWords.multiplier).toBeDefined();
        expect(WordManager.powerUpWords.laserFocus).toBeDefined();
        expect(WordManager.powerUpWords.freeze).toBeDefined();
    });

    test('all power-up categories have all difficulty levels', () => {
        const powerUpTypes = Object.keys(WordManager.powerUpWords);
        const difficulties = ['easy', 'medium', 'hard', 'expert'];

        powerUpTypes.forEach(type => {
            difficulties.forEach(difficulty => {
                expect(WordManager.powerUpWords[type][difficulty]).toBeDefined();
                expect(WordManager.powerUpWords[type][difficulty].length).toBeGreaterThan(0);
            });
        });
    });

    test('all word lists have content', () => {
        const difficulties = ['easy', 'medium', 'hard', 'expert'];

        difficulties.forEach(difficulty => {
            expect(WordManager.wordLists[difficulty]).toBeDefined();
            expect(WordManager.wordLists[difficulty].length).toBeGreaterThan(0);
        });
    });

    test('getBossWords returns valid words', () => {
        const bossWords = WordManager.getBossWords(1);
        expect(bossWords).toBeDefined();
        expect(bossWords.length).toBeGreaterThan(0);

        bossWords.forEach(word => {
            expect(typeof word).toBe('string');
            expect(word.length).toBeGreaterThan(0);
        });
    });

    test('generateWordPair returns valid pair', () => {
        const pair = WordManager.generateWordPair(0, 1);

        expect(pair.word1).toBeDefined();
        expect(pair.word2).toBeDefined();
        expect(typeof pair.word1).toBe('string');
        expect(typeof pair.word2).toBe('string');
        expect(pair.word1).not.toBe(pair.word2); // Should be different
        expect(pair.powerUps).toBeDefined();
    });

    test('power-up words are properly categorized', () => {
        const speedWords = WordManager.powerUpWords.speed.easy;
        expect(speedWords).toContain('fast');
        expect(speedWords).toContain('speed' || speedWords).toContain('run');

        const freezeWords = WordManager.powerUpWords.freeze.easy;
        expect(freezeWords).toContain('freeze');
        expect(freezeWords).toContain('stop' || freezeWords).toContain('ice');
    });

    test('difficulty progression makes sense', () => {
        // Easy words should generally be shorter than expert words
        const easyWords = WordManager.wordLists.easy;
        const expertWords = WordManager.wordLists.expert;

        const avgEasyLength = easyWords.reduce((sum, word) => sum + word.length, 0) / easyWords.length;
        const avgExpertLength = expertWords.reduce((sum, word) => sum + word.length, 0) / expertWords.length;

        expect(avgExpertLength).toBeGreaterThan(avgEasyLength);
    });

    test('frenzy sentences are valid', () => {
        expect(WordManager.frenzySentences).toBeDefined();
        expect(WordManager.frenzySentences.length).toBeGreaterThan(0);

        WordManager.frenzySentences.forEach(sentence => {
            expect(typeof sentence).toBe('string');
            expect(sentence.length).toBeGreaterThan(10);
            expect(sentence.split(' ').length).toBeGreaterThan(3); // At least 4 words
        });
    });
});

// Unit Tests for ParticleManager
describe('ParticleManager Tests', () => {
    let particleManager;
    let mockCanvas;

    function setup() {
        particleManager = new ParticleManager();
        mockCanvas = testFramework.createMockCanvas();
    }

    test('ParticleManager initializes correctly', () => {
        setup();
        expect(particleManager.particles).toHaveLength(0);
        expect(particleManager.confettiColors).toBeDefined();
        expect(particleManager.confettiColors.length).toBeGreaterThan(0);
    });

    test('addParticle creates new particle', () => {
        setup();
        particleManager.addParticle(100, 100, 'explosion');
        expect(particleManager.particles).toHaveLength(1);

        const particle = particleManager.particles[0];
        expect(particle.x).toBe(100);
        expect(particle.y).toBe(100);
        expect(particle.type).toBe('explosion');
    });

    test('particles update over time', () => {
        setup();
        const mockTimers = testFramework.mockTimers();

        particleManager.addParticle(100, 100, 'explosion');
        const originalX = particleManager.particles[0].x;

        particleManager.update(16); // 16ms frame

        // Particle should have moved
        expect(particleManager.particles[0].x).not.toBe(originalX);

        mockTimers.restore();
    });

    test('particles are removed when expired', () => {
        setup();
        const mockTimers = testFramework.mockTimers();

        particleManager.addParticle(100, 100, 'explosion');

        // Set lifetime to 0 to expire immediately
        particleManager.particles[0].lifetime = 0;
        particleManager.update(16);

        expect(particleManager.particles).toHaveLength(0);

        mockTimers.restore();
    });

    test('createConfettiExplosion generates multiple particles', () => {
        setup();
        particleManager.createConfettiExplosion(100, 100, 10);
        expect(particleManager.particles).toHaveLength(10);

        // All particles should have different colors
        const colors = particleManager.particles.map(p => p.color);
        const uniqueColors = new Set(colors);
        expect(uniqueColors.size).toBeGreaterThan(1);
    });

    test('render handles empty particle list', () => {
        setup();
        expect(() => {
            particleManager.render(mockCanvas.getContext('2d'));
        }).not.toThrow();
    });

    test('clear removes all particles', () => {
        setup();
        particleManager.addParticle(100, 100, 'explosion');
        particleManager.addParticle(200, 200, 'confetti');

        expect(particleManager.particles).toHaveLength(2);

        particleManager.clear();
        expect(particleManager.particles).toHaveLength(0);
    });
});

// Add all tests to the framework
testFramework.addTest(() => {
    describe('FeverSystem Tests', () => {
        // Tests are defined inline above
    });
});

console.log('✅ Unit tests loaded successfully');