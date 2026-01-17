/**
 * Player utility functions for 8-directional movement logic
 * 
 * Provides utilities for:
 * - Calculating 8-directional movement (0-7)
 * - Updating player visual rotation
 * - Setting up player physics body
 */

import Phaser from "phaser";
import { DirectionAngles, Sizes } from "../config/gameConfig";

/**
 * Calculates the 8-directional movement direction from velocity
 * @param velocityX Horizontal velocity (negative = left, positive = right)
 * @param velocityY Vertical velocity (negative = up, positive = down)
 * @returns Direction (0-7): 0=Up, 1=Up-Right, 2=Right, 3=Down-Right, 4=Down, 5=Down-Left, 6=Left, 7=Up-Left
 */
export function calculateDirection(velocityX: number, velocityY: number): number {
  // Determine direction (0-7): Up, Up-Right, Right, Down-Right, Down, Down-Left, Left, Up-Left
  let direction = 0;
  
  if (velocityY < 0) { // Moving up
    if (velocityX < 0) direction = 7; // Up-Left
    else if (velocityX > 0) direction = 1; // Up-Right
    else direction = 0; // Up
  } else if (velocityY > 0) { // Moving down
    if (velocityX < 0) direction = 5; // Down-Left
    else if (velocityX > 0) direction = 3; // Down-Right
    else direction = 4; // Down
  } else { // Only horizontal movement
    if (velocityX < 0) direction = 6; // Left
    else if (velocityX > 0) direction = 2; // Right
  }

  return direction;
}

/**
 * Updates the player visual rotation based on direction
 * @param player The player game object (triangle)
 * @param direction The direction (0-7) to rotate toward
 */
export function updatePlayerRotation(player: Phaser.GameObjects.Triangle, direction: number): void {
  // Rotate player triangle to point in the direction of movement
  // Directions: 0=Up, 1=Up-Right, 2=Right, 3=Down-Right, 4=Down, 5=Down-Left, 6=Left, 7=Up-Left
  player.setRotation(Phaser.Math.DegToRad(DirectionAngles[direction]));
}

/**
 * Sets up the physics body for a player triangle
 * Creates a circular physics body that works correctly at any rotation
 * @param player The player game object (triangle)
 * @param scene The Phaser scene
 * @returns The physics body
 */
export function setupPlayerPhysics(
  player: Phaser.GameObjects.Triangle,
  scene: Phaser.Scene
): Phaser.Physics.Arcade.Body {
  // Add physics to the player if it doesn't already have it
  if (!player.body) {
    scene.physics.add.existing(player);
  }

  const playerBody = player.body as Phaser.Physics.Arcade.Body;
  
  // Use circular body to work correctly at any rotation (Arcade physics bodies don't rotate)
  // Radius based on diagonal of triangle bounding box to cover all rotations
  const diagonal = Math.sqrt(Sizes.PLAYER_WIDTH * Sizes.PLAYER_WIDTH + Sizes.PLAYER_HEIGHT * Sizes.PLAYER_HEIGHT);
  const radius = diagonal / 2;
  playerBody.setCircle(radius);
  playerBody.setCollideWorldBounds(true);

  return playerBody;
}

/**
 * Player movement utility class
 * Tracks direction and provides methods to update player based on velocity
 */
export class PlayerMovement {
  private lastDirection: number = 0; // 0-7 representing 8 directions

  /**
   * Gets the current direction
   */
  getDirection(): number {
    return this.lastDirection;
  }

  /**
   * Updates the player direction and visual based on velocity
   * @param player The player game object (triangle)
   * @param velocityX Horizontal velocity
   * @param velocityY Vertical velocity
   * @returns True if direction changed, false otherwise
   */
  updateFromVelocity(
    player: Phaser.GameObjects.Triangle,
    velocityX: number,
    velocityY: number
  ): boolean {
    const newDirection = calculateDirection(velocityX, velocityY);
    
    // Only update if direction changed
    if (newDirection !== this.lastDirection) {
      this.lastDirection = newDirection;
      updatePlayerRotation(player, this.lastDirection);
      return true;
    }
    
    return false;
  }

  /**
   * Resets the direction to the specified value
   * @param direction The direction to set (default: 0 = Up)
   */
  resetDirection(direction: number = 0): void {
    this.lastDirection = direction;
  }
}
