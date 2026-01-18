import Phaser from "phaser";
import { MobileControls } from "./MobileControls";
import {
  Colors,
  Sizes,
  Speeds,
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
  public joystick!: VirtualJoystickInstance;
  private isMobile: boolean = false;
  public joystickCursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  public bulletManager!: BulletManager;
  private gameOverObject!: Phaser.GameObjects.Ellipse;
  private scoreText!: Phaser.GameObjects.Text;
  private gameOverText!: Phaser.GameObjects.Text;
  private score = 0;
  public isGameOver = false;
  private playerMovement: PlayerMovement;
  private gameOverTransitioned = false;
  private delayedCalls: Phaser.Time.TimerEvent[] = [];
  
  // Cabinet Architecture: Game Camera (the black monitor) and Groups
  private gameCamera!: Phaser.Cameras.Scene2D.Camera;
  private gameObjectsGroup!: Phaser.GameObjects.Group;
  public uiObjectsGroup!: Phaser.GameObjects.Group; // Public for MobileControls access
  private cabinetWall!: Phaser.GameObjects.TileSprite;
  
  // For compatibility with MobileControls
  public uiCamera!: Phaser.Cameras.Scene2D.Camera;

  constructor() {
    super("game");
    this.playerMovement = new PlayerMovement();
  }

  preload() {
    this.load.image('dungeonWall', dungeonWallImageUrl);
  }

  create() {
    // 1. Reset State
    this.isGameOver = false;
    this.gameOverTransitioned = false;
    this.score = 0;
    this.isMobile = this.sys.game.device.input.touch;

    // 2. Setup Groups (for camera visibility management)
    this.gameObjectsGroup = this.add.group();
    this.uiObjectsGroup = this.add.group();

    // 3. THE "CABINET" (Main Camera - Full Screen)
    // ----------------------------------------------------
    // Main camera covers full screen and shows UI/background
    this.cameras.main.setScroll(0, 0);
    
    // Tiled Background (The "Cabinet" surface) - fills screen
    this.cabinetWall = this.add.tileSprite(0, 0, this.scale.width, this.scale.height, 'dungeonWall')
      .setOrigin(0, 0)
      .setScrollFactor(0); // Sticks to screen (doesn't scroll)
    this.uiObjectsGroup.add(this.cabinetWall);
    
    // Map uiCamera to main camera for compatibility
    this.uiCamera = this.cameras.main;

    // 4. THE "MONITOR" (Game Camera - Black Square)
    // ----------------------------------------------------
    // Create second camera for the game monitor (initialized with dummy values, will be positioned by resize)
    this.gameCamera = this.cameras.add(0, 0, 100, 100);
    this.gameCamera.setBackgroundColor(0x000000); // The black "CRT monitor"
    this.gameCamera.setBounds(0, 0, 1000, 1000); // It looks at our 1000x1000 world

    // 5. PHYSICS WORLD (1000x1000 coordinate system)
    // ----------------------------------------------------
    this.physics.world.setBounds(0, 0, 1000, 1000);

    // 6. GAME WORLD OBJECTS (Coordinate 0-1000, visible on game camera)
    // ----------------------------------------------------
    // Green Border (Inside the game world)
    const border = this.add.graphics()
      .lineStyle(4, 0x00ff00)
      .strokeRect(0, 0, 1000, 1000);
    this.gameObjectsGroup.add(border);

    // Player at center (500, 500)
    const centerX = 500;
    const centerY = 500;
    this.player = this.add.triangle(
      centerX,
      centerY,
      PlayerTrianglePoints.x1, PlayerTrianglePoints.y1,
      PlayerTrianglePoints.x2, PlayerTrianglePoints.y2,
      PlayerTrianglePoints.x3, PlayerTrianglePoints.y3,
      Colors.PLAYER
    );
    this.player.setDepth(10);
    setupPlayerPhysics(this.player, this);
    this.playerMovement.resetDirection(0);
    this.updatePlayerVisual();
    this.gameObjectsGroup.add(this.player);

    // Game Over Object
    this.gameOverObject = this.add.ellipse(750, 250, Sizes.GAME_OVER_OBJECT_RADIUS * 2, Sizes.GAME_OVER_OBJECT_RADIUS * 2, Colors.GAME_OVER_OBJECT);
    this.gameOverObject.setDepth(5);
    this.physics.add.existing(this.gameOverObject);
    (this.gameOverObject.body as Phaser.Physics.Arcade.Body).setCircle(Sizes.GAME_OVER_OBJECT_RADIUS).setImmovable(true);
    this.gameObjectsGroup.add(this.gameOverObject);

    // Game Over Text (centered in game world)
    this.gameOverText = this.add.text(500, 500, "", {
      fontSize: Sizes.GAME_OVER_FONT,
      color: Colors.TEXT_GAME_OVER,
      align: 'center'
    }).setOrigin(0.5).setDepth(101).setVisible(false);
    this.gameObjectsGroup.add(this.gameOverText);

    // 7. BULLET MANAGER
    // ----------------------------------------------------
    this.bulletManager = new BulletManager(this);

    // 8. UI CONTROLS (Visible on main camera, not game camera)
    // ----------------------------------------------------
    this.scoreText = this.add.text(20, 20, "Score: 0", {
      fontSize: Sizes.SCORE_FONT,
      color: Colors.TEXT_SCORE
    }).setDepth(100).setScrollFactor(0); // Sticks to screen
    this.uiObjectsGroup.add(this.scoreText);

    // Load Controls
    if (this.isMobile) {
      const mobileControls = new MobileControls(this);
      mobileControls.loadAndSetup();
    } else if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.fireKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    }

    // 9. COLLISIONS
    // ----------------------------------------------------
    this.physics.add.overlap(this.player, this.gameOverObject, () => {
      if (!this.isGameOver) this.handleGameOver();
    });

    const gameOverGroup = this.physics.add.staticGroup([this.gameOverObject]);
    this.bulletManager.setupCollisions(gameOverGroup, () => {});

    // 10. VISIBILITY RULES (The Magic)
    // ----------------------------------------------------
    
    // A. The Cabinet (Main Camera)
    // It should only see the Wall and the UI. 
    // It must IGNORE the Player, the World, and the Bullets.
    this.cameras.main.ignore(this.gameObjectsGroup);
    this.cameras.main.ignore(this.bulletManager.getBullets()); // <--- CRITICAL ADDITION
    
    // B. The Monitor (Game Camera)
    // It should only see the Game World.
    // It must IGNORE the Cabinet Wall and the Score/Joystick.
    this.gameCamera.ignore(this.uiObjectsGroup);

    // 11. INITIAL LAYOUT & RESIZE HANDLER
    // ----------------------------------------------------
    this.handleResize({ width: this.scale.width, height: this.scale.height });
    this.scale.on('resize', this.handleResize, this);

    loadSounds(this);
  }

  // ============================================================================
  // Resize Handler - Keeps the "Black Square" centered and sized correctly
  // ============================================================================
  handleResize(gameSize: { width: number; height: number }) {
    const { width, height } = gameSize;

    // Update Cabinet Background to fill new screen
    if (this.cabinetWall) {
      this.cabinetWall.setSize(width, height);
    }

    // Calculate the Monitor Size (95% of shortest side)
    const monitorSize = Math.min(width, height) * 0.95;

    // Center it
    const x = (width - monitorSize) / 2;
    const y = (height - monitorSize) / 2;

    // Update the Game Camera viewport
    this.gameCamera.setViewport(x, y, monitorSize, monitorSize);

    // THE SECRET SAUCE: ZOOM
    // We have a 1000x1000 world. We have a variable monitorSize (e.g., 350px).
    // We shrink the 1000px world to fit the 350px viewport.
    const zoom = monitorSize / 1000;
    this.gameCamera.setZoom(zoom);

    // Ensure it looks at the center of the 1000x1000 world
    this.gameCamera.centerOn(500, 500);
  }

  // ============================================================================
  // Update Loop
  // ============================================================================
  update() {
    if (this.isGameOver) {
      if (!this.gameOverTransitioned) {
        this.gameOverTransitioned = true;
        const delayedCall = this.time.delayedCall(GameConfig.GAME_OVER_TRANSITION_DELAY, () => {
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

    const activeCursors = this.joystickCursors || this.cursors;

    if (activeCursors) {
      if (activeCursors.left?.isDown) velocityX = -speed;
      else if (activeCursors.right?.isDown) velocityX = speed;

      if (activeCursors.up?.isDown) velocityY = -speed;
      else if (activeCursors.down?.isDown) velocityY = speed;
    }

    if (velocityX !== 0 && velocityY !== 0) {
      velocityX *= Speeds.DIAGONAL_MULTIPLIER;
      velocityY *= Speeds.DIAGONAL_MULTIPLIER;
    }

    if (velocityX !== 0 || velocityY !== 0) {
      this.playerMovement.updateFromVelocity(this.player, velocityX, velocityY);
    }

    if (!this.isMobile && this.fireKey?.isDown && this.bulletManager.canFire()) {
      this.shootBullet();
    }

    // Ensure bullets are visible on game camera (not main camera)
    // Bullets are added dynamically, so we need to handle them in the bullet manager
    this.addScore(1);
    playerBody.setVelocity(velocityX, velocityY);
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private updatePlayerVisual() {
    const direction = this.playerMovement.getDirection();
    this.player.setRotation(Phaser.Math.DegToRad(DirectionAngles[direction]));
  }

  public shootBullet(): void {
    const direction = this.playerMovement.getDirection();
    this.bulletManager.shootBullet(this.player.x, this.player.y, direction);
    playShootSound(this);
  }

  private handleGameOver() {
    this.isGameOver = true;
    this.getPlayerBody().setVelocity(0, 0);
    playBoomSound(this);
    this.gameOverText.setText(`Game Over\nScore: ${this.score}`);
    this.gameOverText.setVisible(true);
  }

  private addScore(points: number): void {
    this.score += points;
    this.scoreText.setText(`Score: ${this.score}`);
  }

  private getPlayerBody(): Phaser.Physics.Arcade.Body {
    return this.player.body as Phaser.Physics.Arcade.Body;
  }

  shutdown() {
    this.scale.off('resize', this.handleResize, this);
    
    this.delayedCalls.forEach(call => {
      if (call && !call.hasDispatched) call.destroy();
    });
    this.delayedCalls = [];

    if (this.bulletManager) this.bulletManager.destroy();

    if (this.joystick && typeof this.joystick.destroy === 'function') {
      this.joystick.destroy();
    }
    this.joystick = undefined as any;
    this.joystickCursors = undefined;
    this.cursors = undefined;
    this.fireKey = undefined;
  }
}