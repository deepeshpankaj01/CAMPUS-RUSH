/**
 * Deepesh Dash: Campus Rush - Pass & Play Local Multiplayer Mode
 */

export interface PassPlayer {
  id: number;
  name: string;
  hasPlayed: boolean;
  score: number;
  distance: number;
  coins: number;
}

export class PassAndPlayManager {
  public isActive: boolean = false;
  public players: PassPlayer[] = [];
  public currentTurnIndex: number = 0;

  public setupSession(playerNames: string[]): void {
    this.isActive = true;
    this.currentTurnIndex = 0;
    this.players = playerNames.map((name, idx) => ({
      id: idx + 1,
      name: name.trim() || `Player ${idx + 1}`,
      hasPlayed: false,
      score: 0,
      distance: 0,
      coins: 0
    }));
  }

  public getCurrentPlayer(): PassPlayer | null {
    if (!this.isActive || this.currentTurnIndex >= this.players.length) return null;
    return this.players[this.currentTurnIndex];
  }

  public recordCurrentRun(score: number, distance: number, coins: number): void {
    if (!this.isActive) return;
    const player = this.getCurrentPlayer();
    if (player) {
      player.hasPlayed = true;
      player.score = score;
      player.distance = Math.round(distance);
      player.coins = coins;
    }
  }

  public advanceTurn(): boolean {
    this.currentTurnIndex++;
    return this.currentTurnIndex < this.players.length;
  }

  public isMatchComplete(): boolean {
    return this.currentTurnIndex >= this.players.length;
  }

  public getRankedPlayers(): PassPlayer[] {
    return [...this.players].sort((a, b) => b.score - a.score);
  }

  public getWinner(): PassPlayer | null {
    const ranked = this.getRankedPlayers();
    return ranked.length > 0 ? ranked[0] : null;
  }

  public endSession(): void {
    this.isActive = false;
    this.players = [];
    this.currentTurnIndex = 0;
  }
}

export const passAndPlay = new PassAndPlayManager();
