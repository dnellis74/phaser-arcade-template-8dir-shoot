/**
 * Game configuration constants
 * 
 * Centralized configuration for all game constants including colors, sizes,
 * speeds, positions, and game rules.
 */

// ============================================================================
// Colors
// ============================================================================
export const Colors = {
  PLAYER: 0x38bdf8,
  BULLET: 0xfacc15,
  GAME_OVER_OBJECT: 0xf97316,
  WALL: 0xffffff, // White walls
  TEXT_PRIMARY: "#e6edf3",
  TEXT_SECONDARY: "#94a3b8",
  TEXT_SCORE: "#e2e8f0",
  TEXT_GAME_OVER: "#fca5a5",
} as const;

// ============================================================================
// Sizes
// ============================================================================
export const Sizes = {
  PLAYER_WIDTH: 12,
  PLAYER_HEIGHT: 16,
  BULLET_WIDTH: 3,
  BULLET_HEIGHT: 3,
  GAME_OVER_OBJECT_RADIUS: 20,
  WALL_THICKNESS: 2, // White border walls are 2 pixels thick
  TITLE_FONT: "20px",
  INSTRUCTION_FONT: "14px",
  SCORE_FONT: "16px",
  GAME_OVER_FONT: "36px",
} as const;

// ============================================================================
// Speeds
// ============================================================================
export const Speeds = {
  PLAYER: 200,
  BULLET: 400,
  DIAGONAL_MULTIPLIER: 0.7071,
} as const;

// ============================================================================
// Positions & Offsets
// ============================================================================
export const Positions = {
  // Safe area offset for iPhone 16: ~59 points (Dynamic Island + status bar)
  SAFE_AREA_TOP: 59,
  // Controls area offset: space needed for joystick (60px radius) + fire button (40px radius) + buffer
  CONTROLS_AREA_HEIGHT: 200,
  TITLE_Y: 83, // 24 + 59 (safe area)
  INSTRUCTION_Y: 107, // 48 + 59 (safe area)
  UI_X: 16,
  UI_SCORE_Y: 75, // 16 + 59 (safe area)
  PADDING: 80,
  // Playfield configuration - matches venture example approach
  PLAYFIELD_TOP_OFFSET: 140, // Position below instructions (similar to ROOM_TOP_OFFSET)
} as const;

// ============================================================================
// Game Configuration
// ============================================================================
export const GameConfig = {
  ANGLE_OFFSET: -90,
  UI_Z_DEPTH: 1000,
  // Timing constants
  GAME_OVER_TRANSITION_DELAY: 2000, // Delay before transitioning to splash scene (ms)
} as const;

// ============================================================================
// Player Triangle Points
// ============================================================================
export const PlayerTrianglePoints = {
  x1: 0,
  y1: -8,
  x2: -6,
  y2: 8,
  x3: 6,
  y3: 8,
} as const;

// ============================================================================
// Direction Angles
// ============================================================================
export const DirectionAngles = [0, 45, 90, 135, 180, 225, 270, 315] as const;

// ============================================================================
// Mobile Controls Configuration
// ============================================================================
export const MobileControlsConfig = {
  // Safe area offsets
  BOTTOM_SAFE_AREA: 34, // Bottom safe area offset for iPhone 16 (points)
  // Fire button configuration
  FIRE_BUTTON_OFFSET_X: 100, // Distance from right edge
  FIRE_BUTTON_OFFSET_Y: 100, // Distance from bottom (before safe area)
  FIRE_BUTTON_RADIUS: 40,
  FIRE_BUTTON_COLOR: 0xff4444,
  FIRE_BUTTON_ALPHA: 0.7,
  FIRE_BUTTON_ALPHA_HOVER: 0.9,
  // Joystick configuration
  JOYSTICK_OFFSET_X: 100, // Distance from left edge
  JOYSTICK_OFFSET_Y: 100, // Distance from bottom (before safe area)
  JOYSTICK_BASE_RADIUS: 60,
  JOYSTICK_BASE_COLOR: 0x888888,
  JOYSTICK_BASE_ALPHA: 0.5,
  JOYSTICK_THUMB_RADIUS: 30,
  JOYSTICK_THUMB_COLOR: 0xcccccc,
  JOYSTICK_THUMB_ALPHA: 0.8,
  JOYSTICK_DIRECTION_MODE: '8dir' as const, // 8-directional movement
} as const;

// ============================================================================
// UI Layout Constants (SplashScene)
// ============================================================================
export const UILayout = {
  HIGH_SCORE_LABEL_OFFSET_Y: 40, // Offset below instruction text
  HIGH_SCORE_START_OFFSET_Y: 30, // Offset below label
  HIGH_SCORE_LINE_HEIGHT: 20, // Line spacing for score list
  START_BUTTON_OFFSET_Y: 50, // Offset below high scores or center
  START_BUTTON_PADDING_LEFT: 20,
  START_BUTTON_PADDING_RIGHT: 20,
  START_BUTTON_PADDING_TOP: 10,
  START_BUTTON_PADDING_BOTTOM: 10,
} as const;
