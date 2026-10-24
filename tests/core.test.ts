import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';

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
import { EnvironmentManager } from '../src/game/Environment.ts';

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

test('StorageManager Operations & Clean Persistence', () => {
  const storage = new StorageManager();
  storage.resetAllData();

  assert.equal(storage.getHighScore(), 0, 'Initial high score should be 0');
  assert.equal(storage.getCoins(), 0, 'Initial coins should be 0');
  assert.equal(storage.getEquippedOutfit(), 'demo_day', 'Default outfit should be demo_day');
  assert.equal(storage.getPlayerName(), 'Runner', 'Default player name should be Runner');

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

  // Run recording & Clean Local Leaderboard
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

test('Legacy Storage Sanitization & Migration', () => {
  localStorage.clear();

  // Simulate legacy save data with personal names and seeded fake entries
  const legacyData = {
    highScore: 32000,
    maxDistance: 1450,
    byteCoins: 85,
    equippedOutfit: 'demo_day',
    unlockedOutfits: ['demo_day'],
    playerName: 'Deepesh',
    leaderboard: [
      { id: '1', name: 'Deepesh P', score: 12500, distance: 820, coins: 64, date: 'Campus Record' },
      { id: '2', name: 'Aarav K', score: 9200, distance: 640, coins: 45, date: 'Demo Day' },
      { id: 'custom', name: 'Runner', score: 32000, distance: 1450, coins: 85, date: 'Nov 1' }
    ]
  };

  localStorage.setItem('deepesh_dash_save_v1', JSON.stringify(legacyData));

  const migratedStorage = new StorageManager();
  assert.equal(migratedStorage.getHighScore(), 32000, 'Genuine high score must be preserved');
  assert.equal(migratedStorage.getMaxDistance(), 1450, 'Genuine max distance must be preserved');
  assert.equal(migratedStorage.getCoins(), 85, 'Genuine coin balance must be preserved');
  assert.equal(migratedStorage.getPlayerName(), 'Runner', 'Legacy personal name must be sanitized to Runner');

  // Seeded fake entries must be filtered out
  const board = migratedStorage.getLeaderboard();
  for (const entry of board) {
    assert.notEqual(entry.name, 'Deepesh P', 'Fake seeded names must be removed');
    assert.notEqual(entry.name, 'Aarav K', 'Fake seeded names must be removed');
  }

  // Modern storage key must now be populated
  assert.ok(localStorage.getItem('campus_rush_save_v1'), 'Must migrate to campus_rush_save_v1');
});

test('Road Segment Scene Graph & Recycling Bug Prevention', () => {
  const scene = new THREE.Scene();
  const mockRenderer = {
    setAtmosphereColors: () => {}
  } as any;

  const env = new EnvironmentManager(scene, mockRenderer);
  assert.equal(env.roadSegments.length, 10, 'Should initialize 10 road segments');

  const firstSeg = env.roadSegments[0];
  assert.ok(firstSeg.roadInfraGroup, 'Segment must have dedicated roadInfraGroup');
  assert.ok(firstSeg.sceneryGroup, 'Segment must have dedicated sceneryGroup');

  // Count permanent infrastructure children: road mesh, lane marks (approx 10-12), 2 curbs, 2 sidewalks
  const infraCountBefore = firstSeg.roadInfraGroup.children.length;
  assert.ok(infraCountBefore >= 12, 'Must have road surface, lane markings, curbs, and sidewalks');

  // Simulate multiple world updates causing segment recycling
  const dt = 0.05;
  const speed = 40; // 40 units/sec
  for (let step = 0; step < 200; step++) {
    env.update(speed, dt, step * speed * dt);
  }

  // Validate that roadInfraGroup in all segments was completely untouched by recycling!
  for (const seg of env.roadSegments) {
    assert.equal(
      seg.roadInfraGroup.children.length,
      infraCountBefore,
      'Road infrastructure (lane marks, curbs) must never be destroyed by recycling!'
    );
  }

  // Validate reset() preserves road infrastructure completely
  env.reset();
  for (const seg of env.roadSegments) {
    assert.equal(
      seg.roadInfraGroup.children.length,
      infraCountBefore,
      'Road infrastructure must remain 100% intact after reset()'
    );
  }
});

test('5-Zone Progression and Endless Modulo Loop', () => {
  const scene = new THREE.Scene();
  const mockRenderer = {
    setAtmosphereColors: () => {}
  } as any;

  const env = new EnvironmentManager(scene, mockRenderer);
  const dt = 0.01;

  // 1. Zone A: Campus Morning (0 - 450m)
  env.update(24, dt, 100);
  assert.equal(env.currentZone, 'CAMPUS_MORNING');

  // 2. Zone B: Lakefront (450 - 950m)
  env.update(24, dt, 500);
  assert.equal(env.currentZone, 'BHOPAL_LAKEFRONT');

  // 3. Zone C: Market Rush (950 - 1500m)
  env.update(24, dt, 1000);
  assert.equal(env.currentZone, 'MARKET_RUSH');

  // 4. Zone D: Neon Code City (1500 - 2100m)
  env.update(24, dt, 1600);
  assert.equal(env.currentZone, 'NEON_CODE_CITY');

  // 5. Zone E: Festival Nights (2100 - 2600m)
  env.update(24, dt, 2200);
  assert.equal(env.currentZone, 'FESTIVAL_NIGHTS');

  // 6. Endless Play: Beyond 2600m cycles back cleanly without crashing
  env.update(24, dt, 2700);
  assert.equal(env.currentZone, 'CAMPUS_MORNING', 'Should cycle back to Campus Morning endlessly');

  env.update(24, dt, 3200);
  assert.equal(env.currentZone, 'BHOPAL_LAKEFRONT', 'Should continue cycling through zones endlessly');
});

test('Pass & Play Local Multiplayer Tournament Flow', () => {
  const pp = new PassAndPlayManager();
  pp.setupSession(['Player 1', 'Player 2', 'Player 3']);

  assert.equal(pp.isActive, true);
  assert.equal(pp.players.length, 3);
  assert.equal(pp.currentTurnIndex, 0);

  // Turn 1
  const p1 = pp.getCurrentPlayer();
  assert.equal(p1?.name, 'Player 1');
  pp.recordCurrentRun(12000, 750, 48);

  const next1 = pp.advanceTurn();
  assert.equal(next1, true, 'Should have next player');
  assert.equal(pp.currentTurnIndex, 1);

  // Turn 2
  const p2 = pp.getCurrentPlayer();
  assert.equal(p2?.name, 'Player 2');
  pp.recordCurrentRun(14500, 890, 62);

  const next2 = pp.advanceTurn();
  assert.equal(next2, true, 'Should have 3rd player');

  // Turn 3
  const p3 = pp.getCurrentPlayer();
  assert.equal(p3?.name, 'Player 3');
  pp.recordCurrentRun(9800, 610, 33);

  const next3 = pp.advanceTurn();
  assert.equal(next3, false, 'Match should complete after 3 players');
  assert.equal(pp.isMatchComplete(), true);

  // Check winner
  const winner = pp.getWinner();
  assert.equal(winner?.name, 'Player 2', 'Player 2 should be winner with highest score 14500');

  const ranked = pp.getRankedPlayers();
  assert.equal(ranked[0].name, 'Player 2');
  assert.equal(ranked[1].name, 'Player 1');
  assert.equal(ranked[2].name, 'Player 3');

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
