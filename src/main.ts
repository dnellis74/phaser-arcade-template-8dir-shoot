import Phaser from "phaser";
import { SplashScene } from "./scenes/SplashScene";
import { GameScene } from "./scenes/GameScene";
import { DebugFlags } from "./config/debug";

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: "app",
  backgroundColor: "#0b0f1a",
  physics: {
    default: "arcade",
    arcade: {
      gravity: {
        y: 0,
        x: 0
      },
      debug: DebugFlags.physicsDebug
    }
  },
  scale: {
    mode: Phaser.Scale.RESIZE, // Full screen for cabinet architecture
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: "100%",
    height: "100%"
  },
  scene: [SplashScene, GameScene]
};

new Phaser.Game(config);
