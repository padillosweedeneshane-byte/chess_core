// Shared Types for the 8-Bit Chess Arena

export type EngineType = "easy" | "gemma" | "gemini";
export type ConnectionMode = "proxy" | "direct";
export type PieceTheme = "classic" | "gameboy" | "cyber" | "wood";
export type BossType = "dark_emperor" | "pixel_dragon" | "rogue_glitch";

export interface GameSettings {
  engineType: EngineType;
  connectionMode: ConnectionMode;
  lmStudioUrl: string;
  lmStudioModel: string;
  pieceTheme: PieceTheme;
  bossType: BossType;
  soundsEnabled: boolean;
}

export interface ChatMessage {
  id: string;
  sender: "boss" | "player" | "referee";
  text: string;
  timestamp: string;
}
