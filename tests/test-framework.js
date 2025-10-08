/**
 * Simple Test Framework for Key Rush Game
 * Provides unit testing, integration testing, and mocking capabilities
 */

class TestFramework {
    constructor() {
        this.tests = [];
        this.results = {
            passed: 0,
            failed: 0,
            total: 0
        };
        this.mocks = new Map();
        this.originalMethods = new Map();
    }

    // Test definition
    describe(description, testFunction) {
        console.group(`📋 ${description}`);
        testFunction();
        console.groupEnd();
    }

    test(description, testFunction) {
        this.results.total++;
        try {
            testFunction();
            this.results.passed++;
            console.log(`✅ ${description}`);
        } catch (error) {
            this.results.failed++;
            console.error(`❌ ${description}`);
            console.error(`   Error: ${error.message}`);
            if (error.stack) {
                console.error(`   Stack: ${error.stack}`);
            }
        }
    }

    // Assertions
    expect(actual) {
        return {
            toBe: (expected) => {
                if (actual !== expected) {
                    throw new Error(`Expected ${expected}, but got ${actual}`);
                }
            },
            toBeCloseTo: (expected, precision = 2) => {
                const diff = Math.abs(actual - expected);
                const tolerance = Math.pow(10, -precision);
                if (diff > tolerance) {
                    throw new Error(`Expected ${actual} to be close to ${expected} (within ${tolerance})`);
                }
            },
            toBeTrue: () => {
                if (actual !== true) {
                    throw new Error(`Expected true, but got ${actual}`);
                }
            },
            toBeFalse: () => {
                if (actual !== false) {
                    throw new Error(`Expected false, but got ${actual}`);
                }
            },
            toContain: (expected) => {
                if (!actual.includes(expected)) {
                    throw new Error(`Expected ${actual} to contain ${expected}`);
                }
            },
            toHaveLength: (expected) => {
                if (actual.length !== expected) {
                    throw new Error(`Expected length ${expected}, but got ${actual.length}`);
                }
            },
            toBeGreaterThan: (expected) => {
                if (actual <= expected) {
                    throw new Error(`Expected ${actual} to be greater than ${expected}`);
                }
            },
            toBeLessThan: (expected) => {
                if (actual >= expected) {
                    throw new Error(`Expected ${actual} to be less than ${expected}`);
                }
            },
            toThrow: () => {
                if (typeof actual !== 'function') {
                    throw new Error('Expected a function to test for throwing');
                }
                try {
                    actual();
                    throw new Error('Expected function to throw, but it did not');
                } catch (e) {
                    // Function threw as expected
                }
            }
        };
    }

    // Mocking utilities
    mock(object, method, mockImplementation) {
        const originalMethod = object[method];
        if (!this.originalMethods.has(object)) {
            this.originalMethods.set(object, new Map());
        }
        this.originalMethods.get(object).set(method, originalMethod);

        object[method] = mockImplementation || (() => {});

        return {
            restore: () => {
                object[method] = originalMethod;
            }
        };
    }

    mockTimers() {
        const originalSetTimeout = window.setTimeout;
        const originalSetInterval = window.setInterval;
        const originalClearTimeout = window.clearTimeout;
        const originalClearInterval = window.clearInterval;
        const originalDateNow = Date.now;

        let currentTime = 0;
        const timers = new Map();
        let timerId = 1;

        window.setTimeout = (callback, delay) => {
            const id = timerId++;
            timers.set(id, {
                callback,
                triggerTime: currentTime + delay,
                type: 'timeout'
            });
            return id;
        };

        window.setInterval = (callback, delay) => {
            const id = timerId++;
            timers.set(id, {
                callback,
                triggerTime: currentTime + delay,
                interval: delay,
                type: 'interval'
            });
            return id;
        };

        window.clearTimeout = window.clearInterval = (id) => {
            timers.delete(id);
        };

        Date.now = () => currentTime;

        return {
            advanceTimersByTime: (time) => {
                currentTime += time;
                const toTrigger = [];

                timers.forEach((timer, id) => {
                    if (timer.triggerTime <= currentTime) {
                        toTrigger.push({ id, timer });
                    }
                });

                toTrigger.forEach(({ id, timer }) => {
                    timer.callback();
                    if (timer.type === 'interval') {
                        timer.triggerTime = currentTime + timer.interval;
                    } else {
                        timers.delete(id);
                    }
                });
            },
            restore: () => {
                window.setTimeout = originalSetTimeout;
                window.setInterval = originalSetInterval;
                window.clearTimeout = originalClearTimeout;
                window.clearInterval = originalClearInterval;
                Date.now = originalDateNow;
            }
        };
    }

    restoreAllMocks() {
        this.originalMethods.forEach((methods, object) => {
            methods.forEach((originalMethod, methodName) => {
                object[methodName] = originalMethod;
            });
        });
        this.originalMethods.clear();
    }

    // Test utilities
    createMockCanvas() {
        const mockContext = {
            clearRect: () => {},
            fillRect: () => {},
            strokeRect: () => {},
            fillText: () => {},
            measureText: () => ({ width: 100 }),
            save: () => {},
            restore: () => {},
            translate: () => {},
            scale: () => {},
            rotate: () => {},
            beginPath: () => {},
            moveTo: () => {},
            lineTo: () => {},
            arc: () => {},
            fill: () => {},
            stroke: () => {},
            setLineDash: () => {},
            createLinearGradient: () => ({
                addColorStop: () => {}
            })
        };

        return {
            getContext: () => mockContext,
            addEventListener: () => {},
            removeEventListener: () => {},
            width: 800,
            height: 600
        };
    }

    createMockDOMElement(tagName = 'div', properties = {}) {
        const element = {
            tagName: tagName.toUpperCase(),
            id: properties.id || '',
            className: properties.className || '',
            textContent: properties.textContent || '',
            innerHTML: properties.innerHTML || '',
            style: {},
            classList: {
                add: () => {},
                remove: () => {},
                contains: () => false,
                toggle: () => {}
            },
            addEventListener: () => {},
            removeEventListener: () => {},
            appendChild: () => {},
            removeChild: () => {},
            querySelector: () => null,
            querySelectorAll: () => [],
            getAttribute: () => null,
            setAttribute: () => {},
            removeAttribute: () => {},
            ...properties
        };
        return element;
    }

    // Performance testing
    benchmark(description, testFunction, iterations = 1000) {
        const start = performance.now();
        for (let i = 0; i < iterations; i++) {
            testFunction();
        }
        const end = performance.now();
        const averageTime = (end - start) / iterations;
        console.log(`⏱️ ${description}: ${averageTime.toFixed(4)}ms per iteration`);
        return averageTime;
    }

    // Test runner
    runAll() {
        console.log('🚀 Starting Key Rush Game Tests...\n');
        const startTime = performance.now();

        // Reset results
        this.results = { passed: 0, failed: 0, total: 0 };

        // Run all tests
        this.tests.forEach(test => test());

        const endTime = performance.now();
        const duration = (endTime - startTime).toFixed(2);

        console.log('\n📊 Test Results:');
        console.log(`   ✅ Passed: ${this.results.passed}`);
        console.log(`   ❌ Failed: ${this.results.failed}`);
        console.log(`   📝 Total: ${this.results.total}`);
        console.log(`   ⏱️ Duration: ${duration}ms`);

        const successRate = ((this.results.passed / this.results.total) * 100).toFixed(1);
        console.log(`   📈 Success Rate: ${successRate}%`);

        if (this.results.failed === 0) {
            console.log('\n🎉 All tests passed!');
        } else {
            console.log(`\n⚠️ ${this.results.failed} test(s) failed.`);
        }

        return this.results;
    }

    addTest(testFunction) {
        this.tests.push(testFunction);
    }
}

// Global test instance
window.testFramework = new TestFramework();

// Export for Node.js if available
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TestFramework;
}