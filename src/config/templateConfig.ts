/**
 * Template-level configuration
 * 
 * This file contains template-specific settings that should be customized
 * for each new game built from this template.
 */

export const TemplateConfig = {
  /**
   * The title of the game displayed on the splash screen
   */
  GAME_TITLE: "Game Title",

  /**
   * Prefix for localStorage keys used by this game instance
   * Change this to avoid conflicts when multiple games use the same domain
   */
  STORAGE_KEY_PREFIX: "gameTemplate",
} as const;
