/**
 * Quick Validation Test for Key Rush Game Test Suite
 * Ensures the test framework and game integration work correctly
 */

// Basic validation that all systems are loaded
function validateTestEnvironment() {
    console.log('🔍 Validating test environment...');

    const checks = [
        {
            name: 'Test Framework',
            check: () => typeof testFramework !== 'undefined',
            critical: true
        },
        {
            name: 'FeverSystem Class',
            check: () => typeof FeverSystem !== 'undefined',
            critical: true
        },
        {
            name: 'PowerUpSystem Class',
            check: () => typeof PowerUpSystem !== 'undefined',
            critical: true
        },
        {
            name: 'ParticleManager Class',
            check: () => typeof ParticleManager !== 'undefined',
            critical: true
        },
        {
            name: 'TypingGame Class',
            check: () => typeof TypingGame !== 'undefined',
            critical: true
        },
        {
            name: 'WordManager Object',
            check: () => typeof WordManager !== 'undefined',
            critical: true
        },
        {
            name: 'Document Object',
            check: () => typeof document !== 'undefined',
            critical: false
        },
        {
            name: 'Performance API',
            check: () => typeof performance !== 'undefined' && typeof performance.now === 'function',
            critical: false
        }
    ];

    let passed = 0;
    let failed = 0;
    let criticalFailures = 0;

    checks.forEach(check => {
        try {
            if (check.check()) {
                console.log(`✅ ${check.name}: Available`);
                passed++;
            } else {
                console.log(`❌ ${check.name}: Not available`);
                failed++;
                if (check.critical) criticalFailures++;
            }
        } catch (error) {
            console.log(`❌ ${check.name}: Error - ${error.message}`);
            failed++;
            if (check.critical) criticalFailures++;
        }
    });

    console.log(`\n📊 Validation Results:`);
    console.log(`   ✅ Passed: ${passed}`);
    console.log(`   ❌ Failed: ${failed}`);
    console.log(`   🚨 Critical Failures: ${criticalFailures}`);

    if (criticalFailures > 0) {
        console.log(`\n🚨 Critical components missing! Test suite may not work correctly.`);
        return false;
    } else if (failed > 0) {
        console.log(`\n⚠️ Some optional components missing, but core functionality should work.`);
        return true;
    } else {
        console.log(`\n🎉 All components available! Test suite ready to run.`);
        return true;
    }
}

// Quick functional test of core systems
function quickFunctionalTest() {
    console.log('\n🧪 Running quick functional tests...');

    try {
        // Test FeverSystem
        const feverSystem = new FeverSystem();
        feverSystem.addHeat(50);
        console.log(`✅ FeverSystem: Heat at ${feverSystem.heat}, Level ${feverSystem.level}`);

        // Test PowerUpSystem
        const powerUpSystem = new PowerUpSystem();
        powerUpSystem.activatePowerUp('speed', 'common');
        console.log(`✅ PowerUpSystem: ${powerUpSystem.activePowerUps.length} active power-ups`);

        // Test ParticleManager
        const particleManager = new ParticleManager();
        particleManager.addParticle(100, 100, 'explosion');
        console.log(`✅ ParticleManager: ${particleManager.particles.length} particles`);

        // Test WordManager
        const wordPair = WordManager.generateWordPair(0, 1);
        console.log(`✅ WordManager: Generated words "${wordPair.word1}" and "${wordPair.word2}"`);

        console.log(`\n🎉 Quick functional tests passed!`);
        return true;

    } catch (error) {
        console.log(`\n❌ Quick functional test failed: ${error.message}`);
        console.log(`   Stack: ${error.stack}`);
        return false;
    }
}

// Test framework functionality
function testFrameworkValidation() {
    console.log('\n🛠️ Validating test framework functionality...');

    try {
        // Test basic assertions
        testFramework.expect(2 + 2).toBe(4);
        testFramework.expect(true).toBeTrue();
        testFramework.expect([1, 2, 3]).toHaveLength(3);
        console.log(`✅ Assertions: Working correctly`);

        // Test mocking
        const testObj = { method: () => 'original' };
        const mockRestore = testFramework.mock(testObj, 'method', () => 'mocked');
        if (testObj.method() === 'mocked') {
            console.log(`✅ Mocking: Working correctly`);
        } else {
            throw new Error('Mocking not working');
        }
        mockRestore.restore();

        // Test timer mocking
        const mockTimers = testFramework.mockTimers();
        let timerCalled = false;
        setTimeout(() => { timerCalled = true; }, 1000);
        mockTimers.advanceTimersByTime(1001);
        if (timerCalled) {
            console.log(`✅ Timer Mocking: Working correctly`);
        } else {
            throw new Error('Timer mocking not working');
        }
        mockTimers.restore();

        // Test performance benchmarking
        const avgTime = testFramework.benchmark('Simple operation', () => {
            Math.sqrt(Math.random());
        }, 100);
        if (avgTime > 0) {
            console.log(`✅ Benchmarking: Working correctly (${avgTime.toFixed(4)}ms avg)`);
        } else {
            throw new Error('Benchmarking not working');
        }

        console.log(`\n🎉 Test framework validation passed!`);
        return true;

    } catch (error) {
        console.log(`\n❌ Test framework validation failed: ${error.message}`);
        return false;
    }
}

// Run all validation tests
function runValidation() {
    console.log('🎮 Key Rush Game Test Suite Validation\n');

    const environmentOK = validateTestEnvironment();
    const functionalOK = quickFunctionalTest();
    const frameworkOK = testFrameworkValidation();

    console.log('\n📊 Overall Validation Results:');
    console.log(`   Environment: ${environmentOK ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Functional: ${functionalOK ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Framework: ${frameworkOK ? '✅ PASS' : '❌ FAIL'}`);

    const allOK = environmentOK && functionalOK && frameworkOK;

    if (allOK) {
        console.log(`\n🚀 Validation complete! Test suite is ready to run.`);
        console.log(`   Run testFramework.runAll() to execute all tests.`);
    } else {
        console.log(`\n🚨 Validation failed! Please check the errors above.`);
    }

    return allOK;
}

// Auto-run validation if this script is loaded directly
if (typeof window !== 'undefined') {
    // Run validation after a short delay to ensure all dependencies are loaded
    setTimeout(runValidation, 100);
}

// Export for manual testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        validateTestEnvironment,
        quickFunctionalTest,
        testFrameworkValidation,
        runValidation
    };
}