/**
 * Integration Tests for Key Rush Game
 * Tests how different systems work together
 */

if (typeof testFramework === 'undefined') {
    console.error('Test framework not loaded. Please include test-framework.js first.');
}

const { describe, test, expect, mock, mockTimers, restoreAllMocks } = testFramework;

// Integration Tests for Game Systems
describe('Game System Integration Tests', () => {
    let game;
    let mockCanvas;

    function setupGame() {
        // Create mock DOM elements
        const mockElements = {
            canvas: testFramework.createMockCanvas(),
            startBtn: testFramework.createMockDOMElement('button', { id: 'start-btn' }),
            restartBtn: testFramework.createMockDOMElement('button', { id: 'restart-btn' }),
            wordInput: testFramework.createMockDOMElement('input', { id: 'word-input' }),
            startScreen: testFramework.createMockDOMElement('div', { id: 'start-screen' }),
            gameOverScreen: testFramework.createMockDOMElement('div', { id: 'game-over-screen' }),
            floor: testFramework.createMockDOMElement('span', { id: 'floor' }),
            score: testFramework.createMockDOMElement('span', { id: 'score' }),
            wpm: testFramework.createMockDOMElement('span', { id: 'wpm' }),
            combo: testFramework.createMockDOMElement('span', { id: 'combo' }),
            feverDisplayCenter: testFramework.createMockDOMElement('div', { id: 'fever-display-center' }),
            feverLevel: testFramework.createMockDOMElement('span', { id: 'fever-level' }),
            feverMultiplier: testFramework.createMockDOMElement('span', { id: 'fever-multiplier' }),
            feverFill: testFramework.createMockDOMElement('div', { id: 'fever-fill' }),
            branch1: testFramework.createMockDOMElement('div', { id: 'branch-1' }),
            branch2: testFramework.createMockDOMElement('div', { id: 'branch-2' }),
            activePowerups: testFramework.createMockDOMElement('div', { id: 'active-powerups' }),
            frenzyModeOverlay: testFramework.createMockDOMElement('div', { id: 'frenzy-mode-overlay' }),
            frenzyCountdown: testFramework.createMockDOMElement('span', { id: 'frenzy-countdown' }),
            snakeContainer: testFramework.createMockDOMElement('div', { id: 'snake-container' })
        };

        // Mock document.getElementById
        const originalGetElementById = document.getElementById;
        document.getElementById = (id) => {
            const element = mockElements[id.replace(/-/g, '')] || mockElements[id];
            return element || originalGetElementById.call(document, id);
        };

        // Create game instance
        game = new TypingGame();

        return {
            game,
            mockElements,
            restore: () => {
                document.getElementById = originalGetElementById;
            }
        };
    }

    test('Game initializes with all systems', () => {
        const { game, restore } = setupGame();

        expect(game.feverSystem).toBeDefined();
        expect(game.powerUpSystem).toBeDefined();
        expect(game.particleManager).toBeDefined();
        expect(game.gameState).toBe('start');

        restore();
    });

    test('Fever system integrates with scoring', () => {
        const { game, restore } = setupGame();
        const mockTimers = testFramework.mockTimers();

        // Start game
        game.startNewRun();

        // Add fever heat
        game.feverSystem.addHeat(50); // Hot level
        expect(game.feverSystem.getScoreMultiplier()).toBe(1.5);

        // Complete a word with fever
        const originalScore = game.scoring.score;
        game.completeWord('test', { type: null });

        expect(game.scoring.score).toBeGreaterThan(originalScore);

        mockTimers.restore();
        restore();
    });

    test('Power-ups integrate with gameplay mechanics', () => {
        const { game, restore } = setupGame();
        const mockTimers = testFramework.mockTimers();

        game.startNewRun();

        // Activate speed power-up
        game.powerUpSystem.activatePowerUp('speed', 'common');

        // Check that speed affects player movement
        game.completeWord('test', { type: 'speed' });

        expect(game.powerUpSystem.isActive('speed')).toBeTrue();
        expect(game.player.speed).toBeGreaterThan(0);

        mockTimers.restore();
        restore();
    });

    test('Frenzy mode integration with word system', () => {
        const { game, restore } = setupGame();
        const mockTimers = testFramework.mockTimers();

        game.startNewRun();

        // Trigger frenzy mode
        game.frenzyMode.wordsSinceFrenzy = game.frenzyMode.frenzyTriggerInterval;
        game.completeWord('test', { type: null });

        expect(game.frenzyMode.active || game.frenzyMode.countdownActive).toBeTrue();

        mockTimers.restore();
        restore();
    });

    test('Floor progression affects difficulty', () => {
        const { game, restore } = setupGame();
        const mockTimers = testFramework.mockTimers();

        game.startNewRun();

        const originalFloor = game.runSystem.currentFloor;

        // Complete enough words to advance floor
        for (let i = 0; i < 15; i++) {
            game.completeWord('test', { type: null });
        }

        expect(game.runSystem.currentFloor).toBeGreaterThan(originalFloor);

        mockTimers.restore();
        restore();
    });

    test('Error handling affects multiple systems', () => {
        const { game, restore } = setupGame();
        const mockTimers = testFramework.mockTimers();

        game.startNewRun();

        // Add some fever heat first
        game.feverSystem.addHeat(50);
        const originalHeat = game.feverSystem.heat;
        const originalCombo = game.scoring.combo;

        // Trigger error
        game.handleTypingError();

        // Check that error affects multiple systems
        expect(game.feverSystem.heat).toBeLessThan(originalHeat); // Fever heat reduced
        expect(game.scoring.combo).toBe(0); // Combo reset
        expect(game.player.speed).toBeLessThan(0); // Player moves backward

        mockTimers.restore();
        restore();
    });

    test('Game state transitions work correctly', () => {
        const { game, restore } = setupGame();
        const mockTimers = testFramework.mockTimers();

        expect(game.gameState).toBe('start');

        game.startNewRun();
        expect(game.gameState).toBe('playing');
        expect(game.runSystem.active).toBeTrue();

        game.gameOver();
        expect(game.gameState).toBe('gameOver');
        expect(game.runSystem.active).toBeFalse();

        mockTimers.restore();
        restore();
    });

    test('Performance metrics are tracked correctly', () => {
        const { game, restore } = setupGame();
        const mockTimers = testFramework.mockTimers();

        game.startNewRun();

        // Simulate typing
        game.typing.startTime = Date.now() - 10000; // 10 seconds ago
        game.typing.charactersTyped = 50; // 50 characters

        game.updateWPM();

        expect(game.typing.wordsPerMinute).toBeGreaterThan(0);
        expect(game.scoring.bestWpm).toBeGreaterThan(0);

        mockTimers.restore();
        restore();
    });

    test('Resource cleanup works correctly', () => {
        const { game, restore } = setupGame();
        const mockTimers = testFramework.mockTimers();

        game.startNewRun();

        // Add some power-ups and particles
        game.powerUpSystem.activatePowerUp('speed', 'common');
        game.particleManager.addParticle(100, 100, 'explosion');

        expect(game.powerUpSystem.activePowerUps.length).toBeGreaterThan(0);
        expect(game.particleManager.particles.length).toBeGreaterThan(0);

        // Reset game
        game.resetGame();

        expect(game.powerUpSystem.activePowerUps.length).toBe(0);
        expect(game.particleManager.particles.length).toBe(0);

        mockTimers.restore();
        restore();
    });
});

// Integration Tests for Word System with Power-ups
describe('Word System and Power-up Integration', () => {
    test('Power-up words trigger correct power-ups', () => {
        const { game, restore } = setupGame();
        const mockTimers = testFramework.mockTimers();

        game.startNewRun();

        // Test speed word
        game.completeWord('speed', { type: 'speed' });
        expect(game.powerUpSystem.isActive('speed')).toBeTrue();

        // Test freeze word
        game.completeWord('freeze', { type: 'freeze' });
        expect(game.powerUpSystem.isActive('freeze')).toBeTrue();

        mockTimers.restore();
        restore();
    });

    test('Word difficulty affects scoring', () => {
        const { game, restore } = setupGame();
        const mockTimers = testFramework.mockTimers();

        game.startNewRun();

        const originalScore = game.scoring.score;

        // Complete easy word
        game.completeWord('cat', { type: null });
        const scoreAfterEasy = game.scoring.score;

        // Complete hard word
        game.completeWord('implementation', { type: null });
        const scoreAfterHard = game.scoring.score;

        const easyWordScore = scoreAfterEasy - originalScore;
        const hardWordScore = scoreAfterHard - scoreAfterEasy;

        expect(hardWordScore).toBeGreaterThan(easyWordScore);

        mockTimers.restore();
        restore();
    });

    test('Frenzy mode sentence completion', () => {
        const { game, restore } = setupGame();
        const mockTimers = testFramework.mockTimers();

        game.startNewRun();

        // Manually start frenzy mode
        game.startFrenzyMode({
            sentence: 'The quick brown fox',
            words: ['The', 'quick', 'brown', 'fox']
        });

        expect(game.frenzyMode.active).toBeTrue();
        expect(game.frenzyMode.currentWordIndex).toBe(0);

        // Complete each word
        game.completeFrenzyWord();
        expect(game.frenzyMode.currentWordIndex).toBe(1);

        game.completeFrenzyWord();
        game.completeFrenzyWord();
        game.completeFrenzyWord();

        // Should complete frenzy after last word
        expect(game.frenzyMode.active).toBeFalse();

        mockTimers.restore();
        restore();
    });
});

// Integration Tests for UI and Game Logic
describe('UI and Game Logic Integration', () => {
    test('UI updates reflect game state changes', () => {
        const { game, mockElements, restore } = setupGame();
        const mockTimers = testFramework.mockTimers();

        game.startNewRun();

        // Test score update
        const originalScore = game.scoring.score;
        game.completeWord('test', { type: null });

        game.updateUI();
        expect(game.scoring.score).toBeGreaterThan(originalScore);

        // Test fever display
        game.feverSystem.addHeat(50);
        game.updateUI();

        // UI should reflect fever state
        expect(game.feverSystem.level).toBeGreaterThan(0);

        mockTimers.restore();
        restore();
    });

    test('Input handling integrates with word validation', () => {
        const { game, restore } = setupGame();
        const mockTimers = testFramework.mockTimers();

        game.startNewRun();

        // Set current words
        game.currentWords = { word1: 'test', word2: 'demo' };
        game.activeBranch = 1;

        // Test correct input
        game.typing.currentInput = 'test';
        const result = game.validateCurrentInput();

        expect(result.isComplete).toBeTrue();
        expect(result.isCorrect).toBeTrue();

        // Test incorrect input
        game.typing.currentInput = 'wrong';
        const wrongResult = game.validateCurrentInput();

        expect(wrongResult.isCorrect).toBeFalse();

        mockTimers.restore();
        restore();
    });
});

// Performance Integration Tests
describe('Performance Integration Tests', () => {
    test('Game loop performance under load', () => {
        const { game, restore } = setupGame();

        game.startNewRun();

        // Add many particles and power-ups
        for (let i = 0; i < 100; i++) {
            game.particleManager.addParticle(i, i, 'explosion');
        }

        for (let i = 0; i < 6; i++) {
            const types = ['speed', 'timeWarp', 'shield', 'multiplier', 'laserFocus', 'freeze'];
            game.powerUpSystem.activatePowerUp(types[i], 'common');
        }

        // Measure update performance
        const avgTime = testFramework.benchmark('Game loop with load', () => {
            game.update(16);
        }, 100);

        expect(avgTime).toBeLessThan(16); // Should complete within frame time

        restore();
    });

    test('Memory usage stays stable over time', () => {
        const { game, restore } = setupGame();
        const mockTimers = testFramework.mockTimers();

        game.startNewRun();

        // Simulate extended gameplay
        for (let i = 0; i < 1000; i++) {
            game.completeWord('test', { type: null });

            // Trigger various effects
            if (i % 10 === 0) {
                game.particleManager.addParticle(100, 100, 'explosion');
            }

            if (i % 50 === 0) {
                game.powerUpSystem.activatePowerUp('speed', 'common');
            }

            mockTimers.advanceTimersByTime(100);
            game.update(16);
        }

        // Check that arrays haven't grown excessively
        expect(game.particleManager.particles.length).toBeLessThan(50);
        expect(game.powerUpSystem.activePowerUps.length).toBeLessThan(10);

        mockTimers.restore();
        restore();
    });
});

// Add integration tests to framework
testFramework.addTest(() => {
    // Integration tests are defined inline above
});

console.log('✅ Integration tests loaded successfully');