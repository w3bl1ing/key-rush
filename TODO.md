# Key Rush Roguelike Upgrade - TODO List

## Phase 1: Foundation & Core Systems (Week 1-2)

### 1.1 Project Structure Setup
- [ ] Create `src/` directory structure for better organization
- [ ] Move existing files into organized folders
- [ ] Create `data/` folder for game content
- [ ] Create `systems/` folder for game logic modules
- [ ] Update HTML imports to reflect new structure

### 1.2 Save/Load System
- [ ] Create `SaveManager` class for persistent data
- [ ] Implement localStorage-based save system
- [ ] Add player profile data structure
- [ ] Create backup/restore functionality
- [ ] Add save file versioning for updates

### 1.3 Floor Management Foundation
- [ ] Create `FloorManager` class
- [ ] Implement basic floor progression (1→2→3...)
- [ ] Add floor transition screens
- [ ] Create floor completion detection
- [ ] Add "Next Floor" button functionality

### 1.4 Basic Meta-Progression
- [ ] Create persistent currency system (coins)
- [ ] Add simple permanent upgrades (starting fever, extra lives)
- [ ] Create upgrade purchase UI
- [ ] Implement upgrade effects in gameplay
- [ ] Add upgrade persistence between runs

## Phase 2: Content & Variety (Week 3-4)

### 2.1 Floor Themes System
- [ ] Create floor theme data structure
- [ ] Implement 5 basic themes (Neon City, Data Center, Space Station, etc.)
- [ ] Add theme-specific visual styles
- [ ] Create theme-specific word lists
- [ ] Add theme transition animations

### 2.2 Enhanced Word System
- [ ] Expand word categories (tech, cyber, space, etc.)
- [ ] Add difficulty progression per theme
- [ ] Create themed power-up words
- [ ] Implement word rarity system
- [ ] Add special "boss words" for challenge

### 2.3 Basic Equipment System
- [ ] Create equipment data structure
- [ ] Add 3 equipment slots (keyboard, monitor, chair)
- [ ] Implement 5-10 basic equipment items
- [ ] Add equipment effects (speed boost, fever gain, etc.)
- [ ] Create equipment UI display

### 2.4 Floor Types & Encounters
- [ ] Create different room types (normal, challenge, shop, boss)
- [ ] Implement boss encounters every 5 floors
- [ ] Add challenge rooms with special rules
- [ ] Create shop rooms for equipment/upgrades
- [ ] Add treasure rooms with rare rewards

## Phase 3: Character Progression (Week 5-6)

### 3.1 Character Classes
- [ ] Create 3 base classes (Speed Demon, Accuracy Expert, Power Surger)
- [ ] Add class selection screen
- [ ] Implement class-specific starting bonuses
- [ ] Create class-specific upgrade paths
- [ ] Add visual indicators for active class

### 3.2 Skill Tree System
- [ ] Create skill tree data structure
- [ ] Build skill tree UI component
- [ ] Add 15-20 skills across 3 branches
- [ ] Implement skill point earning system
- [ ] Add skill effects to gameplay

### 3.3 Advanced Power-Up System
- [ ] Add equipment-based power-ups
- [ ] Create synergy effects between items
- [ ] Implement rare/epic power-up variants
- [ ] Add temporary consumable items
- [ ] Create combo-based power-up triggers

### 3.4 Status Effects System
- [ ] Create status effect framework
- [ ] Add buff/debuff visual indicators
- [ ] Implement 8-10 basic effects
- [ ] Add effect stacking/interaction rules
- [ ] Create effect-triggered animations

## Phase 4: Advanced Features (Week 7-8)

### 4.1 Procedural Generation
- [ ] Create basic room layout generator
- [ ] Add random event system
- [ ] Implement adaptive difficulty scaling
- [ ] Create mutation/modifier system for runs
- [ ] Add seed-based generation for sharing runs

### 4.2 Economy & Resources
- [ ] Add multiple currency types (coins, gems, essence)
- [ ] Create resource scarcity mechanics
- [ ] Implement trade-off decisions
- [ ] Add limited inventory system
- [ ] Create resource conversion mechanics

### 4.3 Enhanced UI/UX
- [ ] Create main menu with progression overview
- [ ] Add run summary screens
- [ ] Implement inventory management UI
- [ ] Create detailed statistics tracking
- [ ] Add visual progression indicators

### 4.4 Balance & Polish
- [ ] Implement difficulty curve testing
- [ ] Add gameplay analytics tracking
- [ ] Create comprehensive tutorial system
- [ ] Add accessibility options
- [ ] Optimize performance for new systems

## Phase 5: Content Expansion (Week 9+)

### 5.1 Additional Content
- [ ] Add 5 more floor themes
- [ ] Create 20+ new equipment items
- [ ] Add seasonal events/challenges
- [ ] Implement daily/weekly challenges
- [ ] Create achievement system

### 5.2 Advanced Systems
- [ ] Add crafting/upgrade system
- [ ] Implement prestige/rebirth mechanics
- [ ] Create competitive leaderboards
- [ ] Add run sharing/replay system
- [ ] Implement mod support framework

## Quick Wins (Can be done anytime)
- [ ] Add sound effects for new systems
- [ ] Create loading screens for transitions
- [ ] Add particle effects for new interactions
- [ ] Implement screen shake for impactful moments
- [ ] Add visual feedback for progression gains

## Testing & QA Checklist
- [ ] Test save/load across browser sessions
- [ ] Verify progression balance and pacing
- [ ] Test all upgrade combinations
- [ ] Ensure mobile compatibility maintained
- [ ] Performance test with all systems active
- [ ] User testing for intuitive progression

---

**How to use this TODO:**
1. Pick a section to work on
2. Complete tasks in order within each section
3. Cross out completed items with `~~strikethrough~~`
4. Add new tasks as needed during development
5. Move to next phase when current phase is stable

**Current Focus:** Start with Phase 1.1 - Project Structure Setup

*** next prompt *** 
1.reduce type for normal boss attacks to type to defend -- only special boss moves should be that long 
2.remove press space or enter here since it is not necessary
HOW TO FIGHT:

1️⃣ Type any limb word you see

2️⃣ Press SPACE or ENTER

3️⃣ Watch it EXPLODE! 💥