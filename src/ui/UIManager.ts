/**
 * Campus Rush - UI Manager, Mobile HUD & Clean Screen Coordinator
 */
import confetti from 'canvas-confetti';
import { GameEngine, GameStats } from '../game/GameEngine';
import { storage } from '../systems/Storage';
import { soundManager } from '../audio/SoundSynthesizer';

export class UIManager {
  private engine: GameEngine;
  private root: HTMLElement;

  // Screens
  private screenMenu!: HTMLElement;
  private screenHUD!: HTMLElement;
  private screenGameOver!: HTMLElement;
  private modalPause!: HTMLElement;

  // HUD elements
  private hudScoreVal!: HTMLElement;
  private hudMultBadge!: HTMLElement;
  private hudStageBadge!: HTMLElement;
  private hudDistVal!: HTMLElement;
  private hudCoinVal!: HTMLElement;
  private sparkOrbs: HTMLElement[] = [];
  private focusTimerWrap!: HTMLElement;
  private focusTimerBar!: HTMLElement;
  private powerupBar!: HTMLElement;
  private levelUpBanner!: HTMLElement;
  private touchHint!: HTMLElement;

  // Menu Elements
  private menuBestScore!: HTMLElement;

  // State
  private hasShownTouchHint: boolean = false;
  private levelUpTimeout: number | null = null;

  constructor(engine: GameEngine, root: HTMLElement) {
    this.engine = engine;
    this.root = root;

    this.buildDOM();
    this.bindEvents();

    // Hook engine callbacks
    this.engine.onStatsUpdate = this.handleStatsUpdate;
    this.engine.onLevelUp = this.handleLevelUp;
    this.engine.onGameOver = this.handleGameOver;
    this.engine.onFocusModeChange = this.handleFocusModeChange;

    this.showMainMenu();
  }

  private buildDOM(): void {
    this.root.innerHTML = `
      <!-- Toast Container -->
      <div id="toast-container"></div>

      <!-- Level Up Non-Interrupting Banner -->
      <div id="level-up-banner" class="level-up-banner"></div>

      <!-- Non-Blocking Touch Controls Hint -->
      <div id="touch-hint" class="touch-hint">Swipe to Steer, Jump &amp; Slide</div>

      <!-- MAIN MENU SCREEN -->
      <div id="main-menu" class="screen active interactive">
        <header class="menu-header">
          <div class="stat-pill best">
            <span class="icon">🏆</span>
            <span id="menu-best-val">BEST: 0</span>
          </div>
          <button id="btn-quick-sound" class="btn-hud-icon" title="Toggle Sound" aria-label="Toggle Sound">🔊</button>
        </header>

        <main class="menu-center">
          <div class="game-title-container">
            <h1 class="game-title">CAMPUS RUSH</h1>
            <p class="game-tagline">“One More Run. Beat Your Best.”</p>
          </div>

          <button id="btn-play-now" class="btn-play-primary" aria-label="Play Game">
            <span>▶ PLAY</span>
          </button>
        </main>

        <footer class="menu-footer">
          <div class="dev-credit-tag">mere bhai Deepesh Pankaj</div>
        </footer>
      </div>

      <!-- GAMEPLAY HUD -->
      <div id="hud-screen" class="screen">
        <div class="hud-top-bar">
          <!-- Left: Score & Multiplier -->
          <div class="hud-score-card">
            <div class="hud-score-label">SCORE</div>
            <div id="hud-score-val" class="hud-score-value">0</div>
            <div id="hud-mult-badge" class="hud-multiplier-badge">1x</div>
          </div>

          <!-- Center: Stage & Focus Meter -->
          <div class="hud-center-cluster">
            <div id="hud-stage-badge" class="hud-stage-badge">STAGE 1</div>
            <div class="focus-spark-meter" title="Collect 3 Idea Sparks for Focus Mode">
              <div class="spark-orb"></div>
              <div class="spark-orb"></div>
              <div class="spark-orb"></div>
            </div>
            <div id="focus-timer-wrap" class="focus-timer-bar-wrap">
              <div id="focus-timer-bar" class="focus-timer-bar"></div>
            </div>
          </div>

          <!-- Right: Distance, Coins & Pause -->
          <div class="hud-right-cluster">
            <div class="hud-stat-stack">
              <div class="hud-pill distance">
                <span class="icon">📍</span>
                <span id="hud-dist-val">0m</span>
              </div>
              <div class="hud-pill coins">
                <span class="icon">⚡</span>
                <span id="hud-coin-val">0</span>
              </div>
            </div>
            <button id="btn-hud-pause" class="btn-hud-icon interactive" title="Pause Game" aria-label="Pause Game">⏸</button>
          </div>
        </div>

        <!-- Powerup Status Chips -->
        <div id="hud-powerup-bar" class="hud-powerup-bar"></div>
      </div>

      <!-- PAUSE OVERLAY -->
      <div id="pause-modal" class="modal-backdrop">
        <div class="modal-window pause-window interactive">
          <h2 class="pause-title">PAUSED</h2>
          <div class="pause-actions">
            <button id="btn-pause-resume" class="btn-primary-action" aria-label="Resume Game">RESUME</button>
            <button id="btn-pause-home" class="btn-secondary-action" aria-label="Return to Home">HOME</button>
          </div>
        </div>
      </div>

      <!-- GAME OVER SCREEN -->
      <div id="gameover-screen" class="screen">
        <div class="gameover-card interactive">
          <h2 class="gameover-title">RUN OVER</h2>
          <div id="new-best-badge" class="new-best-badge">🎉 NEW RECORD!</div>

          <div class="gameover-score-wrap">
            <div class="gameover-score-label">FINAL SCORE</div>
            <div id="gameover-score-num" class="gameover-score-num">0</div>
          </div>

          <div class="gameover-stats-grid">
            <div class="gameover-stat-box">
              <span class="label">Best Score</span>
              <span id="gameover-best-val" class="val">0</span>
            </div>
            <div class="gameover-stat-box">
              <span class="label">Distance</span>
              <span id="gameover-dist-val" class="val">0m</span>
            </div>
            <div class="gameover-stat-box">
              <span class="label">Stage</span>
              <span id="gameover-stage-val" class="val">Stage 1</span>
            </div>
            <div class="gameover-stat-box">
              <span class="label">Byte Coins</span>
              <span id="gameover-coin-val" class="val">0</span>
            </div>
          </div>

          <div class="gameover-btn-group">
            <button id="btn-play-again" class="btn-primary-action" aria-label="Run Again">RUN AGAIN</button>
            <button id="btn-gameover-menu" class="btn-secondary-action" aria-label="Return to Main Menu">HOME</button>
          </div>
        </div>
      </div>
    `;

    // Cache element references
    this.screenMenu = this.root.querySelector('#main-menu')!;
    this.screenHUD = this.root.querySelector('#hud-screen')!;
    this.screenGameOver = this.root.querySelector('#gameover-screen')!;
    this.modalPause = this.root.querySelector('#pause-modal')!;

    this.hudScoreVal = this.root.querySelector('#hud-score-val')!;
    this.hudMultBadge = this.root.querySelector('#hud-mult-badge')!;
    this.hudStageBadge = this.root.querySelector('#hud-stage-badge')!;
    this.hudDistVal = this.root.querySelector('#hud-dist-val')!;
    this.hudCoinVal = this.root.querySelector('#hud-coin-val')!;
    this.sparkOrbs = Array.from(this.root.querySelectorAll('.spark-orb'));
    this.focusTimerWrap = this.root.querySelector('#focus-timer-wrap')!;
    this.focusTimerBar = this.root.querySelector('#focus-timer-bar')!;
    this.powerupBar = this.root.querySelector('#hud-powerup-bar')!;
    this.levelUpBanner = this.root.querySelector('#level-up-banner')!;
    this.touchHint = this.root.querySelector('#touch-hint')!;

    this.menuBestScore = this.root.querySelector('#menu-best-val')!;
  }

  private bindEvents(): void {
    // Menu: Play Now immediately starts run
    this.root.querySelector('#btn-play-now')!.addEventListener('click', () => {
      soundManager.init();
      this.startGame();
    });

    // Quick sound toggle in header
    this.root.querySelector('#btn-quick-sound')!.addEventListener('click', (e) => {
      e.stopPropagation();
      soundManager.init();
      const muted = soundManager.toggleSfxMute();
      soundManager.toggleMusicMute();
      this.root.querySelector('#btn-quick-sound')!.textContent = muted ? '🔇' : '🔊';
      this.showToast(muted ? 'Sound Muted' : 'Sound Enabled');
    });

    // HUD: Pause button
    this.root.querySelector('#btn-hud-pause')!.addEventListener('click', (e) => {
      e.stopPropagation();
      this.openPauseModal();
    });

    // Pause Modal actions
    this.root.querySelector('#btn-pause-resume')!.addEventListener('click', () => {
      this.closePauseModal();
      this.engine.resume();
    });

    this.root.querySelector('#btn-pause-home')!.addEventListener('click', () => {
      this.closePauseModal();
      this.showMainMenu();
    });

    // Game Over actions
    this.root.querySelector('#btn-play-again')!.addEventListener('click', () => {
      this.startGame();
    });

    this.root.querySelector('#btn-gameover-menu')!.addEventListener('click', () => {
      this.showMainMenu();
    });
  }

  public showMainMenu(): void {
    this.engine.returnToMenu();
    this.menuBestScore.textContent = `BEST: ${storage.getHighScore().toLocaleString()}`;

    this.screenMenu.classList.add('active');
    this.screenHUD.classList.remove('active');
    this.screenGameOver.classList.remove('active');
    this.closePauseModal();
  }

  public startGame(): void {
    this.screenMenu.classList.remove('active');
    this.screenHUD.classList.add('active');
    this.screenGameOver.classList.remove('active');
    this.closePauseModal();

    this.engine.startRun();

    // Show non-blocking touch hint briefly on first play of session
    if (!this.hasShownTouchHint && ('ontouchstart' in window || navigator.maxTouchPoints > 0)) {
      this.hasShownTouchHint = true;
      this.touchHint.classList.add('active');
      setTimeout(() => {
        this.touchHint.classList.remove('active');
      }, 2800);
    }
  }

  private handleStatsUpdate = (stats: GameStats): void => {
    this.hudScoreVal.textContent = stats.score.toLocaleString();
    this.hudDistVal.textContent = `${stats.distance}m`;
    this.hudCoinVal.textContent = stats.coins.toString();
    this.hudStageBadge.textContent = `STAGE ${stats.stage}`;

    // Multiplier Badge
    if (stats.focusTimer > 0) {
      this.hudMultBadge.textContent = `${stats.multiplier}x FOCUS!`;
      this.hudMultBadge.classList.add('focus-active');
    } else {
      this.hudMultBadge.textContent = `${stats.multiplier}x`;
      this.hudMultBadge.classList.remove('focus-active');
    }

    // Spark orbs
    this.sparkOrbs.forEach((orb, idx) => {
      if (idx < stats.sparks) {
        orb.classList.add('filled');
      } else {
        orb.classList.remove('filled');
      }
    });

    // Focus countdown bar
    if (stats.focusTimer > 0) {
      this.focusTimerWrap.classList.add('active');
      const pct = (stats.focusTimer / stats.focusMax) * 100;
      this.focusTimerBar.style.width = `${pct}%`;
    } else {
      this.focusTimerWrap.classList.remove('active');
    }

    // Active power-up chips
    this.renderPowerUpChips(stats);
  };

  private handleLevelUp = (stage: number, stageName: string): void => {
    if (this.levelUpTimeout !== null) {
      clearTimeout(this.levelUpTimeout);
      this.levelUpTimeout = null;
    }

    this.levelUpBanner.textContent = `STAGE ${stage}: ${stageName.toUpperCase()}`;
    this.levelUpBanner.classList.add('active');

    this.levelUpTimeout = window.setTimeout(() => {
      this.levelUpBanner.classList.remove('active');
      this.levelUpTimeout = null;
    }, 1400);
  };

  private renderPowerUpChips(stats: GameStats): void {
    let html = '';
    if (stats.shieldActive) {
      html += `<div class="powerup-chip shield"><span>🛡️</span> SHIELD</div>`;
    }
    if (stats.magnetTimer > 0) {
      html += `<div class="powerup-chip magnet"><span>🧲</span> MAGNET ${stats.magnetTimer.toFixed(1)}s</div>`;
    }
    if (stats.sprintTimer > 0) {
      html += `<div class="powerup-chip sprint"><span>⚡</span> SPRINT ${stats.sprintTimer.toFixed(1)}s</div>`;
    }
    this.powerupBar.innerHTML = html;
  }

  private handleFocusModeChange = (active: boolean): void => {
    if (active) {
      this.showToast('⚡ FOCUS MODE! (3x Multiplier)');
    }
  };

  private handleGameOver = (result: {
    score: number;
    distance: number;
    stage: number;
    coins: number;
    isNewBest: boolean;
    rank: number;
  }): void => {
    this.screenHUD.classList.remove('active');
    this.screenGameOver.classList.add('active');

    (this.root.querySelector('#gameover-score-num') as HTMLElement).textContent = result.score.toLocaleString();
    (this.root.querySelector('#gameover-best-val') as HTMLElement).textContent = storage.getHighScore().toLocaleString();
    (this.root.querySelector('#gameover-dist-val') as HTMLElement).textContent = `${result.distance}m`;
    (this.root.querySelector('#gameover-stage-val') as HTMLElement).textContent = `Stage ${result.stage}`;
    (this.root.querySelector('#gameover-coin-val') as HTMLElement).textContent = result.coins.toString();

    const newBestBadge = this.root.querySelector('#new-best-badge') as HTMLElement;
    if (result.isNewBest) {
      newBestBadge.classList.add('active');
      soundManager.playPersonalBest();
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 }
      });
    } else {
      newBestBadge.classList.remove('active');
    }
  };

  public showToast(msg: string): void {
    const container = this.root.querySelector('#toast-container')!;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span>⚡</span> <span>${msg}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-14px)';
      toast.style.transition = 'all 0.25s ease';
      setTimeout(() => toast.remove(), 250);
    }, 2200);
  }

  public openPauseModal(): void {
    this.engine.pause();
    this.modalPause.classList.add('active');
  }

  public closePauseModal(): void {
    this.modalPause.classList.remove('active');
  }
}
