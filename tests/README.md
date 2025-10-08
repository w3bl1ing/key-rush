# Key Rush Game Test Suite

This comprehensive test suite ensures all game mechanics, features, and systems work correctly and won't break during development.

## 🎯 Test Coverage

### Core Systems Tested
- **FeverSystem**: Heat management, level progression, fever rush mechanics
- **PowerUpSystem**: All 6 power-ups (speed, timeWarp, shield, multiplier, laserFocus, freeze)
- **WordManager**: Word generation, power-up words, difficulty progression
- **ParticleManager**: Visual effects and performance
- **TypingGame**: Main game loop, state management, user input

### Game Features Tested
- **Complete Game Sessions**: Start to finish gameplay
- **Frenzy Mode**: Sentence typing, countdown, completion
- **Floor Progression**: Difficulty scaling, advancement
- **Scoring System**: Points, combos, WPM calculation
- **Error Handling**: Input validation, recovery mechanisms
- **Performance**: Frame rate, memory usage, garbage collection

## 🧪 Test Categories

### 1. Unit Tests (`unit-tests.js`)
Tests individual components in isolation:

- **FeverSystem Tests**: 9 test cases
  - Heat addition/removal
  - Level transitions
  - Fever rush triggers
  - Decay mechanics
  - Score multiplier calculation

- **PowerUpSystem Tests**: 8 test cases
  - Power-up activation
  - Rarity bonuses
  - Duration/word-based expiration
  - Multiple power-up management

- **WordManager Tests**: 8 test cases
  - Word list validation
  - Difficulty progression
  - Power-up word categorization
  - Frenzy sentence generation

- **ParticleManager Tests**: 7 test cases
  - Particle creation/destruction
  - Animation updates
  - Performance optimization

### 2. Integration Tests (`integration-tests.js`)
Tests how systems work together:

- **Game System Integration**: 8 test cases
  - Fever + scoring integration
  - Power-up gameplay effects
  - Frenzy mode workflows
  - Error handling across systems

- **Word System Integration**: 3 test cases
  - Power-up word triggers
  - Difficulty-based scoring
  - Frenzy sentence completion

- **UI Integration**: 2 test cases
  - State reflection in UI
  - Input validation workflows

- **Performance Integration**: 2 test cases
  - High-load performance
  - Memory stability

### 3. End-to-End Tests (`e2e-tests.js`)
Tests complete user workflows:

- **Complete Game Sessions**: 7 test cases
  - Full successful runs
  - Perfect typing sessions
  - Error recovery workflows
  - Power-up collection/usage
  - Game over/restart cycles

- **Edge Cases**: 4 test cases
  - Rapid input handling
  - Memory pressure simulation
  - Extended play sessions
  - Browser tab visibility changes

- **Performance E2E**: 2 test cases
  - 60 FPS gameplay
  - Garbage collection pressure

## 🚀 Running Tests

### Method 1: Test Runner (Recommended)
1. Open `test-runner.html` in your browser
2. Click the test category you want to run:
   - **Run All Tests**: Complete test suite
   - **Unit Tests Only**: Core component tests
   - **Integration Tests Only**: System interaction tests
   - **E2E Tests Only**: User workflow tests
   - **Performance Tests**: Benchmark measurements

### Method 2: Browser Console
```javascript
// Load all test files first, then:
testFramework.runAll();
```

### Method 3: Individual Test Categories
```javascript
// Run specific test descriptions
testFramework.describe('FeverSystem Tests', () => {
    // Individual tests here
});
```

## 📊 Test Results Interpretation

### Success Metrics
- **100% Pass Rate**: All tests should pass
- **Performance Benchmarks**:
  - Game loop: < 16.67ms (60 FPS)
  - Game initialization: < 100ms
  - Memory allocation: < 1ms per 100 objects

### Warning Signs
- **Memory Leaks**: Particle count > 50 after cleanup
- **Performance Degradation**: Frame time > 16.67ms
- **State Corruption**: Game state inconsistencies
- **UI Desync**: Game state not reflected in UI

## 🛠️ Test Framework Features

### Assertions
```javascript
expect(actual).toBe(expected);
expect(actual).toBeCloseTo(expected, precision);
expect(actual).toBeTrue();
expect(actual).toBeFalse();
expect(actual).toContain(item);
expect(actual).toHaveLength(count);
expect(actual).toBeGreaterThan(value);
expect(actual).toBeLessThan(value);
expect(fn).toThrow();
```

### Mocking
```javascript
// Mock object methods
const mockRestore = testFramework.mock(object, 'method', mockImpl);
mockRestore.restore();

// Mock timers
const mockTimers = testFramework.mockTimers();
mockTimers.advanceTimersByTime(1000);
mockTimers.restore();

// Mock DOM elements
const mockElement = testFramework.createMockDOMElement('div', {
    id: 'test-element',
    className: 'test-class'
});
```

### Performance Testing
```javascript
const avgTime = testFramework.benchmark('Test description', () => {
    // Code to benchmark
}, 1000); // Run 1000 iterations
```

## 🎮 Game-Specific Test Utilities

### GameSimulator
Simulates realistic user interactions:
```javascript
const simulator = new GameSimulator(game);

// Simulate typing
simulator.mockKeyboard.typeWord('hello');
simulator.mockKeyboard.typeIncorrectly('hello', 'helo');

// Simulate complete gameplay
const results = simulator.simulateCompleteRun();
simulator.simulateFloor(floorNumber);
simulator.simulatePerfectTyping(wordCount);
```

### Mock DOM Creation
```javascript
const mockCanvas = testFramework.createMockCanvas();
const mockElement = testFramework.createMockDOMElement('div');
```

## 🔧 Adding New Tests

### 1. Unit Test Template
```javascript
describe('NewSystem Tests', () => {
    let system;

    function setup() {
        system = new NewSystem();
    }

    test('should initialize correctly', () => {
        setup();
        expect(system.property).toBe(expectedValue);
    });

    test('should handle specific behavior', () => {
        setup();
        const result = system.doSomething();
        expect(result).toBeDefined();
    });
});
```

### 2. Integration Test Template
```javascript
describe('NewSystem Integration', () => {
    test('should work with other systems', () => {
        const { game, restore } = setupFullGame();

        // Test interaction between systems
        game.newSystem.doSomething();
        game.otherSystem.checkState();

        expect(game.state).toBe('expected');
        restore();
    });
});
```

### 3. E2E Test Template
```javascript
describe('New User Workflow E2E', () => {
    test('should complete user workflow', () => {
        const { game, restore } = setupFullGame();
        const simulator = new GameSimulator(game);

        // Simulate complete user workflow
        simulator.performWorkflow();

        expect(game.finalState).toBe('success');
        restore();
    });
});
```

## 🐛 Debugging Failed Tests

### Common Issues
1. **Mock Setup**: Ensure all required DOM elements are mocked
2. **Timer Cleanup**: Always restore mocked timers
3. **State Reset**: Reset game state between tests
4. **Async Operations**: Handle async code with proper timing

### Debug Tools
```javascript
// Enable verbose logging
testFramework.enableVerboseLogging();

// Check test state
console.log('Game state:', game.gameState);
console.log('Active power-ups:', game.powerUpSystem.activePowerUps);
console.log('Fever heat:', game.feverSystem.heat);
```

## 📈 Continuous Testing

### Pre-commit Testing
Run core tests before committing:
```bash
# Quick test suite (< 30 seconds)
npm run test:quick
```

### Full Test Suite
Run complete suite before releases:
```bash
# Complete test suite (2-5 minutes)
npm run test:full
```

### Performance Monitoring
Track performance regressions:
```bash
# Performance benchmarks
npm run test:performance
```

## 🎯 Test Goals

### Reliability
- **No False Positives**: Tests only fail when something is actually broken
- **No False Negatives**: Tests catch all real issues
- **Deterministic**: Same code always produces same test results

### Coverage
- **Feature Coverage**: All game features tested
- **Code Coverage**: All critical code paths tested
- **Edge Case Coverage**: Boundary conditions and error states tested

### Performance
- **Fast Execution**: Test suite completes in < 5 minutes
- **Parallel Execution**: Tests can run concurrently
- **Resource Efficient**: Tests don't consume excessive memory

### Maintainability
- **Clear Test Names**: Purpose obvious from description
- **Isolated Tests**: No interdependencies between tests
- **Easy Debugging**: Clear error messages and stack traces

## 🔄 Test Maintenance

### Regular Tasks
- **Update test data** when game content changes
- **Add regression tests** for any bugs found
- **Optimize slow tests** that exceed time budget
- **Remove obsolete tests** for removed features

### Best Practices
- **Test behavior, not implementation**: Focus on what the code should do
- **Use descriptive test names**: Make failures self-explanatory
- **Keep tests simple**: One concept per test
- **Avoid test interdependencies**: Each test should run independently

---

## 📞 Support

If you encounter issues with the test suite:
1. Check the test output for specific error messages
2. Verify all dependencies are loaded correctly
3. Ensure browser supports required JavaScript features
4. Check console for additional error details

**Happy Testing! 🎮✅**