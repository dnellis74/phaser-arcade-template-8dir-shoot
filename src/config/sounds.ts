/**
 * Sound configuration and management
 * 
 * Centralized sound loading and playback for the game.
 */

import shootSoundUrl from "../assets/sounds/Shoot33.wav";
import boomSoundUrl from "../assets/sounds/Boom2.wav";

// ============================================================================
// Sound Keys
// ============================================================================
export const SoundKeys = {
  SHOOT: 'shoot',
  BOOM: 'boom',
} as const;

// ============================================================================
// Sound URLs
// ============================================================================
const SoundUrls = {
  [SoundKeys.SHOOT]: shootSoundUrl,
  [SoundKeys.BOOM]: boomSoundUrl,
} as const;

// ============================================================================
// Sound Loading
// ============================================================================

/**
 * Loads all sound effects into the scene
 * @param scene - Phaser scene to load sounds into
 */
export function loadSounds(scene: Phaser.Scene): void {
  // Load sound effects
  scene.load.audio(SoundKeys.SHOOT, SoundUrls[SoundKeys.SHOOT]);
  scene.load.audio(SoundKeys.BOOM, SoundUrls[SoundKeys.BOOM]);
  
  scene.load.start();
}

// ============================================================================
// Sound Playback Helpers
// ============================================================================

/**
 * Plays a sound effect
 * @param scene - Phaser scene
 * @param soundKey - Key of the sound to play
 */
export function playSound(scene: Phaser.Scene, soundKey: string): void {
  scene.sound.play(soundKey);
}

/**
 * Plays the shoot sound effect
 */
export function playShootSound(scene: Phaser.Scene): void {
  playSound(scene, SoundKeys.SHOOT);
}

/**
 * Plays the boom (game over) sound effect
 */
export function playBoomSound(scene: Phaser.Scene): void {
  playSound(scene, SoundKeys.BOOM);
}
