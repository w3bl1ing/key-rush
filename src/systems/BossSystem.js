class BossSystem {
    constructor() {
        this.active = false;
        this.countdownActive = false;
        this.currentBoss = null;
        this.limbs = [];
        this.destroyedLimbs = 0;
        this.wordsSinceBoss = 0;
        this.bossTriggerInterval = 12; // Every 12 words (avoids frequent clash with frenzy mode at 5)

        // Timer system
        this.duration = 45000; // 45 seconds
        this.timeRemaining = 45000;
        this.startTime = null;
        this.typoPenalty = 3000; // -3 seconds per typo
        this.maxDuration = 60000; // 60 second cap
        this.minDuration = 5000; // 5 second minimum

        // HP system
        this.maxHP = 100;
        this.currentHP = 100;
        this.hearts = 5; // Visual representation
        this.hpPerHeart = 20;
        this.noDamageTaken = true; // Track perfect defense

        // Attack system
        this.attackInterval = 8000; // Base: 8 seconds between attacks
        this.lastAttackTime = null;
        this.attackWarningActive = false;
        this.attackWarningStart = null;
        this.attackWarningDuration = 2500; // 2.5 second warning for normal attacks
        this.attackingLimb = null;
        this.defenseAttempted = false;
        this.defenseSuccessful = false;
        this.currentDefenseWord = '';

        // Defense word pool (short phrases for normal attacks)
        this.defenseWords = [
            'defend', 'block', 'dodge', 'guard', 'parry',
            'evade', 'shield', 'counter', 'resist', 'duck'
        ];

        // Special move system (ultimate attack when 1 limb remains)
        this.specialMoveTriggered = false;
        this.specialMoveActive = false;
        this.specialMoveWarningDuration = 12000; // 12 seconds (plenty of time to type and correct)
        this.currentSpecialChant = '';
        this.specialMoveBlocked = false;

        // Attack stats
        this.totalAttacks = 0;
        this.attacksBlocked = 0;
        this.damageDealt = 0;

        // Performance tracking
        this.totalAttempts = 0;
        this.successfulHits = 0;
        this.missedAttempts = 0;
        this.perfectBoss = true; // Track if boss defeated without mistakes

        // Boss types configuration
        // All attacks deal exactly 1 heart (20 damage) for clear visual feedback
        // Special moves deal 3 hearts (60 damage) - devastating ultimate attacks
        this.bossTypes = {
            glitchSpider: {
                name: 'GLITCH SPIDER',
                limbCount: 6,
                theme: 'tech',
                color: '#00ff41',
                description: 'Six corrupted legs of pure malware',
                attackName: 'Web Shot',
                attackDamage: 20,
                attackColor: '#00ff41',
                specialMoveName: 'CORRUPTED WEB PRISON',
                specialMoveChant: 'break the protocol and purge the virus',
                specialMoveDamage: 60,
                specialMoveColor: '#00ff41'
            },
            codeHydra: {
                name: 'CODE HYDRA',
                limbCount: 5,
                theme: 'programming',
                color: '#ff00ff',
                description: 'Five heads speaking in forbidden syntax',
                attackName: 'Syntax Flame',
                attackDamage: 20,
                attackColor: '#ff00ff',
                specialMoveName: 'INFINITE RECURSION',
                specialMoveChant: 'return to base case and escape the loop',
                specialMoveDamage: 60,
                specialMoveColor: '#ff00ff'
            },
            syntaxGolem: {
                name: 'SYNTAX GOLEM',
                limbCount: 4,
                theme: 'errors',
                color: '#ff4444',
                description: 'Four arms of runtime destruction',
                attackName: 'Error Punch',
                attackDamage: 20,
                attackColor: '#ff4444',
                specialMoveName: 'FATAL EXCEPTION',
                specialMoveChant: 'catch the error and handle gracefully',
                specialMoveDamage: 60,
                specialMoveColor: '#ff4444'
            },
            bugKraken: {
                name: 'BUG KRAKEN',
                limbCount: 8,
                theme: 'debugging',
                color: '#ffaa00',
                description: 'Eight tentacles of unresolved issues',
                attackName: 'Tentacle Slam',
                attackDamage: 20,
                attackColor: '#ffaa00',
                specialMoveName: 'MEMORY LEAK TSUNAMI',
                specialMoveChant: 'garbage collect and free the heap',
                specialMoveDamage: 60,
                specialMoveColor: '#ffaa00'
            }
        };
    }

    shouldTriggerBoss(wordsCompleted) {
        this.wordsSinceBoss++;
        return this.wordsSinceBoss >= this.bossTriggerInterval;
    }

    initializeBoss(bossType, wordPool) {
        this.currentBoss = this.bossTypes[bossType];
        this.limbs = [];
        this.destroyedLimbs = 0;
        this.totalAttempts = 0;
        this.successfulHits = 0;
        this.missedAttempts = 0;
        this.perfectBoss = true;

        // Initialize HP
        this.currentHP = this.maxHP;
        this.noDamageTaken = true;

        // Initialize attack system
        this.lastAttackTime = Date.now();
        this.attackWarningActive = false;
        this.attackWarningStart = null;
        this.attackingLimb = null;
        this.totalAttacks = 0;
        this.attacksBlocked = 0;
        this.damageDealt = 0;

        // Generate limbs with words (wordPool is already unique and randomized)
        const limbCount = this.currentBoss.limbCount;
        for (let i = 0; i < limbCount; i++) {
            const word = wordPool[i]; // Use words in order since wordPool is already randomized and unique
            this.limbs.push({
                id: i,
                word: word,
                destroyed: false,
                position: this.calculateLimbPosition(i, limbCount),
                angle: (Math.PI * 2 * i) / limbCount
            });
        }

        // Initialize timer
        this.timeRemaining = this.duration;
        this.startTime = Date.now();
    }

    calculateLimbPosition(index, total) {
        const angle = (Math.PI * 2 * index) / total;
        const radius = 200; // Distance from center
        return {
            x: Math.cos(angle) * radius,
            y: Math.sin(angle) * radius,
            angle: angle
        };
    }

    attemptDestroyLimb(typedWord) {
        this.totalAttempts++;

        // Find matching limb
        const limbIndex = this.limbs.findIndex(limb =>
            !limb.destroyed && limb.word.toLowerCase() === typedWord.toLowerCase()
        );

        if (limbIndex !== -1) {
            this.limbs[limbIndex].destroyed = true;
            this.destroyedLimbs++;
            this.successfulHits++;
            return {
                success: true,
                limb: this.limbs[limbIndex],
                allDestroyed: this.destroyedLimbs === this.limbs.length
            };
        } else {
            // Typo penalty
            this.perfectBoss = false;
            this.missedAttempts++;
            this.timeRemaining = Math.max(this.minDuration, this.timeRemaining - this.typoPenalty);
            return {
                success: false,
                limb: null,
                allDestroyed: false
            };
        }
    }

    updateTimer() {
        if (!this.active || !this.startTime) return true;

        const elapsed = Date.now() - this.startTime;
        this.timeRemaining = Math.max(0, this.duration - elapsed);

        if (this.timeRemaining <= 0) {
            return false; // Timer expired
        }

        return true; // Timer still running
    }

    getActiveLimbs() {
        return this.limbs.filter(limb => !limb.destroyed);
    }

    // ========== SPECIAL MOVE SYSTEM ==========

    shouldTriggerSpecialMove() {
        const activeLimbs = this.getActiveLimbs().length;
        // Trigger when exactly 1 limb remains (final limb = ultimate attack!)
        return activeLimbs === 1 && !this.specialMoveTriggered;
    }

    validateSpecialChant(input) {
        if (!this.specialMoveActive || !this.currentBoss) {
            return {
                valid: false,
                progress: 0,
                totalLength: 0,
                isComplete: false,
                hasError: false,
                errorIndex: -1
            };
        }

        const targetChant = this.currentBoss.specialMoveChant.toLowerCase();
        const normalizedInput = input.toLowerCase();

        // Check character by character for real-time feedback
        let correctChars = 0;
        let hasError = false;
        let errorIndex = -1;

        for (let i = 0; i < normalizedInput.length; i++) {
            if (i < targetChant.length && normalizedInput[i] === targetChant[i]) {
                correctChars++;
            } else {
                // Found first wrong character
                hasError = true;
                errorIndex = i;
                break;
            }
        }

        // Valid if all typed characters are correct (even if not complete)
        const allTypedCorrect = correctChars === normalizedInput.length && normalizedInput.length > 0;
        const isComplete = allTypedCorrect && normalizedInput.length === targetChant.length;

        return {
            valid: allTypedCorrect,
            progress: correctChars,
            totalLength: targetChant.length,
            isComplete: isComplete,
            targetChant: targetChant,
            hasError: hasError,
            errorIndex: errorIndex,
            inputLength: normalizedInput.length
        };
    }

    attemptSpecialDefense(chant) {
        if (!this.specialMoveActive) return { success: false, reason: 'no_special_move' };
        if (this.defenseAttempted) return { success: false, reason: 'already_attempted' };

        this.defenseAttempted = true;
        const normalizedChant = chant.toLowerCase().trim();
        const targetChant = this.currentBoss.specialMoveChant.toLowerCase();

        // Check if chant matches exactly
        if (normalizedChant === targetChant) {
            this.defenseSuccessful = true;
            this.attacksBlocked++;
            this.specialMoveBlocked = true;

            // Cancel special attack
            this.specialMoveActive = false;
            this.lastAttackTime = Date.now();

            console.log('[SPECIAL MOVE] Chant successful! Special attack blocked!');

            return {
                success: true,
                chantType: 'special',
                score: 100 // Bonus for blocking special move
            };
        }

        console.log('[SPECIAL MOVE] Chant failed!');
        return { success: false, reason: 'wrong_chant' };
    }

    getSpecialMoveName() {
        return this.currentBoss ? this.currentBoss.specialMoveName : 'ULTIMATE ATTACK';
    }

    getSpecialMoveChant() {
        return this.currentBoss ? this.currentBoss.specialMoveChant : '';
    }

    getSpecialMoveDamage() {
        return this.currentBoss ? this.currentBoss.specialMoveDamage : 40;
    }

    // ========== END SPECIAL MOVE SYSTEM ==========

    calculateScore() {
        const limbScore = this.destroyedLimbs * 100;

        // Accuracy multiplier
        const accuracy = this.totalAttempts > 0 ? this.successfulHits / this.totalAttempts : 1;
        const accuracyMultiplier = Math.pow(accuracy, 2);

        // Time bonus (remaining seconds × 10)
        const timeBonus = Math.floor(this.timeRemaining / 1000) * 10;

        // Base completion bonus
        const completionBonus = this.destroyedLimbs === this.limbs.length ? 500 : 0;

        // Perfect bonus (no mistakes)
        const perfectBonus = this.perfectBoss && completionBonus > 0 ? 500 : 0;

        // Speed bonus (faster = more points)
        const timeTaken = (this.duration - this.timeRemaining) / 1000;
        const speedBonus = this.destroyedLimbs === this.limbs.length ?
            Math.floor((45 - timeTaken) * 20) : 0;

        // Defense bonus (blocks/dodges)
        const defenseBonus = this.attacksBlocked * 50;

        // Perfect defense bonus (no damage taken)
        const perfectDefenseBonus = this.noDamageTaken && completionBonus > 0 ? 500 : 0;

        const totalScore = Math.floor(
            (limbScore * accuracyMultiplier) +
            timeBonus +
            completionBonus +
            perfectBonus +
            speedBonus +
            defenseBonus +
            perfectDefenseBonus
        );

        return {
            limbScore,
            accuracy,
            accuracyMultiplier,
            timeBonus,
            completionBonus,
            perfectBonus,
            speedBonus,
            defenseBonus,
            perfectDefenseBonus,
            totalScore,
            limbsDestroyed: this.destroyedLimbs,
            totalLimbs: this.limbs.length,
            timeTaken: Math.floor(timeTaken),
            perfectBoss: this.perfectBoss,
            noDamageTaken: this.noDamageTaken,
            attacksBlocked: this.attacksBlocked,
            totalAttacks: this.totalAttacks
        };
    }

    reset() {
        this.active = false;
        this.countdownActive = false;
        this.currentBoss = null;
        this.limbs = [];
        this.destroyedLimbs = 0;
        this.wordsSinceBoss = 0;
        this.timeRemaining = this.duration;
        this.startTime = null;
        this.totalAttempts = 0;
        this.successfulHits = 0;
        this.missedAttempts = 0;
        this.perfectBoss = true;

        // Reset HP system
        this.currentHP = this.maxHP;
        this.noDamageTaken = true;

        // Reset attack system
        this.lastAttackTime = null;
        this.attackWarningActive = false;
        this.attackWarningStart = null;
        this.attackingLimb = null;
        this.totalAttacks = 0;
        this.attacksBlocked = 0;
        this.damageDealt = 0;

        // Reset special move system
        this.specialMoveTriggered = false;
        this.specialMoveActive = false;
        this.currentSpecialChant = '';
        this.specialMoveBlocked = false;
    }

    getRandomBossType() {
        const types = Object.keys(this.bossTypes);
        return types[Math.floor(Math.random() * types.length)];
    }

    getBossTheme() {
        return this.currentBoss ? this.currentBoss.theme : 'tech';
    }

    getBossColor() {
        return this.currentBoss ? this.currentBoss.color : '#00ff41';
    }

    getBossName() {
        return this.currentBoss ? this.currentBoss.name : 'UNKNOWN TYRANT';
    }

    getTimeRemainingSeconds() {
        return Math.ceil(this.timeRemaining / 1000);
    }

    getProgress() {
        return this.limbs.length > 0 ? (this.destroyedLimbs / this.limbs.length) * 100 : 0;
    }

    // ========== ATTACK SYSTEM ==========

    updateAttackSystem() {
        if (!this.active) return null;

        const now = Date.now();

        // Check for special move trigger first (when 1 limb remains)
        if (this.shouldTriggerSpecialMove() && !this.specialMoveActive && !this.attackWarningActive) {
            console.log('[SPECIAL MOVE] Triggering special move! 1 limb remaining!');
            this.specialMoveTriggered = true;
            this.specialMoveActive = true;
            this.attackWarningActive = true;
            this.attackWarningStart = now;
            this.defenseAttempted = false;
            this.defenseSuccessful = false;
            this.currentSpecialChant = this.currentBoss.specialMoveChant;

            return {
                warning: true,
                isSpecialMove: true,
                specialMoveName: this.getSpecialMoveName(),
                specialMoveChant: this.getSpecialMoveChant(),
                timeRemaining: this.specialMoveWarningDuration,
                attackColor: this.currentBoss.specialMoveColor
            };
        }

        // Check if warning is active (normal or special)
        if (this.attackWarningActive) {
            const warningElapsed = now - this.attackWarningStart;
            const effectiveDuration = this.specialMoveActive ? this.specialMoveWarningDuration : this.attackWarningDuration;

            if (warningElapsed >= effectiveDuration) {
                // Warning period over - execute attack if not defended
                return this.executeAttack();
            }

            // Still in warning period
            if (this.specialMoveActive) {
                // Special move warning
                return {
                    warning: true,
                    isSpecialMove: true,
                    specialMoveName: this.getSpecialMoveName(),
                    specialMoveChant: this.getSpecialMoveChant(),
                    timeRemaining: this.specialMoveWarningDuration - warningElapsed,
                    attackColor: this.currentBoss.specialMoveColor
                };
            } else {
                // Normal attack warning
                return {
                    warning: true,
                    timeRemaining: this.attackWarningDuration - warningElapsed,
                    limbId: this.attackingLimb?.id,
                    defenseWord: this.currentDefenseWord
                };
            }
        }

        // Check if it's time for a new attack
        const timeSinceLastAttack = now - this.lastAttackTime;
        const currentInterval = this.getAttackInterval();

        if (timeSinceLastAttack >= currentInterval) {
            // Start new attack warning (normal only, special is handled above)
            return this.startAttackWarning();
        }

        return null;
    }

    startAttackWarning() {
        const activeLimbs = this.getActiveLimbs();
        if (activeLimbs.length === 0) return null;

        // Pick random limb to attack
        this.attackingLimb = activeLimbs[Math.floor(Math.random() * activeLimbs.length)];

        // Pick random defense word
        this.currentDefenseWord = this.defenseWords[Math.floor(Math.random() * this.defenseWords.length)];

        this.attackWarningActive = true;
        this.attackWarningStart = Date.now();
        this.defenseAttempted = false;
        this.defenseSuccessful = false;

        return {
            warning: true,
            timeRemaining: this.attackWarningDuration,
            limbId: this.attackingLimb.id,
            attackName: this.currentBoss.attackName,
            defenseWord: this.currentDefenseWord
        };
    }

    attemptDefense(word) {
        if (!this.attackWarningActive) return { success: false, reason: 'no_attack' };
        if (this.defenseAttempted) return { success: false, reason: 'already_attempted' };

        this.defenseAttempted = true;
        const normalizedWord = word.toLowerCase().trim();

        // Check if it matches the current defense word
        if (normalizedWord === this.currentDefenseWord.toLowerCase()) {
            this.defenseSuccessful = true;
            this.attacksBlocked++;

            // Cancel attack
            this.attackWarningActive = false;
            this.attackingLimb = null;
            this.lastAttackTime = Date.now();

            return {
                success: true,
                defenseType: normalizedWord,
                score: 50
            };
        }

        return { success: false, reason: 'wrong_word' };
    }

    validateDefenseInput(input) {
        if (!this.attackWarningActive || !this.currentDefenseWord) {
            return { valid: false, progress: 0 };
        }

        const normalizedInput = input.toLowerCase();
        const targetWord = this.currentDefenseWord.toLowerCase();

        // Check character by character
        let correctChars = 0;
        for (let i = 0; i < normalizedInput.length; i++) {
            if (i < targetWord.length && normalizedInput[i] === targetWord[i]) {
                correctChars++;
            } else {
                break; // Stop at first wrong character
            }
        }

        return {
            valid: correctChars === normalizedInput.length && normalizedInput.length > 0,
            progress: correctChars,
            totalLength: targetWord.length,
            isComplete: correctChars === targetWord.length && normalizedInput.length === targetWord.length
        };
    }

    validateLimbInput(input) {
        if (!this.active || this.limbs.length === 0) {
            return { valid: false, progress: 0, matchedLimb: null };
        }

        const normalizedInput = input.toLowerCase();

        // Find the best matching active limb
        let bestMatch = null;
        let maxProgress = 0;

        for (const limb of this.limbs) {
            if (limb.destroyed) continue;

            const targetWord = limb.word.toLowerCase();
            let correctChars = 0;

            // Check character by character
            for (let i = 0; i < normalizedInput.length; i++) {
                if (i < targetWord.length && normalizedInput[i] === targetWord[i]) {
                    correctChars++;
                } else {
                    break; // Stop at first wrong character
                }
            }

            // Track the limb with most progress
            if (correctChars > maxProgress) {
                maxProgress = correctChars;
                bestMatch = {
                    limb: limb,
                    progress: correctChars,
                    totalLength: targetWord.length,
                    isComplete: correctChars === targetWord.length && normalizedInput.length === targetWord.length
                };
            }
        }

        if (bestMatch) {
            return {
                valid: bestMatch.progress === normalizedInput.length && normalizedInput.length > 0,
                progress: bestMatch.progress,
                totalLength: bestMatch.totalLength,
                isComplete: bestMatch.isComplete,
                matchedLimb: bestMatch.limb
            };
        }

        return { valid: false, progress: 0, matchedLimb: null };
    }

    getCurrentDefenseWord() {
        return this.currentDefenseWord;
    }

    executeAttack() {
        this.totalAttacks++;
        this.attackWarningActive = false;

        let damage = 0;
        const isSpecial = this.specialMoveActive;

        let attackResult = {
            attacked: true,
            defended: this.defenseSuccessful,
            damage: 0,
            isSpecialMove: isSpecial,
            attackName: isSpecial ? this.getSpecialMoveName() : this.currentBoss.attackName,
            attackColor: isSpecial ? this.currentBoss.specialMoveColor : this.currentBoss.attackColor
        };

        if (!isSpecial) {
            // Normal attack
            attackResult.limbId = this.attackingLimb?.id;
        }

        if (!this.defenseSuccessful) {
            // Player takes damage
            damage = isSpecial ? this.getSpecialMoveDamage() : this.currentBoss.attackDamage;
            this.takeDamage(damage);
            attackResult.damage = damage;

            if (isSpecial) {
                console.log(`[SPECIAL MOVE] Hit! Dealing ${damage} damage (2 hearts)`);
            }
        } else {
            if (isSpecial) {
                console.log('[SPECIAL MOVE] Blocked! Chant was successful!');
            }
        }

        // Clean up special move state
        if (isSpecial) {
            this.specialMoveActive = false;
            console.log('[SPECIAL MOVE] Ended');
        }

        this.attackingLimb = null;
        this.lastAttackTime = Date.now();

        return attackResult;
    }

    takeDamage(amount) {
        const oldHP = this.currentHP;
        const oldHearts = this.getHearts();
        this.currentHP = Math.max(0, this.currentHP - amount);
        const newHearts = this.getHearts();
        console.log(`[BOSS DAMAGE] Took ${amount} damage (1 ❤️): ${oldHearts} → ${newHearts} hearts (${oldHP} → ${this.currentHP} HP)`);
        this.damageDealt += amount;
        this.noDamageTaken = false;
        this.perfectBoss = false;
    }

    getAttackInterval() {
        const activeLimbs = this.getActiveLimbs().length;

        // Attack frequency increases as limbs are destroyed
        if (activeLimbs >= 6) return 8000;  // 8 seconds
        if (activeLimbs >= 4) return 6000;  // 6 seconds
        if (activeLimbs >= 2) return 4000;  // 4 seconds
        return 2000; // 2 seconds (desperate!)
    }

    // HP getters
    getCurrentHP() {
        return this.currentHP;
    }

    getMaxHP() {
        return this.maxHP;
    }

    getHearts() {
        return Math.ceil(this.currentHP / this.hpPerHeart);
    }

    isDead() {
        return this.currentHP <= 0;
    }

    getAttackStats() {
        return {
            totalAttacks: this.totalAttacks,
            attacksBlocked: this.attacksBlocked,
            damageDealt: this.damageDealt,
            noDamageTaken: this.noDamageTaken
        };
    }

    getAttackName() {
        return this.currentBoss ? this.currentBoss.attackName : 'Attack';
    }

    getAttackColor() {
        return this.currentBoss ? this.currentBoss.attackColor : '#ff0000';
    }
}
