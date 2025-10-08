# Key Rush 🎮⌨️

A cyberpunk-themed typing side-scroller where players race against a scrolling danger wall by typing words strategically. Featuring explosive power-ups, a dynamic fever system, epic boss battles, intense frenzy mode challenges, and spectacular visual effects.

## 🎯 Game Overview

**Key Rush** is a fast-paced typing game that combines traditional typing mechanics with side-scrolling action gameplay. Players must type words quickly and strategically to stay ahead of a deadly wall that scrolls from left to right. The game features a cyberpunk aesthetic with neon colors, particle effects, and dramatic power-up animations.

### Core Concept
- **Danger Wall**: A scrolling wall chases the player from the left side of the screen
- **Safe Zone**: The right side of the screen provides safety and score multipliers
- **Strategic Typing**: Choose between two word branches using TAB key for tactical advantage
- **Power-Up System**: Special words grant temporary abilities with visual spectacle
- **Fever Mechanics**: Performance-based scoring system with explosive rewards
- **Boss Battles**: Epic encounters every 12 words with typing tyrants (4 unique bosses)
- **Frenzy Mode**: Intense 30-second sentence typing challenges every 5 words

## 🚀 Key Features

### 🌊 Scrolling Wall Mechanics
- Constantly scrolling danger wall creates urgency and pressure
- Player position dynamically changes based on typing speed and accuracy
- Left side = DANGER zone, Right side = SAFE zone with score bonuses

### 🎮 Strategic Word Selection
- **Dual Branch System**: Two words always available simultaneously
- **TAB Switching**: Instantly switch between word options for tactical advantage
- **Power-Up Words**: Special themed words grant temporary abilities
- **Difficulty Progression**: Words get harder as score increases (Easy → Medium → Hard → Expert)

### 🔥 Fever System
Dynamic heat-building system that rewards consistent performance:
- **Cool** (1.0× multiplier) → **Warm** (1.2×) → **Hot** (1.5×) → **Blazing** (2.0×) → **FEVER RUSH!** (3.0×)
- Heat gained from: Fast typing, staying in safe zone, maintaining combos
- Heat lost from: Errors, staying in danger zone, inactivity
- **Fever Rush Mode**: 10-second window with maximum multipliers

### ⚡ Power-Up System
Six distinct power-ups with unique effects and visual spectacle:

| Power-Up | Icon | Effect | Description |
|----------|------|--------|-------------|
| **Speed** | ⚡ | Movement boost | Increases forward movement speed |
| **Freeze** | ❄️ | Stop scrolling | Completely halts danger wall with explosive animation |
| **Shield** | 🛡️ | Error protection | Prevents typing errors from causing backward movement |
| **Multiplier** | 💎 | Score doubling | Doubles score for next 3 words |
| **TimeWarp** | 🌀 | Slow motion | Reduces scrolling speed by 50% |
| **LaserFocus** | 🎯 | Error immunity | Converts typing errors into forward movement |

### 🎯 Frenzy Mode
High-intensity sentence typing challenge that tests speed and accuracy:

**Trigger**: Every 5 words completed
**Duration**: 30 seconds with continuous countdown
**Challenge**: Type an entire themed sentence word-by-word

**Mechanics:**
- **Snake-Style Display**: Words appear in a flowing chain visualization
- **Time Pressure**: Continuous 30-second countdown (no pause)
- **Error Penalty**: -2 seconds per wrong character (debounced to 500ms)
- **Real-Time Metrics**: Live WPM and accuracy tracking
- **Performance-Based Scoring**: Bonus based on speed, accuracy, and completion
- **Immediate Start**: No countdown delay - jump straight into typing

**Controls:**
- Type current word accurately
- **SPACE**: Advance to next word
- **BACKSPACE**: Correct mistakes in current word

**Scoring Rewards:**
- Completion bonus for finishing all words
- Speed bonus for fast completion
- Accuracy multiplier for perfect typing
- Perfect word streak bonuses

### ⚔️ Boss Battle System
Epic encounters with typing tyrants that require strategic limb destruction:

**Trigger**: Every 12 words (does not conflict with Frenzy Mode at 5 words)
**Duration**: 45 seconds to defeat the boss
**Objective**: Destroy all limbs by typing their words

#### Boss Types

| Boss | Limbs | Theme | Special Move | Chant |
|------|-------|-------|--------------|-------|
| **GLITCH SPIDER** 🕷️ | 6 | Tech/Malware | Corrupted Web Prison | *"break the protocol and purge the virus"* |
| **CODE HYDRA** 🐉 | 5 | Programming | Infinite Recursion | *"return to base case and escape the loop"* |
| **SYNTAX GOLEM** 🤖 | 4 | Errors | Fatal Exception | *"catch the error and handle gracefully"* |
| **BUG KRAKEN** 🐙 | 8 | Debugging | Memory Leak Tsunami | *"garbage collect and free the heap"* |

#### Combat Mechanics

**Limb Destruction:**
- Type any visible limb word to destroy it instantly (auto-submit when complete)
- Matching limbs glow GREEN as you type
- All limbs must be destroyed within 45 seconds
- Typos subtract 3 seconds from timer

**Boss Attacks:**
- **Normal Attacks**: Boss attacks every 6-8 seconds
  - 2.5-second warning with defense word prompt
  - Type short defense word (defend, block, dodge, etc.) to block
  - Blocked attacks: No damage
  - Failed defense: -1 ❤️ heart damage

- **Special Moves**: Triggered when exactly 1 limb remains
  - 12-second warning with long chant prompt
  - Type complete chant to block ultimate attack
  - Blocked special: No damage
  - Failed special: -3 ❤️ hearts damage (devastating!)

**HP System:**
- Player has 5 ❤️ hearts (100 HP total)
- Normal attack: -1 heart (20 damage)
- Special move: -3 hearts (60 damage)
- Reach 0 hearts = Defeated by boss
- Input auto-clears after taking damage

**Victory Conditions:**
- **Victory**: Destroy all limbs before timer expires
- **Timeout**: Boss escapes if timer reaches 0
- **Defeat**: Boss wins if player loses all hearts

**Scoring Rewards:**
- Limb destruction points
- Time bonus (remaining seconds × 10)
- Perfect bonus (no mistakes)
- Defense bonus (successful blocks × 50)
- Perfect defense bonus (no damage taken)

### 🎨 Visual Effects System
- **Freeze Power-Up**: Screen flash, exploding "FROZEN!" text, 15 ice particles, screen shake
- **Fever Meter**: Massive centered display with dynamic scaling and glow effects
- **Real-time Feedback**: Letter-by-letter typing validation with color coding
- **Cyberpunk Aesthetics**: Neon gradients, particle effects, glowing text shadows
- **Canvas Rendering**: 60fps background effects and particle systems

## 🎮 Controls

### Normal Mode
| Input | Action |
|-------|--------|
| **Typing** | Type the highlighted words to move forward |
| **TAB** | Switch between word branches for strategic selection |
| **ENTER / SPACE** | Start game or restart after game over |

### Frenzy Mode
| Input | Action |
|-------|--------|
| **Typing** | Type current word accurately |
| **SPACE** | Advance to next word after completing current word |
| **BACKSPACE** | Correct mistakes in current word |

### Boss Battle Mode
| Input | Action |
|-------|--------|
| **Typing** | Type limb words to destroy them (auto-submits when complete) |
| **Typing** | Type defense words during attack warnings to block damage |
| **Typing** | Type special move chants to block ultimate attacks |

## 📊 Scoring System

### Position-Based Multipliers
- **Danger Zone** (Left): 1.0× base score
- **Safe Zone** (Right): Up to 1.5× position bonus

### Fever System Multipliers
- **Cool**: 1.0× (base)
- **Warm**: 1.2× 
- **Hot**: 1.5×
- **Blazing**: 2.0×
- **FEVER RUSH**: 3.0×

### Final Score Calculation
`Base Points × Position Multiplier × Fever Multiplier × Power-up Effects`

## 🛠️ Technical Implementation

### Technology Stack
- **Frontend**: Pure HTML5, CSS3, Vanilla JavaScript (ES6+)
- **Rendering**: HTML5 Canvas API for particle effects and backgrounds
- **Performance**: 60fps game loop with delta time calculations
- **Styling**: Advanced CSS animations with keyframes and transforms

### Architecture
```
Key Rush/
├── index.html                   # Main game structure and UI layout
├── src/
│   ├── game.js                  # Core game engine and mechanics
│   ├── systems/
│   │   └── BossSystem.js        # Boss battle mechanics and AI
│   ├── data/
│   │   └── words.js             # Word lists and power-up word management
│   └── assets/
│       └── style.css            # Cyberpunk styling and animation definitions
├── tests/                       # Test suite for game systems
├── game.js                      # Legacy game file (root)
├── words.js                     # Legacy words file (root)
├── style.css                    # Legacy styles file (root)
└── README.md                    # This documentation file
```

### Core Classes
- **`TypingGame`**: Main game controller and state management
- **`PowerUpSystem`**: Manages active power-ups and effects
- **`FeverSystem`**: Heat generation, decay, and level calculations
- **`WordManager`**: Word pair generation and validation
- **`BossSystem`**: Boss encounters, attacks, and special moves
- **`FrenzyMode`**: Sentence typing challenge mechanics

### Performance Optimizations
- Efficient particle systems with limited counts (15 particles max)
- Delta time-based animations for smooth 60fps
- CSS hardware acceleration for transforms and effects
- Minimal DOM manipulation during gameplay

## 🎨 Theme & Aesthetics

### Cyberpunk Design Language
- **Color Palette**: Electric cyan (#00ffff), hot magenta (#ff00ff), neon yellow (#ffff00)
- **Typography**: 'Orbitron' font family with glowing text shadows
- **Visual Effects**: Radial gradients, particle systems, screen shake, lens flares
- **UI Design**: Futuristic HUD with backdrop blur and neon borders

### Animation Philosophy  
- **Impact over Duration**: Short, dramatic effects that don't interfere with gameplay
- **Progressive Enhancement**: Visual effects scale with performance (fever levels)
- **Accessibility First**: Keyboard-only controls with clear visual feedback

## 🏗️ Game Balance

### Difficulty Progression
- **Words Per Minute**: Difficulty scales with player WPM performance
- **Score Thresholds**: Easy (0-9) → Medium (10-24) → Hard (25-49) → Expert (50+)
- **Power-Up Frequency**: 60% chance for power-up words vs regular words

### Special Mode Triggers
- **Frenzy Mode**: Triggers every **5 words** completed
- **Boss Battle**: Triggers every **12 words** completed
- **Mode Priority**: Boss battles take priority over Frenzy Mode to prevent overlap
- **No Stacking**: Only one special mode active at a time

### Power-Up Balance
- **Duration Scaling**: Rarity affects duration (Common: 1.0×, Rare: 1.3×, Epic: 1.6×)
- **Cooldown Prevention**: Cannot stack identical power-ups
- **Strategic Trade-offs**: Each power-up has situational advantages

### Boss Battle Balance
- **Timer Penalties**: -3 seconds per typo while destroying limbs
- **Attack Frequency**: Increases as limbs are destroyed (8s → 6s → 4s → 2s intervals)
- **HP Management**: Normal attacks deal 1 heart, special moves deal 3 hearts
- **Defense Windows**: 2.5s for normal attacks, 12s for special moves

### Frenzy Mode Balance
- **Time Pressure**: 30-second base duration with continuous countdown
- **Error Penalty**: -2 seconds per wrong character (debounced to 500ms)
- **Minimum Duration**: Cannot drop below 5 seconds from penalties
- **Completion Reward**: Bonus scaling based on WPM, accuracy, and speed

## 🚀 Future Enhancement Opportunities

### Gameplay Features
- **Achievement System**: Unlock new visual themes and effects
- **Leaderboards**: Local and online high score tracking
- **Additional Boss Types**: Expand beyond the current 4 tyrants
- **Custom Word Lists**: Player-created word sets for practice
- **Difficulty Modes**: Easy/Normal/Hard preset configurations
- **Boss Rush Mode**: Face all bosses consecutively

### Technical Improvements
- **WebGL Rendering**: Enhanced particle effects and 3D backgrounds
- **Audio System**: Dynamic soundtrack and sound effects
- **Mobile Support**: Touch controls and responsive layout
- **Progressive Web App**: Offline play and installation

### Visual Enhancements
- **Shader Effects**: Post-processing filters and screen distortion
- **3D Elements**: Depth-based particle systems and parallax scrolling
- **Theme Variants**: Multiple cyberpunk color schemes
- **Accessibility Options**: Reduced motion and high contrast modes

## 📄 License

This project is open source. Feel free to use, modify, and distribute as needed.

## 🤝 Contributing

Contributions welcome! Focus areas:
- Performance optimizations
- Visual effect enhancements
- New power-up mechanics
- Additional boss types and attack patterns
- New frenzy mode sentence themes
- Accessibility improvements
- Mobile/touch support

---

**Key Rush** - Where typing meets rogue-like action! ⚔️🔥