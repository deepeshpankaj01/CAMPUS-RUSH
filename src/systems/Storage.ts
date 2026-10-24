/**
 * CAMPUS RUSH - Local Data & State Persistence
 * Sanitized storage, no fake seeded personas, clean migration
 */

export interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
  distance: number;
  coins: number;
  date: string;
}

export interface PlayerSaveData {
  highScore: number;
  maxDistance: number;
  byteCoins: number;
  equippedOutfit: string;
  unlockedOutfits: string[];
  leaderboard: LeaderboardEntry[];
  completedMissions: string[];
  missionProgress: Record<string, number>;
  touchControls: boolean;
  playerName: string;
}

const STORAGE_KEY = 'campus_rush_save_v1';
const LEGACY_STORAGE_KEY = 'deepesh_dash_save_v1';

const FAKE_SAMPLE_NAMES = new Set(['Deepesh P', 'Deepesh', 'Aarav K', 'Pooja S', 'Vikram M', 'Ananya R']);

const DEFAULT_DATA: PlayerSaveData = {
  highScore: 0,
  maxDistance: 0,
  byteCoins: 0,
  equippedOutfit: 'demo_day',
  unlockedOutfits: ['demo_day'],
  leaderboard: [],
  completedMissions: [],
  missionProgress: {},
  touchControls: false,
  playerName: 'Runner'
};

export class StorageManager {
  private data: PlayerSaveData = { ...DEFAULT_DATA };

  constructor() {
    this.load();
  }

  public load(): PlayerSaveData {
    try {
      if (typeof localStorage !== 'undefined') {
        let raw = localStorage.getItem(STORAGE_KEY);
        let isLegacyMigration = false;

        if (!raw) {
          raw = localStorage.getItem(LEGACY_STORAGE_KEY);
          if (raw) isLegacyMigration = true;
        }

        if (raw) {
          const parsed = JSON.parse(raw);

          // Sanitize leaderboard (remove any legacy fake seeded records)
          const rawBoard: LeaderboardEntry[] = Array.isArray(parsed.leaderboard) ? parsed.leaderboard : [];
          const cleanBoard = rawBoard.filter(
            (entry) => entry && typeof entry.score === 'number' && !FAKE_SAMPLE_NAMES.has(entry.name)
          );

          // Sanitize player name
          let cleanPlayerName = typeof parsed.playerName === 'string' ? parsed.playerName.trim() : 'Runner';
          if (!cleanPlayerName || cleanPlayerName === 'Deepesh') {
            cleanPlayerName = 'Runner';
          }

          this.data = {
            ...DEFAULT_DATA,
            ...parsed,
            highScore: typeof parsed.highScore === 'number' && isFinite(parsed.highScore) ? parsed.highScore : 0,
            maxDistance: typeof parsed.maxDistance === 'number' && isFinite(parsed.maxDistance) ? parsed.maxDistance : 0,
            byteCoins: typeof parsed.byteCoins === 'number' && isFinite(parsed.byteCoins) ? parsed.byteCoins : 0,
            unlockedOutfits: Array.isArray(parsed.unlockedOutfits) ? parsed.unlockedOutfits : ['demo_day'],
            leaderboard: cleanBoard,
            completedMissions: Array.isArray(parsed.completedMissions) ? parsed.completedMissions : [],
            missionProgress: typeof parsed.missionProgress === 'object' && parsed.missionProgress ? parsed.missionProgress : {},
            playerName: cleanPlayerName
          };

          if (isLegacyMigration) {
            this.save();
          }

          return this.data;
        }
      }
      this.data = { ...DEFAULT_DATA };
      this.save();
    } catch (e) {
      console.warn('Could not read localStorage, using defaults:', e);
      this.data = { ...DEFAULT_DATA };
    }
    return this.data;
  }

  public save(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
      }
    } catch (e) {
      console.warn('Could not save to localStorage:', e);
    }
  }

  public getData(): PlayerSaveData {
    return this.data;
  }

  public getHighScore(): number {
    return this.data.highScore;
  }

  public getMaxDistance(): number {
    return this.data.maxDistance;
  }

  public getCoins(): number {
    return this.data.byteCoins;
  }

  public addCoins(amount: number): number {
    this.data.byteCoins += amount;
    this.save();
    return this.data.byteCoins;
  }

  public spendCoins(amount: number): boolean {
    if (this.data.byteCoins >= amount) {
      this.data.byteCoins -= amount;
      this.save();
      return true;
    }
    return false;
  }

  public isOutfitUnlocked(id: string): boolean {
    return this.data.unlockedOutfits.includes(id);
  }

  public unlockOutfit(id: string): void {
    if (!this.data.unlockedOutfits.includes(id)) {
      this.data.unlockedOutfits.push(id);
      this.save();
    }
  }

  public setEquippedOutfit(id: string): void {
    if (this.isOutfitUnlocked(id)) {
      this.data.equippedOutfit = id;
      this.save();
    }
  }

  public getEquippedOutfit(): string {
    return this.data.equippedOutfit;
  }

  public setPlayerName(name: string): void {
    const clean = name.trim().slice(0, 14) || 'Runner';
    this.data.playerName = clean;
    this.save();
  }

  public getPlayerName(): string {
    return this.data.playerName || 'Runner';
  }

  public recordRun(score: number, distance: number, coins: number): { isNewHighScore: boolean; rank: number } {
    let isNewHighScore = false;
    if (score > this.data.highScore) {
      this.data.highScore = score;
      isNewHighScore = true;
    }
    if (distance > this.data.maxDistance) {
      this.data.maxDistance = distance;
    }

    this.data.byteCoins += coins;

    // Add to personal leaderboard
    const newEntry: LeaderboardEntry = {
      id: Date.now().toString(),
      name: this.getPlayerName(),
      score,
      distance: Math.round(distance),
      coins,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    };

    this.data.leaderboard.push(newEntry);
    this.data.leaderboard.sort((a, b) => b.score - a.score);
    this.data.leaderboard = this.data.leaderboard.slice(0, 10); // Keep top 10

    const rank = this.data.leaderboard.findIndex((entry) => entry.id === newEntry.id) + 1;

    this.save();
    return { isNewHighScore, rank: rank > 0 ? rank : 1 };
  }

  public getLeaderboard(): LeaderboardEntry[] {
    return this.data.leaderboard;
  }

  public setTouchControls(enabled: boolean): void {
    this.data.touchControls = enabled;
    this.save();
  }

  public getTouchControls(): boolean {
    return this.data.touchControls;
  }

  public completeMission(id: string): void {
    if (!this.data.completedMissions.includes(id)) {
      this.data.completedMissions.push(id);
      this.save();
    }
  }

  public isMissionCompleted(id: string): boolean {
    return this.data.completedMissions.includes(id);
  }

  public getMissionProgress(id: string): number {
    return this.data.missionProgress[id] || 0;
  }

  public updateMissionProgress(id: string, val: number): void {
    this.data.missionProgress[id] = Math.max(this.data.missionProgress[id] || 0, val);
    this.save();
  }

  public resetAllData(): void {
    this.data = { ...DEFAULT_DATA };
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(LEGACY_STORAGE_KEY);
        localStorage.removeItem('dd_music_vol');
        localStorage.removeItem('dd_sfx_vol');
        localStorage.removeItem('dd_music_mute');
        localStorage.removeItem('dd_sfx_mute');
      }
    } catch (e) {
      console.warn(e);
    }
    this.save();
  }
}

export const storage = new StorageManager();
