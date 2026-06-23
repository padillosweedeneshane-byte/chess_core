import React from "react";

// 12x12 Pixel Art Matrix definitions for Chess Pieces
// '.' = Transparent
// 'o' = Outline / Border (Black)
// 'X' = Primary color (Light/Dark main)
// '#' = Secondary color (Shading/Highlights)

const PIECE_MATRICES: Record<string, string[]> = {
  p: [
    "............",
    "....oooo....",
    "...oXXX#o...",
    "...oXX##o...",
    "....oooo....",
    "....oXXo....",
    "...oXXXXo...",
    "..oXXXXX#o..",
    "..oXXXXX#o..",
    ".oXXXXXXX#o.",
    ".oXXXXXXX#o.",
    ".oooooooooo."
  ],
  r: [
    ".o.o.oo.o.o.",
    ".oXoXooXoXo.",
    ".oXXXXXXX#o.",
    ".oooooooooo.",
    "..oXXXXX#o..",
    "..oXX..X#o..",
    "..oXX..X#o..",
    "..oXXXXX#o..",
    ".oXXXXXXX#o.",
    ".oXXXXXXX#o.",
    ".oXXXXXXX#o.",
    ".oooooooooo."
  ],
  n: [
    "....oooo....",
    "...oXXXXo...",
    "..oXX..X#o..",
    ".oXX.o.X.#o.",
    ".oX.oo..X.o.",
    "..o.oo.X#o..",
    "....oXXXXo..",
    "...oXXXXXo..",
    "..oXXXXXXo..",
    ".oXXXXXXX#o.",
    ".oXXXXXXX#o.",
    ".oooooooooo."
  ],
  b: [
    "....oo......",
    "...oXXo.....",
    "...oXXo.....",
    "....oo......",
    "...oXXo.....",
    "..oXXXXo....",
    ".oXXoXoX#o..",
    ".oXX.o.X#o..",
    ".oXXXXXX#o..",
    "..oXXXX#o...",
    ".oXXXXXXX#o.",
    ".oooooooooo."
  ],
  q: [
    ".o...oo...o.",
    ".oX.oXXo.Xo.",
    ".oXXXXXXX#o.",
    ".oooooooooo.",
    "..oXXXXX#o..",
    ".oXXXXXXX#o.",
    ".oX.XXX.#Xo.",
    ".oXXXXXXX#o.",
    "..oXXXXX#o..",
    ".oXXXXXXX#o.",
    ".oXXXXXXX#o.",
    ".oooooooooo."
  ],
  k: [
    "....oo......",
    "...oXXo.....",
    ".ooXXXXoo...",
    ".oXXXXXXo...",
    "..oXXXXo....",
    ".oXXXXXXXo..",
    ".oXXoXXoX#o.",
    ".oXXXXXXX#o.",
    "..oXXXXX#o..",
    ".oXXXXXXX#o.",
    ".oXXXXXXX#o.",
    ".oooooooooo."
  ]
};

interface PixelChessPieceProps {
  type: string; // 'p' | 'r' | 'n' | 'b' | 'q' | 'k'
  color: string; // 'w' | 'b'
  theme?: string; // 'gameboy' | 'classic' | 'cyber' | 'wood'
  size?: number; // width & height in px
}

export const PixelChessPiece: React.FC<PixelChessPieceProps> = ({
  type,
  color,
  theme = "classic",
  size = 48
}) => {
  const normType = type.toLowerCase();
  const matrix = PIECE_MATRICES[normType] || PIECE_MATRICES.p;

  // Palette definitions based on retro style theme
  let colors = {
    bg: "transparent",
    outline: "#000000",
    primary: "#ffffff",
    secondary: "#cbd5e1"
  };

  if (theme === "classic") {
    colors.outline = "#000000";
    if (color === "w") {
      colors.primary = "#FBF9F4"; // Elegant Ivory Bone white
      colors.secondary = "#D5CDBC"; // Cream shadow
    } else {
      colors.primary = "#2E2A27"; // Realistic Matte Walnut/Coal black
      colors.secondary = "#110F0E"; // Deepest onyx shadow
    }
  } else if (theme === "gameboy") {
    // Olive / Green gameboy shades
    if (color === "w") {
      colors.primary = "#E0F8D8";
      colors.secondary = "#9BBC0F";
    } else {
      colors.primary = "#306230";
      colors.secondary = "#0F380F";
    }
  } else if (theme === "cyber") {
    // Synthwave / Cyber neon outline theme
    if (color === "w") {
      colors.primary = "#00FFFF"; // Electric Cyan
      colors.secondary = "#008B8B";
    } else {
      colors.primary = "#FF00FF"; // Hot Magenta
      colors.secondary = "#8B008B";
    }
  } else if (theme === "wood") {
    // cozy pixel woods
    if (color === "w") {
      colors.primary = "#FDE8CD";
      colors.secondary = "#E1AC74";
    } else {
      colors.primary = "#6F4E37"; // Coffee Brown
      colors.secondary = "#3B271A";
    }
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 12 12"
      style={{ imageRendering: "pixelated" }}
      className="select-none pointer-events-none drop-shadow-sm filter transition-transform duration-200"
    >
      {matrix.map((row, rIdx) => {
        return row.split("").map((pixel, cIdx) => {
          let fill: string | null = null;
          if (pixel === "o") fill = colors.outline;
          else if (pixel === "X") fill = colors.primary;
          else if (pixel === "#") fill = colors.secondary;

          if (!fill) return null;

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
  );
};
