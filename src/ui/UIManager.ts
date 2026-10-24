/**
 * CAMPUS RUSH - UI Manager & Screen Transitions
 * Mobile-First, Minimal, High-Contrast Arcade Runner UI
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
  private screenPause!: HTMLElement;

  // HUD elements
  private hudScoreVal!: HTMLElement;
  private hudMultBadge!: HTMLElement;
  private hudDistVal!: HTMLElement;
  private hudCoinVal!: HTMLElement;
  private hudZoneBadge!: HTMLElement;
  private sparkOrbs: HTMLElement[] = [];
  private focusTimerWrap!: HTMLElement;
  private focusTimerBar!: HTMLElement;
  private powerupBar!: HTMLElement;
  private swipeHint!: HTMLElement;
  private btnSoundToggle!: HTMLButtonElement;

  // Menu Elements
  private menuBestScore!: HTMLElement;

  // Game over elements
  private gameOverTitle!: HTMLElement;
  private gameOverScoreNum!: HTMLElement;
  private gameOverBestRecord!: HTMLElement;
  private gameOverDistVal!: HTMLElement;
  private gameOverCoinVal!: HTMLElement;
  private newBestBadge!: HTMLElement;

  private isFirstRun: boolean = true;
  private swipeHintTimer: number | null = null;

  constructor(engine: GameEngine, root: HTMLElement) {
    this.engine = engine;
    this.root = root;

    this.buildDOM();
    this.bindEvents();

    // Hook callbacks
    this.engine.onStatsUpdate = this.handleStatsUpdate;
    this.engine.onGameOver = this.handleGameOver;
    this.engine.onFocusModeChange = this.handleFocusModeChange;
    this.engine.onPauseRequested = () => this.openPauseModal();
    this.engine.onZoneAnnounce = this.handleZoneAnnounce;

    this.showMainMenu();
  }

  private buildDOM(): void {
    this.root.innerHTML = `
      <!-- Toast Container -->
      <div id="toast-container" aria-live="polite"></div>

      <!-- MAIN MENU SCREEN -->
      <div id="main-menu" class="screen active interactive">
        <header class="menu-top-bar">
          <div class="menu-best-pill" title="Personal Best Score">
            <span class="icon">🏆</span>
            <span id="menu-best-val">BEST: 0</span>
          </div>
          <button id="btn-quick-sound" class="btn-sound-toggle" aria-label="Toggle Sound" title="Toggle Sound">
            <span class="sound-icon" aria-hidden="true">🔊</span>
          </button>
        </header>

        <main class="menu-center">
          <div class="brand-hero">
            <h1 class="brand-title">CAMPUS RUSH</h1>
            <p class="brand-tagline">One More Run. Beat Your Best.</p>
          </div>

          <button id="btn-play-now" class="btn-play-primary" aria-label="Start Game">
            <span class="btn-play-icon" aria-hidden="true">▶</span>
            <span>PLAY</span>
          </button>
        </main>
      </div>

      <!-- GAMEPLAY HUD -->
      <div id="hud-screen" class="screen">
        <header class="hud-header">
          <!-- Left: Score Card -->
          <div class="hud-score-card">
            <span class="hud-score-label">SCORE</span>
            <span id="hud-score-val" class="hud-score-value">0</span>
            <span id="hud-mult-badge" class="hud-multiplier-badge">1x MULT</span>
          </div>

          <!-- Center: Sparks & Stage -->
          <div class="hud-center-cluster">
            <div id="hud-zone-badge" class="hud-zone-pill">CAMPUS</div>
            <div class="focus-spark-meter" title="Collect 3 Idea Sparks for Focus Mode">
              <div class="spark-orb"></div>
              <div class="spark-orb"></div>
              <div class="spark-orb"></div>
            </div>
            <div id="focus-timer-wrap" class="focus-timer-bar-wrap">
              <div id="focus-timer-bar" class="focus-timer-bar"></div>
            </div>
          </div>

          <!-- Right: Distance, Coins, & Pause Button -->
          <div class="hud-right-cluster">
            <div class="hud-metrics">
              <div class="hud-metric-pill distance" title="Distance Run">
                <span class="icon">📍</span>
                <span id="hud-dist-val">0m</span>
              </div>
              <div class="hud-metric-pill coins" title="Coins Collected">
                <span class="icon">⚡</span>
                <span id="hud-coin-val">0</span>
              </div>
            </div>
            <button id="btn-hud-pause" class="btn-hud-pause interactive" aria-label="Pause Game" title="Pause Game">
              <span class="pause-icon" aria-hidden="true">⏸</span>
            </button>
          </div>
        </header>

        <!-- Active Power-up Status Chips -->
        <div id="hud-powerup-bar" class="hud-powerup-bar"></div>

        <!-- First-Run Swipe Instruction Hint (Auto-fading) -->
        <div id="hud-swipe-hint" class="hud-swipe-hint">
          SWIPE TO MOVE • UP TO JUMP • DOWN TO SLIDE
        </div>
      </div>

      <!-- PAUSE OVERLAY -->
      <div id="pause-screen" class="screen modal-overlay">
        <div class="modal-card pause-card interactive">
          <h2 class="modal-card-title">PAUSED</h2>
          <div class="modal-card-actions">
            <button id="btn-pause-resume" class="btn-primary-action">RESUME</button>
            <button id="btn-pause-home" class="btn-secondary-action">HOME</button>
          </div>
        </div>
      </div>

      <!-- GAME OVER SCREEN -->
      <div id="gameover-screen" class="screen">
        <div class="gameover-card interactive">
          <h2 id="gameover-title" class="gameover-title">RUN OVER</h2>
          <div id="new-best-badge" class="new-best-badge">NEW RECORD!</div>

          <div class="gameover-score-wrap">
            <div class="gameover-score-label">FINAL SCORE</div>
            <div id="gameover-score-num" class="gameover-score-num">0</div>
            <div id="gameover-best-record" class="gameover-best-record">BEST: 0</div>
          </div>

          <div class="gameover-stats-grid">
            <div class="gameover-stat-box">
              <span class="label">Distance</span>
              <span id="gameover-dist-val" class="val">0m</span>
            </div>
            <div class="gameover-stat-box">
              <span class="label">Byte Coins</span>
              <span id="gameover-coin-val" class="val">0</span>
            </div>
          </div>

          <div class="gameover-btn-group">
            <button id="btn-play-again" class="btn-primary-action">RUN AGAIN</button>
            <button id="btn-gameover-menu" class="btn-secondary-action">HOME</button>
          </div>
        </div>
      </div>
    `;

    // Cache elements
    this.screenMenu = this.root.querySelector('#main-menu')!;
    this.screenHUD = this.root.querySelector('#hud-screen')!;
    this.screenGameOver = this.root.querySelector('#gameover-screen')!;
    this.screenPause = this.root.querySelector('#pause-screen')!;

    this.hudScoreVal = this.root.querySelector('#hud-score-val')!;
    this.hudMultBadge = this.root.querySelector('#hud-mult-badge')!;
    this.hudDistVal = this.root.querySelector('#hud-dist-val')!;
    this.hudCoinVal = this.root.querySelector('#hud-coin-val')!;
    this.hudZoneBadge = this.root.querySelector('#hud-zone-badge')!;
    this.sparkOrbs = Array.from(this.root.querySelectorAll('.spark-orb'));
    this.focusTimerWrap = this.root.querySelector('#focus-timer-wrap')!;
    this.focusTimerBar = this.root.querySelector('#focus-timer-bar')!;
    this.powerupBar = this.root.querySelector('#hud-powerup-bar')!;
    this.swipeHint = this.root.querySelector('#hud-swipe-hint')!;
    this.btnSoundToggle = this.root.querySelector('#btn-quick-sound') as HTMLButtonElement;

    this.menuBestScore = this.root.querySelector('#menu-best-val')!;

    this.gameOverTitle = this.root.querySelector('#gameover-title')!;
    this.gameOverScoreNum = this.root.querySelector('#gameover-score-num')!;
    this.gameOverBestRecord = this.root.querySelector('#gameover-best-record')!;
    this.gameOverDistVal = this.root.querySelector('#gameover-dist-val')!;
    this.gameOverCoinVal = this.root.querySelector('#gameover-coin-val')!;
    this.newBestBadge = this.root.querySelector('#new-best-badge')!;
  }

  private bindEvents(): void {
    // Menu Play Now
    const playBtn = this.root.querySelector('#btn-play-now')!;
    playBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      soundManager.init();
      this.startGame();
    });

    // Sound toggle
    this.btnSoundToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      soundManager.init();
      const muted = soundManager.toggleSfxMute();
      soundManager.toggleMusicMute();
      this.updateSoundToggleState(muted);
      this.showToast(muted ? 'Sound Muted' : 'Sound Enabled');
    });

    // HUD Pause
    const pauseBtn = this.root.querySelector('#btn-hud-pause')!;
    pauseBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.openPauseModal();
    });

    // Pause Resume
    this.root.querySelector('#btn-pause-resume')!.addEventListener('click', (e) => {
      e.stopPropagation();
      this.closePauseModal();
      this.engine.resume();
    });

    // Pause Home
    this.root.querySelector('#btn-pause-home')!.addEventListener('click', (e) => {
      e.stopPropagation();
      this.closePauseModal();
      this.showMainMenu();
    });

    // Game Over Buttons
    this.root.querySelector('#btn-play-again')!.addEventListener('click', (e) => {
      e.stopPropagation();
      this.startGame();
    });

    this.root.querySelector('#btn-gameover-menu')!.addEventListener('click', (e) => {
      e.stopPropagation();
      this.showMainMenu();
    });
  }

  private updateSoundToggleState(muted: boolean): void {
    const icon = this.btnSoundToggle.querySelector('.sound-icon');
    if (icon) {
      icon.textContent = muted ? '🔇' : '🔊';
    }
    this.btnSoundToggle.setAttribute('aria-label', muted ? 'Unmute Sound' : 'Mute Sound');
  }

  public showMainMenu(): void {
    this.engine.returnToMenu();
    this.menuBestScore.textContent = `BEST: ${storage.getHighScore().toLocaleString()}`;

    this.screenMenu.classList.add('active');
    this.screenHUD.classList.remove('active');
    this.screenGameOver.classList.remove('active');
    this.screenPause.classList.remove('active');
  }

  public startGame(): void {
    this.screenMenu.classList.remove('active');
    this.screenHUD.classList.add('active');
    this.screenGameOver.classList.remove('active');
    this.screenPause.classList.remove('active');

    this.hudZoneBadge.textContent = 'CAMPUS';

    // First run swipe hint
    if (this.isFirstRun) {
      this.swipeHint.classList.add('visible');
      if (this.swipeHintTimer !== null) clearTimeout(this.swipeHintTimer);
      this.swipeHintTimer = window.setTimeout(() => {
        this.swipeHint.classList.remove('visible');
        this.isFirstRun = false;
      }, 3500);
    } else {
      this.swipeHint.classList.remove('visible');
    }

    this.engine.startRun();
  }

  public openPauseModal(): void {
    this.engine.pause();
    this.screenPause.classList.add('active');
  }

  public closePauseModal(): void {
    this.screenPause.classList.remove('active');
  }

  private handleStatsUpdate = (stats: GameStats): void => {
    this.hudScoreVal.textContent = stats.score.toLocaleString();
    this.hudDistVal.textContent = `${stats.distance}m`;
    this.hudCoinVal.textContent = stats.coins.toString();

    // Multiplier Badge
    if (stats.focusTimer > 0) {
      this.hudMultBadge.textContent = `${stats.multiplier}x FOCUS!`;
      this.hudMultBadge.classList.add('focus-active');
    } else {
      this.hudMultBadge.textContent = `${stats.multiplier}x MULT`;
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
      this.showToast('⚡ FOCUS MODE (3x Multiplier)');
    }
  };

  private handleZoneAnnounce = (zoneName: string): void => {
    this.hudZoneBadge.textContent = zoneName.toUpperCase();
    this.showToast(`📍 ${zoneName.toUpperCase()}`);
  };

  private handleGameOver = (result: {
    score: number;
    distance: number;
    coins: number;
    isNewBest: boolean;
    rank: number;
  }): void => {
    this.screenHUD.classList.remove('active');
    this.screenGameOver.classList.add('active');

    this.gameOverScoreNum.textContent = result.score.toLocaleString();
    this.gameOverDistVal.textContent = `${result.distance}m`;
    this.gameOverCoinVal.textContent = result.coins.toString();
    this.gameOverBestRecord.textContent = `BEST: ${storage.getHighScore().toLocaleString()}`;

    if (result.isNewBest) {
      this.gameOverTitle.textContent = 'NEW RECORD!';
      this.newBestBadge.classList.add('active');
      soundManager.playPersonalBest();
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    } else {
      this.gameOverTitle.textContent = 'RUN OVER';
      this.newBestBadge.classList.remove('active');
    }
  };

  public showToast(msg: string): void {
    const container = this.root.querySelector('#toast-container')!;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span>${msg}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-16px)';
      toast.style.transition = 'all 0.25s ease';
      setTimeout(() => toast.remove(), 260);
    }, 2200);
  }
}
