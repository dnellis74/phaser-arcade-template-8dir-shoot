/**
 * Bullet Manager
 * 
 * Handles all bullet/shooting functionality including creation, movement,
 * cleanup, and collision detection. Supports single bullet at a time limit
 * and 8-directional shooting.
 */

import Phaser from "phaser";
import {
  Colors,
  Sizes,
  Speeds,
  GameConfig,
  DirectionAngles,
} from "../config/gameConfig";

/**
 * Interface for scenes that use BulletManager
 */
export interface IBulletScene extends Phaser.Scene {
  physics: Phaser.Physics.Arcade.ArcadePhysics;
  scale: Phaser.Scale.ScaleManager;
  uiCamera?: Phaser.Cameras.Scene2D.Camera;
}

/**
 * Bullet Manager class
 * Manages bullet creation, shooting, cleanup, and collisions
 * Simplified from arrow.ts: single bullet limit, no fire rate
 */
export class BulletManager {
  private bullets: Phaser.Physics.Arcade.Group;
  private scene: IBulletScene;
  private worldBoundsHandler?: (event: any) => void;
  private bulletWallCollider?: Phaser.Physics.Arcade.Collider;
  private bulletCollider?: Phaser.Physics.Arcade.Collider;

  constructor(scene: IBulletScene) {
    this.scene = scene;
    this.bullets = this.createBulletGroup();
    this.setupWorldBoundsHandler();
  }

  /**
   * Sets up world bounds event handler to automatically destroy bullets
   */
  private setupWorldBoundsHandler(): void {
    this.worldBoundsHandler = (event: any) => {
      // In Phaser 3, the worldbounds event can have different structures
      // Try multiple ways to access the body
      const body = event.body || event;
      
      if (body && body.gameObject) {
        const bullet = body.gameObject as Phaser.GameObjects.Rectangle;
        // Verify it's actually a bullet from our group
        if (bullet && this.bullets.contains(bullet)) {
          bullet.destroy();
        }
      }
    };
    this.scene.physics.world.on('worldbounds', this.worldBoundsHandler);
  }

  /**
   * Creates the bullet physics group
   */
  private createBulletGroup(): Phaser.Physics.Arcade.Group {
    return this.scene.physics.add.group({
      classType: Phaser.GameObjects.Rectangle,
      createCallback: (obj) => {
        const rect = obj as Phaser.GameObjects.Rectangle;
        rect.setSize(Sizes.BULLET_WIDTH, Sizes.BULLET_HEIGHT);
        rect.setFillStyle(Colors.BULLET);
      }
    });
  }

  /**
   * Gets the bullet group (for external access)
   */
  public getBullets(): Phaser.Physics.Arcade.Group {
    return this.bullets;
  }

  /**
   * Checks if player can fire (only one bullet at a time)
   */
  public canFire(): boolean {
    return this.bullets.countActive(true) === 0;
  }

  /**
   * Shoots a bullet from the player position in the specified direction
   * @param playerX - Player X position
   * @param playerY - Player Y position
   * @param direction - Direction index (0-7)
   */
  public shootBullet(playerX: number, playerY: number, direction: number): void {
    if (!this.canFire()) {
      return;
    }

    const bulletSpeed = Speeds.BULLET;
    const angle = DirectionAngles[direction];
    const angleRadians = Phaser.Math.DegToRad(angle + GameConfig.ANGLE_OFFSET);

    // Calculate offset to spawn bullet ahead of player to avoid immediate collisions
    // Offset by half player size (max 16/2 = 8) plus bullet size (3/2 = 1.5) plus a small buffer (4)
    const spawnOffset = Math.max(Sizes.PLAYER_WIDTH, Sizes.PLAYER_HEIGHT) / 2 + Sizes.BULLET_HEIGHT / 2 + 4;
    const bulletStartX = playerX + Math.cos(angleRadians) * spawnOffset;
    const bulletStartY = playerY + Math.sin(angleRadians) * spawnOffset;

    // Get/Create bullet from the Physics Group
    const bullet = this.bullets.get(bulletStartX, bulletStartY) as Phaser.GameObjects.Rectangle;

    if (bullet) {
      bullet.setActive(true).setVisible(true);
      
      // Set rotation
      bullet.setRotation(angleRadians);
      
      // Set velocity and ensure physics body size matches visual size
      const body = this.getBulletBody(bullet);
      body.setSize(Sizes.BULLET_WIDTH, Sizes.BULLET_HEIGHT);
      body.setVelocity(
        Math.cos(angleRadians) * bulletSpeed,
        Math.sin(angleRadians) * bulletSpeed
      );

      // Setup world bounds collision
      body.setCollideWorldBounds(true);
      body.onWorldBounds = true;
      
      // Ensure bullet is ignored by UI camera if it exists (bullets are in world space)
      if (this.scene.uiCamera) {
        this.scene.uiCamera.ignore(bullet);
      }
    }
  }

  /**
   * Sets up collision between bullets and walls
   * @param walls - Static group of walls
   */
  public setupWallCollisions(walls: Phaser.Physics.Arcade.StaticGroup): void {
    this.bulletWallCollider = this.scene.physics.add.collider(
      this.bullets, 
      walls, 
      (bullet, wall) => {
        // Destroy bullet when it hits a wall
        const bulletRect = bullet as Phaser.GameObjects.Rectangle;
        if (bulletRect && bulletRect.active) {
          bulletRect.destroy();
        }
      }
    );
  }

  /**
   * Sets up collision between bullets and game objects
   * @param gameObjects - Group of game objects to collide with
   * @param onCollision - Optional callback when collision occurs
   */
  public setupCollisions(
    gameObjects: Phaser.Physics.Arcade.Group | Phaser.Physics.Arcade.StaticGroup,
    onCollision?: (bullet: Phaser.GameObjects.Rectangle, gameObject: Phaser.GameObjects.GameObject) => void
  ): void {
    this.bulletCollider = this.scene.physics.add.collider(
      this.bullets,
      gameObjects,
      (bullet, gameObject) => {
        const bulletRect = bullet as Phaser.GameObjects.Rectangle;
        bulletRect.destroy();
        if (onCollision) {
          // Type assertion: collider provides GameObjectWithBody which extends GameObject
          const gameObj = gameObject as Phaser.GameObjects.GameObject;
          onCollision(bulletRect, gameObj);
        }
      }
    );
  }

  /**
   * Clears all bullets
   */
  public clear(): void {
    this.bullets.clear(true, true);
  }

  /**
   * Gets the physics body of a bullet
   */
  private getBulletBody(bullet: Phaser.GameObjects.Rectangle): Phaser.Physics.Arcade.Body {
    return bullet.body as Phaser.Physics.Arcade.Body;
  }

  /**
   * Destroys the BulletManager and cleans up all resources
   * Removes event listeners, colliders, and clears bullets
   */
  public destroy(): void {
    // Remove world bounds event listener
    if (this.worldBoundsHandler) {
      this.scene.physics.world.off('worldbounds', this.worldBoundsHandler);
      this.worldBoundsHandler = undefined;
    }
    
    // Remove bullet-wall collider
    if (this.bulletWallCollider) {
      this.bulletWallCollider.destroy();
      this.bulletWallCollider = undefined;
    }
    
    // Remove bullet collider
    if (this.bulletCollider) {
      this.bulletCollider.destroy();
      this.bulletCollider = undefined;
    }
    
    // Clear all bullets
    this.clear();
  }
}