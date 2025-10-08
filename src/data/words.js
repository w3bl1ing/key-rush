const WordManager = {
    powerUpWords: {
        speed: {
            easy: ['run', 'fast', 'go', 'rush', 'zoom', 'dash'],
            medium: ['speed', 'quick', 'boost', 'sprint', 'rapid'],
            hard: ['velocity', 'accelerate', 'momentum', 'propulsion'],
            expert: ['acceleration', 'instantaneous', 'hypersonic']
        },
        timeWarp: {
            easy: ['slow', 'stop', 'wait', 'pause', 'hold'],
            medium: ['freeze', 'delay', 'halt', 'stall'],
            hard: ['decelerate', 'suspend', 'temporal'],
            expert: ['chronostasis', 'timewarp', 'deceleration']
        },
        shield: {
            easy: ['safe', 'hide', 'cover', 'block', 'guard'],
            medium: ['shield', 'protect', 'defend', 'armor'],
            hard: ['protection', 'defensive', 'fortified'],
            expert: ['invulnerable', 'impenetrable', 'reinforcement']
        },
        multiplier: {
            easy: ['big', 'more', 'plus', 'mega', 'max'],
            medium: ['power', 'super', 'ultra', 'bonus'],
            hard: ['amplify', 'enhance', 'multiply'],
            expert: ['exponential', 'magnification', 'intensification']
        },
        laserFocus: {
            easy: ['aim', 'hit', 'lock', 'focus', 'sharp'],
            medium: ['target', 'precise', 'accurate'],
            hard: ['precision', 'calibrated', 'concentrated'],
            expert: ['pinpoint', 'meticulous', 'unerring']
        },
        freeze: {
            easy: ['freeze', 'stop', 'ice', 'cold', 'chill'],
            medium: ['frozen', 'arctic', 'glacial', 'rigid'],
            hard: ['cryogenic', 'absolute', 'suspended'],
            expert: ['crystallized', 'immobilized', 'stagnation']
        }
    },

    wordLists: {
        easy: [
            'cat', 'dog', 'jump', 'code', 'game', 'play', 'type',
            'red', 'blue', 'green', 'white', 'black', 'light', 'dark', 'small', 'good',
            'bad', 'hot', 'cold', 'new', 'old', 'yes', 'no', 'move'
        ],
        medium: [
            'keyboard', 'mouse', 'screen', 'window', 'button', 'finger', 'typing', 'player', 'points', 'score',
            'branch', 'switch', 'active', 'smooth', 'scroll', 'canvas', 'render', 'update',
            'function', 'object', 'array', 'string', 'number', 'boolean', 'return', 'value', 'method', 'class'
        ],
        hard: [
            'javascript', 'development', 'programming', 'algorithm', 'performance', 'optimization', 'responsive', 'animation',
            'framework', 'library', 'component', 'interface', 'implementation', 'architecture', 'debugging', 'testing',
            'deployment', 'repository', 'configuration', 'documentation', 'accessibility', 'compatibility', 'synchronous',
            'asynchronous', 'callback', 'promise', 'constructor', 'prototype', 'inheritance', 'polymorphism'
        ],
        expert: [
            'polymorphism', 'encapsulation', 'abstraction', 'instantiation', 'serialization',
            'deserialization', 'authentication', 'authorization', 'refactoring', 'architecture',
            'microservices', 'containerization', 'orchestration', 'scalability', 'maintainability', 'testability',
            'observability', 'sustainability', 'interoperability', 'compatibility', 'accessibility', 'usability'
        ]
    },

    bossWords: {
        tech: [
            'virus', 'malware', 'exploit', 'breach', 'firewall', 'packet', 'protocol', 'buffer',
            'overflow', 'injection', 'trojan', 'rootkit', 'backdoor', 'phishing', 'encryption',
            'decrypt', 'hash', 'kernel', 'payload', 'shellcode', 'zombie', 'botnet'
        ],
        programming: [
            'exception', 'null', 'undefined', 'syntax', 'runtime', 'compile', 'debug',
            'stack', 'heap', 'pointer', 'reference', 'memory', 'leak', 'segfault',
            'deadlock', 'recursion', 'infinite', 'loop', 'overflow', 'underflow'
        ],
        errors: [
            'fatal', 'critical', 'warning', 'deprecated', 'invalid', 'timeout', 'refused',
            'forbidden', 'unauthorized', 'conflict', 'corrupted', 'missing', 'broken',
            'failed', 'crashed', 'terminated', 'aborted', 'rejected', 'denied'
        ],
        debugging: [
            'breakpoint', 'watchpoint', 'backtrace', 'stacktrace', 'assertion', 'verbose',
            'trace', 'inspect', 'evaluate', 'profile', 'benchmark', 'monitor', 'analyze',
            'diagnose', 'examine', 'investigate', 'troubleshoot', 'resolve', 'patch', 'hotfix'
        ]
    },

    frenzySentences: {
        programming: [
            "The asynchronous function returned a promise that resolved with the encrypted authentication token from the secure database connection",
            "Advanced machine learning algorithms processed massive datasets to optimize neural network performance across distributed computing systems efficiently",
            "The microservices architecture implemented containerized applications using kubernetes orchestration for scalable cloud deployment and automated testing",
            "Real-time data streaming pipelines processed millions of events through apache kafka clusters with high availability and fault tolerance",
            "The responsive web application utilized modern frameworks with component-based architecture for enhanced user experience and performance optimization"
        ],
        cyberpunk: [
            "The legendary cyberpunk warrior navigated through neon-lit corridors while dodging laser beams and collecting mysterious power crystals",
            "In the dystopian megacity chrome towers pierced the smog-filled sky as hackers infiltrated corporate networks through neural interfaces",
            "The rogue android escaped from the underground laboratory carrying classified data chips worth millions of credits on the black market",
            "Neon advertisements flickered across rain-soaked streets where augmented humans traded illegal software modifications in shadowy alleyways beneath towering skyscrapers",
            "The quantum encryption protocol protected sensitive corporate secrets from rival hackers attempting to breach the secured neural network databases"
        ],
        gaming: [
            "The epic boss battle required precise timing and strategic positioning to defeat the ancient dragon guardian protecting the legendary artifact",
            "Players explored vast open worlds filled with hidden treasures challenging quests and dangerous monsters lurking in mysterious dungeons",
            "The multiplayer tournament featured intense combat sequences with spectacular visual effects and dynamic environmental interactions throughout the arena",
            "Advanced character progression systems allowed players to customize abilities unlock new skills and equip powerful weapons for challenging encounters",
            "The immersive virtual reality experience transported players into fantastical realms where magic and technology collided in breathtaking adventures"
        ],
        space: [
            "The interstellar spacecraft navigated through asteroid fields using advanced propulsion systems while avoiding hostile alien patrol vessels in deep space",
            "Galactic explorers discovered ancient civilizations on distant planets containing mysterious artifacts with unknown technological capabilities and energy signatures",
            "The space station orbited a binary star system collecting valuable research data about quantum physics and gravitational anomalies",
            "Advanced terraforming equipment transformed barren worlds into habitable colonies supporting millions of settlers from overpopulated home planets",
            "The faster-than-light communication array transmitted critical intelligence across multiple star systems coordinating defense against the approaching invasion fleet"
        ]
    },

    currentDifficulty: 'easy',
    wordsCompleted: 0,
    currentPair: { 
        branch1: 'loading', 
        branch2: 'please',
        powerUps: { branch1: null, branch2: null }
    },

    getDifficultyByScore(score) {
        if (score < 20) return 'easy';
        if (score < 50) return 'medium';
        if (score < 100) return 'hard';
        return 'expert';
    },

    getRandomWord(difficulty = this.currentDifficulty) {
        const words = this.wordLists[difficulty];
        return words[Math.floor(Math.random() * words.length)];
    },

    getRandomPowerUpWord(difficulty = this.currentDifficulty) {
        const powerUpTypes = Object.keys(this.powerUpWords);
        const randomType = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
        const words = this.powerUpWords[randomType][difficulty];
        const word = words[Math.floor(Math.random() * words.length)];
        
        return {
            word: word,
            type: randomType,
            rarity: this.getPowerUpRarity()
        };
    },

    getPowerUpRarity() {
        const rand = Math.random();
        if (rand < 0.05) return 'epic';
        if (rand < 0.25) return 'rare';
        return 'common';
    },

    getWordPowerUp(word) {
        for (const [powerUpType, difficulties] of Object.entries(this.powerUpWords)) {
            for (const [difficulty, wordList] of Object.entries(difficulties)) {
                if (wordList.includes(word.toLowerCase())) {
                    return {
                        type: powerUpType,
                        rarity: this.getPowerUpRarity(),
                        difficulty: difficulty
                    };
                }
            }
        }
        return null;
    },

    generateWordPair(score = 0) {
        this.currentDifficulty = this.getDifficultyByScore(score);
        
        // 60% chance for power-up words, 40% regular words
        const usePowerUp1 = Math.random() < 0.6;
        const usePowerUp2 = Math.random() < 0.6;
        
        let word1, word2, powerUp1 = null, powerUp2 = null;
        
        if (usePowerUp1) {
            const powerUpData1 = this.getRandomPowerUpWord();
            word1 = powerUpData1.word;
            powerUp1 = { type: powerUpData1.type, rarity: powerUpData1.rarity };
        } else {
            word1 = this.getRandomWord();
        }
        
        if (usePowerUp2) {
            const powerUpData2 = this.getRandomPowerUpWord();
            word2 = powerUpData2.word;
            powerUp2 = { type: powerUpData2.type, rarity: powerUpData2.rarity };
        } else {
            word2 = this.getRandomWord();
        }
        
        // Ensure words are different
        while (word2 === word1) {
            if (usePowerUp2) {
                const powerUpData2 = this.getRandomPowerUpWord();
                word2 = powerUpData2.word;
                powerUp2 = { type: powerUpData2.type, rarity: powerUpData2.rarity };
            } else {
                word2 = this.getRandomWord();
            }
        }

        this.currentPair = {
            branch1: word1,
            branch2: word2,
            powerUps: { 
                branch1: powerUp1, 
                branch2: powerUp2 
            }
        };

        return this.currentPair;
    },

    getNextWordPair(score = 0) {
        this.wordsCompleted++;
        return this.generateWordPair(score);
    },

    validateWord(inputWord, targetWord) {
        return inputWord.toLowerCase().trim() === targetWord.toLowerCase().trim();
    },

    getPartialMatch(inputWord, targetWord) {
        const input = inputWord.toLowerCase();
        const target = targetWord.toLowerCase();
        
        let correctChars = 0;
        for (let i = 0; i < Math.min(input.length, target.length); i++) {
            if (input[i] === target[i]) {
                correctChars++;
            } else {
                break;
            }
        }
        
        return {
            correct: correctChars,
            total: target.length,
            isComplete: correctChars === target.length && input.length === target.length,
            hasError: input.length > correctChars
        };
    },

    getCurrentDifficulty() {
        return this.currentDifficulty;
    },

    getDifficultyColor() {
        const colors = {
            easy: '#00ff41',
            medium: '#ffaa00', 
            hard: '#ff6600',
            expert: '#ff4444'
        };
        return colors[this.currentDifficulty] || '#00ff41';
    },

    getStats() {
        return {
            wordsCompleted: this.wordsCompleted,
            currentDifficulty: this.currentDifficulty,
            currentPair: this.currentPair
        };
    },

    generateFrenzySentence() {
        const themes = Object.keys(this.frenzySentences);
        const randomTheme = themes[Math.floor(Math.random() * themes.length)];
        const sentences = this.frenzySentences[randomTheme];
        const randomSentence = sentences[Math.floor(Math.random() * sentences.length)];

        return {
            sentence: randomSentence,
            theme: randomTheme,
            words: randomSentence.split(' ')
        };
    },

    generateBossWords(theme, count) {
        const words = this.bossWords[theme] || this.bossWords.tech;
        const selectedWords = [];
        const availableWords = [...words]; // Copy array to avoid modifying original

        for (let i = 0; i < count && availableWords.length > 0; i++) {
            const randomIndex = Math.floor(Math.random() * availableWords.length);
            selectedWords.push(availableWords[randomIndex]);
            availableWords.splice(randomIndex, 1); // Remove to avoid duplicates
        }

        return selectedWords;
    },

    reset() {
        this.wordsCompleted = 0;
        this.currentDifficulty = 'easy';
        this.currentPair = this.generateWordPair(0);
    }
};