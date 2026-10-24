/**
 * CAMPUS RUSH - Main Application Entrypoint
 */
import './styles/main.css';
import { GameEngine } from './game/GameEngine';
import { UIManager } from './ui/UIManager';
import { soundManager } from './audio/SoundSynthesizer';

window.addEventListener('DOMContentLoaded', () => {
  const canvasContainer = document.getElementById('canvas-container');
  const uiRoot = document.getElementById('ui-root');

  if (!canvasContainer || !uiRoot) {
    console.error('DOM containers not found');
    return;
  }

  // 1. Initialize Game Engine & UI Coordinator
  const engine = new GameEngine(canvasContainer);
  const ui = new UIManager(engine, uiRoot);

  // 2. Audio gesture unlock
  const unlockAudio = () => {
    soundManager.init();
    window.removeEventListener('pointerdown', unlockAudio);
    window.removeEventListener('keydown', unlockAudio);
  };
  window.addEventListener('pointerdown', unlockAudio, { passive: true });
  window.addEventListener('keydown', unlockAudio, { passive: true });

  // 3. Desktop Keyboard Controls
  window.addEventListener('keydown', (e) => {
    // Prevent accidental page scrolling on arrow keys & space
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
      e.preventDefault();
    }

    switch (e.key) {
      case 'ArrowLeft':
      case 'a':
      case 'A':
        engine.handleLeft();
        break;

      case 'ArrowRight':
      case 'd':
      case 'D':
        engine.handleRight();
        break;

      case 'ArrowUp':
      case 'w':
      case 'W':
      case ' ':
        engine.handleJump();
        break;

      case 'ArrowDown':
      case 's':
      case 'S':
        engine.handleSlide();
        break;

      case 'Escape':
      case 'p':
      case 'P':
        if (engine.state === 'PLAYING') {
          ui.openPauseModal();
        } else if (engine.state === 'PAUSED') {
          ui.closePauseModal();
          engine.resume();
        }
        break;
    }
  });

  // 4. Mobile Swipe Gestures
  let touchStartX = 0;
  let touchStartY = 0;
  let touchStartTime = 0;
  let touchStartedOnUI = false;

  window.addEventListener(
    'touchstart',
    (e) => {
      if (e.touches.length === 1) {
        const target = e.target as HTMLElement | null;
        touchStartedOnUI = Boolean(
          target && (target.closest('button') || target.closest('.interactive') || target.closest('.modal-card'))
        );
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        touchStartTime = performance.now();
      }
    },
    { passive: true }
  );

  window.addEventListener(
    'touchmove',
    (e) => {
      // Prevent browser pull-to-refresh and page scroll while playing
      if (engine.state === 'PLAYING' && !touchStartedOnUI) {
        if (e.cancelable) e.preventDefault();
      }
    },
    { passive: false }
  );

  window.addEventListener(
    'touchend',
    (e) => {
      if (engine.state !== 'PLAYING' || touchStartedOnUI) return;

      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const dx = touchEndX - touchStartX;
      const dy = touchEndY - touchStartY;
      const dt = performance.now() - touchStartTime;

      const absX = Math.abs(dx);
      const absY = Math.abs(dy);

      // Swipe threshold: at least 28px within 600ms
      if (dt < 600 && (absX > 28 || absY > 28)) {
        if (absX > absY) {
          // Horizontal swipe
          if (dx < 0) {
            engine.handleLeft();
          } else {
            engine.handleRight();
          }
        } else {
          // Vertical swipe
          if (dy < 0) {
            engine.handleJump();
          } else {
            engine.handleSlide();
          }
        }
      }
    },
    { passive: true }
  );

  // 5. Register Offline PWA Service Worker
  if ('serviceWorker' in navigator && (window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    navigator.serviceWorker
      .register('./sw.js')
      .then((reg) => {
        console.log('Campus Rush ServiceWorker registered:', reg.scope);
      })
      .catch((err) => {
        console.warn('ServiceWorker registration error:', err);
      });
  }
});
