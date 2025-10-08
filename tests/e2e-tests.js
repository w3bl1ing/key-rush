/**
 * End-to-End Tests for Key Rush Game
 * Tests complete user workflows and game scenarios
 */

if (typeof testFramework === 'undefined') {
    console.error('Test framework not loaded. Please include test-framework.js first.');
}

const { describe, test, expect, mock, mockTimers, restoreAllMocks } = testFramework;

// E2E Test Utilities
class GameSimulator {
    constructor(game) {
        this.game = game;
        this.mockKeyboard = {
            pressKey: (key) => {
                const event = {
                    key: key,
                    preventDefault: () => {},
                    stopPropagation: () => {}
                };
                if (this.game.handleKeyDown) {
                    this.game.handleKeyDown(event);
                }
            },
            typeWord: (word) => {
                this.game.typing.currentInput = '';
                for (let char of word) {
                    this.game.typing.currentInput += char;
                    this.game.handleInput({ target: { value: this.game.typing.currentInput } });
                }
                this.pressKey('Enter');
            },
            typeIncorrectly: (correctWord, incorrectWord) => {
                this.game.typing.currentInput = '';
                for (let char of incorrectWord) {
                    this.game.typing.currentInput += char;
                    this.game.handleInput({ target: { value: this.game.typing.currentInput } });
                }
            }
        };
    }

    simulateCompleteRun() {
        this.game.startNewRun();

        // Simulate playing through multiple floors
        for (let floor = 1; floor <= 5; floor++) {
            this.simulateFloor(floor);
        }

        return {
            finalScore: this.game.scoring.score,
            finalFloor: this.game.runSystem.currentFloor,
            finalWPM: this.game.scoring.bestWpm
        };
    }

    simulateFloor(floorNumber) {
        const wordsPerFloor = 15;

        for (let i = 0; i < wordsPerFloor; i++) {
            const currentWord = this.getCurrentWord();
            if (currentWord) {
                this.mockKeyboard.typeWord(currentWord);
            }

            // Occasionally trigger power-up words
            if (Math.random() < 0.3) {
                this.triggerRandomPowerUp();
            }

            // Simulate time passing
            this.game.update(16);
        }
    }

    getCurrentWord() {
        if (this.game.currentWords) {
            return this.game.activeBranch === 1 ?
                this.game.currentWords.word1 :
                this.game.currentWords.word2;
        }
        return 'test'; // fallback
    }

    triggerRandomPowerUp() {
        const powerUps = ['speed', 'freeze', 'shield', 'multiplier', 'timeWarp', 'laserFocus'];
        const randomPowerUp = powerUps[Math.floor(Math.random() * powerUps.length)];
        this.game.powerUpSystem.activatePowerUp(randomPowerUp, 'common');
    }

    simulateError() {
        const correctWord = this.getCurrentWord();
        this.mockKeyboard.typeIncorrectly(correctWord, 'wrong');
    }

    simulatePerfectTyping(wordCount = 10) {
        const results = {
            wordsTyped: 0,
            errorsCount: 0,
            averageWPM: 0
        };

        const startTime = Date.now();

        for (let i = 0; i < wordCount; i++) {
            const currentWord = this.getCurrentWord();
            this.mockKeyboard.typeWord(currentWord);
            results.wordsTyped++;
            this.game.update(16);
        }

        const endTime = Date.now();
        const timeInMinutes = (endTime - startTime) / 60000;
        results.averageWPM = results.wordsTyped / timeInMinutes;

        return results;
    }
}

// E2E Tests for Complete Game Workflows
describe('Complete Game Session E2E Tests', () => {
    let game, simulator;

    function setupFullGame() {
        // Create realistic mock DOM
        const mockElements = createRealisticMockDOM();

        // Mock document methods
        const originalGetElementById = document.getElementById;
        const originalQuerySelector = document.querySelector;
        const originalAddEventListener = document.addEventListener;

        document.getElementById = (id) => mockElements[id] || null;
        document.querySelector = (selector) => mockElements[selector] || null;
        document.addEventListener = () => {};

        // Create game
        game = new TypingGame();
        simulator = new GameSimulator(game);

        return {
            restore: () => {
                document.getElementById = originalGetElementById;
                document.querySelector = originalQuerySelector;
                document.addEventListener = originalAddEventListener;
            }
        };
    }

    function createRealisticMockDOM() {
        return {
            'game-canvas': testFramework.createMockCanvas(),
            'start-btn': testFramework.createMockDOMElement('button'),
            'restart-btn': testFramework.createMockDOMElement('button'),
            'word-input': testFramework.createMockDOMElement('input'),
            'start-screen': testFramework.createMockDOMElement('div'),
            'game-over-screen': testFramework.createMockDOMElement('div'),
            'floor': testFramework.createMockDOMElement('span'),
            'score': testFramework.createMockDOMElement('span'),
            'wpm': testFramework.createMockDOMElement('span'),
            'combo': testFramework.createMockDOMElement('span'),
            'fever-display-center': testFramework.createMockDOMElement('div'),
            'fever-level': testFramework.createMockDOMElement('span'),
            'fever-multiplier': testFramework.createMockDOMElement('span'),
            'fever-fill': testFramework.createMockDOMElement('div'),
            'branch-1': testFramework.createMockDOMElement('div'),
            'branch-2': testFramework.createMockDOMElement('div'),
            'active-powerups': testFramework.createMockDOMElement('div'),
            'frenzy-mode-overlay': testFramework.createMockDOMElement('div'),
            'frenzy-countdown': testFramework.createMockDOMElement('span'),
            'snake-container': testFramework.createMockDOMElement('div'),
            'frenzy-ui-container': testFramework.createMockDOMElement('div'),
            'freeze-flash-overlay': testFramework.createMockDOMElement('div')
        };
    }

    test('Complete successful game run', () => {
        const { restore } = setupFullGame();
        const mockTimers = testFramework.mockTimers();

        const runResult = simulator.simulateCompleteRun();

        expect(runResult.finalScore).toBeGreaterThan(0);
        expect(runResult.finalFloor).toBeGreaterThan(1);
        expect(game.runSystem.active).toBeTrue();

        mockTimers.restore();
        restore();
    });

    test('Perfect typing session builds fever correctly', () => {
        const { restore } = setupFullGame();
        const mockTimers = testFramework.mockTimers();

        game.startNewRun();

        const typingResult = simulator.simulatePerfectTyping(20);

        expect(typingResult.wordsTyped).toBe(20);
        expect(typingResult.errorsCount).toBe(0);
        expect(game.feverSystem.heat).toBeGreaterThan(0);
        expect(game.scoring.combo).toBeGreaterThan(0);

        mockTimers.restore();
        restore();
    });

    test('Error recovery workflow', () => {
        const { restore } = setupFullGame();
        const mockTimers = testFramework.mockTimers();

        game.startNewRun();

        // Build up some progress
        simulator.simulatePerfectTyping(5);
        const scoreAfterPerfect = game.scoring.score;
        const heatAfterPerfect = game.feverSystem.heat;

        // Make some errors
        simulator.simulateError();
        simulator.simulateError();

        expect(game.scoring.combo).toBe(0); // Combo should reset
        expect(game.feverSystem.heat).toBeLessThan(heatAfterPerfect); // Heat should decrease

        // Recover with perfect typing
        simulator.simulatePerfectTyping(5);

        expect(game.scoring.score).toBeGreaterThan(scoreAfterPerfect);
        expect(game.scoring.combo).toBeGreaterThan(0);

        mockTimers.restore();
        restore();
    });

    test('Power-up collection and usage workflow', () => {
        const { restore } = setupFullGame();
        const mockTimers = testFramework.mockTimers();

        game.startNewRun();

        // Collect different power-ups
        simulator.triggerRandomPowerUp();
        simulator.triggerRandomPowerUp();
        simulator.triggerRandomPowerUp();

        expect(game.powerUpSystem.activePowerUps.length).toBeGreaterThan(0);

        // Wait for power-ups to expire
        mockTimers.advanceTimersByTime(10000);
        game.powerUpSystem.updatePowerUps();

        // Power-ups should expire
        expect(game.powerUpSystem.activePowerUps.length).toBeLessThan(3);

        mockTimers.restore();
        restore();
    });

    test('Frenzy mode complete workflow', () => {
        const { restore } = setupFullGame();
        const mockTimers = testFramework.mockTimers();

        game.startNewRun();

        // Trigger frenzy mode
        game.frenzyMode.wordsSinceFrenzy = game.frenzyMode.frenzyTriggerInterval - 1;
        simulator.mockKeyboard.typeWord('test'); // This should trigger frenzy

        // Should enter frenzy countdown
        expect(game.frenzyMode.countdownActive || game.frenzyMode.active).toBeTrue();

        // Simulate frenzy countdown
        if (game.frenzyMode.countdownActive) {
            mockTimers.advanceTimersByTime(4000); // Wait for countdown
            game.updateFrenzyCountdown();
        }

        // Should now be in active frenzy
        if (game.frenzyMode.active) {
            expect(game.frenzyMode.sentenceWords.length).toBeGreaterThan(0);

            // Complete all words in sentence
            while (game.frenzyMode.currentWordIndex < game.frenzyMode.sentenceWords.length) {
                game.completeFrenzyWord();
            }

            expect(game.frenzyMode.active).toBeFalse();
        }

        mockTimers.restore();
        restore();
    });

    test('Game over and restart workflow', () => {
        const { restore } = setupFullGame();
        const mockTimers = testFramework.mockTimers();

        game.startNewRun();
        const originalScore = game.scoring.score;

        // Play for a bit
        simulator.simulatePerfectTyping(10);
        expect(game.scoring.score).toBeGreaterThan(originalScore);

        // Force game over
        game.gameOver();
        expect(game.gameState).toBe('gameOver');
        expect(game.runSystem.active).toBeFalse();

        // Restart game
        game.startNewRun();
        expect(game.gameState).toBe('playing');
        expect(game.runSystem.active).toBeTrue();
        expect(game.scoring.score).toBe(0); // Score should reset

        mockTimers.restore();
        restore();
    });

    test('Floor progression and difficulty scaling', () => {
        const { restore } = setupFullGame();
        const mockTimers = testFramework.mockTimers();

        game.startNewRun();
        const startingFloor = game.runSystem.currentFloor;

        // Complete multiple floors
        for (let floor = 1; floor <= 3; floor++) {
            simulator.simulateFloor(floor);
            expect(game.runSystem.currentFloor).toBeGreaterThan(startingFloor);
        }

        // Background speed should increase with floor
        expect(game.background.scrollSpeed).toBeGreaterThan(game.background.baseSpeed);

        mockTimers.restore();
        restore();
    });
});

// E2E Tests for Edge Cases and Error Scenarios
describe('Edge Cases and Error Handling E2E Tests', () => {
    test('Rapid input handling', () => {
        const { restore } = setupFullGame();
        const mockTimers = testFramework.mockTimers();

        game.startNewRun();

        // Simulate very rapid typing
        for (let i = 0; i < 100; i++) {
            simulator.mockKeyboard.pressKey('a');
            game.update(1); // Very short frame time
        }

        // Game should remain stable
        expect(game.gameState).toBe('playing');

        mockTimers.restore();
        restore();
    });

    test('Memory pressure simulation', () => {
        const { restore } = setupFullGame();
        const mockTimers = testFramework.mockTimers();

        game.startNewRun();

        // Create memory pressure with many particles and effects
        for (let i = 0; i < 1000; i++) {
            game.particleManager.addParticle(
                Math.random() * 800,
                Math.random() * 600,
                'explosion'
            );

            if (i % 100 === 0) {
                game.update(16);
            }
        }

        // Game should clean up particles automatically
        expect(game.particleManager.particles.length).toBeLessThan(1000);

        mockTimers.restore();
        restore();
    });

    test('Extended play session stability', () => {
        const { restore } = setupFullGame();
        const mockTimers = testFramework.mockTimers();

        game.startNewRun();

        // Simulate 30 minutes of gameplay
        for (let minute = 0; minute < 30; minute++) {
            // 1 minute of gameplay
            for (let second = 0; second < 60; second++) {
                game.update(16);
                mockTimers.advanceTimersByTime(16);

                // Occasional actions
                if (second % 10 === 0) {
                    simulator.mockKeyboard.typeWord('test');
                }
            }

            // Check stability every 5 minutes
            if (minute % 5 === 0) {
                expect(game.gameState).toBe('playing');
                expect(game.runSystem.active).toBeTrue();
            }
        }

        mockTimers.restore();
        restore();
    });

    test('Browser tab visibility changes', () => {
        const { restore } = setupFullGame();
        const mockTimers = testFramework.mockTimers();

        game.startNewRun();

        // Simulate tab becoming hidden
        const visibilityEvent = { target: { hidden: true } };
        if (game.handleVisibilityChange) {
            game.handleVisibilityChange(visibilityEvent);
        }

        // Game should pause or handle appropriately
        expect(game.gameState).toBe('playing'); // Should remain playable

        // Simulate tab becoming visible again
        const visibleEvent = { target: { hidden: false } };
        if (game.handleVisibilityChange) {
            game.handleVisibilityChange(visibleEvent);
        }

        mockTimers.restore();
        restore();
    });
});

// Performance E2E Tests
describe('Performance E2E Tests', () => {
    test('60 FPS gameplay performance', () => {
        const { restore } = setupFullGame();

        game.startNewRun();

        // Simulate realistic game load
        simulator.triggerRandomPowerUp();
        simulator.triggerRandomPowerUp();

        for (let i = 0; i < 50; i++) {
            game.particleManager.addParticle(i * 10, i * 10, 'explosion');
        }

        // Measure frame time
        const frameTime = testFramework.benchmark('60 FPS frame update', () => {
            game.update(16.67); // 60 FPS frame time
        }, 100);

        expect(frameTime).toBeLessThan(16.67); // Should complete within frame budget

        restore();
    });

    test('Garbage collection pressure', () => {
        const { restore } = setupFullGame();
        const mockTimers = testFramework.mockTimers();

        game.startNewRun();

        // Create and destroy many objects
        for (let cycle = 0; cycle < 10; cycle++) {
            // Create objects
            for (let i = 0; i < 100; i++) {
                game.particleManager.addParticle(i, i, 'explosion');
                simulator.triggerRandomPowerUp();
            }

            // Let them expire
            mockTimers.advanceTimersByTime(6000);
            game.update(16);
            game.powerUpSystem.updatePowerUps();
        }

        // Memory should be cleaned up
        expect(game.particleManager.particles.length).toBeLessThan(50);
        expect(game.powerUpSystem.activePowerUps.length).toBeLessThan(10);

        mockTimers.restore();
        restore();
    });
});

// Add E2E tests to framework
testFramework.addTest(() => {
    // E2E tests are defined inline above
});

console.log('✅ End-to-end tests loaded successfully');