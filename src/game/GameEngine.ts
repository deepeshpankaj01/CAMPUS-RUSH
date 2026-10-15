/**
 * Deepesh Dash: Campus Rush - Core Game Engine & Loop Coordinator
 */
import { GAME_CONFIG } from './Constants';
import { GameRenderer } from './Renderer';
import { Player } from './Player';
import { EnvironmentManager } from './Environment';
import { ObstacleManager } from './Obstacles';
import { CollectiblesManager } from './Collectibles';
import { ParticleSystem } from './ParticleSystem';
import { soundManager } from '../audio/SoundSynthesizer';
import { storage } from '../systems/Storage';
import { missionManager } from '../systems/Missions';
import { passAndPlay } from '../systems/PassAndPlay';

export type EngineState = 'MENU' | 'PLAYING' | 'PAUSED' | 'GAMEOVER';

export interface GameStats {
  score: number;
  distance: number;
  coins: number;
  sparks: number;
  multiplier: number;
  speed: number;
  focusTimer: number;
  focusMax: number;
  shieldActive: boolean;
  magnetTimer: number;
  sprintTimer: number;
}

export class GameEngine {
  public state: EngineState = 'MENU';

  public renderer: GameRenderer;
  public player: Player;
  public environment: EnvironmentManager;
  public obstacles: ObstacleManager;
  public collectibles: CollectiblesManager;
  public particles: ParticleSystem;

  // Run stats
  public score: number = 0;
  public distanceMeters: number = 0;
  public coinsCollected: number = 0;
  public sparksCollected: number = 0;
  public baseMultiplier: number = 1;
  public currentSpeed: number = GAME_CONFIG.initialSpeed;

  // Focus Mode
  public focusModeSparks: number = 0;
  public focusTimer: number = 0;

  // Active Power-up Timers
  public magnetTimer: number = 0;
  public sprintTimer: number = 0;
  public invulnerabilityTimer: number = 0;

  // Clocks
  private lastTime: number = 0;
  private animFrameId: number | null = null;

  // Event callbacks for UI
  public onStatsUpdate: ((stats: GameStats) => void) | null = null;
  public onGameOver: ((result: { score: number; distance: number; coins: number; isNewBest: boolean; rank: number }) => void) | null = null;
  public onFocusModeChange: ((active: boolean) => void) | null = null;

  constructor(container: HTMLElement) {
    this.renderer = new GameRenderer(container);
    this.player = new Player();
    this.renderer.scene.add(this.player.group);

    this.environment = new EnvironmentManager(this.renderer.scene, this.renderer);
    this.obstacles = new ObstacleManager(this.renderer.scene);
    this.collectibles = new CollectiblesManager(this.renderer.scene);
    this.particles = new ParticleSystem(this.renderer.scene);

    // Apply equipped outfit
    this.player.setOutfit(storage.getEquippedOutfit());

    // Start engine loop
    this.lastTime = performance.now();
    this.loop();
  }

  public startRun(): void {
    this.score = 0;
    this.distanceMeters = 0;
    this.coinsCollected = 0;
    this.sparksCollected = 0;
    this.baseMultiplier = 1;
    this.currentSpeed = GAME_CONFIG.initialSpeed;

    this.focusModeSparks = 0;
    this.focusTimer = 0;
    this.magnetTimer = 0;
    this.sprintTimer = 0;
    this.invulnerabilityTimer = 0;

    this.player.reset();
    this.player.setOutfit(storage.getEquippedOutfit());
    this.environment.reset();
    this.obstacles.reset();
    this.collectibles.reset();
    this.particles.reset();
    missionManager.resetRun();

    this.state = 'PLAYING';
    soundManager.startMusic();
    soundManager.setGameSpeed(1.0);
    soundManager.setFocusModeAudio(false);
  }

  public pause(): void {
    if (this.state === 'PLAYING') {
      this.state = 'PAUSED';
      soundManager.stopMusic();
    }
  }

  public resume(): void {
    if (this.state === 'PAUSED') {
      this.state = 'PLAYING';
      this.lastTime = performance.now();
      soundManager.startMusic();
    }
  }

  public setEquippedOutfit(outfitId: string): void {
    storage.setEquippedOutfit(outfitId);
    this.player.setOutfit(outfitId);
  }

  private loop = (): void => {
    this.animFrameId = requestAnimationFrame(this.loop);

    const now = performance.now();
    let dt = (now - this.lastTime) / 1000;
    this.lastTime = now;

    // Clamp delta-time to prevent physics glitches if browser tab was inactive
    dt = Math.min(dt, 0.08);

    if (this.state === 'PLAYING') {
      this.updatePlaying(dt);
    } else if (this.state === 'MENU') {
      this.updateMenu(dt);
    } else if (this.state === 'GAMEOVER') {
      this.updateGameOver(dt);
    }

    this.particles.update(dt);
    this.renderer.render();
  };

  private updateMenu(dt: number): void {
    // Gentle scenic drift in main menu preview
    const previewSpeed = 8.0;
    this.environment.update(previewSpeed, dt, 0);
    this.player.update(dt, 0.6);
  }

  private updateGameOver(dt: number): void {
    // Slowly halt scenery and animate tumble
    this.player.update(dt, 0.2);
  }

  private updatePlaying(dt: number): void {
    // 1. Calculate effective speed
    let effectiveSpeed = this.currentSpeed;
    if (this.sprintTimer > 0) {
      effectiveSpeed *= GAME_CONFIG.sprintBoostMultiplier;
    }

    const speedMultiplier = effectiveSpeed / GAME_CONFIG.initialSpeed;
    soundManager.setGameSpeed(speedMultiplier);

    // 2. Advance world distance & speed scaling
    const deltaDistance = effectiveSpeed * dt;
    this.distanceMeters += deltaDistance;
    this.currentSpeed = Math.min(
      GAME_CONFIG.maxSpeed,
      GAME_CONFIG.initialSpeed + this.distanceMeters * GAME_CONFIG.speedAcceleration
    );

    // Score accumulation (10 points per meter * active multiplier)
    const activeMultiplier = this.getActiveMultiplier();
    this.score += Math.round(deltaDistance * 10 * activeMultiplier);

    // Report distance to missions
    missionManager.recordDistance(Math.round(this.distanceMeters));

    // 3. Update Environment, Obstacles, Collectibles
    this.environment.update(effectiveSpeed, dt, this.distanceMeters);
    this.obstacles.update(effectiveSpeed, dt);
    this.collectibles.update(
      effectiveSpeed,
      dt,
      this.player.group.position,
      this.player.hasMagnet
    );

    // 4. Update Player
    this.player.update(dt, speedMultiplier);

    // Slide dust puffing
    if (this.player.state === 'SLIDING') {
      this.particles.puffSlideDust(this.player.group.position);
    }

    // 5. Update Timers (Focus Mode, Power-ups)
    this.updateTimers(dt);

    // 6. Check Collectible Pickups
    this.handleCollectiblePickups();

    // 7. Check Collisions with Obstacles
    this.handleObstacleCollisions();

    // 8. Publish Stats to HUD
    if (this.onStatsUpdate) {
      this.onStatsUpdate({
        score: this.score,
        distance: Math.round(this.distanceMeters),
        coins: this.coinsCollected,
        sparks: this.focusModeSparks,
        multiplier: activeMultiplier,
        speed: Math.round(effectiveSpeed),
        focusTimer: this.focusTimer,
        focusMax: GAME_CONFIG.focusModeDuration,
        shieldActive: this.player.hasShield,
        magnetTimer: this.magnetTimer,
        sprintTimer: this.sprintTimer
      });
    }
  }

  private updateTimers(dt: number): void {
    // Invulnerability timer
    if (this.invulnerabilityTimer > 0) {
      this.invulnerabilityTimer -= dt;
    }

    // Focus Mode timer
    if (this.focusTimer > 0) {
      this.focusTimer -= dt;
      if (this.focusTimer <= 0) {
        this.focusTimer = 0;
        this.player.isFocusMode = false;
        soundManager.setFocusModeAudio(false);
        if (this.onFocusModeChange) this.onFocusModeChange(false);
      }
    }

    // Code Magnet timer
    if (this.magnetTimer > 0) {
      this.magnetTimer -= dt;
      if (this.magnetTimer <= 0) {
        this.magnetTimer = 0;
        this.player.hasMagnet = false;
      }
    }

    // Sprint Boost timer
    if (this.sprintTimer > 0) {
      this.sprintTimer -= dt;
      if (this.sprintTimer <= 0) {
        this.sprintTimer = 0;
        this.player.isSprintBoosting = false;
      }
    }
  }

  private getActiveMultiplier(): number {
    let mult = this.baseMultiplier;
    if (this.focusTimer > 0) {
      mult *= GAME_CONFIG.focusModeMultiplier;
    }
    if (this.sprintTimer > 0) {
      mult += 2;
    }
    return mult;
  }

  private handleCollectiblePickups(): void {
    const playerPos = this.player.group.position;
    const pickups = this.collectibles.checkPickups(playerPos, 1.8);

    for (const item of pickups) {
      switch (item.type) {
        case 'BYTE_COIN':
          this.coinsCollected++;
          this.score += 100 * this.getActiveMultiplier();
          soundManager.playCoin();
          this.particles.burstCoins(item.group.position);
          missionManager.recordCoin();
          if (this.player.hasMagnet) {
            missionManager.recordMagnetCoin();
          }
          break;

        case 'IDEA_SPARK':
          this.sparksCollected++;
          this.score += 350 * this.getActiveMultiplier();
          this.focusModeSparks++;
          soundManager.playSpark();
          this.particles.burstSpark(item.group.position);

          // Check Focus Mode Trigger
          if (this.focusModeSparks >= GAME_CONFIG.sparksForFocus) {
            this.triggerFocusMode();
          }
          break;

        case 'POWERUP_SHIELD':
          this.player.hasShield = true;
          soundManager.playPowerUp();
          missionManager.recordShield();
          this.particles.burstShield(item.group.position);
          break;

        case 'POWERUP_MAGNET':
          this.player.hasMagnet = true;
          this.magnetTimer = GAME_CONFIG.magnetDuration;
          soundManager.playPowerUp();
          this.particles.burstSpark(item.group.position);
          break;

        case 'POWERUP_SPRINT':
          this.player.isSprintBoosting = true;
          this.sprintTimer = GAME_CONFIG.sprintBoostDuration;
          soundManager.playPowerUp();
          this.particles.burstSpark(item.group.position);
          break;
      }
    }
  }

  private triggerFocusMode(): void {
    this.focusModeSparks = 0;
    this.focusTimer = GAME_CONFIG.focusModeDuration;
    this.player.isFocusMode = true;
    soundManager.playFocusModeStart();
    soundManager.setFocusModeAudio(true);
    missionManager.recordFocusMode();
    if (this.onFocusModeChange) this.onFocusModeChange(true);
  }

  private handleObstacleCollisions(): void {
    if (this.invulnerabilityTimer > 0) return;

    const playerBox = this.player.getBoundingBox();
    const hitObs = this.obstacles.checkCollisions(playerBox, this.player.state === 'SLIDING');

    if (!hitObs) return;

    // Case 1: Sprint Boost is active -> Player smashes through obstacle safely!
    if (this.sprintTimer > 0) {
      hitObs.active = false;
      this.particles.burstCoins(hitObs.group.position);
      soundManager.playShieldAbsorb();
      return;
    }

    // Case 2: Notebook Shield is active -> Absorbs hit and protects player!
    if (this.player.hasShield) {
      this.player.hasShield = false;
      hitObs.active = false;
      this.invulnerabilityTimer = 1.2; // 1.2s post-hit invulnerability grace period
      soundManager.playShieldAbsorb();
      this.particles.burstShield(this.player.group.position);
      return;
    }

    // Case 3: Fatal Collision -> Game Over
    this.handleGameOver();
  }

  private handleGameOver(): void {
    this.state = 'GAMEOVER';
    this.player.stumble();
    soundManager.stopMusic();
    soundManager.playCollision();

    const finalScore = this.score;
    const finalDistance = Math.round(this.distanceMeters);
    const finalCoins = this.coinsCollected;

    // Save run and update leaderboard
    const { isNewHighScore, rank } = storage.recordRun(finalScore, finalDistance, finalCoins);

    if (passAndPlay.isActive) {
      passAndPlay.recordCurrentRun(finalScore, finalDistance, finalCoins);
    }

    // Delay showing game over screen for 0.7s to let stumble animation play cleanly
    setTimeout(() => {
      if (this.onGameOver) {
        this.onGameOver({
          score: finalScore,
          distance: finalDistance,
          coins: finalCoins,
          isNewBest: isNewHighScore,
          rank
        });
      }
    }, 700);
  }

  // Input bindings
  public handleLeft(): void {
    if (this.state === 'PLAYING') {
      this.player.moveLeft();
    }
  }

  public handleRight(): void {
    if (this.state === 'PLAYING') {
      this.player.moveRight();
    }
  }

  public handleJump(): void {
    if (this.state === 'PLAYING') {
      if (this.player.jump()) {
        soundManager.playJump();
        missionManager.recordJump();
      }
    }
  }

  public handleSlide(): void {
    if (this.state === 'PLAYING') {
      if (this.player.slide()) {
        soundManager.playSlide();
        missionManager.recordSlide();
      }
    }
  }

  public handlePauseToggle(): void {
    if (this.state === 'PLAYING') {
      this.pause();
    } else if (this.state === 'PAUSED') {
      this.resume();
    }
  }

  public returnToMenu(): void {
    this.state = 'MENU';
    this.player.reset();
    soundManager.stopMusic();
  }

  public dispose(): void {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
    }
    this.renderer.dispose();
  }
}
