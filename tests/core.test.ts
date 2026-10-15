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
import { PassAndPlayManager } from '../src/systems/PassAndPlay.ts';
import { MissionManager, MISSIONS_LIST } from '../src/systems/Missions.ts';
import { GAME_CONFIG, LANES, OUTFITS } from '../src/game/Constants.ts';

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

test('StorageManager Operations & Persistence', () => {
  const storage = new StorageManager();
  storage.resetAllData();

  assert.equal(storage.getHighScore(), 0, 'Initial high score should be 0');
  assert.equal(storage.getCoins(), 0, 'Initial coins should be 0');
  assert.equal(storage.getEquippedOutfit(), 'demo_day', 'Default outfit should be demo_day');

  // Add coins
  storage.addCoins(150);
  assert.equal(storage.getCoins(), 150, 'Coins should increase to 150');

  // Spend coins
  const spent = storage.spendCoins(100);
  assert.equal(spent, true, 'Spend 100 should succeed');
  assert.equal(storage.getCoins(), 50, 'Remaining coins should be 50');

  const failedSpend = storage.spendCoins(500);
  assert.equal(failedSpend, false, 'Overspending should return false');
  assert.equal(storage.getCoins(), 50, 'Coins unchanged after failed spend');

  // Outfit unlock & equipping
  assert.equal(storage.isOutfitUnlocked('bhopal_lake'), false);
  storage.unlockOutfit('bhopal_lake');
  assert.equal(storage.isOutfitUnlocked('bhopal_lake'), true);
  storage.setEquippedOutfit('bhopal_lake');
  assert.equal(storage.getEquippedOutfit(), 'bhopal_lake');

  // Run recording & Local Leaderboard
  const res1 = storage.recordRun(8500, 520, 35);
  assert.equal(res1.isNewHighScore, true, 'First run is new high score');
  assert.equal(storage.getHighScore(), 8500);

  const res2 = storage.recordRun(4200, 310, 20);
  assert.equal(res2.isNewHighScore, false, 'Lesser score is not high score');
  assert.equal(storage.getHighScore(), 8500);

  const board = storage.getLeaderboard();
  assert.ok(board.length >= 2, 'Leaderboard contains recorded runs');
  // Check descending sort
  for (let i = 0; i < board.length - 1; i++) {
    assert.ok(board[i].score >= board[i + 1].score, 'Leaderboard must be sorted descending');
  }
});

test('Pass & Play Local Multiplayer Tournament Flow', () => {
  const pp = new PassAndPlayManager();
  pp.setupSession(['Deepesh', 'Aarav', 'Pooja']);

  assert.equal(pp.isActive, true);
  assert.equal(pp.players.length, 3);
  assert.equal(pp.currentTurnIndex, 0);

  // Turn 1: Deepesh
  const p1 = pp.getCurrentPlayer();
  assert.equal(p1?.name, 'Deepesh');
  pp.recordCurrentRun(12000, 750, 48);

  const next1 = pp.advanceTurn();
  assert.equal(next1, true, 'Should have next player');
  assert.equal(pp.currentTurnIndex, 1);

  // Turn 2: Aarav
  const p2 = pp.getCurrentPlayer();
  assert.equal(p2?.name, 'Aarav');
  pp.recordCurrentRun(14500, 890, 62);

  const next2 = pp.advanceTurn();
  assert.equal(next2, true, 'Should have 3rd player');

  // Turn 3: Pooja
  const p3 = pp.getCurrentPlayer();
  assert.equal(p3?.name, 'Pooja');
  pp.recordCurrentRun(9800, 610, 33);

  const next3 = pp.advanceTurn();
  assert.equal(next3, false, 'Match should complete after 3 players');
  assert.equal(pp.isMatchComplete(), true);

  // Check winner
  const winner = pp.getWinner();
  assert.equal(winner?.name, 'Aarav', 'Aarav should be winner with highest score 14500');

  const ranked = pp.getRankedPlayers();
  assert.equal(ranked[0].name, 'Aarav');
  assert.equal(ranked[1].name, 'Deepesh');
  assert.equal(ranked[2].name, 'Pooja');

  pp.endSession();
  assert.equal(pp.isActive, false);
});

test('Missions System Tracking & Rewards', () => {
  const missions = new MissionManager();
  missions.resetRun();

  assert.ok(MISSIONS_LIST.length >= 5, 'Must contain at least 5 missions');

  let completedEventCount = 0;
  missions.onMissionCompletedCallback = () => {
    completedEventCount++;
  };

  // Simulate collecting coins
  for (let c = 0; c < 25; c++) {
    missions.recordCoin();
  }

  // Simulate jumps
  for (let j = 0; j < 8; j++) {
    missions.recordJump();
  }

  // Simulate Focus mode
  missions.recordFocusMode();

  assert.ok(completedEventCount >= 2, 'Should have triggered mission completed events');
});
