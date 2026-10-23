import test from 'node:test';
import assert from 'node:assert/strict';

// Ensure localStorage mock is present for node environment
if (typeof globalThis.localStorage === 'undefined') {
  const store = new Map<string, string>();
  (globalThis as unknown as { localStorage: Storage }).localStorage = {
    getItem: (key: string) => store.get(key) || null,
    setItem: (key: string, val: string) => store.set(key, val.toString()),
    removeItem: (key: string) => store.delete(key),
    clear: () => store.clear(),
    key: (idx: number) => Array.from(store.keys())[idx] || null,
    length: store.size
  };
}

import { StorageManager } from '../src/systems/Storage.ts';
import { GAME_CONFIG, LANES, OUTFITS, getStageInfo } from '../src/game/Constants.ts';

test('Game Constants Verification', () => {
  assert.equal(LANES.length, 3, 'Should have exactly 3 lanes');
  assert.equal(LANES[0], -3.2, 'Left lane coordinate');
  assert.equal(LANES[1], 0, 'Center lane coordinate');
  assert.equal(LANES[2], 3.2, 'Right lane coordinate');

  assert.ok(GAME_CONFIG.initialSpeed >= 20, 'Initial speed is accessible and responsive');
  assert.ok(GAME_CONFIG.maxSpeed >= 50, 'Max speed provides high-velocity challenge');
  assert.equal(GAME_CONFIG.sparksForFocus, 3, '3 Sparks required to trigger Focus Mode');
  assert.equal(GAME_CONFIG.focusModeMultiplier, 3, 'Focus mode grants 3x multiplier');
  assert.equal(OUTFITS.length, 4, 'Includes 4 student outfits');
});

test('StorageManager Operations, Default State & Sanitization', () => {
  const storage = new StorageManager();
  storage.resetAllData();

  // 1. Initial State Requirements
  assert.equal(storage.getHighScore(), 0, 'Initial high score should be 0');
  assert.equal(storage.getCoins(), 0, 'Initial coins should be 0');
  assert.equal(storage.getPlayerName(), 'Runner', 'Default player name should be Runner');
  assert.deepEqual(storage.getLeaderboard(), [], 'Default leaderboard must be completely empty (no fake starter names)');
  assert.equal(storage.getEquippedOutfit(), 'demo_day', 'Default outfit should be demo_day');

  // 2. Coin Transactions
  storage.addCoins(150);
  assert.equal(storage.getCoins(), 150, 'Coins should increase to 150');

  const spent = storage.spendCoins(100);
  assert.equal(spent, true, 'Spend 100 should succeed');
  assert.equal(storage.getCoins(), 50, 'Remaining coins should be 50');

  const failedSpend = storage.spendCoins(500);
  assert.equal(failedSpend, false, 'Overspending should return false');
  assert.equal(storage.getCoins(), 50, 'Coins unchanged after failed spend');

  // 3. Outfit unlock & equipping
  assert.equal(storage.isOutfitUnlocked('bhopal_lake'), false);
  storage.unlockOutfit('bhopal_lake');
  assert.equal(storage.isOutfitUnlocked('bhopal_lake'), true);
  storage.setEquippedOutfit('bhopal_lake');
  assert.equal(storage.getEquippedOutfit(), 'bhopal_lake');

  // 4. Run Recording & Leaderboard Management
  const res1 = storage.recordRun(8500, 520, 35);
  assert.equal(res1.isNewHighScore, true, 'First run is new high score');
  assert.equal(storage.getHighScore(), 8500);

  const res2 = storage.recordRun(4200, 310, 20);
  assert.equal(res2.isNewHighScore, false, 'Lesser score is not high score');
  assert.equal(storage.getHighScore(), 8500);

  const board = storage.getLeaderboard();
  assert.equal(board.length, 2, 'Leaderboard contains recorded runs');
  assert.equal(board[0].score, 8500);
  assert.equal(board[1].score, 4200);

  // 5. Legacy Data Sanitization
  // Simulate old save file with legacy names
  globalThis.localStorage.setItem('deepesh_dash_save_v1', JSON.stringify({
    highScore: 12000,
    totalCoins: 250,
    playerName: 'Deepesh P',
    leaderboard: [
      { id: '1', name: 'Deepesh P', score: 25000, distance: 1800, date: '2025-01-01' }
    ]
  }));

  const sanitizedStorage = new StorageManager();
  // Legacy fake entries must have been wiped
  assert.deepEqual(sanitizedStorage.getLeaderboard(), [], 'Legacy starter leaderboard must be wiped on load');
  assert.equal(sanitizedStorage.getPlayerName(), 'Runner', 'Legacy name Deepesh P sanitized to Runner');
  assert.equal(sanitizedStorage.getHighScore(), 12000, 'Legitimate high score preserved');
});

test('Endless Stage Progression & Stage Info Calculations', () => {
  // Stage 1: 0 - 449m
  assert.deepEqual(getStageInfo(0), { stage: 1, name: 'Campus Morning', zone: 'CAMPUS_MORNING' });
  assert.deepEqual(getStageInfo(300), { stage: 1, name: 'Campus Morning', zone: 'CAMPUS_MORNING' });

  // Stage 2: 450 - 949m
  assert.deepEqual(getStageInfo(450), { stage: 2, name: 'Bhopal Lakefront', zone: 'BHOPAL_LAKEFRONT' });
  assert.deepEqual(getStageInfo(800), { stage: 2, name: 'Bhopal Lakefront', zone: 'BHOPAL_LAKEFRONT' });

  // Stage 3: 950 - 1499m
  assert.deepEqual(getStageInfo(950), { stage: 3, name: 'Market Rush', zone: 'MARKET_RUSH' });
  assert.deepEqual(getStageInfo(1400), { stage: 3, name: 'Market Rush', zone: 'MARKET_RUSH' });

  // Stage 4: 1500 - 2099m
  assert.deepEqual(getStageInfo(1500), { stage: 4, name: 'Neon City', zone: 'NEON_CODE_CITY' });
  assert.deepEqual(getStageInfo(2000), { stage: 4, name: 'Neon City', zone: 'NEON_CODE_CITY' });

  // Stage 5: 2100 - 2699m
  assert.deepEqual(getStageInfo(2100), { stage: 5, name: 'Festival Nights', zone: 'FESTIVAL_NIGHTS' });
  assert.deepEqual(getStageInfo(2650), { stage: 5, name: 'Festival Nights', zone: 'FESTIVAL_NIGHTS' });

  // Stage 6+: Endless continuation beyond 2700m (cycles every 550m)
  assert.equal(getStageInfo(2700).stage, 6, '2700m advances to Stage 6');
  assert.equal(getStageInfo(2700).zone, 'CAMPUS_MORNING', 'Stage 6 cycles back to zone 1');

  assert.equal(getStageInfo(3250).stage, 7, '3250m advances to Stage 7');
  assert.equal(getStageInfo(3250).zone, 'BHOPAL_LAKEFRONT', 'Stage 7 cycles to zone 2');

  assert.equal(getStageInfo(3800).stage, 8, '3800m advances to Stage 8');
  assert.equal(getStageInfo(3800).zone, 'MARKET_RUSH', 'Stage 8 cycles to zone 3');
});
