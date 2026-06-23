import React from "react";
import { BossType } from "../types";

// 16x16 Boss Avatar pixel matrices
// '.' = Transparent
// 'o' = Outline / Dark shading (black)
// Characters represent colors depending on the boss.

const BOSS_MATRICES: Record<BossType, string[]> = {
  dark_emperor: [
    "....oooooo......",
    "...oYYYYYYo.....",
    "..oY.Y.Y.Yo.....",
    "..oYYYYYYYo.....",
    "...oVVVVVo......",
    "..oVVVVVVVo.....",
    ".oVVowWwoVVo....",
    ".oVVowWwoVVo....",
    "oVVVVwwVVVVo....",
    "oVVVowWovVVV....",
    "oVVVVwwVVVVV....",
    "oVVVoooooVVV....",
    ".oVVVVVVVVVo....",
    "..oVVVVVVVo.....",
    "...ooooooo......",
    "................"
  ],
  pixel_dragon: [
    "......oooo......",
    "....ooRRRRo......",
    "...oRRRRRRRo....",
    "..oRRRRRooRRo...",
    "..oRRRRg..gRo...",
    ".oRRRRRoo..Ro...",
    "oRRRRoRoooRRo...",
    "oRRRooRRRRRRo...",
    "oRRo..oRRRRo....",
    "oRo....oooo.....",
    "oo....ooYYo.....",
    "......oYYYo.....",
    ".....oYYYYo.....",
    ".....oYYYoo.....",
    "......ooo.......",
    "................"
  ],
  rogue_glitch: [
    "oooooooooooooo..",
    "oCCCCGGCGGCCCoo.",
    "oC..........C.o.",
    "oC.X.XXXX.X.C.o.",
    "oC.X.X..X.X.C.o.",
    "oC.X.X..X.X.C.o.",
    "oC.X.XXXX.X.C.o.",
    "oC..........C.o.",
    "oC...X..X...C.o.",
    "oC....XX....C.o.",
    "oC..........C.o.",
    "oCCCCCCCCCCCC.o.",
    "ooooooooooooo.o.",
    "...oCCCCCCo..o.",
    "..oCCCCCCCCo...",
    "..oooooooooo..."
  ]
};

// Colors lookup for Bosses
const getBossPalette = (boss: BossType) => {
  switch (boss) {
    case "dark_emperor":
      return {
        ".": "transparent",
        "o": "#000000",
        "Y": "#facc15", // Gold crown
        "V": "#581c87", // Purple armor/helmet
        "w": "#fef08a", // Pale yellow face
        "W": "#ffffff"  // White glints
      };
    case "pixel_dragon":
      return {
        ".": "transparent",
        "o": "#000000",
        "R": "#ef4444", // Fire Red scales
        "g": "#22c55e", // Toxic green eyes
        "Y": "#f97316", // Orange flame gasps
        "F": "#eab308"  // Fire sparks
      };
    case "rogue_glitch":
      return {
        ".": "transparent",
        "o": "#000000",
        "C": "#475569", // Computer casing
        "G": "#ec4899", // Glitched pink light
        "X": "#22c55e", // Retro green pixel face
      };
  }
};

interface BossAvatarProps {
  boss: BossType;
  isTalking?: boolean;
  size?: number;
}

export const BossAvatar: React.FC<BossAvatarProps> = ({
  boss,
  isTalking = false,
  size = 80
}) => {
  const matrix = BOSS_MATRICES[boss];
  const palette: Record<string, string> = getBossPalette(boss);

  return (
    <div
      className={`relative inline-block overflow-hidden p-1 border-4 border-black bg-slate-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${
        isTalking ? "animate-bounce" : ""
      }`}
      style={{
        width: size + 8,
        height: size + 8,
        animationDuration: isTalking ? "0.4s" : "0s",
        imageRendering: "pixelated"
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 16 16"
        style={{ imageRendering: "pixelated" }}
      >
        {matrix.map((row, rIdx) => {
          return row.split("").map((pixel, cIdx) => {
            const fill = palette[pixel] || "transparent";
            if (fill === "transparent") return null;

            return (
              <rect
                key={`${rIdx}-${cIdx}`}
                x={cIdx}
                y={rIdx}
                width={1}
                height={1}
                fill={fill}
                shapeRendering="crispEdges"
              />
            );
          });
        })}
      </svg>
      {/* Glitch Overlay effect for Rogue robo boss */}
      {boss === "rogue_glitch" && isTalking && (
        <div className="absolute inset-0 bg-red-500/10 pointer-events-none mix-blend-color-dodge animate-pulse" />
      )}
    </div>
  );
};
