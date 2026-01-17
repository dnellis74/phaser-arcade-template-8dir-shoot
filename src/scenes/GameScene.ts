import Phaser from "phaser";
import { MobileControls } from "./MobileControls";
import {
  Colors,
  Sizes,
  Speeds,
  Positions,
  GameConfig,
  PlayerTrianglePoints,
  DirectionAngles,
} from "../config/gameConfig";
import type { VirtualJoystickInstance } from "../types/joystick";
import { BulletManager } from "../utils/bulletManager";
import { PlayerMovement, setupPlayerPhysics } from "../utils/player";
import { loadSounds, playShootSound, playBoomSound } from "../config/sounds";
// @ts-expect-error Vite will replace this import with url at build time
import dungeonWallImageUrl from "../assets/image/1064.png";

export class GameScene extends Phaser.Scene {
  // ============================================================================
  // Instance Properties
  // ============================================================================
  private player!: Phaser.GameObjects.Triangle;
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private fireKey?: Phaser.Input.Keyboard.Key;
  public joystick!: VirtualJoystickInstance; // Rex Virtual Joystick (public for MobileControls access)
  private isMobile: boolean = false;
  public joystickCursors?: Phaser.Types.Input.Keyboard.CursorKeys; // Public for MobileControls access
  public bulletManager!: BulletManager; // Bullet management (public for MobileControls access)
  private gameOverObject!: Phaser.GameObjects.Ellipse;
  private scoreText!: Phaser.GameObjects.Text;
  private gameOverText!: Phaser.GameObjects.Text;
  private score = 0;
  public isGameOver = false; // Public for MobileControls access
  private playerMovement: PlayerMovement;
  private gameOverTransitioned = false; // Track if we've already triggered the transition back to SplashScene
  private delayedCalls: Phaser.Time.TimerEvent[] = []; // Store delayed calls for cleanup
  // Playfield bounds (in world space, square based on min dimension)
  private playfieldSize: number = 0;
  private playfieldOrigin = { x: 0, y: 0 };
  public uiCamera!: Phaser.Cameras.Scene2D.Camera; // Public for MobileControls access

  constructor() {
    super("game");
    this.playerMovement = new PlayerMovement();
  }

  preload() {
    // Load the dungeon wall background image
    this.load.image('dungeonWall', dungeonWallImageUrl);
  }

  create() {
    // Reset game over state
    this.isGameOver = false;
    this.gameOverTransitioned = false;
    this.score = 0;

    // Check if device is mobile (has touch support)
    this.isMobile = this.sys.game.device.input.touch;

    // Listen for browser/phone resize FIRST, then set up camera
    // Use Phaser.Scale.Events.RESIZE for proper event handling
    this.scale.on(Phaser.Scale.Events.RESIZE, this.setupCamera, this);
    
    // Set up camera and viewport after listener is set
    this.setupCamera();

    // Set up input controls
    if (this.isMobile) {
      // Create virtual joystick for mobile
      const mobileControls = new MobileControls(this);
      mobileControls.loadAndSetup();
    } else {
      // Keyboard controls for desktop
      if (this.input.keyboard) {
        this.cursors = this.input.keyboard.createCursorKeys();
        this.fireKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
      } else {
        console.error('Keyboard input not available');
      }
    }

    const { width, height } = this.scale;
    
    // Visual test: Draw a border around our square playfield (in world coordinates)
    this.add.graphics()
      .lineStyle(2, 0x00ff00)
      .strokeRect(this.playfieldOrigin.x, this.playfieldOrigin.y, this.playfieldSize, this.playfieldSize);

    // Create tiled dungeon wall background covering the entire screen (in UI space)
    // This will show in the "dead space" around the playfield square
    const background = this.add.tileSprite(0, 0, width, height, 'dungeonWall')
      .setOrigin(0, 0)
      .setDepth(-2);
    
    // Make sure the background is ignored by main camera (it will be visible on UI camera)
    this.cameras.main.ignore(background);

    // Create UI camera for controls that covers the whole screen
    this.uiCamera = this.cameras.add(0, 0, width, height);
    this.uiCamera.setScroll(0, 0);
    // UI camera will render on top by default (added after main camera)

    // Create black background for the playfield (in world space, centered on playfield)
    this.add.rectangle(
      this.playfieldOrigin.x + this.playfieldSize / 2,
      this.playfieldOrigin.y + this.playfieldSize / 2,
      this.playfieldSize,
      this.playfieldSize,
      0x000000
    ).setDepth(-1); // Behind game elements but on top of wall background

    // Initialize bullet manager with world bounds set to playfield
    this.bulletManager = new BulletManager(this);

    // Create player as a triangle (arrow pointing up initially)
    // Position player at center of playfield (in world space, using offset coordinates)
    const playerX = this.playfieldOrigin.x + this.playfieldSize / 2;
    const playerY = this.playfieldOrigin.y + this.playfieldSize / 2;
    this.player = this.add.triangle(
      playerX,
      playerY,
      PlayerTrianglePoints.x1,
      PlayerTrianglePoints.y1,
      PlayerTrianglePoints.x2,
      PlayerTrianglePoints.y2,
      PlayerTrianglePoints.x3,
      PlayerTrianglePoints.y3,
      Colors.PLAYER
    );
    setupPlayerPhysics(this.player, this);
    this.playerMovement.resetDirection(0); // Start facing up
    this.updatePlayerVisual();
    
    // Ensure player is on main camera only (not UI camera)
    this.uiCamera.ignore(this.player);

    // Create game over object - positioned within playfield (in world space, using offset coordinates)
    const gameOverX = this.playfieldOrigin.x + this.playfieldSize * 0.75;
    const gameOverY = this.playfieldOrigin.y + this.playfieldSize * 0.25;
    this.gameOverObject = this.add.ellipse(
      gameOverX,
      gameOverY,
      Sizes.GAME_OVER_OBJECT_RADIUS * 2,
      Sizes.GAME_OVER_OBJECT_RADIUS * 2,
      Colors.GAME_OVER_OBJECT
    );
    this.physics.add.existing(this.gameOverObject);
    const gameOverBody = this.gameOverObject.body as Phaser.Physics.Arcade.Body;
    gameOverBody.setCircle(Sizes.GAME_OVER_OBJECT_RADIUS);
    gameOverBody.setImmovable(true);
    
    // Ensure game over object is on main camera only (not UI camera)
    this.uiCamera.ignore(this.gameOverObject);

    // Set up collision between player and game over object
    this.physics.add.overlap(
      this.player,
      this.gameOverObject,
      () => {
        if (this.isGameOver) {
          return;
        }
        this.handleGameOver();
      }
    );

    // Set up collision between bullets and game over object (bullets should be destroyed)
    const gameOverGroup = this.physics.add.staticGroup([this.gameOverObject]);
    this.bulletManager.setupCollisions(
      gameOverGroup,
      () => {
        // Bullet hits game over object - just destroy bullet, don't trigger game over
      }
    );

    // Create score text (in UI space, using full screen coordinates)
    this.scoreText = this.add.text(16, 75, "Score: 0", {
      fontSize: Sizes.SCORE_FONT,
      color: Colors.TEXT_SCORE
    }).setDepth(GameConfig.UI_Z_DEPTH);
    // Score text should be on UI camera only (not main camera)
    this.cameras.main.ignore(this.scoreText);

    // Create game over text (initially hidden) - centered in playfield (in world space, using offset coordinates)
    this.gameOverText = this.add.text(
      this.playfieldOrigin.x + this.playfieldSize / 2,
      this.playfieldOrigin.y + this.playfieldSize / 2,
      "",
      {
        fontSize: Sizes.GAME_OVER_FONT,
        color: Colors.TEXT_GAME_OVER
      }
    ).setOrigin(0.5, 0.5)
      .setDepth(GameConfig.UI_Z_DEPTH)
      .setVisible(false);

    // Load sound effects
    loadSounds(this);
  }

  setupCamera() {
    const { width, height } = this.scale.gameSize;

    // 1. Calculate the square size (with a small 5% padding)
    this.playfieldSize = Math.min(width, height) * 0.95;

    // 2. Define the Game World (The Square) - center the world coordinates themselves
    // We offset the world bounds to center them on screen
    this.playfieldOrigin.x = (width - this.playfieldSize) / 2;
    this.playfieldOrigin.y = (height - this.playfieldSize) / 2;

    // 3. Set Physics Bounds to the centered square (using world coordinates with offset)
    this.physics.world.setBounds(
      this.playfieldOrigin.x, 
      this.playfieldOrigin.y, 
      this.playfieldSize, 
      this.playfieldSize
    );

    // 4. Set camera bounds to match the centered world
    this.cameras.main.setBounds(
      this.playfieldOrigin.x, 
      this.playfieldOrigin.y, 
      this.playfieldSize, 
      this.playfieldSize
    );
    
    // 5. Keep the camera focused on the center of the playfield
    const centerX = this.playfieldOrigin.x + this.playfieldSize / 2;
    const centerY = this.playfieldOrigin.y + this.playfieldSize / 2;
    this.cameras.main.centerOn(centerX, centerY);
    
    // 6. Reset scroll to ensure consistent positioning
    this.cameras.main.setScroll(this.playfieldOrigin.x, this.playfieldOrigin.y);

    // 7. Backgrounds
    this.cameras.main.setBackgroundColor('#111'); // Inner square color
  }
  
  update() {
    if (this.isGameOver) {
      // Handle game over transition after delay
      if (!this.gameOverTransitioned) {
        this.gameOverTransitioned = true;
        const delayedCall = this.time.delayedCall(GameConfig.GAME_OVER_TRANSITION_DELAY, () => {
          // Transition back to SplashScene with final score
          this.scene.start('splash', { finalScore: this.score });
        });
        this.delayedCalls.push(delayedCall);
      }
      return;
    }

    const playerBody = this.getPlayerBody();
    const speed = Speeds.PLAYER;
    let velocityX = 0;
    let velocityY = 0;

    // Get input from joystick (mobile) or keyboard (desktop)
    // Use joystick cursors if available, otherwise use keyboard cursors
    const activeCursors = this.joystickCursors || this.cursors;
    
    if (activeCursors) {
      if (activeCursors.left?.isDown) {
        velocityX = -speed;
      } else if (activeCursors.right?.isDown) {
        velocityX = speed;
      }

      if (activeCursors.up?.isDown) {
        velocityY = -speed;
      } else if (activeCursors.down?.isDown) {
        velocityY = speed;
      }
    }

    // Apply diagonal multiplier
    if (velocityX !== 0 && velocityY !== 0) {
      velocityX *= Speeds.DIAGONAL_MULTIPLIER;
      velocityY *= Speeds.DIAGONAL_MULTIPLIER;
    }

    // Update direction based on movement
    if (velocityX !== 0 || velocityY !== 0) {
      this.playerMovement.updateFromVelocity(this.player, velocityX, velocityY);
    }

    // Handle firing (only if no bullets exist) - keyboard only (mobile uses button)
    if (!this.isMobile && this.fireKey?.isDown && this.bulletManager.canFire()) {
      this.shootBullet();
    }

    // Update score over time (simple scoring mechanism)
    // Increment score every frame (60fps = 60 points per second)
    this.addScore(1);

    playerBody.setVelocity(velocityX, velocityY);
  }

  // ============================================================================
  // Update Methods - Player Movement & Actions
  // ============================================================================

  private updatePlayerVisual() {
    // Update player visual rotation based on current direction
    const direction = this.playerMovement.getDirection();
    this.player.setRotation(Phaser.Math.DegToRad(DirectionAngles[direction]));
  }

  public shootBullet(): void { // Public for MobileControls access
    const direction = this.playerMovement.getDirection();
    this.bulletManager.shootBullet(this.player.x, this.player.y, direction);
    // Play shoot sound
    playShootSound(this);
  }

  // ============================================================================
  // Game Logic - Game Over & Scoring
  // ============================================================================

  private handleGameOver() {
    this.isGameOver = true;
    
    // Stop player movement
    const playerBody = this.getPlayerBody();
    playerBody.setVelocity(0, 0);
    
    // Play game over sound
    playBoomSound(this);
    
    // Display game over text with score
    this.gameOverText.setText(`Game Over\nScore: ${this.score}`);
    this.gameOverText.setVisible(true);
  }

  private addScore(points: number): void {
    this.score += points;
    this.scoreText.setText(`Score: ${this.score}`);
  }

  // ============================================================================
  // Helper Methods - Type Casting & Common Patterns
  // ============================================================================

  private getPlayerBody(): Phaser.Physics.Arcade.Body {
    return this.player.body as Phaser.Physics.Arcade.Body;
  }

  /**
   * Cleanup method called when scene is shut down
   * Removes all event listeners, timers, colliders, and physics bodies
   */
  shutdown() {
    // Destroy all delayed calls
    this.delayedCalls.forEach(call => {
      if (call && !call.hasDispatched) {
        call.destroy();
      }
    });
    this.delayedCalls = [];

    // Destroy bullet manager (cleans up its event listeners)
    if (this.bulletManager) {
      this.bulletManager.destroy();
    }

    // Clean up joystick if present (mobile controls)
    if (this.joystick && typeof this.joystick.destroy === 'function') {
      this.joystick.destroy();
    }
    this.joystick = undefined as any; // Reset to undefined but keep type compatibility
    this.joystickCursors = undefined;

    // Clean up keyboard listeners (Phaser handles this automatically, but we can clear references)
    this.cursors = undefined;
    this.fireKey = undefined;
  }
}
