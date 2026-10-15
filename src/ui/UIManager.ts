/**
 * Deepesh Dash: Campus Rush - UI Manager & Screen Transitions
 */
import confetti from 'canvas-confetti';
import { GameEngine, GameStats } from '../game/GameEngine';
import { storage } from '../systems/Storage';
import { missionManager, Mission } from '../systems/Missions';
import { passAndPlay } from '../systems/PassAndPlay';
import { soundManager } from '../audio/SoundSynthesizer';
import { OUTFITS } from '../game/Constants';

export class UIManager {
  private engine: GameEngine;
  private root: HTMLElement;

  // Screens
  private screenMenu!: HTMLElement;
  private screenHUD!: HTMLElement;
  private screenGameOver!: HTMLElement;

  // Modals
  private modalContainer!: HTMLElement;
  private modalTitle!: HTMLElement;
  private modalBody!: HTMLElement;
  private modalFooter!: HTMLElement;

  // HUD elements
  private hudScoreVal!: HTMLElement;
  private hudMultBadge!: HTMLElement;
  private hudDistVal!: HTMLElement;
  private hudCoinVal!: HTMLElement;
  private sparkOrbs: HTMLElement[] = [];
  private focusTimerWrap!: HTMLElement;
  private focusTimerBar!: HTMLElement;
  private powerupBar!: HTMLElement;
  private mobileControlsWrap!: HTMLElement;

  // Menu Elements
  private menuBestScore!: HTMLElement;
  private menuCoinBalance!: HTMLElement;

  constructor(engine: GameEngine, root: HTMLElement) {
    this.engine = engine;
    this.root = root;

    this.buildDOM();
    this.bindEvents();

    // Hook callbacks
    this.engine.onStatsUpdate = this.handleStatsUpdate;
    this.engine.onGameOver = this.handleGameOver;
    this.engine.onFocusModeChange = this.handleFocusModeChange;
    missionManager.onMissionCompletedCallback = this.handleMissionCompleted;

    this.showMainMenu();
  }

  private buildDOM(): void {
    this.root.innerHTML = `
      <!-- Toast Container -->
      <div id="toast-container"></div>

      <!-- MAIN MENU SCREEN -->
      <div id="main-menu" class="screen active interactive">
        <header class="menu-header">
          <div class="stats-pill-group">
            <div class="stat-pill best">
              <span class="icon">🏆</span>
              <span id="menu-best-val">BEST: 0</span>
            </div>
            <div class="stat-pill coins">
              <span class="icon">⚡</span>
              <span id="menu-coin-val">0</span>
            </div>
          </div>
          <button id="btn-quick-sound" class="btn-hud-icon" title="Toggle Sound">🔊</button>
        </header>

        <main class="menu-center">
          <div class="game-title-container">
            <div class="campus-badge">CAMPUS ARCADE RUNNER</div>
            <h1 class="game-title">DEEPESH DASH</h1>
            <div class="game-subtitle">CAMPUS RUSH</div>
            <div class="game-tagline">“One More Run. Beat Your Best.”</div>
          </div>

          <button id="btn-play-now" class="btn-play-primary">
            <span>▶ PLAY NOW</span>
          </button>
        </main>

        <footer class="menu-footer">
          <div class="menu-action-grid">
            <button id="btn-menu-locker" class="btn-menu-action">
              <span>👕</span> Locker
            </button>
            <button id="btn-menu-leaderboard" class="btn-menu-action">
              <span>🏆</span> Leaderboard
            </button>
            <button id="btn-menu-passplay" class="btn-menu-action">
              <span>👥</span> Pass & Play
            </button>
            <button id="btn-menu-missions" class="btn-menu-action">
              <span>🎯</span> Missions
            </button>
            <button id="btn-menu-howtoplay" class="btn-menu-action">
              <span>❓</span> How to Play
            </button>
            <button id="btn-menu-settings" class="btn-menu-action">
              <span>⚙️</span> Settings
            </button>
          </div>

          <div class="dev-credit-tag">
            Created with passion by <span>Deepesh Pankaj</span>
          </div>
        </footer>
      </div>

      <!-- GAMEPLAY HUD -->
      <div id="hud-screen" class="screen">
        <div class="hud-top-bar">
          <div class="hud-card">
            <div class="hud-score-label">SCORE</div>
            <div id="hud-score-val" class="hud-score-value">0</div>
            <div id="hud-mult-badge" class="hud-multiplier-badge">1x MULT</div>
          </div>

          <div class="hud-center-cluster">
            <div class="focus-spark-meter" title="Collect 3 Idea Sparks for Focus Mode!">
              <div class="spark-orb"></div>
              <div class="spark-orb"></div>
              <div class="spark-orb"></div>
            </div>
            <div id="focus-timer-wrap" class="focus-timer-bar-wrap">
              <div id="focus-timer-bar" class="focus-timer-bar"></div>
            </div>
          </div>

          <div class="hud-right-cluster">
            <div class="hud-pill distance">
              <span>📍</span>
              <span id="hud-dist-val">0m</span>
            </div>
            <div class="hud-pill coins">
              <span>⚡</span>
              <span id="hud-coin-val">0</span>
            </div>
            <button id="btn-hud-pause" class="btn-hud-icon interactive" title="Pause Game">⏸</button>
          </div>
        </div>

        <!-- Powerup Chips -->
        <div id="hud-powerup-bar" class="hud-powerup-bar"></div>

        <!-- Mobile Touch Controls -->
        <div id="mobile-controls" class="mobile-touch-controls">
          <div class="touch-dpad-left">
            <button id="btn-touch-left" class="btn-touch">◀</button>
            <button id="btn-touch-right" class="btn-touch">▶</button>
          </div>
          <div class="touch-dpad-right">
            <button id="btn-touch-jump" class="btn-touch">▲</button>
            <button id="btn-touch-slide" class="btn-touch">▼</button>
          </div>
        </div>
      </div>

      <!-- GAME OVER SCREEN -->
      <div id="gameover-screen" class="screen">
        <div class="gameover-card interactive">
          <h2 class="gameover-title">GAME OVER</h2>
          <div id="new-best-badge" class="new-best-badge">🎉 NEW PERSONAL RECORD!</div>

          <div class="gameover-score-wrap">
            <div class="gameover-score-label">FINAL SCORE</div>
            <div id="gameover-score-num" class="gameover-score-num">0</div>
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
            <div class="gameover-stat-box">
              <span class="label">Rank</span>
              <span id="gameover-rank-val" class="val">#1</span>
            </div>
            <div class="gameover-stat-box">
              <span class="label">Mode</span>
              <span id="gameover-mode-val" class="val">Solo</span>
            </div>
          </div>

          <!-- Pass & Play Turn Indicator -->
          <div id="passplay-banner" style="display:none; margin-bottom: 16px; color: var(--electric-cyan); font-weight:800;"></div>

          <div class="gameover-btn-group">
            <button id="btn-play-again" class="btn-primary-action">PLAY AGAIN</button>
            <button id="btn-share-score" class="btn-secondary-action">📤 SHARE SCORE</button>
            <button id="btn-gameover-menu" class="btn-secondary-action">🏠 MAIN MENU</button>
          </div>
        </div>
      </div>

      <!-- MODAL BACKDROP -->
      <div id="modal-backdrop" class="modal-backdrop">
        <div class="modal-window">
          <div class="modal-header">
            <h3 id="modal-title" class="modal-title">Modal Title</h3>
            <button id="btn-close-modal" class="btn-close-modal">✕</button>
          </div>
          <div id="modal-body" class="modal-body"></div>
          <div id="modal-footer" class="modal-footer"></div>
        </div>
      </div>
    `;

    // Cache elements
    this.screenMenu = this.root.querySelector('#main-menu')!;
    this.screenHUD = this.root.querySelector('#hud-screen')!;
    this.screenGameOver = this.root.querySelector('#gameover-screen')!;

    this.modalContainer = this.root.querySelector('#modal-backdrop')!;
    this.modalTitle = this.root.querySelector('#modal-title')!;
    this.modalBody = this.root.querySelector('#modal-body')!;
    this.modalFooter = this.root.querySelector('#modal-footer')!;

    this.hudScoreVal = this.root.querySelector('#hud-score-val')!;
    this.hudMultBadge = this.root.querySelector('#hud-mult-badge')!;
    this.hudDistVal = this.root.querySelector('#hud-dist-val')!;
    this.hudCoinVal = this.root.querySelector('#hud-coin-val')!;
    this.sparkOrbs = Array.from(this.root.querySelectorAll('.spark-orb'));
    this.focusTimerWrap = this.root.querySelector('#focus-timer-wrap')!;
    this.focusTimerBar = this.root.querySelector('#focus-timer-bar')!;
    this.powerupBar = this.root.querySelector('#hud-powerup-bar')!;
    this.mobileControlsWrap = this.root.querySelector('#mobile-controls')!;

    this.menuBestScore = this.root.querySelector('#menu-best-val')!;
    this.menuCoinBalance = this.root.querySelector('#menu-coin-val')!;

    this.updateTouchControlsVisibility();
  }

  private bindEvents(): void {
    // Menu Play Now
    this.root.querySelector('#btn-play-now')!.addEventListener('click', () => {
      soundManager.init();
      this.startGame();
    });

    // Quick sound toggle
    this.root.querySelector('#btn-quick-sound')!.addEventListener('click', () => {
      soundManager.init();
      const muted = soundManager.toggleSfxMute();
      soundManager.toggleMusicMute();
      this.root.querySelector('#btn-quick-sound')!.textContent = muted ? '🔇' : '🔊';
      this.showToast(muted ? 'Sound Muted' : 'Sound Enabled');
    });

    // Menu Action Buttons
    this.root.querySelector('#btn-menu-locker')!.addEventListener('click', () => this.openLockerModal());
    this.root.querySelector('#btn-menu-leaderboard')!.addEventListener('click', () => this.openLeaderboardModal());
    this.root.querySelector('#btn-menu-passplay')!.addEventListener('click', () => this.openPassAndPlayModal());
    this.root.querySelector('#btn-menu-missions')!.addEventListener('click', () => this.openMissionsModal());
    this.root.querySelector('#btn-menu-howtoplay')!.addEventListener('click', () => this.openHowToPlayModal());
    this.root.querySelector('#btn-menu-settings')!.addEventListener('click', () => this.openSettingsModal());

    // Modal Close
    this.root.querySelector('#btn-close-modal')!.addEventListener('click', () => this.closeModal());
    this.modalContainer.addEventListener('click', (e) => {
      if (e.target === this.modalContainer) this.closeModal();
    });

    // HUD Pause
    this.root.querySelector('#btn-hud-pause')!.addEventListener('click', () => {
      this.openPauseModal();
    });

    // Mobile on-screen touch buttons
    this.root.querySelector('#btn-touch-left')!.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      this.engine.handleLeft();
    });
    this.root.querySelector('#btn-touch-right')!.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      this.engine.handleRight();
    });
    this.root.querySelector('#btn-touch-jump')!.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      this.engine.handleJump();
    });
    this.root.querySelector('#btn-touch-slide')!.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      this.engine.handleSlide();
    });

    // Game Over Buttons
    this.root.querySelector('#btn-play-again')!.addEventListener('click', () => {
      if (passAndPlay.isActive) {
        if (passAndPlay.advanceTurn()) {
          this.startGame();
        } else {
          this.openPassAndPlayResultsModal();
        }
      } else {
        this.startGame();
      }
    });

    this.root.querySelector('#btn-share-score')!.addEventListener('click', () => {
      this.shareScore();
    });

    this.root.querySelector('#btn-gameover-menu')!.addEventListener('click', () => {
      passAndPlay.endSession();
      this.showMainMenu();
    });
  }

  public showMainMenu(): void {
    this.engine.returnToMenu();
    this.menuBestScore.textContent = `BEST: ${storage.getHighScore().toLocaleString()}`;
    this.menuCoinBalance.textContent = storage.getCoins().toLocaleString();

    this.screenMenu.classList.add('active');
    this.screenHUD.classList.remove('active');
    this.screenGameOver.classList.remove('active');
    this.closeModal();
  }

  public startGame(): void {
    this.screenMenu.classList.remove('active');
    this.screenHUD.classList.add('active');
    this.screenGameOver.classList.remove('active');
    this.closeModal();

    this.engine.startRun();
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
      html += `<div class="powerup-chip shield"><span>🛡️</span> SHIELD ACTIVE</div>`;
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
      this.showToast('⚡ FOCUS MODE ACTIVATED! (3x Multiplier)');
    }
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

    (this.root.querySelector('#gameover-score-num') as HTMLElement).textContent = result.score.toLocaleString();
    (this.root.querySelector('#gameover-dist-val') as HTMLElement).textContent = `${result.distance}m`;
    (this.root.querySelector('#gameover-coin-val') as HTMLElement).textContent = result.coins.toString();
    (this.root.querySelector('#gameover-rank-val') as HTMLElement).textContent = `#${result.rank}`;

    const newBestBadge = this.root.querySelector('#new-best-badge') as HTMLElement;
    if (result.isNewBest) {
      newBestBadge.classList.add('active');
      soundManager.playPersonalBest();
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    } else {
      newBestBadge.classList.remove('active');
    }

    // Pass & Play turn info
    const ppBanner = this.root.querySelector('#passplay-banner') as HTMLElement;
    const playAgainBtn = this.root.querySelector('#btn-play-again') as HTMLElement;
    const modeVal = this.root.querySelector('#gameover-mode-val') as HTMLElement;

    if (passAndPlay.isActive) {
      modeVal.textContent = 'Pass & Play';
      const curr = passAndPlay.getCurrentPlayer();
      if (passAndPlay.currentTurnIndex < passAndPlay.players.length - 1) {
        const nextPlayer = passAndPlay.players[passAndPlay.currentTurnIndex + 1];
        ppBanner.style.display = 'block';
        ppBanner.textContent = `Completed: ${curr?.name}. Next Up: ${nextPlayer?.name}!`;
        playAgainBtn.textContent = `PASS TO ${nextPlayer.name.toUpperCase()}`;
      } else {
        ppBanner.style.display = 'block';
        ppBanner.textContent = `All players have finished!`;
        playAgainBtn.textContent = `VIEW TOURNAMENT RESULTS`;
      }
    } else {
      modeVal.textContent = 'Solo Run';
      ppBanner.style.display = 'none';
      playAgainBtn.textContent = 'PLAY AGAIN';
    }
  };

  private handleMissionCompleted = (mission: Mission): void => {
    this.showToast(`🎯 MISSION COMPLETE: ${mission.title} (+${mission.rewardCoins} ⚡)`);
  };

  public showToast(msg: string): void {
    const container = this.root.querySelector('#toast-container')!;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span>⚡</span> <span>${msg}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-20px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 2800);
  }

  // ================= MODAL IMPLEMENTATIONS =================

  public openModal(title: string, bodyHTML: string, footerHTML: string = ''): void {
    this.modalTitle.innerHTML = title;
    this.modalBody.innerHTML = bodyHTML;
    this.modalFooter.innerHTML = footerHTML;
    this.modalContainer.classList.add('active');
  }

  public closeModal(): void {
    this.modalContainer.classList.remove('active');
  }

  // 1. Locker / Wardrobe Modal
  public openLockerModal(): void {
    const equipped = storage.getEquippedOutfit();
    const coins = storage.getCoins();

    let html = `
      <div style="margin-bottom: 12px; font-weight:800; color:var(--warm-saffron); display:flex; justify-content:space-between;">
        <span>YOUR BALANCE:</span> <span>${coins} ⚡ Byte Coins</span>
      </div>
      <div style="display:flex; flex-direction:column; gap:12px;">
    `;

    OUTFITS.forEach((outfit) => {
      const isUnlocked = storage.isOutfitUnlocked(outfit.id);
      const isEquipped = outfit.id === equipped;

      html += `
        <div style="background:rgba(255,255,255,0.05); border:1px solid ${isEquipped ? 'var(--electric-cyan)' : 'rgba(255,255,255,0.1)'}; padding:14px; border-radius:14px; display:flex; justify-content:space-between; align-items:center;">
          <div>
            <div style="font-weight:900; font-size:1.05rem; color:${isEquipped ? 'var(--electric-cyan)' : 'var(--soft-white)'};">${outfit.name}</div>
            <div style="font-size:0.8rem; color:rgba(255,255,255,0.6); margin-top:2px;">${outfit.description}</div>
          </div>
          <div>
      `;

      if (isEquipped) {
        html += `<span style="font-size:0.85rem; font-weight:900; color:var(--electric-cyan); background:rgba(65,229,245,0.15); padding:6px 12px; border-radius:8px;">EQUIPPED</span>`;
      } else if (isUnlocked) {
        html += `<button class="btn-secondary-action btn-equip" data-id="${outfit.id}" style="padding:6px 14px; font-size:0.85rem;">EQUIP</button>`;
      } else {
        html += `<button class="btn-primary-action btn-unlock" data-id="${outfit.id}" data-cost="${outfit.cost}" style="padding:6px 14px; font-size:0.85rem;">UNLOCK (${outfit.cost} ⚡)</button>`;
      }

      html += `</div></div>`;
    });

    html += `</div>`;

    this.openModal('👕 Character Locker', html);

    // Bind equip/unlock buttons
    this.modalBody.querySelectorAll('.btn-equip').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const id = (e.currentTarget as HTMLElement).dataset.id!;
        this.engine.setEquippedOutfit(id);
        this.showToast('Outfit Equipped!');
        this.openLockerModal();
      });
    });

    this.modalBody.querySelectorAll('.btn-unlock').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const id = (e.currentTarget as HTMLElement).dataset.id!;
        const cost = parseInt((e.currentTarget as HTMLElement).dataset.cost!, 10);
        if (storage.spendCoins(cost)) {
          storage.unlockOutfit(id);
          this.engine.setEquippedOutfit(id);
          soundManager.playPersonalBest();
          this.showToast('🎉 Outfit Unlocked!');
          this.openLockerModal();
        } else {
          this.showToast('❌ Not enough Byte Coins! Run more to earn coins.');
        }
      });
    });
  }

  // 2. Leaderboard Modal
  public openLeaderboardModal(): void {
    const list = storage.getLeaderboard();
    let html = `
      <div style="font-size:0.85rem; color:rgba(255,255,255,0.6); margin-bottom:8px;">
        Local records stored safely on this device.
      </div>
      <div style="display:flex; flex-direction:column; gap:8px;">
    `;

    list.forEach((item, idx) => {
      const isTop = idx === 0;
      html += `
        <div style="background:rgba(255,255,255,0.05); border:1px solid ${isTop ? 'var(--warm-saffron)' : 'rgba(255,255,255,0.1)'}; padding:10px 14px; border-radius:12px; display:flex; justify-content:space-between; align-items:center;">
          <div style="display:flex; align-items:center; gap:12px;">
            <span style="font-weight:900; font-size:1.1rem; width:22px; color:${isTop ? 'var(--warm-saffron)' : 'var(--electric-cyan)'};">#${idx + 1}</span>
            <div>
              <div style="font-weight:800; font-size:0.95rem;">${item.name}</div>
              <div style="font-size:0.75rem; color:rgba(255,255,255,0.5);">${item.distance}m • ${item.coins} Coins • ${item.date}</div>
            </div>
          </div>
          <div style="font-weight:900; font-size:1.2rem; color:${isTop ? 'var(--warm-saffron)' : '#FFFFFF'};">
            ${item.score.toLocaleString()}
          </div>
        </div>
      `;
    });

    html += `</div>`;
    this.openModal('🏆 Local Leaderboard', html);
  }

  // 3. Pass & Play Mode Modal
  public openPassAndPlayModal(): void {
    let html = `
      <div style="font-size:0.9rem; color:rgba(255,255,255,0.7); margin-bottom:12px;">
        Pass & Play on the same phone or laptop! Enter 2 to 4 player names below:
      </div>
      <div style="display:flex; flex-direction:column; gap:10px;">
        <input type="text" id="pp-p1" class="interactive" value="Deepesh" placeholder="Player 1 Name" style="background:rgba(0,0,0,0.4); border:1px solid var(--border-cyan); color:#FFF; padding:10px 14px; border-radius:10px; font-weight:700;">
        <input type="text" id="pp-p2" class="interactive" value="Aarav" placeholder="Player 2 Name" style="background:rgba(0,0,0,0.4); border:1px solid var(--border-cyan); color:#FFF; padding:10px 14px; border-radius:10px; font-weight:700;">
        <input type="text" id="pp-p3" class="interactive" value="" placeholder="Player 3 Name (Optional)" style="background:rgba(0,0,0,0.4); border:1px solid var(--border-cyan); color:#FFF; padding:10px 14px; border-radius:10px; font-weight:700;">
        <input type="text" id="pp-p4" class="interactive" value="" placeholder="Player 4 Name (Optional)" style="background:rgba(0,0,0,0.4); border:1px solid var(--border-cyan); color:#FFF; padding:10px 14px; border-radius:10px; font-weight:700;">
      </div>
    `;

    const footer = `
      <button id="btn-start-passplay" class="btn-primary-action" style="width:100%;">START CHALLENGE</button>
    `;

    this.openModal('👥 Pass & Play Challenge', html, footer);

    this.modalFooter.querySelector('#btn-start-passplay')!.addEventListener('click', () => {
      const p1 = (this.modalBody.querySelector('#pp-p1') as HTMLInputElement).value;
      const p2 = (this.modalBody.querySelector('#pp-p2') as HTMLInputElement).value;
      const p3 = (this.modalBody.querySelector('#pp-p3') as HTMLInputElement).value;
      const p4 = (this.modalBody.querySelector('#pp-p4') as HTMLInputElement).value;

      const players = [p1, p2, p3, p4].filter((n) => n.trim().length > 0);
      if (players.length < 2) {
        this.showToast('Please enter at least 2 players!');
        return;
      }

      passAndPlay.setupSession(players);
      this.showToast(`Starting Tournament! ${players[0]}'s Turn!`);
      this.startGame();
    });
  }

  public openPassAndPlayResultsModal(): void {
    const winner = passAndPlay.getWinner();
    const ranked = passAndPlay.getRankedPlayers();

    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.5 }
    });
    soundManager.playPersonalBest();

    let html = `
      <div style="text-align:center; margin-bottom:16px;">
        <div style="font-size:2.4rem;">👑</div>
        <div style="font-size:1.4rem; font-weight:900; color:var(--warm-saffron);">${winner?.name.toUpperCase()} WINS!</div>
        <div style="font-size:0.9rem; color:rgba(255,255,255,0.7);">Top Score: ${winner?.score.toLocaleString()} (${winner?.distance}m)</div>
      </div>
      <div style="display:flex; flex-direction:column; gap:8px;">
    `;

    ranked.forEach((p, idx) => {
      html += `
        <div style="background:rgba(255,255,255,0.05); padding:10px 14px; border-radius:10px; display:flex; justify-content:space-between; align-items:center;">
          <div><strong style="color:var(--electric-cyan);">#${idx + 1}</strong> ${p.name}</div>
          <div><strong>${p.score.toLocaleString()}</strong> pts (${p.distance}m)</div>
        </div>
      `;
    });

    html += `</div>`;

    const footer = `
      <button id="btn-finish-passplay" class="btn-primary-action" style="width:100%;">RETURN TO MAIN MENU</button>
    `;

    this.openModal('🏆 Tournament Standings', html, footer);

    this.modalFooter.querySelector('#btn-finish-passplay')!.addEventListener('click', () => {
      passAndPlay.endSession();
      this.showMainMenu();
    });
  }

  // 4. Missions Modal
  public openMissionsModal(): void {
    const list = missionManager.getAllMissions();

    let html = `<div style="display:flex; flex-direction:column; gap:10px;">`;
    list.forEach(({ mission, completed, current }) => {
      const pct = Math.min(100, (current / mission.target) * 100);

      html += `
        <div style="background:rgba(255,255,255,0.05); border:1px solid ${completed ? 'rgba(74,222,128,0.4)' : 'rgba(255,255,255,0.1)'}; padding:12px; border-radius:12px;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <div style="font-weight:800; font-size:0.95rem; color:${completed ? '#4ADE80' : 'var(--soft-white)'};">
              ${completed ? '✅' : '🎯'} ${mission.title}
            </div>
            <div style="font-weight:800; font-size:0.85rem; color:var(--warm-saffron);">
              +${mission.rewardCoins} ⚡
            </div>
          </div>
          <div style="font-size:0.8rem; color:rgba(255,255,255,0.6); margin:4px 0 8px;">
            ${mission.description}
          </div>
          <div style="background:rgba(0,0,0,0.5); height:6px; border-radius:999px; overflow:hidden;">
            <div style="background:${completed ? '#4ADE80' : 'var(--electric-cyan)'}; height:100%; width:${pct}%;"></div>
          </div>
        </div>
      `;
    });
    html += `</div>`;

    this.openModal('🎯 Campus Missions', html);
  }

  // 5. How to Play Modal
  public openHowToPlayModal(): void {
    const html = `
      <div style="display:flex; flex-direction:column; gap:14px; font-size:0.9rem; line-height:1.4;">
        <div>
          <h4 style="color:var(--electric-cyan); margin-bottom:4px;">⌨️ DESKTOP CONTROLS</h4>
          <ul style="padding-left:18px;">
            <li><strong>A / Left Arrow:</strong> Steer Left</li>
            <li><strong>D / Right Arrow:</strong> Steer Right</li>
            <li><strong>W / Up Arrow / Space:</strong> Jump over Barricades & Potholes</li>
            <li><strong>S / Down Arrow:</strong> Slide under Overhead Banners</li>
            <li><strong>P / Escape:</strong> Pause / Resume</li>
          </ul>
        </div>
        <div>
          <h4 style="color:var(--electric-cyan); margin-bottom:4px;">📱 MOBILE TOUCH CONTROLS</h4>
          <ul style="padding-left:18px;">
            <li><strong>Swipe Left / Right:</strong> Switch Lanes</li>
            <li><strong>Swipe Up:</strong> Jump</li>
            <li><strong>Swipe Down:</strong> Slide</li>
            <li>Optional on-screen D-Pad buttons available in Settings!</li>
          </ul>
        </div>
        <div>
          <h4 style="color:var(--warm-saffron); margin-bottom:4px;">⚡ SIGNATURE MECHANIC: FOCUS MODE</h4>
          <p>Collect <strong>3 Idea Sparks</strong> during a run to activate <strong>Focus Mode</strong> for 5.5 seconds! Enjoy 3x score multiplier and blazing neon aura.</p>
        </div>
        <div>
          <h4 style="color:var(--coral-accent); margin-bottom:4px;">🛡️ POWER-UPS</h4>
          <p><strong>Notebook Shield:</strong> Absorbs 1 hit without dying!<br>
          <strong>Code Magnet:</strong> Attracts all nearby Byte Coins for 10s.<br>
          <strong>Sprint Boost:</strong> 6s hyper-speed rush destroying obstacles!</p>
        </div>
      </div>
    `;

    this.openModal('❓ How to Play', html);
  }

  // 6. Settings Modal
  public openSettingsModal(): void {
    const touchEnabled = storage.getTouchControls();
    const musicMuted = soundManager.musicMuted;
    const sfxMuted = soundManager.sfxMuted;

    const html = `
      <div style="display:flex; flex-direction:column; gap:16px;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <label style="font-weight:700;">🎵 Background Music</label>
          <button id="toggle-music" class="btn-secondary-action" style="padding:6px 14px;">${musicMuted ? 'UNMUTE' : 'MUTE'}</button>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <label style="font-weight:700;">🔊 Sound Effects (SFX)</label>
          <button id="toggle-sfx" class="btn-secondary-action" style="padding:6px 14px;">${sfxMuted ? 'UNMUTE' : 'MUTE'}</button>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <label style="font-weight:700;">🕹️ On-Screen Touch D-Pad</label>
          <button id="toggle-touch" class="btn-secondary-action" style="padding:6px 14px;">${touchEnabled ? 'ENABLED' : 'DISABLED'}</button>
        </div>
        <hr style="border:0; border-top:1px solid rgba(255,255,255,0.1);">
        <div>
          <button id="btn-reset-data" style="background:rgba(239,68,68,0.2); border:1px solid #EF4444; color:#FCA5A5; padding:8px 16px; border-radius:10px; font-weight:800; cursor:pointer; width:100%;">
            🗑️ RESET LOCAL DATA
          </button>
        </div>
      </div>
    `;

    this.openModal('⚙️ Game Settings', html);

    this.modalBody.querySelector('#toggle-music')!.addEventListener('click', () => {
      soundManager.toggleMusicMute();
      this.openSettingsModal();
    });

    this.modalBody.querySelector('#toggle-sfx')!.addEventListener('click', () => {
      soundManager.toggleSfxMute();
      this.openSettingsModal();
    });

    this.modalBody.querySelector('#toggle-touch')!.addEventListener('click', () => {
      const next = !storage.getTouchControls();
      storage.setTouchControls(next);
      this.updateTouchControlsVisibility();
      this.openSettingsModal();
    });

    this.modalBody.querySelector('#btn-reset-data')!.addEventListener('click', () => {
      if (confirm('Are you sure you want to reset all high scores, coins, and unlocks?')) {
        storage.resetAllData();
        this.engine.setEquippedOutfit('demo_day');
        this.showToast('Local data has been reset.');
        this.closeModal();
        this.showMainMenu();
      }
    });
  }

  // 7. Pause Modal
  public openPauseModal(): void {
    this.engine.pause();

    const html = `
      <div style="text-align:center; font-size:1.1rem; color:rgba(255,255,255,0.7); margin-bottom:16px;">
        Game is paused. Take a breath and get ready to run!
      </div>
      <div style="display:flex; flex-direction:column; gap:12px;">
        <button id="btn-pause-resume" class="btn-primary-action">RESUME</button>
        <button id="btn-pause-restart" class="btn-secondary-action">RESTART RUN</button>
        <button id="btn-pause-menu" class="btn-secondary-action">MAIN MENU</button>
      </div>
    `;

    this.openModal('⏸ Paused', html);

    this.modalBody.querySelector('#btn-pause-resume')!.addEventListener('click', () => {
      this.closeModal();
      this.engine.resume();
    });

    this.modalBody.querySelector('#btn-pause-restart')!.addEventListener('click', () => {
      this.closeModal();
      this.startGame();
    });

    this.modalBody.querySelector('#btn-pause-menu')!.addEventListener('click', () => {
      this.closeModal();
      this.showMainMenu();
    });
  }

  private updateTouchControlsVisibility(): void {
    const isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0 || storage.getTouchControls();
    this.mobileControlsWrap.style.display = isTouch ? 'flex' : 'none';
  }

  private shareScore(): void {
    const score = (this.root.querySelector('#gameover-score-num') as HTMLElement).textContent || '0';
    const text = `Deepesh Dash Campus Rush — I scored ${score} points! Can you beat my record?`;

    if (navigator.share) {
      navigator.share({
        title: 'Deepesh Dash: Campus Rush',
        text: text,
        url: window.location.href
      }).catch(() => {
        // Fallback
        this.copyToClipboard(text);
      });
    } else {
      this.copyToClipboard(text);
    }
  }

  private copyToClipboard(text: string): void {
    navigator.clipboard.writeText(text).then(() => {
      this.showToast('📋 Score copied to clipboard!');
    }).catch(() => {
      this.showToast('Could not copy score.');
    });
  }
}
