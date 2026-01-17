# Game Template

A reusable Phaser 3 game template for creating 2D top-down action games with mobile and desktop support. This template includes 8-directional movement, shooting mechanics, high score tracking, and touch/keyboard controls optimized for iPhone 16.

## Features

- 🎮 **8-Directional Movement**: Smooth player movement in 8 directions (cardinal + diagonal)
- 🔫 **Shooting System**: Single-bullet shooting with configurable speed
- 📱 **Mobile Support**: Virtual joystick and fire button with iPhone 16 safe area handling
- ⌨️ **Keyboard Controls**: WASD/Arrow keys for movement, Space/Enter for shooting
- 🏆 **High Score System**: Persistent top 10 high scores with localStorage
- 🎨 **Configurable**: Easy customization of colors, sizes, speeds, and game mechanics

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Copy the template** to your project directory:
   ```bash
   cp -r game-template/ my-new-game/
   cd my-new-game/
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start development server**:
   ```bash
   npm run dev
   ```

4. **Build for production**:
   ```bash
   npm run build
   ```

5. **Preview production build**:
   ```bash
   npm run preview
   ```

## Project Structure

```
game-template/
├── index.html                 # Entry HTML with iPhone 16 viewport config
├── package.json               # Dependencies and scripts
├── vite.config.ts            # Vite build configuration
├── tsconfig.json              # TypeScript configuration
├── src/
│   ├── main.ts                # Phaser game initialization
│   ├── config/
│   │   ├── templateConfig.ts  # Template-specific config (title, storage keys)
│   │   ├── gameConfig.ts      # Game mechanics config (colors, sizes, speeds)
│   │   └── highScores.ts      # High score storage/retrieval utilities
│   ├── scenes/
│   │   ├── SplashScene.ts     # Splash screen with title, high scores, start button
│   │   ├── GameScene.ts       # Main game scene with player, shooting, game over
│   │   └── MobileControls.ts  # Mobile joystick and fire button setup
│   ├── utils/
│   │   ├── player.ts          # Player movement and 8-directional logic
│   │   └── bulletManager.ts   # Bullet/shooting system
│   └── types/
│       └── joystick.ts        # Joystick type definitions
└── README.md                  # This file
```

## Customization Guide

### 1. Game Title and Storage

Edit `src/config/templateConfig.ts`:

```typescript
export const TemplateConfig = {
  GAME_TITLE: "My Awesome Game",        // Change the game title
  STORAGE_KEY_PREFIX: "myAwesomeGame",  // Change storage key prefix
} as const;
```

**What to change:**
- `GAME_TITLE`: The title displayed on the splash screen
- `STORAGE_KEY_PREFIX`: Prefix for localStorage keys (change to avoid conflicts)

### 2. Colors

Edit `src/config/gameConfig.ts` in the `Colors` object:

```typescript
export const Colors = {
  PLAYER: 0x38bdf8,              // Player triangle color (hex)
  BULLET: 0xfacc15,              // Bullet color (hex)
  GAME_OVER_OBJECT: 0xf97316,    // Game over trigger object color (hex)
  TEXT_PRIMARY: "#e6edf3",       // Primary text color (CSS color)
  TEXT_SECONDARY: "#94a3b8",     // Secondary text color (CSS color)
  TEXT_SCORE: "#e2e8f0",         // Score text color (CSS color)
  TEXT_GAME_OVER: "#fca5a5",     // Game over text color (CSS color)
} as const;
```

### 3. Sizes

Edit `src/config/gameConfig.ts` in the `Sizes` object:

```typescript
export const Sizes = {
  PLAYER_WIDTH: 12,              // Player triangle base width
  PLAYER_HEIGHT: 16,             // Player triangle height
  BULLET_WIDTH: 6,               // Bullet width
  BULLET_HEIGHT: 12,             // Bullet height
  GAME_OVER_OBJECT_RADIUS: 20,   // Game over trigger object radius
  TITLE_FONT: "20px",            // Title font size
  INSTRUCTION_FONT: "14px",      // Instruction text font size
  SCORE_FONT: "16px",            // Score display font size
  GAME_OVER_FONT: "36px",        // Game over text font size
} as const;
```

### 4. Speeds

Edit `src/config/gameConfig.ts` in the `Speeds` object:

```typescript
export const Speeds = {
  PLAYER: 200,                   // Player movement speed (pixels/second)
  BULLET: 400,                   // Bullet movement speed (pixels/second)
  DIAGONAL_MULTIPLIER: 0.7071,   // Diagonal movement multiplier (keep as is)
} as const;
```

### 5. Game Over Object Position/Size

Edit `src/scenes/GameScene.ts` to modify the game over trigger object. Look for where the circle is created and adjust its position and radius.

The radius is controlled by `Sizes.GAME_OVER_OBJECT_RADIUS` in `gameConfig.ts`, but you can also modify the position directly in `GameScene.ts`.

### 6. Mobile Controls Styling

Edit `src/config/gameConfig.ts` in the `MobileControlsConfig` object:

```typescript
export const MobileControlsConfig = {
  FIRE_BUTTON_RADIUS: 40,        // Fire button size
  FIRE_BUTTON_COLOR: 0xff4444,   // Fire button color
  JOYSTICK_BASE_RADIUS: 60,      // Joystick base size
  JOYSTICK_THUMB_RADIUS: 30,     // Joystick thumb size
  // ... other settings
} as const;
```

### 7. UI Layout and Positions

Edit `src/config/gameConfig.ts` in the `Positions` and `UILayout` objects to adjust spacing and positioning of UI elements.

## Game Mechanics

### Player Movement

- **8 Directions**: Player can move in 8 directions (N, NE, E, SE, S, SW, W, NW)
- **Visual Rotation**: Player triangle rotates based on movement direction
- **Diagonal Speed**: Diagonal movement uses a multiplier (0.7071) to maintain consistent speed

### Shooting

- **Single Bullet**: Only one bullet can exist at a time
- **8-Directional**: Bullets shoot in the direction the player is facing
- **Auto-cleanup**: Bullets are removed when they leave the world bounds

### Game Over

- Player touches the game over object (orange circle)
- Score is calculated based on gameplay time or other metrics
- Game over screen displays with score
- After 2 seconds, transitions back to splash screen
- High scores are automatically updated if the new score qualifies

### High Scores

- Top 10 scores are stored in localStorage
- Scores persist across browser sessions
- Displayed on splash screen with dates

## Controls

### Keyboard

- **Movement**: `WASD` or `Arrow Keys` (8 directions)
- **Shoot**: `Space` or `Enter`
- **Start Game**: `Space` or `Enter` on splash screen

### Mobile/Touch

- **Movement**: Virtual joystick (left side of screen)
- **Shoot**: Fire button (right side of screen)
- **Start Game**: Tap "Start" button on splash screen

## iPhone 16 Configuration

The template is optimized for iPhone 16 with:

- Viewport: 393x759 (portrait)
- Top safe area: 59px (Dynamic Island + status bar)
- Bottom safe area: 34px
- Safe area handling via CSS `viewport-fit=cover`

Controls are positioned to respect safe areas and avoid notches.

## Dependencies

- **phaser**: ^3.70.0 - Game framework
- **vite**: ^6.0.6 - Build tool and dev server
- **typescript**: ^5.7.3 - Type safety
- **@types/node**: ^22.10.2 - Node.js type definitions

## Development Workflow

1. **Make changes** to config files or game logic
2. **Test locally** with `npm run dev`
3. **Customize** colors, speeds, and mechanics as needed
4. **Build** for production with `npm run build`
5. **Deploy** the `dist/` folder to your hosting platform

## Next Steps

After customizing the template:

1. Add your game-specific assets (sprites, sounds)
2. Implement game-specific mechanics in `GameScene.ts`
3. Add enemies, power-ups, or other game elements
4. Customize the game over logic and scoring system
5. Add sound effects and music
6. Deploy to your hosting platform

## License

This template is provided as-is for use in your projects.
