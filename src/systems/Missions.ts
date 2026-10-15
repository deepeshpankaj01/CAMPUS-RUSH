/**
 * Deepesh Dash: Campus Rush - Missions System
 */
import { storage } from './Storage.ts';
import { soundManager } from '../audio/SoundSynthesizer.ts';

export interface Mission {
  id: string;
  title: string;
  description: string;
  target: number;
  rewardCoins: number;
  type: 'distance_single' | 'coins_single' | 'jumps' | 'slides' | 'focus_mode' | 'shield' | 'magnet_coins' | 'distance_total';
}

export const MISSIONS_LIST: Mission[] = [
  {
    id: 'm1_sprinter',
    title: 'Campus Sprinter',
    description: 'Reach 300 meters in a single run.',
    target: 300,
    rewardCoins: 30,
    type: 'distance_single'
  },
  {
    id: 'm2_coins',
    title: 'Byte Coin Rush',
    description: 'Collect 25 Byte Coins in one run.',
    target: 25,
    rewardCoins: 40,
    type: 'coins_single'
  },
  {
    id: 'm3_jumper',
    title: 'High Vaulter',
    description: 'Jump over 8 obstacles in your runs.',
    target: 8,
    rewardCoins: 35,
    type: 'jumps'
  },
  {
    id: 'm4_slider',
    title: 'Limbo Master',
    description: 'Slide under 4 overhead campus banners.',
    target: 4,
    rewardCoins: 35,
    type: 'slides'
  },
  {
    id: 'm5_focus',
    title: 'Spark of Genius',
    description: 'Collect 3 Idea Sparks and trigger Focus Mode.',
    target: 1,
    rewardCoins: 50,
    type: 'focus_mode'
  },
  {
    id: 'm6_shield',
    title: 'Code Armor',
    description: 'Pick up a Notebook Shield during a run.',
    target: 1,
    rewardCoins: 25,
    type: 'shield'
  },
  {
    id: 'm7_legend',
    title: 'Campus Legend',
    description: 'Travel a total of 1000 meters in a single run.',
    target: 1000,
    rewardCoins: 100,
    type: 'distance_single'
  },
  {
    id: 'm8_magnet',
    title: 'Data Harvester',
    description: 'Collect 30 Byte Coins while Magnet is active.',
    target: 30,
    rewardCoins: 45,
    type: 'magnet_coins'
  }
];

export class MissionManager {
  private activeSingleRunStats = {
    distance: 0,
    coins: 0,
    jumps: 0,
    slides: 0,
    focusTriggered: 0,
    shieldPicked: 0,
    magnetCoins: 0
  };

  public onMissionCompletedCallback: ((mission: Mission) => void) | null = null;

  public resetRun(): void {
    this.activeSingleRunStats = {
      distance: 0,
      coins: 0,
      jumps: 0,
      slides: 0,
      focusTriggered: 0,
      shieldPicked: 0,
      magnetCoins: 0
    };
  }

  public recordDistance(meters: number): void {
    this.activeSingleRunStats.distance = meters;
    this.checkSingleMission('m1_sprinter', meters);
    this.checkSingleMission('m7_legend', meters);
  }

  public recordCoin(): void {
    this.activeSingleRunStats.coins++;
    this.checkSingleMission('m2_coins', this.activeSingleRunStats.coins);
  }

  public recordMagnetCoin(): void {
    this.activeSingleRunStats.magnetCoins++;
    const currentTotal = storage.getMissionProgress('m8_magnet') + 1;
    storage.updateMissionProgress('m8_magnet', currentTotal);
    this.checkCumulativeMission('m8_magnet', currentTotal);
  }

  public recordJump(): void {
    this.activeSingleRunStats.jumps++;
    const current = storage.getMissionProgress('m3_jumper') + 1;
    storage.updateMissionProgress('m3_jumper', current);
    this.checkCumulativeMission('m3_jumper', current);
  }

  public recordSlide(): void {
    this.activeSingleRunStats.slides++;
    const current = storage.getMissionProgress('m4_slider') + 1;
    storage.updateMissionProgress('m4_slider', current);
    this.checkCumulativeMission('m4_slider', current);
  }

  public recordFocusMode(): void {
    this.activeSingleRunStats.focusTriggered++;
    this.checkSingleMission('m5_focus', 1);
  }

  public recordShield(): void {
    this.activeSingleRunStats.shieldPicked++;
    this.checkSingleMission('m6_shield', 1);
  }

  private checkSingleMission(id: string, currentVal: number): void {
    if (storage.isMissionCompleted(id)) return;
    const mission = MISSIONS_LIST.find((m) => m.id === id);
    if (!mission) return;

    if (currentVal >= mission.target) {
      this.triggerComplete(mission);
    }
  }

  private checkCumulativeMission(id: string, currentVal: number): void {
    if (storage.isMissionCompleted(id)) return;
    const mission = MISSIONS_LIST.find((m) => m.id === id);
    if (!mission) return;

    if (currentVal >= mission.target) {
      this.triggerComplete(mission);
    }
  }

  private triggerComplete(mission: Mission): void {
    storage.completeMission(mission.id);
    storage.addCoins(mission.rewardCoins);
    soundManager.playMissionComplete();
    if (this.onMissionCompletedCallback) {
      this.onMissionCompletedCallback(mission);
    }
  }

  public getAllMissions(): { mission: Mission; completed: boolean; current: number }[] {
    return MISSIONS_LIST.map((m) => {
      const completed = storage.isMissionCompleted(m.id);
      let current = 0;
      if (completed) {
        current = m.target;
      } else if (m.type === 'jumps' || m.type === 'slides' || m.type === 'magnet_coins') {
        current = storage.getMissionProgress(m.id);
      } else {
        current = 0;
      }
      return { mission: m, completed, current: Math.min(m.target, current) };
    });
  }
}

export const missionManager = new MissionManager();
